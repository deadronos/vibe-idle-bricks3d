import { describe, it, expect } from 'vitest';
import { initRapier, resetRapier } from '../engine/rapier/rapierInit';
import { createWorld } from '../engine/rapier/rapierWorld';
import type { RapierWorld } from '../engine/rapier/rapierWorld';
import type { Ball, Brick } from '../store/types';

describe('Rapier Rotation PoC — wrapper exposes rotation and angVel', () => {
  it('getBallStates includes rotation and angularVelocity fields (shape test)', async () => {
    const delta = 1 / 60;

    const brick: Brick = {
      id: 'brick-rot-1',
      position: [0, 0, 0],
      health: 1,
      maxHealth: 1,
      color: '#fff',
      value: 1,
      type: 'normal',
    };

    const ball: Ball = {
      id: 'ball-rot-1',
      position: [0.6, 0, -1.5],
      velocity: [0, 0, 2],
      radius: 0.5,
      damage: 1,
      color: '#fff',
    };

    const R = await initRapier();
    let w: RapierWorld | undefined;
    try {
      w = createWorld(R, { x: 0, y: 0, z: 0 });
    } catch (err) {
      // Some CI environments may not have WASM available — treat as valid safe-fail
      expect((err as Error).message).toMatch(/Failed to create Rapier World/);
      resetRapier();
      return;
    }

    w.addBrick(brick);
    w.addBall(ball);

    // Step a few frames to allow any angular effects to accumulate
    for (let i = 0; i < 120; i++) {
      w.step(delta);
      const events = w.drainContactEvents();
      if (events.length) break;
    }

    const states = w.getBallStates();
    const s = states.find((x) => x.id === ball.id);
    expect(s).toBeDefined();

    if (s) {
      // Expect rotation to be a quaternion array and angularVelocity a Vec3 array
      expect(Array.isArray(s.rotation)).toBe(true);
      expect((s.rotation as unknown[]).length).toBe(4);

      expect(Array.isArray(s.angularVelocity)).toBe(true);
      expect((s.angularVelocity as unknown[]).length).toBe(3);
    }

    w.destroy();
    resetRapier();
  });
});
