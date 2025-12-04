type LightingProps = {
  enableShadows: boolean;
  shadowSize: number;
};

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
