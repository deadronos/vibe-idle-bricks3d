import { describe, it, expect } from 'vitest';
import {
  setWorld,
  getWorld,
  resetWorld,
  setModule,
  getModule,
  resetAll,
} from '../engine/rapier/rapierRuntime';
import type { RapierWorld } from '../engine/rapier/rapierWorld';

describe('rapierRuntime registry', () => {
  it('stores and returns module and world', () => {
    const dummy: RapierWorld = {
      addBall: () => {},
      removeBall: () => {},
      addBrick: () => {},
      removeBrick: () => {},
      step: () => {},
      drainContactEvents: () => [],
      getBallStates: () => [],
      destroy: () => {},
    };
    expect(getWorld()).toBeNull();
    expect(getModule()).toBeUndefined();

    setWorld(dummy);
    setModule(dummy);

    expect(getWorld()).toBe(dummy);
    expect(getModule()).toBe(dummy);

    resetWorld();
    expect(getWorld()).toBeNull();

    resetAll();
    expect(getModule()).toBeUndefined();
  });
});
