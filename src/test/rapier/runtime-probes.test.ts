/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import {
  maybeHandle,
  readTranslation,
  readLinvel,
  safeApplyImpulse,
} from '../../engine/rapier/runtime-probes';

describe('runtime-probes', () => {
  describe('maybeHandle', () => {
    it('returns handle property if object has it', () => {
      expect(maybeHandle({ handle: 123 })).toBe(123);
    });
    it('returns object itself if no handle property', () => {
      const obj = { foo: 'bar' };
      expect(maybeHandle(obj)).toBe(obj);
    });
    it('returns primitive as is', () => {
      expect(maybeHandle(123)).toBe(123);
    });
  });

  describe('readTranslation', () => {
    it('reads from function returning array', () => {
      const body = { translation: () => [1, 2, 3] };
      expect(readTranslation(body as any)).toEqual([1, 2, 3]);
    });
    it('reads from function returning object', () => {
      const body = { translation: () => ({ x: 1, y: 2, z: 3 }) };
      expect(readTranslation(body as any)).toEqual([1, 2, 3]);
    });
    it('reads from property object', () => {
        const body = { translation: { x: 1, y: 2, z: 3 } };
        expect(readTranslation(body as any)).toEqual([1, 2, 3]);
    });
    it('defaults to 0', () => {
        const body = { translation: () => ({ x: 1 }) }; // missing y, z
        expect(readTranslation(body as any)).toEqual([1, 0, 0]);
    });
  });

  describe('readLinvel', () => {
    it('reads from function returning array', () => {
      const body = { linvel: () => [1, 2, 3] };
      expect(readLinvel(body as any)).toEqual([1, 2, 3]);
    });
    it('reads from function returning object', () => {
      const body = { linvel: () => ({ x: 1, y: 2, z: 3 }) };
      expect(readLinvel(body as any)).toEqual([1, 2, 3]);
    });
  });

  describe('safeApplyImpulse', () => {
    it('uses applyImpulse(obj) if available', () => {
        const applyImpulse = vi.fn();
        const body = { applyImpulse };
        safeApplyImpulse(body as any, [1, 2, 3]);
        expect(applyImpulse).toHaveBeenCalledWith({x:1, y:2, z:3}, true);
    });
     it('uses applyImpulse(vec) fallback', () => {
        const applyImpulse = vi.fn().mockImplementation((arg) => {
            if (arg.x !== undefined) throw new Error('fail obj');
            return;
        });
        const body = { applyImpulse };
        safeApplyImpulse(body as any, [1, 2, 3]);
        expect(applyImpulse).toHaveBeenCalledWith([1, 2, 3], true);
    });
    it('falls back to setLinvel', () => {
        const setLinvel = vi.fn();
        const body = {
            linvel: () => ({x: 0, y: 0, z: 0}),
            setLinvel
        };
        safeApplyImpulse(body as any, [1, 2, 3]);
        // 0.5 scale
        expect(setLinvel).toHaveBeenCalledWith(0.5, 1, 1.5);
    });
  });
});
