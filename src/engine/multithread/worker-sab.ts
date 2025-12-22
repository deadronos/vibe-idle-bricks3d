import { simulateStepInPlace } from './kernel';
import type { ArenaSize } from '../collision';
import type { Brick } from '../../store/types';

// Shared state set during init
let positions: Float32Array | null = null;
let velocities: Float32Array | null = null;
let radii: Float32Array | null = null;
let damages: Float32Array | null = null;
let outHitIndices: Int32Array | null = null;
let control: Int32Array | null = null; // single-control fallback
let flags: Int32Array | null = null; // ring-mode flags
let notify: Int32Array | null = null; // ring-mode notify counter
let counts: Int32Array | null = null; // per-slot counts
let metaFloats: Float64Array | null = null; // per-slot meta when ring-mode, or single meta in fallback
let bricks: Brick[] = [];
let running = false;
let capacity = 0;
let ringSize = 0;

function safeLog(...args: unknown[]) {
  // Use postMessage for logging if needed by main thread
  try {
    const s = self as unknown as { postMessage?: (m: unknown) => void };
    s.postMessage?.({ type: 'log', args });
  } catch {
    // ignore
  }
}

function loop() {
  running = true;

  while (running) {
    // Ring-mode processing (preferred when available)
    if (flags && notify && counts && metaFloats && positions && velocities && radii && damages && outHitIndices) {
      let didWork = false;

      for (let s = 0; s < ringSize; s++) {
        // Try to claim a pending slot (1 => 2)
        const prev = Atomics.compareExchange(flags, s, 1, 2);
        if (prev === 1) {
          didWork = true;
          try {
            const count = Atomics.load(counts, s);
            const delta = metaFloats[s * 4 + 0];
            const arena: ArenaSize = {
              width: metaFloats[s * 4 + 1],
              height: metaFloats[s * 4 + 2],
              depth: metaFloats[s * 4 + 3],
            };

            const posBase = s * capacity * 3;
            const scalarBase = s * capacity;

            // Defensive bounds check before calling kernel
            if (
              positions.length < posBase + count * 3 ||
              velocities.length < posBase + count * 3 ||
              radii.length < scalarBase + count ||
              damages.length < scalarBase + count ||
              outHitIndices.length < scalarBase + count
            ) {
              safeLog('[worker-sab] buffer length mismatch before simulateStepInPlace', {
                count,
                posBase,
                scalarBase,
                positionsLength: positions.length,
                velocitiesLength: velocities.length,
                radiiLength: radii.length,
                damagesLength: damages.length,
                outHitIndicesLength: outHitIndices.length,
              });
            } else {
              simulateStepInPlace(
                count,
                delta,
                arena,
                positions.subarray(posBase, posBase + count * 3),
                velocities.subarray(posBase, posBase + count * 3),
                radii.subarray(scalarBase, scalarBase + count),
                damages.subarray(scalarBase, scalarBase + count),
                bricks,
                outHitIndices.subarray(scalarBase, scalarBase + count)
              );
            }
          } catch (err) {
            safeLog('[worker-sab] error during simulateStepInPlace (ring-mode)', err);
          } finally {
            // mark as done
            Atomics.store(flags, s, 3);
            Atomics.notify(flags, s, 1);
          }
        }
      }

      if (!didWork) {
        // Wait for a notification on the notify counter
        try {
          const cur = Atomics.load(notify, 0);
          Atomics.wait(notify, 0, cur);
        } catch {
          // Fallback: brief yielding to event loop to avoid busy spin
          setTimeout(() => {
            /* noop */
          }, 0);
        }

        continue;
      }

      // continue loop to check for more work
      continue;
    }

    // Fallback single-control mode (legacy)
    if (!control) {
      // No control channel; sleep briefly to avoid busy spin
      try {
        setTimeout(() => {
          /* noop */
        }, 0);
      } catch {
        // ignore
      }
      continue;
    }

    // Wait while control[0] === 0 (idle)
    try {
      Atomics.wait(control, 0, 0);
    } catch {
      // If Atomics.wait is not supported in this environment, fall back to busy-polling
      // but keep this guarded for POC only.
      while (control && Atomics.load(control, 0) === 0) {
        // crude fallback
      }
    }

    if (!control) break;
    const cmd = Atomics.load(control, 0);
    if (cmd === 1) {
      // Process job
      try {
        if (
          !positions ||
          !velocities ||
          !radii ||
          !damages ||
          !outHitIndices ||
          !metaFloats ||
          !counts
        ) {
          Atomics.store(control, 0, 2);
          Atomics.notify(control, 0);
          continue;
        }

        const count = counts![0];
        const delta = metaFloats[0];
        const arena: ArenaSize = {
          width: metaFloats[1],
          height: metaFloats[2],
          depth: metaFloats[3],
        };

        simulateStepInPlace(count, delta, arena, positions, velocities, radii, damages, bricks, outHitIndices);
      } catch (err) {
        safeLog('[worker-sab] error during simulateStepInPlace', err);
      } finally {
        // Signal completion
        Atomics.store(control, 0, 2);
        Atomics.notify(control, 0);
      }
    } else if (cmd === 3) {
      break; // shutdown
    } else {
      // Unknown command; reset to idle
      Atomics.store(control, 0, 0);
    }
  }

  // exit
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (self as any).close?.();
}

self.addEventListener('message', (e: MessageEvent) => {
  const data = e.data as { type: string; payload?: unknown };
  if (!data) return;

  if (data.type === 'init') {
    // { buffers: { positions, velocities, radii, damages, outHitIndices, control, metaFloats, metaInts }, bricks }
    const payload = data.payload as {
      buffers: Record<string, SharedArrayBuffer | ArrayBuffer>;
      bricks?: Brick[];
      capacity?: number;
      ringSize?: number;
    };

    const b = payload.buffers;
    // Detect ring-mode by presence of 'flags' buffer
    if (b.flags && b.notify && b.counts) {
      flags = new Int32Array(b.flags as SharedArrayBuffer);
      notify = new Int32Array(b.notify as SharedArrayBuffer);
      counts = new Int32Array(b.counts as SharedArrayBuffer);

      positions = new Float32Array(b.positions as SharedArrayBuffer);
      velocities = new Float32Array(b.velocities as SharedArrayBuffer);
      radii = new Float32Array(b.radii as SharedArrayBuffer);
      damages = new Float32Array(b.damages as SharedArrayBuffer);
      outHitIndices = new Int32Array(b.outHitIndices as SharedArrayBuffer);
      metaFloats = new Float64Array(b.metaFloats as SharedArrayBuffer);

      capacity = payload.capacity || 0;
      ringSize = payload.ringSize || (flags ? flags.length : 0);
    } else {
      // Fallback single-control mode
      positions = new Float32Array(b.positions as SharedArrayBuffer);
      velocities = new Float32Array(b.velocities as SharedArrayBuffer);
      radii = new Float32Array(b.radii as SharedArrayBuffer);
      damages = new Float32Array(b.damages as SharedArrayBuffer);
      outHitIndices = new Int32Array(b.outHitIndices as SharedArrayBuffer);
      control = new Int32Array(b.control as SharedArrayBuffer);
      metaFloats = new Float64Array(b.metaFloats as SharedArrayBuffer);
      counts = new Int32Array(b.metaInts as SharedArrayBuffer);
    }

    bricks = payload.bricks ?? [];

    // Start the loop in a microtask so that the init handler can complete
    setTimeout(() => void loop(), 0);
  } else if (data.type === 'updateBricks') {
    const payload = data.payload as { bricks?: Brick[] };
    bricks = payload.bricks ?? [];
  } else if (data.type === 'shutdown') {
    running = false;
    if (control) {
      Atomics.store(control, 0, 3);
      Atomics.notify(control, 0);
    }
    if (notify) {
      try {
        Atomics.add(notify, 0, 1);
        Atomics.notify(notify, 0);
      } catch {
        /* ignore */
      }
    }
  }
});
