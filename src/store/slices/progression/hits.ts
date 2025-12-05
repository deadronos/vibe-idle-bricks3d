import type { Vector3Tuple } from 'three';
import { effectBus } from '../../../systems/EffectEventBus';
import { checkAndUnlockAchievements } from '../../achievements';
import { createInitialBricks } from '../../createInitials';
import type { GameState } from '../../types';

export const effects = {
  emitBrickHit: (position: Vector3Tuple, color: string, amount: number) => {
    effectBus.emit({
      type: 'brick_hit',
      position,
      color,
      amount,
    });
  },
  emitBrickDestroy: (position: Vector3Tuple, color: string) => {
    effectBus.emit({
      type: 'brick_destroy',
      position,
      color,
    });
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createHitsSlice = (set: any, get: any) => ({
  damageBrick: (id: string, damage: number) =>
    set((state: GameState) => {
      const brick = state.bricks.find((b) => b.id === id);
      if (!brick) return state;

      let actualDamage = damage * state.comboMultiplier;

      if (brick.armorMultiplier) {
        actualDamage = actualDamage * (1 - brick.armorMultiplier);
      }

      const newHealth = brick.health - actualDamage;

      effects.emitBrickHit(brick.position, brick.color, actualDamage);

      if (newHealth <= 0) {
        effects.emitBrickDestroy(brick.position, brick.color);

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

  removeBrick: (id: string) =>
    set((state: GameState) => ({
      bricks: state.bricks.filter((brick) => brick.id !== id),
    })),

  resetCombo: () =>
    set(() => ({
      comboCount: 0,
      comboMultiplier: 1,
      lastHitTime: 0,
    })),

  applyHits: (hits: { brickId: string; damage: number }[]) => {
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

  regenerateBricks: () =>
    set((state: GameState) => {
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
});
