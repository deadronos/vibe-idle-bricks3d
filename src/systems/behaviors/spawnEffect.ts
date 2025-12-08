import { effectBus } from '../EffectEventBus';
import type { BehaviorContext, BrickBehavior, HitEvent } from './types';

/**
 * Determines when to trigger a visual effect.
 */
type EffectTrigger = 'hit' | 'destroy';

/**
 * Emits a visual effect for a brick hit.
 *
 * @param {BehaviorContext} ctx - The behavior context.
 * @param {HitEvent} hit - The hit event details.
 */
function emitHitEffect(ctx: BehaviorContext, hit: HitEvent) {
  const brick = ctx.getState().bricks.find((b) => b.id === hit.brickId);
  if (!brick) return;
  effectBus.emit({
    type: 'brick_hit',
    position: brick.position,
    color: brick.color,
    amount: undefined,
  });
}

/**
 * Emits a visual effect for a brick destruction.
 *
 * @param {BehaviorContext} ctx - The behavior context.
 * @param {string} brickId - The ID of the destroyed brick.
 */
function emitDestroyEffect(ctx: BehaviorContext, brickId: string) {
  const brick = ctx.getState().bricks.find((b) => b.id === brickId);
  if (!brick) return;
  effectBus.emit({
    type: 'brick_destroy',
    position: brick.position,
    color: brick.color,
  });
}

/**
 * Creates a behavior that spawns visual effects on hit or destroy.
 *
 * @param {EffectTrigger} [trigger='hit'] - When to trigger the effect.
 * @returns {BrickBehavior} The spawn effect behavior.
 */
export function createSpawnEffectBehavior(trigger: EffectTrigger = 'hit'): BrickBehavior {
  return {
    name: `spawnEffect:${trigger}`,
    onHit: trigger === 'hit' ? (ctx, hit) => emitHitEffect(ctx, hit) : undefined,
    onDestroy: trigger === 'destroy' ? (ctx, brick) => emitDestroyEffect(ctx, brick.id) : undefined,
  };
}
