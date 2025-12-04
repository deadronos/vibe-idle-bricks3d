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

type GameStateCreator = StateCreator<GameState, [['zustand/persist', unknown]], [], GameState>;

const createGameState: GameStateCreator = (set, get, store) => ({
  ...buildInitialState(),
  ...createUiSlice(set, get, store),
  ...createProgressionSlice(set, get, store),
  ...createBallsSlice(set, get, store),
  ...createPersistenceSlice(set, get, store),
});

// Forward reference to break circular dependency - the getter is only called
// during rehydration after the store is fully initialized
export const useGameStore: UseBoundStore<StoreApi<GameState>> = create<GameState>()(
  persist(createGameState, createPersistOptions(() => useGameStore))
);
