import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei'
import { Ball } from './Ball'
import { Brick } from './Brick'
import { Arena } from './Arena'
import { useGameStore } from '../store/gameStore'
import { useEffect } from 'react'

function GameContent() {
  const balls = useGameStore((state) => state.balls)
  const bricks = useGameStore((state) => state.bricks)
  const regenerateBricks = useGameStore((state) => state.regenerateBricks)
  
  // Regenerate bricks when all are destroyed
  useEffect(() => {
    if (bricks.length === 0) {
      const timer = setTimeout(() => {
        regenerateBricks()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [bricks.length, regenerateBricks])
  
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
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Game elements */}
      <Arena />
      
      {/* Balls */}
      {balls.map((ball) => (
        <Ball key={ball.id} ball={ball} />
      ))}
      
      {/* Bricks */}
      {bricks.map((brick) => (
        <Brick key={brick.id} brick={brick} />
      ))}
    </>
  )
}

export function GameScene() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      <Canvas shadows>
        <GameContent />
      </Canvas>
    </div>
  )
}
