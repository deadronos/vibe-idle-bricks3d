import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { ARENA_SIZE } from '../store/constants';

interface GeometricShape {
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
  color: string;
  isGlowing: boolean;
  rotationSpeed: [number, number, number];
}

// Neon colors for the cyberpunk aesthetic
const NEON_COLORS = [
  '#00ffff', // Cyan
  '#ff00ff', // Magenta
  '#ff0080', // Hot pink
  '#0080ff', // Electric blue
  '#8000ff', // Purple
  '#ff4000', // Orange-red
];

const DARK_COLORS = [
  '#1a1a2e',
  '#16213e',
  '#0f0f23',
  '#1e1e3f',
  '#252550',
  '#0d0d1a',
];

// Linear Congruential Generator (LCG) for consistent procedural generation
// Using standard LCG constants for reproducible random sequences
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateShapes(count: number, radius: number, seed: number = 42): GeometricShape[] {
  const random = seededRandom(seed);
  const shapes: GeometricShape[] = [];

  for (let i = 0; i < count; i++) {
    // Position shapes in a large sphere around the arena
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const r = radius * (0.5 + random() * 0.5);

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    // Random scale for irregular boxes
    const scaleX = 0.5 + random() * 3;
    const scaleY = 0.5 + random() * 4;
    const scaleZ = 0.5 + random() * 2;

    // Random rotation
    const rotX = random() * Math.PI * 2;
    const rotY = random() * Math.PI * 2;
    const rotZ = random() * Math.PI * 2;

    // Mix of glowing and dark shapes
    const isGlowing = random() < 0.25;
    const color = isGlowing
      ? NEON_COLORS[Math.floor(random() * NEON_COLORS.length)]
      : DARK_COLORS[Math.floor(random() * DARK_COLORS.length)];

    // Slow rotation speeds
    const rotSpeedX = (random() - 0.5) * 0.002;
    const rotSpeedY = (random() - 0.5) * 0.002;
    const rotSpeedZ = (random() - 0.5) * 0.002;

    shapes.push({
      position: [x, y, z],
      scale: [scaleX, scaleY, scaleZ],
      rotation: [rotX, rotY, rotZ],
      color,
      isGlowing,
      rotationSpeed: [rotSpeedX, rotSpeedY, rotSpeedZ],
    });
  }

  return shapes;
}

function NeonEdgeBox({
  position,
  scale,
  rotation,
  color,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
  color: string;
}) {
  const edgesRef = useRef<THREE.LineSegments>(null);
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <lineSegments ref={edgesRef} geometry={edgesGeometry}>
        {/* Note: linewidth > 1 only works in some WebGL contexts; bloom effect enhances visibility */}
        <lineBasicMaterial color={color} />
      </lineSegments>
    </group>
  );
}

function BackgroundShape({ shape }: { shape: GeometricShape }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += shape.rotationSpeed[0];
      meshRef.current.rotation.y += shape.rotationSpeed[1];
      meshRef.current.rotation.z += shape.rotationSpeed[2];
    }
    if (edgesRef.current) {
      edgesRef.current.rotation.x += shape.rotationSpeed[0];
      edgesRef.current.rotation.y += shape.rotationSpeed[1];
      edgesRef.current.rotation.z += shape.rotationSpeed[2];
    }
  });

  if (shape.isGlowing) {
    // Glowing shapes - wireframe only with emissive color
    return (
      <group position={shape.position} rotation={shape.rotation} scale={shape.scale}>
        <lineSegments ref={edgesRef} geometry={edgesGeometry}>
          <lineBasicMaterial color={shape.color} linewidth={2} />
        </lineSegments>
        {/* Inner glow mesh */}
        <mesh ref={meshRef} geometry={geometry}>
          <meshBasicMaterial
            color={shape.color}
            transparent
            opacity={0.1}
          />
        </mesh>
      </group>
    );
  }

  // Dark solid shapes
  return (
    <mesh
      ref={meshRef}
      position={shape.position}
      rotation={shape.rotation}
      scale={shape.scale}
      geometry={geometry}
    >
      <meshStandardMaterial
        color={shape.color}
        metalness={0.8}
        roughness={0.3}
      />
    </mesh>
  );
}

// Central neon cube frame like in the reference image
function CentralNeonFrame() {
  const frameRef = useRef<THREE.Group>(null);
  const { width, height, depth } = ARENA_SIZE;

  // Make it slightly larger than the arena
  const frameScale = 1.8;
  const frameWidth = width * frameScale;
  const frameHeight = height * frameScale;
  const frameDepth = depth * frameScale;

  const edgesGeometry = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(frameWidth, frameHeight, frameDepth)),
    [frameWidth, frameHeight, frameDepth]
  );

  useFrame((state) => {
    if (frameRef.current) {
      // Subtle pulsing glow effect
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 0.9;
      frameRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={frameRef} position={[0, 0, -depth / 2]}>
      {/* Note: linewidth > 1 only works in some WebGL contexts; bloom effect enhances visibility */}
      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial color="#00ffff" />
      </lineSegments>
      {/* Inner glow layer */}
      <lineSegments geometry={edgesGeometry} scale={0.99}>
        <lineBasicMaterial color="#ff00ff" transparent opacity={0.5} />
      </lineSegments>
    </group>
  );
}

export function GeometricBackground() {
  const { width, height, depth } = ARENA_SIZE;

  // Generate shapes in a large area around the arena
  const backgroundRadius = Math.max(width, height, depth) * 8;
  const shapes = useMemo(() => generateShapes(150, backgroundRadius, 42), [backgroundRadius]);

  // Create floor grid for neon reflections effect
  const gridSize = backgroundRadius * 2;
  const gridDivisions = 50;

  return (
    <group>
      {/* Dark environment fog */}
      <fog attach="fog" args={['#0a0a1a', 30, 150]} />

      {/* Floor with grid - reflective surface effect */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -height * 3, 0]} receiveShadow>
        <planeGeometry args={[gridSize, gridSize]} />
        <meshStandardMaterial
          color="#0a0a1a"
          metalness={0.9}
          roughness={0.1}
          envMapIntensity={0.5}
        />
      </mesh>

      {/* Grid lines on floor */}
      <gridHelper
        args={[gridSize, gridDivisions, '#1a1a3e', '#0d0d2e']}
        position={[0, -height * 3 + 0.01, 0]}
      />

      {/* Central neon cube frame */}
      <CentralNeonFrame />

      {/* Scattered geometric shapes */}
      {shapes.map((shape, index) => (
        <BackgroundShape key={index} shape={shape} />
      ))}

      {/* Additional floating neon edge boxes in mid-distance */}
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const radius = 25 + (i % 3) * 10;
        const y = (i % 5 - 2) * 8;
        return (
          <NeonEdgeBox
            key={`edge-${i}`}
            position={[
              Math.cos(angle) * radius,
              y,
              Math.sin(angle) * radius - depth,
            ]}
            scale={[2 + (i % 3), 3 + (i % 4), 1.5 + (i % 2)]}
            rotation={[(i * 0.5) % Math.PI, (i * 0.3) % Math.PI, 0]}
            color={NEON_COLORS[i % NEON_COLORS.length]}
          />
        );
      })}

      {/* Tall structures on the sides like buildings */}
      {Array.from({ length: 30 }).map((_, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const zOffset = (i - 15) * 3;
        const heightVar = 5 + (i % 7) * 4;
        return (
          <mesh
            key={`tower-${i}`}
            position={[side * (width * 2 + 5 + (i % 4) * 2), heightVar / 2 - 5, zOffset - depth]}
          >
            <boxGeometry args={[1.5 + (i % 3), heightVar, 1.5 + (i % 2)]} />
            <meshStandardMaterial
              color={DARK_COLORS[i % DARK_COLORS.length]}
              metalness={0.7}
              roughness={0.4}
            />
          </mesh>
        );
      })}

      {/* Glowing accent lights on towers */}
      {Array.from({ length: 15 }).map((_, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const zOffset = (i - 7) * 5;
        return (
          <pointLight
            key={`light-${i}`}
            position={[side * (width * 2 + 8), 5, zOffset - depth]}
            color={NEON_COLORS[i % NEON_COLORS.length]}
            intensity={0.3}
            distance={20}
          />
        );
      })}
    </group>
  );
}
