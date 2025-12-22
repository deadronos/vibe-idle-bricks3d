/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect } from 'vitest';
import sabRuntime from '../engine/multithread/sabRuntime';

const dummyArena = { width: 10, height: 10, depth: 10 } as const;

describe('SAB runtime job id propagation', () => {
  it('returns original job ids with results in ring-mode', () => {
    // Init in-process SAB runtime (test helper)
    expect(sabRuntime._test_initInProcess(8, 4)).toBe(true);

    const balls = [
      { id: 'a', position: [0, 0, 0], velocity: [0, 0, 0], radius: 1, damage: 1, color: '#fff' },
      { id: 'b', position: [1, 2, 3], velocity: [0, 0, 0], radius: 1, damage: 1, color: '#fff' },
    ];

    // Submit a job; expect it to be accepted into a slot
    const started = sabRuntime.submitJobIfIdle(balls as any, 0.016, dummyArena);
    expect(started).toBe(true);

    const internals = sabRuntime._test_getInternals();
    const { flags, counts, positions, capacity } = internals as any;

    // Find the slot that was marked pending (flag === 1)
    let slot = -1;
    for (let i = 0; i < flags.length; i++) {
      if (flags[i] === 1) {
        slot = i;
        break;
      }
    }

    expect(slot).not.toBe(-1);

    // Simulate worker finishing: write counts and per-slot positions
    const count = balls.length;
    const posBase = slot * capacity * 3;
    // Write positions for two balls
    positions[posBase + 0] = 10;
    positions[posBase + 1] = 11;
    positions[posBase + 2] = 12;

    positions[posBase + 3] = 20;
    positions[posBase + 4] = 21;
    positions[posBase + 5] = 22;

    // counts and then mark as done
    counts[slot] = count;
    // Flag 3 = done
    flags[slot] = 3;

    const res = sabRuntime.takeResultIfReady();
    expect(res).not.toBeNull();
    if (res) {
      expect((res as any).jobIds).toEqual(['a', 'b']);
      expect(res.count).toBe(2);
      // Validate positions slice
      expect(res.positions[0]).toBe(10);
      expect(res.positions[3]).toBe(20);
    }
  });
});