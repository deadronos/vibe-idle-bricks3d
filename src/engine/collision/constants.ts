/**
 * Dimensions of a standard brick.
 */
export const BRICK_SIZE = { x: 1.5, y: 0.8, z: 1 };

/**
 * Half-dimensions of a standard brick, useful for collision calculations.
 */
export const BRICK_HALF_SIZE = {
  x: BRICK_SIZE.x / 2,
  y: BRICK_SIZE.y / 2,
  z: BRICK_SIZE.z / 2,
};
