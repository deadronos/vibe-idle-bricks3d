import type { PersistOptions } from 'zustand/middleware';
import {
  DEFAULT_BALL_COUNT,
  DEFAULT_BALL_DAMAGE,
  DEFAULT_BALL_SPEED,
  DEFAULT_WAVE,
  STORAGE_KEY,
} from '../constants';
import { checkAndUnlockAchievements } from '../achievements';
import { createInitialBall, createInitialBricks } from '../createInitials';
import { createMetaStorage, handleRehydrate, hasExistingStorage } from '../persistence';
import type {
  GameActions,
  GameDataState,
  GameEntitiesState,
  GameSettings,
  GameState,
  UpgradeState,
} from '../types';
import { computeGraphicsSettings, type GraphicsQuality } from './ui';
import type { GameStoreSlice } from './types';

const defaultGraphicsQuality: GraphicsQuality = 'auto';

type PersistedState = Pick<
  GameState,
  | 'score'
  | 'bricksDestroyed'
  | 'wave'
  | 'maxWaveReached'
  | 'ballDamage'
  | 'ballSpeed'
  | 'ballCount'
  | 'unlockedAchievements'
  | 'settings'
  | 'vibeCrystals'
  | 'prestigeLevel'
  | 'prestigeMultiplier'
  | 'lastSaveTime'
>;

const detectCompactHud = () => {
  const isBrowser = typeof window !== 'undefined';
  if (!isBrowser) return false;
  return window.innerWidth <= 768;
};

export const buildInitialState = (): GameDataState & GameEntitiesState & UpgradeState => {
  const storageExists = hasExistingStorage();
  const defaultSettingsFlags = computeGraphicsSettings(defaultGraphicsQuality);

  const settings: GameSettings = {
    ...defaultSettingsFlags,
    enableSound: true,
    enableFullRigidPhysics: defaultSettingsFlags.enableFullRigidPhysics,
    graphicsQuality: defaultGraphicsQuality,
    compactHudEnabled: detectCompactHud(),
  };

  return {
    score: 0,
    bricksDestroyed: 0,
    wave: DEFAULT_WAVE,
    maxWaveReached: DEFAULT_WAVE,
    unlockedAchievements: [],
    settings,
    vibeCrystals: 0,
    prestigeLevel: 0,
    prestigeMultiplier: 1,
    comboCount: 0,
    comboMultiplier: 1,
    lastHitTime: 0,
    bricks: storageExists ? [] : createInitialBricks(DEFAULT_WAVE),
    balls: storageExists ? [] : [createInitialBall(DEFAULT_BALL_SPEED, DEFAULT_BALL_DAMAGE)],
    isPaused: false,
    ballDamage: DEFAULT_BALL_DAMAGE,
    ballSpeed: DEFAULT_BALL_SPEED,
    ballCount: DEFAULT_BALL_COUNT,
    ballSpawnQueue: 0,
    lastBallSpawnTime: 0,
    lastSaveTime: Date.now(),
    useRapierPhysics: true,
    rapierActive: false,
    rapierInitError: null,
    latestAnnouncement: null,
  };
};

export const createPersistenceSlice: GameStoreSlice<Pick<GameActions, 'resetGame'>> = (
  set,
  _get,
  store
) => ({
  resetGame: () => {
    store.persist?.clearStorage?.();
    set(buildInitialState());
  },
});

export const createPersistOptions = (
  getStore: () => { getState: () => GameState; setState: (next: Partial<GameState>) => void }
): PersistOptions<GameState, PersistedState> => ({
  name: STORAGE_KEY,
  version: 1,
  partialize: (state) => ({
    score: state.score,
    bricksDestroyed: state.bricksDestroyed,
    wave: state.wave,
    maxWaveReached: state.maxWaveReached,
    ballDamage: state.ballDamage,
    ballSpeed: state.ballSpeed,
    ballCount: state.ballCount,
    unlockedAchievements: state.unlockedAchievements,
    settings: state.settings,
    vibeCrystals: state.vibeCrystals,
    prestigeLevel: state.prestigeLevel,
    prestigeMultiplier: state.prestigeMultiplier,
    lastSaveTime: Date.now(),
  }),
  storage: createMetaStorage<PersistedState>(),
  onRehydrateStorage: () => {
    return (state) => {
      if (!state) return;

      const now = Date.now();
      const lastSave = state.lastSaveTime || now;
      const secondsOffline = (now - lastSave) / 1000;

      if (secondsOffline > 60) {
        const dps = state.ballCount * state.ballDamage * state.ballSpeed * 0.5;
        const offlineEarnings = Math.floor(dps * secondsOffline);

        if (offlineEarnings > 0) {
          state.score += offlineEarnings;
          console.log(
            `[Offline Progress] Earned ${offlineEarnings} score over ${secondsOffline.toFixed(0)}s`
          );
        }
      }

      state.lastSaveTime = now;

      const capturedState = state as unknown as GameState;
      setTimeout(() => {
        try {
          const store = getStore();
          handleRehydrate(capturedState, {
            checkAndUnlockAchievements,
            createInitialBall,
            createInitialBricks,
            useGameStore: store,
          });
        } catch (e) {
          console.error('[GameStore] handleRehydrate error:', e);
        }
      }, 0);
    };
  },
});
