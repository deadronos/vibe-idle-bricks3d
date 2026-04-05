import { useCallback, useLayoutEffect, useRef, useEffect } from 'react';
import { Color, Object3D, type InstancedMesh } from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { getBrickFromInstance } from '../../engine/picking';
import type { Brick } from '../../store/types';
import { getDamageColor } from './utils';
import { getWorld as getRapierWorld } from '../../engine/rapier/rapierRuntime';

const tempObject = new Object3D();
const tempColor = new Color();

/**
 * Custom hook for managing instanced brick meshes.
 * Handles instanced positioning, color updates (damage/hover), and picking interactions.
 * Also synchronizes bricks with the physics world (Rapier).
 *
 * @param {Brick[]} bricks - List of brick entities.
 * @returns {Object} { meshRef, handlePointerMove, handlePointerOut }
 */
export const useInstancedBricks = (bricks: Brick[]) => {
  const meshRef = useRef<InstancedMesh>(null);
  const hoveredIndexRef = useRef<number | null>(null);
  const hoveredBrickIdRef = useRef<string | null>(null);

  // Keep track of IDs we have synced to Rapier to avoid unnecessary recreation
  const syncedBrickIds = useRef<Set<string>>(new Set());
  // Maintain a stable id -> index mapping to avoid depending on bricks array in callbacks
  const idToIndexRef = useRef<Map<string, number>>(new Map());

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
      // Use the stable idToIndex map for O(1) lookup instead of O(n) findIndex
      targetIndex = idToIndexRef.current.get(hoveredId) ?? -1;
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

    // Update the id -> index map for stable O(1) lookups
    const idToIndex = idToIndexRef.current;
    idToIndex.clear();
    bricks.forEach((brick, index) => {
      idToIndex.set(brick.id, index);
    });

    // Direct update of matrices and colors
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

  // Optimized Rapier synchronization: Only add/remove modified bricks
  // Avoids allocating new Set by using previousIdSet directly
  useLayoutEffect(() => {
    const world = getRapierWorld();
    if (!world) return;

    const previousIdSet = syncedBrickIds.current;

    // Remove bricks that are no longer present - iterate over previous set
    for (const id of previousIdSet) {
      // Check if this ID still exists in current bricks
      const stillExists = bricks.some((b) => b.id === id);
      if (!stillExists) {
        try {
          world.removeBrick(id);
          previousIdSet.delete(id);
        } catch {
          // ignore
        }
      }
    }

    // Add or update bricks - only add if not already tracked
    // Note: addBrick in body-management is safe to call for existing bricks (it updates transforms)
    for (const b of bricks) {
      if (!previousIdSet.has(b.id)) {
        try {
          world.addBrick(b);
          previousIdSet.add(b.id);
        } catch {
          // ignore
        }
      }
    }
  }, [bricks]);

  // Cleanup effect: Remove all physics bodies when the component unmounts
  useEffect(() => {
    const ids = syncedBrickIds.current;
    return () => {
      const world = getRapierWorld();
      if (!world) return;

      for (const id of ids) {
        try {
          world.removeBrick(id);
        } catch {
          // ignore
        }
      }
      ids.clear();
    };
  }, []);

  useLayoutEffect(() => {
    const hoveredId = hoveredBrickIdRef.current;
    if (!hoveredId) return;

    // Use stable idToIndex map for O(1) lookup instead of O(n) findIndex
    const nextIndex = idToIndexRef.current.get(hoveredId) ?? -1;
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

      // getBrickFromInstance uses direct array indexing (instanceId is the index)
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
    [applyInstanceColor, clearHoveredInstance] // bricks removed - getBrickFromInstance uses direct indexing
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
