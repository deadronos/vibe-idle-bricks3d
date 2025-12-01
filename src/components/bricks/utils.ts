import { Color } from 'three';
import type { Brick } from '../../store/types';

const tempColor = new Color();

export const getDamageColor = (brick: Brick, isHovered: boolean) => {
  if (isHovered) return '#FFFFFF';

  tempColor.set(brick.color);
  const healthRatio = brick.health / brick.maxHealth;

  // Darken as health decreases, but keep it visible (min 0.3 brightness)
  tempColor.multiplyScalar(0.3 + 0.7 * healthRatio);

  return '#' + tempColor.getHexString();
};
