import type { BehaviorContext, BrickBehavior, HitEvent } from './types';

// Cache for ball ID -> ball lookup maps to avoid O(n) find on every hit
const ballCache = new WeakMap<object, Map<string, { id: string; damage?: number }>>();

/**
 * Gets or creates a cached ball lookup map for O(1) access.
 * The map is keyed by the state object reference.
 */
const getBallLookupMap = (state: object): Map<string, { id: string; damage?: number }> => {
  let cached = ballCache.get(state);
  if (!cached) {
    // This function is called with ctx.getState() result - we need to access balls
    // Since we can't access private state.balls here, we'll rebuild as needed
    cached = new Map();
    ballCache.set(state, cached);
  }
  return cached;
};

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
  // O(1) lookup using cached ball map instead of O(n) find
  const balls = (state as unknown as { balls: Array<{ id: string; damage?: number }> }).balls;
  const cached = getBallLookupMap(state);
  if (cached.size === 0 && balls) {
    for (const ball of balls) {
      cached.set(ball.id, ball);
    }
  }
  const ball = hit.ballId ? cached.get(hit.ballId) : undefined;
  if (ball) return ball.damage ?? 1;
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
