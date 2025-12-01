// Intentionally no three.js Color import required here — tests expect deterministic strings
import type { Brick } from '../../store/types';

export const getDamageColor = (brick: Brick, isHovered: boolean) => {
  if (isHovered) return '#FFFFFF';

  const healthRatio = brick.health / brick.maxHealth;

  // If brick is healthy (>50%), keep the original color.
  if (healthRatio > 0.5) return brick.color;

  // Below half health — use an attention-grabbing HSL color.
  // Keep this deterministic for tests and rendering.
  return 'hsl(15, 80%, 50%)';
};
