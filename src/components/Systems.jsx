import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import HookedTorus from './shapes/HookedTorus';
import PuzzleCube from './shapes/PuzzleCube';
import SpiralArm from './shapes/SpiralArm';
import { useInterlockSystem } from './InterlockSystem';

export default function Systems() {
  const { scene } = useThree();
  const [shapes, setShapes] = useState([]);
  const shapeRefs = useRef({});

  // Robust movement system with null checks
  const movementSystem = useRef({
    objects: [],
    attractionForces: new Map(),
    clock: new THREE.Clock(),
    
    addObject: (object, params = {}) => {
      if (!object) {
        console.warn('Attempted to add null object to movement system');
        return;
      }

      // Ensure all movement parameters have safe defaults
      const safeParams = {
        speed: typeof params.speed === 'number' ? params.speed : 0.5 + Math.random(),
        direction: params.direction instanceof THREE.Vector3 
          ? params.direction.clone() 
          : new THREE.Vector3(
              Math.random() * 2 - 1,
              Math.random() * 2 - 1,
              Math.random() * 2 - 1
            ).normalize(),
        rotationSpeed: params.rotationSpeed instanceof THREE.Vector3
          ? params.rotationSpeed.clone()
          : new THREE.Vector3(
              Math.random() * 0.01,
              Math.random() * 0.01,
              Math.random() * 0.01
            )
      };

      movementSystem.current.objects.push({
        object,
        ...safeParams
      });
    },
    
    addAttractionForce: (obj1, obj2, strength = 0.01, threshold = 2) => {
      if (!obj1 || !obj2) {
        console.warn('Attempted to add attraction force with null objects');
        return;
      }
      const key = `${obj1.uuid}-${obj2.uuid}`;
      movementSystem.current.attractionForces.set(key, { 
        obj1, 
        obj2, 
        strength, 
        threshold 
      });
    },
    
    update: () => {
      const delta = movementSystem.current.clock.getDelta();
      
      movementSystem.current.objects.forEach(obj => {
        // Skip if object or parameters are invalid
        if (!obj?.object || !obj.direction || !obj.rotationSpeed) return;
        
        // Clone vectors to prevent mutation issues
        const direction = obj.direction.clone();
        const rotationSpeed = obj.rotationSpeed.clone();
        
        // Safe property access with fallbacks
        const speed = typeof obj.speed === 'number' ? obj.speed : 1;
        const position = obj.object.position;
        
        // Update position with null checks
        if (typeof position.x === 'number') position.x += direction.x * speed * delta;
        if (typeof position.y === 'number') position.y += direction.y * speed * delta;
        if (typeof position.z === 'number') position.z += direction.z * speed * delta;
        
        // Update rotation with null checks
        if (typeof obj.object.rotation.x === 'number') obj.object.rotation.x += rotationSpeed.x * delta;
        if (typeof obj.object.rotation.y === 'number') obj.object.rotation.y += rotationSpeed.y * delta;
        if (typeof obj.object.rotation.z === 'number') obj.object.rotation.z += rotationSpeed.z * delta;
        
        // Boundary checks
        const bounds = 10;
        if (Math.abs(position.x) > bounds) direction.x *= -1;
        if (Math.abs(position.y) > bounds) direction.y *= -1;
        if (Math.abs(position.z) > bounds) direction.z *= -1;
        
        // Update stored direction
        obj.direction = direction;
      });
      
      movementSystem.current.attractionForces.forEach(force => {
        if (!force?.obj1?.position || !force?.obj2?.position) return;
        
        const direction = new THREE.Vector3().subVectors(
          force.obj2.position,
          force.obj1.position
        );
        const distance = direction.length();
        
        if (distance < (force.threshold || 2) && distance > 0.1) {
          direction.normalize().multiplyScalar((force.strength || 0.01) * delta);
          force.obj1.position.add(direction);
        }
      });
    },
    
    smoothMoveTo: (object, target, duration = 1) => {
      if (!object?.position || !target) return;
      gsap.to(object.position, {
        x: target.x || 0,
        y: target.y || 0,
        z: target.z || 0,
        duration,
        ease: 'power2.out'
      });
    }
  });

  const interlockSystem = useInterlockSystem(movementSystem, shapes);

  useEffect(() => {
    const initialShapes = [
      { type: 'HookedTorus', props: { radius: 2, tube: 0.5, position: [-5, 0, 0], name: 'torus1' } },
      { type: 'HookedTorus', props: { radius: 1.8, tube: 0.4, position: [5, 0, 0], name: 'torus2' } },
      { type: 'PuzzleCube', props: { size: 2, position: [0, -5, 0], name: 'cube1' } },
      { type: 'PuzzleCube', props: { size: 1.5, position: [0, 5, 0], name: 'cube2' } },
      { type: 'SpiralArm', props: { radius: 1, length: 3, position: [0, 0, -5], name: 'spiral1' } },
      { type: 'SpiralArm', props: { radius: 1.2, length: 2.5, position: [0, 0, 5], name: 'spiral2' } }
    ];

    setShapes(initialShapes);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Initialize movement for all valid shapes
      Object.entries(shapeRefs.current).forEach(([name, mesh]) => {
        if (mesh instanceof THREE.Object3D) {
          movementSystem.current.addObject(mesh, {
            speed: 0.5 + Math.random(),
            direction: new THREE.Vector3(
              Math.random() * 2 - 1,
              Math.random() * 2 - 1,
              Math.random() * 2 - 1
            ).normalize(),
            rotationSpeed: new THREE.Vector3(
              Math.random() * 0.01,
              Math.random() * 0.01,
              Math.random() * 0.01
            )
          });
        }
      });

      // Setup attraction forces with null checks
      if (shapeRefs.current.torus1 instanceof THREE.Object3D && 
          shapeRefs.current.torus2 instanceof THREE.Object3D) {
        movementSystem.current.addAttractionForce(
          shapeRefs.current.torus1, 
          shapeRefs.current.torus2, 
          0.02
        );
      }
      if (shapeRefs.current.cube1 instanceof THREE.Object3D && 
          shapeRefs.current.cube2 instanceof THREE.Object3D) {
        movementSystem.current.addAttractionForce(
          shapeRefs.current.cube1, 
          shapeRefs.current.cube2, 
          0.015
        );
      }
      if (shapeRefs.current.spiral1 instanceof THREE.Object3D && 
          shapeRefs.current.spiral2 instanceof THREE.Object3D) {
        movementSystem.current.addAttractionForce(
          shapeRefs.current.spiral1, 
          shapeRefs.current.spiral2, 
          0.01
        );
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [shapes]);

  useFrame(() => {
    movementSystem.current.update();
    interlockSystem.current?.update();
  });

  const shapeComponents = {
    HookedTorus,
    PuzzleCube,
    SpiralArm
  };

  return (
    <>
      {shapes.map((shape, index) => {
        const Component = shapeComponents[shape.type];
        return (
          <Component
            key={`${shape.type}-${index}`}
            ref={(el) => {
              if (el instanceof THREE.Object3D && shape.props.name) {
                shapeRefs.current[shape.props.name] = el;
                el.name = shape.props.name;
              }
            }}
            {...shape.props}
          />
        );
      })}
    </>
  );
}