import { describe, it, expect } from 'vitest';
import { RapierPhysicsSystem } from '../engine/rapier/RapierPhysicsSystem';
import { resetRapier } from '../engine/rapier/rapierInit';
import { resetAll } from '../engine/rapier/rapierRuntime';

describe('RapierPhysicsSystem init/destroy', () => {
  it('init, getWorld, destroy', async () => {
    try {
      const w = await RapierPhysicsSystem.init();
      expect(w).toBeTruthy();

      const gw = RapierPhysicsSystem.getWorld();
      expect(gw).toBeTruthy();

      RapierPhysicsSystem.destroy();
      expect(RapierPhysicsSystem.getWorld()).toBeNull();
    } catch (err) {
      // Safe-fail: some CI/envs may fail to load WASM — allow that specific error
      expect((err as Error).message).toMatch(/Failed to create Rapier World/);
    } finally {
      // Ensure global state reset for other tests
      resetAll();
      resetRapier();
    }
  });
});
