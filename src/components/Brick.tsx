import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import type { Brick as BrickType } from '../store/types';

interface BrickProps {
  brick: BrickType;
}

export function Brick({ brick }: BrickProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Calculate damage color based on remaining health
  const healthRatio = brick.health / brick.maxHealth;
  const damageColor =
    healthRatio > 0.5 ? brick.color : `hsl(${Math.floor(healthRatio * 60)}, 80%, 50%)`;

  // Subtle animation when damaged
  useFrame(() => {
    if (meshRef.current && healthRatio < 1) {
      const shake = Math.sin(Date.now() * 0.01) * (1 - healthRatio) * 0.02;
      meshRef.current.rotation.z = shake;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={brick.position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1.5, 0.8, 1]} />
      <meshStandardMaterial
        color={hovered ? '#FFFFFF' : damageColor}
        emissive={brick.color}
        emissiveIntensity={0.1}
        metalness={0.3}
        roughness={0.7}
        transparent
        opacity={0.7 + healthRatio * 0.3}
      />
    </mesh>
  );
}
