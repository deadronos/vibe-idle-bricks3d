import type { Ball, Brick } from '../../store/types';

export type Vec3 = [number, number, number];
export type Quat = [number, number, number, number];

export type ContactEvent = {
  ballId: string;
  brickId: string;
  point: Vec3;
  normal: Vec3;
  impulse?: number;
  relativeVelocity?: Vec3;
};

export interface BallState {
  id: string;
  position: Vec3;
  velocity: Vec3;
  rotation?: Quat;
  angularVelocity?: Vec3;
}

export type RapierWorldRuntime = {
  createRigidBody: (desc: unknown) => unknown;
  createCollider: (colliderDesc: unknown, parent?: unknown) => unknown;
  removeRigidBody?: (obj: unknown) => void;
  step?: () => void;
  free?: () => void;
};

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

export type RigidBodyDescBuilder = {
  setTranslation: (x: number, y: number, z: number) => RigidBodyDescBuilder;
  setLinvel?: (x: number, y: number, z: number) => RigidBodyDescBuilder;
  setTranslationRaw?: (x: number, y: number, z: number) => RigidBodyDescBuilder;
};

export type ColliderDescBuilder = {
  setRestitution: (n: number) => ColliderDescBuilder;
  setFriction: (n: number) => ColliderDescBuilder;
};

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

export interface RapierWorld {
  addBall: (b: Ball) => void;
  removeBall: (id: string) => void;
  addBrick: (brick: Brick) => void;
  removeBrick: (id: string) => void;
  step: (dt?: number) => void;
  drainContactEvents: () => ContactEvent[];
  getBallStates: () => BallState[];
  applyImpulseToBall?: (id: string, impulse: Vec3, point?: Vec3) => boolean;
  applyTorqueToBall?: (id: string, torque: Vec3) => boolean;
  destroy: () => void;
}
