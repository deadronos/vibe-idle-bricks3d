import { describe, it, expect } from 'vitest';
import { stepBallFrame } from '../engine/collision';
import type { Ball, Brick } from '../store/types';

describe('stepBallFrame - walls and bricks', () => {
  it('reflects off X wall and clamps position', () => {
    const arena = { width: 12, height: 10, depth: 8 };
    const radius = 0.3;
    const boundsX = arena.width / 2 - radius;

    const ball: Ball = {
      id: 'ball-wall',
      position: [boundsX - 0.1, 0, 0],
      velocity: [1, 0, 0],
      radius,
      damage: 1,
      color: '#fff',
    };

    const result = stepBallFrame(ball, 1 /* delta */, arena, []);

    expect(result.nextPosition[0]).toBeLessThanOrEqual(boundsX + 1e-6);
    expect(result.nextVelocity[0]).toBeLessThan(0);
  });

  it('detects brick collision and inverts axis velocity', () => {
    const arena = { width: 12, height: 10, depth: 8 };

    const brick: Brick = {
      id: 'brick-1',
      type: 'normal',
      position: [0, 0, 0],
      health: 10,
      maxHealth: 10,
      color: '#fff',
      value: 10,
    };

    const ball: Ball = {
      id: 'ball-1',
      position: [-0.1, 0, 0],
      velocity: [0.2, 0, 0],
      radius: 0.5,
      damage: 1,
      color: '#fff',
    };

    const result = stepBallFrame(ball, 0.016, arena, [brick]);

    expect(result.hitBrickId).toBe(brick.id);
    expect(result.nextVelocity[0]).toBeLessThan(0);
  });
});
