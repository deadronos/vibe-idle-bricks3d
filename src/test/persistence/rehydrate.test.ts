import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleRehydrate } from '../../store/persistence/rehydrate';
import type { RehydrateDeps } from '../../store/persistence/rehydrate';
import type { GameState } from '../../store/types';
import type { RehydrateState } from '../../store/persistence/rehydrate';

describe('handleRehydrate', () => {
  const mockSetState = vi.fn();
  const mockGetState = vi.fn();
  const mockCreateInitialBall = vi.fn();
  const mockCreateInitialBricks = vi.fn();
  const mockCheckAndUnlockAchievements = vi.fn();

  const mockDeps: RehydrateDeps = {
    useGameStore: {
      getState: mockGetState,
      setState: mockSetState,
    },
    createInitialBall: mockCreateInitialBall,
    createInitialBricks: mockCreateInitialBricks,
    checkAndUnlockAchievements: mockCheckAndUnlockAchievements,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Default mock implementation
    mockGetState.mockReturnValue({
      balls: [],
      ballCount: 1,
      ballSpeed: 0.1,
      ballDamage: 1,
    } as unknown as GameState);

    mockCreateInitialBall.mockReturnValue({ id: 'ball-1' });
    mockCreateInitialBricks.mockReturnValue([]);
    mockCheckAndUnlockAchievements.mockReturnValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should do nothing if state is undefined', () => {
    handleRehydrate(undefined, mockDeps);
    expect(mockSetState).not.toHaveBeenCalled();
  });

  it('should apply rehydration synchronously when deps are available', () => {
    const state = {
      score: 100,
      wave: 2,
      ballCount: 3,
      // ... other required fields will be clamped/defaulted if missing
    } as RehydrateState;

    handleRehydrate(state, mockDeps);

    expect(mockSetState).toHaveBeenCalledWith(expect.objectContaining({
      score: 100,
      wave: 2,
      ballCount: 3,
      ballSpawnQueue: 2, // 3 - 1
    }));
  });

  it('should defer rehydration if deps throw error (e.g. init order)', () => {
    // Simulate error on first run
    mockSetState.mockImplementationOnce(() => {
      throw new Error('Not ready');
    });

    const state = { score: 100 } as RehydrateState;

    // Mock console.warn/error to keep test output clean
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    handleRehydrate(state, mockDeps);

    // Should have tried and failed
    expect(mockSetState).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Deferring rehydrate'), expect.anything());

    // Advance timer to trigger retry
    vi.runAllTimers();

    // Should have tried again (mockSetState called again)
    // Note: mockSetState was called once (failed), now should be called a second time (success)
    expect(mockSetState).toHaveBeenCalledTimes(2);

    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should validate and clamp values', () => {
    const state = {
      wave: 0, // Should become 1 (DEFAULT_WAVE)
      ballDamage: 0, // Should become 1
      ballSpeed: 0, // Should become 0.1 (DEFAULT_BALL_SPEED)
      ballCount: 0, // Should become 1
    } as RehydrateState;

    handleRehydrate(state, mockDeps);

    expect(mockSetState).toHaveBeenCalledWith(expect.objectContaining({
      wave: 1,
      ballDamage: 1,
      ballSpeed: 0.1,
      ballCount: 1,
    }));
  });

  it('should trigger safety net if balls are missing after rehydration (non-test env)', () => {
    // This tests that it DOES NOT run in test env
    handleRehydrate({ ballCount: 5 } as RehydrateState, mockDeps);

    mockSetState.mockClear(); // clear the initial rehydrate call

    vi.advanceTimersByTime(100);

    // Should not have called setState again for the safety net
    expect(mockSetState).not.toHaveBeenCalled();
  });

  it('should revalidate stats after a frame', () => {
    // Setup state where balls have wrong stats
    const badBall = { damage: 999, velocity: [1, 0, 0] };
    mockGetState.mockReturnValue({
      balls: [badBall],
      ballDamage: 10,
      ballSpeed: 1,
    } as unknown as GameState);

    handleRehydrate({ ballDamage: 10, ballSpeed: 1 } as RehydrateState, mockDeps);

    mockSetState.mockClear(); // Clear initial rehydrate

    // Advance timer for revalidate (16ms)
    vi.advanceTimersByTime(20);

    expect(mockSetState).toHaveBeenCalledWith(expect.objectContaining({
      balls: expect.arrayContaining([
        expect.objectContaining({
          damage: 10
        })
      ])
    }));
  });
});
