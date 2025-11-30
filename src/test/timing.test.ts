import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildInitialState, useGameStore, type GameState } from '../store/gameStore';

/**
 * Timing and frame-rate independence tests
 * Verifies ball spawn queue timing, frame independence, and performance
 */

const resetToKnownState = (overrides: Partial<GameState> = {}) => {
  useGameStore.persist?.clearStorage();
  useGameStore.setState({
    ...buildInitialState(),
    ...overrides,
  });
};

describe('Ball Spawn Queue - Timing', () => {
  beforeEach(() => {
    resetToKnownState();
    vi.clearAllMocks();
  });

  it('should spawn exactly one ball at 500ms intervals', () => {
    useGameStore.setState({
      ballCount: 5,
      ballSpawnQueue: 4,
      lastBallSpawnTime: Date.now(),
    });

    const startBallCount = useGameStore.getState().balls.length;
    let ballCount = startBallCount;

    // Simulate time progression
    for (let i = 0; i < 4; i++) {
      // Advance 500ms
      useGameStore.setState({
        lastBallSpawnTime: Date.now() - 500 * (i + 1),
      });

      useGameStore.getState().tryProcessBallSpawnQueue();
      const currentBallCount = useGameStore.getState().balls.length;

      // Should spawn exactly one ball per interval
      expect(currentBallCount).toBe(ballCount + 1);
      ballCount = currentBallCount;
    }

    // All 4 queued balls should be spawned
    expect(useGameStore.getState().balls.length).toBe(startBallCount + 4);
    expect(useGameStore.getState().ballSpawnQueue).toBe(0);
  });

  it('should not spawn ball if not enough time has passed', () => {
    useGameStore.setState({
      ballCount: 3,
      ballSpawnQueue: 2,
      lastBallSpawnTime: Date.now() - 100, // Only 100ms has passed
    });

    const initialBallCount = useGameStore.getState().balls.length;

    useGameStore.getState().tryProcessBallSpawnQueue();

    // Should not spawn (need 500ms)
    expect(useGameStore.getState().balls.length).toBe(initialBallCount);
    expect(useGameStore.getState().ballSpawnQueue).toBe(2);
  });

  it('should spawn multiple balls if sufficient time has passed', () => {
    useGameStore.setState({
      ballCount: 5,
      ballSpawnQueue: 4,
      lastBallSpawnTime: Date.now() - 1500, // 1.5 seconds = 3 intervals
    });

    const initialBallCount = useGameStore.getState().balls.length;

    // Process queue once - should spawn 1 ball (first 500ms interval)
    useGameStore.getState().tryProcessBallSpawnQueue();
    expect(useGameStore.getState().balls.length).toBe(initialBallCount + 1);
    expect(useGameStore.getState().ballSpawnQueue).toBe(3);

    // Update time again
    useGameStore.setState({
      lastBallSpawnTime: Date.now() - 1000,
    });

    // Process again - should spawn 1 more ball
    useGameStore.getState().tryProcessBallSpawnQueue();
    expect(useGameStore.getState().balls.length).toBe(initialBallCount + 2);
    expect(useGameStore.getState().ballSpawnQueue).toBe(2);
  });

  it('should handle edge case at exactly 500ms', () => {
    useGameStore.setState({
      ballCount: 2,
      ballSpawnQueue: 1,
      lastBallSpawnTime: Date.now() - 500, // Exactly 500ms
    });

    const initialBallCount = useGameStore.getState().balls.length;

    useGameStore.getState().tryProcessBallSpawnQueue();

    // Should spawn (>= 500ms)
    expect(useGameStore.getState().balls.length).toBe(initialBallCount + 1);
    expect(useGameStore.getState().ballSpawnQueue).toBe(0);
  });

  it('should handle edge case at 499ms', () => {
    useGameStore.setState({
      ballCount: 2,
      ballSpawnQueue: 1,
      lastBallSpawnTime: Date.now() - 499, // Just under 500ms
    });

    const initialBallCount = useGameStore.getState().balls.length;

    useGameStore.getState().tryProcessBallSpawnQueue();

    // Should NOT spawn (< 500ms)
    expect(useGameStore.getState().balls.length).toBe(initialBallCount);
    expect(useGameStore.getState().ballSpawnQueue).toBe(1);
  });

  it('should update lastBallSpawnTime on spawn', () => {
    const beforeTime = Date.now();

    useGameStore.setState({
      ballCount: 2,
      ballSpawnQueue: 1,
      lastBallSpawnTime: beforeTime - 1000,
    });

    useGameStore.getState().tryProcessBallSpawnQueue();

    const afterTime = useGameStore.getState().lastBallSpawnTime;
    expect(afterTime).toBeGreaterThanOrEqual(beforeTime);
    expect(afterTime).toBeLessThanOrEqual(Date.now());
  });

  it('should maintain timer state across multiple spawns', () => {
    useGameStore.setState({
      ballCount: 4,
      ballSpawnQueue: 3,
      lastBallSpawnTime: Date.now(),
    });

    const times: number[] = [];

    for (let i = 0; i < 3; i++) {
      // Advance time by 500ms
      useGameStore.setState({
        lastBallSpawnTime: Date.now() - 500 * (i + 1),
      });

      useGameStore.getState().tryProcessBallSpawnQueue();
      times.push(useGameStore.getState().lastBallSpawnTime);
    }

    // Each spawn should update the timer
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeGreaterThanOrEqual(times[i - 1]);
    }
  });
});

describe('Ball Spawn Queue - Frame Rate Independence', () => {
  beforeEach(() => {
    resetToKnownState();
  });

  it('should respect time-based interval, not frame count', () => {
    useGameStore.setState({
      ballCount: 3,
      ballSpawnQueue: 2,
      lastBallSpawnTime: Date.now() - 500, // 500ms ago
    });

    const initialBallCount = useGameStore.getState().balls.length;

    // Call tryProcessBallSpawnQueue 10 times rapidly (high FPS)
    for (let i = 0; i < 10; i++) {
      useGameStore.getState().tryProcessBallSpawnQueue();
    }

    // Should still only spawn 1 ball (not 10)
    expect(useGameStore.getState().balls.length).toBe(initialBallCount + 1);
    expect(useGameStore.getState().ballSpawnQueue).toBe(1);
  });

  it('should handle slow frame rate (low FPS)', () => {
    useGameStore.setState({
      ballCount: 5,
      ballSpawnQueue: 4,
      lastBallSpawnTime: Date.now() - 3000, // 3 seconds = 6 intervals
    });

    const initialBallCount = useGameStore.getState().balls.length;

    // Simulate single frame update (very low FPS scenario)
    useGameStore.getState().tryProcessBallSpawnQueue();

    // Should spawn 1 ball per call, regardless of how much time passed
    expect(useGameStore.getState().balls.length).toBe(initialBallCount + 1);
    expect(useGameStore.getState().ballSpawnQueue).toBe(3);
  });

  it('should handle variable frame rate', () => {
    useGameStore.setState({
      ballCount: 4,
      ballSpawnQueue: 3,
      lastBallSpawnTime: Date.now(),
    });

    // Simulate variable frame rate
    const deltas = [16.67, 33.33, 8.33, 100]; // ms between frames
    let totalTime = 0;
    let spawnCount = 0;

    for (const delta of deltas) {
      totalTime += delta;
      useGameStore.setState({
        lastBallSpawnTime: Date.now() - totalTime,
      });

      const ballsBeforeStart = useGameStore.getState().balls.length;
      useGameStore.getState().tryProcessBallSpawnQueue();
      const ballsAfterEnd = useGameStore.getState().balls.length;

      if (ballsAfterEnd > ballsBeforeStart) {
        spawnCount++;
      }
    }

    // At 500ms intervals: 16.67 + 33.33 + 8.33 = 58.33 < 500 (no spawn)
    // Then +100 = 158.33 < 500 (no spawn)
    // So expected 0 spawns in this scenario
    expect(spawnCount).toBe(0);
  });

  it('should be independent of game state updates frequency', () => {
    useGameStore.setState({
      ballCount: 3,
      ballSpawnQueue: 2,
      lastBallSpawnTime: Date.now() - 500,
    });

    const initialBallCount = useGameStore.getState().balls.length;

    // Perform many state updates
    for (let i = 0; i < 100; i++) {
      useGameStore.setState({ score: i });
    }

    // Now try to spawn - time-based, not update-count based
    useGameStore.getState().tryProcessBallSpawnQueue();

    expect(useGameStore.getState().balls.length).toBe(initialBallCount + 1);
  });
});

describe('Ball Spawn Queue - Delta Time Handling', () => {
  beforeEach(() => {
    resetToKnownState();
  });

  it('should handle very small delta times (high FPS)', () => {
    useGameStore.setState({
      ballCount: 2,
      ballSpawnQueue: 1,
      lastBallSpawnTime: Date.now() - 1, // 1ms ago
    });

    const initialBallCount = useGameStore.getState().balls.length;

    useGameStore.getState().tryProcessBallSpawnQueue();

    // Should not spawn with only 1ms elapsed
    expect(useGameStore.getState().balls.length).toBe(initialBallCount);
  });

  it('should handle very large delta times (lag)', () => {
    useGameStore.setState({
      ballCount: 4,
      ballSpawnQueue: 3,
      lastBallSpawnTime: Date.now() - 5000, // 5 seconds of lag
    });

    const initialBallCount = useGameStore.getState().balls.length;

    // Should still only spawn 1 ball per call
    useGameStore.getState().tryProcessBallSpawnQueue();

    expect(useGameStore.getState().balls.length).toBe(initialBallCount + 1);
    expect(useGameStore.getState().ballSpawnQueue).toBe(2);
  });

  it('should accumulate time correctly across frames', () => {
    useGameStore.setState({
      ballCount: 5,
      ballSpawnQueue: 4,
      lastBallSpawnTime: Date.now(),
    });

    let spawnCount = 0;

    // Simulate frame loop
    for (let frame = 1; frame <= 30; frame++) {
      const timePassed = frame * 16.67; // ~60fps
      useGameStore.setState({
        lastBallSpawnTime: Date.now() - timePassed,
      });

      const ballsBefore = useGameStore.getState().balls.length;
      useGameStore.getState().tryProcessBallSpawnQueue();
      const ballsAfter = useGameStore.getState().balls.length;

      if (ballsAfter > ballsBefore) {
        spawnCount++;
      }
    }

    // At ~500ms intervals at 60fps (every ~30 frames)
    // 30 frames * 16.67ms = 500.1ms - should trigger
    // At ~1000ms: should trigger again
    expect(spawnCount).toBeGreaterThan(0);
  });
});

describe('Ball Spawn Queue - Empty Queue Handling', () => {
  beforeEach(() => {
    resetToKnownState();
  });

  it('should not process queue when queue is 0', () => {
    useGameStore.setState({
      ballSpawnQueue: 0,
      lastBallSpawnTime: Date.now() - 1000,
    });

    const initialBallCount = useGameStore.getState().balls.length;

    useGameStore.getState().tryProcessBallSpawnQueue();

    expect(useGameStore.getState().balls.length).toBe(initialBallCount);
  });

  it('should stop processing after queue is empty', () => {
    useGameStore.setState({
      ballCount: 2,
      ballSpawnQueue: 1,
      lastBallSpawnTime: Date.now() - 500,
    });

    // First call spawns the last ball
    useGameStore.getState().tryProcessBallSpawnQueue();
    expect(useGameStore.getState().ballSpawnQueue).toBe(0);

    const ballCountAfterEmpty = useGameStore.getState().balls.length;

    // Advance time significantly
    useGameStore.setState({
      lastBallSpawnTime: Date.now() - 5000,
    });

    // Second call should not spawn anything
    useGameStore.getState().tryProcessBallSpawnQueue();
    expect(useGameStore.getState().balls.length).toBe(ballCountAfterEmpty);
  });
});

describe('Ball Spawn Queue - forceProcessAllQueuedBalls', () => {
  beforeEach(() => {
    resetToKnownState();
  });

  it('should spawn all queued balls immediately', () => {
    useGameStore.setState({
      ballCount: 10,
      ballSpawnQueue: 9,
    });

    useGameStore.getState().forceProcessAllQueuedBalls();

    expect(useGameStore.getState().balls.length).toBe(10);
    expect(useGameStore.getState().ballSpawnQueue).toBe(0);
  });

  it('should not be affected by lastBallSpawnTime', () => {
    useGameStore.setState({
      ballCount: 5,
      ballSpawnQueue: 4,
      lastBallSpawnTime: Date.now() + 1000, // Future time
    });

    useGameStore.getState().forceProcessAllQueuedBalls();

    expect(useGameStore.getState().balls.length).toBe(5);
    expect(useGameStore.getState().ballSpawnQueue).toBe(0);
  });

  it('should update lastBallSpawnTime on force process', () => {
    const beforeTime = Date.now();

    useGameStore.setState({
      ballCount: 3,
      ballSpawnQueue: 2,
      lastBallSpawnTime: Date.now() - 10000,
    });

    useGameStore.getState().forceProcessAllQueuedBalls();

    const afterTime = useGameStore.getState().lastBallSpawnTime;
    expect(afterTime).toBeGreaterThanOrEqual(beforeTime);
  });

  it('should handle empty queue gracefully', () => {
    useGameStore.setState({
      ballCount: 2,
      ballSpawnQueue: 0,
    });

    const ballCountBefore = useGameStore.getState().balls.length;

    useGameStore.getState().forceProcessAllQueuedBalls();

    expect(useGameStore.getState().balls.length).toBe(ballCountBefore);
    expect(useGameStore.getState().ballSpawnQueue).toBe(0);
  });
});
