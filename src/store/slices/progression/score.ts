import type { GameStoreSlice } from '../types';
import { checkAndUnlockAchievements } from '../../achievements';

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
 * @param {Function} get - The Zustand get function.
 * @param {Object} store - The Zustand store API.
 * @returns {Object} The score slice actions.
 */
export const createScoreSlice: GameStoreSlice<{
  addScore: (amount: number) => void;
}> = (set) => ({
  addScore: (amount: number) =>
    set((state) => {
      const multipliedAmount = calculateScoreAmount(amount, state.prestigeMultiplier);
      const score = state.score + multipliedAmount;
      const unlockedAchievements = checkAndUnlockAchievements(state, { score });
      return {
        score,
        unlockedAchievements,
      };
    }),
});
