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

export type Vec3 = [number, number, number];

export type ContactInfo = HitEvent;

const behaviorContext: BehaviorContext = {
  getState: useGameStore.getState,
};

export function getBehaviorForBrick(brick: Brick | undefined): BrickBehavior | undefined {
  const behaviors = getBehaviorsForBrick(brick);
  return behaviors.length > 0 ? behaviors[0] : undefined;
}

/**
 * Handle a contact event. By default this does NOT apply damage — callers
 * should aggregate hits and apply damage via the store if they want combo logic.
 * Pass { applyDamage: true } to also apply damage using the store's `applyHits`.
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
