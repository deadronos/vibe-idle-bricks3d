/* eslint-disable @typescript-eslint/no-explicit-any */

import { vi, describe, it, expect } from 'vitest';

// Mock multithreading before importing runtime
vi.mock('multithreading', () => {
  return {
    initRuntime: vi.fn(),
    move: vi.fn((x: unknown) => x),
    spawn: vi.fn(),
  };
});

function makeInput(count = 1) {
  const dummyArena = { width: 10, height: 10, depth: 10 } as const;
  return {
    count,
    delta: 0.016,
    arena: dummyArena,
    positions: new Float32Array(count * 3).fill(0),
    velocities: new Float32Array(count * 3).fill(0),
    radii: new Float32Array(count).fill(1),
    ids: Array.from({ length: count }, (_, i) => `ball-${i}`),
    damages: new Float32Array(count).fill(1),
    bricks: [],
  };
}

describe('runtime job in-flight reporting', () => {
  it('reports job in flight while join promise is unresolved', async () => {
    const mt = await import('multithreading');

    // Mock spawn to return a join promise that resolves later
    (mt.spawn as any).mockImplementation(() => ({
      join: () => new Promise((res) => setTimeout(() => res({ ok: true, value: {
        positions: new Float32Array([1,2,3]),
        velocities: new Float32Array([0,0,0]),
        hitBrickIds: [null]
      } }), 20))
    }));

    const runtime = await import('../engine/multithread/runtime.ts');

    runtime.ensureRuntime();
    runtime.tickSimulation(makeInput(1));

    // Immediately after starting a job, runtime should report job in flight
    expect(runtime.isJobInFlight()).toBe(true);

    // Wait for join promise to resolve
    await new Promise((r) => setTimeout(r, 40));

    // After completion, job should no longer be in flight and result available
    expect(runtime.isJobInFlight()).toBe(false);
    const r = runtime.takePendingResult();
    expect(r).not.toBeNull();
  });
});