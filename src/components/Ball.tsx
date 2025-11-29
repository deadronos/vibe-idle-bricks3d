import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { useGameStore, ARENA_SIZE, type Ball as BallType } from '../store/gameStore';
import type { Vector3Tuple } from 'three';

interface BallProps {
  ball: BallType;
}

export function Ball({ ball }: BallProps) {
  const meshRef = useRef<Mesh>(null);
  const isPaused = useGameStore((state) => state.isPaused);
  const bricks = useGameStore((state) => state.bricks);
  const updateBallPosition = useGameStore((state) => state.updateBallPosition);
  const updateBallVelocity = useGameStore((state) => state.updateBallVelocity);
  const damageBrick = useGameStore((state) => state.damageBrick);

  // Use refs for velocity to avoid re-renders during frame updates
  const velocityRef = useRef<Vector3Tuple>([...ball.velocity]);

  // Sync velocityRef when ball.velocity changes from store (e.g., speed upgrades)
  useEffect(() => {
    velocityRef.current = [...ball.velocity];
  }, [ball.velocity]);

  useFrame((_, delta) => {
    if (isPaused || !meshRef.current) return;

    const mesh = meshRef.current;
    const velocity = velocityRef.current;
    const radius = ball.radius;

    // Limit delta to prevent tunneling on lag spikes
    const clampedDelta = Math.min(delta, 0.05);

    // Calculate new position
    let newX = mesh.position.x + velocity[0] * clampedDelta * 60;
    let newY = mesh.position.y + velocity[1] * clampedDelta * 60;
    let newZ = mesh.position.z + velocity[2] * clampedDelta * 60;

    // Wall collisions
    const halfWidth = ARENA_SIZE.width / 2 - radius;
    const halfHeight = ARENA_SIZE.height / 2 - radius;
    const halfDepth = ARENA_SIZE.depth / 2 - radius;

    if (newX < -halfWidth || newX > halfWidth) {
      velocity[0] *= -1;
      newX = Math.max(-halfWidth, Math.min(halfWidth, newX));
    }

    if (newY < -halfHeight || newY > halfHeight) {
      velocity[1] *= -1;
      newY = Math.max(-halfHeight, Math.min(halfHeight, newY));
    }

    if (newZ < -halfDepth || newZ > halfDepth) {
      velocity[2] *= -1;
      newZ = Math.max(-halfDepth, Math.min(halfDepth, newZ));
    }

    // Brick collisions
    for (const brick of bricks) {
      const brickSize = { x: 1.5, y: 0.8, z: 1 };
      const dx = newX - brick.position[0];
      const dy = newY - brick.position[1];
      const dz = newZ - brick.position[2];

      // AABB collision with sphere
      const closestX = Math.max(-brickSize.x / 2, Math.min(brickSize.x / 2, dx));
      const closestY = Math.max(-brickSize.y / 2, Math.min(brickSize.y / 2, dy));
      const closestZ = Math.max(-brickSize.z / 2, Math.min(brickSize.z / 2, dz));

      const distX = dx - closestX;
      const distY = dy - closestY;
      const distZ = dz - closestZ;
      const distance = Math.sqrt(distX * distX + distY * distY + distZ * distZ);

      if (distance < radius) {
        // Determine collision normal
        const absDistX = Math.abs(distX);
        const absDistY = Math.abs(distY);
        const absDistZ = Math.abs(distZ);

        if (absDistX >= absDistY && absDistX >= absDistZ) {
          velocity[0] *= -1;
        } else if (absDistY >= absDistX && absDistY >= absDistZ) {
          velocity[1] *= -1;
        } else {
          velocity[2] *= -1;
        }

        // Damage brick
        damageBrick(brick.id, ball.damage);
        break;
      }
    }

    // Update mesh position
    mesh.position.set(newX, newY, newZ);

    // Update store position periodically for other systems
    const newPosition: Vector3Tuple = [newX, newY, newZ];
    updateBallPosition(ball.id, newPosition);

    // Update velocity if it changed
    if (
      velocity[0] !== ball.velocity[0] ||
      velocity[1] !== ball.velocity[1] ||
      velocity[2] !== ball.velocity[2]
    ) {
      updateBallVelocity(ball.id, [...velocity]);
    }
  });

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
