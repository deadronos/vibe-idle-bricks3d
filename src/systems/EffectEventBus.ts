import type { Vector3Tuple } from 'three';

export type EffectType = 'brick_hit' | 'brick_destroy';

export interface EffectEvent {
  type: EffectType;
  position: Vector3Tuple;
  color: string;
  amount?: number; // for damage numbers
}

type Listener = (event: EffectEvent) => void;

class EffectEventBus {
  private listeners: Listener[] = [];

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  emit(event: EffectEvent) {
    this.listeners.forEach((l) => l(event));
  }
}

export const effectBus = new EffectEventBus();
