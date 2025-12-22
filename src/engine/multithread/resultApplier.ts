import type { Ball, Brick } from '../../store/types';

export type Hit = { brickId: string; damage: number };
export type ContactInfo = {
  ballId: string;
  brickId: string;
  point: [number, number, number];
  normal: [number, number, number];
  relativeVelocity: [number, number, number];
  impulse: number;
};

/**
 * Safely apply a worker-produced positions/velocities result to the current balls list.
 * Handles the case where the worker result count differs from the current balls length
 * (e.g., balls were added/removed between job submission and completion).
 *
 * Returns an object with the updated balls array (positions/velocities applied for
 * the overlapping prefix), an array of damage `hits` to apply to bricks, and an
 * array of `contactInfos` describing the hit events for visuals/impulses.
 */
function arraysAreFinite(arr: Float32Array) {
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (!Number.isFinite(v)) return false;
  }
  return true;
}

export function applyWorkerResultToBalls(
  balls: Ball[],
  positions: Float32Array,
  velocities: Float32Array,
  options: {
    // Either hitIndices (SAB) or hitIds (transferable) may be provided. If both are present
    // hitIds takes precedence.
    hitIndices?: Int32Array | number[] | null;
    hitIds?: (string | null)[] | null;
    bricks?: Brick[] | null;
    critChance?: number;
  } = {}
): { nextBalls: Ball[]; hits: Hit[]; contactInfos: ContactInfo[] } {
  const { hitIndices = null, hitIds = null, bricks = null, critChance = 0 } = options;

  // Basic validation: lengths and numeric sanity
  if (positions.length % 3 !== 0 || velocities.length % 3 !== 0 || positions.length !== velocities.length) {
    console.warn('[multithread/resultApplier] invalid result array sizes - discarding result', {
      positionsLength: positions.length,
      velocitiesLength: velocities.length,
    });

    return { nextBalls: balls, hits: [], contactInfos: [] };
  }

  if (!arraysAreFinite(positions) || !arraysAreFinite(velocities)) {
    console.warn('[multithread/resultApplier] result arrays contain non-finite values - discarding result');
    return { nextBalls: balls, hits: [], contactInfos: [] };
  }

  const resCount = Math.floor(positions.length / 3);
  const appliedCount = Math.min(balls.length, resCount);

  // Build results for the overlapping portion only
  const hits: Hit[] = [];
  const contactInfos: ContactInfo[] = [];

  const next = balls.map((b, i) => {
    if (i >= appliedCount) return b; // leave unchanged for indices beyond result

    const off = i * 3;
    const nextPosition: [number, number, number] = [positions[off], positions[off + 1], positions[off + 2]];
    const nextVelocity: [number, number, number] = [velocities[off], velocities[off + 1], velocities[off + 2]];

    // Determine if this ball hit a brick
    let hitBrickId: string | undefined | null = undefined;

    if (hitIds && i < hitIds.length) {
      hitBrickId = hitIds[i] ?? null;
    } else if (hitIndices && bricks) {
      const idx = (hitIndices as Int32Array | number[])[i];
      if (typeof idx === 'number' && idx >= 0) hitBrickId = bricks[idx]?.id ?? null;
      else hitBrickId = null;
    }

    if (hitBrickId) {
      let damage = b.damage;
      if (critChance && Math.random() < critChance) damage *= 2;

      hits.push({ brickId: hitBrickId, damage });

      const relVel = b.velocity;
      const speed = Math.sqrt(relVel[0] * relVel[0] + relVel[1] * relVel[1] + relVel[2] * relVel[2]);
      const normal: [number, number, number] = speed > 1e-6 ? [relVel[0] / speed, relVel[1] / speed, relVel[2] / speed] : [0, 0, 1];

      contactInfos.push({
        ballId: b.id,
        brickId: hitBrickId,
        point: nextPosition,
        normal,
        relativeVelocity: relVel,
        impulse: b.damage,
      });
    }

    return {
      ...b,
      position: nextPosition,
      velocity: nextVelocity,
    };
  });

  return { nextBalls: next, hits, contactInfos };
}
