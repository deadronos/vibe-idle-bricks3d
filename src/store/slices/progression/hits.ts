import type { Vector3Tuple } from 'three';
import { effectBus } from '../../../systems/EffectEventBus';
import { checkAndUnlockAchievements } from '../../achievements';
import { createInitialBricks } from '../../createInitials';
import type { GameState } from '../../types';

/**
 * Collection of side-effect functions for brick hits.
 * Emits events to the effect bus for visual feedback.
 */
export const effects = {
  /**
   * Emits a brick hit event.
   *
   * @param {Vector3Tuple} position - The position of the hit.
   * @param {string} color - The color of the brick.
   * @param {number} amount - The damage amount.
   */
  emitBrickHit: (position: Vector3Tuple, color: string, amount: number) => {
    effectBus.emit({
      type: 'brick_hit',
      position,
      color,
      amount,
    });
  },
  /**
   * Emits a brick destroy event.
   *
   * @param {Vector3Tuple} position - The position of the destroyed brick.
   * @param {string} color - The color of the brick.
   */
  emitBrickDestroy: (position: Vector3Tuple, color: string) => {
    effectBus.emit({
      type: 'brick_destroy',
      position,
      color,
    });
  },
};

/**
 * Creates the hits slice of the game store.
 * Manages brick damage, removal, combo system, and wave regeneration.
 *
 * @param {Function} set - The Zustand set function.
 * @param {Function} get - The Zustand get function.
 * @returns {Object} The hits slice actions.
 */
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

        let scoreGain = Math.floor(brick.value * state.prestigeMultiplier);
        let score = state.score + scoreGain;
        let bricksDestroyed = state.bricksDestroyed + 1;

        let remainingBricks = state.bricks.filter((b) => b.id !== id);

        if (brick.type === 'explosive') {
          const radiusSq = 2.5 * 2.5;
          const damageAmount = Math.max(1, Math.floor(brick.maxHealth * 0.5));
          const survivors: typeof remainingBricks = [];

          for (const other of remainingBricks) {
            const dx = other.position[0] - brick.position[0];
            const dy = other.position[1] - brick.position[1];
            const dz = other.position[2] - brick.position[2];
            const distSq = dx * dx + dy * dy + dz * dz;

            if (distSq <= radiusSq) {
              const h = other.health - damageAmount;
              effects.emitBrickHit(other.position, other.color, damageAmount);

              if (h <= 0) {
                effects.emitBrickDestroy(other.position, other.color);
                scoreGain += Math.floor(other.value * state.prestigeMultiplier);
                score += Math.floor(other.value * state.prestigeMultiplier);
                bricksDestroyed++;
              } else {
                survivors.push({ ...other, health: h });
              }
            } else {
              survivors.push(other);
            }
          }
          remainingBricks = survivors;
        }

        const unlockedAchievements = checkAndUnlockAchievements(state, {
          score,
          bricksDestroyed,
        });
        return {
          bricks: remainingBricks,
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
