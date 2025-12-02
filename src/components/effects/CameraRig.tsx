import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { effectBus, type EffectEvent } from '../../systems/EffectEventBus';

export function CameraRig({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const shakeIntensity = useRef(0);
  const isShaking = useRef(false);

  useEffect(() => {
    const handleEffect = (event: EffectEvent) => {
      if (event.type === 'brick_destroy') {
        shakeIntensity.current = Math.min(shakeIntensity.current + 0.15, 0.4);
        isShaking.current = true;
      } else if (event.type === 'brick_hit') {
        shakeIntensity.current = Math.min(shakeIntensity.current + 0.02, 0.1);
        isShaking.current = true;
      }
    };

    return effectBus.subscribe(handleEffect);
  }, []);

  useFrame((_state, delta) => {
    if (!group.current) return;

    if (shakeIntensity.current > 0) {
      const shake = shakeIntensity.current;
      group.current.position.x = (Math.random() - 0.5) * shake;
      group.current.position.y = (Math.random() - 0.5) * shake;
      group.current.position.z = (Math.random() - 0.5) * shake;

      shakeIntensity.current = Math.max(0, shakeIntensity.current - delta * 2);
    } else if (isShaking.current) {
      group.current.position.set(0, 0, 0);
      isShaking.current = false;
    }
  });

  return <group ref={group}>{children}</group>;
}
