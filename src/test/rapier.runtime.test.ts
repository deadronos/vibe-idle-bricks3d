import { describe, it, expect } from 'vitest';
import { setWorld, getWorld, resetWorld, setModule, getModule, resetAll } from '../engine/rapier/rapierRuntime';

describe('rapierRuntime registry', () => {
  it('stores and returns module and world', () => {
    const dummy = { foo: 'bar' } as any;
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
