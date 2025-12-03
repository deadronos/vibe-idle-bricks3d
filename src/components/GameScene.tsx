import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Arena } from './Arena';
import { GeometricBackground } from './GeometricBackground';
import { useGameStore } from '../store/gameStore';
import { useEffect } from 'react';
import { Ball } from './Ball';
import BallsInstanced from './BallsInstanced';
import { BricksInstanced } from './bricks/BricksInstanced';
import { FrameManager } from '../engine/FrameManager';
import { ParticleSystem } from './effects/ParticleSystem';
import { getRenderingOptions } from './GameScene.utils';
import { FloatingText } from './effects/FloatingText';
import { CameraRig } from './effects/CameraRig';
import './ui/GameScene.css';

function GameContent() {
  const balls = useGameStore((state) => state.balls);
  const bricks = useGameStore((state) => state.bricks);
  const rapierActive = useGameStore((state) => state.rapierActive);
  const regenerateBricks = useGameStore((state) => state.regenerateBricks);
  const settings = useGameStore((state) => state.settings);

  // Regenerate bricks when all are destroyed
  useEffect(() => {
    if (bricks.length === 0) {
      const timer = setTimeout(() => {
        regenerateBricks();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [bricks.length, regenerateBricks]);

  const { shadowSize, particleCount, computedQuality } = getRenderingOptions(settings);
  // bloomIntensity is computed at the outer GameScene so we don't compute it here

  return (
    <>
      {/* Camera: start angled and slowly auto-rotate like the screenshot */}
      <CameraRig>
        <PerspectiveCamera makeDefault position={[10, 6, 10]} fov={50} />
      </CameraRig>
      <OrbitControls
        enablePan={false}
        minDistance={10}
        maxDistance={40}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2}
        enableDamping
        dampingFactor={0.08}
        autoRotate
        autoRotateSpeed={0.6}
      />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 10]}
        intensity={1}
        castShadow={settings.enableShadows}
        shadow-mapSize={[shadowSize, shadowSize]}
      />
      <pointLight position={[-10, 5, -10]} intensity={0.5} color="#4a90e2" />
      <pointLight position={[10, -5, 10]} intensity={0.5} color="#e24a90" />

      {/* Background */}
      <GeometricBackground />

      {/* Game elements */}
      <Arena />

      <FrameManager />

      {/* Balls: render instanced balls when Rapier is active to avoid per-ball React reconcilations */}
      {rapierActive ? (
        <BallsInstanced maxInstances={computedQuality === 'high' ? 256 : computedQuality === 'medium' ? 128 : 64} />
      ) : (
        balls.map((ball) => <Ball key={ball.id} ball={ball} />)
      )}

      {/* Bricks */}
      <BricksInstanced bricks={bricks} />

      {/* Effects */}
      {settings.enableParticles && particleCount > 0 && (
        <ParticleSystem maxParticles={particleCount} />
      )}
      <FloatingText />
    </>
  );
}

// getRenderingOptions is a pure helper exported from GameScene.utils

function SetPixelRatio({ target }: { target: number }) {
  const { gl } = useThree();
  useEffect(() => {
    try {
      if (!gl) return;
      gl.setPixelRatio(target);
    } catch {
      // best-effort; ignore if gl is not ready
    }
  }, [gl, target]);

  return null;
}

export function GameScene() {
  const enableBloom = useGameStore((state) => state.settings.enableBloom);
  const enableShadows = useGameStore((state) => state.settings.enableShadows);
  const graphicsQuality = useGameStore((state) => state.settings.graphicsQuality);
  const enableParticles = useGameStore((state) => state.settings.enableParticles);

  const { pixelRatio, bloomIntensity } = getRenderingOptions({
    graphicsQuality,
    enableBloom,
    enableShadows,
    enableParticles,
  });

  return (
    <div className="game-scene-root">
      <Canvas shadows={enableShadows}>
        <SetPixelRatio target={pixelRatio} />
        <GameContent />
        {enableBloom && (
          <EffectComposer>
            <Bloom
              intensity={bloomIntensity}
              luminanceThreshold={0.15}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
