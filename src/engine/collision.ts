import type { Vector3Tuple } from 'three';
import type { Ball, Brick } from '../store/types';
import { BRICK_SIZE } from './collision/constants';
import {
  clampDelta as clampDeltaImpl,
  reflectIfOutOfBounds as reflectIfOutOfBoundsImpl,
  resolveBrickCollision as resolveBrickCollisionImpl,
} from './collision/math';

export interface ArenaSize {
  width: number;
  height: number;
  depth: number;
}

// BRICK_SIZE is defined in ./collision/constants and re-exported below.

export interface BallFrameResult {
  nextPosition: Vector3Tuple;
  nextVelocity: Vector3Tuple;
  hitBrickId?: string;
}

export const clampDelta = clampDeltaImpl;

const reflectIfOutOfBounds = reflectIfOutOfBoundsImpl;

const resolveBrickCollision = resolveBrickCollisionImpl;

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
