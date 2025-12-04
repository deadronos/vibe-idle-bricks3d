import type { BehaviorContext, BrickBehavior, HitEvent } from './types';

export function computeHitDamage(ctx: BehaviorContext, hit: HitEvent): number {
  const state = ctx.getState();
  const ball = state.balls.find((b) => b.id === hit.ballId);
  if (ball) return ball.damage;
  if (typeof hit.impulse === 'number') return hit.impulse;
  return 1;
}

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

export function createHitDamageBehavior(): BrickBehavior {
  return {
    name: 'hitDamage',
    onHit: (ctx, hit, options) => {
      if (!options?.applyDamage) return;
      applyHitDamage(ctx, hit);
    },
  };
}
