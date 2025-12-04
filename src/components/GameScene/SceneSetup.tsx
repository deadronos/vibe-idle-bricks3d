import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { GeometricBackground } from '../GeometricBackground';
import { CameraRig } from '../effects/CameraRig';

type SceneSetupProps = PropsWithChildren<{
  pixelRatio: number;
}>;

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

export function SceneSetup({ pixelRatio, children }: SceneSetupProps) {
  return (
    <>
      <SetPixelRatio target={pixelRatio} />
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
      <GeometricBackground />
      {children}
    </>
  );
}
