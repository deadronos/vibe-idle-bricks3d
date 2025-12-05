import type { BrickBehavior } from './types';

/**
 * Function signature for emitting a powerup.
 */
export type PowerupEmitter = (brickId: string) => void;

/**
 * Creates a behavior that drops a powerup when the brick is destroyed.
 *
 * @param {PowerupEmitter} [emitPowerup] - The callback to trigger the powerup drop.
 * @returns {BrickBehavior} The powerup drop behavior.
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
