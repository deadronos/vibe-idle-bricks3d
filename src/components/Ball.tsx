import { useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { getRenderingOptions } from './GameScene/utils';
import type { Mesh } from 'three';
import type { Ball as BallType } from '../store/types';

interface BallProps {
  ball: BallType;
}

export function Ball({ ball }: BallProps) {
  const meshRef = useRef<Mesh>(null);
  const settings = useGameStore((state) => state.settings);
  const { computedQuality } = getRenderingOptions(settings);
  const segments = computedQuality === 'high' ? 16 : computedQuality === 'medium' ? 12 : 8;

  useEffect(() => {
    // Debug: Ball component mount/update - ball.id, ball.position
    if (!meshRef.current) return;
    meshRef.current.position.set(ball.position[0], ball.position[1], ball.position[2]);
  }, [ball.id, ball.position]);

  return (
    <mesh ref={meshRef} position={ball.position} castShadow>
      <sphereGeometry args={[ball.radius, segments, segments]} />
      <meshStandardMaterial
        color={ball.color}
        emissive={ball.color}
        emissiveIntensity={0.3}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}
