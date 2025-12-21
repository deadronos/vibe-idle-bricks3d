import { describe, it, expect } from 'vitest';
import sabRuntime from '../engine/multithread/sabRuntime';
import { createInitialBall } from '../store/createInitials';
import { ARENA_SIZE } from '../store/gameStore';
import type { ArenaSize } from '../engine/collision';

// These tests require crossOriginIsolated + SharedArrayBuffer which may not be
// present in CI environments. We guard the tests and skip if not available.

describe('sabRuntime ring-buffer behavior (dev-only)', () => {
  it('initializes ring buffer and processes a simple job', async () => {
    if (!sabRuntime.available()) {
      // Not available in CI/dev containers; skip gracefully
      return;
    }

    const ensured = sabRuntime.ensure(64, 2);
    expect(ensured).toBe(true);

    // Create a small set of balls and submit a job
    const balls = [createInitialBall(), createInitialBall(), createInitialBall()];

    // Best-effort: update bricks to empty to avoid incidental hits
    sabRuntime.updateBricks([]);

    const arena = ARENA_SIZE as unknown as ArenaSize;
    const started = sabRuntime.submitJobIfIdle(balls, 0.016, arena);
    expect(started).toBe(true);

    // Poll for a result (timeout after 2s)
    const result = await new Promise<ReturnType<typeof sabRuntime.takeResultIfReady> | null>((resolve) => {
      const deadline = Date.now() + 2000;
      const id = setInterval(() => {
        const r = sabRuntime.takeResultIfReady();
        if (r) {
          clearInterval(id);
          resolve(r);
        } else if (Date.now() > deadline) {
          clearInterval(id);
          resolve(null);
        }
      }, 20);
    });

    expect(result).not.toBeNull();
    if (result) {
      expect(result.count).toBeGreaterThan(0);
      expect(result.positions.length).toBe(result.count * 3);
      expect(result.velocities.length).toBe(result.count * 3);
      expect(result.hitIndices.length).toBeGreaterThanOrEqual(result.count);
    }

    sabRuntime.destroy();
  });
});
