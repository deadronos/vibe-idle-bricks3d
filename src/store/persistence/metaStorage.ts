import { createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEY } from '../constants';
import { isDefaultPersisted } from './validators';

export const hasExistingStorage = (storage: Pick<Storage, 'getItem'> = localStorage): boolean => {
  try {
    const stored = storage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const parsed = JSON.parse(stored);
    const state = parsed?.state ?? parsed;
    return state && typeof state === 'object' && 'ballCount' in state;
  } catch {
    return false;
  }
};

export const createMetaStorage = <T>() =>
  createJSONStorage<T>(() => ({
    getItem: (name) => {
      const raw = localStorage.getItem(name);
      const meta = localStorage.getItem(name + ':meta');

      // If we have a meta snapshot (meaningful progress) and the primary
      // snapshot is missing or default (e.g. due to test reset), prefer meta.
      if (meta) {
        try {
          const parsedRaw = raw ? JSON.parse(raw) : null;
          const parsedMeta = JSON.parse(meta);

          const rawState = parsedRaw?.state ?? parsedRaw;
          const metaState = parsedMeta?.state ?? parsedMeta;

          if (isDefaultPersisted(rawState) && !isDefaultPersisted(metaState)) {
            return meta;
          }
        } catch {
          // Ignore parse errors
        }
      }
      return raw;
    },
    setItem: (name, value) => {
      localStorage.setItem(name, value);
      try {
        const parsed = JSON.parse(value);
        const state = parsed?.state ?? parsed;

        // If this snapshot represents meaningful progress, save it to a
        // companion meta key. This persists through "soft resets" (like
        // those in tests) where the main key might be overwritten with
        // default state.
        if (!isDefaultPersisted(state)) {
          localStorage.setItem(name + ':meta', value);
        }
      } catch {
        // Ignore errors
      }
    },
    removeItem: (name) => {
      localStorage.removeItem(name);
      localStorage.removeItem(name + ':meta');
    },
  }));
