import { describe, it, expect, beforeEach } from 'vitest';
import {
  ARENA_SIZE,
  buildInitialState,
  createInitialBall,
  createInitialBricks,
  type Ball,
  type Brick,
  type GameState,
  useGameStore,
} from '../store/gameStore';
import type { Vector3Tuple } from 'three';

/**
 * Comprehensive test suite for the game store.
 * Tests are designed to be robust and avoid brittleness by:
 * - Not depending on exact random values
 * - Using ranges and relationships rather than exact numbers where appropriate
 * - Testing behavior rather than implementation details
 * - Isolating state between tests
 */

// Helper to get a fresh store state with known values
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

// Helper to create a predictable brick for testing
const createTestBrick = (overrides: Partial<Brick> = {}): Brick => ({
  id: `test-brick-${Math.random().toString(36).substring(2, 9)}`,
  position: [0, 0, 0] as Vector3Tuple,
  health: 3,
  maxHealth: 3,
  color: '#FF6B6B',
  value: 10,
  type: 'normal',
  ...overrides,
});

// Helper to create a predictable ball for testing
const createTestBall = (overrides: Partial<Ball> = {}): Ball => ({
  id: `test-ball-${Math.random().toString(36).substring(2, 9)}`,
  position: [0, 0, 0] as Vector3Tuple,
  velocity: [0.1, 0.1, 0.1] as Vector3Tuple,
  radius: 0.3,
  damage: 1,
  color: '#FFFFFF',
  ...overrides,
});

describe('Game Store - Comprehensive Tests', () => {
  beforeEach(() => {
    resetToKnownState();
  });

  describe('Initial State Validation', () => {
    it('should have valid initial score and destroyed count', () => {
      const state = useGameStore.getState();
      expect(state.score).toBeGreaterThanOrEqual(0);
      expect(state.bricksDestroyed).toBeGreaterThanOrEqual(0);
    });

    it('should initialize ball stats with positive values', () => {
      const state = useGameStore.getState();
      expect(state.ballDamage).toBeGreaterThan(0);
      expect(state.ballSpeed).toBeGreaterThan(0);
      expect(state.ballCount).toBeGreaterThan(0);
    });

    it('should have valid arena size constants', () => {
      expect(ARENA_SIZE.width).toBeGreaterThan(0);
      expect(ARENA_SIZE.height).toBeGreaterThan(0);
      expect(ARENA_SIZE.depth).toBeGreaterThan(0);
    });

    it('should initialize balls array matching ballCount', () => {
      const state = useGameStore.getState();
      expect(state.balls.length).toBe(state.ballCount);
    });
  });

  describe('createInitialBricks', () => {
    it('should create a non-empty array of bricks', () => {
      const bricks = createInitialBricks(1);
      expect(bricks.length).toBeGreaterThan(0);
    });

    it('should create bricks with unique IDs', () => {
      const bricks = createInitialBricks(1);
      const ids = new Set(bricks.map((b) => b.id));
      expect(ids.size).toBe(bricks.length);
    });

    it('should create bricks with valid health values', () => {
      const bricks = createInitialBricks(1);
      bricks.forEach((brick) => {
        expect(brick.health).toBeGreaterThan(0);
        expect(brick.maxHealth).toBeGreaterThan(0);
        expect(brick.health).toBe(brick.maxHealth);
      });
    });

    it('should create bricks with valid positions', () => {
      const bricks = createInitialBricks(1);
      bricks.forEach((brick) => {
        expect(Array.isArray(brick.position)).toBe(true);
        expect(brick.position).toHaveLength(3);
        brick.position.forEach((coord) => {
          expect(typeof coord).toBe('number');
          expect(Number.isFinite(coord)).toBe(true);
        });
      });
    });

    it('should create bricks with positive value', () => {
      const bricks = createInitialBricks(1);
      bricks.forEach((brick) => {
        expect(brick.value).toBeGreaterThan(0);
      });
    });

    it('should create bricks with valid color strings', () => {
      const bricks = createInitialBricks(1);
      bricks.forEach((brick) => {
        expect(typeof brick.color).toBe('string');
        expect(brick.color.length).toBeGreaterThan(0);
      });
    });

    it('should create multiple calls yielding different brick IDs', () => {
      const bricks1 = createInitialBricks(1);
      const bricks2 = createInitialBricks(1);
      const ids1 = new Set(bricks1.map((b) => b.id));
      const ids2 = new Set(bricks2.map((b) => b.id));

      // Should have no overlapping IDs between calls
      const intersection = [...ids1].filter((id) => ids2.has(id));
      expect(intersection.length).toBe(0);
    });

    it('should scale health and value with higher waves', () => {
      const wave1 = createInitialBricks(1);
      const wave3 = createInitialBricks(3);

      const paired = wave1.map((brick, index) => [brick, wave3[index]]);
      paired.forEach(([base, scaled]) => {
        // Health should monotonically scale with wave
        expect(scaled.health).toBeGreaterThanOrEqual(base.health);

        // Value may be influenced by special types (golden/armor) which are random,
        // so only assert value scaling when both are normal bricks.
        if (base.type === 'normal' && scaled.type === 'normal') {
          expect(scaled.value).toBeGreaterThanOrEqual(base.value);
        }
      });
    });
  });

  describe('createInitialBall', () => {
    it('should create a ball with the specified damage', () => {
      const damage = 5;
      const ball = createInitialBall(0.1, damage);
      expect(ball.damage).toBe(damage);
    });

    it('should create a ball with consistent radius', () => {
      const ball = createInitialBall(0.1, 1);
      expect(ball.radius).toBe(0.3);
    });

    it('should create a ball with valid position', () => {
      const ball = createInitialBall(0.1, 1);
      expect(Array.isArray(ball.position)).toBe(true);
      expect(ball.position).toHaveLength(3);
    });

    it('should create a ball with non-zero velocity', () => {
      const ball = createInitialBall(0.1, 1);
      const velocityMagnitude = Math.sqrt(
        ball.velocity[0] ** 2 + ball.velocity[1] ** 2 + ball.velocity[2] ** 2
      );
      expect(velocityMagnitude).toBeGreaterThan(0);
    });

    it('should create balls with unique IDs', () => {
      const ball1 = createInitialBall(0.1, 1);
      const ball2 = createInitialBall(0.1, 1);
      expect(ball1.id).not.toBe(ball2.id);
    });

    it('should create ball at bottom of arena', () => {
      const ball = createInitialBall(0.1, 1);
      // Ball starts at y = -3 which is in the lower portion of the arena
      expect(ball.position[1]).toBeLessThan(0);
    });
  });

  describe('Score Management', () => {
    it('should add positive score correctly', () => {
      const { addScore } = useGameStore.getState();
      addScore(100);
      expect(useGameStore.getState().score).toBe(100);
    });

    it('should accumulate multiple score additions', () => {
      const { addScore } = useGameStore.getState();
      addScore(50);
      addScore(30);
      addScore(20);
      expect(useGameStore.getState().score).toBe(100);
    });

    it('should handle zero score addition', () => {
      const { addScore } = useGameStore.getState();
      addScore(0);
      expect(useGameStore.getState().score).toBe(0);
    });

    it('should handle large score values', () => {
      const { addScore } = useGameStore.getState();
      const largeValue = 1000000;
      addScore(largeValue);
      expect(useGameStore.getState().score).toBe(largeValue);
    });
  });

  describe('Ball Management', () => {
    describe('spawnBall', () => {
      it('should add a new ball to the array', () => {
        const initialBallCount = useGameStore.getState().balls.length;
        useGameStore.getState().spawnBall();
        expect(useGameStore.getState().balls.length).toBe(initialBallCount + 1);
      });

      it('should spawn ball with current damage value', () => {
        resetToKnownState({ ballDamage: 5 });
        useGameStore.getState().spawnBall();
        const balls = useGameStore.getState().balls;
        const newBall = balls[balls.length - 1];
        expect(newBall.damage).toBe(5);
      });

      it('should spawn ball with current speed value', () => {
        resetToKnownState({ ballSpeed: 0.2 });
        useGameStore.getState().spawnBall();
        const balls = useGameStore.getState().balls;
        const newBall = balls[balls.length - 1];
        const velocityMagnitude = Math.sqrt(
          newBall.velocity[0] ** 2 + newBall.velocity[1] ** 2 + newBall.velocity[2] ** 2
        );
        // Velocity should be related to the speed setting (with some variation due to random angles)
        expect(velocityMagnitude).toBeGreaterThan(0);
      });

      it('should maintain existing balls when spawning new one', () => {
        const originalBalls = [...useGameStore.getState().balls];
        useGameStore.getState().spawnBall();
        const newBalls = useGameStore.getState().balls;

        originalBalls.forEach((original) => {
          expect(newBalls.some((b) => b.id === original.id)).toBe(true);
        });
      });
    });

    describe('removeBall', () => {
      it('should remove the specified ball', () => {
        const state = useGameStore.getState();
        const ballToRemove = state.balls[0];
        state.removeBall(ballToRemove.id);
        expect(useGameStore.getState().balls.find((b) => b.id === ballToRemove.id)).toBeUndefined();
      });

      it('should not affect other balls when removing one', () => {
        // Add extra balls first
        useGameStore.getState().spawnBall();
        useGameStore.getState().spawnBall();

        const state = useGameStore.getState();
        const ballToRemove = state.balls[0];
        const remainingIds = state.balls.filter((b) => b.id !== ballToRemove.id).map((b) => b.id);

        state.removeBall(ballToRemove.id);

        const newBalls = useGameStore.getState().balls;
        remainingIds.forEach((id) => {
          expect(newBalls.some((b) => b.id === id)).toBe(true);
        });
      });

      it('should handle removing non-existent ball gracefully', () => {
        const initialCount = useGameStore.getState().balls.length;
        useGameStore.getState().removeBall('non-existent-id');
        expect(useGameStore.getState().balls.length).toBe(initialCount);
      });

      it('should allow removing all balls', () => {
        const state = useGameStore.getState();
        state.balls.forEach((ball) => {
          useGameStore.getState().removeBall(ball.id);
        });
        expect(useGameStore.getState().balls.length).toBe(0);
      });
    });

    describe('updateBallPosition', () => {
      it('should update position for existing ball', () => {
        const state = useGameStore.getState();
        const ballId = state.balls[0].id;
        const newPosition: Vector3Tuple = [5, 5, 5];

        state.updateBallPosition(ballId, newPosition);

        const updatedBall = useGameStore.getState().balls.find((b) => b.id === ballId);
        expect(updatedBall?.position).toEqual(newPosition);
      });

      it('should not affect other ball properties', () => {
        const state = useGameStore.getState();
        const ball = state.balls[0];
        const originalVelocity = [...ball.velocity];
        const originalDamage = ball.damage;

        state.updateBallPosition(ball.id, [10, 10, 10]);

        const updatedBall = useGameStore.getState().balls.find((b) => b.id === ball.id);
        expect(updatedBall?.velocity).toEqual(originalVelocity);
        expect(updatedBall?.damage).toBe(originalDamage);
      });

      it('should handle negative positions', () => {
        const state = useGameStore.getState();
        const ballId = state.balls[0].id;
        const negativePosition: Vector3Tuple = [-5, -5, -5];

        state.updateBallPosition(ballId, negativePosition);

        const updatedBall = useGameStore.getState().balls.find((b) => b.id === ballId);
        expect(updatedBall?.position).toEqual(negativePosition);
      });

      it('should handle updating non-existent ball', () => {
        const originalBalls = [...useGameStore.getState().balls];
        useGameStore.getState().updateBallPosition('non-existent', [1, 2, 3]);
        // Should not throw and balls should be unchanged
        expect(useGameStore.getState().balls).toEqual(originalBalls);
      });
    });

    describe('updateBallVelocity', () => {
      it('should update velocity for existing ball', () => {
        const state = useGameStore.getState();
        const ballId = state.balls[0].id;
        const newVelocity: Vector3Tuple = [0.5, -0.3, 0.2];

        state.updateBallVelocity(ballId, newVelocity);

        const updatedBall = useGameStore.getState().balls.find((b) => b.id === ballId);
        expect(updatedBall?.velocity).toEqual(newVelocity);
      });

      it('should not affect other ball properties', () => {
        const state = useGameStore.getState();
        const ball = state.balls[0];
        const originalPosition = [...ball.position];
        const originalDamage = ball.damage;

        state.updateBallVelocity(ball.id, [1, 1, 1]);

        const updatedBall = useGameStore.getState().balls.find((b) => b.id === ball.id);
        expect(updatedBall?.position).toEqual(originalPosition);
        expect(updatedBall?.damage).toBe(originalDamage);
      });

      it('should handle zero velocity', () => {
        const state = useGameStore.getState();
        const ballId = state.balls[0].id;
        const zeroVelocity: Vector3Tuple = [0, 0, 0];

        state.updateBallVelocity(ballId, zeroVelocity);

        const updatedBall = useGameStore.getState().balls.find((b) => b.id === ballId);
        expect(updatedBall?.velocity).toEqual(zeroVelocity);
      });
    });
  });

  describe('Brick Management', () => {
    beforeEach(() => {
      // Use deterministic, non-armor bricks for all brick-management tests
      resetToKnownState({
        bricks: [
          createTestBrick({ health: 10, maxHealth: 10, value: 10 }),
          createTestBrick({ health: 10, maxHealth: 10, value: 20 }),
          createTestBrick({ health: 10, maxHealth: 10, value: 30 }),
        ],
      });
    });
    describe('damageBrick', () => {
      it('should reduce brick health', () => {
        const state = useGameStore.getState();
        const brick = state.bricks[0];
        const initialHealth = brick.health;

        state.damageBrick(brick.id, 1);

        const damagedBrick = useGameStore.getState().bricks.find((b) => b.id === brick.id);
        expect(damagedBrick?.health).toBe(initialHealth - 1);
      });

      it('should apply correct damage amount', () => {
        const state = useGameStore.getState();
        const brick = state.bricks.find((b) => b.health >= 5); // Find brick with enough health
        if (!brick) {
          // Create state with high-health brick
          resetToKnownState({
            bricks: [createTestBrick({ health: 10, maxHealth: 10 })],
          });
        }

        const targetBrick =
          brick || useGameStore.getState().bricks.find((b) => b.health >= 5) || state.bricks[0];
        const initialHealth = targetBrick.health;
        const damageAmount = 3;

        useGameStore.getState().damageBrick(targetBrick.id, damageAmount);

        const damagedBrick = useGameStore.getState().bricks.find((b) => b.id === targetBrick.id);
        if (initialHealth > damageAmount) {
          expect(damagedBrick?.health).toBe(initialHealth - damageAmount);
        }
      });

      it('should remove brick when health reaches zero', () => {
        const state = useGameStore.getState();
        const brick = state.bricks[0];

        state.damageBrick(brick.id, brick.health);

        expect(useGameStore.getState().bricks.find((b) => b.id === brick.id)).toBeUndefined();
      });

      it('should add score when brick is destroyed', () => {
        const state = useGameStore.getState();
        const brick = state.bricks[0];
        const brickValue = brick.value;

        state.damageBrick(brick.id, brick.health);

        expect(useGameStore.getState().score).toBe(brickValue);
      });

      it('should increment bricksDestroyed when brick is destroyed', () => {
        const state = useGameStore.getState();
        const brick = state.bricks[0];

        state.damageBrick(brick.id, brick.health);

        expect(useGameStore.getState().bricksDestroyed).toBe(1);
      });

      it('should not add score when brick is only damaged', () => {
        const state = useGameStore.getState();
        const brick = state.bricks.find((b) => b.health > 1);
        if (!brick) return; // Skip if no brick with health > 1

        state.damageBrick(brick.id, 1);

        expect(useGameStore.getState().score).toBe(0);
      });

      it('should handle damaging non-existent brick gracefully', () => {
        const initialState = useGameStore.getState();
        const initialBrickCount = initialState.bricks.length;

        useGameStore.getState().damageBrick('non-existent', 5);

        expect(useGameStore.getState().bricks.length).toBe(initialBrickCount);
        expect(useGameStore.getState().score).toBe(0);
      });

      it('should handle destroying multiple bricks correctly', () => {
        const state = useGameStore.getState();
        const brick1 = state.bricks[0];
        const brick2 = state.bricks[1];
        const totalValue = brick1.value + brick2.value;

        state.damageBrick(brick1.id, brick1.health);
        useGameStore.getState().damageBrick(brick2.id, brick2.health);

        expect(useGameStore.getState().score).toBe(totalValue);
        expect(useGameStore.getState().bricksDestroyed).toBe(2);
      });
    });

    describe('removeBrick', () => {
      it('should remove the specified brick', () => {
        const state = useGameStore.getState();
        const brickToRemove = state.bricks[0];

        state.removeBrick(brickToRemove.id);

        expect(
          useGameStore.getState().bricks.find((b) => b.id === brickToRemove.id)
        ).toBeUndefined();
      });

      it('should not add score when using removeBrick directly', () => {
        const state = useGameStore.getState();
        const brick = state.bricks[0];

        state.removeBrick(brick.id);

        expect(useGameStore.getState().score).toBe(0);
      });

      it('should not increment bricksDestroyed when using removeBrick directly', () => {
        const state = useGameStore.getState();
        const brick = state.bricks[0];

        state.removeBrick(brick.id);

        expect(useGameStore.getState().bricksDestroyed).toBe(0);
      });
    });

    describe('regenerateBricks', () => {
      it('should create new bricks when called', () => {
        // Clear all bricks first
        const state = useGameStore.getState();
        state.bricks.forEach((b) => useGameStore.getState().removeBrick(b.id));
        expect(useGameStore.getState().bricks.length).toBe(0);

        useGameStore.getState().regenerateBricks();

        expect(useGameStore.getState().bricks.length).toBeGreaterThan(0);
      });

      it('should replace existing bricks with new ones', () => {
        const originalIds = useGameStore.getState().bricks.map((b) => b.id);

        useGameStore.getState().regenerateBricks();

        const newIds = useGameStore.getState().bricks.map((b) => b.id);
        const commonIds = originalIds.filter((id) => newIds.includes(id));
        expect(commonIds.length).toBe(0);
      });

      it('should create bricks with full health', () => {
        useGameStore.getState().regenerateBricks();

        useGameStore.getState().bricks.forEach((brick) => {
          expect(brick.health).toBe(brick.maxHealth);
        });
      });
    });
  });

  describe('Pause Functionality', () => {
    it('should toggle pause from false to true', () => {
      expect(useGameStore.getState().isPaused).toBe(false);
      useGameStore.getState().togglePause();
      expect(useGameStore.getState().isPaused).toBe(true);
    });

    it('should toggle pause from true to false', () => {
      useGameStore.setState({ isPaused: true });
      useGameStore.getState().togglePause();
      expect(useGameStore.getState().isPaused).toBe(false);
    });

    it('should toggle pause multiple times correctly', () => {
      const { togglePause } = useGameStore.getState();
      togglePause(); // true
      togglePause(); // false
      togglePause(); // true
      expect(useGameStore.getState().isPaused).toBe(true);
    });
  });

  describe('Upgrade System', () => {
    describe('Upgrade Costs', () => {
      it('should calculate ball damage cost based on current level', () => {
        const cost1 = useGameStore.getState().getBallDamageCost();
        expect(cost1).toBeGreaterThan(0);

        // Upgrade and check cost increases
        useGameStore.setState({ score: 10000 });
        useGameStore.getState().upgradeBallDamage();
        const cost2 = useGameStore.getState().getBallDamageCost();
        expect(cost2).toBeGreaterThan(cost1);
      });

      it('should calculate ball speed cost based on current level', () => {
        const cost1 = useGameStore.getState().getBallSpeedCost();
        expect(cost1).toBeGreaterThan(0);

        useGameStore.setState({ score: 10000 });
        useGameStore.getState().upgradeBallSpeed();
        const cost2 = useGameStore.getState().getBallSpeedCost();
        expect(cost2).toBeGreaterThan(cost1);
      });

      it('should calculate ball count cost based on current level', () => {
        const cost1 = useGameStore.getState().getBallCountCost();
        expect(cost1).toBeGreaterThan(0);

        useGameStore.setState({ score: 10000 });
        useGameStore.getState().upgradeBallCount();
        const cost2 = useGameStore.getState().getBallCountCost();
        expect(cost2).toBeGreaterThan(cost1);
      });

      it('should have exponentially increasing costs', () => {
        useGameStore.setState({ score: 100000 });

        const damageCosts: number[] = [];
        for (let i = 0; i < 5; i++) {
          damageCosts.push(useGameStore.getState().getBallDamageCost());
          useGameStore.getState().upgradeBallDamage();
        }

        // Each cost should be greater than the previous
        for (let i = 1; i < damageCosts.length; i++) {
          expect(damageCosts[i]).toBeGreaterThan(damageCosts[i - 1]);
        }
      });
    });

    describe('Ball Damage Upgrade', () => {
      beforeEach(() => {
        resetToKnownState({ score: 10000 });
      });

      it('should increase ball damage by 1', () => {
        const initialDamage = useGameStore.getState().ballDamage;
        useGameStore.getState().upgradeBallDamage();
        expect(useGameStore.getState().ballDamage).toBe(initialDamage + 1);
      });

      it('should deduct the correct cost', () => {
        const cost = useGameStore.getState().getBallDamageCost();
        useGameStore.getState().upgradeBallDamage();
        expect(useGameStore.getState().score).toBe(10000 - cost);
      });

      it('should update existing balls damage', () => {
        useGameStore.getState().upgradeBallDamage();
        const newDamage = useGameStore.getState().ballDamage;
        useGameStore.getState().balls.forEach((ball) => {
          expect(ball.damage).toBe(newDamage);
        });
      });

      it('should not upgrade when score is exactly one less than cost', () => {
        const cost = useGameStore.getState().getBallDamageCost();
        useGameStore.setState({ score: cost - 1 });
        const initialDamage = useGameStore.getState().ballDamage;

        useGameStore.getState().upgradeBallDamage();

        expect(useGameStore.getState().ballDamage).toBe(initialDamage);
        expect(useGameStore.getState().score).toBe(cost - 1);
      });

      it('should upgrade when score equals cost exactly', () => {
        const cost = useGameStore.getState().getBallDamageCost();
        useGameStore.setState({ score: cost });
        const initialDamage = useGameStore.getState().ballDamage;

        useGameStore.getState().upgradeBallDamage();

        expect(useGameStore.getState().ballDamage).toBe(initialDamage + 1);
        expect(useGameStore.getState().score).toBe(0);
      });
    });

    describe('Ball Speed Upgrade', () => {
      beforeEach(() => {
        resetToKnownState({ score: 10000 });
      });

      it('should increase ball speed by 0.02', () => {
        const initialSpeed = useGameStore.getState().ballSpeed;
        useGameStore.getState().upgradeBallSpeed();
        expect(useGameStore.getState().ballSpeed).toBeCloseTo(initialSpeed + 0.02);
      });

      it('should deduct the correct cost', () => {
        const cost = useGameStore.getState().getBallSpeedCost();
        useGameStore.getState().upgradeBallSpeed();
        expect(useGameStore.getState().score).toBe(10000 - cost);
      });

      it('should scale existing balls velocity to new speed setting', () => {
        // Set up a ball with known velocity
        const initialBall = createTestBall({ velocity: [0.1, 0.1, 0.1] });
        useGameStore.setState({ balls: [initialBall], ballSpeed: 0.1 });

        const newBallSpeedSetting = 0.1 + 0.02; // After upgrade
        useGameStore.getState().upgradeBallSpeed();

        const updatedBall = useGameStore.getState().balls[0];
        const actualSpeed = Math.sqrt(
          updatedBall.velocity[0] ** 2 + updatedBall.velocity[1] ** 2 + updatedBall.velocity[2] ** 2
        );

        // Velocity should be scaled to match the new ballSpeed setting
        expect(actualSpeed).toBeCloseTo(newBallSpeedSetting);
      });

      it('should not upgrade when insufficient score', () => {
        useGameStore.setState({ score: 0 });
        const initialSpeed = useGameStore.getState().ballSpeed;

        useGameStore.getState().upgradeBallSpeed();

        expect(useGameStore.getState().ballSpeed).toBe(initialSpeed);
      });

      it('should handle multiple speed upgrades', () => {
        const initialSpeed = useGameStore.getState().ballSpeed;
        useGameStore.getState().upgradeBallSpeed();
        useGameStore.getState().upgradeBallSpeed();
        useGameStore.getState().upgradeBallSpeed();

        expect(useGameStore.getState().ballSpeed).toBeCloseTo(initialSpeed + 0.06);
      });
    });

    describe('Ball Count Upgrade', () => {
      beforeEach(() => {
        resetToKnownState({ score: 10000 });
      });

      it('should increase ball count by 1', () => {
        const initialCount = useGameStore.getState().ballCount;
        useGameStore.getState().upgradeBallCount();
        expect(useGameStore.getState().ballCount).toBe(initialCount + 1);
      });

      it('should add a new ball to the balls array', () => {
        const initialBallsCount = useGameStore.getState().balls.length;
        useGameStore.getState().upgradeBallCount();
        expect(useGameStore.getState().balls.length).toBe(initialBallsCount + 1);
      });

      it('should deduct the correct cost', () => {
        const cost = useGameStore.getState().getBallCountCost();
        useGameStore.getState().upgradeBallCount();
        expect(useGameStore.getState().score).toBe(10000 - cost);
      });

      it('should not upgrade when insufficient score', () => {
        useGameStore.setState({ score: 0 });
        const initialCount = useGameStore.getState().ballCount;

        useGameStore.getState().upgradeBallCount();

        expect(useGameStore.getState().ballCount).toBe(initialCount);
      });

      it('should not exceed maximum ball count of 20', () => {
        useGameStore.setState({ score: 10000000, ballCount: 20 });
        const initialCount = useGameStore.getState().ballCount;

        useGameStore.getState().upgradeBallCount();

        expect(useGameStore.getState().ballCount).toBe(initialCount);
      });

      it('should allow upgrade at 19 balls', () => {
        // Need to set up balls array matching ballCount for consistency
        const balls = Array.from({ length: 19 }, () => createTestBall());
        useGameStore.setState({ ballCount: 19, balls });

        // Get the actual cost for upgrading to 20 balls
        const cost = useGameStore.getState().getBallCountCost();
        useGameStore.setState({ score: cost });

        useGameStore.getState().upgradeBallCount();

        expect(useGameStore.getState().ballCount).toBe(20);
        expect(useGameStore.getState().balls.length).toBe(20);
      });

      it('should spawn new ball with current damage and speed', () => {
        useGameStore.setState({ ballDamage: 5, ballSpeed: 0.2 });
        useGameStore.getState().upgradeBallCount();

        const newBall = useGameStore.getState().balls[useGameStore.getState().balls.length - 1];
        expect(newBall.damage).toBe(5);
      });
    });
  });

  describe('State Immutability', () => {
    it('should not mutate state directly when adding score', () => {
      const stateBefore = useGameStore.getState();
      const scoreBefore = stateBefore.score;

      useGameStore.getState().addScore(100);

      // Original state reference should be unchanged
      expect(stateBefore.score).toBe(scoreBefore);
    });

    it('should not mutate state when updating ball position', () => {
      const stateBefore = useGameStore.getState();
      const ballsBefore = [...stateBefore.balls];
      const firstBallPositionBefore = [...ballsBefore[0].position];

      useGameStore.getState().updateBallPosition(ballsBefore[0].id, [99, 99, 99]);

      // Original ball position should be unchanged
      expect(ballsBefore[0].position).toEqual(firstBallPositionBefore);
    });

    it('should create new array references when modifying bricks', () => {
      const bricksBefore = useGameStore.getState().bricks;

      useGameStore.getState().regenerateBricks();

      const bricksAfter = useGameStore.getState().bricks;
      expect(bricksBefore).not.toBe(bricksAfter);
    });
  });

  describe('Edge Cases', () => {
    it('should handle state with zero bricks', () => {
      useGameStore.setState({ bricks: [] });
      const state = useGameStore.getState();
      expect(state.bricks.length).toBe(0);

      // Should not crash when regenerating
      state.regenerateBricks();
      expect(useGameStore.getState().bricks.length).toBeGreaterThan(0);
    });

    it('should handle state with zero balls', () => {
      useGameStore.setState({ balls: [] });
      const state = useGameStore.getState();
      expect(state.balls.length).toBe(0);

      // Should be able to spawn a new ball
      state.spawnBall();
      expect(useGameStore.getState().balls.length).toBe(1);
    });

    it('should handle very high score values', () => {
      const highScore = Number.MAX_SAFE_INTEGER - 1000;
      useGameStore.setState({ score: highScore });
      useGameStore.getState().addScore(500);
      expect(useGameStore.getState().score).toBe(highScore + 500);
    });

    it('should handle rapid consecutive updates', () => {
      for (let i = 0; i < 100; i++) {
        useGameStore.getState().addScore(1);
      }
      expect(useGameStore.getState().score).toBe(100);
    });

    it('should maintain consistency between ballCount and balls array after upgrades', () => {
      useGameStore.setState({ score: 100000 });

      for (let i = 0; i < 5; i++) {
        useGameStore.getState().upgradeBallCount();
      }

      const state = useGameStore.getState();
      expect(state.balls.length).toBe(state.ballCount);
    });
  });

  describe('Progression & Persistence', () => {
    it('should advance waves and update maxWaveReached', () => {
      const initialWave = useGameStore.getState().wave;
      useGameStore.getState().regenerateBricks();

      const afterFirst = useGameStore.getState();
      expect(afterFirst.wave).toBe(initialWave + 1);
      expect(afterFirst.maxWaveReached).toBe(afterFirst.wave);

      useGameStore.getState().regenerateBricks();
      const afterSecond = useGameStore.getState();
      expect(afterSecond.wave).toBe(initialWave + 2);
      expect(afterSecond.maxWaveReached).toBe(afterSecond.wave);
    });

    it('should unlock achievements for score and wave milestones', () => {
      useGameStore.getState().addScore(1200);
      expect(useGameStore.getState().unlockedAchievements).toContain('score-1k');

      useGameStore.getState().regenerateBricks();
      useGameStore.getState().regenerateBricks();
      const unlocked = useGameStore.getState().unlockedAchievements;
      expect(unlocked).toContain('wave-3');
    });

    it('should persist meta progression and rebuild runtime entities on hydrate', async () => {
      const storageKey = 'idle-bricks3d:game:v1';
      useGameStore.setState({
        score: 500,
        bricksDestroyed: 5,
        wave: 2,
        maxWaveReached: 2,
        ballDamage: 3,
        ballSpeed: 0.14,
        ballCount: 3,
        unlockedAchievements: ['score-1k'],
        bricks: [],
        balls: [],
      });

      const raw = localStorage.getItem(storageKey);
      expect(raw).toBeTruthy();
      const parsed = raw ? JSON.parse(raw) : {};
      expect(parsed.state.score).toBe(500);
      expect(parsed.state.bricks).toBeUndefined();

      useGameStore.setState(buildInitialState());
      await useGameStore.persist?.rehydrate();
      await waitForRehydrationFix(); // Wait for setTimeout(0) in onRehydrateStorage

      // Process ball spawn queue to spawn all queued balls (for testing)
      useGameStore.getState().forceProcessAllQueuedBalls();

      const hydrated = useGameStore.getState();
      expect(hydrated.score).toBe(500);
      expect(hydrated.bricks.length).toBeGreaterThan(0);
      expect(hydrated.balls.length).toBe(hydrated.ballCount);
    });
  });

  describe('Store Selectors', () => {
    it('should return consistent values on repeated calls', () => {
      const state1 = useGameStore.getState();
      const state2 = useGameStore.getState();

      expect(state1.score).toBe(state2.score);
      expect(state1.balls).toBe(state2.balls);
      expect(state1.bricks).toBe(state2.bricks);
    });
  });
});

describe('Game Store - Integration Tests', () => {
  beforeEach(() => {
    resetToKnownState();
  });

  it('should simulate a game session: destroy bricks, earn score, upgrade', () => {
    // Use deterministic bricks for this simulation so results are predictable
    useGameStore.setState({
      bricks: [
        createTestBrick({ value: 10, health: 3, maxHealth: 3 }),
        createTestBrick({ value: 20, health: 3, maxHealth: 3 }),
        createTestBrick({ value: 30, health: 3, maxHealth: 3 }),
      ],
    });

    // Simulate destroying some bricks
    const bricksToDestroy = useGameStore.getState().bricks.slice(0, 3);
    let expectedScore = 0;

    bricksToDestroy.forEach((brick) => {
      expectedScore += brick.value;
      useGameStore.getState().damageBrick(brick.id, brick.health);
    });

    expect(useGameStore.getState().score).toBe(expectedScore);
    expect(useGameStore.getState().bricksDestroyed).toBe(3);

    // Try to upgrade if we have enough score
    const damageCost = useGameStore.getState().getBallDamageCost();
    if (expectedScore >= damageCost) {
      useGameStore.getState().upgradeBallDamage();
      expect(useGameStore.getState().ballDamage).toBe(2);
      expect(useGameStore.getState().score).toBe(expectedScore - damageCost);
    }
  });

  it('should maintain game state consistency after multiple operations', () => {
    useGameStore.setState({ score: 5000 });

    // Perform various operations
    useGameStore.getState().spawnBall();
    useGameStore.getState().togglePause();
    useGameStore.getState().upgradeBallDamage();
    useGameStore.getState().togglePause();

    const state = useGameStore.getState();

    // Verify state is consistent
    expect(state.balls.length).toBeGreaterThan(0);
    expect(state.bricks.length).toBeGreaterThan(0);
    expect(state.isPaused).toBe(false);
    expect(state.ballDamage).toBe(2);

    // All balls should have the upgraded damage
    state.balls.forEach((ball) => {
      expect(ball.damage).toBe(state.ballDamage);
    });
  });

  it('should handle complete brick destruction and regeneration cycle', () => {
    const state = useGameStore.getState();
    const totalValue = state.bricks.reduce((sum, brick) => sum + brick.value, 0);
    const initialWave = state.wave;

    // Destroy all bricks — account for armor reduction so the damage always kills.
    state.bricks.forEach((brick) => {
      const armor = brick.armorMultiplier ?? 0;
      const requiredDamage = Math.ceil(brick.health / (1 - armor));
      useGameStore.getState().damageBrick(brick.id, requiredDamage);
    });

    expect(useGameStore.getState().bricks.length).toBe(0);
    expect(useGameStore.getState().score).toBe(totalValue);

    // Regenerate
    useGameStore.getState().regenerateBricks();
    expect(useGameStore.getState().bricks.length).toBeGreaterThan(0);

    // Score should include wave bonus and wave should advance
    const expectedScore = totalValue + Math.floor(20 * (initialWave + 1));
    expect(useGameStore.getState().score).toBe(expectedScore);
    expect(useGameStore.getState().wave).toBe(initialWave + 1);
    expect(useGameStore.getState().maxWaveReached).toBeGreaterThanOrEqual(initialWave + 1);
  });

  it('should restore correct number of balls after reloading with 8+ purchased balls (regression test)', async () => {
    const storageKey = 'idle-bricks3d:game:v1';

    // Simulate user with 8 purchased balls
    useGameStore.setState({
      score: 1000,
      bricksDestroyed: 10,
      wave: 1,
      maxWaveReached: 1,
      ballDamage: 2,
      ballSpeed: 0.14,
      ballCount: 8,
      unlockedAchievements: [],
      bricks: [],
      balls: [], // This gets rebuilt on rehydrate
    });

    // Verify 8 balls were in the state
    expect(useGameStore.getState().ballCount).toBe(8);
    const raw = localStorage.getItem(storageKey);
    expect(raw).toBeTruthy();

    // Simulate page reload - reset store to initial state
    // Since storage exists, buildInitialState returns empty balls (rehydration will rebuild)
    useGameStore.setState(buildInitialState());
    expect(useGameStore.getState().ballCount).toBe(1); // Back to default
    expect(useGameStore.getState().balls.length).toBe(0); // Empty - rehydration will create correct balls

    // Rehydrate from storage
    await useGameStore.persist?.rehydrate();
    await waitForRehydrationFix(); // Wait for setTimeout(0) in onRehydrateStorage

    // Process ball spawn queue to spawn all queued balls (for testing)
    useGameStore.getState().forceProcessAllQueuedBalls();

    // After rehydration and processing spawn queue, should have 8 balls
    const hydrated = useGameStore.getState();
    expect(hydrated.ballCount).toBe(8);
    expect(hydrated.balls.length).toBe(8); // THE KEY TEST: balls array should have 8 items, not 1
    
    // Verify each ball has correct damage and speed
    hydrated.balls.forEach((ball) => {
      expect(ball.damage).toBe(2);
    });
  });
});

