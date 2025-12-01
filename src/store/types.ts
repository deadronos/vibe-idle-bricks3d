import type { Vector3Tuple } from 'three';

export interface Brick {
  id: string;
  position: Vector3Tuple;
  health: number;
  maxHealth: number;
  color: string;
  value: number;
}

export interface Ball {
  id: string;
  position: Vector3Tuple;
  velocity: Vector3Tuple;
  radius: number;
  damage: number;
  color: string;
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  level: number;
  maxLevel: number;
  effect: () => void;
}

export interface GameSettings {
  enableBloom: boolean;
  enableShadows: boolean;
  enableSound: boolean;
  enableParticles: boolean;
}

export type AchievementType = 'score' | 'bricks' | 'wave' | 'upgrade';

export interface AchievementDefinition {
  id: string;
  label: string;
  description: string;
  type: AchievementType;
  threshold: number;
  metric?: 'ballDamage' | 'ballSpeed' | 'ballCount';
}

export interface GameDataState {
  score: number;
  bricksDestroyed: number;
  wave: number;
  maxWaveReached: number;
  unlockedAchievements: string[];
  settings: GameSettings;
}

export interface GameEntitiesState {
  bricks: Brick[];
  balls: Ball[];
  isPaused: boolean;
  ballSpawnQueue: number;
  lastBallSpawnTime: number;
  lastSaveTime?: number;
}

export interface UpgradeState {
  ballDamage: number;
  ballSpeed: number;
  ballCount: number;
}

export interface GameActions {
  addScore: (amount: number) => void;
  spawnBall: () => void;
  removeBall: (id: string) => void;
  updateBallPosition: (id: string, position: Vector3Tuple) => void;
  updateBallVelocity: (id: string, velocity: Vector3Tuple) => void;
  damageBrick: (id: string, damage: number) => void;
  removeBrick: (id: string) => void;
  regenerateBricks: () => void;
  togglePause: () => void;
  upgradeBallDamage: () => void;
  upgradeBallSpeed: () => void;
  upgradeBallCount: () => void;
  getBallDamageCost: () => number;
  getBallSpeedCost: () => number;
  getBallCountCost: () => number;
  resetGame: () => void;
  queueBallSpawns: (count: number) => void;
  tryProcessBallSpawnQueue: () => void;
  forceProcessAllQueuedBalls: () => void;
  toggleSetting: (key: keyof GameSettings) => void;
}

export type GameState = GameDataState & GameEntitiesState & UpgradeState & GameActions;
