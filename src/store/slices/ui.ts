import type { GameActions, GameDataState, GameEntitiesState, GameSettings } from '../types';
import type { GameStoreSlice } from './types';

export type GraphicsQuality = 'auto' | 'low' | 'medium' | 'high';

/** Keys of GameSettings that represent toggleable boolean settings */
type BooleanSettingKeys =
  | 'enableBloom'
  | 'enableShadows'
  | 'enableSound'
  | 'enableParticles'
  | 'enableFullRigidPhysics';

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

type UiState = Pick<
  GameEntitiesState,
  'isPaused' | 'useRapierPhysics' | 'rapierActive' | 'rapierInitError'
> &
  Pick<GameDataState, 'latestAnnouncement'>;

type DeviceProfile = {
  deviceMemory?: number;
  hardwareConcurrency?: number;
  prefersReducedMotion: boolean;
  smallScreen: boolean;
};

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
