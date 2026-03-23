import type { GameStoreSlice } from '../types';
import { checkAndUnlockAchievements, getBallSpeedLevel } from '../../achievements';
import { MAX_BALL_COUNT, MAX_CRIT_CHANCE } from '../../constants';
import { createInitialBall } from '../../createInitials';
import { updateBallDamages, updateBallSpeeds } from '../balls';
import type { GameState } from '../../types';

/**
 * Calculates the cost for a specific level of an upgrade.
 */
const getLevelCost = (base: number, rate: number, level: number): number => {
  return Math.floor(base * Math.pow(rate, level));
};

/**
 * Calculates total cost for multiple levels of an upgrade.
 */
const getTotalCost = (base: number, rate: number, currentLevel: number, count: number): number => {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += getLevelCost(base, rate, currentLevel + i);
  }
  return total;
};

/**
 * Calculates how many levels can be bought with a given budget.
 */
const getMaxLevels = (
  base: number,
  rate: number,
  currentLevel: number,
  budget: number,
  maxLevelsAllowed: number = Infinity
): number => {
  let total = 0;
  let count = 0;
  while (count < maxLevelsAllowed) {
    const cost = getLevelCost(base, rate, currentLevel + count);
    if (total + cost > budget) break;
    total += cost;
    count++;
  }
  return count;
};

export const calculateBallDamageCost = (ballDamage: number): number => {
  return getLevelCost(50, 1.5, ballDamage - 1);
};

export const calculateBallSpeedCost = (ballSpeed: number): number => {
  const level = getBallSpeedLevel(ballSpeed) - 1;
  return getLevelCost(30, 1.3, level);
};

export const calculateBallCountCost = (ballCount: number): number => {
  return getLevelCost(100, 2, ballCount - 1);
};

export const calculateCritChanceCost = (critChance: number): number => {
  const level = Math.round(critChance * 100);
  return getLevelCost(200, 1.35, level);
};

const getPurchaseCount = (
  state: GameState,
  base: number,
  rate: number,
  currentLevel: number,
  maxLevelsAllowed: number = Infinity
): number => {
  const mult = state.buyMultiplier || 1;
  if (mult === 'max') {
    return getMaxLevels(base, rate, currentLevel, state.score, maxLevelsAllowed);
  }
  return Math.min(mult, maxLevelsAllowed);
};

export const createUpgradesSlice: GameStoreSlice<
  Pick<
    GameState,
    | 'getBallDamageCost'
    | 'getBallSpeedCost'
    | 'getBallCountCost'
    | 'getCritChanceCost'
    | 'upgradeBallDamage'
    | 'upgradeBallSpeed'
    | 'upgradeBallCount'
    | 'upgradeCritChance'
  >
> = (set, get) => ({
  getBallDamageCost: () => {
    const state = get();
    const count = getPurchaseCount(state, 50, 1.5, state.ballDamage - 1);
    return getTotalCost(50, 1.5, state.ballDamage - 1, Math.max(1, count));
  },

  getBallSpeedCost: () => {
    const state = get();
    const level = getBallSpeedLevel(state.ballSpeed) - 1;
    const count = getPurchaseCount(state, 30, 1.3, level);
    return getTotalCost(30, 1.3, level, Math.max(1, count));
  },

  getBallCountCost: () => {
    const state = get();
    const count = getPurchaseCount(state, 100, 2, state.ballCount - 1, MAX_BALL_COUNT - state.ballCount);
    return getTotalCost(100, 2, state.ballCount - 1, Math.max(1, count));
  },

  getCritChanceCost: () => {
    const state = get();
    const level = Math.round((state.critChance || 0) * 100);
    const maxLevelsAllowed = Math.round((MAX_CRIT_CHANCE - (state.critChance || 0)) * 100);
    const count = getPurchaseCount(state, 200, 1.35, level, maxLevelsAllowed);
    return getTotalCost(200, 1.35, level, Math.max(1, count));
  },

  upgradeBallDamage: () =>
    set((state) => {
      const count = getPurchaseCount(state, 50, 1.5, state.ballDamage - 1);
      if (count <= 0) return state;
      const cost = getTotalCost(50, 1.5, state.ballDamage - 1, count);
      if (state.score >= cost) {
        const ballDamage = state.ballDamage + count;
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
    set((state) => {
      const level = getBallSpeedLevel(state.ballSpeed) - 1;
      const count = getPurchaseCount(state, 30, 1.3, level);
      if (count <= 0) return state;
      const cost = getTotalCost(30, 1.3, level, count);
      if (state.score >= cost) {
        const ballSpeed = state.ballSpeed + 0.02 * count;
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
    set((state) => {
      const count = getPurchaseCount(state, 100, 2, state.ballCount - 1, MAX_BALL_COUNT - state.ballCount);
      if (count <= 0) return state;
      const cost = getTotalCost(100, 2, state.ballCount - 1, count);
      if (state.score >= cost) {
        const ballCount = state.ballCount + count;
        const score = state.score - cost;
        const newBalls = [];
        for (let i = 0; i < count; i++) {
          newBalls.push(createInitialBall(state.ballSpeed, state.ballDamage));
        }
        const unlockedAchievements = checkAndUnlockAchievements(state, { score, ballCount });
        return {
          score,
          ballCount,
          balls: [...state.balls, ...newBalls],
          unlockedAchievements,
        };
      }
      return state;
    }),

  upgradeCritChance: () =>
    set((state) => {
      const currentCrit = state.critChance || 0;
      const level = Math.round(currentCrit * 100);
      const maxLevelsAllowed = Math.round((MAX_CRIT_CHANCE - currentCrit) * 100);
      const count = getPurchaseCount(state, 200, 1.35, level, maxLevelsAllowed);
      if (count <= 0) return state;
      const cost = getTotalCost(200, 1.35, level, count);
      if (state.score >= cost) {
        const critChance = currentCrit + 0.01 * count;
        const score = state.score - cost;
        const unlockedAchievements = checkAndUnlockAchievements(state, { score, critChance });
        return {
          score,
          critChance,
          unlockedAchievements,
        };
      }
      return state;
    }),
});
