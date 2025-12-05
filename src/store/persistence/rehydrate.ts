import {
  DEFAULT_BALL_COUNT,
  DEFAULT_BALL_DAMAGE,
  DEFAULT_BALL_SPEED,
  DEFAULT_WAVE,
} from '../constants';
import type { Ball, Brick, GameState } from '../types';
import { clampNumber } from './validators';

/**
 * Dependencies required for rehydration logic.
 * Injected to make the function pure and testable.
 */
export type RehydrateDeps = {
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

/** State shape provided during rehydration (subset of GameState) */
export type RehydrateState = Pick<
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
>;

/**
 * Handles the logic for restoring game state from persisted storage.
 *
 * @param {RehydrateState | undefined} state - The persisted state object.
 * @param {RehydrateDeps} deps - The dependencies needed for rehydration.
 * @throws {Error} If rehydration fails or dependencies are missing.
 */
export const handleRehydrate = (state: RehydrateState | undefined, deps: RehydrateDeps) => {
  if (!state) {
    return;
  }

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
  const settings =
    state.settings && typeof state.settings === 'object'
      ? (state.settings as GameState['settings'])
      : { enableBloom: true, enableShadows: true, enableSound: true, enableParticles: true };

  // We'll attempt to apply rehydration synchronously when possible to avoid
  // extra frame delay. However, in some initialization orders the store
  // reference may not yet be available. In that case, defer to next tick
  // (setTimeout) as a safe fallback. Always surface errors instead of
  // silently swallowing them so issues are visible during dev/tests.

  const applyRehydrate = () => {
    if (
      typeof createInitialBall !== 'function' ||
      typeof createInitialBricks !== 'function' ||
      typeof checkAndUnlockAchievements !== 'function' ||
      !useGameStore ||
      typeof useGameStore.setState !== 'function'
    ) {
      throw new Error('Missing dependencies for rehydration');
    }

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
    const initialBall = createInitialBall(ballSpeed, ballDamage);
    const ballsToQueue = Math.max(0, ballCount - 1); // -1 because we have the initial ball

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
  };

  try {
    // Try sync first
    applyRehydrate();
  } catch (err) {
    // If sync fails due to init order, defer to next tick and don't swallow errors
    const errMsg =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message?: unknown }).message)
        : String(err);
    console.warn('[GameStore] Deferring rehydrate to next tick due to init order:', errMsg);
    setTimeout(() => {
      try {
        applyRehydrate();
      } catch (error) {
        console.error('[GameStore] Error in deferred rehydration:', error);
        // Re-throw to make failures visible in tests/environments that surface uncaught errors
        throw error;
      }
    }, 0);
  }

  // Safety net for runtime environments: if rehydration applied but no ball
  // entities exist after a short delay (e.g. render/frame not running yet),
  // force spawn all queued balls so the player doesn't lose purchased balls.
  // Skip this behavior in test environment to keep tests deterministic.
  try {
    const globalProc = globalThis as unknown as { process?: { env?: Record<string, string> } };
    const isTestEnv =
      typeof globalProc.process !== 'undefined' &&
      !!globalProc.process?.env &&
      globalProc.process?.env.NODE_ENV === 'test';
    const shouldForceSpawn = typeof window !== 'undefined' && !isTestEnv;
    if (shouldForceSpawn) {
      setTimeout(() => {
        try {
          const current = useGameStore.getState();
          if (
            current.ballCount > 0 &&
            (!Array.isArray(current.balls) || current.balls.length === 0)
          ) {
            console.warn(
              '[GameStore] No balls present after rehydrate — forcing spawn of all balls via setState.'
            );
            try {
              // Create all balls immediately to ensure runtime shows them.
              const allBalls = Array.from({ length: current.ballCount }, () =>
                createInitialBall(current.ballSpeed, current.ballDamage)
              );
              // Overwrite balls and clear queue so rendering shows entities immediately
              useGameStore.setState({
                balls: allBalls,
                ballSpawnQueue: 0,
                lastBallSpawnTime: Date.now(),
              });
            } catch (spawnErr) {
              console.error('[GameStore] Error forcing spawn via setState:', spawnErr);
            }
          }
        } catch (e) {
          console.error('[GameStore] Error in post-rehydrate safety net:', e);
        }
      }, 50);
    }
  } catch {
    // Non-fatal
  }

  // Revalidate stats after a frame
  setTimeout(() => {
    const currentState = useGameStore.getState();

    // Verify ball stats match store config
    const ballStatMismatch = currentState.balls.some(
      (ball) =>
        ball.damage !== currentState.ballDamage ||
        Math.abs(
          Math.sqrt(ball.velocity[0] ** 2 + ball.velocity[1] ** 2 + ball.velocity[2] ** 2) -
            currentState.ballSpeed
        ) > 0.01
    );

    if (ballStatMismatch) {
      console.warn(
        '[GameStore] Ball stats mismatch detected! Rebuilding balls with correct stats.'
      );
      const rebuiltBalls = currentState.balls.map((ball) => ({
        ...ball,
        damage: currentState.ballDamage,
        velocity: Array.from({ length: 3 }, (_, i) => {
          const currentVelMagnitude = Math.sqrt(
            ball.velocity[0] ** 2 + ball.velocity[1] ** 2 + ball.velocity[2] ** 2
          );
          return currentVelMagnitude > 0
            ? (ball.velocity[i] / currentVelMagnitude) * currentState.ballSpeed
            : ball.velocity[i];
        }) as Ball['velocity'],
      }));
      useGameStore.setState({ balls: rebuiltBalls });
    }
  }, 16); // One frame at 60fps
};
