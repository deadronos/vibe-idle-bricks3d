import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useGameStore } from '../store/gameStore';
import { ParticleSystem } from './effects/ParticleSystem';
import { FloatingText } from './effects/FloatingText';
import { ArenaLayer } from './GameScene/ArenaLayer';
import { BallsLayer } from './GameScene/BallsLayer';
import { BricksLayer } from './GameScene/BricksLayer';
import { Lighting } from './GameScene/Lighting';
import { SceneSetup } from './GameScene/SceneSetup';
import { getRenderingOptions } from './GameScene/utils';
import './ui/GameScene.css';

/**
 * Main 3D game scene component.
 * Sets up the React Three Fiber Canvas, scene lighting, physics, layers, and post-processing effects.
 *
 * @returns {JSX.Element} The rendered game scene.
 */
export function GameScene() {
  const enableBloom = useGameStore((state) => state.settings.enableBloom);
  const enableShadows = useGameStore((state) => state.settings.enableShadows);
  const graphicsQuality = useGameStore((state) => state.settings.graphicsQuality);
  const enableParticles = useGameStore((state) => state.settings.enableParticles);
  const bricks = useGameStore((state) => state.bricks);
  const balls = useGameStore((state) => state.balls);
  const rapierActive = useGameStore((state) => state.rapierActive ?? false);
  const regenerateBricks = useGameStore((state) => state.regenerateBricks);

  const { pixelRatio, bloomIntensity, shadowSize, particleCount, computedQuality } = getRenderingOptions({
    graphicsQuality,
    enableBloom,
    enableShadows,
    enableParticles,
  });

  return (
    <div className="game-scene-root">
      <Canvas shadows={enableShadows}>
        <SceneSetup pixelRatio={pixelRatio}>
          <Lighting enableShadows={enableShadows} shadowSize={shadowSize} />
          <ArenaLayer />
          <BallsLayer balls={balls} rapierActive={rapierActive} computedQuality={computedQuality} />
          <BricksLayer bricks={bricks} onRegenerate={regenerateBricks} />
          {enableParticles && particleCount > 0 && <ParticleSystem maxParticles={particleCount} />}
          <FloatingText />
        </SceneSetup>
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
