import type { Brick } from '../../store/types';
import type {
  BehaviorContext,
  BehaviorRunOptions,
  BrickBehavior,
  BrickBehaviorRegistry,
  HitEvent,
} from './types';
import { createHitDamageBehavior } from './hitDamage';

const registry: BrickBehaviorRegistry = new Map();

const safeInvoke = async <T extends unknown[]>(
  fn: ((...args: T) => void | Promise<void>) | undefined,
  ...args: T
) => {
  if (!fn) return;
  try {
    await fn(...args);
  } catch (e) {
    // Behaviors should never break the physics/contact loop
    void e;
  }
};

export function registerBehavior(brickType: string, behavior: BrickBehavior) {
  const existing = registry.get(brickType) ?? [];
  registry.set(brickType, [...existing, behavior]);
}

export function registerBehaviors(brickType: string, behaviors: BrickBehavior[]) {
  behaviors.forEach((behavior) => registerBehavior(brickType, behavior));
}

export function clearBehaviors(brickType?: string) {
  if (brickType) {
    registry.delete(brickType);
    return;
  }
  registry.clear();
}

export function resetBehaviorRegistry() {
  clearBehaviors();
  registerDefaultBehaviors();
}

export function getBehaviorsForBrick(brick: Brick | undefined): BrickBehavior[] {
  if (!brick) return registry.get('normal') ?? [];
  return registry.get(brick.type) ?? registry.get('normal') ?? [];
}

export async function runBehaviorsForHit(
  ctx: BehaviorContext,
  brick: Brick | undefined,
  hit: HitEvent,
  options?: BehaviorRunOptions
) {
  const behaviors = getBehaviorsForBrick(brick);
  for (const behavior of behaviors) {
    await safeInvoke(behavior.onHit, ctx, hit, options);
  }
}

export async function runBehaviorsForDestroy(ctx: BehaviorContext, brick: Brick) {
  const behaviors = getBehaviorsForBrick(brick);
  for (const behavior of behaviors) {
    await safeInvoke(behavior.onDestroy, ctx, brick);
  }
}

function registerDefaultBehaviors() {
  registerBehavior('normal', createHitDamageBehavior());
}

registerDefaultBehaviors();

export { createHitDamageBehavior, applyHitDamage, computeHitDamage } from './hitDamage';
export { createScoreOnDestroyBehavior, calculateScoreFromBrick } from './score';
export { createSpawnEffectBehavior } from './spawnEffect';
export { createPowerupDropBehavior } from './powerup';
export * from './types';
