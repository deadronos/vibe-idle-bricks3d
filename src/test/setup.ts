import '@testing-library/jest-dom';

type StorageLike = Partial<Storage> & {
  getItem?: (key: string) => string | null;
  setItem?: (key: string, value: string) => void;
  removeItem?: (key: string) => void;
  clear?: () => void;
  key?: (index: number) => string | null;
  length?: number;
};

/**
 * Some test environments provide a partial localStorage implementation.
 * Normalize it so persistence code can rely on Storage APIs consistently.
 */
const ensureStorage = (name: 'localStorage' | 'sessionStorage') => {
  const backing = new Map<string, string>();
  const target = (globalThis[name] ?? {}) as StorageLike;

  const getItem = (key: string): string | null => {
    if (typeof target.getItem === 'function') return target.getItem.call(target, key);
    return backing.has(key) ? backing.get(key)! : null;
  };

  const setItem = (key: string, value: string): void => {
    if (typeof target.setItem === 'function') {
      target.setItem.call(target, key, value);
      return;
    }
    backing.set(String(key), String(value));
  };

  const removeItem = (key: string): void => {
    if (typeof target.removeItem === 'function') {
      target.removeItem.call(target, key);
      return;
    }
    backing.delete(key);
  };

  const clear = (): void => {
    if (typeof target.clear === 'function') {
      target.clear.call(target);
      return;
    }
    backing.clear();
  };

  const key = (index: number): string | null => {
    if (typeof target.key === 'function') return target.key.call(target, index);
    return Array.from(backing.keys())[index] ?? null;
  };

  const normalized = {
    ...target,
    getItem,
    setItem,
    removeItem,
    clear,
    key,
    get length() {
      if (typeof target.length === 'number') return target.length;
      return backing.size;
    },
  } satisfies StorageLike;

  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: normalized,
    writable: true,
  });
};

ensureStorage('localStorage');
ensureStorage('sessionStorage');
