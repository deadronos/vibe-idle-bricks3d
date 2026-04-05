import { describe, it, expect } from 'vitest';
import { simulateStep } from '../engine/multithread/kernel';
import type { SimInput } from '../engine/multithread/kernel';
import { stepBallFrame } from '../engine/collision';
import { mockArena, mockBrick, mockBalls } from './multithread.utils';

describe('simulateStep kernel (parity with stepBallFrame)', () => {
  it('produces identical next position/velocity for a small batch', () => {
    const arena = mockArena;
    const brick = mockBrick;
    const balls = mockBalls;
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
