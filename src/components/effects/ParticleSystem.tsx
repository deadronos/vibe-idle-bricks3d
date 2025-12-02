import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { effectBus, type EffectEvent } from '../../systems/EffectEventBus';

const MAX_PARTICLES = 1000;
const PARTICLE_LIFE = 1.0; // seconds

export function ParticleSystem() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Particle state
  const particles = useRef<
    {
      position: THREE.Vector3;
      velocity: THREE.Vector3;
      color: THREE.Color;
      life: number;
      scale: number;
      active: boolean;
    }[]
  >([]);

  // Initialize pool
  useEffect(() => {
    particles.current = Array.from({ length: MAX_PARTICLES }, () => ({
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      color: new THREE.Color(),
      life: 0,
      scale: 1,
      active: false,
    }));
  }, []);

  useEffect(() => {
    const handleEffect = (event: EffectEvent) => {
      if (event.type === 'brick_destroy' || event.type === 'brick_hit') {
        const count = event.type === 'brick_destroy' ? 15 : 3;
        const speed = event.type === 'brick_destroy' ? 5 : 2;

        for (let i = 0; i < count; i++) {
          // Find inactive particle
          const particle = particles.current.find((p) => !p.active);
          if (!particle) break;

          particle.active = true;
          particle.life = PARTICLE_LIFE;
          particle.position.set(...event.position);
          particle.color.set(event.color);

          // Random velocity
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          particle.velocity
            .set(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta))
            .multiplyScalar(Math.random() * speed);

          particle.scale = Math.random() * 0.3 + 0.1;
        }
      }
    };

    return effectBus.subscribe(handleEffect);
  }, []);

  useFrame((_state, delta) => {
    if (!meshRef.current) return;

    // track active particles if needed (not currently used)
    particles.current.forEach((particle, i) => {
      if (!particle.active) {
        // Hide inactive particles
        dummy.position.set(0, -1000, 0);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
        return;
      }

      // Update physics
      particle.life -= delta;
      particle.velocity.y -= 9.8 * delta; // Gravity
      particle.position.addScaledVector(particle.velocity, delta);

      if (particle.life <= 0) {
        particle.active = false;
      } else {
        // (count intentionally not tracked)
        dummy.position.copy(particle.position);
        const scale = particle.scale * (particle.life / PARTICLE_LIFE);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
        meshRef.current!.setColorAt(i, particle.color);
      }
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PARTICLES]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial vertexColors toneMapped={false} emissiveIntensity={2} />
    </instancedMesh>
  );
}
