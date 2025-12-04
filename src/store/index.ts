export { useGameStore } from './createStore';
export { buildInitialState } from './slices/persistence';
export {
  ARENA_SIZE,
  ACHIEVEMENTS,
  DEFAULT_BALL_SPEED,
  DEFAULT_BALL_DAMAGE,
  DEFAULT_BALL_COUNT,
} from './constants';
export { createInitialBricks, createInitialBall } from './createInitials';
export { getBallSpeedLevel } from './achievements';
export type {
  AchievementDefinition,
  AchievementType,
  Ball,
  Brick,
  GameActions,
  GameDataState,
  GameEntitiesState,
  GameSettings,
  GameState,
  Upgrade,
  UpgradeState,
} from './types';
