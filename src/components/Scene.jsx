import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

function Scene() {
  const mountRef = useRef();
  const sceneRef = useRef();
  const rendererRef = useRef();
  const cameraRef = useRef();
  const frameId = useRef();
  const [selectedShape, setSelectedShape] = useState(null);
  const [interactionMode, setInteractionMode] = useState('orbit');
  const [showConnections, setShowConnections] = useState(true);
  const [physicsEnabled, setPhysicsEnabled] = useState(true);
  const shapesRef = useRef([]);
  const connectionsRef = useRef([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef(new THREE.Vector3());
  const cameraControlsRef = useRef({ mouseX: 0, mouseY: 0, distance: 20 });
  const velocitiesRef = useRef(new Map());
  const mouseVelocityRef = useRef(new THREE.Vector2());

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create stunning space background
    const createSpaceBackground = () => {
      // Create starfield
      const starsGeometry = new THREE.BufferGeometry();
      const starCount = 3000;
      const positions = new Float32Array(starCount * 3);
      const colors = new Float32Array(starCount * 3);
      const sizes = new Float32Array(starCount);

      for (let i = 0; i < starCount; i++) {
        // Random positions in a large sphere
        const radius = 200 + Math.random() * 300;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);

        // Star colors (bluish, white, yellowish)
        const starType = Math.random();
        if (starType < 0.3) {
          colors[i * 3] = 0.8 + Math.random() * 0.2;     // Red
          colors[i * 3 + 1] = 0.9 + Math.random() * 0.1; // Green  
          colors[i * 3 + 2] = 1.0;                       // Blue (bluish)
        } else if (starType < 0.7) {
          colors[i * 3] = 1.0;                           // Red
          colors[i * 3 + 1] = 1.0;                       // Green
          colors[i * 3 + 2] = 1.0;                       // Blue (white)
        } else {
          colors[i * 3] = 1.0;                           // Red
          colors[i * 3 + 1] = 0.8 + Math.random() * 0.2; // Green
          colors[i * 3 + 2] = 0.6 + Math.random() * 0.2; // Blue (yellowish)
        }

        sizes[i] = Math.random() * 3 + 1;
      }

      starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      const starsMaterial = new THREE.PointsMaterial({
        size: 3, // Increased from 2
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 1.0, // Increased from 0.8
        blending: THREE.AdditiveBlending
      });

      const stars = new THREE.Points(starsGeometry, starsMaterial);
      scene.add(stars);

      // Create nebula clouds
      const createNebula = (color, position, scale) => {
        const nebulaGeometry = new THREE.SphereGeometry(50, 32, 32);
        const nebulaMaterial = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.2, // Increased from 0.1
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending
        });
        const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
        nebula.position.copy(position);
        nebula.scale.setScalar(scale);
        scene.add(nebula);
        return nebula;
      };

      // Add multiple nebula clouds
      const nebulae = [
        createNebula(0xff0066, new THREE.Vector3(80, 40, -120), 2),
        createNebula(0x0066ff, new THREE.Vector3(-100, -60, 150), 1.8),
        createNebula(0x66ff00, new THREE.Vector3(120, 80, 100), 1.5),
        createNebula(0xff6600, new THREE.Vector3(-80, 100, -80), 2.2),
        createNebula(0x9900ff, new THREE.Vector3(60, -90, 200), 1.6)
      ];

      // Animate nebulae
      const animateNebulae = (elapsedTime) => {
        nebulae.forEach((nebula, index) => {
          nebula.rotation.x = elapsedTime * 0.02 * (index + 1);
          nebula.rotation.y = elapsedTime * 0.015 * (index + 1);
          nebula.rotation.z = elapsedTime * 0.01 * (index + 1);
          
          // Gentle pulsing
          const pulse = Math.sin(elapsedTime * 0.5 + index) * 0.02 + 1;
          nebula.scale.setScalar((1.5 + index * 0.3) * pulse);
        });
      };

      // Create cosmic dust particles
      const dustGeometry = new THREE.BufferGeometry();
      const dustCount = 1000;
      const dustPositions = new Float32Array(dustCount * 3);
      const dustColors = new Float32Array(dustCount * 3);

      for (let i = 0; i < dustCount; i++) {
        dustPositions[i * 3] = (Math.random() - 0.5) * 400;
        dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 400;
        dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 400;

        // Subtle cosmic dust colors
        dustColors[i * 3] = 0.4 + Math.random() * 0.3;
        dustColors[i * 3 + 1] = 0.2 + Math.random() * 0.4;
        dustColors[i * 3 + 2] = 0.6 + Math.random() * 0.4;
      }

      dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
      dustGeometry.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));

      const dustMaterial = new THREE.PointsMaterial({
        size: 1.0, // Increased from 0.5
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.6, // Increased from 0.3
        blending: THREE.AdditiveBlending
      });

      const dust = new THREE.Points(dustGeometry, dustMaterial);
      scene.add(dust);

      // Create distant galaxies
      const createGalaxy = (position, color) => {
        const galaxyGeometry = new THREE.RingGeometry(20, 35, 32);
        const galaxyMaterial = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.15, // Increased from 0.05
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending
        });
        const galaxy = new THREE.Mesh(galaxyGeometry, galaxyMaterial);
        galaxy.position.copy(position);
        galaxy.lookAt(0, 0, 0);
        scene.add(galaxy);
        return galaxy;
      };

      const galaxies = [
        createGalaxy(new THREE.Vector3(200, 150, -300), 0xffffff),
        createGalaxy(new THREE.Vector3(-250, -100, 280), 0xff9999),
        createGalaxy(new THREE.Vector3(180, -200, 250), 0x9999ff)
      ];

      // Return animation function
      return {
        animateNebulae,
        stars,
        dust,
        galaxies,
        nebulae
      };
    };

    const spaceElements = createSpaceBackground();
    
    // Set lighter space background with cosmic colors
    scene.background = new THREE.Color(0x0a0f1a); // Lighter than before
    scene.fog = new THREE.Fog(0x162838, 40, 120); // Lighter fog, further range

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(12, 10, 12);
    cameraRef.current = camera;

    // Enhanced renderer with better shadow settings
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Advanced shadow settings
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows
    renderer.shadowMap.autoUpdate = true;
    
    // Enhanced rendering settings
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    
    // Better shadow quality
    renderer.shadowMap.cascade = true;
    
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting - Simplified with focus on ground shadows
    const ambientLight = new THREE.AmbientLight(0x404080, 0.8);
    scene.add(ambientLight);

    // Main light optimized for clean ground shadows
    const mainLight = new THREE.DirectionalLight(0xffffff, 2.5);
    mainLight.position.set(0, 20, 0); // Directly above for clean shadows
    mainLight.castShadow = true;
    
    // Optimized shadow settings for ground shadows only
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -20;
    mainLight.shadow.camera.right = 20;
    mainLight.shadow.camera.top = 20;
    mainLight.shadow.camera.bottom = -20;
    
    // Clean shadow settings
    mainLight.shadow.radius = 3;
    mainLight.shadow.blurSamples = 15;
    mainLight.shadow.bias = -0.0005;
    
    scene.add(mainLight);

    // Rim lights for visual appeal (no shadows)
    const rimLight1 = new THREE.DirectionalLight(0x66ddff, 1.2);
    rimLight1.position.set(-8, 8, -8);
    scene.add(rimLight1);

    const rimLight2 = new THREE.DirectionalLight(0xff66dd, 1.0);
    rimLight2.position.set(8, -5, 12);
    scene.add(rimLight2);

    // Point lights for atmosphere (no shadows)
    const pointLight1 = new THREE.PointLight(0xff6699, 1.5, 30, 1.5);
    pointLight1.position.set(10, 6, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x6699ff, 1.3, 25, 1.5);
    pointLight2.position.set(-10, -6, -10);
    scene.add(pointLight2);

    // Top fill light for overall brightness
    const topFillLight = new THREE.DirectionalLight(0x9999ff, 0.8);
    topFillLight.position.set(0, 10, 0);
    scene.add(topFillLight);

    // Add additional fill light for overall brightness
    const fillLight = new THREE.DirectionalLight(0x9999ff, 1.0);
    fillLight.position.set(0, 10, 0);
    scene.add(fillLight);

    // Simple ground platform optimized for receiving shadows
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x3a4a5e, // Slightly darker to show shadows better
      transparent: false,
      opacity: 1.0
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -8;
    ground.receiveShadow = true; // Only receives shadows
    scene.add(ground);

    // Create shapes
    const shapes = createShapes();
    shapes.forEach(shape => {
      scene.add(shape);
      shapesRef.current.push(shape);
      velocitiesRef.current.set(shape.uuid, new THREE.Vector3());
    });

    // Animation helper
    const animateProperty = (object, target, duration, easing = 'easeOut') => {
      return new Promise((resolve) => {
        const start = {};
        Object.keys(target).forEach(key => start[key] = object[key]);
        const startTime = Date.now();
        
        function update() {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          let easeProgress;
          if (easing === 'bounce') {
            easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          } else if (easing === 'elastic') {
            easeProgress = progress === 0 ? 0 : progress === 1 ? 1 :
              Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
          } else {
            easeProgress = 1 - Math.pow(1 - progress, 3);
          }
          
          Object.keys(target).forEach(key => {
            object[key] = start[key] + (target[key] - start[key]) * easeProgress;
          });
          
          if (progress < 1) {
            requestAnimationFrame(update);
          } else {
            resolve();
          }
        }
        update();
      });
    };

    // Effect functions
    const createRippleEffect = (position) => {
      const rippleGeometry = new THREE.RingGeometry(0.1, 3, 16);
      const rippleMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff, 
        transparent: true, 
        opacity: 0.6,
        side: THREE.DoubleSide
      });
      const ripple = new THREE.Mesh(rippleGeometry, rippleMaterial);
      ripple.position.copy(position);
      ripple.lookAt(camera.position);
      scene.add(ripple);
      
      animateProperty(ripple.scale, { x: 3, y: 3, z: 3 }, 800).then(() => scene.remove(ripple));
      animateProperty(rippleMaterial, { opacity: 0 }, 800);
    };

    const createImpactEffect = (position) => {
      for (let i = 0; i < 8; i++) {
        const particle = new THREE.Mesh(
          new THREE.SphereGeometry(0.05),
          new THREE.MeshBasicMaterial({ color: 0xffaa00 })
        );
        particle.position.copy(position);
        scene.add(particle);
        
        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          Math.random() * 2,
          (Math.random() - 0.5) * 2
        );
        
        const animateParticle = () => {
          particle.position.add(velocity);
          velocity.multiplyScalar(0.95);
          velocity.y -= 0.02;
          
          if (particle.position.y > -10) {
            requestAnimationFrame(animateParticle);
          } else {
            scene.remove(particle);
          }
        };
        animateParticle();
      }
    };

    const createShockwave = (position) => {
      const shockGeometry = new THREE.SphereGeometry(0.1, 16, 16);
      const shockMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff3366, 
        transparent: true, 
        opacity: 0.8,
        wireframe: true
      });
      const shockwave = new THREE.Mesh(shockGeometry, shockMaterial);
      shockwave.position.copy(position);
      scene.add(shockwave);
      
      animateProperty(shockwave.scale, { x: 12, y: 12, z: 12 }, 1000).then(() => scene.remove(shockwave));
      animateProperty(shockMaterial, { opacity: 0 }, 1000);
    };

    // Utility functions
    const getTopShape = (object) => {
      while (object.parent && !shapesRef.current.includes(object)) {
        object = object.parent;
      }
      return shapesRef.current.includes(object) ? object : null;
    };

    const checkInterlocking = (shape) => {
      shapesRef.current.forEach(otherShape => {
        if (otherShape === shape) return;
        
        const distance = shape.position.distanceTo(otherShape.position);
        if (distance < 3.5) {
          const direction = new THREE.Vector3().subVectors(otherShape.position, shape.position).normalize();
          const force = Math.pow((3.5 - distance) / 3.5, 2) * 0.03;
          
          if (!isDraggingRef.current) {
            const velocity = velocitiesRef.current.get(shape.uuid);
            velocity.add(direction.multiplyScalar(force));
          }
          
          if (distance < 2.5 && showConnections) {
            createConnection(shape, otherShape);
          }
          
          if (distance < 1.5 && shape.material && shape.material.emissiveIntensity !== undefined) {
            shape.material.emissiveIntensity = 0.8;
            if (otherShape.material && otherShape.material.emissiveIntensity !== undefined) {
              otherShape.material.emissiveIntensity = 0.8;
            }
          }
        }
      });
    };

    const createConnection = (shape1, shape2) => {
      const points = [shape1.position.clone(), shape2.position.clone()];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ 
        color: 0x00ffaa, 
        transparent: true, 
        opacity: 0.6 
      });
      const line = new THREE.Line(geometry, material);
      line.userData = { shape1, shape2 };
      scene.add(line);
      connectionsRef.current.push(line);
      
      setTimeout(() => {
        scene.remove(line);
        const index = connectionsRef.current.indexOf(line);
        if (index > -1) connectionsRef.current.splice(index, 1);
      }, 2000);
    };

    // Mouse handlers
    const updateMouse = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const newMouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      mouseVelocityRef.current.subVectors(newMouse, mouseRef.current).multiplyScalar(20);
      mouseRef.current.copy(newMouse);
    };

    const handleMouseMove = (event) => {
      updateMouse(event);
      
      if (interactionMode === 'orbit' && !isDraggingRef.current) {
        cameraControlsRef.current.mouseX = mouseRef.current.x;
        cameraControlsRef.current.mouseY = mouseRef.current.y;
      } else if (isDraggingRef.current && selectedShape) {
        raycasterRef.current.setFromCamera(mouseRef.current, camera);
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersectPoint = new THREE.Vector3();
        raycasterRef.current.ray.intersectPlane(plane, intersectPoint);
        
        if (intersectPoint) {
          const targetPos = intersectPoint.clone().add(dragOffsetRef.current);
          const velocity = velocitiesRef.current.get(selectedShape.uuid);
          const force = new THREE.Vector3().subVectors(targetPos, selectedShape.position).multiplyScalar(0.1);
          velocity.add(force).multiplyScalar(0.9);
          selectedShape.position.add(velocity);
          checkInterlocking(selectedShape);
        }
      } else if (!isDraggingRef.current) {
        raycasterRef.current.setFromCamera(mouseRef.current, camera);
        const intersects = raycasterRef.current.intersectObjects(shapesRef.current, true);
        
        shapesRef.current.forEach(shape => {
          if (shape.material && shape.material.emissiveIntensity !== undefined) {
            shape.material.emissiveIntensity = shape.userData.originalEmissive || 0.2;
            animateProperty(shape.scale, { x: 1, y: 1, z: 1 }, 200);
          }
        });
        
        if (intersects.length > 0) {
          const hoveredShape = getTopShape(intersects[0].object);
          if (hoveredShape && hoveredShape.material && hoveredShape.material.emissiveIntensity !== undefined) {
            hoveredShape.material.emissiveIntensity = 0.8;
            animateProperty(hoveredShape.scale, { x: 1.08, y: 1.08, z: 1.08 }, 200, 'elastic');
            createRippleEffect(hoveredShape.position);
          }
          renderer.domElement.style.cursor = 'grab';
        } else {
          renderer.domElement.style.cursor = 'default';
        }
      }
    };

    const handleMouseDown = (event) => {
      updateMouse(event);
      
      if (interactionMode === 'drag') {
        raycasterRef.current.setFromCamera(mouseRef.current, camera);
        const intersects = raycasterRef.current.intersectObjects(shapesRef.current, true);
        
        if (intersects.length > 0) {
          const clickedShape = getTopShape(intersects[0].object);
          setSelectedShape(clickedShape);
          isDraggingRef.current = true;
          
          dragOffsetRef.current.copy(clickedShape.position).sub(intersects[0].point);
          
          animateProperty(clickedShape.scale, { x: 1.15, y: 1.15, z: 1.15 }, 150, 'elastic');
          if (clickedShape.material && clickedShape.material.emissiveIntensity !== undefined) {
            clickedShape.material.emissiveIntensity = 1.0;
          }
          
          createImpactEffect(intersects[0].point);
          renderer.domElement.style.cursor = 'grabbing';
        }
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current && selectedShape) {
        isDraggingRef.current = false;
        
        animateProperty(selectedShape.scale, { x: 1, y: 1, z: 1 }, 300, 'bounce');
        if (selectedShape.material && selectedShape.material.emissiveIntensity !== undefined) {
          selectedShape.material.emissiveIntensity = selectedShape.userData.originalEmissive || 0.2;
        }
        
        const velocity = velocitiesRef.current.get(selectedShape.uuid);
        velocity.add(new THREE.Vector3(mouseVelocityRef.current.x, 0, mouseVelocityRef.current.y).multiplyScalar(0.02));
        
        setSelectedShape(null);
        renderer.domElement.style.cursor = 'default';
      }
    };

    const handleDoubleClick = (event) => {
      updateMouse(event);
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(shapesRef.current, true);
      
      if (intersects.length > 0) {
        const shape = getTopShape(intersects[0].object);
        
        // Spin effect
        const targetRotation = {
          x: shape.rotation.x + Math.PI * 4,
          y: shape.rotation.y + Math.PI * 4,
          z: shape.rotation.z + Math.PI * 2
        };
        animateProperty(shape.rotation, targetRotation, 2000, 'elastic');
        
        // Color cycling
        if (shape.material) {
          const originalColor = shape.material.color.clone();
          const colors = [0xff3366, 0x33ff66, 0x3366ff, 0xff6633];
          let colorIndex = 0;
          
          const colorInterval = setInterval(() => {
            shape.material.color.setHex(colors[colorIndex % colors.length]);
            colorIndex++;
            if (colorIndex >= colors.length * 2) {
              shape.material.color.copy(originalColor);
              clearInterval(colorInterval);
            }
          }, 200);
        }
        
        createShockwave(shape.position);
      }
    };

    const handleWheel = (event) => {
      event.preventDefault();
      const delta = event.deltaY * 0.01;
      cameraControlsRef.current.distance += delta;
      cameraControlsRef.current.distance = Math.max(8, Math.min(50, cameraControlsRef.current.distance));
    };

    const handleKeyDown = (event) => {
      switch (event.key.toLowerCase()) {
        case '1':
          setInteractionMode('orbit');
          break;
        case '2':
          setInteractionMode('drag');
          break;
        case ' ':
          event.preventDefault();
          shapesRef.current.forEach((shape, index) => {
            const velocity = velocitiesRef.current.get(shape.uuid);
            velocity.add(new THREE.Vector3(
              (Math.random() - 0.5) * 0.5,
              Math.random() * 0.3,
              (Math.random() - 0.5) * 0.5
            ));
            setTimeout(() => createShockwave(shape.position), index * 100);
          });
          break;
        case 'r':
          const positions = [
            new THREE.Vector3(-6, 3, 0),
            new THREE.Vector3(6, -2, 3),
            new THREE.Vector3(0, 4, -4),
            new THREE.Vector3(-3, -4, 5),
            new THREE.Vector3(4, 5, -3),
            new THREE.Vector3(-5, 1, -5)
          ];
          
          shapesRef.current.forEach((shape, index) => {
            if (positions[index]) {
              animateProperty(shape.position, positions[index], 1500, 'bounce');
              velocitiesRef.current.get(shape.uuid).set(0, 0, 0);
            }
          });
          break;
        case 'c':
          setShowConnections(!showConnections);
          break;
        case 'p':
          setPhysicsEnabled(!physicsEnabled);
          break;
      }
    };

    // Event listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('dblclick', handleDoubleClick);
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      frameId.current = requestAnimationFrame(animate);
      
      const elapsedTime = clock.getElapsedTime();
      const deltaTime = clock.getDelta();
      
      // Camera controls
      if (interactionMode === 'orbit') {
        const targetX = cameraControlsRef.current.mouseX * 12;
        const targetY = cameraControlsRef.current.mouseY * 8 + 10;
        const distance = cameraControlsRef.current.distance;
        
        camera.position.x += (targetX - camera.position.x) * 0.03;
        camera.position.y += (targetY - camera.position.y) * 0.03;
        
        const currentDistance = camera.position.length();
        const newDistance = currentDistance + (distance - currentDistance) * 0.05;
        camera.position.normalize().multiplyScalar(newDistance);
        camera.lookAt(0, 0, 0);
      }

      // Physics simulation
      if (physicsEnabled) {
        shapesRef.current.forEach((shape, index) => {
          if (shape === selectedShape && isDraggingRef.current) return;
          
          const velocity = velocitiesRef.current.get(shape.uuid);
          
          velocity.y -= 0.003 * deltaTime;
          velocity.multiplyScalar(0.995);
          
          const floatOffset = Math.sin(elapsedTime * (0.5 + index * 0.1)) * 0.002;
          shape.position.y += floatOffset;
          
          shape.rotation.x += velocity.length() * 0.1 * deltaTime;
          shape.rotation.y += velocity.length() * 0.15 * deltaTime;
          
          shape.position.add(velocity.clone().multiplyScalar(deltaTime * 60));
          
          const bounds = 12;
          if (Math.abs(shape.position.x) > bounds) {
            shape.position.x = Math.sign(shape.position.x) * bounds;
            velocity.x *= -0.7;
            createImpactEffect(shape.position);
          }
          if (Math.abs(shape.position.z) > bounds) {
            shape.position.z = Math.sign(shape.position.z) * bounds;
            velocity.z *= -0.7;
            createImpactEffect(shape.position);
          }
          if (shape.position.y < -8) {
            shape.position.y = -8;
            velocity.y = Math.abs(velocity.y) * 0.8;
            createImpactEffect(shape.position);
          }
          
          if (!isDraggingRef.current) {
            checkInterlocking(shape);
          }
        });
      }

      pointLight1.position.x = Math.cos(elapsedTime * 0.3) * 12;
      pointLight1.position.z = Math.sin(elapsedTime * 0.3) * 12;
      pointLight2.position.x = Math.cos(elapsedTime * 0.2 + Math.PI) * 8;
      pointLight2.position.z = Math.sin(elapsedTime * 0.2 + Math.PI) * 8;

      connectionsRef.current.forEach(connection => {
        if (connection.userData && connection.userData.shape1 && connection.userData.shape2) {
          const points = [
            connection.userData.shape1.position.clone(),
            connection.userData.shape2.position.clone()
          ];
          connection.geometry.setFromPoints(points);
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('dblclick', handleDoubleClick);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      if (frameId.current) cancelAnimationFrame(frameId.current);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [selectedShape, interactionMode, showConnections, physicsEnabled]);

  return <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />;
}

function createShapes() {
  const shapes = [];

  const torusGeometry = new THREE.TorusGeometry(2.5, 0.8, 20, 40);
  const torusMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x00ffaa,
    metalness: 0.9,
    roughness: 0.1,
    transmission: 0.4,
    thickness: 0.8,
    clearcoat: 1.0,
    emissive: 0x002211,
    emissiveIntensity: 0.3
  });
  const torus = new THREE.Mesh(torusGeometry, torusMaterial);
  torus.position.set(-6, 3, 0);
  torus.castShadow = true;
  torus.receiveShadow = true;
  torus.userData = { originalEmissive: 0.3, type: 'torus' };
  shapes.push(torus);

  const cubeGeometry = new THREE.BoxGeometry(3, 3, 3);
  const cubeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x6600ff,
    metalness: 0.3,
    roughness: 0.1,
    transmission: 0.8,
    thickness: 1.0,
    clearcoat: 1.0,
    emissive: 0x220066,
    emissiveIntensity: 0.2
  });
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.position.set(6, -2, 3);
  cube.castShadow = true;
  cube.receiveShadow = true;
  cube.userData = { originalEmissive: 0.2, type: 'cube' };
  shapes.push(cube);

  const dodecaGeometry = new THREE.DodecahedronGeometry(2.2);
  const dodecaMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x33aaff,
    metalness: 0.8,
    roughness: 0.2,
    transmission: 0.5,
    thickness: 0.8,
    clearcoat: 1.0,
    emissive: 0x001144,
    emissiveIntensity: 0.25
  });
  const dodeca = new THREE.Mesh(dodecaGeometry, dodecaMaterial);
  dodeca.position.set(0, 4, -4);
  dodeca.castShadow = true;
  dodeca.receiveShadow = true;
  dodeca.userData = { originalEmissive: 0.25, type: 'dodecahedron' };
  shapes.push(dodeca);

  const icosaGeometry = new THREE.IcosahedronGeometry(1.8, 1);
  const icosaMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffaa00,
    metalness: 1.0,
    roughness: 0.05,
    emissive: 0x442200,
    emissiveIntensity: 0.5,
    clearcoat: 1.0
  });
  const icosa = new THREE.Mesh(icosaGeometry, icosaMaterial);
  icosa.position.set(-3, -4, 5);
  icosa.castShadow = true;
  icosa.receiveShadow = true;
  icosa.userData = { originalEmissive: 0.5, type: 'icosahedron' };
  shapes.push(icosa);

  const octaGeometry = new THREE.OctahedronGeometry(1.5);
  const octaMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x00ff88,
    metalness: 0.7,
    roughness: 0.2,
    transmission: 0.9,
    thickness: 0.6,
    emissive: 0x002244,
    emissiveIntensity: 0.35,
    clearcoat: 1.0
  });
  const octa = new THREE.Mesh(octaGeometry, octaMaterial);
  octa.position.set(4, 5, -3);
  octa.castShadow = true;
  octa.receiveShadow = true;
  octa.userData = { originalEmissive: 0.35, type: 'octahedron' };
  shapes.push(octa);

  const knotGeometry = new THREE.TorusKnotGeometry(1.5, 0.4, 100, 16);
  const knotMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xff3366,
    metalness: 0.9,
    roughness: 0.1,
    emissive: 0x441122,
    emissiveIntensity: 0.4,
    clearcoat: 1.0
  });
  const knot = new THREE.Mesh(knotGeometry, knotMaterial);
  knot.position.set(-5, 1, -5);
  knot.castShadow = true;
  knot.receiveShadow = true;
  knot.userData = { originalEmissive: 0.4, type: 'knot' };
  shapes.push(knot);

  return shapes;
}

export default function InteractiveApp() {
  const [interactionMode, setInteractionMode] = useState('orbit');
  const [showConnections, setShowConnections] = useState(true);
  const [physicsEnabled, setPhysicsEnabled] = useState(true);
  const [showUI, setShowUI] = useState(false); // UI hidden by default

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: 'linear-gradient(45deg, #0a0f1a 0%, #1a2f3a 30%, #162838 60%, #0f1a2a 100%)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <Scene />
      
      {/* Control Panel - Only show when UI is toggled on */}
      {showUI && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          background: 'rgba(0,0,0,0.4)',
          padding: '15px 20px',
          borderRadius: '10px',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255,255,255,0.2)',
          minWidth: '280px',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#00ffaa', fontSize: '16px' }}>
            🎮 Enhanced Interactive Controls
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#ffaa00' }}>Mode Selection:</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['orbit', 'drag'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setInteractionMode(mode)}
                  style={{
                    padding: '6px 12px',
                    border: interactionMode === mode ? '2px solid #00ffaa' : '1px solid rgba(255,255,255,0.3)',
                    background: interactionMode === mode ? 'rgba(0,255,170,0.2)' : 'rgba(255,255,255,0.1)',
                    color: interactionMode === mode ? '#00ffaa' : '#ffffff',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textTransform: 'capitalize'
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#ffaa00' }}>Physics Options:</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setPhysicsEnabled(!physicsEnabled)}
                style={{
                  padding: '6px 12px',
                  border: physicsEnabled ? '2px solid #00ffaa' : '1px solid rgba(255,255,255,0.3)',
                  background: physicsEnabled ? 'rgba(0,255,170,0.2)' : 'rgba(255,255,255,0.1)',
                  color: physicsEnabled ? '#00ffaa' : '#ffffff',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Physics: {physicsEnabled ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => setShowConnections(!showConnections)}
                style={{
                  padding: '6px 12px',
                  border: showConnections ? '2px solid #00ffaa' : '1px solid rgba(255,255,255,0.3)',
                  background: showConnections ? 'rgba(0,255,170,0.2)' : 'rgba(255,255,255,0.1)',
                  color: showConnections ? '#00ffaa' : '#ffffff',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Connections: {showConnections ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          <div style={{ fontSize: '12px', opacity: 0.9, lineHeight: '1.4' }}>
            <div style={{ marginBottom: '5px' }}>
              <strong style={{ color: '#ffaa00' }}>🖱️ Mouse Controls:</strong>
            </div>
            <div>• <strong>Orbit Mode:</strong> Move mouse to rotate camera</div>
            <div>• <strong>Drag Mode:</strong> Click & drag shapes around</div>
            <div>• <strong>Double-click:</strong> Spin shape with color effects</div>
            <div>• <strong>Scroll:</strong> Zoom in/out</div>
            <div>• <strong>Hover:</strong> Shapes glow and create ripples</div>
            
            <div style={{ marginTop: '10px', marginBottom: '5px' }}>
              <strong style={{ color: '#ffaa00' }}>⌨️ Keyboard Shortcuts:</strong>
            </div>
            <div>• <strong>1/2:</strong> Switch between orbit/drag modes</div>
            <div>• <strong>Space:</strong> Explosion effect - scatter all shapes</div>
            <div>• <strong>R:</strong> Reset shapes to original positions</div>
            <div>• <strong>C:</strong> Toggle connection lines</div>
            <div>• <strong>P:</strong> Toggle physics simulation</div>
          </div>
        </div>
      )}

      {/* Status Panel - Only show when UI is toggled on */}
      {showUI && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          color: '#ffffff',
          fontFamily: 'monospace',
          fontSize: '12px',
          background: 'rgba(0,0,0,0.4)',
          padding: '10px 15px',
          borderRadius: '8px',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255,255,255,0.2)',
          textAlign: 'right',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{ color: '#00ffaa', marginBottom: '5px' }}>
            🎯 Mode: <span style={{ color: '#ffffff', textTransform: 'capitalize' }}>{interactionMode}</span>
          </div>
          <div style={{ color: '#ffaa00', marginBottom: '5px' }}>
            ⚡ Physics: <span style={{ color: '#ffffff' }}>{physicsEnabled ? 'Active' : 'Disabled'}</span>
          </div>
          <div style={{ color: '#ff6699' }}>
            🔗 Connections: <span style={{ color: '#ffffff' }}>{showConnections ? 'Visible' : 'Hidden'}</span>
          </div>
        </div>
      )}

      {/* Features Panel - Only show when UI is toggled on */}
      {showUI && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          background: 'rgba(0,0,0,0.3)',
          padding: '10px 15px',
          borderRadius: '6px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          maxWidth: '320px',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{ color: '#00ffaa', fontWeight: 'bold', marginBottom: '5px' }}>
            🌌 Space Environment Features:
          </div>
          <div style={{ marginBottom: '3px' }}>• <strong>3000+ Animated Stars:</strong> Multi-colored starfield with depth</div>
          <div style={{ marginBottom: '3px' }}>• <strong>Nebula Clouds:</strong> 5 animated cosmic gas clouds</div>
          <div style={{ marginBottom: '3px' }}>• <strong>Cosmic Dust:</strong> Floating particles throughout space</div>
          <div style={{ marginBottom: '3px' }}>• <strong>Distant Galaxies:</strong> Slowly rotating spiral formations</div>
          <div style={{ marginBottom: '3px' }}>• <strong>Deep Space Fog:</strong> Atmospheric depth and mystery</div>
          <div>• <strong>Dynamic Lighting:</strong> Cosmic illumination effects</div>
        </div>
      )}

      {/* UI Toggle Button - Always visible in bottom right */}
      <button
        onClick={() => setShowUI(!showUI)}
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.3)',
          background: showUI 
            ? 'rgba(255,100,100,0.8)' 
            : 'rgba(0,255,170,0.8)',
          color: '#ffffff',
          cursor: 'pointer',
          fontSize: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          zIndex: 1000
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
        }}
        title={showUI ? 'Hide Controls' : 'Show Controls'}
      >
        {showUI ? '✕' : 'ℹ️'}
      </button>

      {/* Add CSS for fade-in animation */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}