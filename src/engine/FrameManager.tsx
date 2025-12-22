import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Ball } from '../store/types';
import { useGameStore, ARENA_SIZE } from '../store/gameStore';
import { stepBallFrame } from './collision';
import { RapierPhysicsSystem } from './rapier/RapierPhysicsSystem';
import type { RapierWorld, BallState, ContactEvent } from './rapier/rapierWorld';
import { handleContact } from '../systems/brickBehaviors';

// Lazy dynamic loader for the multithread runtime to avoid synchronous `require()`
// in browser environments. The import is started in the background and the
// resulting module is cached so subsequent frames can use it synchronously.
let mtModulePromise: Promise<any> | null = null;
let mtModuleCached: any | null = null;

async function importMultithreadRuntime(): Promise<any> {
  if (mtModuleCached) return mtModuleCached;
  if (!mtModulePromise) {
    mtModulePromise = import('./multithread/runtime')
      .then((m) => ((mtModuleCached = (m && (m as any).default) || m)))
      .catch((err) => {
        // Reset promise so future attempts can retry
        mtModulePromise = null;
        throw err;
      });
  }
  return mtModulePromise;
}

/**
 * Component that manages the game loop and physics simulation.
 * Handles both the legacy collision system and the Rapier physics engine.
 * Synchronizes physics state with the Zustand store.
 *
 * @returns {null} This component does not render anything.
 */
export function FrameManager() {
  const isPaused = useGameStore((state) => state.isPaused);
  const damageBrick = useGameStore((state) => state.damageBrick);
  const tryProcessBallSpawnQueue = useGameStore((state) => state.tryProcessBallSpawnQueue);
  const resetCombo = useGameStore((state) => state.resetCombo);

  // Refs for Rapier runtime when enabled
  const rapierWorldRef = useRef<RapierWorld | null>(null);
  const regBallIds = useRef<Set<string>>(new Set());
  const regBrickIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Clean up rapier resources on unmount
    return () => {
      try {
        RapierPhysicsSystem.destroy();
      } catch (e) {
        void e;
      }
      rapierWorldRef.current = null;
    };
  }, []);

  useFrame((_, delta) => {
    // Process ball spawn queue (for gradual spawning on reload)
    tryProcessBallSpawnQueue();

    // Check combo timeout (3 seconds)
    const { lastHitTime, comboCount } = useGameStore.getState();
    if (comboCount > 0 && Date.now() - lastHitTime > 3000) {
      resetCombo();
    }

    if (isPaused) return;

    const state = useGameStore.getState();
    const { balls, bricks, useRapierPhysics } = state;
    if (!balls.length) return;

    if (useRapierPhysics) {
      // Initialize Rapier lazily if toggle was enabled but not initialized yet
      if (!rapierWorldRef.current && state.useRapierPhysics) {
        RapierPhysicsSystem.init()
          .then((w) => {
            try {
              rapierWorldRef.current = w;

              // Register existing bricks and balls
              for (const b of bricks) {
                try {
                  w.addBrick(b);
                  regBrickIds.current.add(b.id);
                } catch (e) {
                  void e;
                }
              }

              for (const b of balls) {
                try {
                  w.addBall(b);
                  regBallIds.current.add(b.id);
                } catch (e) {
                  void e;
                }
              }
            } catch (err) {
              try {
                useGameStore.setState({
                  useRapierPhysics: false,
                  rapierActive: false,
                  rapierInitError: (err as Error).message,
                });
              } catch {
                /* ignore */
              }
            }
          })
          .catch(() => {
            // RapierPhysicsSystem.init handles store state on error
          });
      }

      const w = RapierPhysicsSystem.getWorld();
      if (w) {
        // Sync newly-added balls
        const ballIds = new Set(balls.map((b) => b.id));
        for (const b of balls) {
          if (!regBallIds.current.has(b.id)) {
            try {
              w.addBall(b);
            } catch (e) {
              void e;
            }
            regBallIds.current.add(b.id);
          }
        }

        // Cleanup removed balls
        for (const id of Array.from(regBallIds.current)) {
          if (!ballIds.has(id)) {
            try {
              w.removeBall(id);
            } catch (e) {
              void e;
            }
            regBallIds.current.delete(id);
          }
        }

        // Sync bricks similarly
        const brickIds = new Set(bricks.map((b) => b.id));
        for (const br of bricks) {
          if (!regBrickIds.current.has(br.id)) {
            try {
              w.addBrick(br);
            } catch (e) {
              void e;
            }
            regBrickIds.current.add(br.id);
          }
        }

        for (const id of Array.from(regBrickIds.current)) {
          if (!brickIds.has(id)) {
            try {
              w.removeBrick(id);
            } catch (e) {
              void e;
            }
            regBrickIds.current.delete(id);
          }
        }

        // Step the world
        w.step(delta);

        // Drain events and forward to the store; also notify behavior hooks.
        const events = w.drainContactEvents();
        if (events.length > 0) {
          // Aggregate for damage/combo then call behavior hooks for visuals/impulses.
          const hitsForStore: { brickId: string; damage: number }[] = [];
          const { critChance } = useGameStore.getState();

          for (const e of events) {
            const by = balls.find((x) => x.id === e.ballId);
            let damage = by ? by.damage : 1;

            if (critChance && Math.random() < critChance) {
              damage *= 2;
            }

            hitsForStore.push({ brickId: e.brickId, damage });
          }

          if (hitsForStore.length > 0) {
            const apply = useGameStore.getState().applyHits;
            if (apply) apply(hitsForStore);
          }

          // Notify behaviors (do NOT re-apply damage here to avoid duplication)
          for (const e of events) {
            const by = balls.find((x) => x.id === e.ballId);
            const point = e.point ?? (by ? by.position : [0, 0, 0]);
            const relVel = e.relativeVelocity ?? (by ? by.velocity : [0, 0, 0]);
            const normal =
              e.normal ??
              (() => {
                const rv = relVel;
                const speed = Math.sqrt(rv[0] * rv[0] + rv[1] * rv[1] + rv[2] * rv[2]);
                return speed > 1e-6 ? [rv[0] / speed, rv[1] / speed, rv[2] / speed] : [0, 0, 1];
              })();
            const impulse = e.impulse ?? (by ? by.damage : 1);

            // Apply physical impulse/torque to the ball if the runtime supports it.
            try {
              // Prefer applying an impulse at contact point (world space) so Rapier generates torque naturally
              const impVec: [number, number, number] = [
                normal[0] * (impulse as number),
                normal[1] * (impulse as number),
                normal[2] * (impulse as number),
              ];
              RapierPhysicsSystem.applyImpulse(
                e.ballId,
                impVec as [number, number, number],
                point as [number, number, number]
              );
            } catch {
              /* ignore failures */
            }

            handleContact(
              {
                ballId: e.ballId,
                brickId: e.brickId,
                point,
                normal,
                relativeVelocity: relVel,
                impulse,
              },
              { applyDamage: false }
            );
          }
        }

        // Read back ball states and update store so UI/legacy consumers stay consistent
        try {
          const states: BallState[] = w.getBallStates();
          if (states && states.length) {
            const next: Ball[] = balls.map((b) => {
              const s = states.find((x) => x.id === b.id);
              if (!s) return b;

              return {
                ...b,
                position: [s.position[0], s.position[1], s.position[2]] as [number, number, number],
                velocity: [s.velocity[0], s.velocity[1], s.velocity[2]] as [number, number, number],
              };
            });

            useGameStore.setState({ balls: next });
          }
        } catch {
          // best-effort; ignore transform reading errors
        }
      }

      return;
    }

    const { critChance } = useGameStore.getState();

    // Attempt to use the multithreaded physics runtime when available. We pipe a
    // job to the worker each frame and apply the *previous* completed result if
    // present. This avoids blocking the main thread while still keeping the
    // simulation reasonably up-to-date. If the runtime is not usable, we fallback
    // to the existing single-threaded stepBallFrame path.
    try {
      // Prepare typed arrays for transfer (zero-copy when possible)
      const count = balls.length;
      const positions = new Float32Array(count * 3);
      const velocitiesArr = new Float32Array(count * 3);
      const radiiArr = new Float32Array(count);
      const damagesArr = new Float32Array(count);
      const ids: string[] = new Array(count);

      for (let i = 0; i < count; i++) {
        const b = balls[i];
        const off = i * 3;
        positions[off] = b.position[0];
        positions[off + 1] = b.position[1];
        positions[off + 2] = b.position[2];

        velocitiesArr[off] = b.velocity[0];
        velocitiesArr[off + 1] = b.velocity[1];
        velocitiesArr[off + 2] = b.velocity[2];

        radiiArr[i] = b.radius;
        damagesArr[i] = b.damage;
        ids[i] = b.id;
      }

      // Start a non-blocking simulation job and apply any pending result.
      try {
        // If the runtime isn't cached yet, start loading it in the background.
        if (!mtModuleCached && !mtModulePromise) {
          void importMultithreadRuntime().catch((err) => {
            // Non-fatal background import failure; we'll fallback to single-thread path.
            // eslint-disable-next-line no-console
            console.warn('[FrameManager] background import of multithread runtime failed', err);
          });
        }

        // Use cached module if available (synchronous use on subsequent frames)
        const mt = mtModuleCached as any | null;

        // Preferred path: SharedArrayBuffer + Atomics (zero-copy) if available and explicitly enabled
        const sabEnabledEnv = Boolean((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_ENABLE_SAB);
        const sabEnabledSetting = Boolean(state.settings?.enableSABPhysics);
        const sabEnabled = sabEnabledEnv && sabEnabledSetting;

        if (sabEnabled && mt) {
          try {
            const sabSupported =
              typeof mt.supportsSharedArrayBuffer === 'function'
                ? mt.supportsSharedArrayBuffer()
                : Boolean(mt.supportsSharedArrayBuffer);

            if (sabSupported && typeof mt.ensureSABRuntime === 'function') {
              // Ensure the SAB worker/runtime is initialized (best-effort)
              try {
                mt.ensureSABRuntime(Math.max(64, count));
              } catch {
                /* ignore init failures (fallback next frame) */
              }

              try {
                mt.updateSABBricks(bricks);
              } catch {
                /* ignore */
              }

              try {
                mt.submitSABJob(balls, delta, ARENA_SIZE);
              } catch {
                /* ignore submit failures */
              }

              // Try to take a completed result from the SAB worker
              try {
                const r = typeof mt.takeSABResult === 'function' ? mt.takeSABResult() : null;
                if (r) {
                  const hits: { brickId: string; damage: number }[] = [];
                  const contactInfos: ContactEvent[] = [];

                  const next: typeof balls = balls.map((b, i) => {
                    const off = i * 3;
                    const nextPosition: [number, number, number] = [r.positions[off], r.positions[off + 1], r.positions[off + 2]];
                    const nextVelocity: [number, number, number] = [r.velocities[off], r.velocities[off + 1], r.velocities[off + 2]];

                    const hitIdx = r.hitIndices[i];
                    if (hitIdx >= 0) {
                      const hitBrickId = bricks[hitIdx]?.id;
                      if (hitBrickId) {
                        let damage = b.damage;
                        if (critChance && Math.random() < critChance) damage *= 2;

                        hits.push({ brickId: hitBrickId, damage });

                        const relVel = b.velocity;
                        const speed = Math.sqrt(
                          relVel[0] * relVel[0] + relVel[1] * relVel[1] + relVel[2] * relVel[2]
                        );
                        const normal: [number, number, number] =
                          speed > 1e-6 ? [relVel[0] / speed, relVel[1] / speed, relVel[2] / speed] : [0, 0, 1];

                        contactInfos.push({
                          ballId: b.id,
                          brickId: hitBrickId,
                          point: nextPosition,
                          normal,
                          relativeVelocity: relVel,
                          impulse: b.damage,
                        });
                      }
                    }

                    return {
                      ...b,
                      position: nextPosition,
                      velocity: nextVelocity,
                    };
                  });

                  if (hits.length > 0) {
                    const apply = useGameStore.getState().applyHits;
                    if (apply) apply(hits);
                    else {
                      for (const hit of hits) damageBrick(hit.brickId, hit.damage);

                      if (hits.length >= 2) {
                        const s = useGameStore.getState();
                        const newComboCount = s.comboCount + 1;
                        const newComboMultiplier = Math.min(1 + newComboCount * 0.05, 3);
                        useGameStore.setState({
                          comboCount: newComboCount,
                          comboMultiplier: newComboMultiplier,
                          lastHitTime: Date.now(),
                        });
                      }
                    }

                    for (const info of contactInfos) handleContact(info, { applyDamage: false });
                  }

                  useGameStore.setState({ balls: next });

                  return; // done for this frame
                }
              } catch {
                // treat as no result and continue to fallback
              }
            }
          } catch (err) {
            // Best-effort: log and continue to transferable or main-thread fallback
            // eslint-disable-next-line no-console
            console.warn('[FrameManager] error during SAB runtime use — falling back', err);
          }
        }

        // Fallback: transferable worker runtime (non-SAB) if runtime module is loaded
        if (mt && typeof mt.ensureRuntime === 'function') {
          try {
            mt.ensureRuntime();
          } catch {
            /* ignore */
          }

          try {
            mt.tickSimulation({
              count,
              delta,
              arena: ARENA_SIZE,
              positions,
              velocities: velocitiesArr,
              radii: radiiArr,
              ids,
              damages: damagesArr,
              bricks,
            });
          } catch (err) {
            // If tickSimulation fails, fall back to main-thread path this frame
            // eslint-disable-next-line no-console
            console.warn('[FrameManager] tickSimulation failed, falling back', err);
          }

          try {
            const res: ReturnType<typeof mt.takePendingResult> = typeof mt.takePendingResult === 'function' ? mt.takePendingResult() : null;
            if (res) {
              const hits: { brickId: string; damage: number }[] = [];
              const contactInfos: ContactEvent[] = [];

              const next: typeof balls = balls.map((b, i) => {
                const off = i * 3;
                const nextPosition: [number, number, number] = [
                  res.positions[off],
                  res.positions[off + 1],
                  res.positions[off + 2],
                ];
                const nextVelocity: [number, number, number] = [
                  res.velocities[off],
                  res.velocities[off + 1],
                  res.velocities[off + 2],
                ];

                const hitBrickId = res.hitBrickIds?.[i] ?? (res.hitBrickId ? res.hitBrickId[i] : undefined);
                if (hitBrickId) {
                  let damage = b.damage;
                  if (critChance && Math.random() < critChance) damage *= 2;

                  hits.push({ brickId: hitBrickId, damage });

                  const relVel = b.velocity;
                  const speed = Math.sqrt(
                    relVel[0] * relVel[0] + relVel[1] * relVel[1] + relVel[2] * relVel[2]
                  );
                  const normal: [number, number, number] =
                    speed > 1e-6 ? [relVel[0] / speed, relVel[1] / speed, relVel[2] / speed] : [0, 0, 1];

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

              if (hits.length > 0) {
                const apply = useGameStore.getState().applyHits;
                if (apply) apply(hits);
                else {
                  for (const hit of hits) damageBrick(hit.brickId, hit.damage);

                  if (hits.length >= 2) {
                    const s = useGameStore.getState();
                    const newComboCount = s.comboCount + 1;
                    const newComboMultiplier = Math.min(1 + newComboCount * 0.05, 3);
                    useGameStore.setState({
                      comboCount: newComboCount,
                      comboMultiplier: newComboMultiplier,
                      lastHitTime: Date.now(),
                    });
                  }
                }

                for (const info of contactInfos) handleContact(info, { applyDamage: false });
              }

              useGameStore.setState({ balls: next });

              return; // done for this frame
            }
          } catch (err) {
            // Nothing critical; fall through to main-thread path
            // eslint-disable-next-line no-console
            console.warn('[FrameManager] error reading pending runtime result — falling back', err);
          }
        }
      } catch (err) {
        // If the multithread runtime isn't available or failed, fall back to main-thread
        // single-thread path below.
        // eslint-disable-next-line no-console
        console.warn('[FrameManager] multithread runtime unavailable — falling back', err);
      }
    } catch {
      // Fallthrough to main-thread path on any prepare error
    }

    // Fallback: single-threaded simulation (original behaviour)
    const hits: { brickId: string; damage: number }[] = [];
    const contactInfos: ContactEvent[] = [];

    const nextBalls = balls.map((ball) => {
      const { nextPosition, nextVelocity, hitBrickId } = stepBallFrame(
        ball,
        delta,
        ARENA_SIZE,
        bricks
      );

      if (hitBrickId) {
        let damage = ball.damage;
        if (critChance && Math.random() < critChance) {
          damage *= 2;
        }

        hits.push({ brickId: hitBrickId, damage });
        // Build a best-effort contactInfo for non-rapier path
        const relVel = ball.velocity;
        const speed = Math.sqrt(
          relVel[0] * relVel[0] + relVel[1] * relVel[1] + relVel[2] * relVel[2]
        );
        const normal: [number, number, number] =
          speed > 1e-6 ? [relVel[0] / speed, relVel[1] / speed, relVel[2] / speed] : [0, 0, 1];
        contactInfos.push({
          ballId: ball.id,
          brickId: hitBrickId,
          point: [nextPosition[0], nextPosition[1], nextPosition[2]] as [number, number, number],
          normal,
          relativeVelocity: relVel,
          impulse: ball.damage,
        });
      }

      return {
        ...ball,
        position: nextPosition,
        velocity: nextVelocity,
      };
    });

    if (hits.length > 0) {
      // Use the centralized applyHits if available so combo logic is consistent
      const apply = useGameStore.getState().applyHits;
      if (apply) apply(hits);
      else {
        for (const hit of hits) {
          damageBrick(hit.brickId, hit.damage);
        }

        if (hits.length >= 2) {
          const s = useGameStore.getState();
          const newComboCount = s.comboCount + 1;
          const newComboMultiplier = Math.min(1 + newComboCount * 0.05, 3);
          useGameStore.setState({
            comboCount: newComboCount,
            comboMultiplier: newComboMultiplier,
            lastHitTime: Date.now(),
          });
        }
      }

      // Notify behaviors (do not re-apply damage here)
      for (const info of contactInfos) {
        handleContact(info, { applyDamage: false });
      }
    }

    useGameStore.setState({ balls: nextBalls });
  });

  return null;
}
