import { describe, it, expect, beforeEach } from 'vitest';
import { buildInitialState, useGameStore } from '../store/gameStore';
import {
  computeHitDamage,
  registerBehavior as registerTestBehavior,
  resetBehaviorRegistry,
} from '../systems/behaviors';
import { handleContact } from '../systems/brickBehaviors';

const resetToKnownState = (overrides = {}) => {
  useGameStore.persist?.clearStorage();
  useGameStore.setState({ ...buildInitialState(), ...overrides });
};

describe('BrickBehaviors', () => {
  beforeEach(() => {
    resetBehaviorRegistry();
    resetToKnownState();
  });

  it('handleContact without applyDamage does not change brick health', async () => {
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

    await handleContact(
      {
        ballId: 'ball-test-1',
        brickId: 'brick-test-1',
        point: [0, 0, 0],
        normal: [0, 0, 1],
        impulse: 2,
        relativeVelocity: [0, 0, 1],
      },
      { applyDamage: false }
    );

    const state = useGameStore.getState();
    const b = state.bricks.find((x) => x.id === 'brick-test-1');
    expect(b).toBeDefined();
    expect(b?.health).toBe(10);
  });

  it('handleContact with applyDamage true reduces brick health', async () => {
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

    await handleContact(
      {
        ballId: 'ball-test-2',
        brickId: 'brick-test-2',
        point: [0, 0, 0],
        normal: [0, 0, 1],
        impulse: 3,
        relativeVelocity: [0, 0, 1],
      },
      { applyDamage: true }
    );

    const state = useGameStore.getState();
    const b = state.bricks.find((x) => x.id === 'brick-test-2');
    expect(b).toBeDefined();
    expect(b?.health).toBe(7);
  });

  it('computeHitDamage prefers ball damage and falls back to impulse', () => {
    resetToKnownState({
      balls: [
        {
          id: 'ball-dmg-1',
          position: [0, 0, 0],
          velocity: [0, 0, 0],
          radius: 0.5,
          damage: 5,
          color: '#fff',
        },
      ],
    });

    const ctx = { getState: useGameStore.getState };
    const damageFromBall = computeHitDamage(ctx, {
      ballId: 'ball-dmg-1',
      brickId: 'brick-any',
      point: [0, 0, 0],
      normal: [0, 0, 1],
      impulse: 2,
    });
    expect(damageFromBall).toBe(5);

    const damageFromImpulse = computeHitDamage(ctx, {
      brickId: 'brick-any',
      point: [0, 0, 0],
      normal: [0, 0, 1],
      impulse: 3,
    });
    expect(damageFromImpulse).toBe(3);
  });

  it('invokes registered behaviors for matching brick types', async () => {
    let hits = 0;
    registerTestBehavior('golden', {
      name: 'custom-hit-counter',
      onHit: () => {
        hits += 1;
      },
    });

    resetToKnownState({
      bricks: [
        {
          id: 'brick-custom-1',
          position: [0, 0, 0],
          health: 5,
          maxHealth: 5,
          color: '#ff0',
          value: 1,
          type: 'golden',
        },
      ],
    });

    await handleContact(
      {
        ballId: 'ball-test-custom',
        brickId: 'brick-custom-1',
        point: [0, 0, 0],
        normal: [0, 0, 1],
        impulse: 1,
        relativeVelocity: [0, 0, 1],
      },
      { applyDamage: false }
    );

    expect(hits).toBe(1);
  });
});
