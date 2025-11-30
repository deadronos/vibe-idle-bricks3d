import { useCallback, useLayoutEffect, useRef } from 'react';
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
  const hoveredIndexRef = useRef<number | null>(null);
  const hoveredBrickIdRef = useRef<string | null>(null);

  const applyInstanceColor = useCallback((index: number, brick: Brick, isHovered: boolean) => {
    if (!meshRef.current) return;
    tempColor.set(getDamageColor(brick, isHovered));
    meshRef.current.setColorAt(index, tempColor);
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, []);

  const clearHoveredInstance = useCallback(() => {
    const hoveredId = hoveredBrickIdRef.current;
    if (!hoveredId) {
      hoveredIndexRef.current = null;
      return;
    }

    let targetIndex = -1;
    if (hoveredIndexRef.current !== null) {
      const maybeBrick = bricks[hoveredIndexRef.current];
      if (maybeBrick?.id === hoveredId) {
        targetIndex = hoveredIndexRef.current;
      }
    }

    if (targetIndex === -1) {
      targetIndex = bricks.findIndex((brick) => brick.id === hoveredId);
    }

    hoveredBrickIdRef.current = null;
    hoveredIndexRef.current = null;

    if (targetIndex !== -1) {
      const brick = bricks[targetIndex];
      if (brick) {
        applyInstanceColor(targetIndex, brick, false);
      }
    }
  }, [applyInstanceColor, bricks]);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;

    mesh.count = bricks.length;
    bricks.forEach((brick, index) => {
      tempObject.position.set(brick.position[0], brick.position[1], brick.position[2]);
      tempObject.rotation.set(0, 0, 0);
      tempObject.updateMatrix();
      mesh.setMatrixAt(index, tempObject.matrix);

      tempColor.set(getDamageColor(brick, false));
      mesh.setColorAt(index, tempColor);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [bricks]);

  useLayoutEffect(() => {
    const hoveredId = hoveredBrickIdRef.current;
    if (!hoveredId) return;

    const nextIndex = bricks.findIndex((brick) => brick.id === hoveredId);
    if (nextIndex === -1) {
      hoveredBrickIdRef.current = null;
      hoveredIndexRef.current = null;
      return;
    }

    hoveredIndexRef.current = nextIndex;
    applyInstanceColor(nextIndex, bricks[nextIndex], true);
  }, [applyInstanceColor, bricks]);

  const handlePointerMove = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      const instanceId = event.instanceId;
      if (instanceId === null || instanceId === undefined) {
        clearHoveredInstance();
        return;
      }

      const brick = getBrickFromInstance(bricks, instanceId);
      if (!brick) {
        clearHoveredInstance();
        return;
      }

      if (hoveredBrickIdRef.current === brick.id) {
        return;
      }

      clearHoveredInstance();
      applyInstanceColor(instanceId, brick, true);
      hoveredIndexRef.current = instanceId;
      hoveredBrickIdRef.current = brick.id;
    },
    [applyInstanceColor, bricks, clearHoveredInstance]
  );

  const handlePointerOut = useCallback(() => {
    clearHoveredInstance();
  }, [clearHoveredInstance]);

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
      />
    </instancedMesh>
  );
}
