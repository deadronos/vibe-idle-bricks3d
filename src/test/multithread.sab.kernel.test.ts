import { describe, it, expect } from 'vitest';
import { simulateStepInPlace } from '../engine/multithread/kernel';
import { stepBallFrame } from '../engine/collision';
import type { Ball, Brick } from '../store/types';

describe('simulateStepInPlace (in-place SAB-friendly)', () => {
  it('writes results in-place and reports brick indices', () => {
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

    // Use SharedArrayBuffer when available so the function is exercised in SAB mode
    const positionBuf =
      typeof SharedArrayBuffer !== 'undefined'
        ? new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * count * 3)
        : new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT * count * 3);
    const velocityBuf =
      typeof SharedArrayBuffer !== 'undefined'
        ? new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * count * 3)
        : new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT * count * 3);
    const radiiBuf =
      typeof SharedArrayBuffer !== 'undefined'
        ? new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * count)
        : new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT * count);
    const damagesBuf =
      typeof SharedArrayBuffer !== 'undefined'
        ? new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * count)
        : new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT * count);
    const hitIdxBuf =
      typeof SharedArrayBuffer !== 'undefined'
        ? new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * count)
        : new ArrayBuffer(Int32Array.BYTES_PER_ELEMENT * count);

    const positions = new Float32Array(positionBuf);
    const velocities = new Float32Array(velocityBuf);
    const radii = new Float32Array(radiiBuf);
    const damages = new Float32Array(damagesBuf);
    const outHitIdx = new Int32Array(hitIdxBuf);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = balls[i].position[0];
      positions[i * 3 + 1] = balls[i].position[1];
      positions[i * 3 + 2] = balls[i].position[2];

      velocities[i * 3 + 0] = balls[i].velocity[0];
      velocities[i * 3 + 1] = balls[i].velocity[1];
      velocities[i * 3 + 2] = balls[i].velocity[2];

      radii[i] = balls[i].radius;
      damages[i] = balls[i].damage;

      outHitIdx[i] = -2; // sentinel
    }

    simulateStepInPlace(count, 0.016, arena, positions, velocities, radii, damages, [brick], outHitIdx);

    for (let i = 0; i < count; i++) {
      const expected = stepBallFrame(balls[i], 0.016, arena, [brick]);
      const off = i * 3;

      expect(positions[off + 0]).toBeCloseTo(expected.nextPosition[0], 6);
      expect(positions[off + 1]).toBeCloseTo(expected.nextPosition[1], 6);
      expect(positions[off + 2]).toBeCloseTo(expected.nextPosition[2], 6);

      expect(velocities[off + 0]).toBeCloseTo(expected.nextVelocity[0], 6);
      expect(velocities[off + 1]).toBeCloseTo(expected.nextVelocity[1], 6);
      expect(velocities[off + 2]).toBeCloseTo(expected.nextVelocity[2], 6);

      const hitIdx = outHitIdx[i];
      if (expected.hitBrickId) {
        // only one brick provided so index should be 0
        expect(hitIdx).toBe(0);
      } else {
        expect(hitIdx).toBe(-1);
      }
    }
  });
});
