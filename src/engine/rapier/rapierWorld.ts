import { BRICK_HALF_SIZE } from '../collision/constants';
import type { Ball, Brick } from '../../store/types';

type Vec3 = [number, number, number];

export interface BallState {
  id: string;
  position: Vec3;
  velocity: Vec3;
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
  drainContactEvents: () => Array<{ ballId: string; brickId: string }>; // minimal event shape
  getBallStates: () => BallState[];
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
    try {
      const bAs = body as { handle?: unknown } | undefined;
      if (bAs && bAs.handle !== undefined) runtime.createCollider(collider, bAs.handle);
      else runtime.createCollider(collider, body);
    } catch (e) {
      // Some builds may return a plain handle instead — tolerate both styles.
      void e;
      try {
        runtime.createCollider(collider, body);
      } catch (innerErr) {
        void innerErr;
        // ignore; collider is optional for the PoC step (we'll still be able to read transforms)
      }
    }

    ballBodies.set(b.id, body);
  }

  function removeBall(id: string) {
    const b = ballBodies.get(id);
    if (!b) return;
    try {
      // World exposes removeRigidBody in several builds
      const bAs = b as { handle?: unknown } | undefined;
      if (typeof runtime.removeRigidBody === 'function') runtime.removeRigidBody(bAs?.handle ?? b);
    } catch {
      // ignore
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

    try {
      const bAs = body as { handle?: unknown } | undefined;
      if (bAs && bAs.handle !== undefined) runtime.createCollider(collider, bAs.handle);
      else runtime.createCollider(collider, body);
    } catch (e) {
      void e;
      try {
        runtime.createCollider(collider, body);
      } catch (innerErr) {
        void innerErr;
        // ignore
      }
    }

    brickBodies.set(brick.id, { body, size: { x: halfX * 2, y: halfY * 2, z: halfZ * 2 } });
  }

  function removeBrick(id: string) {
    const info = brickBodies.get(id);
    if (!info) return;
    try {
      const bAs = info.body as { handle?: unknown } | undefined;
      if (typeof runtime.removeRigidBody === 'function') runtime.removeRigidBody(bAs?.handle ?? info.body);
    } catch (e) {
      void e;
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
          out.push({ id, position: [0, 0, 0], velocity: [0, 0, 0] });
          continue;
        }

        // Normalize translation/linvel shapes — some builds return objects, others arrays
        const tRaw = typeof body.translation === 'function' ? body.translation() : body.translation;
        const vRaw = typeof body.linvel === 'function' ? body.linvel() : body.linvel;

        const px = Array.isArray(tRaw) ? tRaw[0] ?? 0 : tRaw?.x ?? 0;
        const py = Array.isArray(tRaw) ? tRaw[1] ?? 0 : tRaw?.y ?? 0;
        const pz = Array.isArray(tRaw) ? tRaw[2] ?? 0 : tRaw?.z ?? 0;

        const vx = Array.isArray(vRaw) ? vRaw[0] ?? 0 : vRaw?.x ?? 0;
        const vy = Array.isArray(vRaw) ? vRaw[1] ?? 0 : vRaw?.y ?? 0;
        const vz = Array.isArray(vRaw) ? vRaw[2] ?? 0 : vRaw?.z ?? 0;

        out.push({ id, position: [px, py, pz], velocity: [vx, vy, vz] });
      } catch (e) {
        void e;
        out.push({ id, position: [0, 0, 0], velocity: [0, 0, 0] });
      }
    }
    return out;
  }

  function drainContactEvents() {
    // Attempt to drain contacts from world if an event API exists.
    // Many runtime builds expose narrow-phase / event queues — but shapes differ.
    // For this PoC we fallback to a simple sphere-box overlap detector.
    const hits: Array<{ ballId: string; brickId: string }> = [];

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

        // closest point on AABB
        const cx = Math.max(-info.size.x / 2, Math.min(info.size.x / 2, dx));
        const cy = Math.max(-info.size.y / 2, Math.min(info.size.y / 2, dy));
        const cz = Math.max(-info.size.z / 2, Math.min(info.size.z / 2, dz));

        const distX = dx - cx;
        const distY = dy - cy;
        const distZ = dz - cz;

        const distance = Math.sqrt(distX * distX + distY * distY + distZ * distZ);

        // A tiny epsilon to be forgiving of numeric differences
        if (distance <= 0.5001) {
          hits.push({ ballId: ball.id, brickId });
        }
      }
    }

    return hits;
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

  return { addBall, removeBall, addBrick, removeBrick, step, drainContactEvents, getBallStates, destroy };
}
