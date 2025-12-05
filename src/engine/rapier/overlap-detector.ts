import type { BallState, ContactEvent, RapierBody, Vec3 } from './types';
import { readTranslation } from './runtime-probes';

export function detectOverlaps(
  ballStates: BallState[],
  brickBodies: Map<
    string,
    { body: RapierBody | undefined; size: { x: number; y: number; z: number } }
  >
): ContactEvent[] {
  const out: ContactEvent[] = [];

  for (const ball of ballStates) {
    for (const [brickId, info] of brickBodies.entries()) {
      const b = info.body;
      let bx = 0;
      let by = 0;
      let bz = 0;

      if (b) {
        const t = readTranslation(b);
        bx = t[0];
        by = t[1];
        bz = t[2];
      }

      const dx = ball.position[0] - bx;
      const dy = ball.position[1] - by;
      const dz = ball.position[2] - bz;

      // closest point on AABB (local dx/dy/dz clamped to half-sizes)
      const cx = Math.max(-info.size.x / 2, Math.min(info.size.x / 2, dx));
      const cy = Math.max(-info.size.y / 2, Math.min(info.size.y / 2, dy));
      const cz = Math.max(-info.size.z / 2, Math.min(info.size.z / 2, dz));

      const distX = dx - cx;
      const distY = dy - cy;
      const distZ = dz - cz;

      const distance = Math.sqrt(distX * distX + distY * distY + distZ * distZ);

      // A tiny epsilon to be forgiving of numeric differences
      if (distance <= 0.5001) {
        // Contact point on brick in world coordinates
        const contactPoint: Vec3 = [bx + cx, by + cy, bz + cz];

        // Normal: from contact point toward ball center
        let nx = ball.position[0] - contactPoint[0];
        let ny = ball.position[1] - contactPoint[1];
        let nz = ball.position[2] - contactPoint[2];
        const nlen = Math.sqrt(nx * nx + ny * ny + nz * nz);
        if (nlen > 1e-6) {
          nx /= nlen;
          ny /= nlen;
          nz /= nlen;
        } else {
          nx = 0;
          ny = 0;
          nz = 1;
        }

        const relVel: Vec3 = [ball.velocity[0], ball.velocity[1], ball.velocity[2]];
        const speed = Math.sqrt(
          relVel[0] * relVel[0] + relVel[1] * relVel[1] + relVel[2] * relVel[2]
        );

        // Heuristic impulse estimate: relative speed (no mass info available here)
        const impulse = speed;

        out.push({
          ballId: ball.id,
          brickId,
          point: contactPoint,
          normal: [nx, ny, nz],
          impulse,
          relativeVelocity: relVel,
        });
      }
    }
  }

  return out;
}
