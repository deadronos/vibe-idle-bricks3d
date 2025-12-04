import type { BrickBehavior } from './types';

export type PowerupEmitter = (brickId: string) => void;

/**
 * Placeholder behavior for powerup drops. Attach a custom emitter when registering.
 */
export function createPowerupDropBehavior(emitPowerup?: PowerupEmitter): BrickBehavior {
  return {
    name: 'powerupDrop',
    onDestroy: (_ctx, brick) => {
      if (!emitPowerup) return;
      emitPowerup(brick.id);
    },
  };
}
