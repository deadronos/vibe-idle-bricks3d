import { initRapier, resetRapier } from './rapierInit';
import { createWorld } from './rapierWorld';
import type { RapierWorld, ContactEvent } from './rapierWorld';
import { setModule, setWorld, getWorld as _getWorld, resetAll } from './rapierRuntime';
import { useGameStore } from '../../store/gameStore';
import type { Ball, Brick } from '../../store/types';

export const RapierPhysicsSystem = {
  async init(opts?: { gravity?: { x: number; y: number; z: number } }): Promise<RapierWorld> {
    const existing = _getWorld();
    if (existing) return existing;

    try {
      const R = await initRapier();
      try {
        const w = createWorld(R, opts?.gravity ?? { x: 0, y: 0, z: 0 });
        setModule(R);
        setWorld(w);
        try {
          useGameStore.setState({ rapierActive: true, rapierInitError: null });
        } catch {
          // best-effort
        }
        return w;
      } catch (err) {
        const msg = (err as Error)?.message ?? String(err);
        try {
          useGameStore.setState({ useRapierPhysics: false, rapierActive: false, rapierInitError: msg });
        } catch {
          /* ignore */
        }
        throw err;
      }
    } catch (err) {
      const msg = (err as Error)?.message ?? String(err);
      try {
        useGameStore.setState({ useRapierPhysics: false, rapierActive: false, rapierInitError: msg });
      } catch {
        /* ignore */
      }
      throw err;
    }
  },

  getWorld(): RapierWorld | null {
    return _getWorld();
  },

  destroy(): void {
    try {
      const w = _getWorld();
      if (w && typeof (w as RapierWorld).destroy === 'function') {
        try {
          (w as RapierWorld).destroy();
        } catch (e) {
          void e;
        }
      }
    } finally {
      try {
        resetAll();
      } catch {
        /* ignore */
      }
      try {
        resetRapier();
      } catch {
        /* ignore */
      }
      try {
        useGameStore.setState({ rapierActive: false });
      } catch {
        /* ignore */
      }
    }
  },

  isInitialized(): boolean {
    return _getWorld() != null;
  },

  addBall(b: Ball) {
    const w = _getWorld();
    if (!w) return;
    try {
      if (typeof w.addBall === 'function') w.addBall(b);
    } catch {
      /* ignore */
    }
  },

  removeBall(id: string) {
    const w = _getWorld();
    if (!w) return;
    try {
      if (typeof w.removeBall === 'function') w.removeBall(id);
    } catch {
      /* ignore */
    }
  },

  addBrick(brick: Brick) {
    const w = _getWorld();
    if (!w) return;
    try {
      if (typeof w.addBrick === 'function') w.addBrick(brick);
    } catch {
      /* ignore */
    }
  },

  removeBrick(id: string) {
    const w = _getWorld();
    if (!w) return;
    try {
      if (typeof w.removeBrick === 'function') w.removeBrick(id);
    } catch {
      /* ignore */
    }
  },

  step(dt?: number) {
    const w = _getWorld();
    if (!w) return;
    try {
      if (typeof w.step === 'function') w.step(dt);
    } catch {
      /* ignore */
    }
  },

  drainContactEvents(): ContactEvent[] {
    const w = _getWorld();
    if (!w || typeof w.drainContactEvents !== 'function') return [];
    try {
      return w.drainContactEvents();
    } catch {
      return [];
    }
  },

  getBallStates() {
    const w = _getWorld();
    if (!w || typeof w.getBallStates !== 'function') return [];
    try {
      return w.getBallStates();
    } catch {
      return [];
    }
  },

  applyImpulse(ballId: string, impulse: [number, number, number], point?: [number, number, number]) {
    const w = _getWorld();
    if (!w) return false;
    const fn = (w as RapierWorld).applyImpulseToBall;
    if (typeof fn !== 'function') return false;
    try {
      return fn.call(w, ballId, impulse, point);
    } catch {
      return false;
    }
  },

  applyTorque(ballId: string, torque: [number, number, number]) {
    const w = _getWorld();
    if (!w) return false;
    const fn = (w as RapierWorld).applyTorqueToBall;
    if (typeof fn !== 'function') return false;
    try {
      return fn.call(w, ballId, torque);
    } catch {
      return false;
    }
  },
};

export type RapierPhysicsSystemType = typeof RapierPhysicsSystem;
