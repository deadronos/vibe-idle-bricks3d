import { effectBus } from '../../systems/EffectEventBus';
import { checkAndUnlockAchievements, getBallSpeedLevel } from '../achievements';
import {
  DEFAULT_BALL_DAMAGE,
  DEFAULT_BALL_SPEED,
  DEFAULT_WAVE,
  MAX_BALL_COUNT,
} from '../constants';
import { createInitialBall, createInitialBricks } from '../createInitials';
import type { GameActions, GameState } from '../types';
import { buildInitialState } from './persistence';
import type { GameStoreSlice } from './types';
import { updateBallDamages, updateBallSpeeds } from './balls';

type ProgressionActions = Pick<
  GameActions,
  | 'addScore'
  | 'damageBrick'
  | 'removeBrick'
  | 'regenerateBricks'
  | 'upgradeBallDamage'
  | 'upgradeBallSpeed'
  | 'upgradeBallCount'
  | 'getBallDamageCost'
  | 'getBallSpeedCost'
  | 'getBallCountCost'
  | 'performPrestige'
  | 'getPrestigeReward'
  | 'resetCombo'
  | 'applyHits'
>;

export const createProgressionSlice: GameStoreSlice<ProgressionActions> = (set, get) => ({
  addScore: (amount) =>
    set((state) => {
      const multipliedAmount = Math.floor(amount * state.prestigeMultiplier);
      const score = state.score + multipliedAmount;
      const unlockedAchievements = checkAndUnlockAchievements(state, { score });
      return {
        score,
        unlockedAchievements,
      };
    }),

  damageBrick: (id, damage) =>
    set((state) => {
      const brick = state.bricks.find((b) => b.id === id);
      if (!brick) return state;

      let actualDamage = damage * state.comboMultiplier;

      if (brick.armorMultiplier) {
        actualDamage = actualDamage * (1 - brick.armorMultiplier);
      }

      const newHealth = brick.health - actualDamage;

      effectBus.emit({
        type: 'brick_hit',
        position: brick.position,
        color: brick.color,
        amount: actualDamage,
      });

      if (newHealth <= 0) {
        effectBus.emit({
          type: 'brick_destroy',
          position: brick.position,
          color: brick.color,
        });

        const scoreGain = Math.floor(brick.value * state.prestigeMultiplier);
        const score = state.score + scoreGain;
        const bricksDestroyed = state.bricksDestroyed + 1;
        const unlockedAchievements = checkAndUnlockAchievements(state, {
          score,
          bricksDestroyed,
        });
        return {
          bricks: state.bricks.filter((b) => b.id !== id),
          score,
          bricksDestroyed,
          unlockedAchievements,
        };
      }

      return {
        bricks: state.bricks.map((b) => (b.id === id ? { ...b, health: newHealth } : b)),
      };
    }),

  removeBrick: (id) =>
    set((state) => ({
      bricks: state.bricks.filter((brick) => brick.id !== id),
    })),

  regenerateBricks: () =>
    set((state) => {
      const nextWave = state.wave + 1;
      const maxWaveReached = Math.max(state.maxWaveReached, nextWave);
      const waveBonus = Math.floor(20 * nextWave);
      const score = state.score + waveBonus;
      const unlockedAchievements = checkAndUnlockAchievements(state, {
        score,
        wave: nextWave,
        maxWaveReached,
      });

      return {
        bricks: createInitialBricks(nextWave),
        wave: nextWave,
        maxWaveReached,
        score,
        unlockedAchievements,
      };
    }),

  getBallDamageCost: () => {
    const { ballDamage } = get();
    return Math.floor(50 * Math.pow(1.5, ballDamage - 1));
  },

  getBallSpeedCost: () => {
    const { ballSpeed } = get();
    const level = getBallSpeedLevel(ballSpeed) - 1;
    return Math.floor(30 * Math.pow(1.3, level));
  },

  getBallCountCost: () => {
    const { ballCount } = get();
    return Math.floor(100 * Math.pow(2, ballCount - 1));
  },

  upgradeBallDamage: () =>
    set((state) => {
      const cost = get().getBallDamageCost();
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
    set((state) => {
      const cost = get().getBallSpeedCost();
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
    set((state) => {
      const cost = get().getBallCountCost();
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

  getPrestigeReward: () => {
    const { maxWaveReached } = get();
    return Math.max(0, Math.floor(Math.sqrt(maxWaveReached - 1)));
  },

  performPrestige: () =>
    set((state) => {
      const reward = get().getPrestigeReward();
      if (reward <= 0) return state;

      const vibeCrystals = state.vibeCrystals + reward;
      const prestigeLevel = state.prestigeLevel + 1;
      const prestigeMultiplier = 1 + vibeCrystals * 0.1;

      return {
        ...buildInitialState(),
        vibeCrystals,
        prestigeLevel,
        prestigeMultiplier,
        balls: [createInitialBall(DEFAULT_BALL_SPEED, DEFAULT_BALL_DAMAGE)],
        bricks: createInitialBricks(DEFAULT_WAVE),
        latestAnnouncement: `Prestiged: +${reward} Vibe Crystal${reward !== 1 ? 's' : ''} (+${Math.round((prestigeMultiplier - 1) * 100)}% score)`,
      } as GameState;
    }),

  resetCombo: () =>
    set(() => ({
      comboCount: 0,
      comboMultiplier: 1,
      lastHitTime: 0,
    })),

  applyHits: (hits) => {
    if (!hits || hits.length === 0) return;
    for (const hit of hits) {
      const fn = get().damageBrick;
      if (fn) fn(hit.brickId, hit.damage);
    }

    if (hits.length >= 2) {
      const state = get();
      const newComboCount = state.comboCount + 1;
      const newComboMultiplier = Math.min(1 + newComboCount * 0.05, 3);
      set({
        comboCount: newComboCount,
        comboMultiplier: newComboMultiplier,
        lastHitTime: Date.now(),
      });
    }
  },
});
