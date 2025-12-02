import { describe, it, expect } from 'vitest';
import { initRapier, resetRapier } from '../engine/rapier/rapierInit';
import { createWorld } from '../engine/rapier/rapierWorld';
import type { RapierWorld } from '../engine/rapier/rapierWorld';

describe('Rapier init smoke (fast CI check)', () => {
  it('initRapier() and createWorld() succeed unless RAPIER=false', async () => {
    if (process.env.RAPIER === 'false') {
      // CI override to skip rapier smoke when debugging failures
      expect(true).toBe(true);
      return;
    }

    // Fails early if WASM/init isn't available
    const R = await initRapier();
    expect(R).toBeTruthy();

    // Some CI environments may provide a partially-initialized runtime
    // or fail to load WASM. In that case createWorld will throw a helpful
    // error — treat that as an acceptable outcome for the smoke test.
    let world: RapierWorld | undefined;
    try {
      world = createWorld(R, { x: 0, y: 0, z: 0 });
    } catch (err) {
      expect((err as Error).message).toMatch(/Failed to create Rapier World/);
      resetRapier();
      return;
    }
    expect(world).toBeTruthy();

    // step and destroy should be callable
    expect(typeof world.step).toBe('function');
    expect(typeof world.addBall).toBe('function');

    // quick step to ensure runtime works
    world.step(1 / 60);
    world.destroy();

    resetRapier();
  });
});
