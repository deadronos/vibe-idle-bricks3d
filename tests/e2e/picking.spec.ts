import { describe, expect, it } from 'vitest';
import type { Brick } from '../../src/store/gameStore';
import { getBrickFromInstance } from '../../src/engine/picking';

const sampleBricks: Brick[] = [
  {
    id: 'brick-1',
    type: 'normal',
    position: [0, 0, 0],
    health: 3,
    maxHealth: 3,
    color: '#fff',
    value: 10,
  },
  {
    id: 'brick-2',
    type: 'normal',
    position: [1, 0, 0],
    health: 5,
    maxHealth: 5,
    color: '#0ff',
    value: 12,
  },
];

describe('picking helpers', () => {
  it('resolves a brick when the instance id is in range', () => {
    const brick = getBrickFromInstance(sampleBricks, 1);
    expect(brick?.id).toBe('brick-2');
  });

  it('returns null for null/undefined instance ids', () => {
    expect(getBrickFromInstance(sampleBricks, null)).toBeNull();
    expect(getBrickFromInstance(sampleBricks, undefined)).toBeNull();
  });

  it('returns null when the instance id is out of range', () => {
    expect(getBrickFromInstance(sampleBricks, -1)).toBeNull();
    expect(getBrickFromInstance(sampleBricks, 99)).toBeNull();
  });
});
