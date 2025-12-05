/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { detectOverlaps } from '../../engine/rapier/overlap-detector';

describe('overlap-detector', () => {
  it('detects overlap between ball and brick', () => {
    const ballStates = [
      {
        id: 'b1',
        position: [0, 0, 0], // Center
        velocity: [0, 0, 0],
        rotation: [0, 0, 0, 1],
        angularVelocity: [0, 0, 0],
      },
    ] as any;

    const brickBodies = new Map();
    brickBodies.set('k1', {
      body: { translation: () => ({ x: 0, y: 0, z: 0 }) }, // Overlapping
      size: { x: 2, y: 1, z: 1 },
    });

    const events = detectOverlaps(ballStates, brickBodies);
    expect(events).toHaveLength(1);
    expect(events[0].ballId).toBe('b1');
    expect(events[0].brickId).toBe('k1');
  });

  it('ignores distant objects', () => {
    const ballStates = [
      {
        id: 'b1',
        position: [100, 0, 0],
        velocity: [0, 0, 0],
        rotation: [0, 0, 0, 1],
        angularVelocity: [0, 0, 0],
      },
    ] as any;

    const brickBodies = new Map();
    brickBodies.set('k1', {
      body: { translation: () => ({ x: 0, y: 0, z: 0 }) },
      size: { x: 2, y: 1, z: 1 },
    });

    const events = detectOverlaps(ballStates, brickBodies);
    expect(events).toHaveLength(0);
  });
});
