import { describe, it, expect, vi } from 'vitest';
import { createPersistOptions } from '../store/slices/persistence';
import type { GameState } from '../store/types';

describe('persistence slice', () => {
  it('should persist the current timestamp for offline progress calculations', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-23T12:00:00Z'));

    try {
      const options = createPersistOptions(
        () => ({ getState: () => ({}) as GameState } as never)
      );

      const partialize = options.partialize;
      expect(partialize).toBeDefined();

      const partial = partialize!({ lastSaveTime: 123 } as GameState);

      expect(partial.lastSaveTime).toBe(Date.now());
    } finally {
      vi.useRealTimers();
    }
  });
});