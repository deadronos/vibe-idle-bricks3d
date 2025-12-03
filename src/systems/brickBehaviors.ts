import { useGameStore } from '../store/gameStore';
import type { Brick, Ball } from '../store/types';

export type Vec3 = [number, number, number];

export interface ContactInfo {
  ballId?: string;
  brickId: string;
  point: Vec3;
  normal: Vec3;
  impulse?: number;
  relativeVelocity?: Vec3;
}

export interface BrickBehavior {
  onHit?: (brickId: string, info: ContactInfo) => void;
  onUpdate?: (dt: number) => void;
  onDestroy?: (brickId: string) => void;
}

const registry = new Map<string, BrickBehavior>();

export function registerBehavior(key: string, behavior: BrickBehavior) {
  registry.set(key, behavior);
}

export function getBehaviorForBrick(brick: Brick | undefined): BrickBehavior | undefined {
  if (!brick) return undefined;
  return registry.get(brick.type) ?? registry.get('normal');
}

/**
 * Handle a contact event. By default this does NOT apply damage — callers
 * should aggregate hits and apply damage via the store if they want combo logic.
 * Pass { applyDamage: true } to also apply damage using the store's `applyHits`.
 */
export function handleContact(
  info: ContactInfo,
  opts: { applyDamage?: boolean } = { applyDamage: false }
) {
  const state = useGameStore.getState();

  // Optionally apply damage through the centralized applyHits so combo logic is preserved
  if (opts.applyDamage) {
    const ball = state.balls.find((b: Ball) => b.id === info.ballId);
    const damage = ball ? ball.damage : (info.impulse ?? 1);
    const apply = state.applyHits;
    if (apply) {
      try {
        apply([{ brickId: info.brickId, damage }]);
      } catch (e) {
        void e;
      }
    } else {
      const dmgFn = state.damageBrick;
      if (dmgFn) dmgFn(info.brickId, damage);
    }
  }

  // Invoke behavior hook for the brick (visuals, AOE impulses, stateful effects)
  const brick = state.bricks.find((b: Brick) => b.id === info.brickId);
  const behavior = getBehaviorForBrick(brick);
  if (behavior && typeof behavior.onHit === 'function') {
    try {
      behavior.onHit(info.brickId, info);
    } catch (e) {
      // Swallow behavior errors — they should not break physics stepping
      void e;
    }
  }
}

// Default no-op behavior registration for 'normal' bricks (kept lightweight)
registerBehavior('normal', {
  onHit: () => {
    // intentionally empty: store damage is applied by FrameManager via applyHits
  },
});

export default {
  registerBehavior,
  handleContact,
  getBehaviorForBrick,
};
