import { useMemo, forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useCSG } from '@react-three/csg';

const HookedTorus = forwardRef(({ 
  radius = 1, 
  tube = 0.4, 
  position = [0, 0, 0],
  name,
  onMeshReady,
  ...props 
}, ref) => {
  const csg = useCSG();
  const localRef = useRef();
  const meshRef = useRef();

  const { mesh, geometry } = useMemo(() => {
    // Fallback to basic torus if CSG fails
    const createBasicTorus = () => {
      const geometry = new THREE.TorusGeometry(radius, tube, 16, 32);
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({
          color: 0x44aa88,
          metalness: 0.7,
          roughness: 0.3,
        })
      );
      mesh.position.set(...position);
      return { mesh, geometry };
    };

    if (!csg) return createBasicTorus();

    try {
      // Create full torus
      const torusGeo = new THREE.TorusGeometry(radius, tube, 16, 32);
      const torusMesh = new THREE.Mesh(torusGeo);

      // Create cutting box
      const boxSize = radius * 2.5;
      const boxGeo = new THREE.BoxGeometry(boxSize, boxSize, tube * 3);
      const boxMesh = new THREE.Mesh(boxGeo);
      boxMesh.position.set(radius * 0.9, radius * 0.9, 0);

      // Update matrices
      torusMesh.updateMatrix();
      boxMesh.updateMatrix();

      // Perform subtraction using CSG
      const result = csg.subtract([torusMesh, boxMesh]);

      const mesh = new THREE.Mesh(
        result.geometry,
        new THREE.MeshStandardMaterial({
          color: 0x44aa88,
          metalness: 0.7,
          roughness: 0.3,
        })
      );
      mesh.position.set(...position);
      
      return { mesh, geometry: result.geometry };
    } catch (error) {
      console.error('CSG operation failed:', error);
      return createBasicTorus();
    }
  }, [radius, tube, position, csg]);

  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    getInterlockPoints: () => [
      { position: new THREE.Vector3(0, 0, radius), normal: new THREE.Vector3(0, 0, 1) },
      { position: new THREE.Vector3(0, 0, -radius), normal: new THREE.Vector3(0, 0, -1) },
      { position: new THREE.Vector3(radius, 0, 0), normal: new THREE.Vector3(1, 0, 0) },
      { position: new THREE.Vector3(-radius, 0, 0), normal: new THREE.Vector3(-1, 0, 0) }
    ],
    mesh: meshRef.current
  }), [radius]);

  useEffect(() => {
    if (mesh) {
      meshRef.current = mesh;
      if (name) mesh.name = name;
      if (onMeshReady) onMeshReady(mesh);
    }
  }, [mesh, name, onMeshReady]);

  if (!mesh) return null;

  return (
    <primitive 
      object={mesh} 
      ref={localRef}
      {...props}
    />
  );
});

export default HookedTorus;