import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Ball } from '../store/types';
import { useGameStore, ARENA_SIZE } from '../store/gameStore';
import { stepBallFrame } from './collision';
import { RapierPhysicsSystem } from './rapier/RapierPhysicsSystem';
import type { RapierWorld, BallState } from './rapier/rapierWorld';
import { handleContact } from '../systems/brickBehaviors';

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
                useGameStore.setState({ useRapierPhysics: false, rapierActive: false, rapierInitError: (err as Error).message });
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
          for (const e of events) {
            const by = balls.find((x) => x.id === e.ballId);
            const damage = by ? by.damage : 1;
            hitsForStore.push({ brickId: e.brickId, damage });
          }

          if (hitsForStore.length > 0) {
            const apply = useGameStore.getState().applyHits;
            if (apply) apply(hitsForStore);
          }

          // Notify behaviors (do NOT re-apply damage here to avoid duplication)
          for (const e of events) {
            const by = balls.find((x) => x.id === e.ballId);
            const point = by ? by.position : [0, 0, 0];
            const relVel = by ? by.velocity : [0, 0, 0];
            const speed = Math.sqrt(relVel[0] * relVel[0] + relVel[1] * relVel[1] + relVel[2] * relVel[2]);
            const normal = speed > 1e-6 ? [relVel[0] / speed, relVel[1] / speed, relVel[2] / speed] : [0, 0, 1];
            handleContact({ ballId: e.ballId, brickId: e.brickId, point, normal, relativeVelocity: relVel, impulse: by ? by.damage : 1 }, { applyDamage: false });
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

    const hits: { brickId: string; damage: number }[] = [];
    const contactInfos: any[] = [];
    const nextBalls = balls.map((ball) => {
      const { nextPosition, nextVelocity, hitBrickId } = stepBallFrame(
        ball,
        delta,
        ARENA_SIZE,
        bricks
      );

      if (hitBrickId) {
        hits.push({ brickId: hitBrickId, damage: ball.damage });
        // Build a best-effort contactInfo for non-rapier path
        const relVel = ball.velocity;
        const speed = Math.sqrt(relVel[0] * relVel[0] + relVel[1] * relVel[1] + relVel[2] * relVel[2]);
        const normal = speed > 1e-6 ? [relVel[0] / speed, relVel[1] / speed, relVel[2] / speed] : [0, 0, 1];
        contactInfos.push({ ballId: ball.id, brickId: hitBrickId, point: nextPosition, normal, relativeVelocity: relVel, impulse: ball.damage });
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
          useGameStore.setState({ comboCount: newComboCount, comboMultiplier: newComboMultiplier, lastHitTime: Date.now() });
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
