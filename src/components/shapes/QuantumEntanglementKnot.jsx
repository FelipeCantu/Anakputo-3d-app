import { useMemo, forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useCSG } from '@react-three/csg';

const QuantumEntanglementKnot = forwardRef(({ 
  radius = 2,
  tubeRadius = 0.4, 
  position = [0, 0, 0],
  name,
  onMeshReady,
  interlockSystem = null,
  materialProps = {
    color: 0x00aaff,
    metalness: 0.7,
    roughness: 0.3,
    transmission: 0.8,
    thickness: 0.5,
    envMapIntensity: 1.5
  },
  ...props 
}, ref) => {
  const csg = useCSG();
  const localRef = useRef();
  const meshRef = useRef();

  // Define interlock points in a stable reference
  const interlockPoints = useMemo(() => [
    { position: new THREE.Vector3(0, radius * 1.2, 0), normal: new THREE.Vector3(0, 1, 0) },
    { position: new THREE.Vector3(0, -radius * 1.2, 0), normal: new THREE.Vector3(0, -1, 0) },
    { position: new THREE.Vector3(radius * 1.2, 0, 0), normal: new THREE.Vector3(1, 0, 0) },
    { position: new THREE.Vector3(-radius * 1.2, 0, 0), normal: new THREE.Vector3(-1, 0, 0) }
  ], [radius]);

  // Create the quantum knot geometry
  const { mesh, geometry } = useMemo(() => {
    // Base torus knot geometry
    const torusKnot = new THREE.TorusKnotGeometry(
      radius, 
      tubeRadius, 
      300,  // tubularSegments
      20,   // radialSegments
      3,    // p
      7     // q
    );
    
    // Create parametric twist surface using BufferGeometry
    const twistGeometry = new THREE.BufferGeometry();
    const slices = 100;
    const stacks = 100;
    const vertices = [];
    const normals = [];
    const uvs = [];
    
    for (let i = 0; i <= slices; i++) {
      const u = i / slices;
      for (let j = 0; j <= stacks; j++) {
        const v = j / stacks;
        const twist = 5;
        
        // Position calculation
        const x = radius * (2 + Math.cos(u * Math.PI * 2)) * Math.cos(v * Math.PI * 2);
        const y = radius * (2 + Math.cos(u * Math.PI * 2 + twist * v * Math.PI * 2)) * Math.sin(v * Math.PI * 2);
        const z = radius * Math.sin(u * Math.PI * 2 + twist * v * Math.PI * 2);
        
        vertices.push(x, y, z);
        
        // Normal calculation (simplified)
        const nx = Math.cos(u * Math.PI * 2) * Math.cos(v * Math.PI * 2);
        const ny = Math.cos(u * Math.PI * 2) * Math.sin(v * Math.PI * 2);
        const nz = Math.sin(u * Math.PI * 2);
        normals.push(nx, ny, nz);
        
        // UV coordinates
        uvs.push(u, v);
      }
    }
    
    // Set geometry attributes
    twistGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    twistGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    twistGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    
    // Generate indices for faces
    const indices = [];
    for (let i = 0; i < slices; i++) {
      for (let j = 0; j < stacks; j++) {
        const a = i * (stacks + 1) + j;
        const b = a + stacks + 1;
        indices.push(a, b, a + 1);
        indices.push(b, b + 1, a + 1);
      }
    }
    twistGeometry.setIndex(indices);

    try {
      if (csg) {
        const knotMesh = new THREE.Mesh(torusKnot);
        const twistMesh = new THREE.Mesh(twistGeometry);
        
        knotMesh.updateMatrix();
        twistMesh.updateMatrix();
        
        const result = csg.union([knotMesh, twistMesh]);
        
        const mesh = new THREE.Mesh(
          result.geometry,
          new THREE.MeshPhysicalMaterial(materialProps)
        );
        mesh.position.set(...position);
        return { mesh, geometry: result.geometry };
      }
    } catch (error) {
      console.error('CSG operation failed:', error);
    }

    // Fallback to just the torus knot if CSG fails
    const mesh = new THREE.Mesh(
      torusKnot,
      new THREE.MeshPhysicalMaterial(materialProps)
    );
    mesh.position.set(...position);
    return { mesh, geometry: torusKnot };
  }, [radius, tubeRadius, position, csg, materialProps]);

  // Initialize interlock system when mesh is ready
  useEffect(() => {
    if (mesh) {
      meshRef.current = mesh;
      if (name) mesh.name = name;
      if (onMeshReady) onMeshReady(mesh);
      
      if (interlockSystem) {
        interlockSystem.registerKnot(mesh, interlockPoints);
      }
    }
  }, [mesh, name, onMeshReady, interlockSystem, interlockPoints]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getInterlockPoints: () => interlockPoints,
    getMesh: () => meshRef.current,
    connectTo: (otherKnotRef) => {
      if (!interlockSystem) {
        console.warn('Interlock system not available');
        return false;
      }
      return interlockSystem.createConnection(
        meshRef.current,
        otherKnotRef.current.getMesh(),
        interlockPoints,
        otherKnotRef.current.getInterlockPoints()
      );
    },
    disconnectFrom: (otherKnotRef) => {
      if (!interlockSystem) {
        console.warn('Interlock system not available');
        return false;
      }
      return interlockSystem.removeConnection(
        meshRef.current,
        otherKnotRef.current.getMesh()
      );
    }
  }), [interlockSystem, interlockPoints]);

  if (!mesh) return null;

  return (
    <primitive 
      object={mesh} 
      ref={localRef}
      {...props}
    />
  );
});

export default QuantumEntanglementKnot;