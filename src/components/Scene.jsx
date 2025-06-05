import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats, Environment } from '@react-three/drei';
import Systems from './Systems';
import { useRef, Suspense } from 'react';

export default function Scene() {
  const canvasRef = useRef();

  return (
    <Canvas
      ref={canvasRef}
      camera={{ position: [0, 0, 15], fov: 75 }}
      gl={{ antialias: true }}
      dpr={[1, 2]}
      shadows // Enable shadows if needed
    >
      {/* Debug Helpers */}
      <Stats />
      <axesHelper args={[5]} />
      <gridHelper args={[10, 10]} />

      {/* Lighting */}
      <color attach="background" args={['#111122']} />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {/* Environment */}
      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>

      {/* Controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={20}
      />

      {/* Your Content with Error Boundary */}
      <ErrorBoundary fallback={<FallbackComponent />}>
        <Systems />
      </ErrorBoundary>
    </Canvas>
  );
}

// Simple error boundary component
function ErrorBoundary({ children, fallback }) {
  try {
    return children;
  } catch (error) {
    console.error('Error in scene:', error);
    return fallback;
  }
}

function FallbackComponent() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="red" />
    </mesh>
  );
}