import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Arena } from './Arena';
import { GeometricBackground } from './GeometricBackground';
import { useGameStore } from '../store/gameStore';
import { useEffect } from 'react';
import { Ball } from './Ball';
import { BricksInstanced } from './bricks/BricksInstanced';
import { FrameManager } from '../engine/FrameManager';

function GameContent() {
  const balls = useGameStore((state) => state.balls);
  const bricks = useGameStore((state) => state.bricks);
  const regenerateBricks = useGameStore((state) => state.regenerateBricks);

  // Regenerate bricks when all are destroyed
  useEffect(() => {
    if (bricks.length === 0) {
      const timer = setTimeout(() => {
        regenerateBricks();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [bricks.length, regenerateBricks]);

  return (
    <>
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 0, 20]} fov={50} />
      <OrbitControls
        enablePan={false}
        minDistance={10}
        maxDistance={40}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2}
      />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-10, 5, -10]} intensity={0.5} color="#4a90e2" />
      <pointLight position={[10, -5, 10]} intensity={0.5} color="#e24a90" />

      {/* Background */}
      <GeometricBackground />

      {/* Game elements */}
      <Arena />

      <FrameManager />

      {/* Balls */}
      {balls.map((ball) => (
        <Ball key={ball.id} ball={ball} />
      ))}

      {/* Bricks */}
      <BricksInstanced bricks={bricks} />
    </>
  );
}

export function GameScene() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      <Canvas shadows>
        <GameContent />
        <EffectComposer>
          <Bloom
            intensity={0.5}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
