import { buildInitialState, useGameStore, type GameState } from '../store/gameStore';

export const resetToKnownState = (overrides: Partial<GameState> = {}) => {
  useGameStore.persist?.clearStorage();
  useGameStore.setState({
    ...buildInitialState(),
    ...overrides,
  });
};

/**
 * Helper to wait for setTimeout(0) in onRehydrateStorage to complete.
 * The rehydration fix uses setTimeout to avoid "Cannot access 'useGameStore'
 * before initialization" errors, so tests need to wait for it.
 */
export const waitForRehydrationFix = () => new Promise((resolve) => setTimeout(resolve, 10));
