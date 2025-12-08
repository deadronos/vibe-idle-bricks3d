import { checkAndUnlockAchievements, getBallSpeedLevel } from '../../achievements';
import { MAX_BALL_COUNT } from '../../constants';
import { createInitialBall } from '../../createInitials';
import { updateBallDamages, updateBallSpeeds } from '../balls';
import type { GameState } from '../../types';

/**
 * Calculates the cost to upgrade ball damage.
 *
 * @param {number} ballDamage - The current ball damage level.
 * @returns {number} The cost for the next upgrade.
 */
export const calculateBallDamageCost = (ballDamage: number): number => {
  return Math.floor(50 * Math.pow(1.5, ballDamage - 1));
};

/**
 * Calculates the cost to upgrade ball speed.
 *
 * @param {number} ballSpeed - The current ball speed.
 * @returns {number} The cost for the next upgrade.
 */
export const calculateBallSpeedCost = (ballSpeed: number): number => {
  const level = getBallSpeedLevel(ballSpeed) - 1;
  return Math.floor(30 * Math.pow(1.3, level));
};

/**
 * Calculates the cost to upgrade ball count.
 *
 * @param {number} ballCount - The current ball count.
 * @returns {number} The cost for the next upgrade.
 */
export const calculateBallCountCost = (ballCount: number): number => {
  return Math.floor(100 * Math.pow(2, ballCount - 1));
};

/**
 * Creates the upgrades slice of the game store.
 * Manages upgrading ball properties (damage, speed, count).
 *
 * @param {Function} set - The Zustand set function.
 * @param {Function} get - The Zustand get function.
 * @returns {Object} The upgrades slice actions.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createUpgradesSlice = (set: any, get: any) => ({
  getBallDamageCost: () => {
    const { ballDamage } = get();
    return calculateBallDamageCost(ballDamage);
  },

  getBallSpeedCost: () => {
    const { ballSpeed } = get();
    return calculateBallSpeedCost(ballSpeed);
  },

  getBallCountCost: () => {
    const { ballCount } = get();
    return calculateBallCountCost(ballCount);
  },

  upgradeBallDamage: () =>
    set((state: GameState) => {
      const cost = calculateBallDamageCost(state.ballDamage);
      if (state.score >= cost) {
        const ballDamage = state.ballDamage + 1;
        const score = state.score - cost;
        const unlockedAchievements = checkAndUnlockAchievements(state, { score, ballDamage });
        return {
          score,
          ballDamage,
          balls: updateBallDamages(state.balls, ballDamage),
          unlockedAchievements,
        };
      }
      return state;
    }),

  upgradeBallSpeed: () =>
    set((state: GameState) => {
      const cost = calculateBallSpeedCost(state.ballSpeed);
      if (state.score >= cost) {
        const ballSpeed = state.ballSpeed + 0.02;
        const score = state.score - cost;
        const unlockedAchievements = checkAndUnlockAchievements(state, { score, ballSpeed });
        return {
          score,
          ballSpeed,
          balls: updateBallSpeeds(state.balls, ballSpeed),
          unlockedAchievements,
        };
      }
      return state;
    }),

  upgradeBallCount: () =>
    set((state: GameState) => {
      const cost = calculateBallCountCost(state.ballCount);
      if (state.score >= cost && state.ballCount < MAX_BALL_COUNT) {
        const ballCount = state.ballCount + 1;
        const score = state.score - cost;
        const unlockedAchievements = checkAndUnlockAchievements(state, { score, ballCount });
        const newBall = createInitialBall(state.ballSpeed, state.ballDamage);
        return {
          score,
          ballCount,
          balls: [...state.balls, newBall],
          unlockedAchievements,
        };
      }
      return state;
    }),
});
