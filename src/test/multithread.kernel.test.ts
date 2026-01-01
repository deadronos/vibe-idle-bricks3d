import { describe, it, expect } from 'vitest';
import { simulateStep } from '../engine/multithread/kernel';
import type { SimInput } from '../engine/multithread/kernel';
import { stepBallFrame } from '../engine/collision';
import type { Ball, Brick } from '../store/types';

describe('simulateStep kernel (parity with stepBallFrame)', () => {
  it('produces identical next position/velocity for a small batch', () => {
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

    const balls: Ball[] = [
      {
        id: 'ball-1',
        position: [-0.1, 0, 0],
        velocity: [0.2, 0, 0],
        radius: 0.5,
        damage: 1,
        color: '#fff',
      },
      {
        id: 'ball-2',
        position: [1, 0.2, -0.3],
        velocity: [-0.1, 0.05, 0.05],
        radius: 0.25,
        damage: 2,
        color: '#0ff',
      },
    ];

    const count = balls.length;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const radii = new Float32Array(count);
    const damages = new Float32Array(count);
    const ids = balls.map((b) => b.id);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = balls[i].position[0];
      positions[i * 3 + 1] = balls[i].position[1];
      positions[i * 3 + 2] = balls[i].position[2];

      velocities[i * 3 + 0] = balls[i].velocity[0];
      velocities[i * 3 + 1] = balls[i].velocity[1];
      velocities[i * 3 + 2] = balls[i].velocity[2];

      radii[i] = balls[i].radius;
      damages[i] = balls[i].damage;
    }

    const input: SimInput = {
      count,
      delta: 0.016,
      arena,
      positions,
      velocities,
      radii,
      ids,
      damages,
      bricks: [brick],
    };

    const result = simulateStep(input);

    // Compare with stepBallFrame per-ball
    for (let i = 0; i < count; i++) {
      const b = balls[i];
      const expected = stepBallFrame(b, input.delta, arena, [brick]);

      const off = i * 3;
      expect(result.positions[off + 0]).toBeCloseTo(expected.nextPosition[0], 6);
      expect(result.positions[off + 1]).toBeCloseTo(expected.nextPosition[1], 6);
      expect(result.positions[off + 2]).toBeCloseTo(expected.nextPosition[2], 6);

      expect(result.velocities[off + 0]).toBeCloseTo(expected.nextVelocity[0], 6);
      expect(result.velocities[off + 1]).toBeCloseTo(expected.nextVelocity[1], 6);
      expect(result.velocities[off + 2]).toBeCloseTo(expected.nextVelocity[2], 6);

      expect(result.hitBrickIds[i]).toBe(expected.hitBrickId ?? null);
    }
  });
});
