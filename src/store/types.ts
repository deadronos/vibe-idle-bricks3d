import type { Vector3Tuple } from 'three';

export type BrickType = 'normal' | 'golden' | 'armor';

export interface Brick {
  id: string;
  position: Vector3Tuple;
  health: number;
  maxHealth: number;
  color: string;
  value: number;
  type: BrickType;
  armorMultiplier?: number; // For armor bricks (damage reduction, e.g., 0.5 = 50% reduction)
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
  enableFullRigidPhysics?: boolean;
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
  // Prestige system
  vibeCrystals: number;
  prestigeLevel: number;
  prestigeMultiplier: number;
  // Combo system
  comboCount: number;
  comboMultiplier: number;
  lastHitTime: number;
}

export interface GameEntitiesState {
  bricks: Brick[];
  balls: Ball[];
  isPaused: boolean;
  ballSpawnQueue: number;
  lastBallSpawnTime: number;
  lastSaveTime?: number;
  // Rapier runtime control
  useRapierPhysics?: boolean;
  rapierActive?: boolean;
  rapierInitError?: string | null;
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
  // Prestige actions
  performPrestige: () => void;
  getPrestigeReward: () => number;
  // Combo actions
  resetCombo: () => void;
  // Rapier control APIs (runtime)
  setUseRapierPhysics?: (enabled: boolean) => void;
  setRapierActive?: (active: boolean) => void;
  setRapierInitError?: (msg: string | null) => void;
  applyHits?: (hits: Array<{ brickId: string; damage: number }>) => void;
}

export type GameState = GameDataState & GameEntitiesState & UpgradeState & GameActions;
