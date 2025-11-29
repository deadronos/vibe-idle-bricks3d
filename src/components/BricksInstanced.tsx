import { useEffect, useRef, useState } from 'react';
import { Object3D, Color, type InstancedMesh } from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { Brick } from '../store/gameStore';
import { BRICK_SIZE } from '../engine/collision';
import { getBrickFromInstance } from '../engine/picking';

const tempObject = new Object3D();
const tempColor = new Color();

const getDamageColor = (brick: Brick, isHovered: boolean) => {
  if (isHovered) return '#FFFFFF';
  const healthRatio = brick.health / brick.maxHealth;
  if (healthRatio > 0.5) return brick.color;
  return `hsl(${Math.floor(healthRatio * 60)}, 80%, 50%)`;
};

interface BricksInstancedProps {
  bricks: Brick[];
}

export function BricksInstanced({ bricks }: BricksInstancedProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;

    mesh.count = bricks.length;
    bricks.forEach((brick, index) => {
      tempObject.position.set(brick.position[0], brick.position[1], brick.position[2]);
      tempObject.rotation.set(0, 0, 0);
      tempObject.updateMatrix();
      mesh.setMatrixAt(index, tempObject.matrix);

      tempColor.set(getDamageColor(brick, brick.id === hoveredId));
      mesh.setColorAt(index, tempColor);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [bricks, hoveredId]);

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    const brick = getBrickFromInstance(bricks, event.instanceId);
    if (brick) {
      setHoveredId(brick.id);
    }
  };

  const handlePointerOut = () => {
    setHoveredId(null);
  };

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
      <meshStandardMaterial
        emissiveIntensity={0.1}
        metalness={0.3}
        roughness={0.7}
        transparent
        vertexColors
      />
    </instancedMesh>
  );
}
