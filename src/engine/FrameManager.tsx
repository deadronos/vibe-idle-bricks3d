import { useFrame } from '@react-three/fiber';
import { useGameStore, ARENA_SIZE } from '../store/gameStore';
import { stepBallFrame } from './collision';

export function FrameManager() {
  const isPaused = useGameStore((state) => state.isPaused);
  const damageBrick = useGameStore((state) => state.damageBrick);

  useFrame((_, delta) => {
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
      for (const hit of hits) {
        damageBrick(hit.brickId, hit.damage);
      }
    }

    useGameStore.setState({ balls: nextBalls });
  });

  return null;
}
