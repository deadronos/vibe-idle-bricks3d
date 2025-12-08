import type { Brick, GameState } from '../../store/types';

/**
 * 3-component vector tuple.
 */
export type Vec3 = [number, number, number];

/**
 * Represents a collision event between a ball and a brick.
 */
export interface HitEvent {
  /** The unique ID of the brick that was hit. */
  brickId: string;
  /** The unique ID of the ball that hit the brick (optional). */
  ballId?: string;
  /** The point of contact in 3D space. */
  point: Vec3;
  /** The normal vector at the point of contact. */
  normal: Vec3;
  /** The impulse magnitude of the collision (optional). */
  impulse?: number;
  /** The relative velocity vector at impact (optional). */
  relativeVelocity?: Vec3;
}

/**
 * Options for configuring behavior execution.
 */
export interface BehaviorRunOptions {
  /** Whether to apply damage to the brick. */
  applyDamage?: boolean;
}

/**
 * Context provided to behavior functions.
 */
export type BehaviorContext = {
  /** Function to retrieve the current game state. */
  getState: () => GameState;
};

/**
 * Definition of a behavior that can be attached to bricks.
 */
export type BrickBehavior = {
  /** The name of the behavior. */
  name: string;
  /**
   * Callback executed when a brick with this behavior is hit.
   *
   * @param {BehaviorContext} ctx - The execution context.
   * @param {HitEvent} hit - The hit event details.
   * @param {BehaviorRunOptions} [options] - Execution options.
   */
  onHit?: (ctx: BehaviorContext, hit: HitEvent, options?: BehaviorRunOptions) => void | Promise<void>;
  /**
   * Callback executed when a brick with this behavior is destroyed.
   *
   * @param {BehaviorContext} ctx - The execution context.
   * @param {Brick} brick - The brick being destroyed.
   */
  onDestroy?: (ctx: BehaviorContext, brick: Brick) => void | Promise<void>;
};

/**
 * Registry type for mapping brick types to their behaviors.
 */
export type BrickBehaviorRegistry = Map<string, BrickBehavior[]>;
