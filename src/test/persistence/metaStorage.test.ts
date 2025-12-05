import { describe, it, expect, beforeEach } from 'vitest';
import { createMetaStorage, hasExistingStorage } from '../../store/persistence/metaStorage';
import { STORAGE_KEY, DEFAULT_WAVE } from '../../store/constants';

describe('metaStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('hasExistingStorage', () => {
    it('should return false if storage is empty', () => {
      expect(hasExistingStorage()).toBe(false);
    });

    it('should return false if storage has invalid json', () => {
      localStorage.setItem(STORAGE_KEY, '{ invalid json');
      expect(hasExistingStorage()).toBe(false);
    });

    it('should return false if storage content is not an object', () => {
      localStorage.setItem(STORAGE_KEY, '"string"');
      expect(hasExistingStorage()).toBe(false);
    });

    it('should return true if storage has valid state', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { ballCount: 1 } }));
      expect(hasExistingStorage()).toBe(true);
    });

    it('should return true if flat storage has valid state', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ballCount: 1 }));
      expect(hasExistingStorage()).toBe(true);
    });
  });

  describe('createMetaStorage', () => {
    const storage = createMetaStorage();

    it('setItem should persist to localStorage and meta if non-default', () => {
      const name = 'test-storage';
      const stateObj = {
        state: { score: 100, wave: 2 }
      };
      const expectedJson = JSON.stringify(stateObj);

      storage.setItem(name, stateObj);

      expect(localStorage.getItem(name)).toBe(expectedJson);
      expect(localStorage.getItem(name + ':meta')).toBe(expectedJson);
    });

    it('setItem should NOT persist to meta if default', () => {
      const name = 'test-storage-default';
      const stateObj = {
        state: {
            score: 0,
            bricksDestroyed: 0,
            wave: DEFAULT_WAVE,
            maxWaveReached: DEFAULT_WAVE,
            ballDamage: 1,
            ballSpeed: 0.1,
            ballCount: 1,
            unlockedAchievements: []
        }
      };
      const expectedJson = JSON.stringify(stateObj);

      storage.setItem(name, stateObj);

      expect(localStorage.getItem(name)).toBe(expectedJson);
      expect(localStorage.getItem(name + ':meta')).toBeNull();
    });

    it('getItem should return raw storage if meta is missing', () => {
      const name = 'test-get-raw';
      const stateObj = { state: { score: 10 } };
      localStorage.setItem(name, JSON.stringify(stateObj));

      expect(storage.getItem(name)).toEqual(stateObj);
    });

    it('getItem should prefer meta if raw is default and meta is not', () => {
      const name = 'test-get-meta';
      const defaultState = {
        state: {
            score: 0,
            bricksDestroyed: 0,
            wave: DEFAULT_WAVE,
            maxWaveReached: DEFAULT_WAVE,
            ballDamage: 1,
            ballSpeed: 0.1,
            ballCount: 1,
            unlockedAchievements: []
        }
      };
      const metaState = { state: { score: 100 } };

      localStorage.setItem(name, JSON.stringify(defaultState));
      localStorage.setItem(name + ':meta', JSON.stringify(metaState));

      expect(storage.getItem(name)).toEqual(metaState);
    });

    it('getItem should prefer raw if raw is not default', () => {
      const name = 'test-get-raw-preferred';
      const rawState = { state: { score: 50 } };
      const metaState = { state: { score: 100 } };

      localStorage.setItem(name, JSON.stringify(rawState));
      localStorage.setItem(name + ':meta', JSON.stringify(metaState));

      expect(storage.getItem(name)).toEqual(rawState);
    });

    it('removeItem should remove both raw and meta', () => {
      const name = 'test-remove';
      localStorage.setItem(name, 'foo');
      localStorage.setItem(name + ':meta', 'bar');

      storage.removeItem(name);

      expect(localStorage.getItem(name)).toBeNull();
      expect(localStorage.getItem(name + ':meta')).toBeNull();
    });
  });
});
