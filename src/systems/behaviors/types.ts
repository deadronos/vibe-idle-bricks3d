import type { Brick, GameState } from '../../store/types';

export type Vec3 = [number, number, number];

export interface HitEvent {
  brickId: string;
  ballId?: string;
  point: Vec3;
  normal: Vec3;
  impulse?: number;
  relativeVelocity?: Vec3;
}

export interface BehaviorRunOptions {
  applyDamage?: boolean;
}

export type BehaviorContext = {
  getState: () => GameState;
};

export type BrickBehavior = {
  name: string;
  onHit?: (ctx: BehaviorContext, hit: HitEvent, options?: BehaviorRunOptions) => void | Promise<void>;
  onDestroy?: (ctx: BehaviorContext, brick: Brick) => void | Promise<void>;
};

export type BrickBehaviorRegistry = Map<string, BrickBehavior[]>;
