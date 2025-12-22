import { describe, it, expect } from 'vitest';
import { applyWorkerResultToBalls } from '../engine/multithread/resultApplier';

function createBall(id = 'ball-0') {
  return {
    id,
    position: [0, 0, 0] as [number, number, number],
    velocity: [0, 0, 0] as [number, number, number],
    radius: 1,
    damage: 1,
    color: '#fff',
  };
}

function createBrick(id = 'brick-0') {
  return { id, position: [0, 0, 0] as [number, number, number], health: 10, maxHealth: 10, color: '#fff', value: 1, type: 'normal' as const };
}

describe('applyWorkerResultToBalls', () => {
  it('applies partial result when result has fewer entries than current balls', () => {
    const balls = [createBall('b0'), createBall('b1')];

    // result contains only one ball
    const positions = new Float32Array([1, 2, 3]);
    const velocities = new Float32Array([0, 0, 0]);
    const hitIndices = new Int32Array([0]);
    const bricks = [createBrick('brick-0')];

    const { nextBalls, hits, contactInfos } = applyWorkerResultToBalls(balls, positions, velocities, { hitIndices, bricks, critChance: 0 });

    expect(nextBalls.length).toBe(2);
    expect(nextBalls[0].position).toEqual([1, 2, 3]);
    expect(nextBalls[1].position).toEqual([0, 0, 0]); // unchanged

    expect(hits.length).toBe(1);
    expect(hits[0].brickId).toBe('brick-0');
    expect(contactInfos.length).toBe(1);
  });

  it('applies hitIds from transferable result', () => {
    const balls = [createBall('b0'), createBall('b1')];

    const positions = new Float32Array([4, 5, 6, 7, 8, 9]);
    const velocities = new Float32Array([0, 0, 0, 0, 0, 0]);
    const hitIds = ['hit-1', null];

    const { nextBalls, hits, contactInfos } = applyWorkerResultToBalls(balls, positions, velocities, { hitIds, critChance: 0 });

    expect(nextBalls[0].position).toEqual([4, 5, 6]);
    expect(nextBalls[1].position).toEqual([7, 8, 9]);

    expect(hits.length).toBe(1);
    expect(hits[0].brickId).toBe('hit-1');
    expect(contactInfos.length).toBe(1);
  });
});