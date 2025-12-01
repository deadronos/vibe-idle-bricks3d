import { describe, expect, it } from 'vitest';
import { getDamageColor } from '../components/bricks/utils';
import type { Brick } from '../store/types';

const makeBrick = (overrides: Partial<Brick> = {}): Brick => ({
  id: 'brick-1',
  position: [0, 0, 0],
  health: 10,
  maxHealth: 10,
  color: '#123456',
  type: 'normal',
  value: 10,
  ...overrides,
});

describe('bricks utils - getDamageColor', () => {
  it('returns white when hovered', () => {
    const brick = makeBrick();
    expect(getDamageColor(brick, true)).toBe('#FFFFFF');
  });

  it('returns original color when above half health', () => {
    const brick = makeBrick({ health: 8, maxHealth: 10, color: '#abcdef' });
    expect(getDamageColor(brick, false)).toBe('#abcdef');
  });

  it('returns gradient color when below half health', () => {
    const brick = makeBrick({ health: 2.5, maxHealth: 10 });
    expect(getDamageColor(brick, false)).toBe('hsl(15, 80%, 50%)');
  });
});
