/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBodyManager } from '../../engine/rapier/body-management';

describe('body-management', () => {
  let mockRuntime: any;
  let mockRapier: any;
  let manager: ReturnType<typeof createBodyManager>;

  beforeEach(() => {
    mockRuntime = {
      createRigidBody: vi.fn().mockReturnValue({}),
      createCollider: vi.fn().mockReturnValue({}),
      removeRigidBody: vi.fn(),
    };
    mockRapier = {
      RigidBodyDesc: {
        dynamic: vi.fn().mockReturnValue({
          setTranslation: vi.fn(),
          setLinvel: vi.fn(),
        }),
        fixed: vi.fn().mockReturnValue({
          setTranslation: vi.fn(),
        }),
      },
      ColliderDesc: {
        ball: vi.fn().mockReturnValue({
          setRestitution: vi.fn().mockReturnThis(),
          setFriction: vi.fn().mockReturnThis(),
        }),
        cuboid: vi.fn().mockReturnValue({
          setRestitution: vi.fn().mockReturnThis(),
          setFriction: vi.fn().mockReturnThis(),
        }),
      },
    };
    manager = createBodyManager(mockRapier, mockRuntime);
  });

  it('adds a ball', () => {
    const ball = { id: 'b1', position: [0, 0, 0], velocity: [0, 0, 0], radius: 1 } as any;
    manager.addBall(ball);
    expect(mockRuntime.createRigidBody).toHaveBeenCalled();
    expect(manager.ballBodies.has('b1')).toBe(true);
  });

  it('removes a ball', () => {
    const ball = { id: 'b1', position: [0, 0, 0], velocity: [0, 0, 0], radius: 1 } as any;
    manager.addBall(ball);
    manager.removeBall('b1');
    expect(mockRuntime.removeRigidBody).toHaveBeenCalled();
    expect(manager.ballBodies.has('b1')).toBe(false);
  });

  it('adds a brick', () => {
    const brick = { id: 'bk1', position: [10, 10, 0], value: 1 } as any;
    manager.addBrick(brick);
    expect(mockRuntime.createRigidBody).toHaveBeenCalled();
    expect(manager.brickBodies.has('bk1')).toBe(true);
  });

  it('removes a brick', () => {
    const brick = { id: 'bk1', position: [10, 10, 0], value: 1 } as any;
    manager.addBrick(brick);
    manager.removeBrick('bk1');
    expect(mockRuntime.removeRigidBody).toHaveBeenCalled();
    expect(manager.brickBodies.has('bk1')).toBe(false);
  });

  it('gets ball states', () => {
      const ball = { id: 'b1', position: [0, 0, 0], velocity: [0, 0, 0], radius: 1 } as any;
      const body = {
          translation: () => ({ x: 1, y: 2, z: 3 }),
          linvel: () => ({ x: 4, y: 5, z: 6 }),
          rotation: () => ({ x: 0, y: 0, z: 0, w: 1 }),
          angvel: () => ({ x: 0, y: 0, z: 0 })
      };
      mockRuntime.createRigidBody.mockReturnValue(body);
      manager.addBall(ball);

      const states = manager.getBallStates();
      expect(states).toHaveLength(1);
      expect(states[0].position).toEqual([1, 2, 3]);
      expect(states[0].velocity).toEqual([4, 5, 6]);
  });
});
