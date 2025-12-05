import { useGameStore } from '../store/gameStore';
import type { BrickBehavior } from './behaviors';
import {
  getBehaviorsForBrick,
  registerBehavior,
  runBehaviorsForDestroy,
  runBehaviorsForHit,
} from './behaviors';
import type { BehaviorContext, HitEvent } from './behaviors';
import type { Brick } from '../store/types';

/**
 * 3-component vector tuple.
 */
export type Vec3 = [number, number, number];

/**
 * Alias for HitEvent, representing contact information.
 */
export type ContactInfo = HitEvent;

/**
 * Global behavior context tied to the game store.
 */
const behaviorContext: BehaviorContext = {
  getState: useGameStore.getState,
};

/**
 * Retrieves the first registered behavior for a given brick.
 *
 * @param {Brick | undefined} brick - The brick to check.
 * @returns {BrickBehavior | undefined} The first behavior or undefined.
 */
export function getBehaviorForBrick(brick: Brick | undefined): BrickBehavior | undefined {
  const behaviors = getBehaviorsForBrick(brick);
  return behaviors.length > 0 ? behaviors[0] : undefined;
}

/**
 * Handles a contact event between a ball and a brick.
 * Runs hit behaviors and destroy behaviors if the brick is destroyed.
 *
 * @param {ContactInfo} info - The contact details.
 * @param {Object} [opts] - Configuration options.
 * @param {boolean} [opts.applyDamage=false] - Whether to apply damage immediately.
 * @returns {Promise<void>} A promise resolving when handling is complete.
 */
export function handleContact(
  info: ContactInfo,
  opts: { applyDamage?: boolean } = { applyDamage: false }
) {
  const { applyDamage = false } = opts;
  return (async () => {
    const preState = behaviorContext.getState();
    const brick = preState.bricks.find((b) => b.id === info.brickId);

    await runBehaviorsForHit(behaviorContext, brick, info, { applyDamage });

    const postState = behaviorContext.getState();
    const stillExists = postState.bricks.some((b) => b.id === info.brickId);
    if (brick && !stillExists) {
      await runBehaviorsForDestroy(behaviorContext, brick);
    }
  })();
}

export default {
  registerBehavior,
  handleContact,
  getBehaviorForBrick,
};
