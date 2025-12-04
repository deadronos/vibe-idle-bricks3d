import type { Brick } from '../../store/types';
import { BRICK_SIZE } from '../../engine/collision';
import { useInstancedBricks } from './useInstancedBricks';
import { useGameStore } from '../../store/gameStore';
import { getRenderingOptions } from '../GameScene/utils';

interface BricksInstancedProps {
  bricks: Brick[];
}

export function BricksInstanced({ bricks }: BricksInstancedProps) {
  const { meshRef, handlePointerMove, handlePointerOut } = useInstancedBricks(bricks);
  const settings = useGameStore((state) => state.settings);
  const { computedQuality } = getRenderingOptions(settings);
  const castShadow = computedQuality !== 'low' && !!settings.enableShadows;
  const receiveShadow = computedQuality !== 'low' && !!settings.enableShadows;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, bricks.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
    >
      <boxGeometry args={[BRICK_SIZE.x, BRICK_SIZE.y, BRICK_SIZE.z]} />
      {computedQuality === 'low' ? (
        <meshBasicMaterial color="white" />
      ) : (
        <meshStandardMaterial emissiveIntensity={0.1} metalness={0.3} roughness={0.7} transparent />
      )}
    </instancedMesh>
  );
}
