import type { Ball, Brick } from '../../store/types';
import type { ArenaSize } from '../collision';

// SAB runtime for zero-copy physics simulation. This is a small POC and intentionally
// conservative: it manages a single worker, a set of SAB buffers (positions, velocities,
// radii, damages, outHitIndices, control, metaFloats, metaInts) and provides a simple
// job submission and completion check API.

let worker: Worker | null = null;
let capacity = 0;

let positions: Float32Array | null = null;
let velocities: Float32Array | null = null;
let radii: Float32Array | null = null;
let damages: Float32Array | null = null;
let outHitIndices: Int32Array | null = null;
let control: Int32Array | null = null;
let metaFloats: Float64Array | null = null;
let metaInts: Int32Array | null = null;
let flags: Int32Array | null = null;
let notify: Int32Array | null = null;
let counts: Int32Array | null = null;

let bricksCache: Brick[] = [];
let initialized = false;
let ringSize = 0; // number of slots in ring buffer (1 = single-control mode)

// Job tracking for debugging and correlation
let globalJobCounter = 0;
const slotJobIds: Array<number | null> = []; // tracks jobId per slot (ring-mode) or single-control slot at index 0
const jobMeta = new Map<number, { count: number; ids?: string[] | null; created: number }>();

/** Create a SharedArrayBuffer when available, otherwise fallback to ArrayBuffer (useful for tests). */
function createBuffer(byteLength: number): SharedArrayBuffer | ArrayBuffer {
  if (typeof SharedArrayBuffer !== 'undefined') return new SharedArrayBuffer(byteLength);
  return new ArrayBuffer(byteLength);
}

/** Minimal Atomics wrapper with fallbacks for test environments where Atomics/SharedArrayBuffer aren't available */
const A = {
  load: (arr: Int32Array, idx: number) =>
    typeof Atomics !== 'undefined' && typeof Atomics.load === 'function' ? Atomics.load(arr, idx) : arr[idx],
  store: (arr: Int32Array, idx: number, val: number) =>
    typeof Atomics !== 'undefined' && typeof Atomics.store === 'function' ? Atomics.store(arr, idx, val) : ((arr[idx] = val), val),
  add: (arr: Int32Array, idx: number, val: number) =>
    typeof Atomics !== 'undefined' && typeof Atomics.add === 'function' ? Atomics.add(arr, idx, val) : ((arr[idx] = (arr[idx] ?? 0) + val), arr[idx]),
  notify: (arr: Int32Array, idx: number, count = 1) =>
    typeof Atomics !== 'undefined' && typeof Atomics.notify === 'function' ? Atomics.notify(arr, idx, count) : 0,
};

export function available(): boolean {
  return typeof SharedArrayBuffer !== 'undefined' && !!((globalThis as unknown as { crossOriginIsolated?: boolean }).crossOriginIsolated);
} 

export function isInitialized() {
  return initialized;
}

function allocSABArrays(newCapacity: number, newRingSize = 4) {
  capacity = newCapacity;
  ringSize = Math.max(1, Math.floor(newRingSize));

  // Per-slot capacity: how many balls can each slot contain
  const perSlotCapacity = capacity;

  // When ringSize === 1, this is the simple single-control mode; allocate minimal arrays
  if (ringSize === 1) {
    positions = new Float32Array(createBuffer(Float32Array.BYTES_PER_ELEMENT * perSlotCapacity * 3) as ArrayBuffer);
    velocities = new Float32Array(createBuffer(Float32Array.BYTES_PER_ELEMENT * perSlotCapacity * 3) as ArrayBuffer);
    radii = new Float32Array(createBuffer(Float32Array.BYTES_PER_ELEMENT * perSlotCapacity) as ArrayBuffer);
    damages = new Float32Array(createBuffer(Float32Array.BYTES_PER_ELEMENT * perSlotCapacity) as ArrayBuffer);
    outHitIndices = new Int32Array(createBuffer(Int32Array.BYTES_PER_ELEMENT * perSlotCapacity) as ArrayBuffer);
    // control meta
    control = new Int32Array(createBuffer(Int32Array.BYTES_PER_ELEMENT * 1) as ArrayBuffer);
    metaFloats = new Float64Array(createBuffer(Float64Array.BYTES_PER_ELEMENT * 4) as ArrayBuffer);
    metaInts = new Int32Array(createBuffer(Int32Array.BYTES_PER_ELEMENT * 1) as ArrayBuffer);

    // Initialize control to 0 (idle)
    A.store(control!, 0, 0);
    return;
  }

  // Ring mode: allocate per-slot regions
  const totalPositions = perSlotCapacity * 3 * ringSize;
  const totalVectors = perSlotCapacity * 3 * ringSize;
  const totalScalars = perSlotCapacity * ringSize;

  positions = new Float32Array(new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * totalPositions));
  velocities = new Float32Array(new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * totalVectors));
  radii = new Float32Array(new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * totalScalars));
  damages = new Float32Array(new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * totalScalars));
  outHitIndices = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * totalScalars));

  // Per-slot flags: 0=free,1=pending,2=processing,3=done
  control = null;
  // store flags and notify/counters in separate views
  const flagsBuf = createBuffer(Int32Array.BYTES_PER_ELEMENT * ringSize);
  // notify counter to wake worker when new jobs arrive
  const notifyBuf = createBuffer(Int32Array.BYTES_PER_ELEMENT * 1);
  const countsBuf = createBuffer(Int32Array.BYTES_PER_ELEMENT * ringSize);
  const metaBuf = createBuffer(Float64Array.BYTES_PER_ELEMENT * 4 * ringSize);

  // Attach views
  // We'll keep the previously named variables but repurpose metaFloats/metaInts to the per-slot arrays
  metaFloats = new Float64Array(metaBuf as ArrayBuffer);
  metaInts = new Int32Array(countsBuf as ArrayBuffer);
  // Create flags/notify as Int32Array but keep them as 'control' and 'metaInts' where appropriate
  const flagsView = new Int32Array(flagsBuf as ArrayBuffer);
  const notifyView = new Int32Array(notifyBuf as ArrayBuffer);

  // Assign to existing globals in a way that worker and runtime expect
  // We'll reuse `control` to point to a single-element view for shutdown detection in ring mode (not used for job signaling)
  control = new Int32Array(createBuffer(Int32Array.BYTES_PER_ELEMENT * 1) as ArrayBuffer);

  // Initialize flags and counters
  for (let i = 0; i < ringSize; i++) {
    A.store(flagsView, i, 0);
    A.store(metaInts, i, 0);
    metaFloats[i * 4 + 0] = 0; // delta
    metaFloats[i * 4 + 1] = 0; // arena.w
    metaFloats[i * 4 + 2] = 0; // arena.h
    metaFloats[i * 4 + 3] = 0; // arena.d
  }
  A.store(notifyView, 0, 0);

  // Save references for init-time worker transfer
  flags = flagsView;
  notify = notifyView;
  counts = metaInts;

  // Prepare per-slot job id tracking
  slotJobIds.length = ringSize;
  for (let i = 0; i < ringSize; i++) slotJobIds[i] = null;
}

/** Initialize the SAB worker and buffers at the given capacity. Idempotent. */
export function ensure(capacityHint = 256, requestedRingSize = 4) {
  if (!available()) return false;
  if (initialized) return true;

  try {
    allocSABArrays(capacityHint, requestedRingSize);
    worker = new Worker(new URL('./worker-sab.ts', import.meta.url), { type: 'module' });

    // Pipe worker-side safeLog messages to host console for debugging
    try {
      worker.addEventListener('message', (e: MessageEvent) => {
        const data = e.data as { type?: string; args?: unknown[] } | undefined;
        if (data && data.type === 'log' && Array.isArray(data.args)) {
          // eslint-disable-next-line no-console
          console.warn('[worker-sab]', ...data.args);
        }
      });

      worker.addEventListener('error', (err) => {
        try {
          // Some browsers deliver ErrorEvent objects; try to extract useful info
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const eAny = err as any;
          const msg = eAny?.message ?? eAny?.error?.message ?? undefined;
          const stack = eAny?.error?.stack ?? undefined;
          if (msg) {
            console.warn('[sabRuntime] worker error:', msg, { stack });
          } else {
            console.warn('[sabRuntime] worker error', err);
          }
        } catch (e) {
          console.warn('[sabRuntime] worker error (unexpected shape)', err);
        }
      });

      worker.addEventListener('messageerror', (err) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const eAny = err as any;
          console.warn('[sabRuntime] worker messageerror', eAny?.data ?? eAny);
        } catch {
          console.warn('[sabRuntime] worker messageerror', err);
        }
      });
    } catch {
      /* ignore */
    }

    // Build buffers payload including ring-mode buffers when present
    const buffers: Record<string, SharedArrayBuffer | ArrayBuffer> = {
      positions: positions!.buffer,
      velocities: velocities!.buffer,
      radii: radii!.buffer,
      damages: damages!.buffer,
      outHitIndices: outHitIndices!.buffer,
      metaFloats: metaFloats!.buffer,
      metaInts: metaInts!.buffer,
    };

    if (flags && notify && counts) {
      buffers.flags = flags.buffer;
      buffers.notify = notify.buffer;
      buffers.counts = counts.buffer;
    } else if (control) {
      buffers.control = control.buffer;
    }

    // Send init handshake
    worker.postMessage({
      type: 'init',
      payload: {
        buffers,
        bricks: bricksCache,
        capacity,
        ringSize,
      },
    });

    initialized = true;
    // Log for debugging
    try {
      console.info(`[sabRuntime] initialized with capacity ${capacity} ringSize=${ringSize}`);
    } catch {
      /* ignore */
    }
    return true;
  } catch (err) {
    console.warn('[sabRuntime] failed to initialize worker', err);
    destroy();
    return false;
  }
}

/** Shutdown worker and clear buffers */
export function destroy() {
  if (worker) {
    try {
      worker.postMessage({ type: 'shutdown' });
    } catch {
      /* ignore */
    }
    try {
      worker.terminate();
    } catch {
      /* ignore */
    }
  }

  worker = null;
  positions = null;
  velocities = null;
  radii = null;
  damages = null;
  outHitIndices = null;
  control = null;
  metaFloats = null;
  metaInts = null;
  flags = null;
  notify = null;
  counts = null;
  ringSize = 0;
  initialized = false;
}

/** Update bricks in the worker (structured clone). */
export function updateBricks(bricks: Brick[]) {
  bricksCache = bricks;
  if (worker) {
    try {
      worker.postMessage({ type: 'updateBricks', payload: { bricks } });
    } catch {
      /* ignore */
    }
  }
}

/** Submit a job if the worker is idle; returns true if job started. */
export function submitJobIfIdle(balls: Ball[], delta: number, arena: ArenaSize): boolean {
  if (!initialized || !positions || !velocities || !radii || !damages || !metaFloats) return false;

  const count = balls.length;
  if (count > capacity) {
    // Realloc and re-init if needed; simplistic approach: destroy and re-ensure
    destroy();
    ensure(Math.max(count, capacity * 2), Math.max(1, ringSize || 4));
  }

  // Ring mode: try to find a free slot
  if (flags && notify && counts && ringSize > 1) {
    // Find a free slot (simple scan)
    let found = -1;
    for (let s = 0; s < ringSize; s++) {
      if (A.load(flags!, s) === 0) {
        found = s;
        break;
      }
    }

    if (found === -1) return false; // ring full

    // Assign a job id for debugging and correlation
    const jobId = ++globalJobCounter;
    slotJobIds[found] = jobId;
    jobMeta.set(jobId, { count, ids: balls.map((b) => b.id), created: Date.now() });

    // Copy ball data into slot region
    const posBase = found * capacity * 3;
    const scalarBase = found * capacity;

    for (let i = 0; i < count; i++) {
      const b = balls[i];
      const off = posBase + i * 3;
      positions![off] = b.position[0];
      positions![off + 1] = b.position[1];
      positions![off + 2] = b.position[2];

      velocities![off] = b.velocity[0];
      velocities![off + 1] = b.velocity[1];
      velocities![off + 2] = b.velocity[2];

      radii![scalarBase + i] = b.radius;
      damages![scalarBase + i] = b.damage;
    }

    // Set per-slot meta
    A.store(counts!, found, count);
    metaFloats![found * 4 + 0] = delta;
    metaFloats![found * 4 + 1] = arena.width;
    metaFloats![found * 4 + 2] = arena.height;
    metaFloats![found * 4 + 3] = arena.depth;

    // Mark pending and notify worker. 1 = pending
    A.store(flags!, found, 1);

    // Bump notify counter to wake worker
    A.add(notify!, 0, 1);
    A.notify(notify!, 0);

    return true;
  }

  // Fallback single-control mode
  if (!control || !metaInts) return false;

  const cur = Atomics.load(control, 0);
  if (cur !== 0) return false;

  // Assign job id for this single-control request
  const jobId = ++globalJobCounter;
  slotJobIds[0] = jobId;
  jobMeta.set(jobId, { count, ids: balls.map((b) => b.id), created: Date.now() });

  // Copy ball arrays in-place
  for (let i = 0; i < count; i++) {
    const b = balls[i];
    const off = i * 3;
    positions![off] = b.position[0];
    positions![off + 1] = b.position[1];
    positions![off + 2] = b.position[2];

    velocities![off] = b.velocity[0];
    velocities![off + 1] = b.velocity[1];
    velocities![off + 2] = b.velocity[2];

    radii![i] = b.radius;
    damages![i] = b.damage;
  }

  // Set meta
  metaInts![0] = count;
  metaFloats![0] = delta;
  metaFloats![1] = arena.width;
  metaFloats![2] = arena.height;
  metaFloats![3] = arena.depth;

  // Signal request: set to 1 and notify worker
  A.store(control!, 0, 1);
  A.notify(control!, 0);
  return true; 
}

/** Check for a completed job and collect result if available; returns null if not ready. */
export function takeResultIfReady():
  | {
      positions: Float32Array;
      velocities: Float32Array;
      hitIndices: Int32Array;
      count: number;
      jobId?: number | null;
    }
  | null {
  if (!initialized || !positions || !velocities || !outHitIndices || !metaFloats) return null;

  // Ring-mode: search for a completed slot
  if (flags && counts && ringSize > 1) {
    for (let s = 0; s < ringSize; s++) {
      if (Atomics.load(flags, s) === 3) {
        const count = Atomics.load(counts, s);
        const posBase = s * capacity * 3;
        const scalarBase = s * capacity;

        const p = positions.subarray(posBase, posBase + count * 3);
        const v = velocities.subarray(posBase, posBase + count * 3);
        const hi = outHitIndices.subarray(scalarBase, scalarBase + count);

        // Retrieve job id for this slot if available
        const jobId = slotJobIds[s] ?? null;
        // Retrieve job ids from metadata for id-based mapping (if present)
        const jobIds = jobId ? (jobMeta.get(jobId)?.ids ?? null) : null;

        // Reset flag to free and clear slot job tracking
        Atomics.store(flags, s, 0);
        slotJobIds[s] = null;

        // Remove job metadata now that result is being consumed
        if (jobId) jobMeta.delete(jobId);

        return { positions: p, velocities: v, hitIndices: hi, count, jobId, jobIds };
      }
    }

    return null;
  }

  // Fallback single-control mode
  if (!control || !metaInts) return null;

  const cur = A.load(control!, 0);
  if (cur !== 2) return null; // not ready

  const count = metaInts![0];

  // Create views that point to the same underlying buffers (no copy)
  const p = positions.subarray(0, count * 3);
  const v = velocities.subarray(0, count * 3);
  const hi = outHitIndices.subarray(0, count);

  // Retrieve and clear job id for this single-control job, if any
  const jobId = slotJobIds[0] ?? null;
  // Retrieve jobIds from metadata and then delete metadata entry
  const jobIds = jobId ? (jobMeta.get(jobId)?.ids ?? null) : null;
  if (jobId) jobMeta.delete(jobId);
  slotJobIds[0] = null;

  // Reset control to idle (0) after reading results so the worker can accept a new job
  A.store(control!, 0, 0);

  return { positions: p, velocities: v, hitIndices: hi, count, jobId, jobIds }; 
}

/** Test helpers (test-only; do not use in production) */
export function _test_initInProcess(capacityHint = 64, requestedRingSize = 4) {
  try {
    allocSABArrays(capacityHint, requestedRingSize);
    initialized = true;
    return true;
  } catch (err) {
    console.warn('[sabRuntime] _test_initInProcess failed', err);
    destroy();
    return false;
  }
}

export function _test_getInternals() {
  return {
    flags,
    notify,
    counts,
    positions,
    velocities,
    radii,
    damages,
    outHitIndices,
    metaFloats,
    metaInts,
    capacity,
    ringSize,
  };
}

/** Returns true if any submitted SAB job is still in flight (pending/processing) */
export function isJobInFlight() {
  try {
    return slotJobIds.some((id) => id != null);
  } catch {
    return false;
  }
}

export default {
  available,
  isInitialized,
  ensure,
  destroy,
  updateBricks,
  submitJobIfIdle,
  takeResultIfReady,
  // Test helpers
  _test_initInProcess,
  _test_getInternals,
};
