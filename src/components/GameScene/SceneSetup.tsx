import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import type { PropsWithChildren } from 'react';
import { GeometricBackground } from '../GeometricBackground';
import { CameraRig } from '../effects/CameraRig';
import { AdaptivePerformanceManager } from '../../engine/AdaptivePerformanceManager';

/**
 * Props for the SceneSetup component.
 */
type SceneSetupProps = PropsWithChildren<{
  /** Target pixel ratio for the renderer. */
  pixelRatio: number;
}>;

/**
 * Configures the fundamental scene elements: camera, controls, background, and pixel ratio.
 *
 * @param {SceneSetupProps} props - Component props.
 * @returns {JSX.Element} The scene setup wrapper.
 */
export function SceneSetup({ pixelRatio, children }: SceneSetupProps) {
  return (
    <>
      <AdaptivePerformanceManager targetDpr={pixelRatio} />
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
