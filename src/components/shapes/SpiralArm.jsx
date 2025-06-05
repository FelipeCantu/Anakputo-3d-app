import { useMemo } from 'react';
import * as THREE from 'three';

export default function SpiralArm({ radius = 1, length = 2, segments = 32, position = [0, 0, 0] }) {
  const { mesh, getInterlockPoints } = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(createSpiralPoints(radius, length, segments));
    const tubeGeo = new THREE.TubeGeometry(curve, segments, radius * 0.1, 8, false);
    
    const mesh = new THREE.Mesh(
      tubeGeo,
      new THREE.MeshStandardMaterial({
        color: 0x8844aa,
        metalness: 0.3,
        roughness: 0.7
      })
    );
    
    mesh.position.set(...position);
    
    const getInterlockPoints = () => [
      { 
        position: new THREE.Vector3(radius, 0, -length/2), 
        normal: new THREE.Vector3(1, 0, -1).normalize() 
      },
      { 
        position: new THREE.Vector3(-radius * 0.5, -radius * 0.5, length/2), 
        normal: new THREE.Vector3(-1, -1, 1).normalize() 
      }
    ];
    
    return { mesh, getInterlockPoints };
    
    function createSpiralPoints(radius, length, segments) {
      const points = [];
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = t * Math.PI * 4;
        const x = Math.cos(angle) * radius * (1 - t * 0.5);
        const y = Math.sin(angle) * radius * (1 - t * 0.5);
        const z = t * length - length / 2;
        points.push(new THREE.Vector3(x, y, z));
      }
      return points;
    }
  }, [radius, length, segments, position]);

  return <primitive object={mesh} />;
}