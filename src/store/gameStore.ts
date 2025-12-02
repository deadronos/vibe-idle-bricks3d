import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Vector3Tuple } from 'three';
import {
  ACHIEVEMENTS,
  ARENA_SIZE,
  DEFAULT_BALL_COUNT,
  DEFAULT_BALL_DAMAGE,
  DEFAULT_BALL_SPEED,
  DEFAULT_WAVE,
  MAX_BALL_COUNT,
  STORAGE_KEY,
} from './constants';
import { effectBus } from '../systems/EffectEventBus';
import { checkAndUnlockAchievements, getBallSpeedLevel } from './achievements';
import { createInitialBall, createInitialBricks } from './createInitials';
import { createMetaStorage, handleRehydrate, hasExistingStorage } from './persistence';
import type { Ball, GameDataState, GameEntitiesState, GameSettings, GameState, UpgradeState } from './types';

const rescaleVelocity = (velocity: Vector3Tuple, targetSpeed: number): Vector3Tuple => {
  const currentSpeed = Math.sqrt(
    velocity[0] ** 2 + velocity[1] ** 2 + velocity[2] ** 2
  );
  const scale = currentSpeed > 0 ? targetSpeed / currentSpeed : 1;
  return [velocity[0] * scale, velocity[1] * scale, velocity[2] * scale];
};

const updateBallDamages = (balls: Ball[], ballDamage: number): Ball[] =>
  balls.map((ball) => ({
    ...ball,
    damage: ballDamage,
  }));

const updateBallSpeeds = (balls: Ball[], ballSpeed: number): Ball[] =>
  balls.map((ball) => ({
    ...ball,
    velocity: rescaleVelocity(ball.velocity, ballSpeed),
  }));

/**
 * Check if we have existing game data in storage.
 * If so, we should NOT create default balls - rehydration will handle it.
 */
/**
 * Build initial state for the game.
 * If storage exists, start with empty entities - rehydration will rebuild them.
 * If no storage (new game), create default ball and bricks.
 */
const buildInitialState = (): GameDataState & GameEntitiesState & UpgradeState => {
  const storageExists = hasExistingStorage();
  // Device heuristics - only when in browser context
  const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined';
  const nav = isBrowser ? (navigator as Navigator & { deviceMemory?: number }) : undefined;
  const deviceMemory = isBrowser ? nav?.deviceMemory ?? undefined : undefined;
  const hardwareConcurrency = isBrowser ? navigator.hardwareConcurrency ?? undefined : undefined;
  const prefersReducedMotion = isBrowser ? !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) : false;
  const smallScreen = isBrowser ? window.innerWidth <= 768 : false;
  const lowPowerDevice = Boolean((deviceMemory && deviceMemory <= 2) || (hardwareConcurrency && hardwareConcurrency <= 2) || prefersReducedMotion || smallScreen);

  type GraphicsQuality = 'auto' | 'low' | 'medium' | 'high';
  const defaultGraphicsQuality: GraphicsQuality = 'auto';
  const computeDefaults = (quality: GraphicsQuality) => {
    if (quality === 'low') return { enableBloom: false, enableShadows: false, enableParticles: false, enableFullRigidPhysics: false } as GameSettings;
    if (quality === 'medium') return { enableBloom: true, enableShadows: true, enableParticles: false, enableFullRigidPhysics: true } as GameSettings;
    if (quality === 'high') return { enableBloom: true, enableShadows: true, enableParticles: true, enableFullRigidPhysics: true } as GameSettings;
    // 'auto'
    return lowPowerDevice
      ? { enableBloom: false, enableShadows: false, enableParticles: false, enableFullRigidPhysics: false } as GameSettings
      : { enableBloom: true, enableShadows: true, enableParticles: true, enableFullRigidPhysics: true } as GameSettings;
  };

  const defaultSettings = computeDefaults(defaultGraphicsQuality);

  return {
    score: 0,
    bricksDestroyed: 0,
    wave: DEFAULT_WAVE,
    maxWaveReached: DEFAULT_WAVE,
    unlockedAchievements: [],
    settings: {
      ...defaultSettings,
      enableSound: true,
      // Enable full rigid-body physics (Rapier) by default (mirrors enableFullRigidPhysics value).
      enableFullRigidPhysics: defaultSettings.enableFullRigidPhysics,
      graphicsQuality: defaultGraphicsQuality,
      compactHudEnabled: smallScreen,
    },
    // Prestige system
    vibeCrystals: 0,
    prestigeLevel: 0,
    prestigeMultiplier: 1,
    // Combo system
    comboCount: 0,
    comboMultiplier: 1,
    lastHitTime: 0,
    // If storage exists, start empty - rehydration will create correct balls/bricks
    // If no storage (new game), create defaults
    bricks: storageExists ? [] : createInitialBricks(DEFAULT_WAVE),
    balls: storageExists ? [] : [createInitialBall(DEFAULT_BALL_SPEED, DEFAULT_BALL_DAMAGE)],
    isPaused: false,
    ballDamage: DEFAULT_BALL_DAMAGE,
    ballSpeed: DEFAULT_BALL_SPEED,
    ballCount: DEFAULT_BALL_COUNT,
    ballSpawnQueue: 0,
    lastBallSpawnTime: 0,
    lastSaveTime: Date.now(),
    // Rapier integration runtime flags
    useRapierPhysics: true,
    rapierActive: false,
    rapierInitError: null as string | null,
    latestAnnouncement: null,
  };
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => {
      const initialState = buildInitialState();

      return {
        ...initialState,

        addScore: (amount) =>
          set((state) => {
            // Apply prestige multiplier to score gains
            const multipliedAmount = Math.floor(amount * state.prestigeMultiplier);
            const score = state.score + multipliedAmount;
            const unlockedAchievements = checkAndUnlockAchievements(state, { score });
            return {
              score,
              unlockedAchievements,
            };
          }),

        spawnBall: () =>
          set((state) => {
            const newBall = createInitialBall(state.ballSpeed, state.ballDamage);
            return {
              balls: [...state.balls, newBall],
              lastBallSpawnTime: Date.now(),
            };
          }),
        removeBall: (id) =>
          set((state) => ({
            balls: state.balls.filter((ball) => ball.id !== id),
          })),

        updateBallPosition: (id, position) =>
          set((state) => ({
            balls: state.balls.map((ball) => (ball.id === id ? { ...ball, position } : ball)),
          })),

        updateBallVelocity: (id, velocity) =>
          set((state) => ({
            balls: state.balls.map((ball) => (ball.id === id ? { ...ball, velocity } : ball)),
          })),

        damageBrick: (id, damage) =>
          set((state) => {
            const brick = state.bricks.find((b) => b.id === id);
            if (!brick) return state;

            // Apply combo multiplier to damage
            let actualDamage = damage * state.comboMultiplier;

            // Apply armor reduction if brick has armor
            if (brick.armorMultiplier) {
              actualDamage = actualDamage * (1 - brick.armorMultiplier);
            }

            const newHealth = brick.health - actualDamage;

            // Emit hit effect
            effectBus.emit({
              type: 'brick_hit',
              position: brick.position,
              color: brick.color,
              amount: actualDamage
            });

            if (newHealth <= 0) {
              // Emit destroy effect
              effectBus.emit({
                type: 'brick_destroy',
                position: brick.position,
                color: brick.color
              });

              // Apply prestige multiplier to brick value
              const scoreGain = Math.floor(brick.value * state.prestigeMultiplier);
              const score = state.score + scoreGain;
              const bricksDestroyed = state.bricksDestroyed + 1;
              const unlockedAchievements = checkAndUnlockAchievements(state, { score, bricksDestroyed });
              return {
                bricks: state.bricks.filter((b) => b.id !== id),
                score,
                bricksDestroyed,
                unlockedAchievements,
              };
            }

            return {
              bricks: state.bricks.map((b) => (b.id === id ? { ...b, health: newHealth } : b)),
            };
          }),

        removeBrick: (id) =>
          set((state) => ({
            bricks: state.bricks.filter((brick) => brick.id !== id),
          })),

        regenerateBricks: () =>
          set((state) => {
            const nextWave = state.wave + 1;
            const maxWaveReached = Math.max(state.maxWaveReached, nextWave);
            const waveBonus = Math.floor(20 * nextWave);
            const score = state.score + waveBonus;
            const unlockedAchievements = checkAndUnlockAchievements(state, {
              score,
              wave: nextWave,
              maxWaveReached,
            });

            return {
              bricks: createInitialBricks(nextWave),
              wave: nextWave,
              maxWaveReached,
              score,
              unlockedAchievements,
            };
          }),

        togglePause: () =>
          set((state) => ({
            isPaused: !state.isPaused,
          })),

        getBallDamageCost: () => {
          const { ballDamage } = get();
          return Math.floor(50 * Math.pow(1.5, ballDamage - 1));
        },

        getBallSpeedCost: () => {
          const { ballSpeed } = get();
          const level = getBallSpeedLevel(ballSpeed) - 1;
          return Math.floor(30 * Math.pow(1.3, level));
        },

        getBallCountCost: () => {
          const { ballCount } = get();
          return Math.floor(100 * Math.pow(2, ballCount - 1));
        },

        upgradeBallDamage: () =>
          set((state) => {
            const cost = get().getBallDamageCost();
            if (state.score >= cost) {
              const ballDamage = state.ballDamage + 1;
              const score = state.score - cost;
              const unlockedAchievements = checkAndUnlockAchievements(state, { score, ballDamage });
              return {
                score,
                ballDamage,
                balls: updateBallDamages(state.balls, ballDamage),
                unlockedAchievements,
              };
            }
            return state;
          }),

        upgradeBallSpeed: () =>
          set((state) => {
            const cost = get().getBallSpeedCost();
            if (state.score >= cost) {
              const ballSpeed = state.ballSpeed + 0.02;
              const score = state.score - cost;
              const unlockedAchievements = checkAndUnlockAchievements(state, { score, ballSpeed });
              return {
                score,
                ballSpeed,
                balls: updateBallSpeeds(state.balls, ballSpeed),
                unlockedAchievements,
              };
            }
            return state;
          }),

        upgradeBallCount: () =>
          set((state) => {
            const cost = get().getBallCountCost();
            if (state.score >= cost && state.ballCount < MAX_BALL_COUNT) {
              const ballCount = state.ballCount + 1;
              const score = state.score - cost;
              const unlockedAchievements = checkAndUnlockAchievements(state, { score, ballCount });
              const newBall = createInitialBall(state.ballSpeed, state.ballDamage);
              return {
                score,
                ballCount,
                balls: [...state.balls, newBall],
                unlockedAchievements,
              };
            }
            return state;
          }),

        resetGame: () => {
          useGameStore.persist.clearStorage();
          set(buildInitialState());
        },

        queueBallSpawns: (count) =>
          set((state) => ({
            ballSpawnQueue: state.ballSpawnQueue + count,
          })),

        tryProcessBallSpawnQueue: () =>
          set((state) => {
            if (state.ballSpawnQueue <= 0) return state;

            const now = Date.now();
            const timeSinceLastSpawn = now - state.lastBallSpawnTime;
            // Spawn a ball every 0.5 seconds (500ms)
            const SPAWN_INTERVAL_MS = 500;

            if (timeSinceLastSpawn >= SPAWN_INTERVAL_MS) {
              const newBall = createInitialBall(state.ballSpeed, state.ballDamage);
              return {
                balls: [...state.balls, newBall],
                ballSpawnQueue: state.ballSpawnQueue - 1,
                lastBallSpawnTime: now,
              };
            }

            return state;
          }),

        forceProcessAllQueuedBalls: () =>
          set((state) => {
            if (state.ballSpawnQueue <= 0) return state;

            const ballsToSpawn = Array.from({ length: state.ballSpawnQueue }, () =>
              createInitialBall(state.ballSpeed, state.ballDamage)
            );

            return {
              balls: [...state.balls, ...ballsToSpawn],
              ballSpawnQueue: 0,
              lastBallSpawnTime: Date.now(),
            };
          }),

        toggleSetting: (key: keyof GameSettings) =>
          set((state) => {
            const current = state.settings[key as keyof GameSettings] as unknown as boolean;
            const nextSettings = {
              ...state.settings,
              [key]: !current,
            } as GameSettings;

            // If the user toggles the full rigid physics setting, mirror it to the runtime flag
            // that controls whether Rapier-based rigid bodies should be used.
            if (key === 'enableFullRigidPhysics') {
              return {
                settings: nextSettings,
                useRapierPhysics: !!nextSettings.enableFullRigidPhysics,
              };
            }

            return {
              settings: nextSettings,
            };
          }),

        setGraphicsQuality: (value: 'auto' | 'low' | 'medium' | 'high') =>
          set((state) => {
            // compute flags for quality
            const compute = (quality: 'auto' | 'low' | 'medium' | 'high') => {
              if (quality === 'low') return { enableBloom: false, enableShadows: false, enableParticles: false, enableFullRigidPhysics: false } as GameSettings;
              if (quality === 'medium') return { enableBloom: true, enableShadows: true, enableParticles: false, enableFullRigidPhysics: true } as GameSettings;
              if (quality === 'high') return { enableBloom: true, enableShadows: true, enableParticles: true, enableFullRigidPhysics: true } as GameSettings;
              // auto: keep existing heuristics - use small screen and device heuristics to fallback
              const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined';
              const nav = isBrowser ? (navigator as Navigator & { deviceMemory?: number }) : undefined;
              const deviceMemory = isBrowser ? nav?.deviceMemory ?? undefined : undefined;
              const hardwareConcurrency = isBrowser ? navigator.hardwareConcurrency ?? undefined : undefined;
              const prefersReducedMotion = isBrowser ? !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) : false;
              const smallScreen = isBrowser ? window.innerWidth <= 768 : false;
              const lowPower = Boolean((deviceMemory && deviceMemory <= 2) || (hardwareConcurrency && hardwareConcurrency <= 2) || prefersReducedMotion || smallScreen);
              return lowPower
                ? { enableBloom: false, enableShadows: false, enableParticles: false, enableFullRigidPhysics: false } as GameSettings
                : { enableBloom: true, enableShadows: true, enableParticles: true, enableFullRigidPhysics: true } as GameSettings;
            };

            const nextSettingsPartial = compute(value);
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
            // Set ephemeral announcement and clear after 4s
            const next = { latestAnnouncement: msg } as Partial<GameDataState>;
            setTimeout(() => {
              try {
                set(() => ({ latestAnnouncement: null } as Partial<GameDataState>));
              } catch {
                // ignore
              }
            }, 4000);
            return next as GameDataState;
          }),

        // Prestige system
        getPrestigeReward: () => {
          const { maxWaveReached } = get();
          // Formula: sqrt(maxWave - 1), minimum 0
          return Math.max(0, Math.floor(Math.sqrt(maxWaveReached - 1)));
        },

        performPrestige: () =>
          set((state) => {
            const reward = get().getPrestigeReward();
            if (reward <= 0) return state; // Don't prestige if no reward

            const vibeCrystals = state.vibeCrystals + reward;
            const prestigeLevel = state.prestigeLevel + 1;
            // Each crystal gives +10% multiplier
            const prestigeMultiplier = 1 + vibeCrystals * 0.1;

            // Reset game but preserve prestige stats
            // IMPORTANT: Create fresh ball and bricks explicitly since buildInitialState
            // returns empty arrays when storage exists
            return {
              ...buildInitialState(),
              vibeCrystals,
              prestigeLevel,
              prestigeMultiplier,
              // Explicitly create fresh ball and bricks for active prestige
              balls: [createInitialBall(DEFAULT_BALL_SPEED, DEFAULT_BALL_DAMAGE)],
              bricks: createInitialBricks(DEFAULT_WAVE),
              latestAnnouncement: `Prestiged: +${reward} Vibe Crystal${reward !== 1 ? 's' : ''} (+${Math.round((prestigeMultiplier - 1) * 100)}% score)`,
            };
          }),

        // Combo system
        resetCombo: () =>
          set(() => ({
            comboCount: 0,
            comboMultiplier: 1,
            lastHitTime: 0,
          })),

        // Rapier control APIs
        setUseRapierPhysics: (enabled: boolean) =>
          set(() => ({ useRapierPhysics: enabled })),

        setRapierActive: (active: boolean) =>
          set(() => ({ rapierActive: active, rapierInitError: active ? null : undefined })),

        setRapierInitError: (msg: string | null) =>
          set(() => ({ rapierInitError: msg })),

        // Apply compact rapier hit events (e.g. {brickId, damage}) and update combo state
        applyHits: (hits: Array<{ brickId: string; damage: number }>) => {
          if (!hits || hits.length === 0) return;
          // Apply damage to all hit bricks
          for (const hit of hits) {
            const fn = get().damageBrick;
            if (fn) fn(hit.brickId, hit.damage);
          }

          if (hits.length >= 2) {
            const state = get();
            const newComboCount = state.comboCount + 1;
            const newComboMultiplier = Math.min(1 + newComboCount * 0.05, 3);
            set({ comboCount: newComboCount, comboMultiplier: newComboMultiplier, lastHitTime: Date.now() });
          }
        },
      };
    },
    {
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
      storage: createMetaStorage(),
      onRehydrateStorage: () => {
        return (state) => {
          if (!state) return;

          // Offline Progress
          const now = Date.now();
          const lastSave = state.lastSaveTime || now;
          const secondsOffline = (now - lastSave) / 1000;

          if (secondsOffline > 60) {
            // Estimate DPS: balls * damage * speed * 0.5 (heuristic hit rate)
            const dps = state.ballCount * state.ballDamage * state.ballSpeed * 0.5;
            const offlineEarnings = Math.floor(dps * secondsOffline);

            if (offlineEarnings > 0) {
              state.score += offlineEarnings;
              console.log(`[Offline Progress] Earned ${offlineEarnings} score over ${secondsOffline.toFixed(0)}s`);
            }
          }

          state.lastSaveTime = now;

          // CRITICAL: Defer rehydration to next tick to ensure useGameStore is initialized.
          const capturedState = state;
          setTimeout(() => {
            try {
              handleRehydrate(capturedState, {
                checkAndUnlockAchievements,
                createInitialBall,
                createInitialBricks,
                useGameStore,
              });
            } catch (e) {
              console.error('[GameStore] handleRehydrate error:', e);
            }
          }, 0);
        };
      },
    }
  )
);

// Export for testing and UI
export {
  ARENA_SIZE,
  ACHIEVEMENTS,
  DEFAULT_BALL_SPEED,
  DEFAULT_BALL_DAMAGE,
  DEFAULT_BALL_COUNT,
  createInitialBricks,
  createInitialBall,
  buildInitialState,
  getBallSpeedLevel,
};
export type {
  AchievementDefinition,
  AchievementType,
  Ball,
  Brick,
  GameActions,
  GameDataState,
  GameEntitiesState,
  GameSettings,
  GameState,
  Upgrade,
  UpgradeState,
} from './types';
