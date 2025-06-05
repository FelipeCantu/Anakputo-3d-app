import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { useCSG } from '@react-three/csg';

const PuzzleCube = forwardRef(({ 
  size = 1, 
  position = [0, 0, 0], 
  name,
  onMeshReady,
  ...props 
}, ref) => {
  const localRef = useRef();
  const csg = useCSG();
  const [geometry, setGeometry] = useState();

  // Expose interlock points and mesh reference to parent components
  useImperativeHandle(ref, () => ({
    getInterlockPoints: () => [
      { position: new THREE.Vector3(0, size/2, 0), normal: new THREE.Vector3(0, 1, 0) },
      { position: new THREE.Vector3(0, -size/2, 0), normal: new THREE.Vector3(0, -1, 0) },
      { position: new THREE.Vector3(size/2, 0, 0), normal: new THREE.Vector3(1, 0, 0) },
      { position: new THREE.Vector3(-size/2, 0, 0), normal: new THREE.Vector3(-1, 0, 0) },
      { position: new THREE.Vector3(0, 0, size/2), normal: new THREE.Vector3(0, 0, 1) },
      { position: new THREE.Vector3(0, 0, -size/2), normal: new THREE.Vector3(0, 0, -1) }
    ],
    mesh: localRef.current
  }), [size]);

  useEffect(() => {
    if (!csg) {
      // Fallback to basic cube if CSG isn't available
      const cubeGeo = new THREE.BoxGeometry(size, size, size);
      setGeometry(cubeGeo);
      return;
    }

    try {
      // Base cube
      const cubeGeo = new THREE.BoxGeometry(size, size, size);
      const cubeMesh = new THREE.Mesh(cubeGeo);

      // Negative space shapes
      const sphereGeo = new THREE.SphereGeometry(size * 0.3, 16, 16);
      const sphereMesh = new THREE.Mesh(sphereGeo);
      sphereMesh.position.set(size * 0.5, size * 0.5, 0);

      const cylinderGeo = new THREE.CylinderGeometry(size * 0.2, size * 0.2, size, 16);
      const cylinderMesh = new THREE.Mesh(cylinderGeo);
      cylinderMesh.rotation.x = Math.PI / 2;
      cylinderMesh.position.set(-size * 0.5, 0, size * 0.5);

      // Update matrices
      cubeMesh.updateMatrix();
      sphereMesh.updateMatrix();
      cylinderMesh.updateMatrix();

      // Perform CSG operation
      const result = csg.subtract([cubeMesh, sphereMesh, cylinderMesh]);
      setGeometry(result?.geometry || cubeGeo);
    } catch (error) {
      console.error('CSG operation failed:', error);
      // Fallback to regular cube
      setGeometry(new THREE.BoxGeometry(size, size, size));
    }
  }, [size, csg]);

  useEffect(() => {
    if (geometry && localRef.current && onMeshReady) {
      onMeshReady(localRef.current);
    }
  }, [geometry, onMeshReady]);

  if (!geometry) return null;

  return (
    <mesh
      ref={localRef}
      position={position}
      geometry={geometry}
      name={name}
      {...props}
    >
      <meshStandardMaterial 
        color={0xaa8844} 
        metalness={0.5} 
        roughness={0.5} 
      />
    </mesh>
  );
});

export default PuzzleCube;