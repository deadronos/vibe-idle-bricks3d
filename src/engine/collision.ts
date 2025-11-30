import type { Vector3Tuple } from 'three';
import type { Ball, Brick } from '../store/gameStore';

export interface ArenaSize {
  width: number;
  height: number;
  depth: number;
}

export const BRICK_SIZE = { x: 1.5, y: 0.8, z: 1 };
const BRICK_HALF_SIZE = {
  x: BRICK_SIZE.x / 2,
  y: BRICK_SIZE.y / 2,
  z: BRICK_SIZE.z / 2,
};

export interface BallFrameResult {
  nextPosition: Vector3Tuple;
  nextVelocity: Vector3Tuple;
  hitBrickId?: string;
}

export const clampDelta = (delta: number) => Math.min(delta, 0.05);

const reflectIfOutOfBounds = (position: number, limit: number) => {
  if (position < -limit || position > limit) {
    const clamped = Math.max(-limit, Math.min(limit, position));
    return { reflected: true, value: clamped };
  }
  return { reflected: false, value: position };
};

const resolveBrickCollision = (
  target: { x: number; y: number; z: number; radius: number },
  brick: Brick
) => {
  const dx = target.x - brick.position[0];
  const dy = target.y - brick.position[1];
  const dz = target.z - brick.position[2];

  const closestX = Math.max(-BRICK_HALF_SIZE.x, Math.min(BRICK_HALF_SIZE.x, dx));
  const closestY = Math.max(-BRICK_HALF_SIZE.y, Math.min(BRICK_HALF_SIZE.y, dy));
  const closestZ = Math.max(-BRICK_HALF_SIZE.z, Math.min(BRICK_HALF_SIZE.z, dz));

  const distX = dx - closestX;
  const distY = dy - closestY;
  const distZ = dz - closestZ;
  const distance = Math.sqrt(distX * distX + distY * distY + distZ * distZ);

  if (distance >= target.radius) {
    return { hit: false as const };
  }

  const absDistX = Math.abs(distX);
  const absDistY = Math.abs(distY);
  const absDistZ = Math.abs(distZ);

  if (absDistX >= absDistY && absDistX >= absDistZ) {
    return { hit: true as const, axis: 'x' as const, brickId: brick.id };
  }
  if (absDistY >= absDistX && absDistY >= absDistZ) {
    return { hit: true as const, axis: 'y' as const, brickId: brick.id };
  }

  return { hit: true as const, axis: 'z' as const, brickId: brick.id };
};

export const stepBallFrame = (
  ball: Ball,
  delta: number,
  arena: ArenaSize,
  bricks: Brick[]
): BallFrameResult => {
  const frameScale = clampDelta(delta) * 60;
  const velocity: Vector3Tuple = [
    ball.velocity[0],
    ball.velocity[1],
    ball.velocity[2],
  ];

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
