import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

export function useInterlockSystem(movementSystem, shapes) {
  const interlockSystem = useRef({
    shapePairs: new Map(),
    interactionDistance: 1.5,
    alignmentThreshold: 0.85,
    
    registerShapePair: (shape1, shape2, compatibilityScore = 1) => {
      // Add null checks for shape objects and their mesh properties
      if (!shape1 || !shape2 || !shape1.mesh || !shape2.mesh) {
        console.warn('Invalid shapes provided to registerShapePair');
        return;
      }
      
      const key = `${shape1.mesh.uuid}-${shape2.mesh.uuid}`;
      interlockSystem.current.shapePairs.set(key, {
        shape1,
        shape2,
        compatibilityScore,
        isInterlocked: false
      });
    },
    
    update: () => {
      interlockSystem.current.shapePairs.forEach(pair => {
        // Skip if interlocked or if shapes are invalid
        if (pair.isInterlocked || !pair.shape1?.mesh || !pair.shape2?.mesh) return;
        
        const distance = pair.shape1.mesh.position.distanceTo(pair.shape2.mesh.position);
        if (distance < interlockSystem.current.interactionDistance) {
          interlockSystem.current.checkAlignmentAndInterlock(pair);
        }
      });
    },
    
    checkAlignmentAndInterlock: (pair) => {
      // Skip if shapes don't have required methods
      if (!pair.shape1.getInterlockPoints || !pair.shape2.getInterlockPoints) return;
      
      const shape1Points = pair.shape1.getInterlockPoints();
      const shape2Points = pair.shape2.getInterlockPoints();
      
      let bestMatch = null;
      let bestScore = 0;
      
      shape1Points.forEach(point1 => {
        shape2Points.forEach(point2 => {
          const worldPoint1 = point1.position.clone().applyMatrix4(pair.shape1.mesh.matrixWorld);
          const worldNormal1 = point1.normal.clone().transformDirection(pair.shape1.mesh.matrixWorld);
          
          const worldPoint2 = point2.position.clone().applyMatrix4(pair.shape2.mesh.matrixWorld);
          const worldNormal2 = point2.normal.clone().transformDirection(pair.shape2.mesh.matrixWorld);
          
          const distance = worldPoint1.distanceTo(worldPoint2);
          const alignment = worldNormal1.dot(worldNormal2.multiplyScalar(-1));
          
          const score = (1 - distance / interlockSystem.current.interactionDistance) * alignment;
          
          if (score > bestScore && alignment > interlockSystem.current.alignmentThreshold) {
            bestScore = score;
            bestMatch = {
              point1: worldPoint1,
              normal1: worldNormal1,
              point2: worldPoint2,
              normal2: worldNormal2
            };
          }
        });
      });
      
      if (bestMatch) {
        interlockSystem.current.performInterlock(pair, bestMatch);
      }
    },
    
    performInterlock: (pair, match) => {
      pair.isInterlocked = true;
      
      const targetPosition = match.point1.clone();
      const offset = match.point2.clone().sub(pair.shape2.mesh.position);
      targetPosition.sub(offset);
      
      const targetQuaternion = new THREE.Quaternion();
      targetQuaternion.setFromUnitVectors(
        match.normal2.clone().normalize(),
        match.normal1.clone().multiplyScalar(-1).normalize()
      );
      
      const newQuaternion = pair.shape2.mesh.quaternion.clone().multiply(targetQuaternion);
      const targetRotation = new THREE.Euler().setFromQuaternion(newQuaternion);
      
      movementSystem.current.smoothMoveTo(pair.shape2.mesh, targetPosition);
      gsap.to(pair.shape2.mesh.rotation, {
        x: targetRotation.x,
        y: targetRotation.y,
        z: targetRotation.z,
        duration: 1,
        ease: "power2.out"
      });
      
      pair.shape1.mesh.add(pair.shape2.mesh);
      pair.shape2.mesh.position.sub(targetPosition);
    }
  });

  // Register shape pairs when shapes change
  useEffect(() => {
    if (!shapes || shapes.length < 2) return;
    
    // Clear previous pairs
    interlockSystem.current.shapePairs.clear();
    
    // Only register pairs where both shapes have a mesh property
    const validShapes = shapes.filter(shape => shape?.mesh);
    
    if (validShapes.length >= 2) {
      interlockSystem.current.registerShapePair(validShapes[0], validShapes[1], 0.9);
    }
    if (validShapes.length >= 4) {
      interlockSystem.current.registerShapePair(validShapes[2], validShapes[3], 0.8);
    }
    if (validShapes.length >= 6) {
      interlockSystem.current.registerShapePair(validShapes[4], validShapes[5], 0.7);
      interlockSystem.current.registerShapePair(validShapes[0], validShapes[4], 0.5);
      interlockSystem.current.registerShapePair(validShapes[2], validShapes[5], 0.4);
    }
  }, [shapes]);

  return interlockSystem;
}