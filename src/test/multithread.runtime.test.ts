import { vi, describe, it, expect, afterEach } from 'vitest';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-var-requires */

// Mock multithreading before importing runtime
vi.mock('multithreading', () => {
  return {
    initRuntime: vi.fn(),
    move: vi.fn((x: unknown) => x),
    spawn: vi.fn(),
  };
});

const dummyArena = { width: 10, height: 10, depth: 10 } as const;

function makeInput(count = 1) {
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

afterEach(() => {
  vi.restoreAllMocks();
});

describe('multithread/runtime integration (mocked pool)', () => {
  it('logs worker error when job returns error', async () => {
    const mt = await import('multithreading');

    // make spawn return a handle whose join resolves to an error result
    (mt.spawn as any).mockImplementation(() => ({
      join: () => Promise.resolve({ ok: false, error: new Error('Worker Crashed: oops') }),
    }));

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const runtime = await import('../engine/multithread/runtime.ts');

    runtime.ensureRuntime();
    runtime.tickSimulation(makeInput(2));

    expect(mt.spawn).toHaveBeenCalled();

    // allow join promise microtask to run
    await new Promise((r) => setTimeout(r, 0));

    expect(warn).toHaveBeenCalled();

    // No pending result should have been set
    expect(runtime.takePendingResult()).toBeNull();
  });

  it('stores pending result when worker returns ok', async () => {
    const mt = await import('multithreading');

    const fakeResult = {
      positions: new Float32Array([1, 2, 3]),
      velocities: new Float32Array([0, 0, 0]),
      hitBrickIds: [null],
    } as const;

    (mt.spawn as any).mockImplementation(() => ({
      join: () => Promise.resolve({ ok: true, value: fakeResult }),
    }));

    const runtime = await import('../engine/multithread/runtime.ts');

    runtime.ensureRuntime();
    runtime.tickSimulation(makeInput(1));

    // allow join promise microtask to run
    await new Promise((r) => setTimeout(r, 0));

    const r = runtime.takePendingResult();
    expect(r).not.toBeNull();
    expect((r as any).positions[0]).toBe(1);
  });
});
