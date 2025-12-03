import type { Brick } from '../store/types';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useInstancedBricks } from '../components/bricks/useInstancedBricks';
import { setWorld, resetAll } from '../engine/rapier/rapierRuntime';

function HookTest({ bricks }: { bricks: Brick[] }) {
  // use the hook; it triggers useLayoutEffect which performs registration
  useInstancedBricks(bricks);
  return <div data-testid="hook" />;
}

describe('useInstancedBricks registration to rapier world', () => {
  it('registers and removes bricks when world is present', () => {
    const add = vi.fn();
    const remove = vi.fn();
    const fakeWorld = {
      addBrick: add,
      removeBrick: remove,
    } as unknown as import('../engine/rapier/rapierWorld').RapierWorld;

    setWorld(fakeWorld);

    const bricks: Brick[] = [
      {
        id: 'b1',
        position: [0, 0, 0] as [number, number, number],
        health: 1,
        maxHealth: 1,
        color: '#fff',
        value: 1,
        type: 'normal',
      },
      {
        id: 'b2',
        position: [1, 0, 0] as [number, number, number],
        health: 1,
        maxHealth: 1,
        color: '#fff',
        value: 1,
        type: 'normal',
      },
    ];

    const r = render(<HookTest bricks={bricks} />);

    // both bricks should be registered
    expect(add).toHaveBeenCalledTimes(2);
    expect(add).toHaveBeenCalledWith(bricks[0]);
    expect(add).toHaveBeenCalledWith(bricks[1]);

    // cleanup should remove registered bricks
    r.unmount();
    expect(remove).toHaveBeenCalledTimes(2);
    expect(remove).toHaveBeenCalledWith('b1');
    expect(remove).toHaveBeenCalledWith('b2');

    resetAll();
  });
});
