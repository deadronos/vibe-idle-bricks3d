type LightingProps = {
  enableShadows: boolean;
  shadowSize: number;
};

/**
 * Sets up the 3D lighting for the scene.
 * Includes ambient, directional (sun), and point lights for atmosphere.
 *
 * @param {LightingProps} props - Component props.
 * @returns {JSX.Element} The lighting setup.
 */
export function Lighting({ enableShadows, shadowSize }: LightingProps) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 10]}
        intensity={1}
        castShadow={enableShadows}
        shadow-mapSize={[shadowSize, shadowSize]}
      />
      <pointLight position={[-10, 5, -10]} intensity={0.5} color="#4a90e2" />
      <pointLight position={[10, -5, 10]} intensity={0.5} color="#e24a90" />
    </>
  );
}
