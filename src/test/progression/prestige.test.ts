import { describe, it, expect, vi } from 'vitest';
import { calculatePrestigeReward, createPrestigeSlice } from '../../store/slices/progression/prestige';

vi.mock('../../store/slices/persistence', () => ({
  buildInitialState: vi.fn(() => ({
    score: 0,
    wave: 1,
  })),
}));

vi.mock('../../store/createInitials', () => ({
  createInitialBall: vi.fn(() => ({ id: 'initial-ball' })),
  createInitialBricks: vi.fn(() => [{ id: 'brick1' }]),
}));

describe('prestige slice', () => {
  describe('calculatePrestigeReward', () => {
    it('should return correct reward', () => {
      expect(calculatePrestigeReward(1)).toBe(0);
      expect(calculatePrestigeReward(2)).toBe(1); // sqrt(1) = 1
      expect(calculatePrestigeReward(5)).toBe(2); // sqrt(4) = 2
      expect(calculatePrestigeReward(10)).toBe(3); // sqrt(9) = 3
    });
  });

  describe('performPrestige', () => {
    it('should reset state and award crystals if eligible', () => {
      const mockSet = vi.fn();
      const mockGet = vi.fn();
      const slice = createPrestigeSlice(mockSet, mockGet);

      const state = {
        maxWaveReached: 5,
        vibeCrystals: 0,
        prestigeLevel: 0,
        prestigeMultiplier: 1,
      };

      slice.performPrestige();
      const updater = mockSet.mock.calls[0][0];
      const result = updater(state);

      expect(result.vibeCrystals).toBe(2);
      expect(result.prestigeLevel).toBe(1);
      expect(result.prestigeMultiplier).toBe(1.2); // 1 + 2 * 0.1
      expect(result.balls[0].id).toBe('initial-ball');
      expect(result.bricks[0].id).toBe('brick1');
      expect(result.latestAnnouncement).toContain('Prestiged: +2');
    });

    it('should not prestige if reward is 0', () => {
        const mockSet = vi.fn();
        const mockGet = vi.fn();
        const slice = createPrestigeSlice(mockSet, mockGet);

        const state = {
          maxWaveReached: 1,
          vibeCrystals: 0,
        };

        slice.performPrestige();
        const updater = mockSet.mock.calls[0][0];
        const result = updater(state);

        expect(result).toBe(state);
    });
  });
});
