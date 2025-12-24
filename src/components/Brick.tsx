import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import type { Brick as BrickType } from '../store/types';

/**
 * Props for the Brick component.
 */
interface BrickProps {
  /** The brick entity data. */
  brick: BrickType;
}

/**
 * Helper component that handles brick animations.
 * Only rendered when animations are actually needed to save performance.
 */
function BrickEffects({
  type,
  healthRatio,
  meshRef,
}: {
  type: string;
  healthRatio: number;
  meshRef: React.RefObject<Mesh | null>;
}) {
  useFrame(({ clock }) => {
    if (meshRef.current) {
      if (type === 'explosive') {
        const t = clock.getElapsedTime();
        const pulse = 1 + Math.sin(t * 10) * 0.05;
        meshRef.current.scale.set(pulse, pulse, pulse);
      }

      if (healthRatio < 1) {
        const shake = Math.sin(Date.now() * 0.01) * (1 - healthRatio) * 0.02;
        meshRef.current.rotation.z = shake;
      }
    }
  });
  return null;
}

/**
 * Renders a single brick in the scene.
 * Used when instanced rendering is disabled or for specific single bricks.
 * Features hover effects and damage visualization.
 *
 * @param {BrickProps} props - Component props.
 * @returns {JSX.Element} The brick mesh.
 */
export function Brick({ brick }: BrickProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Calculate damage color based on remaining health
  const healthRatio = brick.health / brick.maxHealth;
  const damageColor =
    healthRatio > 0.5 ? brick.color : `hsl(${Math.floor(healthRatio * 60)}, 80%, 50%)`;

  const shouldAnimate = brick.type === 'explosive' || healthRatio < 1;

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
        emissiveIntensity={brick.type === 'explosive' ? 0.8 : 0.1}
        metalness={0.3}
        roughness={0.7}
        transparent
        opacity={0.7 + healthRatio * 0.3}
      />
      {shouldAnimate && (
        <BrickEffects type={brick.type} healthRatio={healthRatio} meshRef={meshRef} />
      )}
    </mesh>
  );
}
