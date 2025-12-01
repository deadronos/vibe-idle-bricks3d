import type { Brick } from '../../store/types';

export const getDamageColor = (brick: Brick, isHovered: boolean) => {
  if (isHovered) return '#FFFFFF';
  const healthRatio = brick.health / brick.maxHealth;
  if (healthRatio > 0.5) return brick.color;
  return `hsl(${Math.floor(healthRatio * 60)}, 80%, 50%)`;
};
