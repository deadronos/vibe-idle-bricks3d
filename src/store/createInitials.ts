import {
  BRICK_COLORS,
  DEFAULT_BALL_DAMAGE,
  DEFAULT_BALL_SPEED,
  WAVE_SCALE_FACTOR,
} from './constants';
import type { Ball, Brick, BrickType } from './types';

const generateBrickId = () => `brick-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
const generateBallId = () => `ball-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const scaleForWave = (base: number, wave: number) =>
  Math.max(1, Math.round(base * (1 + WAVE_SCALE_FACTOR * Math.max(0, wave - 1))));

export const createInitialBricks = (wave: number): Brick[] => {
  const bricks: Brick[] = [];
  const rows = 4;
  const cols = 6;
  const layers = 3;
  const spacing = 1.8;

  for (let layer = 0; layer < layers; layer++) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const baseHealth = (layer + 1) * 3;
        const health = scaleForWave(baseHealth, wave);
        const baseValue = scaleForWave((layer + 1) * 10, wave);

        // Determine brick type
        const rand = Math.random();
        let type: BrickType = 'normal';
        let color = BRICK_COLORS[(row + col + layer) % BRICK_COLORS.length];
        let value = baseValue;
        let armorMultiplier: number | undefined = undefined;

        if (rand < 0.05) {
          // 5% chance for Golden Brick
          type = 'golden';
          color = '#FFD700'; // Gold color
          value = baseValue * 10; // 10x score
        } else if (rand < 0.15) {
          // 10% chance for Armor Brick (5-15% range)
          type = 'armor';
          color = '#B0C4DE'; // Steel blue
          armorMultiplier = 0.5; // 50% damage reduction
        }

        // Ensure the very first brick is a normal brick (keeps behavior deterministic for tests)
        if (bricks.length === 0) {
          type = 'normal';
          armorMultiplier = undefined;
        }

        bricks.push({
          id: generateBrickId(),
          position: [
            (col - cols / 2 + 0.5) * spacing,
            (row - rows / 2 + 0.5) * spacing + 2,
            (layer - layers / 2 + 0.5) * spacing - 1,
          ],
          health,
          maxHealth: health,
          color,
          value,
          type,
          armorMultiplier,
        });
      }
    }
  }

  return bricks;
};

export const createInitialBall = (
  speed: number = DEFAULT_BALL_SPEED,
  damage: number = DEFAULT_BALL_DAMAGE
): Ball => {
  const angle = Math.random() * Math.PI * 2;
  const elevation = (Math.random() - 0.5) * Math.PI * 0.5;

  return {
    id: generateBallId(),
    position: [0, -3, 0],
    velocity: [
      Math.cos(angle) * Math.cos(elevation) * speed,
      Math.abs(Math.sin(elevation)) * speed + 0.5,
      Math.sin(angle) * Math.cos(elevation) * speed,
    ],
    radius: 0.3,
    damage,
    color: '#FFFFFF',
  };
};
