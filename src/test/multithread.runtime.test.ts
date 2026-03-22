import { afterEach, describe, expect, it, vi } from 'vitest';

const initRuntime = vi.fn();
const shutdown = vi.fn();
const move = vi.fn((value: unknown) => value);
const spawn = vi.fn();

vi.mock('multithreading', () => ({
  initRuntime,
  shutdown,
  move,
  spawn,
}));

vi.mock('../engine/multithread/sabRuntime', () => ({
  default: {
    ensure: vi.fn(() => false),
    submitJobIfIdle: vi.fn(() => false),
    takeResultIfReady: vi.fn(() => null),
    updateBricks: vi.fn(),
    destroy: vi.fn(),
    available: vi.fn(() => false),
    isInitialized: vi.fn(() => false),
  },
}));

describe('multithread runtime teardown', () => {
  afterEach(() => {
    initRuntime.mockClear();
    shutdown.mockClear();
    move.mockClear();
    spawn.mockClear();
    vi.resetModules();
  });

  it('shuts down and can be initialized again after destroyRuntime()', async () => {
    const runtime = await import('../engine/multithread/runtime');

    runtime.ensureRuntime(2);
    expect(initRuntime).toHaveBeenCalledTimes(1);

    runtime.destroyRuntime();
    expect(shutdown).toHaveBeenCalledTimes(1);

    runtime.ensureRuntime(2);
    expect(initRuntime).toHaveBeenCalledTimes(2);
  });
});