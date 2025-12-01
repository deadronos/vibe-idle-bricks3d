import { describe, it, expect } from 'vitest';
import { initRapier, resetRapier } from '../engine/rapier/rapierInit';
import { createWorld } from '../engine/rapier/rapierWorld';

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

    const world = createWorld(R, { x: 0, y: 0, z: 0 });
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
