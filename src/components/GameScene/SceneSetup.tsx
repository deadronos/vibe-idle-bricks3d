import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { GeometricBackground } from '../GeometricBackground';
import { CameraRig } from '../effects/CameraRig';

/**
 * Props for the SceneSetup component.
 */
type SceneSetupProps = PropsWithChildren<{
  /** Target pixel ratio for the renderer. */
  pixelRatio: number;
}>;

/**
 * Helper component to imperatively set the WebGL pixel ratio.
 *
 * @param {Object} props - Component props.
 * @param {number} props.target - The target pixel ratio.
 * @returns {null}
 */
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

/**
 * Configures the fundamental scene elements: camera, controls, background, and pixel ratio.
 *
 * @param {SceneSetupProps} props - Component props.
 * @returns {JSX.Element} The scene setup wrapper.
 */
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
