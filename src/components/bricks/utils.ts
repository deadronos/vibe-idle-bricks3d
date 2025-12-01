import { Color } from 'three';
import type { Brick } from '../../store/types';

const tempColor = new Color();

export const getDamageColor = (brick: Brick, isHovered: boolean) => {
  if (isHovered) return '#FFFFFF';

  tempColor.set(brick.color);
  const healthRatio = brick.health / brick.maxHealth;

  // Special handling for golden bricks - keep them bright and vibrant
  if (brick.type === 'golden') {
    // Golden bricks stay bright even when damaged
    tempColor.multiplyScalar(0.8 + 0.2 * healthRatio);
    return '#' + tempColor.getHexString();
  }

  // Armor bricks have slightly more desaturated appearance
  if (brick.type === 'armor') {
    tempColor.multiplyScalar(0.4 + 0.6 * healthRatio);
    return '#' + tempColor.getHexString();
  }

  // Darken as health decreases, but keep it visible (min 0.3 brightness)
  tempColor.multiplyScalar(0.3 + 0.7 * healthRatio);

  return '#' + tempColor.getHexString();
};
