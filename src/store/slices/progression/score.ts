import { checkAndUnlockAchievements } from '../../achievements';
import type { GameState } from '../../types';

export const calculateScoreAmount = (amount: number, prestigeMultiplier: number): number => {
  return Math.floor(amount * prestigeMultiplier);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createScoreSlice = (set: any) => ({
  addScore: (amount: number) =>
    set((state: GameState) => {
      const multipliedAmount = calculateScoreAmount(amount, state.prestigeMultiplier);
      const score = state.score + multipliedAmount;
      const unlockedAchievements = checkAndUnlockAchievements(state, { score });
      return {
        score,
        unlockedAchievements,
      };
    }),
});
