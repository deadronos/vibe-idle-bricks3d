import type { Brick } from '../store/types';

/**
 * Retrieves a brick from the array based on its instance ID.
 * Useful for instanced mesh picking.
 *
 * @param {Brick[]} bricks - The array of bricks.
 * @param {number | undefined | null} instanceId - The instance ID from the picking event.
 * @returns {Brick | null} The matching brick or null if invalid.
 */
export const getBrickFromInstance = (bricks: Brick[], instanceId: number | undefined | null) => {
  if (instanceId === null || instanceId === undefined) return null;
  if (instanceId < 0 || instanceId >= bricks.length) return null;
  return bricks[instanceId];
};
