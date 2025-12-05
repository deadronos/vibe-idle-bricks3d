import { BRICK_HALF_SIZE } from '../collision/constants';
import type { Ball, Brick } from '../../store/types';
import type { RapierModule, RapierWorldRuntime, RapierBody, BallState, Vec3 } from './types';
import { maybeHandle, readTranslation, readLinvel, readRotation, readAngvel, safeApplyImpulse, safeApplyTorque } from './runtime-probes';

export function createBodyManager(rapier: RapierModule, runtime: RapierWorldRuntime) {
  const ballBodies = new Map<string, RapierBody | undefined>();
  const brickBodies = new Map<
    string,
    { body: RapierBody | undefined; size: { x: number; y: number; z: number } }
  >();
  // Map of runtime handles (body or collider handles) -> game entity info { type, id }
  const handleToEntity = new Map<unknown, { type: 'ball' | 'brick'; id: string }>();

  function addBall(b: Ball) {
    if (ballBodies.has(b.id)) {
      // Update existing body's transform and velocity if possible
      const existing = ballBodies.get(b.id);
      try {
        const ex = existing ?? undefined;
        if (ex && typeof ex.setTranslation === 'function')
          ex.setTranslation(b.position[0], b.position[1], b.position[2]);
        else if (ex && typeof ex.setTranslationRaw === 'function')
          ex.setTranslationRaw(b.position[0], b.position[1], b.position[2]);
        if (ex && typeof ex.setLinvel === 'function')
          ex.setLinvel(b.velocity[0], b.velocity[1], b.velocity[2]);
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
      if (typeof bodyKey !== 'undefined' && bodyKey !== null)
        handleToEntity.set(bodyKey, { type: 'ball', id: b.id });
      const collKey = maybeHandle(createdCollider);
      if (typeof collKey !== 'undefined' && collKey !== null)
        handleToEntity.set(collKey, { type: 'ball', id: b.id });
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
          if (b && typeof b.setTranslation === 'function')
            b.setTranslation(brick.position[0], brick.position[1], brick.position[2]);
          else if (b && typeof b.setTranslationRaw === 'function')
            b.setTranslationRaw(brick.position[0], brick.position[1], brick.position[2]);
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

    const collider = rapier
      .ColliderDesc!.cuboid(halfX, halfY, halfZ)
      .setRestitution(1)
      .setFriction(0);

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
      if (typeof bodyKey !== 'undefined' && bodyKey !== null)
        handleToEntity.set(bodyKey, { type: 'brick', id: brick.id });
      const collKey = maybeHandle(createdCollider);
      if (typeof collKey !== 'undefined' && collKey !== null)
        handleToEntity.set(collKey, { type: 'brick', id: brick.id });
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

  function getBallStates(): BallState[] {
    const out: BallState[] = [];
    for (const [id, body] of ballBodies.entries()) {
      try {
        if (!body) {
          out.push({
            id,
            position: [0, 0, 0],
            velocity: [0, 0, 0],
            rotation: [0, 0, 0, 1],
            angularVelocity: [0, 0, 0],
          });
          continue;
        }

        const pos = readTranslation(body);
        const vel = readLinvel(body);
        const rot = readRotation(body);
        const ang = readAngvel(body);

        out.push({
          id,
          position: pos,
          velocity: vel,
          rotation: rot,
          angularVelocity: ang,
        });
      } catch (e) {
        void e;
        out.push({
          id,
          position: [0, 0, 0],
          velocity: [0, 0, 0],
          rotation: [0, 0, 0, 1],
          angularVelocity: [0, 0, 0],
        });
      }
    }
    return out;
  }

  function applyImpulseToBall(id: string, impulse: Vec3, point?: Vec3): boolean {
    const b = ballBodies.get(id);
    if (!b) return false;
    return safeApplyImpulse(b, impulse, point);
  }

  function applyTorqueToBall(id: string, torque: Vec3): boolean {
    const b = ballBodies.get(id);
    if (!b) return false;
    return safeApplyTorque(b, torque);
  }

  function destroy() {
    ballBodies.clear();
    brickBodies.clear();
    handleToEntity.clear();
  }

  return {
    ballBodies,
    brickBodies,
    handleToEntity,
    addBall,
    removeBall,
    addBrick,
    removeBrick,
    getBallStates,
    applyImpulseToBall,
    applyTorqueToBall,
    destroy,
  };
}
