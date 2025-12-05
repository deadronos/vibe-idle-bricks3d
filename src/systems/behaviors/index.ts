import type { Brick } from '../../store/types';
import type {
  BehaviorContext,
  BehaviorRunOptions,
  BrickBehavior,
  BrickBehaviorRegistry,
  HitEvent,
} from './types';
import { createHitDamageBehavior } from './hitDamage';

/**
 * Registry mapping brick types to their associated behaviors.
 */
const registry: BrickBehaviorRegistry = new Map();

/**
 * Safely invokes a behavior function, catching any errors to prevent system crashing.
 *
 * @template T - The type of arguments passed to the function.
 * @param {Function} fn - The function to invoke.
 * @param {...T} args - The arguments to pass to the function.
 */
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

/**
 * Registers a behavior for a specific brick type.
 *
 * @param {string} brickType - The type of brick to register the behavior for.
 * @param {BrickBehavior} behavior - The behavior to register.
 */
export function registerBehavior(brickType: string, behavior: BrickBehavior) {
  const existing = registry.get(brickType) ?? [];
  registry.set(brickType, [...existing, behavior]);
}

/**
 * Registers multiple behaviors for a specific brick type.
 *
 * @param {string} brickType - The type of brick to register the behaviors for.
 * @param {BrickBehavior[]} behaviors - The list of behaviors to register.
 */
export function registerBehaviors(brickType: string, behaviors: BrickBehavior[]) {
  behaviors.forEach((behavior) => registerBehavior(brickType, behavior));
}

/**
 * Clears behaviors from the registry.
 *
 * @param {string} [brickType] - If specified, clears only for that brick type. Otherwise clears all.
 */
export function clearBehaviors(brickType?: string) {
  if (brickType) {
    registry.delete(brickType);
    return;
  }
  registry.clear();
}

/**
 * Resets the behavior registry to its default state.
 */
export function resetBehaviorRegistry() {
  clearBehaviors();
  registerDefaultBehaviors();
}

/**
 * Retrieves the behaviors associated with a given brick.
 * Defaults to 'normal' behaviors if the brick type is not found.
 *
 * @param {Brick | undefined} brick - The brick to get behaviors for.
 * @returns {BrickBehavior[]} The list of behaviors.
 */
export function getBehaviorsForBrick(brick: Brick | undefined): BrickBehavior[] {
  if (!brick) return registry.get('normal') ?? [];
  return registry.get(brick.type) ?? registry.get('normal') ?? [];
}

/**
 * Executes all registered hit behaviors for a specific brick.
 *
 * @param {BehaviorContext} ctx - The behavior context.
 * @param {Brick | undefined} brick - The brick that was hit.
 * @param {HitEvent} hit - The hit event details.
 * @param {BehaviorRunOptions} [options] - Execution options.
 */
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

/**
 * Executes all registered destroy behaviors for a specific brick.
 *
 * @param {BehaviorContext} ctx - The behavior context.
 * @param {Brick} brick - The brick that was destroyed.
 */
export async function runBehaviorsForDestroy(ctx: BehaviorContext, brick: Brick) {
  const behaviors = getBehaviorsForBrick(brick);
  for (const behavior of behaviors) {
    await safeInvoke(behavior.onDestroy, ctx, brick);
  }
}

/**
 * Registers the default behaviors for the game.
 */
function registerDefaultBehaviors() {
  registerBehavior('normal', createHitDamageBehavior());
}

registerDefaultBehaviors();

export { createHitDamageBehavior, applyHitDamage, computeHitDamage } from './hitDamage';
export { createScoreOnDestroyBehavior, calculateScoreFromBrick } from './score';
export { createSpawnEffectBehavior } from './spawnEffect';
export { createPowerupDropBehavior } from './powerup';
export * from './types';
