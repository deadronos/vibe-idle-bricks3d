import type { StateCreator } from 'zustand';
import type { GameState } from '../types';

/**
 * Type definition for a slice of the game store.
 * Uses Zustand's StateCreator with the persist middleware type.
 *
 * @template T - The type of the slice state/actions.
 */
export type GameStoreSlice<T> = StateCreator<GameState, [['zustand/persist', unknown]], [], T>;
