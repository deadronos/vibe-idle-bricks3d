import { effectBus } from '../EffectEventBus';
import type { BehaviorContext, BrickBehavior, HitEvent } from './types';

type EffectTrigger = 'hit' | 'destroy';

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

function emitDestroyEffect(ctx: BehaviorContext, brickId: string) {
  const brick = ctx.getState().bricks.find((b) => b.id === brickId);
  if (!brick) return;
  effectBus.emit({
    type: 'brick_destroy',
    position: brick.position,
    color: brick.color,
  });
}

export function createSpawnEffectBehavior(trigger: EffectTrigger = 'hit'): BrickBehavior {
  return {
    name: `spawnEffect:${trigger}`,
    onHit: trigger === 'hit' ? (ctx, hit) => emitHitEffect(ctx, hit) : undefined,
    onDestroy: trigger === 'destroy' ? (ctx, brick) => emitDestroyEffect(ctx, brick.id) : undefined,
  };
}
