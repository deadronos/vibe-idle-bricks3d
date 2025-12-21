import type { GameActions, GameDataState, GameEntitiesState, GameSettings } from '../types';
import type { GameStoreSlice } from './types';

/**
 * Graphics quality presets.
 * 'auto' detects device capabilities.
 */
export type GraphicsQuality = 'auto' | 'low' | 'medium' | 'high';

/** Keys of GameSettings that represent toggleable boolean settings */
type BooleanSettingKeys =
  | 'enableBloom'
  | 'enableShadows'
  | 'enableSound'
  | 'enableParticles'
  | 'enableFullRigidPhysics'
  | 'enableSABPhysics';

/**
 * Set of keys for runtime validation of toggleable settings.
 */
const BOOLEAN_SETTING_KEYS: Set<string> = new Set([
  'enableBloom',
  'enableShadows',
  'enableSound',
  'enableParticles',
  'enableFullRigidPhysics',
  'enableSABPhysics',
]);

/**
 * UI-related actions for the game store.
 */
type UiActions = Pick<
  GameActions,
  | 'togglePause'
  | 'toggleSetting'
  | 'setGraphicsQuality'
  | 'announce'
  | 'setUseRapierPhysics'
  | 'setRapierActive'
  | 'setRapierInitError'
>;

/**
 * UI-related state for the game store.
 */
type UiState = Pick<
  GameEntitiesState,
  'isPaused' | 'useRapierPhysics' | 'rapierActive' | 'rapierInitError'
> &
  Pick<GameDataState, 'latestAnnouncement'>;

/**
 * Represents the capabilities and characteristics of the user's device.
 */
type DeviceProfile = {
  /** Approximate amount of device memory in gigabytes. */
  deviceMemory?: number;
  /** Number of logical processors available to run threads on the user's computer. */
  hardwareConcurrency?: number;
  /** Whether the user has requested the system to minimize the amount of non-essential motion. */
  prefersReducedMotion: boolean;
  /** Whether the screen width is considered small (<= 768px). */
  smallScreen: boolean;
};

/**
 * Detects the device's capabilities to determine appropriate graphics settings.
 *
 * @returns {DeviceProfile} An object containing device capabilities.
 */
const detectDeviceProfile = (): DeviceProfile => {
  const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined';
  const nav = isBrowser ? (navigator as Navigator & { deviceMemory?: number }) : undefined;
  const deviceMemory = isBrowser ? nav?.deviceMemory : undefined;
  const hardwareConcurrency = isBrowser ? navigator.hardwareConcurrency : undefined;
  const prefersReducedMotion = isBrowser
    ? !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    : false;
  const smallScreen = isBrowser ? window.innerWidth <= 768 : false;

  return {
    deviceMemory,
    hardwareConcurrency,
    prefersReducedMotion,
    smallScreen,
  };
};

/**
 * Computes the graphics settings based on the selected quality level and device profile.
 *
 * @param {GraphicsQuality} quality - The desired graphics quality level.
 * @param {DeviceProfile} [profile] - The device profile to use for 'auto' detection. Defaults to current device detection.
 * @returns {Pick<GameSettings, 'enableBloom' | 'enableShadows' | 'enableParticles' | 'enableFullRigidPhysics'>} Partial settings object with computed values.
 */
export const computeGraphicsSettings = (
  quality: GraphicsQuality,
  profile: DeviceProfile = detectDeviceProfile()
): Pick<GameSettings, 'enableBloom' | 'enableShadows' | 'enableParticles' | 'enableFullRigidPhysics'> => {
  if (quality === 'low') {
    return {
      enableBloom: false,
      enableShadows: false,
      enableParticles: false,
      enableFullRigidPhysics: false,
    };
  }

  if (quality === 'medium') {
    return {
      enableBloom: true,
      enableShadows: true,
      enableParticles: false,
      enableFullRigidPhysics: true,
    };
  }

  if (quality === 'high') {
    return {
      enableBloom: true,
      enableShadows: true,
      enableParticles: true,
      enableFullRigidPhysics: true,
    };
  }

  const lowPowerDevice = Boolean(
    (profile.deviceMemory && profile.deviceMemory <= 2) ||
      (profile.hardwareConcurrency && profile.hardwareConcurrency <= 2) ||
      profile.prefersReducedMotion ||
      profile.smallScreen
  );

  return lowPowerDevice
    ? {
        enableBloom: false,
        enableShadows: false,
        enableParticles: false,
        enableFullRigidPhysics: false,
      }
    : {
        enableBloom: true,
        enableShadows: true,
        enableParticles: true,
        enableFullRigidPhysics: true,
      };
};

/**
 * Creates the UI slice of the game store.
 * Manages pause state, settings, announcements, and physics engine state.
 *
 * @param {Function} set - The Zustand set function.
 * @returns {UiActions & UiState} The UI slice state and actions.
 */
export const createUiSlice: GameStoreSlice<UiActions & UiState> = (set) => ({
  isPaused: false,
  useRapierPhysics: true,
  rapierActive: false,
  rapierInitError: null,
  latestAnnouncement: null,

  togglePause: () =>
    set((state) => ({
      isPaused: !state.isPaused,
    })),

  toggleSetting: (key) =>
    set((state) => {
      // Runtime guard: only toggle boolean settings
      if (!BOOLEAN_SETTING_KEYS.has(key)) {
        console.warn(`toggleSetting: "${key}" is not a toggleable boolean setting`);
        return {};
      }

      const settingKey = key as BooleanSettingKeys;
      const current = state.settings[settingKey] ?? false;
      const nextSettings: GameSettings = {
        ...state.settings,
        [settingKey]: !current,
      };

      if (settingKey === 'enableFullRigidPhysics') {
        return {
          settings: nextSettings,
          useRapierPhysics: !!nextSettings.enableFullRigidPhysics,
        };
      }

      return {
        settings: nextSettings,
      };
    }),

  setGraphicsQuality: (value) =>
    set((state) => {
      const profile = detectDeviceProfile();
      const nextSettingsPartial = computeGraphicsSettings(value, profile);
      const nextSettings: GameSettings = {
        ...state.settings,
        ...nextSettingsPartial,
        graphicsQuality: value,
      };

      return {
        settings: nextSettings,
        useRapierPhysics: !!nextSettings.enableFullRigidPhysics,
      };
    }),

  announce: (msg: string) =>
    set(() => {
      const next = { latestAnnouncement: msg };
      setTimeout(() => {
        try {
          set(() => ({ latestAnnouncement: null }));
        } catch {
          // ignore
        }
      }, 4000);
      return next;
    }),

  setUseRapierPhysics: (enabled) => set(() => ({ useRapierPhysics: enabled })),
  setRapierActive: (active) =>
    set(() => ({ rapierActive: active, rapierInitError: active ? null : undefined })),
  setRapierInitError: (msg) => set(() => ({ rapierInitError: msg })),
});
