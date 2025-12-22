import type { ArenaSize } from '../collision';
import { stepBallFrame } from '../collision';
import type { Ball, Brick } from '../../store/types';

/**
 * Input data for the simulation kernel.
 * All arrays are plain typed arrays suitable for structured clone/transfer.
 */
export interface SimInput {
  count: number;
  delta: number;
  arena: ArenaSize;
  positions: Float32Array; // length === count * 3
  velocities: Float32Array; // length === count * 3
  radii: Float32Array; // length === count
  ids: string[]; // length === count
  damages: Float32Array; // length === count
  bricks: Brick[]; // small array of plain objects (structured-cloneable)
}

/**
 * Output from the simulation kernel.
 */
export interface SimResult {
  positions: Float32Array; // length === count * 3
  velocities: Float32Array; // length === count * 3
  hitBrickIds: (string | null)[]; // length === count
  // Optional job id injected by the runtime for debugging/tracing
  jobId?: number | null;
}

/**
 * Pure numeric simulation kernel that advances "legacy" ball physics for each ball
 * and returns the updated positions/velocities and any brick hit ids. This function
 * is intended to be run inside a Worker or as a main-thread fallback.
 *
 * NOTE: keep this function pure and free of DOM/Three.js/Rapier usage so it is safe
 * to run inside a Worker environment.
 */
export function simulateStep(input: SimInput): SimResult {
  const { count, delta, arena, positions, velocities, radii, ids, damages, bricks } = input;

  const outPositions = new Float32Array(count * 3);
  const outVelocities = new Float32Array(count * 3);
  const hitBrickIds: (string | null)[] = new Array(count).fill(null);

  for (let i = 0; i < count; i++) {
    const posOff = i * 3;
    const velOff = i * 3;

    const ball: Ball = {
      id: ids[i] ?? `ball-${i}`,
      position: [positions[posOff], positions[posOff + 1], positions[posOff + 2]],
      velocity: [velocities[velOff], velocities[velOff + 1], velocities[velOff + 2]],
      radius: radii[i],
      damage: Number(damages[i]),
      color: '#ffffff',
    };

    const { nextPosition, nextVelocity, hitBrickId } = stepBallFrame(ball, delta, arena, bricks);

    outPositions[posOff] = nextPosition[0];
    outPositions[posOff + 1] = nextPosition[1];
    outPositions[posOff + 2] = nextPosition[2];

    outVelocities[velOff] = nextVelocity[0];
    outVelocities[velOff + 1] = nextVelocity[1];
    outVelocities[velOff + 2] = nextVelocity[2];

    hitBrickIds[i] = hitBrickId ?? null;
  }

  return {
    positions: outPositions,
    velocities: outVelocities,
    hitBrickIds,
  };
}


/**
 * Run the simulation writing results in-place into the provided output buffers.
 * This function is intended for SharedArrayBuffer-based workflows where zero-copy
 * updates are desired. It writes next positions and velocities into the provided
 * typed arrays and sets an integer index for any brick hit (-1 = none).
 */
export function simulateStepInPlace(
  count: number,
  delta: number,
  arena: ArenaSize,
  positions: Float32Array,
  velocities: Float32Array,
  radii: Float32Array,
  damages: Float32Array,
  bricks: Brick[],
  outHitIndices: Int32Array
): void {
  // Build a map from brick.id -> index for quick lookup
  const brickIndexMap = new Map<string, number>();
  for (let i = 0; i < bricks.length; i++) {
    brickIndexMap.set(bricks[i].id, i);
  }

  for (let i = 0; i < count; i++) {
    const posOff = i * 3;
    const velOff = i * 3;

    const ball: Ball = {
      id: `ball-${i}`,
      position: [positions[posOff], positions[posOff + 1], positions[posOff + 2]],
      velocity: [velocities[velOff], velocities[velOff + 1], velocities[velOff + 2]],
      radius: radii[i],
      damage: Number(damages[i]),
      color: '#ffffff',
    };

    const { nextPosition, nextVelocity, hitBrickId } = stepBallFrame(ball, delta, arena, bricks);

    positions[posOff] = nextPosition[0];
    positions[posOff + 1] = nextPosition[1];
    positions[posOff + 2] = nextPosition[2];

    velocities[velOff] = nextVelocity[0];
    velocities[velOff + 1] = nextVelocity[1];
    velocities[velOff + 2] = nextVelocity[2];

    if (hitBrickId) {
      const idx = brickIndexMap.get(hitBrickId);
      outHitIndices[i] = typeof idx === 'number' ? idx : -1;
    } else {
      outHitIndices[i] = -1;
    }
  }
}

export default simulateStep;
