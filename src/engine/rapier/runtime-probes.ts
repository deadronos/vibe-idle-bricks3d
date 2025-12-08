import type { RapierBody, Vec3, Quat } from './types';

/**
 * Heuristic to extract the handle from a Rapier object.
 *
 * @param {unknown} obj - The object to inspect.
 * @returns {unknown} The handle or the object itself.
 */
export const maybeHandle = (obj: unknown) =>
  obj && typeof obj === 'object' ? ((obj as { handle?: unknown }).handle ?? obj) : obj;

/**
 * Reads the translation (position) from a Rapier body.
 * Handles different API shapes (function vs property, array vs object).
 *
 * @param {RapierBody} body - The Rapier body.
 * @returns {Vec3} The translation vector [x, y, z].
 */
export function readTranslation(body: RapierBody): Vec3 {
  const tRaw = typeof body.translation === 'function' ? body.translation() : body.translation;
  const px = Array.isArray(tRaw) ? (tRaw[0] ?? 0) : ((tRaw as { x?: number })?.x ?? 0);
  const py = Array.isArray(tRaw) ? (tRaw[1] ?? 0) : ((tRaw as { y?: number })?.y ?? 0);
  const pz = Array.isArray(tRaw) ? (tRaw[2] ?? 0) : ((tRaw as { z?: number })?.z ?? 0);
  return [px, py, pz];
}

/**
 * Reads the linear velocity from a Rapier body.
 * Handles different API shapes.
 *
 * @param {RapierBody} body - The Rapier body.
 * @returns {Vec3} The linear velocity vector [x, y, z].
 */
export function readLinvel(body: RapierBody): Vec3 {
  const vRaw = typeof body.linvel === 'function' ? body.linvel() : body.linvel;
  const vx = Array.isArray(vRaw) ? (vRaw[0] ?? 0) : ((vRaw as { x?: number })?.x ?? 0);
  const vy = Array.isArray(vRaw) ? (vRaw[1] ?? 0) : ((vRaw as { y?: number })?.y ?? 0);
  const vz = Array.isArray(vRaw) ? (vRaw[2] ?? 0) : ((vRaw as { z?: number })?.z ?? 0);
  return [vx, vy, vz];
}

/**
 * Reads the rotation (quaternion) from a Rapier body.
 * Handles different API shapes.
 *
 * @param {RapierBody} body - The Rapier body.
 * @returns {Quat} The rotation quaternion [x, y, z, w].
 */
export function readRotation(body: RapierBody): Quat {
  const qRaw = typeof body.rotation === 'function' ? body.rotation() : body.rotation;
  let qx = 0;
  let qy = 0;
  let qz = 0;
  let qw = 1;
  if (typeof qRaw !== 'undefined' && qRaw !== null) {
    if (Array.isArray(qRaw)) {
      qx = qRaw[0] ?? 0;
      qy = qRaw[1] ?? 0;
      qz = qRaw[2] ?? 0;
      qw = qRaw[3] ?? 1;
    } else {
      const qObj = qRaw as { x?: number; y?: number; z?: number; w?: number };
      qx = qObj.x ?? 0;
      qy = qObj.y ?? 0;
      qz = qObj.z ?? 0;
      qw = qObj.w ?? 1;
    }
  }
  return [qx, qy, qz, qw];
}

/**
 * Reads the angular velocity from a Rapier body.
 * Handles different API shapes.
 *
 * @param {RapierBody} body - The Rapier body.
 * @returns {Vec3} The angular velocity vector [x, y, z].
 */
export function readAngvel(body: RapierBody): Vec3 {
  const aRaw = typeof body.angvel === 'function' ? body.angvel() : body.angvel;
  const avx = Array.isArray(aRaw) ? (aRaw[0] ?? 0) : ((aRaw as { x?: number })?.x ?? 0);
  const avy = Array.isArray(aRaw) ? (aRaw[1] ?? 0) : ((aRaw as { y?: number })?.y ?? 0);
  const avz = Array.isArray(aRaw) ? (aRaw[2] ?? 0) : ((aRaw as { z?: number })?.z ?? 0);
  return [avx, avy, avz];
}

/**
 * Safely applies an impulse to a Rapier body.
 * Attempts different API methods (applyImpulse, applyImpulseAtPoint) and fallbacks.
 *
 * @param {RapierBody} body - The Rapier body.
 * @param {Vec3} impulse - The impulse vector.
 * @param {Vec3} [point] - The application point (optional).
 * @returns {boolean} True if successful.
 */
export function safeApplyImpulse(body: RapierBody, impulse: Vec3, point?: Vec3): boolean {
  try {
    const impObj = { x: impulse[0], y: impulse[1], z: impulse[2] };

    const anyB = body as unknown as {
      applyImpulse?: (a: unknown, b?: unknown) => unknown;
      applyImpulseAtPoint?: (a: unknown, b?: unknown, c?: unknown) => unknown;
      linvel?: () => unknown;
      setLinvel?: (x: number, y: number, z: number) => unknown;
    };

    if (typeof anyB.applyImpulse === 'function') {
      try {
        anyB.applyImpulse(impObj, true);
        return true;
      } catch {
        try {
          anyB.applyImpulse(impulse, true);
          return true;
        } catch {
          // continue
        }
      }
    }

    if (typeof anyB.applyImpulseAtPoint === 'function' && point) {
      try {
        anyB.applyImpulseAtPoint(impObj, { x: point[0], y: point[1], z: point[2] }, true);
        return true;
      } catch {
        try {
          anyB.applyImpulseAtPoint(impulse, point, true);
          return true;
        } catch {
          // continue
        }
      }
    }

    // Fallback: nudge linear velocity
    const currentLinvel = readLinvel(body);
    let vx = currentLinvel[0];
    let vy = currentLinvel[1];
    let vz = currentLinvel[2];

    const scale = 0.5;
    vx += impulse[0] * scale;
    vy += impulse[1] * scale;
    vz += impulse[2] * scale;

    if (typeof anyB.setLinvel === 'function') {
      try {
        anyB.setLinvel(vx, vy, vz);
        return true;
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }

  return false;
}

/**
 * Safely applies torque to a Rapier body.
 * Attempts different API methods and fallbacks.
 *
 * @param {RapierBody} body - The Rapier body.
 * @param {Vec3} torque - The torque vector.
 * @returns {boolean} True if successful.
 */
export function safeApplyTorque(body: RapierBody, torque: Vec3): boolean {
  try {
    const anyB = body as unknown as {
      applyTorque?: (a: unknown, b?: unknown) => unknown;
      setAngvel?: (x: number, y: number, z: number) => unknown;
      angvel?: () => unknown;
    };

    if (typeof anyB.applyTorque === 'function') {
      try {
        anyB.applyTorque({ x: torque[0], y: torque[1], z: torque[2] }, true);
        return true;
      } catch {
        try {
          anyB.applyTorque(torque, true);
          return true;
        } catch {
          // continue
        }
      }
    }

    if (typeof anyB.setAngvel === 'function') {
      try {
        anyB.setAngvel(torque[0], torque[1], torque[2]);
        return true;
      } catch {
        // ignore
      }
    }

    const currentAngvel = readAngvel(body);
    let avx = currentAngvel[0];
    let avy = currentAngvel[1];
    let avz = currentAngvel[2];

    const scale = 0.5;
    avx += torque[0] * scale;
    avy += torque[1] * scale;
    avz += torque[2] * scale;

    if (typeof anyB.setAngvel === 'function') {
      try {
        anyB.setAngvel(avx, avy, avz);
        return true;
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }

  return false;
}
