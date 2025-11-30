import { useRef, useEffect } from 'react';
import type { Mesh } from 'three';
import type { Ball as BallType } from '../store/gameStore';

interface BallProps {
  ball: BallType;
}

export function Ball({ ball }: BallProps) {
  const meshRef = useRef<Mesh>(null);

  useEffect(() => {
    if (!meshRef.current) return;
    meshRef.current.position.set(ball.position[0], ball.position[1], ball.position[2]);
  }, [ball.position]);

  return (
    <mesh ref={meshRef} position={ball.position} castShadow>
      <sphereGeometry args={[ball.radius, 16, 16]} />
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
