import { describe, it, expect, vi } from 'vitest';
import { createPersistOptions } from '../store/slices/persistence';
import type { GameState } from '../store/types';

describe('persistence slice', () => {
  it('should persist the current timestamp for offline progress calculations', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-23T12:00:00Z'));

    const options = createPersistOptions(
      () => ({ getState: () => ({}) as GameState } as never)
    );

    const partial = options.partialize({ lastSaveTime: 123 } as GameState);

    expect(partial.lastSaveTime).toBe(Date.now());

    vi.useRealTimers();
  });
});