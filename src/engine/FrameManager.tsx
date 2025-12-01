import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore, ARENA_SIZE } from '../store/gameStore';
import { stepBallFrame } from './collision';
import { initRapier, resetRapier } from './rapier/rapierInit';
import { createWorld } from './rapier/rapierWorld';

export function FrameManager() {
  const isPaused = useGameStore((state) => state.isPaused);
  const damageBrick = useGameStore((state) => state.damageBrick);
  const tryProcessBallSpawnQueue = useGameStore((state) => state.tryProcessBallSpawnQueue);
  const resetCombo = useGameStore((state) => state.resetCombo);

  // Refs for Rapier runtime when enabled
  const rapierWorldRef = useRef<any | null>(null);
  const regBallIds = useRef<Set<string>>(new Set());
  const regBrickIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Clean up rapier resources on unmount
    return () => {
      if (rapierWorldRef.current) {
        try {
          rapierWorldRef.current.destroy();
        } catch {
          // ignore
        }
        rapierWorldRef.current = null;
      }
      resetRapier();
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
        initRapier()
          .then((R) => {
            try {
              const w = createWorld(R, { x: 0, y: 0, z: 0 });
              rapierWorldRef.current = w;

              // Register existing bricks and balls
              for (const b of bricks) {
                try {
                  w.addBrick(b);
                  regBrickIds.current.add(b.id);
                } catch {
                  // ignore registration failure
                }
              }

              for (const b of balls) {
                try {
                  w.addBall(b);
                  regBallIds.current.add(b.id);
                } catch {
                  // ignore
                }
              }

              // Mark rapier active
              useGameStore.setState({ rapierActive: true, rapierInitError: null });
            } catch (err) {
              useGameStore.setState({ useRapierPhysics: false, rapierActive: false, rapierInitError: (err as Error).message });
            }
          })
          .catch((err) => {
            useGameStore.setState({ useRapierPhysics: false, rapierActive: false, rapierInitError: (err as Error).message });
          });
      }

      const w = rapierWorldRef.current;
      if (w) {
        // Sync newly-added balls
        const ballIds = new Set(balls.map((b) => b.id));
        for (const b of balls) {
          if (!regBallIds.current.has(b.id)) {
            try {
              w.addBall(b);
            } catch {}
            regBallIds.current.add(b.id);
          }
        }

        // Cleanup removed balls
        for (const id of Array.from(regBallIds.current)) {
          if (!ballIds.has(id)) {
            try {
              w.removeBall(id);
            } catch {}
            regBallIds.current.delete(id);
          }
        }

        // Sync bricks similarly
        const brickIds = new Set(bricks.map((b) => b.id));
        for (const br of bricks) {
          if (!regBrickIds.current.has(br.id)) {
            try {
              w.addBrick(br);
            } catch {}
            regBrickIds.current.add(br.id);
          }
        }

        for (const id of Array.from(regBrickIds.current)) {
          if (!brickIds.has(id)) {
            try {
              w.removeBrick(id);
            } catch {}
            regBrickIds.current.delete(id);
          }
        }

        // Step the world
        w.step(delta);

        // Drain events and forward to the store
        const events = w.drainContactEvents();
        if (events.length > 0) {
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
        }

        // Read back ball states and update store so UI/legacy consumers stay consistent
        try {
          const states = w.getBallStates();
          if (states && states.length) {
            const next = balls.map((b) => {
              const s = states.find((x: any) => x.id === b.id);
              if (!s) return b;
              return { ...b, position: [s.position[0], s.position[1], s.position[2]], velocity: [s.velocity[0], s.velocity[1], s.velocity[2]] };
            });
            useGameStore.setState({ balls: next });
          }
        } catch {
          // ignore
        }
      }

      return;
    }

    const hits: { brickId: string; damage: number }[] = [];
    const nextBalls = balls.map((ball) => {
      const { nextPosition, nextVelocity, hitBrickId } = stepBallFrame(
        ball,
        delta,
        ARENA_SIZE,
        bricks
      );

      if (hitBrickId) {
        hits.push({ brickId: hitBrickId, damage: ball.damage });
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
    }

    useGameStore.setState({ balls: nextBalls });
  });

  return null;
}
