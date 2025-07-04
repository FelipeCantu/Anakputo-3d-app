import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { useInterlockSystem } from './InterlockSystem';

// Shape Components
import HookedTorus from './shapes/HookedTorus';
import PuzzleCube from './shapes/PuzzleCube';
import SpiralArm from './shapes/SpiralArm';
import QuantumEntanglementKnot from './shapes/QuantumEntanglementKnot';

export default function Systems() {
  const { scene } = useThree();
  const [shapes, setShapes] = useState([]);
  const shapeRefs = useRef({});
  const shapesList = useRef([]);

  // Movement System with robust error handling
  const movementSystem = useRef({
    objects: [],
    attractionForces: new Map(),
    clock: new THREE.Clock(),
    
    addObject: (obj, params = {}) => {
      if (!obj || !obj.position || !obj.rotation) {
        console.warn('Invalid object passed to movement system');
        return;
      }

      const defaultParams = {
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
      };

      movementSystem.current.objects.push({
        object: obj,
        ...{ ...defaultParams, ...params }
      });
    },
    
    addAttractionForce: (obj1, obj2, strength = 0.01, threshold = 2) => {
      if (!obj1?.position || !obj2?.position) {
        console.warn('Invalid objects for attraction force');
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
      const delta = Math.min(movementSystem.current.clock.getDelta(), 0.1); // Cap delta for safety
      
      // Update object movements with null checks
      movementSystem.current.objects = movementSystem.current.objects.filter(obj => {
        if (!obj?.object?.position || !obj?.direction || !obj?.rotationSpeed) {
          return false; // Remove invalid objects
        }
        
        try {
          obj.object.position.x += obj.direction.x * obj.speed * delta;
          obj.object.position.y += obj.direction.y * obj.speed * delta;
          obj.object.position.z += obj.direction.z * obj.speed * delta;
          
          obj.object.rotation.x += obj.rotationSpeed.x * delta;
          obj.object.rotation.y += obj.rotationSpeed.y * delta;
          obj.object.rotation.z += obj.rotationSpeed.z * delta;
          
          // Boundary checks with safe property access
          const bounds = 10;
          ['x', 'y', 'z'].forEach(axis => {
            if (Math.abs(obj.object.position[axis]) > bounds) {
              obj.direction[axis] *= -1;
            }
          });
          
          return true;
        } catch (error) {
          console.warn('Error updating object movement:', error);
          return false;
        }
      });
      
      // Update attraction forces with null checks
      movementSystem.current.attractionForces.forEach((force, key) => {
        if (!force?.obj1?.position || !force?.obj2?.position) {
          movementSystem.current.attractionForces.delete(key);
          return;
        }
        
        try {
          const direction = new THREE.Vector3().subVectors(
            force.obj2.position,
            force.obj1.position
          );
          const distance = direction.length();
          
          if (distance < force.threshold && distance > 0.1) {
            direction.normalize().multiplyScalar(force.strength * delta);
            force.obj1.position.add(direction);
          }
        } catch (error) {
          console.warn('Error updating attraction force:', error);
          movementSystem.current.attractionForces.delete(key);
        }
      });
    },
    
    smoothMoveTo: (obj, target, duration = 1) => {
      if (!obj?.position || !target) {
        console.warn('Invalid target or object for smooth move');
        return;
      }
      
      const safeTarget = {
        x: typeof target.x === 'number' ? target.x : obj.position.x,
        y: typeof target.y === 'number' ? target.y : obj.position.y,
        z: typeof target.z === 'number' ? target.z : obj.position.z
      };
      
      gsap.to(obj.position, {
        ...safeTarget,
        duration,
        ease: 'power2.out'
      });
    }
  });

  // Initialize shapes with validation
  useEffect(() => {
    const initialShapes = [
      // Orbiting shapes
      { type: 'HookedTorus', props: { radius: 2, tube: 0.5, position: [-5, 0, 0], name: 'torus1' } },
      { type: 'HookedTorus', props: { radius: 1.8, tube: 0.4, position: [5, 0, 0], name: 'torus2' } },
      { type: 'PuzzleCube', props: { size: 2, position: [0, -5, 0], name: 'cube1' } },
      { type: 'PuzzleCube', props: { size: 1.5, position: [0, 5, 0], name: 'cube2' } },
      { type: 'SpiralArm', props: { radius: 1, length: 3, position: [0, 0, -5], name: 'spiral1' } },
      { type: 'SpiralArm', props: { radius: 1.2, length: 2.5, position: [0, 0, 5], name: 'spiral2' } },
      
      // Central Quantum Entanglement Knot
      { 
        type: 'QuantumEntanglementKnot', 
        props: { 
          radius: 3,
          tubeRadius: 0.5,
          position: [0, 0, 0],
          name: 'quantumKnot',
          rotationSpeed: new THREE.Vector3(0.005, 0.01, 0.005)
        } 
      }
    ];

    setShapes(initialShapes.filter(shape => shape.type in shapeComponents));
  }, []);

  // Setup physics and interactions with safety checks
  useEffect(() => {
    const timer = setTimeout(() => {
      shapesList.current = Object.values(shapeRefs.current).filter(
        obj => obj?.position && obj?.rotation
      );
      
      // Add movement to orbiting shapes
      shapesList.current.forEach(mesh => {
        if (mesh.name !== 'quantumKnot') {
          movementSystem.current.addObject(mesh);
        }
      });

      // Attract all shapes to quantum knot if it exists
      const quantumKnot = shapeRefs.current.quantumKnot;
      if (quantumKnot?.position) {
        shapesList.current.forEach(mesh => {
          if (mesh.name !== 'quantumKnot' && mesh.position) {
            movementSystem.current.addAttractionForce(
              mesh,
              quantumKnot,
              0.015,
              5
            );
          }
        });
      }

      // Pair attractions with validation
      const pairs = [
        ['torus1', 'torus2', 0.02],
        ['cube1', 'cube2', 0.015],
        ['spiral1', 'spiral2', 0.01]
      ];

      pairs.forEach(([name1, name2, strength]) => {
        const obj1 = shapeRefs.current[name1];
        const obj2 = shapeRefs.current[name2];
        if (obj1?.position && obj2?.position) {
          movementSystem.current.addAttractionForce(obj1, obj2, strength);
        }
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [shapes]);

  // Initialize interlock system with valid shapes
  const interlockSystem = useInterlockSystem(
    movementSystem,
    shapesList.current.filter(
      s => s?.getInterlockPoints && typeof s.getInterlockPoints === 'function'
    )
  );

  // Animation loop with error boundaries
  useFrame(() => {
    try {
      movementSystem.current.update();
      
      // Special rotation for quantum knot if it exists
      const quantumKnot = shapeRefs.current.quantumKnot;
      if (quantumKnot?.rotation) {
        quantumKnot.rotation.x += 0.001;
        quantumKnot.rotation.y += 0.002;
      }
      
      // Safely update interlock system
      if (interlockSystem.current?.update) {
        interlockSystem.current.update();
      }
    } catch (error) {
      console.error('Error in animation loop:', error);
    }
  });

  // Shape component map
  const shapeComponents = {
    HookedTorus,
    PuzzleCube,
    SpiralArm,
    QuantumEntanglementKnot
  };

  return (
    <>
      {shapes.map((shape, index) => {
        const Component = shapeComponents[shape.type];
        if (!Component) return null;
        
        return (
          <Component
            key={`${shape.type}-${index}`}
            ref={el => {
              if (el && shape.props?.name) {
                shapeRefs.current[shape.props.name] = el;
              }
            }}
            {...shape.props}
          />
        );
      })}
    </>
  );
}