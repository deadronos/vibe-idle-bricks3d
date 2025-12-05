import { createBodyManager } from './body-management';
import { parseRuntimeEvents } from './contact-parsing';
import { detectOverlaps } from './overlap-detector';
import type {
  RapierModule,
  RapierWorldRuntime,
  RapierWorld,
  ContactEvent,
  BallState,
  Vec3,
} from './types';

export type { RapierModule, RapierWorld, ContactEvent, BallState, Vec3 };

// Minimal wrapper around the rapier runtime. The implementation deliberately
// keeps types loose and falls back to a simple overlap detector if the
// runtime doesn't expose contact event APIs in an environment-dependent way.
export function createWorld(rapierParam: unknown, gravity = { x: 0, y: 0, z: 0 }): RapierWorld {
  const rapier = rapierParam as RapierModule;
  let world: RapierWorldRuntime | undefined;
  try {
    world = new rapier.World(gravity);
  } catch (err) {
    // Re-throw with additional context so tests/consumers can decide fallback behaviour.
    throw new Error(
      `Failed to create Rapier World — runtime may not be initialized or WASM failed to load: ${(err as Error).message}`
    );
  }

  if (!world) throw new Error('Failed to initialize Rapier world');
  const runtime = world as RapierWorldRuntime;

  const bodyManager = createBodyManager(rapier, runtime);

  function step(_dt?: number) {
    // Most compat builds expose a simple step() helper; call without args.
    // We deliberately ignore _dt here — tests will step the world repeatedly to emulate fixed-step integration.
    void _dt;
    if (typeof runtime.step === 'function') runtime.step();
  }

  function drainContactEvents() {
    // Try to extract runtime-provided contact events (several rapier builds expose different APIs).
    const events = parseRuntimeEvents(runtime, bodyManager.handleToEntity);
    if (events.length > 0) return events;

    // Many runtime builds don't expose a simple array — fall back to geometric overlap detection
    return detectOverlaps(bodyManager.getBallStates(), bodyManager.brickBodies);
  }

  function destroy() {
    // Best-effort cleanup; libs may or may not expose explicit disposers.
    bodyManager.destroy();
    try {
      if (typeof runtime.free === 'function') runtime.free();
    } catch {
      // ignore
    }
  }

  return {
    addBall: bodyManager.addBall,
    removeBall: bodyManager.removeBall,
    addBrick: bodyManager.addBrick,
    removeBrick: bodyManager.removeBrick,
    step,
    drainContactEvents,
    getBallStates: bodyManager.getBallStates,
    applyImpulseToBall: bodyManager.applyImpulseToBall,
    applyTorqueToBall: bodyManager.applyTorqueToBall,
    destroy,
  };
}
