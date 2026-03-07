import { describe, it, expect, vi } from 'vitest';
import { calculateDamage, computeContactNormal, applyFrameHits, type HitResult } from '../engine/physics/utils';
import type { ContactEvent } from '../engine/rapier/types';

describe('physics utils', () => {
  describe('calculateDamage', () => {
    it('returns base damage if crit chance is 0', () => {
      expect(calculateDamage(10, 0)).toBe(10);
    });

    it('returns double damage if crit chance is 1', () => {
      expect(calculateDamage(10, 1)).toBe(20);
    });

    it('returns base or double damage based on random', () => {
      // Mock Math.random
      const originalRandom = Math.random;
      Math.random = () => 0.4;
      expect(calculateDamage(10, 0.5)).toBe(20); // 0.4 < 0.5 -> crit
      Math.random = () => 0.6;
      expect(calculateDamage(10, 0.5)).toBe(10); // 0.6 >= 0.5 -> no crit
      Math.random = originalRandom;
    });
  });

  describe('computeContactNormal', () => {
    it('returns normalized velocity', () => {
      const normal = computeContactNormal([10, 0, 0]);
      expect(normal[0]).toBeCloseTo(1);
      expect(normal[1]).toBe(0);
      expect(normal[2]).toBe(0);
    });

    it('returns [0,0,1] for zero velocity', () => {
        expect(computeContactNormal([0, 0, 0])).toEqual([0, 0, 1]);
    });
  });

  describe('applyFrameHits', () => {
    it('calls applyHits and handleContact', () => {
        const applyHits = vi.fn();
        const handleContact = vi.fn();

        const hits: HitResult[] = [{ brickId: 'b1', damage: 10 }];
        const contacts: ContactEvent[] = [{
            ballId: 'ball1',
            brickId: 'b1',
            point: [0,0,0],
            normal: [0,1,0],
        }];

        applyFrameHits(hits, contacts, { applyHits, handleContact });

        expect(applyHits).toHaveBeenCalledWith(hits);
        expect(handleContact).toHaveBeenCalledTimes(1);
        expect(handleContact).toHaveBeenCalledWith(contacts[0], { applyDamage: false });
    });

    it('does nothing if no hits', () => {
        const applyHits = vi.fn();
        const handleContact = vi.fn();
        applyFrameHits([], [], { applyHits, handleContact });
        expect(applyHits).not.toHaveBeenCalled();
        expect(handleContact).not.toHaveBeenCalled();
    });
  });
});
