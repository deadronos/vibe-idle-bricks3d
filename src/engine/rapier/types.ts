import type { Ball, Brick } from '../../store/types';

/** 3D Vector tuple [x, y, z] */
export type Vec3 = [number, number, number];
/** Quaternion tuple [x, y, z, w] */
export type Quat = [number, number, number, number];

/**
 * Represents a collision event between a ball and a brick in the Rapier world.
 */
export type ContactEvent = {
  /** The ID of the ball involved. */
  ballId: string;
  /** The ID of the brick involved. */
  brickId: string;
  /** The point of contact in world space. */
  point: Vec3;
  /** The normal vector at the contact point. */
  normal: Vec3;
  /** The magnitude of the impulse applied. */
  impulse?: number;
  /** The relative velocity vector at impact. */
  relativeVelocity?: Vec3;
};

/**
 * Represents the state of a ball in the physics simulation.
 */
export interface BallState {
  id: string;
  position: Vec3;
  velocity: Vec3;
  rotation?: Quat;
  angularVelocity?: Vec3;
}

/**
 * Interface for the internal Rapier world instance.
 * Abstracts the underlying WASM module types.
 */
export type RapierWorldRuntime = {
  createRigidBody: (desc: unknown) => unknown;
  createCollider: (colliderDesc: unknown, parent?: unknown) => unknown;
  removeRigidBody?: (obj: unknown) => void;
  step?: () => void;
  free?: () => void;
};

/**
 * Interface for a Rapier RigidBody.
 */
export type RapierBody = {
  handle?: unknown;
  setTranslation?: (x: number, y: number, z: number) => unknown;
  setTranslationRaw?: (x: number, y: number, z: number) => unknown;
  setLinvel?: (x: number, y: number, z: number) => unknown;
  translation?: () => { x?: number; y?: number; z?: number } | number[];
  linvel?: () => { x?: number; y?: number; z?: number } | number[];
  // Optional rotation / angular velocity accessors — various compat builds expose different shapes
  rotation?: () => { x?: number; y?: number; z?: number; w?: number } | number[];
  angvel?: () => { x?: number; y?: number; z?: number } | number[];
};

/**
 * Builder interface for RigidBody descriptions.
 */
export type RigidBodyDescBuilder = {
  setTranslation: (x: number, y: number, z: number) => RigidBodyDescBuilder;
  setLinvel?: (x: number, y: number, z: number) => RigidBodyDescBuilder;
  setTranslationRaw?: (x: number, y: number, z: number) => RigidBodyDescBuilder;
};

/**
 * Builder interface for Collider descriptions.
 */
export type ColliderDescBuilder = {
  setRestitution: (n: number) => ColliderDescBuilder;
  setFriction: (n: number) => ColliderDescBuilder;
};

/**
 * Interface for the Rapier WASM module.
 */
export type RapierModule = {
  World: new (gravity: { x: number; y: number; z: number }) => RapierWorldRuntime;
  RigidBodyDesc: {
    dynamic: () => RigidBodyDescBuilder;
    fixed: () => RigidBodyDescBuilder;
  };
  ColliderDesc: {
    ball: (r: number) => ColliderDescBuilder;
    cuboid: (x: number, y: number, z: number) => ColliderDescBuilder;
  };
};

/**
 * High-level interface for the game's physics world adapter.
 */
export interface RapierWorld {
  /** Adds a ball to the simulation. */
  addBall: (b: Ball) => void;
  /** Removes a ball from the simulation. */
  removeBall: (id: string) => void;
  /** Adds a brick to the simulation. */
  addBrick: (brick: Brick) => void;
  /** Removes a brick from the simulation. */
  removeBrick: (id: string) => void;
  /** Advances the simulation by one step. */
  step: (dt?: number) => void;
  /** Retrieves and clears accumulated contact events. */
  drainContactEvents: () => ContactEvent[];
  /** Retrieves the current state of all balls. */
  getBallStates: () => BallState[];
  /** Applies an impulse to a ball. */
  applyImpulseToBall?: (id: string, impulse: Vec3, point?: Vec3) => boolean;
  /** Applies torque to a ball. */
  applyTorqueToBall?: (id: string, torque: Vec3) => boolean;
  /** Cleans up the physics world resources. */
  destroy: () => void;
}
