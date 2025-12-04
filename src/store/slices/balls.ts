import type { Vector3Tuple } from 'three';
import { createInitialBall } from '../createInitials';
import type { Ball, GameActions, GameEntitiesState, UpgradeState } from '../types';
import type { GameStoreSlice } from './types';

type BallActions = Pick<
  GameActions,
  | 'spawnBall'
  | 'removeBall'
  | 'updateBallPosition'
  | 'updateBallVelocity'
  | 'queueBallSpawns'
  | 'tryProcessBallSpawnQueue'
  | 'forceProcessAllQueuedBalls'
>;

export type BallsSlice = BallActions &
  Pick<GameEntitiesState, 'balls' | 'ballSpawnQueue' | 'lastBallSpawnTime'> &
  Pick<UpgradeState, 'ballDamage' | 'ballSpeed' | 'ballCount'>;

const rescaleVelocity = (velocity: Vector3Tuple, targetSpeed: number): Vector3Tuple => {
  const currentSpeed = Math.sqrt(velocity[0] ** 2 + velocity[1] ** 2 + velocity[2] ** 2);
  const scale = currentSpeed > 0 ? targetSpeed / currentSpeed : 1;
  return [velocity[0] * scale, velocity[1] * scale, velocity[2] * scale];
};

export const updateBallDamages = (balls: Ball[], ballDamage: number): Ball[] =>
  balls.map((ball) => ({
    ...ball,
    damage: ballDamage,
  }));

export const updateBallSpeeds = (balls: Ball[], ballSpeed: number): Ball[] =>
  balls.map((ball) => ({
    ...ball,
    velocity: rescaleVelocity(ball.velocity, ballSpeed),
  }));

export const createBallsSlice: GameStoreSlice<BallActions> = (set) => ({
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
  queueBallSpawns: (count) =>
    set((state) => ({
      ballSpawnQueue: state.ballSpawnQueue + count,
    })),
  tryProcessBallSpawnQueue: () =>
    set((state) => {
      if (state.ballSpawnQueue <= 0) return state;

      const now = Date.now();
      const timeSinceLastSpawn = now - state.lastBallSpawnTime;
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
});
