import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial } from '@react-three/drei';
import { ARENA_SIZE } from '../store/constants';

// Primary neon colors matching the reference image
const NEON_CYAN = '#00ffff';
const NEON_MAGENTA = '#ff00ff';
const NEON_PINK = '#ff0080';
const NEON_BLUE = '#0066ff';

// Dark metallic colors for solid boxes
const DARK_COLORS = [
  '#1a1a2e',
  '#16213e',
  '#0f0f23',
  '#1e1e3f',
  '#252550',
  '#2a2a4a',
  '#1f1f35',
  '#151528',
];

// Linear Congruential Generator (LCG) for consistent procedural generation
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

interface BuildingBlock {
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
  hasNeonEdge: boolean;
  neonColor: string;
}

// Generate dense building-like structures on the sides
function generateBuildingWall(side: 'left' | 'right', seed: number): BuildingBlock[] {
  const random = seededRandom(seed);
  const blocks: BuildingBlock[] = [];
  const { width, depth } = ARENA_SIZE;

  const baseX = side === 'left' ? -width - 8 : width + 8;
  const xDirection = side === 'left' ? -1 : 1;

  // Create multiple layers of depth
  for (let layer = 0; layer < 8; layer++) {
    const layerX = baseX + xDirection * layer * 5;

    // Create stacked columns
    for (let col = 0; col < 16; col++) {
      const colZ = (col - 8) * 6 - depth / 2;

      // Stack boxes vertically with varying heights
      let currentY = -15;
      const numBoxes = 4 + Math.floor(random() * 6);

      for (let box = 0; box < numBoxes; box++) {
        const boxHeight = 3 + random() * 10;
        const boxWidth = 2 + random() * 4;
        const boxDepth = 2 + random() * 4;

        const hasNeonEdge = random() < 0.2; // Increased neon chance
        const neonColors = [NEON_CYAN, NEON_MAGENTA, NEON_PINK, NEON_BLUE];

        blocks.push({
          position: [
            layerX + (random() - 0.5) * 3,
            currentY + boxHeight / 2,
            colZ + (random() - 0.5) * 3,
          ],
          scale: [boxWidth, boxHeight, boxDepth],
          color: DARK_COLORS[Math.floor(random() * DARK_COLORS.length)],
          hasNeonEdge,
          neonColor: neonColors[Math.floor(random() * neonColors.length)],
        });

        currentY += boxHeight + random() * 0.5;
      }
    }
  }

  return blocks;
}

// Generate scattered floating boxes throughout the scene
function generateFloatingBoxes(count: number, seed: number): BuildingBlock[] {
  const random = seededRandom(seed);
  const blocks: BuildingBlock[] = [];
  const { width, height, depth } = ARENA_SIZE;

  for (let i = 0; i < count; i++) {
    // Position in a wide area around and behind the arena
    const x = (random() - 0.5) * width * 10;
    const y = (random() - 0.5) * height * 6;
    const z = -depth - random() * 80;

    const hasNeonEdge = random() < 0.4;
    const neonColors = [NEON_CYAN, NEON_MAGENTA, NEON_PINK, NEON_BLUE];

    blocks.push({
      position: [x, y, z],
      scale: [1 + random() * 5, 1 + random() * 8, 1 + random() * 4],
      color: DARK_COLORS[Math.floor(random() * DARK_COLORS.length)],
      hasNeonEdge,
      neonColor: neonColors[Math.floor(random() * neonColors.length)],
    });
  }

  return blocks;
}

// Single building block with optional neon edges
function BuildingBlockMesh({ block }: { block: BuildingBlock }) {
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  return (
    <group position={block.position} scale={block.scale}>
      {/* Solid dark box */}
      <mesh geometry={geometry}>
        <meshStandardMaterial color={block.color} metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Neon edge highlight */}
      {block.hasNeonEdge && (
        <lineSegments geometry={edgesGeometry} scale={1.001}>
          <lineBasicMaterial color={block.neonColor} toneMapped={false} />
        </lineSegments>
      )}
    </group>
  );
}

// Central neon cube frame - the main focal point
function CentralNeonFrame() {
  const frameRef = useRef<THREE.Group>(null);
  const { width, height, depth } = ARENA_SIZE;

  // Make it larger than the arena to create the iconic neon frame
  const frameScale = 2.5;
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
      const pulse = Math.sin(state.clock.elapsedTime * 1.0) * 0.03 + 1;
      frameRef.current.scale.setScalar(pulse);
      frameRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
    }
  });

  return (
    <group ref={frameRef} position={[0, 0, -depth * 0.5]}>
      {/* Outer cyan frame */}
      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial color={NEON_CYAN} toneMapped={false} linewidth={2} />
      </lineSegments>
      {/* Inner magenta/pink frame for gradient effect */}
      <lineSegments geometry={edgesGeometry} scale={0.96}>
        <lineBasicMaterial color={NEON_MAGENTA} transparent opacity={0.6} toneMapped={false} />
      </lineSegments>
      {/* Innermost pink layer */}
      <lineSegments geometry={edgesGeometry} scale={0.92}>
        <lineBasicMaterial color={NEON_PINK} transparent opacity={0.3} toneMapped={false} />
      </lineSegments>
      {/* Glowing fill for the frame */}
      <mesh scale={[frameWidth * 0.99, frameHeight * 0.99, frameDepth * 0.99]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color={NEON_CYAN}
          transparent
          opacity={0.02}
          side={THREE.BackSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// Reflective floor with neon color tinting
function ReflectiveFloor() {
  const { width, depth } = ARENA_SIZE;
  const floorSize = Math.max(width, depth) * 20;

  return (
    <group position={[0, -15, -depth]}>
      {/* Main reflective floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[floorSize, floorSize]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={80}
          roughness={0.1} // Very smooth, wet look
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#101010"
          metalness={0.9}
          mirror={1} // High reflectivity
        />
      </mesh>

      {/* Grid lines on top of reflection */}
      <gridHelper args={[floorSize, 100, '#333333', '#111111']} position={[0, 0.1, 0]} />
    </group>
  );
}

// Atmospheric neon lights
function NeonLighting() {
  const { width, height, depth } = ARENA_SIZE;

  return (
    <group>
      {/* Strong cyan light from left */}
      <pointLight
        position={[-width * 4, height * 2, -depth]}
        color={NEON_CYAN}
        intensity={4}
        distance={120}
        decay={2}
      />
      <pointLight
        position={[-width * 3, -height, -depth * 2]}
        color={NEON_BLUE}
        intensity={3}
        distance={100}
        decay={2}
      />

      {/* Strong magenta/pink light from right */}
      <pointLight
        position={[width * 4, height * 2, -depth]}
        color={NEON_MAGENTA}
        intensity={4}
        distance={120}
        decay={2}
      />
      <pointLight
        position={[width * 3, -height, -depth * 2]}
        color={NEON_PINK}
        intensity={3}
        distance={100}
        decay={2}
      />

      {/* Center back light - the "source" */}
      <pointLight
        position={[0, 0, -depth * 4]}
        color="#ffffff"
        intensity={2}
        distance={150}
        decay={2}
      />

      {/* Fill lights for the floor */}
      <rectAreaLight
        width={width * 4}
        height={height * 4}
        color={NEON_CYAN}
        intensity={5}
        position={[-width * 2, 0, -depth]}
        lookAt={() => new THREE.Vector3(0, 0, 0)}
      />
      <rectAreaLight
        width={width * 4}
        height={height * 4}
        color={NEON_MAGENTA}
        intensity={5}
        position={[width * 2, 0, -depth]}
        lookAt={() => new THREE.Vector3(0, 0, 0)}
      />
    </group>
  );
}

// Floating neon wireframe boxes
function FloatingNeonBoxes() {
  const { depth } = ARENA_SIZE;

  const boxes = useMemo(() => {
    const random = seededRandom(555);
    const items: {
      position: [number, number, number];
      scale: [number, number, number];
      rotation: [number, number, number];
      color: string;
    }[] = [];

    const colors = [NEON_CYAN, NEON_MAGENTA, NEON_PINK, NEON_BLUE];

    for (let i = 0; i < 40; i++) {
      items.push({
        position: [(random() - 0.5) * 80, (random() - 0.5) * 40, -depth - random() * 60],
        scale: [2 + random() * 4, 2 + random() * 5, 2 + random() * 3],
        rotation: [random() * Math.PI, random() * Math.PI, random() * Math.PI * 0.3],
        color: colors[Math.floor(random() * colors.length)],
      });
    }

    return items;
  }, [depth]);

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  return (
    <group>
      {boxes.map((box, i) => (
        <group
          key={`neon-box-${i}`}
          position={box.position}
          rotation={box.rotation}
          scale={box.scale}
        >
          <lineSegments geometry={edgesGeometry}>
            <lineBasicMaterial color={box.color} toneMapped={false} />
          </lineSegments>
          {/* Inner glow */}
          <mesh geometry={geometry}>
            <meshBasicMaterial color={box.color} transparent opacity={0.05} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function GeometricBackground() {
  // Generate building walls on both sides
  const leftWall = useMemo(() => generateBuildingWall('left', 123), []);
  const rightWall = useMemo(() => generateBuildingWall('right', 456), []);
  const floatingBoxes = useMemo(() => generateFloatingBoxes(100, 789), []);

  return (
    <group>
      {/* Dark atmospheric fog - adjusted for depth */}
      <fog attach="fog" args={['#020205', 10, 150]} />

      {/* Reflective floor with neon tints */}
      <ReflectiveFloor />

      {/* Central neon cube frame - the main visual element */}
      <CentralNeonFrame />

      {/* Dense building walls on left side */}
      {leftWall.map((block, i) => (
        <BuildingBlockMesh key={`left-${i}`} block={block} />
      ))}

      {/* Dense building walls on right side */}
      {rightWall.map((block, i) => (
        <BuildingBlockMesh key={`right-${i}`} block={block} />
      ))}

      {/* Floating boxes in the background */}
      {floatingBoxes.map((block, i) => (
        <BuildingBlockMesh key={`float-${i}`} block={block} />
      ))}

      {/* Floating neon wireframe boxes */}
      <FloatingNeonBoxes />

      {/* Atmospheric neon lighting */}
      <NeonLighting />
    </group>
  );
}
