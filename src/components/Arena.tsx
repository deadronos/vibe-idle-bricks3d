import { ARENA_SIZE } from '../store/gameStore';
import * as THREE from 'three';

export function Arena() {
  const { width, height, depth } = ARENA_SIZE;

  // Create edges for the wireframe box
  const edgesGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, depth));

  return (
    <group>
      {/* Wireframe boundary */}
      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial color="#444444" transparent opacity={0.5} />
      </lineSegments>

      {/* Floor plane for reference */}
      <mesh position={[0, -height / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.5}
          roughness={0.8}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Back wall for visual depth */}
      <mesh position={[0, 0, -depth / 2]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          color="#0f0f1a"
          metalness={0.5}
          roughness={0.9}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Glowing edge highlights */}
      <group>
        {[
          [0, -height / 2, -depth / 2],
          [0, -height / 2, depth / 2],
          [0, height / 2, -depth / 2],
          [0, height / 2, depth / 2],
        ].map((pos, i) => (
          <mesh key={i} position={pos as [number, number, number]}>
            <boxGeometry args={[width, 0.05, 0.05]} />
            <meshBasicMaterial color="#4a90e2" />
          </mesh>
        ))}
        {[
          [-width / 2, 0, -depth / 2],
          [width / 2, 0, -depth / 2],
          [-width / 2, 0, depth / 2],
          [width / 2, 0, depth / 2],
        ].map((pos, i) => (
          <mesh key={i + 4} position={pos as [number, number, number]}>
            <boxGeometry args={[0.05, height, 0.05]} />
            <meshBasicMaterial color="#4a90e2" />
          </mesh>
        ))}
        {[
          [-width / 2, -height / 2, 0],
          [width / 2, -height / 2, 0],
          [-width / 2, height / 2, 0],
          [width / 2, height / 2, 0],
        ].map((pos, i) => (
          <mesh key={i + 8} position={pos as [number, number, number]}>
            <boxGeometry args={[0.05, 0.05, depth]} />
            <meshBasicMaterial color="#4a90e2" />
          </mesh>
        ))}
      </group>
    </group>
  );
}
