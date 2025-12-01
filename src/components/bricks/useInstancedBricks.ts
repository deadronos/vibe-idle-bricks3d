import { useCallback, useLayoutEffect, useRef } from 'react';
import { Color, Object3D, type InstancedMesh } from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { getBrickFromInstance } from '../../engine/picking';
import type { Brick } from '../../store/types';
import { getDamageColor } from './utils';
import { getWorld as getRapierWorld } from '../../engine/rapier/rapierRuntime';

const tempObject = new Object3D();
const tempColor = new Color();

export const useInstancedBricks = (bricks: Brick[]) => {
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

  // Register bricks with rapier runtime if available so colliders exist immediately
  useLayoutEffect(() => {
    const world = getRapierWorld();
    if (!world) return;

    // Track which bricks we've registered
    const registered = new Set<string>();

    for (const b of bricks) {
      try {
        world.addBrick(b);
        registered.add(b.id);
      } catch {
        // ignore
      }
    }

    return () => {
      for (const id of registered) {
        try {
          world.removeBrick(id);
        } catch {
          // ignore
        }
      }
    };
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

  return {
    meshRef,
    handlePointerMove,
    handlePointerOut,
  };
};
