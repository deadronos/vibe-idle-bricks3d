import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useInstancedBricks } from '../components/bricks/useInstancedBricks';
import { setWorld, resetAll } from '../engine/rapier/rapierRuntime';

function HookTest({ bricks }: { bricks: any[] }) {
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
    } as any;

    setWorld(fakeWorld);

    const bricks = [
      { id: 'b1', position: [0, 0, 0] },
      { id: 'b2', position: [1, 0, 0] },
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
