import { describe, it, expect, vi } from 'vitest';
import { calculateScoreAmount, createScoreSlice } from '../../store/slices/progression/score';
import * as achievements from '../../store/achievements';

vi.mock('../../store/achievements', () => ({
  checkAndUnlockAchievements: vi.fn(() => ['mock-achievement']),
}));

describe('score slice', () => {
  describe('calculateScoreAmount', () => {
    it('should multiply amount by prestige multiplier and floor it', () => {
      expect(calculateScoreAmount(10, 1.5)).toBe(15);
      expect(calculateScoreAmount(10, 1.1)).toBe(11);
      expect(calculateScoreAmount(10.5, 1)).toBe(10);
    });
  });

  describe('addScore', () => {
    it('should update score and achievements', () => {
      const set = vi.fn();
      const slice = createScoreSlice(set);

      // Simulate the set function calling the updater
      // We can't easily mock the set implementation fully here without more boilerplate,
      // but we can check if it calls set with a function.

      slice.addScore(50);

      expect(set).toHaveBeenCalled();
      const updater = set.mock.calls[0][0];

      const mockState = {
        score: 100,
        prestigeMultiplier: 2,
      };

      const result = updater(mockState);

      expect(result.score).toBe(200); // 100 + 50 * 2
      expect(result.unlockedAchievements).toEqual(['mock-achievement']);
      expect(achievements.checkAndUnlockAchievements).toHaveBeenCalledWith(
        mockState,
        { score: 200 }
      );
    });
  });
});
