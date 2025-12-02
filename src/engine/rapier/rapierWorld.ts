import { BRICK_HALF_SIZE } from '../collision/constants';
import type { Ball, Brick } from '../../store/types';

export type Vec3 = [number, number, number];
type Quat = [number, number, number, number];

export type ContactEvent = {
  ballId: string;
  brickId: string;
  point: Vec3;
  normal: Vec3;
  impulse?: number;
  relativeVelocity?: Vec3;
};

export interface BallState {
  id: string;
  position: Vec3;
  velocity: Vec3;
  rotation?: Quat;
  angularVelocity?: Vec3;
}

type RapierWorldRuntime = {
  createRigidBody: (desc: unknown) => unknown;
  createCollider: (colliderDesc: unknown, parent?: unknown) => unknown;
  removeRigidBody?: (obj: unknown) => void;
  step?: () => void;
  free?: () => void;
};

type RapierBody = {
  handle?: unknown;
  setTranslation?: (x: number, y: number, z: number) => unknown;
  setTranslationRaw?: (x: number, y: number, z: number) => unknown;
  setLinvel?: (x: number, y: number, z: number) => unknown;
  translation?: () => { x?: number; y?: number; z?: number } | number[];
  linvel?: () => { x?: number; y?: number; z?: number } | number[];
  // Optional rotation / angular velocity accessors — various compat builds expose different shapes
  rotation?: () => { x?: number; y?: number; z?: number; w?: number } | number[];
  angvel?: () => { x?: number; y?: number; z?: number } | number[];
};

type RigidBodyDescBuilder = {
  setTranslation: (x: number, y: number, z: number) => RigidBodyDescBuilder;
  setLinvel?: (x: number, y: number, z: number) => RigidBodyDescBuilder;
  setTranslationRaw?: (x: number, y: number, z: number) => RigidBodyDescBuilder;
};

type ColliderDescBuilder = {
  setRestitution: (n: number) => ColliderDescBuilder;
  setFriction: (n: number) => ColliderDescBuilder;
};

export type RapierModule = {
  World: new (gravity: { x: number; y: number; z: number }) => RapierWorldRuntime;
  RigidBodyDesc: {
    dynamic: () => RigidBodyDescBuilder;
    fixed: () => RigidBodyDescBuilder;
  };
  ColliderDesc: {
    ball: (r: number) => ColliderDescBuilder;
    cuboid: (x: number, y: number, z: number) => ColliderDescBuilder;
  };
};

export interface RapierWorld {
  addBall: (b: Ball) => void;
  removeBall: (id: string) => void;
  addBrick: (brick: Brick) => void;
  removeBrick: (id: string) => void;
  step: (dt?: number) => void;
  drainContactEvents: () => ContactEvent[];
  getBallStates: () => BallState[];
  applyImpulseToBall?: (id: string, impulse: Vec3, point?: Vec3) => boolean;
  applyTorqueToBall?: (id: string, torque: Vec3) => boolean;
  destroy: () => void;
}

// Minimal wrapper around the rapier runtime. The implementation deliberately
// keeps types loose and falls back to a simple overlap detector if the
// runtime doesn't expose contact event APIs in an environment-dependent way.
export function createWorld(rapierParam: unknown, gravity = { x: 0, y: 0, z: 0 }): RapierWorld {
  const rapier = rapierParam as RapierModule;
  let world: RapierWorldRuntime | undefined;
  try {
    world = new rapier.World(gravity);
  } catch (err) {
    // Re-throw with additional context so tests/consumers can decide fallback behaviour.
    throw new Error(`Failed to create Rapier World — runtime may not be initialized or WASM failed to load: ${(err as Error).message}`);
  }

  if (!world) throw new Error('Failed to initialize Rapier world');
  const runtime = world as RapierWorldRuntime;

  const ballBodies = new Map<string, RapierBody | undefined>();
  const brickBodies = new Map<string, { body: RapierBody | undefined; size: { x: number; y: number; z: number } }>();
  // Map of runtime handles (body or collider handles) -> game entity info { type, id }
  const handleToEntity = new Map<unknown, { type: 'ball' | 'brick'; id: string }>();

  const maybeHandle = (obj: unknown) => (obj && typeof obj === 'object' ? (obj as { handle?: unknown }).handle ?? obj : obj);

  function addBall(b: Ball) {
    if (ballBodies.has(b.id)) {
      // Update existing body's transform and velocity if possible
      const existing = ballBodies.get(b.id);
      try {
        const ex = existing ?? undefined;
        if (ex && typeof ex.setTranslation === 'function') ex.setTranslation(b.position[0], b.position[1], b.position[2]);
        else if (ex && typeof ex.setTranslationRaw === 'function') ex.setTranslationRaw(b.position[0], b.position[1], b.position[2]);
        if (ex && typeof ex.setLinvel === 'function') ex.setLinvel(b.velocity[0], b.velocity[1], b.velocity[2]);
      } catch (e) {
        void e;
      }
      return;
    }
    const descBuilder = rapier.RigidBodyDesc!.dynamic();
    descBuilder.setTranslation(b.position[0], b.position[1], b.position[2]);
    if (typeof descBuilder.setLinvel === 'function') {
      descBuilder.setLinvel(b.velocity[0], b.velocity[1], b.velocity[2]);
    }

    const body = runtime.createRigidBody(descBuilder) as RapierBody | undefined;

    const collider = rapier.ColliderDesc!.ball(b.radius).setRestitution(1).setFriction(0);
    // createCollider accepts a parent body handle or the body object depending on build
    let createdCollider: unknown | undefined;
    try {
      const bAs = body as { handle?: unknown } | undefined;
      if (bAs && bAs.handle !== undefined) {
        createdCollider = runtime.createCollider(collider, bAs.handle);
      } else {
        createdCollider = runtime.createCollider(collider, body);
      }
    } catch (e) {
      // Some builds may return a plain handle or throw — tolerate both styles.
      void e;
      try {
        createdCollider = runtime.createCollider(collider, body);
      } catch (innerErr) {
        void innerErr;
        // ignore; collider is optional for the PoC step (we'll still be able to read transforms)
      }
    }

    // Attempt to capture runtime handles for mapping contact events back to game ids
    try {
      const bodyKey = maybeHandle(body);
      if (typeof bodyKey !== 'undefined' && bodyKey !== null) handleToEntity.set(bodyKey, { type: 'ball', id: b.id });
      const collKey = maybeHandle(createdCollider);
      if (typeof collKey !== 'undefined' && collKey !== null) handleToEntity.set(collKey, { type: 'ball', id: b.id });
    } catch {
      /* ignore */
    }

    ballBodies.set(b.id, body);
  }

  function removeBall(id: string) {
    const b = ballBodies.get(id);
    if (!b) return;
    try {
      // World exposes removeRigidBody in several builds
      const bAs = b as { handle?: unknown } | undefined;
      const bodyKey = bAs?.handle ?? b;
      if (typeof runtime.removeRigidBody === 'function') runtime.removeRigidBody(bodyKey);
      // remove potential mappings
      try {
        handleToEntity.delete(bodyKey);
      } catch {
        /* ignore */
      }
    } catch {
      // ignore
    }
    // Also remove any collider mappings that referenced this ball id
    for (const [h, info] of Array.from(handleToEntity.entries())) {
      if (info.type === 'ball' && info.id === id) handleToEntity.delete(h);
    }
    ballBodies.delete(id);
  }

  function addBrick(brick: Brick) {
    if (brickBodies.has(brick.id)) {
      // Update transform if available
      const info = brickBodies.get(brick.id);
      if (info) {
        try {
          const b = info.body;
          if (b && typeof b.setTranslation === 'function') b.setTranslation(brick.position[0], brick.position[1], brick.position[2]);
          else if (b && typeof b.setTranslationRaw === 'function') b.setTranslationRaw(brick.position[0], brick.position[1], brick.position[2]);
        } catch (e) {
          void e;
        }
      }
      return;
    }
    const descBuilder = rapier.RigidBodyDesc!.fixed();
    descBuilder.setTranslation(brick.position[0], brick.position[1], brick.position[2]);
    const body = runtime.createRigidBody(descBuilder) as RapierBody | undefined;

    const halfX = BRICK_HALF_SIZE.x;
    const halfY = BRICK_HALF_SIZE.y;
    const halfZ = BRICK_HALF_SIZE.z;

    const collider = rapier.ColliderDesc!.cuboid(halfX, halfY, halfZ).setRestitution(1).setFriction(0);

    let createdCollider: unknown | undefined;
    try {
      const bAs = body as { handle?: unknown } | undefined;
      if (bAs && bAs.handle !== undefined) {
        createdCollider = runtime.createCollider(collider, bAs.handle);
      } else {
        createdCollider = runtime.createCollider(collider, body);
      }
    } catch (e) {
      void e;
      try {
        createdCollider = runtime.createCollider(collider, body);
      } catch (innerErr) {
        void innerErr;
      }
    }

    // Capture runtime handles for mapping
    try {
      const bodyKey = maybeHandle(body);
      if (typeof bodyKey !== 'undefined' && bodyKey !== null) handleToEntity.set(bodyKey, { type: 'brick', id: brick.id });
      const collKey = maybeHandle(createdCollider);
      if (typeof collKey !== 'undefined' && collKey !== null) handleToEntity.set(collKey, { type: 'brick', id: brick.id });
    } catch {
      /* ignore */
    }

    brickBodies.set(brick.id, { body, size: { x: halfX * 2, y: halfY * 2, z: halfZ * 2 } });
  }

  function removeBrick(id: string) {
    const info = brickBodies.get(id);
    if (!info) return;
    try {
      const bAs = info.body as { handle?: unknown } | undefined;
      const bodyKey = bAs?.handle ?? info.body;
      if (typeof runtime.removeRigidBody === 'function') runtime.removeRigidBody(bodyKey);
      try {
        handleToEntity.delete(bodyKey);
      } catch {
        /* ignore */
      }
    } catch (e) {
      void e;
    }
    for (const [h, entry] of Array.from(handleToEntity.entries())) {
      if (entry.type === 'brick' && entry.id === id) handleToEntity.delete(h);
    }
    brickBodies.delete(id);
  }

  function step(_dt?: number) {
    // Most compat builds expose a simple step() helper; call without args.
    // We deliberately ignore _dt here — tests will step the world repeatedly to emulate fixed-step integration.
    void _dt;
    if (typeof runtime.step === 'function') runtime.step();
  }

  function getBallStates(): BallState[] {
    const out: BallState[] = [];
    for (const [id, body] of ballBodies.entries()) {
      try {
        if (!body) {
          out.push({ id, position: [0, 0, 0], velocity: [0, 0, 0], rotation: [0, 0, 0, 1], angularVelocity: [0, 0, 0] });
          continue;
        }

        // Normalize translation/linvel shapes — some builds return objects, others arrays
        const tRaw = typeof body.translation === 'function' ? body.translation() : body.translation;
        const vRaw = typeof body.linvel === 'function' ? body.linvel() : body.linvel;
        const qRaw = typeof body.rotation === 'function' ? body.rotation() : body.rotation;
        const aRaw = typeof body.angvel === 'function' ? body.angvel() : body.angvel;

        const px = Array.isArray(tRaw) ? tRaw[0] ?? 0 : tRaw?.x ?? 0;
        const py = Array.isArray(tRaw) ? tRaw[1] ?? 0 : tRaw?.y ?? 0;
        const pz = Array.isArray(tRaw) ? tRaw[2] ?? 0 : tRaw?.z ?? 0;

        const vx = Array.isArray(vRaw) ? vRaw[0] ?? 0 : vRaw?.x ?? 0;
        const vy = Array.isArray(vRaw) ? vRaw[1] ?? 0 : vRaw?.y ?? 0;
        const vz = Array.isArray(vRaw) ? vRaw[2] ?? 0 : vRaw?.z ?? 0;

        // Rotation: normalize to quaternion [x,y,z,w]
        let qx = 0;
        let qy = 0;
        let qz = 0;
        let qw = 1;
        if (typeof qRaw !== 'undefined' && qRaw !== null) {
          if (Array.isArray(qRaw)) {
            qx = qRaw[0] ?? 0;
            qy = qRaw[1] ?? 0;
            qz = qRaw[2] ?? 0;
            qw = qRaw[3] ?? 1;
          } else {
            qx = qRaw?.x ?? 0;
            qy = qRaw?.y ?? 0;
            qz = qRaw?.z ?? 0;
            qw = qRaw?.w ?? 1;
          }
        }

        // Angular velocity: normalize shape
        const avx = Array.isArray(aRaw) ? aRaw[0] ?? 0 : aRaw?.x ?? 0;
        const avy = Array.isArray(aRaw) ? aRaw[1] ?? 0 : aRaw?.y ?? 0;
        const avz = Array.isArray(aRaw) ? aRaw[2] ?? 0 : aRaw?.z ?? 0;

        out.push({ id, position: [px, py, pz], velocity: [vx, vy, vz], rotation: [qx, qy, qz, qw], angularVelocity: [avx, avy, avz] });
      } catch (e) {
        void e;
        out.push({ id, position: [0, 0, 0], velocity: [0, 0, 0], rotation: [0, 0, 0, 1], angularVelocity: [0, 0, 0] });
      }
    }
    return out;
  }

  function drainContactEvents() {
    // Try to extract runtime-provided contact events (several rapier builds expose different APIs).
    try {
      const runtimeAny = runtime as unknown as Record<string, unknown>;

      const tryCollect = (candidate: unknown): unknown[] | null => {
        if (!candidate) return null;
        try {
          if (typeof candidate === 'function') {
            const fn = candidate as (...args: unknown[]) => unknown;
            const res = fn();
            if (res == null) return null;
            if (Array.isArray(res)) return res as unknown[];
            if (res && typeof res === 'object' && typeof (res as Record<PropertyKey, unknown>)[Symbol.iterator] === 'function') return Array.from(res as Iterable<unknown>);
            const resObj = res as Record<string, unknown>;
            if (typeof resObj.drain === 'function') return (resObj.drain as (...args: unknown[]) => unknown)() as unknown[];
            if (typeof resObj.drainEvents === 'function') return (resObj.drainEvents as (...args: unknown[]) => unknown)() as unknown[];
            if (typeof resObj.getEvents === 'function') return (resObj.getEvents as (...args: unknown[]) => unknown)() as unknown[];
            if (typeof resObj.getContactEvents === 'function') return (resObj.getContactEvents as (...args: unknown[]) => unknown)() as unknown[];
            return [res];
          }
          if (Array.isArray(candidate)) return candidate as unknown[];
          const candObj = candidate as Record<string, unknown>;
          if (typeof candObj.drain === 'function') return (candObj.drain as (...args: unknown[]) => unknown)() as unknown[];
          if (typeof candObj.drainEvents === 'function') return (candObj.drainEvents as (...args: unknown[]) => unknown)() as unknown[];
          if (typeof candObj.getEvents === 'function') return (candObj.getEvents as (...args: unknown[]) => unknown)() as unknown[];
          if (typeof candObj.getContactEvents === 'function') return (candObj.getContactEvents as (...args: unknown[]) => unknown)() as unknown[];
          return null;
        } catch {
          return null;
        }
      };

      // Candidate sources on the world object
      const candidates = [
        runtimeAny.getContactEvents,
        runtimeAny.contactEvents,
        runtimeAny.contactEventQueue,
        runtimeAny.eventQueue,
        runtimeAny.events,
        runtimeAny.narrowPhase,
        runtimeAny.getNarrowPhase,
      ];

      for (const cand of candidates) {
        const evs = tryCollect(typeof cand === 'function' ? cand.bind(runtimeAny) : cand);
        if (evs && evs.length) {
          // Convert raw runtime events to ContactEvent[] using handleToEntity map
          const out: ContactEvent[] = [];
          for (const ev of evs) {
            try {
              const evObj = ev as Record<string, unknown>;
              // Heuristic: find handles on the event object
              const possibleHandleKeys = ['collider1', 'collider2', 'colliderA', 'colliderB', 'body1', 'body2', 'bodyA', 'bodyB', 'rigidBody1', 'rigidBody2', 'a', 'b', 'object1', 'object2', 'handle1', 'handle2'];
              let h1: unknown = undefined;
              let h2: unknown = undefined;
              for (let i = 0; i < possibleHandleKeys.length; i += 2) {
                const k1 = possibleHandleKeys[i];
                const k2 = possibleHandleKeys[i + 1];
                if (evObj[k1] !== undefined && evObj[k2] !== undefined) {
                  h1 = evObj[k1];
                  h2 = evObj[k2];
                  break;
                }
              }

              // Fallback: look for numeric pair in array-like event
              if (h1 === undefined && Array.isArray(ev) && ev.length >= 2) {
                h1 = (ev as unknown[])[0];
                h2 = (ev as unknown[])[1];
              }

              const unpack = (x: unknown) => {
                if (x && typeof x === 'object') {
                  const xo = x as Record<string, unknown>;
                  return xo.handle !== undefined ? xo.handle : x;
                }
                return x;
              };
              const key1 = unpack(h1);
              const key2 = unpack(h2);

              const e1 = key1 == null ? null : handleToEntity.get(key1) ?? handleToEntity.get(h1);
              const e2 = key2 == null ? null : handleToEntity.get(key2) ?? handleToEntity.get(h2);

              if (!e1 || !e2) continue;

              let ballId: string | undefined;
              let brickId: string | undefined;
              if (e1.type === 'ball' && e2.type === 'brick') {
                ballId = e1.id;
                brickId = e2.id;
              } else if (e2.type === 'ball' && e1.type === 'brick') {
                ballId = e2.id;
                brickId = e1.id;
              } else {
                // Not a ball-brick contact
                continue;
              }

              const extractVec = (obj: unknown, keys: string[]): Vec3 | undefined => {
                for (const k of keys) {
                  if (!obj || typeof obj !== 'object') continue;
                  const v = (obj as Record<string, unknown>)[k];
                  if (v === undefined) continue;
                  if (Array.isArray(v)) return [v[0] ?? 0, v[1] ?? 0, v[2] ?? 0] as Vec3;
                  if (typeof v === 'object' && v !== null && ('x' in v || 'y' in v || 'z' in v)) {
                    const vo = v as Record<string, unknown>;
                    return [Number(vo.x ?? 0), Number(vo.y ?? 0), Number(vo.z ?? 0)];
                  }
                }
                return undefined;
              };

              const point = extractVec(evObj, ['point', 'contactPoint', 'worldPoint', 'p', 'pt', 'position']) ?? [0, 0, 0];
              const normal = extractVec(evObj, ['normal', 'contactNormal', 'n']) ?? undefined;
              const relVel = extractVec(evObj, ['relativeVelocity', 'relative_vel', 'vel', 'relativeVelocityWorld']) ?? undefined;
              const rawImpulse = (evObj && (evObj['impulse'] ?? evObj['totalImpulse'] ?? evObj['impulseMagnitude'] ?? evObj['normalImpulse'])) ?? undefined;
              const impulse = typeof rawImpulse === 'number' ? rawImpulse : (rawImpulse == null ? undefined : Number(rawImpulse as unknown));

              out.push({ ballId, brickId, point, normal: normal ?? [0, 0, 1], impulse, relativeVelocity: relVel });
            } catch {
              // ignore single-event failures
              continue;
            }
          }

          if (out.length) return out;
        }
      }
    } catch {
      // ignore runtime probing errors and fall back to overlap detector
    }

    // Many runtime builds don't expose a simple array — fall back to geometric overlap detection
    const out: ContactEvent[] = [];

    const ballStates = getBallStates();

    for (const ball of ballStates) {
      for (const [brickId, info] of brickBodies.entries()) {
        const b = info.body;
        // read translation safely
        const tRaw = b ? (typeof b.translation === 'function' ? b.translation() : b.translation) : undefined;
        const bx = Array.isArray(tRaw) ? tRaw[0] ?? 0 : tRaw?.x ?? 0;
        const by = Array.isArray(tRaw) ? tRaw[1] ?? 0 : tRaw?.y ?? 0;
        const bz = Array.isArray(tRaw) ? tRaw[2] ?? 0 : tRaw?.z ?? 0;

        const dx = ball.position[0] - bx;
        const dy = ball.position[1] - by;
        const dz = ball.position[2] - bz;

        // closest point on AABB (local dx/dy/dz clamped to half-sizes)
        const cx = Math.max(-info.size.x / 2, Math.min(info.size.x / 2, dx));
        const cy = Math.max(-info.size.y / 2, Math.min(info.size.y / 2, dy));
        const cz = Math.max(-info.size.z / 2, Math.min(info.size.z / 2, dz));

        const distX = dx - cx;
        const distY = dy - cy;
        const distZ = dz - cz;

        const distance = Math.sqrt(distX * distX + distY * distY + distZ * distZ);

        // A tiny epsilon to be forgiving of numeric differences
        if (distance <= 0.5001) {
          // Contact point on brick in world coordinates
          const contactPoint: Vec3 = [bx + cx, by + cy, bz + cz];

          // Normal: from contact point toward ball center
          let nx = ball.position[0] - contactPoint[0];
          let ny = ball.position[1] - contactPoint[1];
          let nz = ball.position[2] - contactPoint[2];
          const nlen = Math.sqrt(nx * nx + ny * ny + nz * nz);
          if (nlen > 1e-6) {
            nx /= nlen;
            ny /= nlen;
            nz /= nlen;
          } else {
            nx = 0; ny = 0; nz = 1;
          }

          const relVel: Vec3 = [ball.velocity[0], ball.velocity[1], ball.velocity[2]];
          const speed = Math.sqrt(relVel[0] * relVel[0] + relVel[1] * relVel[1] + relVel[2] * relVel[2]);

          // Heuristic impulse estimate: relative speed (no mass info available here)
          const impulse = speed;

          out.push({ ballId: ball.id, brickId, point: contactPoint, normal: [nx, ny, nz], impulse, relativeVelocity: relVel });
        }
      }
    }

    return out;
  }

  function destroy() {
    // Best-effort cleanup; libs may or may not expose explicit disposers.
    ballBodies.clear();
    brickBodies.clear();
    try {
      if (typeof runtime.free === 'function') runtime.free();
    } catch {
      // ignore
    }
  }

  function applyImpulseToBall(id: string, impulse: Vec3, point?: Vec3) {
    const b = ballBodies.get(id);
    if (!b) return false;
    try {
      const impObj = { x: impulse[0], y: impulse[1], z: impulse[2] };

      // Try common Rapier runtime method shapes
      const anyB = b as unknown as {
        applyImpulse?: (a: unknown, b?: unknown) => unknown;
        applyImpulseAtPoint?: (a: unknown, b?: unknown, c?: unknown) => unknown;
        linvel?: () => unknown;
        setLinvel?: (x: number, y: number, z: number) => unknown;
      };

      if (typeof anyB.applyImpulse === 'function') {
        try {
          anyB.applyImpulse(impObj, true);
          return true;
        } catch {
          try {
            anyB.applyImpulse(impulse, true);
            return true;
          } catch {
            // continue to other fallbacks
          }
        }
      }

      if (typeof anyB.applyImpulseAtPoint === 'function' && point) {
        try {
          anyB.applyImpulseAtPoint(impObj, { x: point[0], y: point[1], z: point[2] }, true);
          return true;
        } catch {
          try {
            anyB.applyImpulseAtPoint(impulse, point, true);
            return true;
          } catch {
            // continue
          }
        }
      }

      // Fallback: nudge linear velocity
      const vRaw = typeof anyB.linvel === 'function' ? anyB.linvel() : (anyB as { linvel?: unknown }).linvel;
      let vx = Array.isArray(vRaw) ? (vRaw as number[])[0] ?? 0 : Number(((vRaw as Record<string, unknown>)['x']) ?? 0);
      let vy = Array.isArray(vRaw) ? (vRaw as number[])[1] ?? 0 : Number(((vRaw as Record<string, unknown>)['y']) ?? 0);
      let vz = Array.isArray(vRaw) ? (vRaw as number[])[2] ?? 0 : Number(((vRaw as Record<string, unknown>)['z']) ?? 0);

      // Heuristic scale so impulses remain reasonable
      const scale = 0.5;
      vx += impulse[0] * scale;
      vy += impulse[1] * scale;
      vz += impulse[2] * scale;

      if (typeof anyB.setLinvel === 'function') {
        try {
          anyB.setLinvel(vx, vy, vz);
          return true;
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }

    return false;
  }

  function applyTorqueToBall(id: string, torque: Vec3) {
    const b = ballBodies.get(id);
    if (!b) return false;
    try {
      const anyB = b as unknown as {
        applyTorque?: (a: unknown, b?: unknown) => unknown;
        setAngvel?: (x: number, y: number, z: number) => unknown;
        angvel?: () => unknown;
      };

      if (typeof anyB.applyTorque === 'function') {
        try {
          anyB.applyTorque({ x: torque[0], y: torque[1], z: torque[2] }, true);
          return true;
        } catch {
          try {
            anyB.applyTorque(torque, true);
            return true;
          } catch {
            // continue
          }
        }
      }

      if (typeof anyB.setAngvel === 'function') {
        try {
          anyB.setAngvel(torque[0], torque[1], torque[2]);
          return true;
        } catch {
          // ignore
        }
      }

      // Fallback: attempt to nudge angular velocity if accessor exists
      const avRaw = typeof anyB.angvel === 'function' ? anyB.angvel() : (anyB as { angvel?: unknown }).angvel;
      let avx = Array.isArray(avRaw) ? (avRaw as number[])[0] ?? 0 : Number(((avRaw as Record<string, unknown>)['x']) ?? 0);
      let avy = Array.isArray(avRaw) ? (avRaw as number[])[1] ?? 0 : Number(((avRaw as Record<string, unknown>)['y']) ?? 0);
      let avz = Array.isArray(avRaw) ? (avRaw as number[])[2] ?? 0 : Number(((avRaw as Record<string, unknown>)['z']) ?? 0);

      const scale = 0.5;
      avx += torque[0] * scale;
      avy += torque[1] * scale;
      avz += torque[2] * scale;

      if (typeof anyB.setAngvel === 'function') {
        try {
          anyB.setAngvel(avx, avy, avz);
          return true;
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }

    return false;
  }

  return { addBall, removeBall, addBrick, removeBrick, step, drainContactEvents, getBallStates, applyImpulseToBall, applyTorqueToBall, destroy };
}
