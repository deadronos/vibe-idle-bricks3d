import {
  DEFAULT_BALL_COUNT,
  DEFAULT_BALL_DAMAGE,
  DEFAULT_BALL_SPEED,
  DEFAULT_WAVE,
} from '../constants';
import type { GameState } from '../types';

/**
 * Validates a number, ensuring it's finite and above a minimum value.
 *
 * @param {unknown} value - The value to check.
 * @param {number} fallback - The fallback value if invalid.
 * @param {number} min - The minimum allowed value.
 * @returns {number} The valid number.
 */
export const clampNumber = (value: unknown, fallback: number, min: number): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min ? value : fallback;

/**
 * Checks if the persisted state matches the default (initial) state.
 * Used to determine if a state represents meaningful progress.
 *
 * @param {Partial<GameState> | null | undefined} s - The state to check.
 * @returns {boolean} True if the state is default or empty.
 */
export const isDefaultPersisted = (s: Partial<GameState> | null | undefined): boolean =>
  !s ||
  (s.score === 0 &&
    s.bricksDestroyed === 0 &&
    s.wave === DEFAULT_WAVE &&
    s.maxWaveReached === DEFAULT_WAVE &&
    s.ballDamage === DEFAULT_BALL_DAMAGE &&
    s.ballSpeed === DEFAULT_BALL_SPEED &&
    s.ballCount === DEFAULT_BALL_COUNT &&
    (!Array.isArray(s.unlockedAchievements) || s.unlockedAchievements.length === 0));
