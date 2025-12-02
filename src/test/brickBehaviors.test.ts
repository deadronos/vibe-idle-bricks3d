import { describe, it, expect, beforeEach } from 'vitest';
import { buildInitialState, useGameStore } from '../store/gameStore';
import { handleContact } from '../systems/brickBehaviors';

const resetToKnownState = (overrides = {}) => {
  useGameStore.persist?.clearStorage();
  useGameStore.setState({ ...buildInitialState(), ...overrides });
};

describe('BrickBehaviors', () => {
  beforeEach(() => {
    resetToKnownState();
  });

  it('handleContact without applyDamage does not change brick health', () => {
    // Setup a single brick and ball
    useGameStore.setState({
      bricks: [
        {
          id: 'brick-test-1',
          position: [0, 0, 0],
          health: 10,
          maxHealth: 10,
          color: '#fff',
          value: 1,
          type: 'normal',
        },
      ],
      balls: [
        {
          id: 'ball-test-1',
          position: [0, 0, -1],
          velocity: [0, 0, 1],
          radius: 0.5,
          damage: 2,
          color: '#fff',
        },
      ],
    });

    handleContact({ ballId: 'ball-test-1', brickId: 'brick-test-1', point: [0, 0, 0], normal: [0, 0, 1], impulse: 2, relativeVelocity: [0, 0, 1] }, { applyDamage: false });

    const state = useGameStore.getState();
    const b = state.bricks.find((x) => x.id === 'brick-test-1');
    expect(b).toBeDefined();
    expect(b?.health).toBe(10);
  });

  it('handleContact with applyDamage true reduces brick health', () => {
    useGameStore.setState({
      bricks: [
        {
          id: 'brick-test-2',
          position: [0, 0, 0],
          health: 10,
          maxHealth: 10,
          color: '#fff',
          value: 1,
          type: 'normal',
        },
      ],
      balls: [
        {
          id: 'ball-test-2',
          position: [0, 0, -1],
          velocity: [0, 0, 1],
          radius: 0.5,
          damage: 3,
          color: '#fff',
        },
      ],
    });

    handleContact({ ballId: 'ball-test-2', brickId: 'brick-test-2', point: [0, 0, 0], normal: [0, 0, 1], impulse: 3, relativeVelocity: [0, 0, 1] }, { applyDamage: true });

    const state = useGameStore.getState();
    const b = state.bricks.find((x) => x.id === 'brick-test-2');
    expect(b).toBeDefined();
    expect(b?.health).toBe(7);
  });
});
