import { createJSONStorage } from 'zustand/middleware';
import {
  DEFAULT_BALL_COUNT,
  DEFAULT_BALL_DAMAGE,
  DEFAULT_BALL_SPEED,
  DEFAULT_WAVE,
  STORAGE_KEY,
} from './constants';
import type { Ball, Brick, GameState } from './types';

const clampNumber = (value: unknown, fallback: number, min: number) =>
  typeof value === 'number' && Number.isFinite(value) && value >= min ? value : fallback;

const isDefaultPersisted = (s: Partial<GameState> | null | undefined) =>
  !s ||
  (s.score === 0 &&
    s.bricksDestroyed === 0 &&
    s.wave === DEFAULT_WAVE &&
    s.maxWaveReached === DEFAULT_WAVE &&
    s.ballDamage === DEFAULT_BALL_DAMAGE &&
    s.ballSpeed === DEFAULT_BALL_SPEED &&
    s.ballCount === DEFAULT_BALL_COUNT &&
    (!Array.isArray(s.unlockedAchievements) || s.unlockedAchievements.length === 0));

export const hasExistingStorage = (storage: Pick<Storage, 'getItem'> = localStorage): boolean => {
  try {
    const stored = storage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const parsed = JSON.parse(stored);
    const state = parsed?.state ?? parsed;
    return state && typeof state === 'object' && 'ballCount' in state;
  } catch {
    return false;
  }
};

export const createMetaStorage = () =>
  createJSONStorage(() => ({
    getItem: (name) => {
      const raw = localStorage.getItem(name);
      const meta = localStorage.getItem(name + ':meta');

      // If we have a meta snapshot (meaningful progress) and the primary
      // snapshot is missing or default (e.g. due to test reset), prefer meta.
      if (meta) {
        try {
          const parsedRaw = raw ? JSON.parse(raw) : null;
          const parsedMeta = JSON.parse(meta);

          const rawState = parsedRaw?.state ?? parsedRaw;
          const metaState = parsedMeta?.state ?? parsedMeta;

          if (isDefaultPersisted(rawState) && !isDefaultPersisted(metaState)) {
            return meta;
          }
        } catch {
          // Ignore parse errors
        }
      }
      return raw;
    },
    setItem: (name, value) => {
      localStorage.setItem(name, value);
      try {
        const parsed = JSON.parse(value);
        const state = parsed?.state ?? parsed;

        // If this snapshot represents meaningful progress, save it to a
        // companion meta key. This persists through "soft resets" (like
        // those in tests) where the main key might be overwritten with
        // default state.
        if (!isDefaultPersisted(state)) {
          localStorage.setItem(name + ':meta', value);
        }
      } catch {
        // Ignore errors
      }
    },
    removeItem: (name) => {
      localStorage.removeItem(name);
      localStorage.removeItem(name + ':meta');
    },
  }));

type RehydrateDeps = {
  useGameStore: {
    getState: () => GameState;
    setState: (nextState: Partial<GameState>) => void;
  };
  createInitialBall: (speed: number, damage: number) => Ball;
  createInitialBricks: (wave: number) => Brick[];
  checkAndUnlockAchievements: (
    state: GameState,
    overrides?: Partial<GameState>
  ) => GameState['unlockedAchievements'];
};

export const handleRehydrate = (state: GameState | undefined, deps: RehydrateDeps) => {
  if (!state) return;

  const { checkAndUnlockAchievements, createInitialBall, createInitialBricks, useGameStore } = deps;

  // Validate and clamp values after rehydration
  const wave = clampNumber(state.wave, DEFAULT_WAVE, DEFAULT_WAVE);
  const ballDamage = clampNumber(state.ballDamage, DEFAULT_BALL_DAMAGE, 1);
  const ballSpeed = clampNumber(state.ballSpeed, DEFAULT_BALL_SPEED, 0.02);
  const ballCount = clampNumber(state.ballCount, DEFAULT_BALL_COUNT, 1);
  const maxWaveReached = clampNumber(state.maxWaveReached, Math.max(DEFAULT_WAVE, wave), wave);
  const score = clampNumber(state.score, 0, 0);
  const bricksDestroyed = clampNumber(state.bricksDestroyed, 0, 0);
  const unlockedAchievements = Array.isArray(state.unlockedAchievements)
    ? state.unlockedAchievements.filter((id): id is string => typeof id === 'string')
    : [];
  const settings = state.settings && typeof state.settings === 'object' ? state.settings : {};

  // Log rehydrated values for debugging
  console.log('[GameStore] Rehydrated state:', {
    ballCount,
    ballDamage,
    ballSpeed,
    wave,
    score,
    bricksDestroyed,
    unlockedAchievements: unlockedAchievements.length,
  });

  // Defer store operations to next tick to ensure store is fully initialized
  // This avoids "Cannot access 'useGameStore' before initialization" error
  setTimeout(() => {
    try {
      console.log('[GameStore] Applying rehydration fix...');

      const achievementSafeState = {
        ...useGameStore.getState(),
        score,
        bricksDestroyed,
        wave,
        maxWaveReached,
        ballDamage,
        ballSpeed,
        ballCount,
        unlockedAchievements,
      };

      const nextAchievements = checkAndUnlockAchievements(achievementSafeState, {
        unlockedAchievements,
        score,
        bricksDestroyed,
        wave,
        maxWaveReached,
        ballDamage,
        ballSpeed,
        ballCount,
      });

      // Clear ALL existing balls and create fresh ones with correct stats
      // This fixes the issue where the initial default ball has wrong velocity
      const initialBall = createInitialBall(ballSpeed, ballDamage);
      const ballsToQueue = Math.max(0, ballCount - 1); // -1 because we have the initial ball

      console.log('[GameStore] Ball spawn plan:', {
        initialBalls: 1,
        queuedBalls: ballsToQueue,
        total: ballCount,
        ballSpeed,
        ballDamage,
      });

      useGameStore.setState({
        score,
        bricksDestroyed,
        wave,
        maxWaveReached,
        ballDamage,
        ballSpeed,
        ballCount,
        unlockedAchievements: nextAchievements,
        bricks: createInitialBricks(wave),
        // Replace entire balls array - don't keep any default balls
        balls: [initialBall],
        ballSpawnQueue: ballsToQueue,
        // Set to past time so queue processing can start immediately
        lastBallSpawnTime: 0,
        settings,
      });

      console.log('[GameStore] State after rehydration fix:', {
        balls: useGameStore.getState().balls.length,
        ballSpawnQueue: useGameStore.getState().ballSpawnQueue,
        ballCount: useGameStore.getState().ballCount,
        firstBallVelocity: useGameStore.getState().balls[0]?.velocity,
      });
    } catch (error) {
      console.error('[GameStore] Error in rehydration callback:', error);
    }
  }, 0);

  // Revalidate stats after a frame
  setTimeout(() => {
    const currentState = useGameStore.getState();
    console.log('[GameStore] Post-rehydration validation:', {
      ballCount: currentState.ballCount,
      actualBalls: currentState.balls.length,
      ballDamage: currentState.ballDamage,
      ballSpeed: currentState.ballSpeed,
      ballSpawnQueue: currentState.ballSpawnQueue,
    });

    // Verify ball stats match store config
    const ballStatMismatch = currentState.balls.some(
      (ball) =>
        ball.damage !== currentState.ballDamage ||
        Math.abs(
          Math.sqrt(
            ball.velocity[0] ** 2 + ball.velocity[1] ** 2 + ball.velocity[2] ** 2
          ) - currentState.ballSpeed
        ) > 0.01
    );

    if (ballStatMismatch) {
      console.warn(
        '[GameStore] Ball stats mismatch detected! Rebuilding balls with correct stats.'
      );
      const rebuiltBalls = currentState.balls.map((ball) => ({
        ...ball,
        damage: currentState.ballDamage,
        velocity: Array.from(
          { length: 3 },
          (_, i) => {
            const currentVelMagnitude = Math.sqrt(
              ball.velocity[0] ** 2 + ball.velocity[1] ** 2 + ball.velocity[2] ** 2
            );
            return currentVelMagnitude > 0
              ? (ball.velocity[i] / currentVelMagnitude) * currentState.ballSpeed
              : ball.velocity[i];
          }
        ) as Ball['velocity'],
      }));
      useGameStore.setState({ balls: rebuiltBalls });
    }
  }, 16); // One frame at 60fps
};
