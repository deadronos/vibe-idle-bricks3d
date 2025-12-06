import type { Brick } from '../../store/types';
import type { BrickBehavior } from './types';

/**
 * Calculates the score reward for destroying a brick.
 *
 * @param {Brick} brick - The brick being destroyed.
 * @param {number} prestigeMultiplier - The current prestige multiplier.
 * @returns {number} The calculated score value.
 */
export function calculateScoreFromBrick(brick: Brick, prestigeMultiplier: number) {
  return Math.floor(brick.value * prestigeMultiplier);
}

/**
 * Creates a behavior that awards score when a brick is destroyed.
 *
 * @returns {BrickBehavior} The score on destroy behavior.
 */
export function createScoreOnDestroyBehavior(): BrickBehavior {
  return {
    name: 'scoreOnDestroy',
    onDestroy: (ctx, brick) => {
      const state = ctx.getState();
      const addScore = state.addScore;
      if (!addScore) return;
      const prestigeMultiplier = state.prestigeMultiplier ?? 1;
      const scoreGain = calculateScoreFromBrick(brick, prestigeMultiplier);
      addScore(scoreGain);
    },
  };
}
