import { describe, it, expect, beforeEach } from 'vitest';
import {
  ACHIEVEMENTS,
  buildInitialState,
  createInitialBall,
  createInitialBricks,
  useGameStore,
} from '../store/gameStore';

const resetStore = (overrides: Partial<ReturnType<typeof buildInitialState>> = {}) => {
  useGameStore.persist?.clearStorage();
  useGameStore.setState({
    ...buildInitialState(),
    ...overrides,
  });
};

describe('Game Store', () => {
  beforeEach(() => {
    // Reset store before each test
    resetStore();
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const state = useGameStore.getState();

      expect(state.score).toBe(0);
      expect(state.bricksDestroyed).toBe(0);
      expect(state.ballDamage).toBe(1);
      expect(state.ballSpeed).toBe(0.1);
      expect(state.ballCount).toBe(1);
      expect(state.isPaused).toBe(false);
    });

    it('should initialize with bricks', () => {
      const state = useGameStore.getState();
      expect(state.bricks.length).toBeGreaterThan(0);
    });

    it('should initialize with at least one ball', () => {
      const state = useGameStore.getState();
      expect(state.balls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Score Actions', () => {
    it('should add score correctly', () => {
      const { addScore } = useGameStore.getState();

      addScore(100);
      expect(useGameStore.getState().score).toBe(100);

      addScore(50);
      expect(useGameStore.getState().score).toBe(150);
    });
  });

  describe('Ball Actions', () => {
    it('should spawn a new ball', () => {
      const initialBalls = useGameStore.getState().balls.length;

      useGameStore.getState().spawnBall();

      expect(useGameStore.getState().balls.length).toBe(initialBalls + 1);
    });

    it('should remove a ball by id', () => {
      const state = useGameStore.getState();
      const ballId = state.balls[0].id;

      state.removeBall(ballId);

      const newState = useGameStore.getState();
      expect(newState.balls.find((b) => b.id === ballId)).toBeUndefined();
    });

    it('should update ball position', () => {
      const state = useGameStore.getState();
      const ballId = state.balls[0].id;

      state.updateBallPosition(ballId, [1, 2, 3]);

      const updatedBall = useGameStore.getState().balls.find((b) => b.id === ballId);
      expect(updatedBall?.position).toEqual([1, 2, 3]);
    });

    it('should update ball velocity', () => {
      const state = useGameStore.getState();
      const ballId = state.balls[0].id;

      state.updateBallVelocity(ballId, [0.5, 0.5, 0.5]);

      const updatedBall = useGameStore.getState().balls.find((b) => b.id === ballId);
      expect(updatedBall?.velocity).toEqual([0.5, 0.5, 0.5]);
    });
  });

  describe('Brick Actions', () => {
    it('should damage a brick', () => {
      const state = useGameStore.getState();
      const brickId = state.bricks[0].id;
      const initialHealth = state.bricks[0].health;

      state.damageBrick(brickId, 1);

      const damagedBrick = useGameStore.getState().bricks.find((b) => b.id === brickId);
      expect(damagedBrick?.health).toBe(initialHealth - 1);
    });

    it('should remove brick and add score when health reaches zero', () => {
      const state = useGameStore.getState();
      const brick = state.bricks[0];
      const brickId = brick.id;

      // Damage brick until destroyed — account for any armor reduction so the damage always kills.
      const armor = brick.armorMultiplier ?? 0;
      const requiredDamage = Math.ceil(brick.health / (1 - armor));
      state.damageBrick(brickId, requiredDamage);

      const newState = useGameStore.getState();
      expect(newState.bricks.find((b) => b.id === brickId)).toBeUndefined();
      expect(newState.score).toBe(brick.value);
      expect(newState.bricksDestroyed).toBe(1);
    });

    it('should regenerate bricks', () => {
      const state = useGameStore.getState();

      // Clear all bricks
      state.bricks.forEach((b) => state.removeBrick(b.id));
      expect(useGameStore.getState().bricks.length).toBe(0);

      // Regenerate
      useGameStore.getState().regenerateBricks();
      expect(useGameStore.getState().bricks.length).toBeGreaterThan(0);
    });
  });

  describe('Pause Toggle', () => {
    it('should toggle pause state', () => {
      const { togglePause } = useGameStore.getState();

      expect(useGameStore.getState().isPaused).toBe(false);

      togglePause();
      expect(useGameStore.getState().isPaused).toBe(true);

      togglePause();
      expect(useGameStore.getState().isPaused).toBe(false);
    });
  });

  describe('Upgrades', () => {
    beforeEach(() => {
      // Give player some score for upgrades
      useGameStore.setState({ score: 10000 });
    });

    it('should upgrade ball damage when player has enough score', () => {
      const initialDamage = useGameStore.getState().ballDamage;
      const cost = useGameStore.getState().getBallDamageCost();

      useGameStore.getState().upgradeBallDamage();

      const newState = useGameStore.getState();
      expect(newState.ballDamage).toBe(initialDamage + 1);
      expect(newState.score).toBe(10000 - cost);
    });

    it('should upgrade ball speed when player has enough score', () => {
      const initialSpeed = useGameStore.getState().ballSpeed;
      const cost = useGameStore.getState().getBallSpeedCost();

      useGameStore.getState().upgradeBallSpeed();

      const newState = useGameStore.getState();
      expect(newState.ballSpeed).toBeCloseTo(initialSpeed + 0.02);
      expect(newState.score).toBe(10000 - cost);
    });

    it('should upgrade ball count when player has enough score', () => {
      const initialCount = useGameStore.getState().ballCount;
      const initialBalls = useGameStore.getState().balls.length;
      const cost = useGameStore.getState().getBallCountCost();

      useGameStore.getState().upgradeBallCount();

      const newState = useGameStore.getState();
      expect(newState.ballCount).toBe(initialCount + 1);
      expect(newState.balls.length).toBe(initialBalls + 1);
      expect(newState.score).toBe(10000 - cost);
    });

    it('should not upgrade when player has insufficient score', () => {
      useGameStore.setState({ score: 0 });

      const initialDamage = useGameStore.getState().ballDamage;
      useGameStore.getState().upgradeBallDamage();

      expect(useGameStore.getState().ballDamage).toBe(initialDamage);
      expect(useGameStore.getState().score).toBe(0);
    });
  });

  describe('Helper Functions', () => {
    it('createInitialBricks should return an array of bricks', () => {
      const bricks = createInitialBricks(1);

      expect(Array.isArray(bricks)).toBe(true);
      expect(bricks.length).toBeGreaterThan(0);

      bricks.forEach((brick) => {
        expect(brick).toHaveProperty('id');
        expect(brick).toHaveProperty('position');
        expect(brick).toHaveProperty('health');
        expect(brick).toHaveProperty('maxHealth');
        expect(brick).toHaveProperty('color');
        expect(brick).toHaveProperty('value');
      });
    });

    it('createInitialBall should return a valid ball object', () => {
      const ball = createInitialBall(0.1, 1);

      expect(ball).toHaveProperty('id');
      expect(ball).toHaveProperty('position');
      expect(ball).toHaveProperty('velocity');
      expect(ball).toHaveProperty('radius');
      expect(ball).toHaveProperty('damage');
      expect(ball).toHaveProperty('color');

      expect(ball.damage).toBe(1);
      expect(ball.radius).toBe(0.3);
    });
  });
});

describe('Wave & Achievements', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should advance wave and maxWaveReached when regenerating bricks', () => {
    const initialWave = useGameStore.getState().wave;
    useGameStore.getState().regenerateBricks();

    const state = useGameStore.getState();
    expect(state.wave).toBe(initialWave + 1);
    expect(state.maxWaveReached).toBe(initialWave + 1);
    expect(state.bricks.length).toBeGreaterThan(0);
  });

  it('unlocks achievements when thresholds are met', () => {
    useGameStore.getState().addScore(2000);
    expect(useGameStore.getState().unlockedAchievements).toContain(ACHIEVEMENTS[0].id);

    useGameStore.setState({ score: 100000 });
    for (let i = 0; i < 5; i++) {
      useGameStore.getState().upgradeBallDamage();
    }

    const state = useGameStore.getState();
    expect(state.ballDamage).toBeGreaterThanOrEqual(5);
    expect(state.unlockedAchievements).toContain('upgrade-damage-5');
  });
});
