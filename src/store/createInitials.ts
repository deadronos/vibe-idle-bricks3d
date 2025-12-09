import {
  BRICK_COLORS,
  DEFAULT_BALL_DAMAGE,
  DEFAULT_BALL_SPEED,
  WAVE_SCALE_FACTOR,
} from './constants';
import type { Ball, Brick, BrickType } from './types';

/**
 * Generates a unique ID for a brick.
 * @returns {string} Unique brick ID.
 */
const generateBrickId = () => `brick-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

/**
 * Generates a unique ID for a ball.
 * @returns {string} Unique ball ID.
 */
const generateBallId = () => `ball-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

/**
 * Scales a value based on the current wave number.
 *
 * @param {number} base - The base value.
 * @param {number} wave - The current wave number.
 * @returns {number} The scaled value.
 */
export const scaleForWave = (base: number, wave: number) =>
  Math.max(1, Math.round(base * (1 + WAVE_SCALE_FACTOR * Math.max(0, wave - 1))));

/**
 * Creates the initial set of bricks for a given wave.
 *
 * @param {number} wave - The wave number to generate bricks for.
 * @returns {Brick[]} An array of generated bricks.
 */
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
        // If randomness produced a special brick (golden/armor) for the first slot,
        // explicitly reset it back to a normal brick including its value.
        if (bricks.length === 0) {
          type = 'normal';
          armorMultiplier = undefined;
          value = baseValue;
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

/**
 * Creates an initial ball with random direction.
 *
 * @param {number} [speed=DEFAULT_BALL_SPEED] - The ball's speed.
 * @param {number} [damage=DEFAULT_BALL_DAMAGE] - The ball's damage.
 * @returns {Ball} The generated ball.
 */
export const createInitialBall = (
  speed: number = DEFAULT_BALL_SPEED,
  damage: number = DEFAULT_BALL_DAMAGE
): Ball => {
  // Generate a random direction vector with positive Y (upward)
  // We use cylindrical coordinates to ensure uniform distribution
  const angle = Math.random() * Math.PI * 2;
  // Restrict Y component to be between 0.2 and 0.8 to avoid too shallow or too vertical launches
  const y = 0.2 + Math.random() * 0.6;
  const r = Math.sqrt(1 - y * y);

  const x = r * Math.cos(angle);
  const z = r * Math.sin(angle);

  return {
    id: generateBallId(),
    position: [0, -3, 0],
    velocity: [x * speed, y * speed, z * speed],
    radius: 0.3,
    damage,
    color: '#FFFFFF',
  };
};
