import { describe, it, expect } from 'vitest';
import sabRuntime from '../engine/multithread/sabRuntime';
import { createInitialBall } from '../store/createInitials';
import { ARENA_SIZE } from '../store/gameStore';
import type { ArenaSize } from '../engine/collision';

describe('sabRuntime ring-buffer backpressure (test-only helpers)', () => {
  it('returns false when ring is full and resumes after a slot completes', () => {
    // Typed runtime test helper wrapper
    const runtime = sabRuntime as unknown as {
      _test_initInProcess: (capacity?: number, ringSize?: number) => boolean;
      _test_getInternals: () => {
        flags: Int32Array | null;
        notify: Int32Array | null;
        counts: Int32Array | null;
        positions: Float32Array | null;
        velocities: Float32Array | null;
        radii: Float32Array | null;
        damages: Float32Array | null;
        outHitIndices: Int32Array | null;
        metaFloats: Float64Array | null;
        metaInts: Int32Array | null;
        capacity: number;
        ringSize: number;
      };
    };

    // Initialize in-process (test-only helper bypasses cross-origin checks)
    const ok = runtime._test_initInProcess(8, 2);
    expect(ok).toBe(true);

    const internals = runtime._test_getInternals();
    expect(internals.ringSize).toBe(2);

    const balls = [createInitialBall(), createInitialBall()];
    const arena = ARENA_SIZE as unknown as ArenaSize;

    // Fill the ring (two slots)
    expect(sabRuntime.submitJobIfIdle(balls, 0.016, arena)).toBe(true);
    expect(sabRuntime.submitJobIfIdle(balls, 0.016, arena)).toBe(true);

    // Ring should be full now
    expect(sabRuntime.submitJobIfIdle(balls, 0.016, arena)).toBe(false);

    // Simulate worker finishing the first slot (slot 0)
    const { flags, counts, positions, velocities, outHitIndices, capacity } = internals;

    // Sanity guard: if internals aren't available something is wrong
    expect(flags).toBeTruthy();
    expect(counts).toBeTruthy();

    counts![0] = balls.length;

    // Optionally fill in positions/velocities for the slot so result has plausible data
    const posBase = 0 * capacity * 3;
    for (let i = 0; i < balls.length; i++) {
      (positions as Float32Array)[posBase + i * 3 + 0] = balls[i].position[0] + 0.1;
      (positions as Float32Array)[posBase + i * 3 + 1] = balls[i].position[1] + 0.1;
      (positions as Float32Array)[posBase + i * 3 + 2] = balls[i].position[2] + 0.1;
      (velocities as Float32Array)[posBase + i * 3 + 0] = balls[i].velocity[0];
      (velocities as Float32Array)[posBase + i * 3 + 1] = balls[i].velocity[1];
      (velocities as Float32Array)[posBase + i * 3 + 2] = balls[i].velocity[2];
      (outHitIndices as Int32Array)[i] = -1;
    }

    // Mark as done
    (flags as Int32Array)[0] = 3;

    // takeResultIfReady should find the completed slot
    const res = sabRuntime.takeResultIfReady();
    expect(res).not.toBeNull();
    if (res) {
      expect(res.count).toBe(balls.length);
      expect(res.positions.length).toBe(res.count * 3);
    }

    // Now there should be space for another job
    expect(sabRuntime.submitJobIfIdle(balls, 0.016, arena)).toBe(true);

    sabRuntime.destroy();
  });
});
