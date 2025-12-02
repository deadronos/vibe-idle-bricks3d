import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, buildInitialState } from '../store/gameStore';
import type { Brick } from '../store/types';

describe('Rapier integration helpers (store)', () => {
  beforeEach(() => {
    // Reset store to a clean state
    try {
      // persist is an optional middleware property on the store
      const storeAny = useGameStore as unknown as { persist?: { clearStorage?: () => void } };
      storeAny.persist?.clearStorage?.();
    } catch {
      // ignore
    }
    useGameStore.setState(buildInitialState());
  });

  it('applyHits reduces brick health and does not increment combo for single hit', () => {
    const brick: Brick = {
      id: 'b1',
      position: [0, 0, 0],
      health: 3,
      maxHealth: 3,
      color: '#fff',
      value: 5,
      type: 'normal',
    };

    useGameStore.setState({ bricks: [brick], comboCount: 0, comboMultiplier: 1 });

    const apply = useGameStore.getState().applyHits;
    expect(apply).toBeTruthy();
    apply?.([{ brickId: 'b1', damage: 1 }]);

    const b = useGameStore.getState().bricks.find((x) => x.id === 'b1');
    expect(b!.health).toBe(2);
    expect(useGameStore.getState().comboCount).toBe(0);
  });

  it('applyHits increments combo when multiple bricks are hit in same frame', () => {
    const bricks: Brick[] = [
      {
        id: 'b1',
        position: [0, 0, 0],
        health: 3,
        maxHealth: 3,
        color: '#fff',
        value: 5,
        type: 'normal',
      },
      {
        id: 'b2',
        position: [1, 0, 0],
        health: 3,
        maxHealth: 3,
        color: '#fff',
        value: 5,
        type: 'normal',
      },
    ];

    useGameStore.setState({ bricks, comboCount: 0, comboMultiplier: 1 });

    const apply = useGameStore.getState().applyHits;
    apply?.([
      { brickId: 'b1', damage: 1 },
      { brickId: 'b2', damage: 2 },
    ]);

    expect(useGameStore.getState().comboCount).toBe(1);
    expect(useGameStore.getState().comboMultiplier).toBeCloseTo(1.05);
  });
});
