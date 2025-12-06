import type { Brick } from '../../store/types';
import { BRICK_HALF_SIZE } from './constants';

/**
 * Clamps the time delta to a maximum value to prevent physics explosions.
 *
 * @param {number} delta - The time delta in seconds.
 * @returns {number} The clamped delta.
 */
export const clampDelta = (delta: number) => Math.min(delta, 0.05);

/**
 * Checks if a position is out of bounds and returns collision info.
 * This is a 1D check against a symmetric limit [-limit, limit].
 *
 * @param {number} position - The coordinate to check.
 * @param {number} limit - The boundary limit.
 * @returns {{ reflected: boolean; value: number }} Object indicating if reflected and the clamped position.
 */
export const reflectIfOutOfBounds = (position: number, limit: number) => {
  if (position < -limit || position > limit) {
    const clamped = Math.max(-limit, Math.min(limit, position));
    return { reflected: true, value: clamped };
  }
  return { reflected: false, value: position };
};

/**
 * Resolves collision between a sphere (ball) and a box (brick).
 *
 * @param {Object} target - The sphere object.
 * @param {number} target.x - X coordinate.
 * @param {number} target.y - Y coordinate.
 * @param {number} target.z - Z coordinate.
 * @param {number} target.radius - Radius of the sphere.
 * @param {Brick} brick - The brick object.
 * @returns {Object} Collision result.
 *  - hit: boolean indicating if a collision occurred.
 *  - axis: 'x' | 'y' | 'z' indicating the axis of collision (if hit).
 *  - brickId: The ID of the brick (if hit).
 */
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
