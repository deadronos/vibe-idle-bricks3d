import type { Brick } from '../../store/gameStore';
import { BRICK_SIZE } from '../../engine/collision';
import { useInstancedBricks } from './useInstancedBricks';

interface BricksInstancedProps {
  bricks: Brick[];
}

export function BricksInstanced({ bricks }: BricksInstancedProps) {
  const { meshRef, handlePointerMove, handlePointerOut } = useInstancedBricks(bricks);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, bricks.length]}
      castShadow
      receiveShadow
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
    >
      <boxGeometry args={[BRICK_SIZE.x, BRICK_SIZE.y, BRICK_SIZE.z]} />
      <meshStandardMaterial emissiveIntensity={0.1} metalness={0.3} roughness={0.7} transparent />
    </instancedMesh>
  );
}
