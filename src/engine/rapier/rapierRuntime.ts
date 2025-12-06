import type { RapierWorld as RW } from './rapierWorld';

let runtimeWorld: RW | null = null;
let runtimeModule: unknown | undefined = undefined;

/**
 * Sets the global physics world instance.
 *
 * @param {RW | null} w - The physics world instance.
 */
export function setWorld(w: RW | null) {
  runtimeWorld = w;
}

/**
 * Retrieves the global physics world instance.
 *
 * @returns {RW | null} The physics world instance.
 */
export function getWorld(): RW | null {
  return runtimeWorld;
}

/**
 * Resets the global physics world instance to null.
 */
export function resetWorld() {
  runtimeWorld = null;
}

/**
 * Sets the loaded Rapier module.
 *
 * @param {unknown} m - The Rapier module.
 */
export function setModule(m: unknown) {
  runtimeModule = m;
}

/**
 * Retrieves the loaded Rapier module.
 *
 * @returns {unknown | undefined} The Rapier module.
 */
export function getModule(): unknown | undefined {
  return runtimeModule;
}

/**
 * Resets the loaded Rapier module to undefined.
 */
export function resetModule() {
  runtimeModule = undefined;
}

/**
 * Resets both the world and the module.
 */
export function resetAll() {
  resetWorld();
  resetModule();
}
