import type { BehaviorContext, BrickBehavior, HitEvent } from './types';

/**
 * Computes the damage to be applied based on the hit event.
 * Uses ball damage if available, otherwise falls back to impulse or 1.
 *
 * @param {BehaviorContext} ctx - The behavior context.
 * @param {HitEvent} hit - The hit event details.
 * @returns {number} The calculated damage amount.
 */
export function computeHitDamage(ctx: BehaviorContext, hit: HitEvent): number {
  const state = ctx.getState();
  const ball = state.balls.find((b) => b.id === hit.ballId);
  if (ball) return ball.damage;
  if (typeof hit.impulse === 'number') return hit.impulse;
  return 1;
}

/**
 * Applies damage to a brick based on a hit event.
 * Dispatches actions to the game store.
 *
 * @param {BehaviorContext} ctx - The behavior context.
 * @param {HitEvent} hit - The hit event details.
 */
export function applyHitDamage(ctx: BehaviorContext, hit: HitEvent) {
  const state = ctx.getState();
  const damage = computeHitDamage(ctx, hit);
  const applyHits = state.applyHits;
  if (applyHits) {
    applyHits([{ brickId: hit.brickId, damage }]);
    return;
  }

  const damageBrick = state.damageBrick;
  if (damageBrick) {
    damageBrick(hit.brickId, damage);
  }
}

/**
 * Creates a behavior that applies damage when a brick is hit.
 *
 * @returns {BrickBehavior} The hit damage behavior.
 */
export function createHitDamageBehavior(): BrickBehavior {
  return {
    name: 'hitDamage',
    onHit: (ctx, hit, options) => {
      if (!options?.applyDamage) return;
      applyHitDamage(ctx, hit);
    },
  };
}
