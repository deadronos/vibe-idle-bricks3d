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
import { checkAndUnlockAchievements, getBallSpeedLevel } from './achievements';
import { createInitialBall, createInitialBricks } from './createInitials';
import { createMetaStorage, handleRehydrate, hasExistingStorage } from './persistence';
import type { Ball, GameDataState, GameEntitiesState, GameState, UpgradeState } from './types';

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
  
  return {
    score: 0,
    bricksDestroyed: 0,
    wave: DEFAULT_WAVE,
    maxWaveReached: DEFAULT_WAVE,
    unlockedAchievements: [],
    settings: {},
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
            const score = state.score + amount;
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

            const newHealth = brick.health - damage;

            if (newHealth <= 0) {
              const score = state.score + brick.value;
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
      }),
      onRehydrateStorage: () => (state) =>
        handleRehydrate(state, {
          checkAndUnlockAchievements,
          createInitialBall,
          createInitialBricks,
          useGameStore,
        }),
      storage: createMetaStorage(),
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
