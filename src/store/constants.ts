import type { AchievementDefinition } from './types';

/**
 * Palette of colors used for bricks.
 */
export const BRICK_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
];

/**
 * Dimensions of the gameplay arena.
 */
export const ARENA_SIZE = { width: 12, height: 10, depth: 8 };

/** Default starting wave number. */
export const DEFAULT_WAVE = 1;
/** Default starting ball speed. */
export const DEFAULT_BALL_SPEED = 0.1;
/** Default starting ball damage. */
export const DEFAULT_BALL_DAMAGE = 1;
/** Default starting ball count. */
export const DEFAULT_BALL_COUNT = 1;
/** Scaling factor for wave difficulty. */
export const WAVE_SCALE_FACTOR = 0.2;
/** Maximum number of balls allowed. */
export const MAX_BALL_COUNT = 20;

/**
 * Key used for local storage persistence.
 */
export const STORAGE_KEY = 'idle-bricks3d:game:v1';

/**
 * List of available achievements.
 */
export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'score-1k',
    label: 'Rising Star',
    description: 'Reach 1,000 score',
    type: 'score',
    threshold: 1000,
  },
  {
    id: 'score-10k',
    label: 'Meteoric',
    description: 'Reach 10,000 score',
    type: 'score',
    threshold: 10000,
  },
  {
    id: 'bricks-50',
    label: 'Crusher',
    description: 'Destroy 50 bricks',
    type: 'bricks',
    threshold: 50,
  },
  {
    id: 'bricks-200',
    label: 'Pulverizer',
    description: 'Destroy 200 bricks',
    type: 'bricks',
    threshold: 200,
  },
  {
    id: 'wave-3',
    label: 'Wave Rider',
    description: 'Reach wave 3',
    type: 'wave',
    threshold: 3,
  },
  {
    id: 'wave-5',
    label: 'Tide Surfer',
    description: 'Reach wave 5',
    type: 'wave',
    threshold: 5,
  },
  {
    id: 'upgrade-damage-5',
    label: 'Sharper Edge',
    description: 'Reach Ball Damage level 5',
    type: 'upgrade',
    threshold: 5,
    metric: 'ballDamage',
  },
  {
    id: 'upgrade-speed-5',
    label: 'Speed Demon',
    description: 'Reach Ball Speed level 5',
    type: 'upgrade',
    threshold: 5,
    metric: 'ballSpeed',
  },
  {
    id: 'upgrade-count-5',
    label: 'Ball Brigade',
    description: 'Reach 5 balls',
    type: 'upgrade',
    threshold: 5,
    metric: 'ballCount',
  },
];
