import { describe, it, expect } from 'vitest';
import { clampNumber, isDefaultPersisted } from '../../store/persistence/validators';
import {
  DEFAULT_BALL_COUNT,
  DEFAULT_BALL_DAMAGE,
  DEFAULT_BALL_SPEED,
  DEFAULT_WAVE,
} from '../../store/constants';

describe('validators', () => {
  describe('clampNumber', () => {
    it('should return value if it is a number and >= min', () => {
      expect(clampNumber(10, 5, 0)).toBe(10);
    });

    it('should return fallback if value is not a number', () => {
      expect(clampNumber('10', 5, 0)).toBe(5);
      expect(clampNumber(null, 5, 0)).toBe(5);
      expect(clampNumber(undefined, 5, 0)).toBe(5);
    });

    it('should return fallback if value is < min', () => {
      expect(clampNumber(-1, 5, 0)).toBe(5);
    });

    it('should return fallback if value is NaN or Infinity', () => {
      expect(clampNumber(NaN, 5, 0)).toBe(5);
      expect(clampNumber(Infinity, 5, 0)).toBe(5);
    });
  });

  describe('isDefaultPersisted', () => {
    it('should return true for null or undefined', () => {
      expect(isDefaultPersisted(null)).toBe(true);
      expect(isDefaultPersisted(undefined)).toBe(true);
    });

    it('should return true for default state', () => {
      const defaultState = {
        score: 0,
        bricksDestroyed: 0,
        wave: DEFAULT_WAVE,
        maxWaveReached: DEFAULT_WAVE,
        ballDamage: DEFAULT_BALL_DAMAGE,
        ballSpeed: DEFAULT_BALL_SPEED,
        ballCount: DEFAULT_BALL_COUNT,
        unlockedAchievements: [],
      };
      expect(isDefaultPersisted(defaultState)).toBe(true);
    });

    it('should return false if any value is non-default', () => {
      const base = {
        score: 0,
        bricksDestroyed: 0,
        wave: DEFAULT_WAVE,
        maxWaveReached: DEFAULT_WAVE,
        ballDamage: DEFAULT_BALL_DAMAGE,
        ballSpeed: DEFAULT_BALL_SPEED,
        ballCount: DEFAULT_BALL_COUNT,
        unlockedAchievements: [],
      };

      expect(isDefaultPersisted({ ...base, score: 10 })).toBe(false);
      expect(isDefaultPersisted({ ...base, wave: 2 })).toBe(false);
      expect(isDefaultPersisted({ ...base, unlockedAchievements: ['test'] })).toBe(false);
    });
  });
});
