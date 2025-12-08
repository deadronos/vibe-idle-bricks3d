import type { Vector3Tuple } from 'three';
import type { Ball, Brick } from '../store/types';
import { BRICK_SIZE } from './collision/constants';
import {
  clampDelta as clampDeltaImpl,
  reflectIfOutOfBounds as reflectIfOutOfBoundsImpl,
  resolveBrickCollision as resolveBrickCollisionImpl,
} from './collision/math';

/**
 * Dimensions of the game arena.
 */
export interface ArenaSize {
  width: number;
  height: number;
  depth: number;
}

// BRICK_SIZE is defined in ./collision/constants and re-exported below.

/**
 * Result of a single simulation frame for a ball.
 */
export interface BallFrameResult {
  /** The new position of the ball. */
  nextPosition: Vector3Tuple;
  /** The new velocity of the ball. */
  nextVelocity: Vector3Tuple;
  /** The ID of the brick hit, if any. */
  hitBrickId?: string;
}

/**
 * Clamps the time delta.
 */
export const clampDelta = clampDeltaImpl;

const reflectIfOutOfBounds = reflectIfOutOfBoundsImpl;

const resolveBrickCollision = resolveBrickCollisionImpl;

/**
 * Simulates a single frame of movement for a ball, handling collisions with walls and bricks.
 * This is the "legacy" collision system, likely replaced by Rapier.
 *
 * @param {Ball} ball - The ball to simulate.
 * @param {number} delta - The time delta in seconds.
 * @param {ArenaSize} arena - The dimensions of the arena.
 * @param {Brick[]} bricks - The list of active bricks.
 * @returns {BallFrameResult} The result of the simulation frame.
 */
export const stepBallFrame = (
  ball: Ball,
  delta: number,
  arena: ArenaSize,
  bricks: Brick[]
): BallFrameResult => {
  const frameScale = clampDelta(delta) * 60;
  const velocity: Vector3Tuple = [ball.velocity[0], ball.velocity[1], ball.velocity[2]];

  let nextX = ball.position[0] + velocity[0] * frameScale;
  let nextY = ball.position[1] + velocity[1] * frameScale;
  let nextZ = ball.position[2] + velocity[2] * frameScale;

  const bounds = {
    x: arena.width / 2 - ball.radius,
    y: arena.height / 2 - ball.radius,
    z: arena.depth / 2 - ball.radius,
  };

  const xWall = reflectIfOutOfBounds(nextX, bounds.x);
  if (xWall.reflected) {
    velocity[0] *= -1;
    nextX = xWall.value;
  }

  const yWall = reflectIfOutOfBounds(nextY, bounds.y);
  if (yWall.reflected) {
    velocity[1] *= -1;
    nextY = yWall.value;
  }

  const zWall = reflectIfOutOfBounds(nextZ, bounds.z);
  if (zWall.reflected) {
    velocity[2] *= -1;
    nextZ = zWall.value;
  }

  let hitBrickId: string | undefined;

  for (const brick of bricks) {
    const collision = resolveBrickCollision(
      { x: nextX, y: nextY, z: nextZ, radius: ball.radius },
      brick
    );

    if (!collision.hit) continue;

    if (collision.axis === 'x') {
      velocity[0] *= -1;
    } else if (collision.axis === 'y') {
      velocity[1] *= -1;
    } else {
      velocity[2] *= -1;
    }

    hitBrickId = collision.brickId;
    break;
  }

  return {
    nextPosition: [nextX, nextY, nextZ],
    nextVelocity: velocity,
    hitBrickId,
  };
};

export { BRICK_SIZE };
