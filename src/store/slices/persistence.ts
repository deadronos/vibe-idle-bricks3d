import type { StoreApi, UseBoundStore } from 'zustand';
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

/**
 * State properties that are persisted to local storage.
 */
type PersistedState = Pick<
  GameState,
  | 'score'
  | 'bricksDestroyed'
  | 'wave'
  | 'maxWaveReached'
  | 'ballDamage'
  | 'ballSpeed'
  | 'ballCount'
  | 'critChance'
  | 'unlockedAchievements'
  | 'settings'
  | 'vibeCrystals'
  | 'prestigeLevel'
  | 'prestigeMultiplier'
  | 'lastSaveTime'
>;

/**
 * Detects if the device screen is small (compact HUD).
 */
const detectCompactHud = () => {
  const isBrowser = typeof window !== 'undefined';
  if (!isBrowser) return false;
  return window.innerWidth <= 768;
};

/**
 * Builds the initial game state with default values.
 */
export const buildInitialState = (): GameDataState & GameEntitiesState & UpgradeState => {
  const storageExists = hasExistingStorage();
  const defaultSettingsFlags = computeGraphicsSettings(defaultGraphicsQuality);

  const settings: GameSettings = {
    ...defaultSettingsFlags,
    enableSound: true,
    enableFullRigidPhysics: defaultSettingsFlags.enableFullRigidPhysics,
    graphicsQuality: defaultGraphicsQuality,
    compactHudEnabled: detectCompactHud(),
    enableSABPhysics: false,
    debugMode: false,
  };

  return {
    score: 0,
    bricksDestroyed: 0,
    wave: DEFAULT_WAVE,
    maxWaveReached: DEFAULT_WAVE,
    unlockedAchievements: [],
    settings,
    vibeCrystals: 0,
    isRehydrated: false,
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
    critChance: 0,
    ballSpawnQueue: 0,
    lastBallSpawnTime: 0,
    lastSaveTime: Date.now(),
    buyMultiplier: 1,
    useRapierPhysics: true,
    rapierActive: false,
    rapierInitError: null,
    latestAnnouncement: null,
  };
};

/**
 * Creates the persistence slice of the game store.
 */
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

/**
 * Configures the persistence middleware options.
 */
export const createPersistOptions = (
  getStore: () => UseBoundStore<StoreApi<GameState>>
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
    critChance: state.critChance,
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
      // Cap offline progress to 24 hours to prevent extreme runaway
      const secondsOffline = Math.min((now - lastSave) / 1000, 86400);

      if (secondsOffline > 60) {
        // Enhanced Offline Progress Calculation
        // base dps = balls * damage * speed
        // factor in crit: average damage multiplier = 1 + (critChance * 2) [assuming 3x damage on crit for simplicity]
        const critMult = 1 + (state.critChance || 0) * 2;
        const dps = state.ballCount * state.ballDamage * state.ballSpeed * critMult * 0.4; // 0.4 efficiency factor

        // factor in prestige
        const offlineEarnings = Math.floor(dps * secondsOffline * state.prestigeMultiplier);

        if (offlineEarnings > 0) {
          state.score += offlineEarnings;

          // Show announcement if possible (using setTimeout to wait for store ready)
          setTimeout(() => {
            const store = getStore().getState();
            if (store.announce) {
              store.announce(`Welcome back! You earned ${offlineEarnings.toLocaleString()} points while away.`);
            }
          }, 1000);

          if (state.settings.debugMode) {
            console.log(
              `[Offline Progress] Earned ${offlineEarnings} score over ${secondsOffline.toFixed(0)}s`
            );
          }
        }
      }

      state.lastSaveTime = now;

      setTimeout(() => {
        try {
          const store = getStore();
          handleRehydrate(state, {
            checkAndUnlockAchievements,
            createInitialBall,
            createInitialBricks,
            useGameStore: store,
          });
        } catch (e) {
          console.error("[GameStore] handleRehydrate error:", e);
        }
      }, 0);
    };
  },
});
