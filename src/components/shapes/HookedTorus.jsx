import { useMemo } from 'react';
import * as THREE from 'three';
import { useCSG } from '@react-three/csg';

export default function HookedTorus({ radius = 1, tube = 0.4, position = [0, 0, 0] }) {
  const csg = useCSG();
  
  const mesh = useMemo(() => {
    if (!csg) return null;

    const torusGeo = new THREE.TorusGeometry(radius, tube, 16, 32);
    const torusMesh = new THREE.Mesh(torusGeo);

    const boxSize = radius * 2.5;
    const boxGeo = new THREE.BoxGeometry(boxSize, boxSize, tube * 3);
    const boxMesh = new THREE.Mesh(boxGeo);
    boxMesh.position.set(radius * 0.9, radius * 0.9, 0);

    torusMesh.updateMatrix();
    boxMesh.updateMatrix();

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
    return mesh;
  }, [radius, tube, position, csg]);

  if (!mesh) return null;
  return <primitive object={mesh} />;
}