import type { StateCreator } from 'zustand';
import type { GameState } from '../types';

export type GameStoreSlice<T> = StateCreator<GameState, [['zustand/persist', unknown]], [], T>;
