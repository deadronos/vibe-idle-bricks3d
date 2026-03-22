import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHitsSlice } from '../../store/slices/progression/hits';
import type { Brick } from '../../store/types';

const mockCheckAchievements = vi.fn(() => []);
vi.mock('../../store/achievements', () => ({
  checkAndUnlockAchievements: () => mockCheckAchievements(),
}));

vi.mock('../../store/createInitials', () => ({
  createInitialBricks: () => [{ id: 'new-brick' }],
}));

describe('hits slice', () => {
  let mockSet: any;
  let mockGet: any;
  let slice: any;

  beforeEach(() => {
    mockSet = vi.fn();
    mockGet = vi.fn();
    slice = createHitsSlice(mockSet, mockGet, {} as any);
  });

  describe('damageBrick', () => {
    it('should delegate to applyHits', () => {
      const applyHitsMock = vi.fn();
      mockGet.mockReturnValue({ applyHits: applyHitsMock });

      slice.damageBrick('brick1', 10);
      expect(applyHitsMock).toHaveBeenCalledWith([{ brickId: 'brick1', damage: 10 }]);
    });
  });

  describe('applyHits', () => {
    it('should decrease brick health and emit hit effect', () => {
      const state = {
        bricks: [
          { id: 'brick1', health: 10, position: [0, 0, 0], color: 'red', value: 10 },
        ],
        score: 0,
        bricksDestroyed: 0,
        comboMultiplier: 1,
        prestigeMultiplier: 1,
        unlockedAchievements: [],
      };

      mockSet.mockImplementation((fn: any) => {
        const result = fn(state);
        expect(result.bricks[0].health).toBe(5);
      });

      slice.applyHits([{ brickId: 'brick1', damage: 5 }]);
    });

    it('should destroy brick when health <= 0', () => {
      const state = {
        bricks: [
          { id: 'brick1', health: 10, position: [0, 0, 0], color: 'red', value: 10 },
        ],
        score: 0,
        bricksDestroyed: 0,
        comboMultiplier: 1,
        prestigeMultiplier: 1,
        unlockedAchievements: [],
      };

      mockSet.mockImplementation((fn: any) => {
        const result = fn(state);
        expect(result.bricks.length).toBe(0);
        expect(result.score).toBe(10);
        expect(result.bricksDestroyed).toBe(1);
      });

      slice.applyHits([{ brickId: 'brick1', damage: 10 }]);
    });

    it('should update combo if hits >= 2', () => {
        const state = {
            bricks: [{ id: 'b1', health: 100, position: [0,0,0] }, { id: 'b2', health: 100, position: [0,0,0] }],
            comboCount: 0,
            comboMultiplier: 1,
            score: 0,
            bricksDestroyed: 0,
            prestigeMultiplier: 1,
        };

        mockSet.mockImplementation((fn: any) => {
            const result = fn(state);
            expect(result.comboCount).toBe(1);
            expect(result.comboMultiplier).toBeGreaterThan(1);
        });

        slice.applyHits([{ brickId: 'b1', damage: 1 }, { brickId: 'b2', damage: 1 }]);
    });
  });
});
