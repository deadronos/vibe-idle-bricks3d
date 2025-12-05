import type { ContactEvent, Vec3 } from './types';

export function parseRuntimeEvents(
  runtime: unknown,
  handleToEntity: Map<unknown, { type: 'ball' | 'brick'; id: string }>
): ContactEvent[] {
  try {
    const runtimeAny = runtime as Record<string, unknown>;

    const tryCollect = (candidate: unknown): unknown[] | null => {
      if (!candidate) return null;
      try {
        if (typeof candidate === 'function') {
          const fn = candidate as (...args: unknown[]) => unknown;
          const res = fn();
          if (res == null) return null;
          if (Array.isArray(res)) return res as unknown[];
          if (
            res &&
            typeof res === 'object' &&
            typeof (res as Record<PropertyKey, unknown>)[Symbol.iterator] === 'function'
          )
            return Array.from(res as Iterable<unknown>);
          const resObj = res as Record<string, unknown>;
          if (typeof resObj.drain === 'function')
            return (resObj.drain as (...args: unknown[]) => unknown)() as unknown[];
          if (typeof resObj.drainEvents === 'function')
            return (resObj.drainEvents as (...args: unknown[]) => unknown)() as unknown[];
          if (typeof resObj.getEvents === 'function')
            return (resObj.getEvents as (...args: unknown[]) => unknown)() as unknown[];
          if (typeof resObj.getContactEvents === 'function')
            return (resObj.getContactEvents as (...args: unknown[]) => unknown)() as unknown[];
          return [res];
        }
        if (Array.isArray(candidate)) return candidate as unknown[];
        const candObj = candidate as Record<string, unknown>;
        if (typeof candObj.drain === 'function')
          return (candObj.drain as (...args: unknown[]) => unknown)() as unknown[];
        if (typeof candObj.drainEvents === 'function')
          return (candObj.drainEvents as (...args: unknown[]) => unknown)() as unknown[];
        if (typeof candObj.getEvents === 'function')
          return (candObj.getEvents as (...args: unknown[]) => unknown)() as unknown[];
        if (typeof candObj.getContactEvents === 'function')
          return (candObj.getContactEvents as (...args: unknown[]) => unknown)() as unknown[];
        return null;
      } catch {
        return null;
      }
    };

    // Candidate sources on the world object
    const candidates = [
      runtimeAny.getContactEvents,
      runtimeAny.contactEvents,
      runtimeAny.contactEventQueue,
      runtimeAny.eventQueue,
      runtimeAny.events,
      runtimeAny.narrowPhase,
      runtimeAny.getNarrowPhase,
    ];

    for (const cand of candidates) {
      const evs = tryCollect(typeof cand === 'function' ? cand.bind(runtimeAny) : cand);
      if (evs && evs.length) {
        // Convert raw runtime events to ContactEvent[] using handleToEntity map
        const out: ContactEvent[] = [];
        for (const ev of evs) {
          try {
            const evObj = ev as Record<string, unknown>;
            // Heuristic: find handles on the event object
            const possibleHandleKeys = [
              'collider1',
              'collider2',
              'colliderA',
              'colliderB',
              'body1',
              'body2',
              'bodyA',
              'bodyB',
              'rigidBody1',
              'rigidBody2',
              'a',
              'b',
              'object1',
              'object2',
              'handle1',
              'handle2',
            ];
            let h1: unknown = undefined;
            let h2: unknown = undefined;
            for (let i = 0; i < possibleHandleKeys.length; i += 2) {
              const k1 = possibleHandleKeys[i];
              const k2 = possibleHandleKeys[i + 1];
              if (evObj[k1] !== undefined && evObj[k2] !== undefined) {
                h1 = evObj[k1];
                h2 = evObj[k2];
                break;
              }
            }

            // Fallback: look for numeric pair in array-like event
            if (h1 === undefined && Array.isArray(ev) && ev.length >= 2) {
              h1 = (ev as unknown[])[0];
              h2 = (ev as unknown[])[1];
            }

            const unpack = (x: unknown) => {
              if (x && typeof x === 'object') {
                const xo = x as Record<string, unknown>;
                return xo.handle !== undefined ? xo.handle : x;
              }
              return x;
            };
            const key1 = unpack(h1);
            const key2 = unpack(h2);

            const e1 = key1 == null ? null : (handleToEntity.get(key1) ?? handleToEntity.get(h1));
            const e2 = key2 == null ? null : (handleToEntity.get(key2) ?? handleToEntity.get(h2));

            if (!e1 || !e2) continue;

            let ballId: string | undefined;
            let brickId: string | undefined;
            if (e1.type === 'ball' && e2.type === 'brick') {
              ballId = e1.id;
              brickId = e2.id;
            } else if (e2.type === 'ball' && e1.type === 'brick') {
              ballId = e2.id;
              brickId = e1.id;
            } else {
              // Not a ball-brick contact
              continue;
            }

            const extractVec = (obj: unknown, keys: string[]): Vec3 | undefined => {
              for (const k of keys) {
                if (!obj || typeof obj !== 'object') continue;
                const v = (obj as Record<string, unknown>)[k];
                if (v === undefined) continue;
                if (Array.isArray(v)) return [v[0] ?? 0, v[1] ?? 0, v[2] ?? 0] as Vec3;
                if (typeof v === 'object' && v !== null && ('x' in v || 'y' in v || 'z' in v)) {
                  const vo = v as Record<string, unknown>;
                  return [Number(vo.x ?? 0), Number(vo.y ?? 0), Number(vo.z ?? 0)];
                }
              }
              return undefined;
            };

            const point = extractVec(evObj, [
              'point',
              'contactPoint',
              'worldPoint',
              'p',
              'pt',
              'position',
            ]) ?? [0, 0, 0];
            const normal = extractVec(evObj, ['normal', 'contactNormal', 'n']) ?? undefined;
            const relVel =
              extractVec(evObj, [
                'relativeVelocity',
                'relative_vel',
                'vel',
                'relativeVelocityWorld',
              ]) ?? undefined;
            const rawImpulse =
              (evObj &&
                (evObj['impulse'] ??
                  evObj['totalImpulse'] ??
                  evObj['impulseMagnitude'] ??
                  evObj['normalImpulse'])) ??
              undefined;
            const impulse =
              typeof rawImpulse === 'number'
                ? rawImpulse
                : rawImpulse == null
                  ? undefined
                  : Number(rawImpulse as unknown);

            out.push({
              ballId,
              brickId,
              point,
              normal: normal ?? [0, 0, 1],
              impulse,
              relativeVelocity: relVel,
            });
          } catch {
            // ignore single-event failures
            continue;
          }
        }

        if (out.length) return out;
      }
    }
  } catch {
    // ignore runtime probing errors and fall back
  }
  return [];
}
