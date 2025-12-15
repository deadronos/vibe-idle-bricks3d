import { describe, it, expect, vi } from 'vitest';
import {
  calculateBallDamageCost,
  calculateBallSpeedCost,
  calculateBallCountCost,
  calculateCritChanceCost,
  createUpgradesSlice,
} from '../../store/slices/progression/upgrades';
import * as createInitials from '../../store/createInitials';
import * as balls from '../../store/slices/balls';

vi.mock('../../store/achievements', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = await importOriginal<any>();
  return {
    ...actual,
    checkAndUnlockAchievements: vi.fn(() => ['mock-achievement']),
    getBallSpeedLevel: (speed: number) => Math.round((speed - 0.1) / 0.02) + 1,
  };
});

vi.mock('../../store/createInitials', () => ({
  createInitialBall: vi.fn(() => ({ id: 'new-ball' })),
}));

vi.mock('../../store/slices/balls', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateBallDamages: vi.fn((balls, damage) => balls.map((b: any) => ({ ...b, damage }))),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateBallSpeeds: vi.fn((balls, speed) => balls.map((b: any) => ({ ...b, speed }))),
}));

describe('upgrades slice', () => {
  describe('calculations', () => {
    it('calculateBallDamageCost', () => {
      expect(calculateBallDamageCost(1)).toBe(50);
      expect(Math.floor(calculateBallDamageCost(2))).toBe(75);
    });

    it('calculateBallSpeedCost', () => {
        // level 1 (speed 0.1) -> 30
      expect(calculateBallSpeedCost(0.1)).toBe(30);
    });

    it('calculateBallCountCost', () => {
      expect(calculateBallCountCost(1)).toBe(100);
      expect(calculateBallCountCost(2)).toBe(200);
    });

    it('calculateCritChanceCost', () => {
      // level 0 (chance 0) -> 200
      expect(calculateCritChanceCost(0)).toBe(200);
      // level 1 (chance 0.01) -> 200 * 1.5 = 300
      expect(calculateCritChanceCost(0.01)).toBe(300);
    });
  });

  describe('actions', () => {
    const mockSet = vi.fn();
    const mockGet = vi.fn();

    it('upgradeBallDamage should upgrade if score is sufficient', () => {
      const slice = createUpgradesSlice(mockSet, mockGet);
      const state = {
        score: 100,
        ballDamage: 1,
        balls: [{ id: 'ball1', damage: 1 }],
      };

      slice.upgradeBallDamage();
      const updater = mockSet.mock.calls[0][0];
      const result = updater(state);

      expect(result.score).toBe(50); // 100 - 50
      expect(result.ballDamage).toBe(2);
      expect(balls.updateBallDamages).toHaveBeenCalled();
    });

    it('upgradeBallSpeed should upgrade if score is sufficient', () => {
        mockSet.mockClear();
        const slice = createUpgradesSlice(mockSet, mockGet);
        const state = {
          score: 100,
          ballSpeed: 0.1,
          balls: [{ id: 'ball1', speed: 0.1 }],
        };

        slice.upgradeBallSpeed();
        const updater = mockSet.mock.calls[0][0];
        const result = updater(state);

        expect(result.score).toBe(70); // 100 - 30
        expect(result.ballSpeed).toBeCloseTo(0.12);
        expect(balls.updateBallSpeeds).toHaveBeenCalled();
      });

    it('upgradeBallCount should upgrade if score is sufficient and below max', () => {
        mockSet.mockClear();
        const slice = createUpgradesSlice(mockSet, mockGet);
        const state = {
          score: 200,
          ballCount: 1,
          ballSpeed: 0.1,
          ballDamage: 1,
          balls: [{ id: 'ball1' }],
        };

        slice.upgradeBallCount();
        const updater = mockSet.mock.calls[0][0];
        const result = updater(state);

        expect(result.score).toBe(100); // 200 - 100
        expect(result.ballCount).toBe(2);
        expect(result.balls.length).toBe(2);
        expect(createInitials.createInitialBall).toHaveBeenCalled();
      });

      it('should not upgrade if score is insufficient', () => {
        mockSet.mockClear();
        const slice = createUpgradesSlice(mockSet, mockGet);
        const state = {
          score: 0,
          ballDamage: 1,
          balls: [],
        };

        slice.upgradeBallDamage();
        const updater = mockSet.mock.calls[0][0];
        const result = updater(state);

        expect(result).toEqual(state);
      });

      it('upgradeCritChance should upgrade if score is sufficient', () => {
        mockSet.mockClear();
        const slice = createUpgradesSlice(mockSet, mockGet);
        const state = {
          score: 300,
          critChance: 0,
        };

        slice.upgradeCritChance();
        const updater = mockSet.mock.calls[0][0];
        const result = updater(state);

        expect(result.score).toBe(100); // 300 - 200
        expect(result.critChance).toBeCloseTo(0.01);
      });

      it('upgradeCritChance should not upgrade if score insufficient', () => {
        mockSet.mockClear();
        const slice = createUpgradesSlice(mockSet, mockGet);
        const state = {
          score: 0,
          critChance: 0,
        };
        slice.upgradeCritChance();
        const updater = mockSet.mock.calls[0][0];
        const result = updater(state);
        expect(result).toEqual(state);
      });

      it('upgradeCritChance should not upgrade if maxed out', () => {
        mockSet.mockClear();
        const slice = createUpgradesSlice(mockSet, mockGet);
        const state = {
          score: 10000,
          critChance: 0.5,
        };
        slice.upgradeCritChance();
        const updater = mockSet.mock.calls[0][0];
        const result = updater(state);
        expect(result).toEqual(state);
      });
  });
});
