import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
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
function generateBuildingWall(
  side: 'left' | 'right',
  seed: number
): BuildingBlock[] {
  const random = seededRandom(seed);
  const blocks: BuildingBlock[] = [];
  const { width, depth } = ARENA_SIZE;
  
  const baseX = side === 'left' ? -width - 8 : width + 8;
  const xDirection = side === 'left' ? -1 : 1;
  
  // Create multiple layers of depth
  for (let layer = 0; layer < 6; layer++) {
    const layerX = baseX + xDirection * layer * 4;
    
    // Create stacked columns
    for (let col = 0; col < 12; col++) {
      const colZ = (col - 6) * 5 - depth / 2;
      
      // Stack boxes vertically with varying heights
      let currentY = -15;
      const numBoxes = 3 + Math.floor(random() * 5);
      
      for (let box = 0; box < numBoxes; box++) {
        const boxHeight = 2 + random() * 8;
        const boxWidth = 1.5 + random() * 3;
        const boxDepth = 1.5 + random() * 3;
        
        const hasNeonEdge = random() < 0.15;
        const neonColors = [NEON_CYAN, NEON_MAGENTA, NEON_PINK, NEON_BLUE];
        
        blocks.push({
          position: [
            layerX + (random() - 0.5) * 2,
            currentY + boxHeight / 2,
            colZ + (random() - 0.5) * 2,
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
    const x = (random() - 0.5) * width * 8;
    const y = (random() - 0.5) * height * 4;
    const z = -depth - random() * 60;
    
    const hasNeonEdge = random() < 0.3;
    const neonColors = [NEON_CYAN, NEON_MAGENTA, NEON_PINK, NEON_BLUE];
    
    blocks.push({
      position: [x, y, z],
      scale: [
        1 + random() * 4,
        1 + random() * 6,
        1 + random() * 3,
      ],
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
        <meshStandardMaterial
          color={block.color}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>
      {/* Neon edge highlight */}
      {block.hasNeonEdge && (
        <lineSegments geometry={edgesGeometry} scale={1.001}>
          <lineBasicMaterial color={block.neonColor} />
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
  const frameScale = 2.2;
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
      const pulse = Math.sin(state.clock.elapsedTime * 1.5) * 0.02 + 1;
      frameRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={frameRef} position={[0, 0, -depth * 0.3]}>
      {/* Outer cyan frame */}
      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial color={NEON_CYAN} />
      </lineSegments>
      {/* Inner magenta/pink frame for gradient effect */}
      <lineSegments geometry={edgesGeometry} scale={0.98}>
        <lineBasicMaterial color={NEON_MAGENTA} transparent opacity={0.7} />
      </lineSegments>
      {/* Innermost pink layer */}
      <lineSegments geometry={edgesGeometry} scale={0.96}>
        <lineBasicMaterial color={NEON_PINK} transparent opacity={0.4} />
      </lineSegments>
      {/* Glowing fill for the frame */}
      <mesh scale={[frameWidth * 0.999, frameHeight * 0.999, frameDepth * 0.999]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color={NEON_CYAN}
          transparent
          opacity={0.03}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

// Reflective floor with neon color tinting
function ReflectiveFloor() {
  const { width, height, depth } = ARENA_SIZE;
  const floorSize = Math.max(width, depth) * 15;
  
  return (
    <group position={[0, -height * 1.5, -depth]}>
      {/* Main reflective floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[floorSize, floorSize]} />
        <meshStandardMaterial
          color="#0a0a15"
          metalness={0.95}
          roughness={0.05}
        />
      </mesh>
      
      {/* Cyan glow on left side of floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-floorSize * 0.3, 0.01, 0]}>
        <planeGeometry args={[floorSize * 0.4, floorSize]} />
        <meshBasicMaterial
          color={NEON_CYAN}
          transparent
          opacity={0.08}
        />
      </mesh>
      
      {/* Magenta glow on right side of floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[floorSize * 0.3, 0.01, 0]}>
        <planeGeometry args={[floorSize * 0.4, floorSize]} />
        <meshBasicMaterial
          color={NEON_MAGENTA}
          transparent
          opacity={0.08}
        />
      </mesh>
      
      {/* Grid lines */}
      <gridHelper
        args={[floorSize, 80, '#1a1a3e', '#0d0d2e']}
        position={[0, 0.02, 0]}
      />
    </group>
  );
}

// Scattered floor boxes and debris
function FloorDebris() {
  const { width, height, depth } = ARENA_SIZE;
  
  const debris = useMemo(() => {
    const random = seededRandom(789);
    const items: { position: [number, number, number]; scale: [number, number, number]; color: string }[] = [];
    
    for (let i = 0; i < 50; i++) {
      const x = (random() - 0.5) * width * 10;
      const z = -depth - random() * 40;
      
      items.push({
        position: [x, -height * 1.5 + 0.5, z],
        scale: [0.5 + random() * 2, 0.2 + random() * 0.5, 0.5 + random() * 2],
        color: DARK_COLORS[Math.floor(random() * DARK_COLORS.length)],
      });
    }
    
    return items;
  }, [width, height, depth]);
  
  return (
    <group>
      {debris.map((item, i) => (
        <mesh key={`debris-${i}`} position={item.position} scale={item.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={item.color} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
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
        position={[-width * 3, height, -depth]}
        color={NEON_CYAN}
        intensity={2}
        distance={80}
      />
      <pointLight
        position={[-width * 2, -height, -depth * 2]}
        color={NEON_CYAN}
        intensity={1.5}
        distance={60}
      />
      
      {/* Strong magenta/pink light from right */}
      <pointLight
        position={[width * 3, height, -depth]}
        color={NEON_MAGENTA}
        intensity={2}
        distance={80}
      />
      <pointLight
        position={[width * 2, -height, -depth * 2]}
        color={NEON_PINK}
        intensity={1.5}
        distance={60}
      />
      
      {/* Center back light */}
      <pointLight
        position={[0, height * 2, -depth * 3]}
        color="#6644aa"
        intensity={1}
        distance={100}
      />
      
      {/* Floor reflection lights */}
      <pointLight
        position={[-width * 2, -height * 2, -depth]}
        color={NEON_CYAN}
        intensity={0.8}
        distance={40}
      />
      <pointLight
        position={[width * 2, -height * 2, -depth]}
        color={NEON_PINK}
        intensity={0.8}
        distance={40}
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
    
    for (let i = 0; i < 25; i++) {
      items.push({
        position: [
          (random() - 0.5) * 60,
          (random() - 0.5) * 30,
          -depth - random() * 50,
        ],
        scale: [
          2 + random() * 4,
          2 + random() * 5,
          2 + random() * 3,
        ],
        rotation: [
          random() * Math.PI,
          random() * Math.PI,
          random() * Math.PI * 0.3,
        ],
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
        <group key={`neon-box-${i}`} position={box.position} rotation={box.rotation} scale={box.scale}>
          <lineSegments geometry={edgesGeometry}>
            <lineBasicMaterial color={box.color} />
          </lineSegments>
          {/* Inner glow */}
          <mesh geometry={geometry}>
            <meshBasicMaterial color={box.color} transparent opacity={0.05} />
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
  const floatingBoxes = useMemo(() => generateFloatingBoxes(80, 789), []);

  return (
    <group>
      {/* Dark atmospheric fog */}
      <fog attach="fog" args={['#050510', 20, 120]} />
      
      {/* Reflective floor with neon tints */}
      <ReflectiveFloor />
      
      {/* Floor debris */}
      <FloorDebris />
      
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
