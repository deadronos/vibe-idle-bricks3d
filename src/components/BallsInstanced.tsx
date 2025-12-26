import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { RapierWorld, BallState } from '../engine/rapier/rapierWorld';
import { getWorld as getRapierWorld } from '../engine/rapier/rapierRuntime';
import { useGameStore } from '../store/gameStore';
import { getRenderingOptions } from './GameScene/utils';

/**
 * Props for the BallsInstanced component.
 */
interface BallsInstancedProps {
  /** Optional physics world instance. Defaults to global runtime. */
  world?: RapierWorld | null;
  /** Maximum number of balls to support. Defaults to 128. */
  maxInstances?: number;
  /** Radius of the balls. Defaults to 0.25. */
  radius?: number;
  /** Number of segments for the sphere geometry. Defaults based on quality settings. */
  geometrySegments?: number;
}

/**
 * Renders multiple balls using instanced rendering.
 * Efficiently updates positions based on physics state.
 *
 * @param {BallsInstancedProps} props - Component props.
 * @returns {JSX.Element} The instanced mesh.
 */
export function BallsInstanced({ world, maxInstances = 128, radius = 0.25, geometrySegments }: BallsInstancedProps) {
  const meshRef = useRef<THREE.InstancedMesh | null>(null);
  // Optimization: Removed idToIndex Map and per-frame Set allocation.
  // Since all balls are visually identical, we can assign instances 0..N directly.
  const tmpMat = useMemo(() => new THREE.Matrix4(), []);
  const tmpScale = useMemo(() => new THREE.Vector3(radius, radius, radius), [radius]);
  const settings = useGameStore((state) => state.settings);
  const { computedQuality } = getRenderingOptions(settings);
  const segments = geometrySegments ?? (computedQuality === 'high' ? 16 : computedQuality === 'medium' ? 8 : 6);

  useFrame(() => {
    // If caller didn't pass a world instance, try the shared runtime registry
    const w = world ?? getRapierWorld();
    if (!w || !meshRef.current) return;

    const states: BallState[] = w.getBallStates();

    // Clamp to maxInstances
    const count = Math.min(states.length, maxInstances);

    // Update the instance count if it changed
    if (meshRef.current.count !== count) {
      meshRef.current.count = count;
    }

    // Direct assignment loop - O(count) with no allocations
    // Update scale vector in case radius changed (though usually constant)
    if (tmpScale.x !== radius) tmpScale.set(radius, radius, radius);

    for (let i = 0; i < count; i++) {
      const s = states[i];
      tmpMat.identity();
      tmpMat.setPosition(s.position[0], s.position[1], s.position[2]);
      // simple uniform scale from radius
      tmpMat.scale(tmpScale);

      meshRef.current.setMatrixAt(i, tmpMat);
    }

    if (count > 0) {
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
