import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { RapierWorld, BallState } from '../engine/rapier/rapierWorld';
import { getWorld as getRapierWorld } from '../engine/rapier/rapierRuntime';
import { useGameStore } from '../store/gameStore';
import { getRenderingOptions } from './GameScene.utils';

interface BallsInstancedProps {
  world?: RapierWorld | null;
  maxInstances?: number;
  radius?: number;
  geometrySegments?: number;
}

export function BallsInstanced({ world, maxInstances = 128, radius = 0.25, geometrySegments }: BallsInstancedProps) {
  const meshRef = useRef<THREE.InstancedMesh | null>(null);
  const idToIndex = useRef<Map<string, number>>(new Map());
  const tmpMat = useMemo(() => new THREE.Matrix4(), []);
  const settings = useGameStore((state) => state.settings);
  const { computedQuality } = getRenderingOptions(settings);
  const segments = geometrySegments ?? (computedQuality === 'high' ? 16 : computedQuality === 'medium' ? 8 : 6);

  useFrame(() => {
    // If caller didn't pass a world instance, try the shared runtime registry
    const w = world ?? getRapierWorld();
    if (!w || !meshRef.current) return;

    const states: BallState[] = w.getBallStates();

    // Assign each ball an instance index (first-seen)
    for (const s of states) {
      if (!idToIndex.current.has(s.id)) {
        if (idToIndex.current.size >= maxInstances) break;
        idToIndex.current.set(s.id, idToIndex.current.size);
      }
    }

    // Clear absent ids
    const present = new Set(states.map((s) => s.id));
    for (const id of Array.from(idToIndex.current.keys())) {
      if (!present.has(id)) idToIndex.current.delete(id);
    }

    // Update instance matrices
    let updated = false;
    for (const s of states) {
      const idx = idToIndex.current.get(s.id);
      if (idx === undefined) continue;

      tmpMat.identity();
      tmpMat.setPosition(new THREE.Vector3(s.position[0], s.position[1], s.position[2]));
      // simple uniform scale from radius
      tmpMat.scale(new THREE.Vector3(radius, radius, radius));

      meshRef.current.setMatrixAt(idx, tmpMat);
      updated = true;
    }

    if (updated) {
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[
        undefined as unknown as THREE.BufferGeometry,
        undefined as unknown as THREE.Material,
        maxInstances,
      ]}
        castShadow={computedQuality !== 'low'}
        >
      <sphereGeometry args={[radius, segments, segments]} />
      <meshStandardMaterial color="white" />
    </instancedMesh>
  );
}

export default BallsInstanced;
