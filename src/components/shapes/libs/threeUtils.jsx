'use client'; // Required for client-side operations

import * as THREE from 'three';
import { useRef, useEffect } from 'react';

/**
 * Custom hook for creating and managing a Three.js scene
 * @returns {Object} { scene, camera, renderer }
 */
export const useThreeScene = (options = {}) => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(new THREE.Scene());
  const cameraRef = useRef(new THREE.PerspectiveCamera(
    75,
    typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 1,
    0.1,
    1000
  ));
  const rendererRef = useRef(null);

  useEffect(() => {
    // Initialize renderer
    rendererRef.current = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: options.alpha || false,
      ...options.renderer
    });
    rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);

    // Camera positioning
    cameraRef.current.position.z = options.cameraZ || 15;

    // Handle resize
    const handleResize = () => {
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      rendererRef.current.dispose();
    };
  }, [options]);

  return {
    canvasRef,
    scene: sceneRef.current,
    camera: cameraRef.current,
    renderer: rendererRef.current
  };
};

/**
 * Creates interlock points for shapes
 * @param {THREE.Object3D} object - The 3D object
 * @param {Array} points - Array of point definitions
 * @returns {Array} Transformed interlock points
 */
export const createInterlockPoints = (object, points) => {
  return points.map(point => {
    const position = new THREE.Vector3().copy(point.position);
    const normal = new THREE.Vector3().copy(point.normal);
    
    position.applyMatrix4(object.matrixWorld);
    normal.transformDirection(object.matrixWorld);
    
    return { position, normal };
  });
};

/**
 * Generates a spiral curve for spiral arm shapes
 * @param {number} radius - Base radius
 * @param {number} length - Total length
 * @param {number} segments - Number of segments
 * @returns {THREE.CatmullRomCurve3} Spiral curve
 */
export const createSpiralCurve = (radius = 1, length = 2, segments = 32) => {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * Math.PI * 4;
    const x = Math.cos(angle) * radius * (1 - t * 0.5);
    const y = Math.sin(angle) * radius * (1 - t * 0.5);
    const z = t * length - length / 2;
    points.push(new THREE.Vector3(x, y, z));
  }
  return new THREE.CatmullRomCurve3(points);
};

/**
 * Performs CSG operations on meshes
 * @param {THREE.Mesh} meshA - First mesh
 * @param {THREE.Mesh} meshB - Second mesh
 * @param {string} operation - 'subtract', 'union', or 'intersect'
 * @returns {THREE.Mesh} Resulting mesh
 */
export const performCSG = (meshA, meshB, operation = 'subtract') => {
  meshA.updateMatrix();
  meshB.updateMatrix();
  
  const csgA = window.CSG.fromMesh(meshA);
  const csgB = window.CSG.fromMesh(meshB);
  
  let result;
  switch (operation) {
    case 'union':
      result = csgA.union(csgB);
      break;
    case 'intersect':
      result = csgA.intersect(csgB);
      break;
    case 'subtract':
    default:
      result = csgA.subtract(csgB);
  }
  
  return window.CSG.toMesh(result, meshA.matrix);
};

/**
 * Animation utilities
 */
export const AnimationUtils = {
  /**
   * Smooth movement using GSAP
   * @param {THREE.Object3D} object - 3D object to animate
   * @param {THREE.Vector3} target - Target position
   * @param {Object} options - Animation options
   */
  smoothMove: (object, target, options = {}) => {
    return new Promise(resolve => {
      window.gsap.to(object.position, {
        x: target.x,
        y: target.y,
        z: target.z,
        duration: options.duration || 1,
        ease: options.ease || 'power2.out',
        onComplete: resolve
      });
    });
  },

  /**
   * Smooth rotation using GSAP
   * @param {THREE.Object3D} object - 3D object to animate
   * @param {THREE.Euler} target - Target rotation
   * @param {Object} options - Animation options
   */
  smoothRotate: (object, target, options = {}) => {
    return new Promise(resolve => {
      window.gsap.to(object.rotation, {
        x: target.x,
        y: target.y,
        z: target.z,
        duration: options.duration || 1,
        ease: options.ease || 'power2.out',
        onComplete: resolve
      });
    });
  }
};

/**
 * Physics utilities for basic movement
 */
export const PhysicsUtils = {
  /**
   * Apply attraction force between two objects
   * @param {THREE.Object3D} obj1 - First object
   * @param {THREE.Object3D} obj2 - Second object
   * @param {number} strength - Force strength
   * @param {number} threshold - Maximum distance for force
   */
  applyAttraction: (obj1, obj2, strength = 0.01, threshold = 2) => {
    const direction = new THREE.Vector3().subVectors(
      obj2.position,
      obj1.position
    );
    const distance = direction.length();
    
    if (distance < threshold && distance > 0.1) {
      direction.normalize().multiplyScalar(strength);
      obj1.position.add(direction);
    }
  },

  /**
   * Apply random movement to an object
   * @param {THREE.Object3D} object - Object to move
   * @param {Object} params - Movement parameters
   */
  applyRandomMovement: (object, params = {}) => {
    if (!object.userData.movementParams) {
      object.userData.movementParams = {
        speed: params.speed || Math.random() * 0.5 + 0.1,
        direction: params.direction || new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize(),
        rotationSpeed: params.rotationSpeed || new THREE.Vector3(
          Math.random() * 0.01,
          Math.random() * 0.01,
          Math.random() * 0.01
        )
      };
    }

    const { speed, direction, rotationSpeed } = object.userData.movementParams;
    
    object.position.x += direction.x * speed;
    object.position.y += direction.y * speed;
    object.position.z += direction.z * speed;
    
    object.rotation.x += rotationSpeed.x;
    object.rotation.y += rotationSpeed.y;
    object.rotation.z += rotationSpeed.z;
    
    // Boundary checking
    if (Math.abs(object.position.x) > 10) direction.x *= -1;
    if (Math.abs(object.position.y) > 10) direction.y *= -1;
    if (Math.abs(object.position.z) > 10) direction.z *= -1;
  }
};

/**
 * Helper to load Three.js CSG library dynamically
 */
export const loadCSG = async () => {
  if (typeof window !== 'undefined' && !window.CSG) {
    const { default: CSG } = await import('three-csg-ts');
    window.CSG = CSG;
  }
};

/**
 * Helper to load GSAP dynamically
 */
export const loadGSAP = async () => {
  if (typeof window !== 'undefined' && !window.gsap) {
    const { gsap } = await import('gsap');
    window.gsap = gsap;
  }
};