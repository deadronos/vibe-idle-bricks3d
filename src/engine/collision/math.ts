import type { Brick } from '../../store/types';
import { BRICK_HALF_SIZE } from './constants';

export const clampDelta = (delta: number) => Math.min(delta, 0.05);

export const reflectIfOutOfBounds = (position: number, limit: number) => {
  if (position < -limit || position > limit) {
    const clamped = Math.max(-limit, Math.min(limit, position));
    return { reflected: true, value: clamped };
  }
  return { reflected: false, value: position };
};

export const resolveBrickCollision = (
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
