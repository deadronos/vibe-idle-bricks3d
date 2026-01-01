import { initRuntime, move, spawn } from 'multithreading';
import type { SimInput, SimResult } from './kernel';
import { simulateStep } from './kernel';
import type { ArenaSize } from '../collision';
import type { Ball, Brick } from '../../store/types';

let runtimeReady = false;
let jobInFlight = false;
let pendingResult: SimResult | null = null;
let runtimeDisabled = false;

const SAB_AVAILABLE =
  typeof SharedArrayBuffer !== 'undefined' &&
  !!((globalThis as unknown as { crossOriginIsolated?: boolean }).crossOriginIsolated);

/** Number of workers to use when initializing the runtime. */
function defaultWorkerCount(): number {
  try {
    const hc = typeof navigator !== 'undefined' ? (navigator as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency : undefined;
    if (!hc || hc <= 1) return 1;
    // Reserve one core for the main thread
    return Math.max(1, hc - 1);
  } catch {
    return 1;
  }
}

/** Initialize the worker runtime (idempotent). */
export function ensureRuntime(maxWorkers?: number) {
  if (runtimeDisabled) return;
  if (runtimeReady) return;

  try {
    initRuntime({ maxWorkers: maxWorkers ?? defaultWorkerCount() });
    runtimeReady = true;
  } catch (err) {
    // Disable runtime on repeated failures to avoid noisy errors
    runtimeDisabled = true;
    console.warn('[multithread/runtime] initRuntime failed, disabling multithread runtime', err);
  }
}

/** Whether SharedArrayBuffer + crossOriginIsolated are available. */
export const supportsSharedArrayBuffer = SAB_AVAILABLE;

// Optional SAB-based runtime for zero-copy updates
import sabRuntime from './sabRuntime';

export function ensureSABRuntime(capacity?: number, ringSize?: number) {
  return sabRuntime.ensure(capacity, ringSize);
}

export function submitSABJob(balls: Ball[], delta: number, arena: ArenaSize) {
  return sabRuntime.submitJobIfIdle(balls, delta, arena);
}

export function takeSABResult() {
  return sabRuntime.takeResultIfReady();
}

export function updateSABBricks(bricks: Brick[]) {
  return sabRuntime.updateBricks(bricks);
}

export function destroySABRuntime() {
  return sabRuntime.destroy();
}

/** Non-blocking tick: starts a worker job if none is in flight. */
export function tickSimulation(input: SimInput) {
  if (runtimeDisabled) return;
  if (!runtimeReady) ensureRuntime();
  if (!runtimeReady) return; // init failed
  if (jobInFlight) return;

  try {
    jobInFlight = true;

    // Use `move` helper to transfer/mark large buffers for zero-copy transfer when possible.
    const movable = move({ ...input });

    const handle = spawn(movable, simulateStep as unknown as (args: SimInput) => unknown);

    // join the handle and store the result as pending; don't block the caller.
    void handle.join().then((res: unknown) => {
      jobInFlight = false;
      if (res && typeof res === 'object') {
        const r = res as { ok?: boolean; value?: unknown; error?: unknown };
        if (r.ok) {
          pendingResult = r.value as SimResult;
        } else {
          console.warn('[multithread/runtime] worker job failed or returned an error', r.error ?? r);
        }
      } else {
        console.warn('[multithread/runtime] worker returned unexpected result', res);
      }
    }, (err: unknown) => {
      jobInFlight = false;
      console.warn('[multithread/runtime] worker.join() rejected', err);
    });
  } catch (err) {
    jobInFlight = false;
    runtimeDisabled = true;
    console.warn('[multithread/runtime] spawn failed - disabling runtime', err);
  }
}

/** Retrieve and clear any pending simulation result. */
export function takePendingResult(): SimResult | null {
  const r = pendingResult;
  pendingResult = null;
  return r;
}

/** Destroy/disable the runtime (best-effort). */
export function destroyRuntime() {
  runtimeReady = false;
  jobInFlight = false;
  pendingResult = null;
  runtimeDisabled = true;
}

/** Returns true if the runtime appears usable. */
export function isRuntimeUsable(): boolean {
  return !runtimeDisabled && runtimeReady;
}

export default {
  ensureRuntime,
  tickSimulation,
  takePendingResult,
  destroyRuntime,
  isRuntimeUsable,
  supportsSharedArrayBuffer,
  // SAB helpers
  ensureSABRuntime,
  submitSABJob,
  takeSABResult,
  updateSABBricks,
  destroySABRuntime,
};
