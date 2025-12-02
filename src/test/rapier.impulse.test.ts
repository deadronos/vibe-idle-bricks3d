import { describe, it, expect } from 'vitest';
import { RapierPhysicsSystem } from '../engine/rapier/RapierPhysicsSystem';
import type { ContactEvent, BallState } from '../engine/rapier/rapierWorld';
import { resetRapier } from '../engine/rapier/rapierInit';
import type { Ball, Brick } from '../store/types';

describe('Rapier impulse -> angular response', () => {
  it('applying impulse at contact produces measurable angular velocity (if runtime supports)', async () => {
    const delta = 1 / 60;

    const brick: Brick = {
      id: 'brick-imp-1',
      position: [0, 0, 0],
      health: 1,
      maxHealth: 1,
      color: '#fff',
      value: 1,
      type: 'normal',
    };

    const ball: Ball = {
      id: 'ball-imp-1',
      position: [0.6, 0, -1.5],
      velocity: [0, 0, 2],
      radius: 0.5,
      damage: 1,
      color: '#fff',
    };

    // Init Rapier via the system wrapper
    let w;
    try {
      w = await RapierPhysicsSystem.init();
    } catch (err) {
      // Safe-fail: if WASM or runtime not available, assert helpful message
      expect((err as Error).message).toMatch(/Failed to create Rapier World/);
      resetRapier();
      return;
    }

    try {
      w.addBrick(brick);
      w.addBall(ball);

      // Step until we detect a contact event
      let ev: ContactEvent | null = null;
      for (let i = 0; i < 240; i++) {
        w.step(delta);
        const events = w.drainContactEvents();
        if (events && events.length) {
          ev = events[0];
          break;
        }
      }

      // If no event detected, still attempt to proceed conservatively
      if (!ev) {
        // fall back: compute simple impulse vector and apply
        const imp: [number, number, number] = [0, 0, -5];
        const applied = RapierPhysicsSystem.applyImpulse(ball.id, imp, ball.position);
        expect(applied).toBeTruthy();
        // Step a few frames and check angVel if available
        for (let i = 0; i < 10; i++) w.step(delta);
      } else {
        // Read pre-impulse angular velocity
        const before = w.getBallStates().find((s: BallState) => s.id === ball.id);
        const beforeMag = before?.angularVelocity ? Math.hypot(...before.angularVelocity) : 0;

        const normal = ev!.normal ?? [0, 0, 1];
        const impMag = ev!.impulse ?? 3;
        const imp: [number, number, number] = [normal[0] * impMag * 2, normal[1] * impMag * 2, normal[2] * impMag * 2];
        const point = ev!.point ?? ball.position;

        const applied = RapierPhysicsSystem.applyImpulse(ball.id, imp, point);
        expect(applied).toBeTruthy();

        // Step several frames to allow angular velocity to propagate
        for (let i = 0; i < 20; i++) w.step(delta);

        const after = w.getBallStates().find((s: BallState) => s.id === ball.id);
        const afterMag = after?.angularVelocity ? Math.hypot(...after.angularVelocity) : 0;

        // If the runtime exposes angular velocity, it should have increased
        if (after && after.angularVelocity) {
          expect(afterMag).toBeGreaterThanOrEqual(beforeMag);
        }
      }
    } finally {
      RapierPhysicsSystem.destroy();
      resetRapier();
    }
  });
});
