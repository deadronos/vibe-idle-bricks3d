import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHitsSlice, effects } from '../../store/slices/progression/hits';

vi.mock('../../store/achievements', () => ({
  checkAndUnlockAchievements: vi.fn(() => ['mock-achievement']),
}));

vi.mock('../../store/createInitials', () => ({
  createInitialBricks: vi.fn(() => [{ id: 'new-brick' }]),
}));

vi.spyOn(effects, 'emitBrickHit');
vi.spyOn(effects, 'emitBrickDestroy');

describe('hits slice', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSet: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockGet: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let slice: any;

  beforeEach(() => {
    mockSet = vi.fn();
    mockGet = vi.fn();
    slice = createHitsSlice(mockSet, mockGet);
    vi.clearAllMocks();
  });

  describe('damageBrick', () => {
    it('should decrease brick health and emit hit effect', () => {
      const state = {
        bricks: [{ id: 'brick1', health: 10, position: [0, 0, 0], color: 'red', value: 10 }],
        comboMultiplier: 1,
        prestigeMultiplier: 1,
        score: 0,
        bricksDestroyed: 0,
      };

      // Mock set to simulate state update
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSet.mockImplementation((fn: any) => fn(state));

      slice.damageBrick('brick1', 5);

      expect(mockSet).toHaveBeenCalled();
      const updater = mockSet.mock.calls[0][0];
      const result = updater(state);

      expect(result.bricks[0].health).toBe(5);
      expect(effects.emitBrickHit).toHaveBeenCalled();
      expect(effects.emitBrickDestroy).not.toHaveBeenCalled();
    });

    it('should destroy brick when health <= 0', () => {
        const state = {
          bricks: [{ id: 'brick1', health: 5, position: [0, 0, 0], color: 'red', value: 10 }],
          comboMultiplier: 1,
          prestigeMultiplier: 2,
          score: 0,
          bricksDestroyed: 0,
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockSet.mockImplementation((fn: any) => fn(state));

        slice.damageBrick('brick1', 10);

        const updater = mockSet.mock.calls[0][0];
        const result = updater(state);

        expect(result.bricks.length).toBe(0);
        expect(result.score).toBe(20); // 10 * 2
        expect(result.bricksDestroyed).toBe(1);
        expect(effects.emitBrickHit).toHaveBeenCalled();
        expect(effects.emitBrickDestroy).toHaveBeenCalled();
      });
  });

  describe('applyHits', () => {
    it('should call damageBrick for each hit', () => {
        const damageBrickMock = vi.fn();
        mockGet.mockReturnValue({
            damageBrick: damageBrickMock,
            comboCount: 0,
        });

        slice.applyHits([{ brickId: 'brick1', damage: 1 }, { brickId: 'brick2', damage: 2 }]);

        expect(damageBrickMock).toHaveBeenCalledTimes(2);
        expect(damageBrickMock).toHaveBeenCalledWith('brick1', 1);
        expect(damageBrickMock).toHaveBeenCalledWith('brick2', 2);
    });

    it('should update combo if hits >= 2', () => {
        const damageBrickMock = vi.fn();
        mockGet.mockReturnValue({
            damageBrick: damageBrickMock,
            comboCount: 0,
        });

        slice.applyHits([{ brickId: 'brick1', damage: 1 }, { brickId: 'brick2', damage: 2 }]);

        expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
            comboCount: 1,
            comboMultiplier: expect.any(Number),
        }));
    });
  });

  describe('regenerateBricks', () => {
    it('should advance wave and score', () => {
        const state = {
            wave: 1,
            maxWaveReached: 1,
            score: 0,
        };

        slice.regenerateBricks();

        const updater = mockSet.mock.calls[0][0];
        const result = updater(state);

        expect(result.wave).toBe(2);
        expect(result.maxWaveReached).toBe(2);
        expect(result.score).toBe(40); // 20 * 2
        expect(result.bricks).toEqual([{ id: 'new-brick' }]);
    });
  });
});
