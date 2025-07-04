import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

export function useInterlockSystem(movementSystem, shapes = []) {
  const interlockSystem = useRef({
    shapePairs: new Map(),
    interactionDistance: 1.5,
    alignmentThreshold: 0.85,
    
    registerShapePair: (shape1, shape2, compatibilityScore = 1) => {
      if (!shape1?.mesh || !shape2?.mesh) {
        console.warn('Invalid shapes provided to registerShapePair');
        return false;
      }
      
      const key = `${shape1.mesh.uuid}-${shape2.mesh.uuid}`;
      interlockSystem.current.shapePairs.set(key, {
        shape1,
        shape2,
        compatibilityScore,
        isInterlocked: false
      });
      return true;
    },
    
    update: () => {
      interlockSystem.current.shapePairs.forEach(pair => {
        if (pair.isInterlocked || !pair.shape1?.mesh || !pair.shape2?.mesh) return;
        
        const distance = pair.shape1.mesh.position.distanceTo(pair.shape2.mesh.position);
        if (distance < interlockSystem.current.interactionDistance) {
          interlockSystem.current.checkAlignmentAndInterlock(pair);
        }
      });
    },
    
    checkAlignmentAndInterlock: (pair) => {
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
            bestMatch = { point1: worldPoint1, normal1: worldNormal1, point2: worldPoint2, normal2: worldNormal2 };
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
        ease: "power2.out",
        onComplete: () => {
          pair.shape1.mesh.add(pair.shape2.mesh);
          pair.shape2.mesh.position.sub(targetPosition);
        }
      });
    }
  });

  useEffect(() => {
    if (shapes.length >= 2) {
      interlockSystem.current.registerShapePair(shapes[0], shapes[1]);
    }
  }, [shapes]);

  return interlockSystem;
}