import type { Vector3Tuple } from 'three';

/**
 * Supported types of visual effects events.
 */
export type EffectType = 'brick_hit' | 'brick_destroy';

/**
 * Payload for an effect event.
 */
export interface EffectEvent {
  /** The type of effect to trigger. */
  type: EffectType;
  /** The 3D position where the effect should occur. */
  position: Vector3Tuple;
  /** The color associated with the effect (e.g., brick color). */
  color: string;
  /** Optional numeric value, e.g., for damage numbers. */
  amount?: number; // for damage numbers
}

/**
 * Function signature for effect event listeners.
 */
type Listener = (event: EffectEvent) => void;

/**
 * A simple event bus for decoupling game logic from visual effects.
 * Allows components to subscribe to events like brick hits without
 * coupling the store directly to the rendering components.
 */
class EffectEventBus {
  private listeners: Listener[] = [];

  /**
   * Subscribes a listener to effect events.
   *
   * @param {Listener} listener - The callback function to invoke on events.
   * @returns {Function} A cleanup function to unsubscribe the listener.
   */
  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Emits an effect event to all subscribers.
   *
   * @param {EffectEvent} event - The event data to emit.
   */
  emit(event: EffectEvent) {
    this.listeners.forEach((l) => l(event));
  }
}

/**
 * Singleton instance of the EffectEventBus.
 */
export const effectBus = new EffectEventBus();
