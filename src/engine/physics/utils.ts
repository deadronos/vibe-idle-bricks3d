import type { Ball } from '../../store/types';
import type { ContactEvent, Vec3 } from '../rapier/types';

export interface HitResult {
  brickId: string;
  damage: number;
}

/**
 * Calculates the final damage amount, applying critical hit logic.
 *
 * @param {number} baseDamage - The base damage of the ball.
 * @param {number} critChance - The probability (0-1) of a critical hit.
 * @returns {number} The calculated damage.
 */
export function calculateDamage(baseDamage: number, critChance: number): number {
  return critChance && Math.random() < critChance ? baseDamage * 2 : baseDamage;
}

/**
 * Computes a contact normal based on velocity.
 * Used as a fallback when precise collision normals are not available.
 *
 * @param {Vec3} velocity - The velocity vector.
 * @returns {Vec3} The normalized direction vector or [0,0,1].
 */
export function computeContactNormal(velocity: Vec3): Vec3 {
  const speed = Math.sqrt(
    velocity[0] * velocity[0] + velocity[1] * velocity[1] + velocity[2] * velocity[2]
  );
  return speed > 1e-6
    ? [velocity[0] / speed, velocity[1] / speed, velocity[2] / speed]
    : [0, 0, 1];
}

/**
 * Creates a ContactEvent object for non-physics-engine collisions.
 *
 * @param {Ball} ball - The ball involved in the collision.
 * @param {string} brickId - The ID of the hit brick.
 * @param {Vec3} position - The position of the collision.
 * @param {Vec3} velocity - The velocity of the ball at collision.
 * @returns {ContactEvent} The constructed contact event.
 */
export function createFallbackContactEvent(
  ball: Ball,
  brickId: string,
  position: Vec3,
  velocity: Vec3
): ContactEvent {
  return {
    ballId: ball.id,
    brickId,
    point: position,
    normal: computeContactNormal(velocity),
    relativeVelocity: velocity,
    impulse: ball.damage,
  };
}

/**
 * Applies aggregated frame hits to the store and triggers side effects.
 *
 * @param {HitResult[]} hits - The list of damage events to apply.
 * @param {ContactEvent[]} contactInfos - The list of contact events for visual/behavioral effects.
 * @param {Object} callbacks - The store callbacks.
 * @param {Function} callbacks.applyHits - The store action to apply damage and combos.
 * @param {Function} callbacks.handleContact - The system function to trigger behaviors.
 */
export function applyFrameHits(
  hits: HitResult[],
  contactInfos: ContactEvent[],
  callbacks: {
    applyHits: (hits: HitResult[]) => void;
    handleContact: (info: ContactEvent, opts: { applyDamage: boolean }) => void;
  }
) {
  if (hits.length > 0) {
    callbacks.applyHits(hits);

    for (const info of contactInfos) {
      callbacks.handleContact(info, { applyDamage: false });
    }
  }
}
