import {
  DEFAULT_BALL_COUNT,
  DEFAULT_BALL_DAMAGE,
  DEFAULT_BALL_SPEED,
  DEFAULT_WAVE,
} from '../constants';
import type { GameState } from '../types';

export const clampNumber = (value: unknown, fallback: number, min: number): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min ? value : fallback;

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
