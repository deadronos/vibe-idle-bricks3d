import type { Vector3Tuple } from 'three';
import type { GameStoreSlice } from '../types';
import { effectBus } from '../../../systems/EffectEventBus';
import { checkAndUnlockAchievements } from '../../achievements';
import { createInitialBricks } from '../../createInitials';
import type { Brick, GameState } from '../../types';

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
 * Internal helper to process a single hit on a brick list.
 * This is used to batch multiple hits into a single state update.
 */
const processSingleHit = (
  state: GameState,
  workingBricks: Brick[],
  hit: { brickId: string; damage: number }
): { nextBricks: Brick[]; scoreGain: number; bricksDestroyedGain: number } => {
  const brickIndex = workingBricks.findIndex((b) => b.id === hit.brickId);
  if (brickIndex === -1) {
    return { nextBricks: workingBricks, scoreGain: 0, bricksDestroyedGain: 0 };
  }

  const brick = workingBricks[brickIndex];
  let actualDamage = hit.damage * state.comboMultiplier;

  if (brick.armorMultiplier) {
    actualDamage = actualDamage * (1 - brick.armorMultiplier);
  }

  const newHealth = brick.health - actualDamage;

  effects.emitBrickHit(brick.position, brick.color, actualDamage);

  if (newHealth <= 0) {
    effects.emitBrickDestroy(brick.position, brick.color);

    let scoreGain = Math.floor(brick.value * state.prestigeMultiplier);
    let bricksDestroyedGain = 1;
    let nextBricks = workingBricks.filter((b) => b.id !== hit.brickId);

    if (brick.type === 'explosive') {
      const radiusSq = 2.5 * 2.5;
      const damageAmount = Math.max(1, Math.floor(brick.maxHealth * 0.5));
      const survivors: Brick[] = [];

      for (const other of nextBricks) {
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
            bricksDestroyedGain++;
          } else {
            survivors.push({ ...other, health: h });
          }
        } else {
          survivors.push(other);
        }
      }
      nextBricks = survivors;
    }

    return { nextBricks, scoreGain, bricksDestroyedGain };
  }

  const nextBricks = workingBricks.map((b, idx) =>
    idx === brickIndex ? { ...b, health: newHealth } : b
  );
  return { nextBricks, scoreGain: 0, bricksDestroyedGain: 0 };
};

/**
 * Creates the hits slice of the game store.
 * Manages brick damage, removal, combo system, and wave regeneration.
 *
 * @param {Function} set - The Zustand set function.
 * @param {Function} get - The Zustand get function.
 * @param {Object} store - The Zustand store API.
 * @returns {Object} The hits slice actions.
 */
export const createHitsSlice: GameStoreSlice<{
  damageBrick: (id: string, damage: number) => void;
  removeBrick: (id: string) => void;
  resetCombo: () => void;
  applyHits: (hits: { brickId: string; damage: number }[]) => void;
  regenerateBricks: () => void;
}> = (set, get) => ({
  damageBrick: (id: string, damage: number) => {
    get().applyHits?.([{ brickId: id, damage }]);
  },

  removeBrick: (id: string) =>
    set((state) => ({
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

    set((state) => {
      let currentBricks = state.bricks;
      let totalScoreGain = 0;
      let totalBricksDestroyedGain = 0;

      for (const hit of hits) {
        const { nextBricks, scoreGain, bricksDestroyedGain } = processSingleHit(
          state,
          currentBricks,
          hit
        );
        currentBricks = nextBricks;
        totalScoreGain += scoreGain;
        totalBricksDestroyedGain += bricksDestroyedGain;
      }

      const score = state.score + totalScoreGain;
      const bricksDestroyed = state.bricksDestroyed + totalBricksDestroyedGain;

      let comboUpdate = {};
      if (hits.length >= 2) {
        const newComboCount = state.comboCount + 1;
        const newComboMultiplier = Math.min(1 + newComboCount * 0.05, 3);
        comboUpdate = {
          comboCount: newComboCount,
          comboMultiplier: newComboMultiplier,
          lastHitTime: Date.now(),
        };
      }

      const unlockedAchievements = checkAndUnlockAchievements(state, {
        score,
        bricksDestroyed,
      });

      return {
        bricks: currentBricks,
        score,
        bricksDestroyed,
        unlockedAchievements,
        ...comboUpdate,
      };
    });
  },

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
});
