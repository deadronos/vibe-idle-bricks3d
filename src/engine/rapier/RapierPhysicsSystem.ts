import { initRapier, resetRapier } from './rapierInit';
import { createWorld } from './rapierWorld';
import type { RapierWorld, ContactEvent } from './rapierWorld';
import { setModule, setWorld, getWorld as _getWorld, resetAll } from './rapierRuntime';
import { useGameStore } from '../../store/gameStore';
import type { Ball, Brick } from '../../store/types';

/**
 * Singleton managing the lifecycle and interaction with the Rapier physics engine.
 * Provides a unified interface for initializing, updating, and querying the physics simulation.
 */
export const RapierPhysicsSystem = {
  /**
   * Initializes the physics system.
   * Loads the WASM module and creates the physics world.
   * Updates the game store with initialization status.
   *
   * @param {Object} [opts] - Configuration options.
   * @param {Object} [opts.gravity] - Gravity vector to use.
   * @returns {Promise<RapierWorld>} The initialized physics world.
   * @throws {Error} If initialization fails.
   */
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
          useGameStore.setState({
            useRapierPhysics: false,
            rapierActive: false,
            rapierInitError: msg,
          });
        } catch {
          /* ignore */
        }
        throw err;
      }
    } catch (err) {
      const msg = (err as Error)?.message ?? String(err);
      try {
        useGameStore.setState({
          useRapierPhysics: false,
          rapierActive: false,
          rapierInitError: msg,
        });
      } catch {
        /* ignore */
      }
      throw err;
    }
  },

  /**
   * Retrieves the current physics world instance.
   *
   * @returns {RapierWorld | null} The physics world or null if not initialized.
   */
  getWorld(): RapierWorld | null {
    return _getWorld();
  },

  /**
   * Destroys the physics system and releases resources.
   * Updates the game store status.
   */
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

  /**
   * Checks if the physics system is initialized.
   *
   * @returns {boolean} True if initialized.
   */
  isInitialized(): boolean {
    return _getWorld() != null;
  },

  /**
   * Adds a ball to the physics simulation.
   *
   * @param {Ball} b - The ball to add.
   */
  addBall(b: Ball) {
    const w = _getWorld();
    if (!w) return;
    try {
      if (typeof w.addBall === 'function') w.addBall(b);
    } catch {
      /* ignore */
    }
  },

  /**
   * Removes a ball from the physics simulation.
   *
   * @param {string} id - The ID of the ball to remove.
   */
  removeBall(id: string) {
    const w = _getWorld();
    if (!w) return;
    try {
      if (typeof w.removeBall === 'function') w.removeBall(id);
    } catch {
      /* ignore */
    }
  },

  /**
   * Adds a brick to the physics simulation.
   *
   * @param {Brick} brick - The brick to add.
   */
  addBrick(brick: Brick) {
    const w = _getWorld();
    if (!w) return;
    try {
      if (typeof w.addBrick === 'function') w.addBrick(brick);
    } catch {
      /* ignore */
    }
  },

  /**
   * Removes a brick from the physics simulation.
   *
   * @param {string} id - The ID of the brick to remove.
   */
  removeBrick(id: string) {
    const w = _getWorld();
    if (!w) return;
    try {
      if (typeof w.removeBrick === 'function') w.removeBrick(id);
    } catch {
      /* ignore */
    }
  },

  /**
   * Advances the physics simulation by one step.
   *
   * @param {number} [dt] - The time step delta (optional).
   */
  step(dt?: number) {
    const w = _getWorld();
    if (!w) return;
    try {
      if (typeof w.step === 'function') w.step(dt);
    } catch {
      /* ignore */
    }
  },

  /**
   * Retrieves and clears accumulated contact events.
   *
   * @returns {ContactEvent[]} List of contact events.
   */
  drainContactEvents(): ContactEvent[] {
    const w = _getWorld();
    if (!w || typeof w.drainContactEvents !== 'function') return [];
    try {
      return w.drainContactEvents();
    } catch {
      return [];
    }
  },

  /**
   * Retrieves the current state of all balls.
   *
   * @returns {Object[]} List of ball states.
   */
  getBallStates() {
    const w = _getWorld();
    if (!w || typeof w.getBallStates !== 'function') return [];
    try {
      return w.getBallStates();
    } catch {
      return [];
    }
  },

  /**
   * Applies an impulse to a ball.
   *
   * @param {string} ballId - The ID of the ball.
   * @param {Array<number>} impulse - The impulse vector [x, y, z].
   * @param {Array<number>} [point] - The application point (optional).
   * @returns {boolean} True if successful.
   */
  applyImpulse(
    ballId: string,
    impulse: [number, number, number],
    point?: [number, number, number]
  ) {
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

  /**
   * Applies torque to a ball.
   *
   * @param {string} ballId - The ID of the ball.
   * @param {Array<number>} torque - The torque vector [x, y, z].
   * @returns {boolean} True if successful.
   */
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

/**
 * Type of the RapierPhysicsSystem object.
 */
export type RapierPhysicsSystemType = typeof RapierPhysicsSystem;
