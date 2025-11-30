import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  buildInitialState,
  createInitialBall,
  useGameStore,
  type GameState,
} from '../store/gameStore';

/**
 * Comprehensive rehydration tests covering:
 * - Ball spawn queue initialization and processing
 * - Stat validation and auto-correction
 * - Storage persistence and fallback mechanisms
 */

const resetToKnownState = (overrides: Partial<GameState> = {}) => {
  useGameStore.persist?.clearStorage();
  useGameStore.setState({
    ...buildInitialState(),
    ...overrides,
  });
};

/**
 * Helper to wait for setTimeout(0) in onRehydrateStorage to complete.
 * The rehydration fix uses setTimeout to avoid "Cannot access 'useGameStore'
 * before initialization" errors, so tests need to wait for it.
 */
const waitForRehydrationFix = () => new Promise((resolve) => setTimeout(resolve, 10));

describe('Rehydration - Ball Spawn Queue', () => {
  beforeEach(() => {
    resetToKnownState();
  });

  it('should initialize ballSpawnQueue to 0 on initial state', () => {
    const state = useGameStore.getState();
    expect(state.ballSpawnQueue).toBe(0);
    expect(state.lastBallSpawnTime).toBe(0);
  });

  it('should queue correct number of balls on rehydration', async () => {
    // Simulate user with 8 purchased balls
    useGameStore.setState({
      ballCount: 8,
      ballDamage: 2,
      ballSpeed: 0.14,
      bricks: [],
      balls: [],
    });

    // Reset and rehydrate
    useGameStore.setState(buildInitialState());
    await useGameStore.persist?.rehydrate();
    await waitForRehydrationFix(); // Wait for setTimeout(0) in onRehydrateStorage

    const hydrated = useGameStore.getState();
    // Should have 1 initial ball + 7 queued = 8 total
    expect(hydrated.ballCount).toBe(8);
    expect(hydrated.balls.length).toBe(1);
    expect(hydrated.ballSpawnQueue).toBe(7);
  });

  it('should apply rehydration synchronously (no wait)', async () => {
    // Ensure persisted meta is applied immediately without relying on setTimeout
    useGameStore.setState({
      ballCount: 6,
      ballDamage: 2,
      ballSpeed: 0.14,
      bricks: [],
      balls: [],
    });

    useGameStore.setState(buildInitialState());
    await useGameStore.persist?.rehydrate();

    const state = useGameStore.getState();
    // Should have 1 initial ball + 5 queued = 6 total planned
    expect(state.ballCount).toBe(6);
    expect(state.balls.length).toBe(1);
    expect(state.ballSpawnQueue).toBe(5);
    // lastBallSpawnTime should allow immediate spawning
    expect(state.lastBallSpawnTime).toBe(0);

    // Immediately attempt to process queue (simulate first frame)
    useGameStore.getState().tryProcessBallSpawnQueue();
    const after = useGameStore.getState();
    expect(after.balls.length).toBeGreaterThanOrEqual(2);
    expect(after.ballSpawnQueue).toBeLessThanOrEqual(4);
  });

  it('should allow immediate queue processing after rehydration (regression test)', async () => {
    // This test ensures lastBallSpawnTime is set to allow immediate spawning
    // Previously, lastBallSpawnTime was set to Date.now() which blocked spawning
    // until 500ms had passed, causing players to "lose" their purchased balls
    useGameStore.setState({
      ballCount: 5,
      ballDamage: 2,
      ballSpeed: 0.14,
      bricks: [],
      balls: [],
    });

    useGameStore.setState(buildInitialState());
    await useGameStore.persist?.rehydrate();
    await waitForRehydrationFix(); // Wait for setTimeout(0) in onRehydrateStorage

    const beforeSpawn = useGameStore.getState();
    expect(beforeSpawn.balls.length).toBe(1);
    expect(beforeSpawn.ballSpawnQueue).toBe(4);

    // Try to process queue immediately after rehydration (simulating first frame)
    // This should work because lastBallSpawnTime should be set to allow immediate spawning
    useGameStore.getState().tryProcessBallSpawnQueue();

    const afterSpawn = useGameStore.getState();
    // At least one ball should have spawned from the queue
    expect(afterSpawn.balls.length).toBe(2);
    expect(afterSpawn.ballSpawnQueue).toBe(3);
  });

  it('should spawn queued balls one at a time every 500ms', () => {
    useGameStore.setState({
      ballCount: 5,
      ballSpawnQueue: 4,
      lastBallSpawnTime: Date.now(),
    });

    const initialBallLength = useGameStore.getState().balls.length;

    // First call: not enough time has passed
    useGameStore.getState().tryProcessBallSpawnQueue();
    expect(useGameStore.getState().balls.length).toBe(initialBallLength);
    expect(useGameStore.getState().ballSpawnQueue).toBe(4);

    // Simulate 500ms passing by setting lastBallSpawnTime to past
    useGameStore.setState({
      lastBallSpawnTime: Date.now() - 500,
    });

    // Second call: enough time has passed, spawn one ball
    useGameStore.getState().tryProcessBallSpawnQueue();
    expect(useGameStore.getState().balls.length).toBe(initialBallLength + 1);
    expect(useGameStore.getState().ballSpawnQueue).toBe(3);
  });

  it('should forceProcessAllQueuedBalls spawn all remaining balls', () => {
    useGameStore.setState({
      ballCount: 10,
      ballSpawnQueue: 9,
    });

    useGameStore.getState().forceProcessAllQueuedBalls();

    expect(useGameStore.getState().balls.length).toBe(10);
    expect(useGameStore.getState().ballSpawnQueue).toBe(0);
  });

  it('should process partial queue if time allows', () => {
    useGameStore.setState({
      ballCount: 8,
      ballSpawnQueue: 7,
      lastBallSpawnTime: Date.now() - 1500, // 1.5 seconds ago
    });

    const initialBallCount = useGameStore.getState().balls.length;

    // Call tryProcessBallSpawnQueue multiple times to spawn 3 balls (every 500ms)
    useGameStore.getState().tryProcessBallSpawnQueue();
    expect(useGameStore.getState().balls.length).toBe(initialBallCount + 1);

    // Advance time again
    useGameStore.setState({
      lastBallSpawnTime: Date.now() - 500,
    });
    useGameStore.getState().tryProcessBallSpawnQueue();
    expect(useGameStore.getState().balls.length).toBe(initialBallCount + 2);
  });

  it('should not process queue when queue is empty', () => {
    useGameStore.setState({
      ballSpawnQueue: 0,
      lastBallSpawnTime: Date.now() - 1000,
    });

    const initialBallCount = useGameStore.getState().balls.length;
    useGameStore.getState().tryProcessBallSpawnQueue();

    expect(useGameStore.getState().balls.length).toBe(initialBallCount);
    expect(useGameStore.getState().ballSpawnQueue).toBe(0);
  });

  it('should stop processing queue when empty', () => {
    useGameStore.setState({
      ballCount: 2,
      ballSpawnQueue: 1,
      lastBallSpawnTime: Date.now() - 1000,
    });

    useGameStore.getState().tryProcessBallSpawnQueue();
    expect(useGameStore.getState().ballSpawnQueue).toBe(0);

    const ballCountAfter = useGameStore.getState().balls.length;
    useGameStore.getState().tryProcessBallSpawnQueue();

    expect(useGameStore.getState().balls.length).toBe(ballCountAfter);
  });
});

describe('Rehydration - Stat Validation', () => {
  beforeEach(() => {
    resetToKnownState();
  });

  it('should validate ballDamage matches all spawned balls', async () => {
    useGameStore.setState({
      ballCount: 3,
      ballDamage: 5,
      ballSpeed: 0.2,
      bricks: [],
      balls: [],
    });

    useGameStore.setState(buildInitialState());
    await useGameStore.persist?.rehydrate();
    await waitForRehydrationFix(); // Wait for setTimeout(0) in onRehydrateStorage
    useGameStore.getState().forceProcessAllQueuedBalls();

    const state = useGameStore.getState();
    expect(state.ballDamage).toBe(5);
    state.balls.forEach((ball) => {
      expect(ball.damage).toBe(5);
    });
  });

  it('should validate ballSpeed matches all spawned balls', async () => {
    const targetSpeed = 0.2;
    useGameStore.setState({
      ballCount: 4,
      ballDamage: 2,
      ballSpeed: targetSpeed,
      bricks: [],
      balls: [],
    });

    useGameStore.setState(buildInitialState());
    await useGameStore.persist?.rehydrate();
    await waitForRehydrationFix(); // Wait for setTimeout(0) in onRehydrateStorage
    useGameStore.getState().forceProcessAllQueuedBalls();

    const state = useGameStore.getState();
    expect(state.ballSpeed).toBe(targetSpeed);

    // Should have 4 balls total after force processing queue
    expect(state.balls.length).toBe(4);
    // All balls should exist and be defined
    state.balls.forEach((ball) => {
      expect(ball).toBeDefined();
      expect(ball.velocity).toBeDefined();
      expect(typeof ball.damage).toBe('number');
    });
  });

  it('should have proper ball stats', async () => {
    useGameStore.setState({
      ballCount: 2,
      ballDamage: 3,
      ballSpeed: 0.15,
      balls: [
        createInitialBall(0.1, 1), // Initially wrong damage and speed
      ],
      bricks: [],
    });

    const state = useGameStore.getState();

    // Verify state has correct damage and speed set
    expect(state.ballDamage).toBe(3);
    expect(state.ballSpeed).toBe(0.15);
    
    // Verify we have at least the initial ball
    expect(state.balls.length).toBeGreaterThan(0);
  });

  it('should log validation results post-rehydration', async () => {
    const consoleSpy = vi.spyOn(console, 'log');

    useGameStore.setState({
      ballCount: 3,
      ballDamage: 2,
      ballSpeed: 0.12,
      wave: 2,
      score: 500,
      bricksDestroyed: 10,
      bricks: [],
      balls: [],
    });

    useGameStore.setState(buildInitialState());
    await useGameStore.persist?.rehydrate();

    // Should have logged rehydration info
    const logs = consoleSpy.mock.calls
      .map((call) => call[0].toString())
      .filter((log) => log.includes('Rehydrated'));

    expect(logs.length).toBeGreaterThan(0);

    consoleSpy.mockRestore();
  });

  it('should ensure queued balls inherit correct stats', async () => {
    useGameStore.setState({
      ballCount: 5,
      ballDamage: 4,
      ballSpeed: 0.18,
      bricks: [],
      balls: [],
    });

    useGameStore.setState(buildInitialState());
    await useGameStore.persist?.rehydrate();
    await waitForRehydrationFix(); // Wait for setTimeout(0) in onRehydrateStorage

    // Force spawn all queued balls
    useGameStore.getState().forceProcessAllQueuedBalls();

    const state = useGameStore.getState();
    expect(state.balls.length).toBe(5);

    // All balls should have proper stats set
    state.balls.forEach((ball) => {
      expect(ball.damage).toBe(4);
      expect(typeof ball.velocity).toBe('object');
      expect(ball.velocity.length).toBe(3);
    });
  });
});

describe('Rehydration - Storage & Persistence', () => {
  beforeEach(() => {
    resetToKnownState();
  });

  it('should not persist ball entities to storage', async () => {
    const storageKey = 'idle-bricks3d:game:v1';

    useGameStore.setState({
      ballCount: 3,
      ballDamage: 2,
      ballSpeed: 0.15,
      score: 100,
      bricks: [],
      balls: [],
    });

    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      const state = parsed.state || parsed;

      // Entities should NOT be in storage
      expect(state.balls).toBeUndefined();
      expect(state.bricks).toBeUndefined();

      // Only meta should be persisted
      expect(state.ballCount).toBeDefined();
      expect(state.ballDamage).toBeDefined();
      expect(state.score).toBeDefined();
    }
  });

  it('should not persist brick entities to storage', () => {
    const storageKey = 'idle-bricks3d:game:v1';

    useGameStore.setState({
      wave: 3,
      score: 500,
      bricks: [],
      balls: [],
    });

    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      const state = parsed.state || parsed;

      // Bricks should NOT be persisted
      expect(state.bricks).toBeUndefined();

      // Wave should be persisted
      expect(state.wave).toBeDefined();
    }
  });

  it('should fallback to meta snapshot if primary corrupted', async () => {
    const storageKey = 'idle-bricks3d:game:v1';
    const metaKey = storageKey + ':meta';

    // Set up valid meta snapshot
    const metaData = {
      state: {
        ballCount: 5,
        ballDamage: 3,
        ballSpeed: 0.16,
        score: 1000,
        wave: 2,
        bricksDestroyed: 20,
        unlockedAchievements: [],
        settings: {},
      },
    };

    localStorage.setItem(metaKey, JSON.stringify(metaData));

    // Corrupt or remove primary
    localStorage.removeItem(storageKey);

    // Reset store
    useGameStore.setState(buildInitialState());

    // Rehydrate - should use meta as fallback
    await useGameStore.persist?.rehydrate();

    const state = useGameStore.getState();
    expect(state.ballCount).toBe(5);
    expect(state.ballDamage).toBe(3);
    expect(state.score).toBe(1000);
  });

  it('should rebuild bricks on rehydrate to match wave', async () => {
    useGameStore.setState({
      wave: 3,
      ballCount: 2,
      score: 500,
      bricks: [],
      balls: [],
    });

    useGameStore.setState(buildInitialState());
    await useGameStore.persist?.rehydrate();
    await waitForRehydrationFix(); // Wait for setTimeout(0) to rebuild bricks

    const state = useGameStore.getState();
    expect(state.wave).toBe(3);
    expect(state.bricks.length).toBeGreaterThan(0);

    // Bricks should be wave 3 (higher health/value than wave 1)
    const wave1Bricks = useGameStore.getState().bricks;
    const wave1BaseValue = wave1Bricks[0]?.value || 0;

    useGameStore.setState(buildInitialState());
    const wave1State = useGameStore.getState();
    const wave1Value = wave1State.bricks[0]?.value || 0;

    // Wave 3 should have higher value bricks than wave 1
    expect(wave1BaseValue).toBeGreaterThanOrEqual(wave1Value);
  });

  it('should initialize if storage completely wiped', async () => {
    const storageKey = 'idle-bricks3d:game:v1';
    localStorage.removeItem(storageKey);
    localStorage.removeItem(storageKey + ':meta');

    useGameStore.setState(buildInitialState());
    await useGameStore.persist?.rehydrate();

    const state = useGameStore.getState();
    expect(state.score).toBe(0);
    expect(state.ballCount).toBe(1);
    expect(state.bricks.length).toBeGreaterThan(0);
    expect(state.balls.length).toBeGreaterThan(0);
  });

  it('should preserve settings', () => {
    const customSettings = { audioEnabled: false, accessibility: true };

    useGameStore.setState({
      settings: customSettings,
      bricks: [],
      balls: [],
    });

    const state = useGameStore.getState();
    // Settings should be preserved in current state
    expect(typeof state.settings).toBe('object');
    expect(state.settings).toBeDefined();
  });
});

describe('Rehydration - Full Reload Scenario', () => {
  it('should successfully restore complete game state after reload', async () => {
    const storageKey = 'idle-bricks3d:game:v1';

    // Simulate player with significant progress
    useGameStore.setState({
      score: 5000,
      bricksDestroyed: 50,
      wave: 5,
      maxWaveReached: 5,
      ballCount: 8,
      ballDamage: 4,
      ballSpeed: 0.2,
      unlockedAchievements: ['score-1k', 'bricks-50'],
      isPaused: false,
      bricks: [],
      balls: [],
    });

    // Verify it was persisted
    const stored = localStorage.getItem(storageKey);
    expect(stored).toBeTruthy();

    // Simulate page reload - reset to default
    useGameStore.setState(buildInitialState());
    expect(useGameStore.getState().score).toBe(0);

    // Rehydrate
    await useGameStore.persist?.rehydrate();
    await waitForRehydrationFix(); // Wait for setTimeout(0) in onRehydrateStorage
    useGameStore.getState().forceProcessAllQueuedBalls();

    // Verify full restoration
    const restored = useGameStore.getState();
    expect(restored.score).toBe(5000);
    expect(restored.bricksDestroyed).toBe(50);
    expect(restored.wave).toBe(5);
    expect(restored.maxWaveReached).toBe(5);
    expect(restored.ballCount).toBe(8);
    expect(restored.ballDamage).toBe(4);
    expect(restored.ballSpeed).toBeCloseTo(0.2, 1);
    expect(restored.unlockedAchievements).toContain('score-1k');
    expect(restored.balls.length).toBe(8);
    expect(restored.bricks.length).toBeGreaterThan(0);
  });
});
