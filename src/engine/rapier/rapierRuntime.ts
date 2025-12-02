import type { RapierWorld as RW } from './rapierWorld';

let runtimeWorld: RW | null = null;
let runtimeModule: unknown | undefined = undefined;

export function setWorld(w: RW | null) {
  runtimeWorld = w;
}

export function getWorld(): RW | null {
  return runtimeWorld;
}

export function resetWorld() {
  runtimeWorld = null;
}

export function setModule(m: unknown) {
  runtimeModule = m;
}

export function getModule(): unknown | undefined {
  return runtimeModule;
}

export function resetModule() {
  runtimeModule = undefined;
}

export function resetAll() {
  resetWorld();
  resetModule();
}
