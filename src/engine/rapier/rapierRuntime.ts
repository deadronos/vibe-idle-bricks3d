import type { RapierWorld as RW } from './rapierWorld';

let runtimeWorld: RW | null = null;
let runtimeModule: any = null;

export function setWorld(w: RW | null) {
  runtimeWorld = w;
}

export function getWorld(): RW | null {
  return runtimeWorld;
}

export function resetWorld() {
  runtimeWorld = null;
}

export function setModule(m: any) {
  runtimeModule = m;
}

export function getModule() {
  return runtimeModule;
}

export function resetModule() {
  runtimeModule = null;
}

export function resetAll() {
  resetWorld();
  resetModule();
}
