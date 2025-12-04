import type { Brick } from '../../store/types';
import type { BrickBehavior } from './types';

export function calculateScoreFromBrick(brick: Brick, prestigeMultiplier: number) {
  return Math.floor(brick.value * prestigeMultiplier);
}

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
