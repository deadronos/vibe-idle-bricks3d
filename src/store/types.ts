import type { Vector3Tuple } from 'three';

/**
 * Brick types available in the game.
 */
export type BrickType = 'normal' | 'golden' | 'armor' | 'explosive';

/**
 * Represents a single brick in the game world.
 */
export interface Brick {
  /** Unique identifier for the brick. */
  id: string;
  /** Position in 3D space [x, y, z]. */
  position: Vector3Tuple;
  /** Current health of the brick. */
  health: number;
  /** Maximum health of the brick. */
  maxHealth: number;
  /** Color hex string. */
  color: string;
  /** Score value awarded upon destruction. */
  value: number;
  /** The type of the brick. */
  type: BrickType;
  /** Damage reduction multiplier (0.5 = 50% damage taken). */
  armorMultiplier?: number; // For armor bricks (damage reduction, e.g., 0.5 = 50% reduction)
}

/**
 * Represents a ball in the game world.
 */
export interface Ball {
  /** Unique identifier for the ball. */
  id: string;
  /** Position in 3D space [x, y, z]. */
  position: Vector3Tuple;
  /** Velocity vector [x, y, z]. */
  velocity: Vector3Tuple;
  /** Radius of the ball. */
  radius: number;
  /** Damage inflicted by the ball on collision. */
  damage: number;
  /** Color hex string. */
  color: string;
}

/**
 * Interface for upgrade definitions.
 */
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

/**
 * Game configuration settings.
 */
export interface GameSettings {
  /** Enable bloom post-processing effect. */
  enableBloom: boolean;
  /** Enable dynamic shadows. */
  enableShadows: boolean;
  /** Enable game sounds. */
  enableSound: boolean;
  /** Enable particle effects. */
  enableParticles: boolean;
  /** Enable Rapier physics engine. */
  enableFullRigidPhysics?: boolean;
  /** Graphics quality preset. */
  graphicsQuality?: 'auto' | 'low' | 'medium' | 'high';
  /** Toggle compact HUD mode. */
  compactHudEnabled?: boolean;
  /** Enable SharedArrayBuffer-backed physics runtime (experimental). */
  enableSABPhysics?: boolean;
}

/**
 * Types of achievements.
 */
export type AchievementType = 'score' | 'bricks' | 'wave' | 'upgrade';

/**
 * Definition of an achievement.
 */
export interface AchievementDefinition {
  id: string;
  label: string;
  description: string;
  type: AchievementType;
  threshold: number;
  metric?: 'ballDamage' | 'ballSpeed' | 'ballCount';
}

/**
 * Persistent game data state (saved to local storage).
 */
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
  // Ephemeral ARIA announcements (not persisted)
  latestAnnouncement?: string | null;
}

/**
 * Ephemeral game entities state (reset on reload usually, but some persisted).
 */
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

/**
 * State related to player upgrades.
 */
export interface UpgradeState {
  ballDamage: number;
  ballSpeed: number;
  ballCount: number;
  critChance: number;
}

/**
 * Actions available to modify the game state.
 */
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
  upgradeCritChance: () => void;
  getBallDamageCost: () => number;
  getBallSpeedCost: () => number;
  getBallCountCost: () => number;
  getCritChanceCost: () => number;
  resetGame: () => void;
  queueBallSpawns: (count: number) => void;
  tryProcessBallSpawnQueue: () => void;
  forceProcessAllQueuedBalls: () => void;
  toggleSetting: (key: keyof GameSettings) => void;
  setGraphicsQuality?: (value: 'auto' | 'low' | 'medium' | 'high') => void;
  announce?: (msg: string) => void;
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

/**
 * Complete game state interface, combining data, entities, upgrades, and actions.
 */
export type GameState = GameDataState & GameEntitiesState & UpgradeState & GameActions;
