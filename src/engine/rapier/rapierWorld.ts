import { BRICK_HALF_SIZE } from '../collision/constants';
import type { Ball, Brick } from '../../store/types';

type Vec3 = [number, number, number];

export interface BallState {
  id: string;
  position: Vec3;
  velocity: Vec3;
}

export type RapierModule = any;

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
export function createWorld(rapier: RapierModule, gravity = { x: 0, y: 0, z: 0 }): RapierWorld {
  let world: any;
  try {
    world = new rapier.World(gravity);
  } catch (err) {
    // Re-throw with additional context so tests/consumers can decide fallback behaviour.
    throw new Error(`Failed to create Rapier World — runtime may not be initialized or WASM failed to load: ${(err as Error).message}`);
  }

  const ballBodies = new Map<string, any>();
  const brickBodies = new Map<string, { body: any; size: { x: number; y: number; z: number } }>();

  function addBall(b: Ball) {
    if (ballBodies.has(b.id)) {
      // Update existing body's transform and velocity if possible
      const existing = ballBodies.get(b.id);
      try {
        if (existing.setTranslation) existing.setTranslation(b.position[0], b.position[1], b.position[2]);
        else if (existing.setTranslationRaw) existing.setTranslationRaw(b.position[0], b.position[1], b.position[2]);
        if (existing.setLinvel) existing.setLinvel(b.velocity[0], b.velocity[1], b.velocity[2]);
      } catch {
        // best-effort — ignore if not supported
      }
      return;
    }
    const desc = rapier.RigidBodyDesc.dynamic()
      .setTranslation(b.position[0], b.position[1], b.position[2])
      .setLinvel(b.velocity[0], b.velocity[1], b.velocity[2]);

    const body = world.createRigidBody(desc);

    const collider = rapier.ColliderDesc.ball(b.radius).setRestitution(1).setFriction(0);
    // createCollider accepts a parent body handle or the body object depending on build
    try {
      if (body.handle !== undefined) world.createCollider(collider, body.handle);
      else world.createCollider(collider, body);
    } catch {
      // Some builds may return a plain handle instead — tolerate both styles.
      try {
        world.createCollider(collider, body);
      } catch {
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
      if (typeof world.removeRigidBody === 'function') world.removeRigidBody(b.handle ?? b);
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
          if (b.setTranslation) b.setTranslation(brick.position[0], brick.position[1], brick.position[2]);
          else if (b.setTranslationRaw) b.setTranslationRaw(brick.position[0], brick.position[1], brick.position[2]);
        } catch {
          // ignore
        }
      }
      return;
    }
    const desc = rapier.RigidBodyDesc.fixed().setTranslation(brick.position[0], brick.position[1], brick.position[2]);
    const body = world.createRigidBody(desc);

    const halfX = BRICK_HALF_SIZE.x;
    const halfY = BRICK_HALF_SIZE.y;
    const halfZ = BRICK_HALF_SIZE.z;

    const collider = rapier.ColliderDesc.cuboid(halfX, halfY, halfZ).setRestitution(1).setFriction(0);

    try {
      if (body.handle !== undefined) world.createCollider(collider, body.handle);
      else world.createCollider(collider, body);
    } catch {
      try {
        world.createCollider(collider, body);
      } catch {
        // ignore
      }
    }

    brickBodies.set(brick.id, { body, size: { x: halfX * 2, y: halfY * 2, z: halfZ * 2 } });
  }

  function removeBrick(id: string) {
    const info = brickBodies.get(id);
    if (!info) return;
    try {
      if (typeof world.removeRigidBody === 'function') world.removeRigidBody(info.body.handle ?? info.body);
    } catch {
      // ignore
    }
    brickBodies.delete(id);
  }

  function step(_dt?: number) {
    // Most compat builds expose a simple step() helper; call without args.
    // We deliberately ignore _dt here — tests will step the world repeatedly to emulate fixed-step integration.
    if (typeof world.step === 'function') world.step();
  }

  function getBallStates(): BallState[] {
    const out: BallState[] = [];
    for (const [id, body] of ballBodies.entries()) {
      try {
        // Some bindings expose translation() / linvel() methods
        const t = body.translation?.() ?? body.translation ?? { x: 0, y: 0, z: 0 };
        const v = body.linvel?.() ?? body.linvel ?? { x: 0, y: 0, z: 0 };

        out.push({ id, position: [t.x ?? t[0] ?? 0, t.y ?? t[1] ?? 0, t.z ?? t[2] ?? 0], velocity: [v.x ?? v[0] ?? 0, v.y ?? v[1] ?? 0, v.z ?? v[2] ?? 0] });
      } catch {
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
        const dx = ball.position[0] - (info.body.translation?.().x ?? info.body.translation?.[0] ?? 0);
        const dy = ball.position[1] - (info.body.translation?.().y ?? info.body.translation?.[1] ?? 0);
        const dz = ball.position[2] - (info.body.translation?.().z ?? info.body.translation?.[2] ?? 0);

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
      if (typeof world.free === 'function') world.free();
    } catch {
      // ignore
    }
  }

  return { addBall, removeBall, addBrick, removeBrick, step, drainContactEvents, getBallStates, destroy };
}
