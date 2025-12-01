import { useFrame } from '@react-three/fiber';
import { useGameStore, ARENA_SIZE } from '../store/gameStore';
import { stepBallFrame } from './collision';

export function FrameManager() {
  const isPaused = useGameStore((state) => state.isPaused);
  const damageBrick = useGameStore((state) => state.damageBrick);
  const tryProcessBallSpawnQueue = useGameStore((state) => state.tryProcessBallSpawnQueue);
  const resetCombo = useGameStore((state) => state.resetCombo);

  useFrame((_, delta) => {
    // Process ball spawn queue (for gradual spawning on reload)
    tryProcessBallSpawnQueue();

    // Check combo timeout (3 seconds)
    const { lastHitTime, comboCount } = useGameStore.getState();
    if (comboCount > 0 && Date.now() - lastHitTime > 3000) {
      resetCombo();
    }

    if (isPaused) return;

    const { balls, bricks } = useGameStore.getState();
    if (!balls.length) return;

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
      // Apply damage to all hit bricks
      for (const hit of hits) {
        damageBrick(hit.brickId, hit.damage);
      }

      // Combo only increments when MULTIPLE bricks are hit in the same frame
      // (e.g., explosive ball hits multiple bricks)
      if (hits.length >= 2) {
        const state = useGameStore.getState();
        const newComboCount = state.comboCount + 1;
        const newComboMultiplier = Math.min(1 + newComboCount * 0.05, 3); // Max 3x
        useGameStore.setState({
          comboCount: newComboCount,
          comboMultiplier: newComboMultiplier,
          lastHitTime: Date.now(),
        });
      }
    }

    useGameStore.setState({ balls: nextBalls });
  });

  return null;
}
