import { describe, expect, it } from 'vitest';
import { ARENA_SIZE, type Ball, type Brick } from '../../store/gameStore';
import { BRICK_SIZE, stepBallFrame } from '../../engine/collision';

const createTestBall = (overrides: Partial<Ball> = {}): Ball => ({
  id: 'ball-1',
  position: [0, 0, 0],
  velocity: [0.2, 0.2, 0.2],
  radius: 0.3,
  damage: 1,
  color: '#fff',
  ...overrides,
});

const createTestBrick = (overrides: Partial<Brick> = {}): Brick => ({
  id: 'brick-1',
  position: [0.5, 0, 0],
  health: 3,
  maxHealth: 3,
  color: '#4ECDC4',
  value: 10,
  ...overrides,
});

describe('performance harness', () => {
  it('keeps balls bounded within the arena over many frames', () => {
    let ball = createTestBall();

    for (let i = 0; i < 240; i += 1) {
      const { nextPosition, nextVelocity } = stepBallFrame(ball, 1 / 120, ARENA_SIZE, []);
      const bounds = {
        x: ARENA_SIZE.width / 2,
        y: ARENA_SIZE.height / 2,
        z: ARENA_SIZE.depth / 2,
      };

      expect(Math.abs(nextPosition[0])).toBeLessThanOrEqual(bounds.x + ball.radius);
      expect(Math.abs(nextPosition[1])).toBeLessThanOrEqual(bounds.y + ball.radius);
      expect(Math.abs(nextPosition[2])).toBeLessThanOrEqual(bounds.z + ball.radius);

      ball = { ...ball, position: nextPosition, velocity: nextVelocity };
    }
  });

  it('registers brick collisions with instanced sizing', () => {
    const brick = createTestBrick({ position: [BRICK_SIZE.x, 0, 0] });
    let ball = createTestBall({
      position: [-BRICK_SIZE.x * 1.5, 0, 0],
      velocity: [0.6, 0, 0],
    });

    let hitBrickId: string | undefined;
    let nextVelocity: Ball['velocity'] | undefined;

    for (let i = 0; i < 5 && !hitBrickId; i += 1) {
      const result = stepBallFrame(ball, 1 / 20, ARENA_SIZE, [brick]);

      if (result.hitBrickId) {
        hitBrickId = result.hitBrickId;
        nextVelocity = result.nextVelocity;
        break;
      }

      ball = {
        ...ball,
        position: result.nextPosition,
        velocity: result.nextVelocity,
      };
    }

    expect(hitBrickId).toBe(brick.id);
    expect(nextVelocity).toBeDefined();
    expect(nextVelocity?.[0]).toBeLessThan(0);
  });
});
