import type { Ball } from '../../store/types';
import type { ContactEvent, Vec3 } from '../rapier/types';

export interface HitResult {
  brickId: string;
  damage: number;
}

/**
 * Calculates the final damage amount, applying tiered critical hit logic.
 * Every 100% (1.0) crit chance adds a guaranteed +1x damage multiplier.
 * Any remaining fractional chance provides a probability for another +1x.
 *
 * Example: 150% (1.5) crit chance = guaranteed 2x damage + 50% chance for 3x.
 *
 * @param {number} baseDamage - The base damage of the ball.
 * @param {number} critChance - The probability of a critical hit (can exceed 1.0).
 * @returns {number} The calculated damage.
 */
export function calculateDamage(baseDamage: number, critChance: number): number {
  if (!critChance || critChance <= 0) return baseDamage;

  const guaranteedMult = Math.floor(critChance);
  const fractionalChance = critChance % 1;
  if (fractionalChance === 0) return baseDamage * (1 + guaranteedMult);

  const bonusMult = Math.random() < fractionalChance ? 1 : 0;

  return baseDamage * (1 + guaranteedMult + bonusMult);
}

/**
 * Computes a contact normal based on velocity.
 * Used as a fallback when precise collision normals are not available.
 *
 * @param {Vec3} velocity - The velocity vector.
 * @returns {Vec3} The normalized direction vector or [0,0,1].
 */
export function computeContactNormal(velocity: Vec3): Vec3 {
  const speedSq =
    velocity[0] * velocity[0] + velocity[1] * velocity[1] + velocity[2] * velocity[2];
  if (speedSq > 1e-12) {
    const invSpeed = 1 / Math.sqrt(speedSq);
    return [velocity[0] * invSpeed, velocity[1] * invSpeed, velocity[2] * invSpeed];
  }
  return [0, 0, 1];
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
