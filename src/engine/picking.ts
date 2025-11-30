import type { Brick } from '../store/types';

export const getBrickFromInstance = (bricks: Brick[], instanceId: number | undefined | null) => {
  if (instanceId === null || instanceId === undefined) return null;
  if (instanceId < 0 || instanceId >= bricks.length) return null;
  return bricks[instanceId];
};
