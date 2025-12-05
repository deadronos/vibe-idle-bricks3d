import { checkAndUnlockAchievements } from '../../achievements';
import type { GameState } from '../../types';

/**
 * Calculates the final score amount after applying multipliers.
 *
 * @param {number} amount - The base score amount.
 * @param {number} prestigeMultiplier - The current prestige multiplier.
 * @returns {number} The calculated score.
 */
export const calculateScoreAmount = (amount: number, prestigeMultiplier: number): number => {
  return Math.floor(amount * prestigeMultiplier);
};

/**
 * Creates the score slice of the game store.
 * Manages score addition and achievement unlocking.
 *
 * @param {Function} set - The Zustand set function.
 * @returns {Object} The score slice actions.
 */
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
