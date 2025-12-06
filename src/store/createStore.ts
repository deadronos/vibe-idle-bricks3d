import { create } from 'zustand';
import type { StateCreator, StoreApi, UseBoundStore } from 'zustand';
import { persist } from 'zustand/middleware';
import { createBallsSlice } from './slices/balls';
import { createProgressionSlice } from './slices/progression';
import {
  buildInitialState,
  createPersistOptions,
  createPersistenceSlice,
} from './slices/persistence';
import { createUiSlice } from './slices/ui';
import type { GameState } from './types';

/**
 * Type alias for the Zustand state creator with persistence middleware.
 */
type GameStateCreator = StateCreator<GameState, [['zustand/persist', unknown]], [], GameState>;

// Minimal typing for the persist API added by zustand/middleware/persist
type PersistedStoreApi<T> = StoreApi<T> & {
  persist?: {
    // `rehydrate` can return void or a Promise depending on middleware internals
    rehydrate: () => void | Promise<void>;
    // `clearStorage` exists when persist is present
    clearStorage: () => void;
  };
};

/**
 * Combines all state slices into the main game state creator.
 *
 * @param {Function} set - The Zustand set function.
 * @param {Function} get - The Zustand get function.
 * @param {Object} store - The Zustand store API.
 * @returns {GameState} The complete game state object.
 */
const createGameState: GameStateCreator = (set, get, store) => ({
  ...buildInitialState(),
  ...createUiSlice(set, get, store),
  ...createProgressionSlice(set, get, store),
  ...createBallsSlice(set, get, store),
  ...createPersistenceSlice(set, get, store),
});

// Forward reference to break circular dependency - the getter is only called
// during rehydration after the store is fully initialized
/**
 * The main game store hook.
 * Uses Zustand with persistence middleware.
 */
export const useGameStore: UseBoundStore<PersistedStoreApi<GameState>> = create<GameState>()(
  persist(createGameState, createPersistOptions(() => useGameStore))
);
