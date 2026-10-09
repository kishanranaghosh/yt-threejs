import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import "./App.css";

// Rotation speed in radians/second (≈ the original 0.01/frame at 60fps).
const ROTATION_SPEED = 0.6;

function App() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // --- Scene ---
    const scene = new THREE.Scene();

    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.z = 5;

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    // --- Objects ---
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // --- Orbit controls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // smooth, inertial camera movement
    controls.dampingFactor = 0.05;

    // --- Keep the view correct on window resize ---
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // --- Animation loop (delta-time based for frame-rate independence) ---
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const delta = clock.getDelta();

      cube.rotation.x += delta * ROTATION_SPEED;
      cube.rotation.y += delta * ROTATION_SPEED;

      controls.update();
      renderer.render(scene, camera);
    });

    // --- Cleanup on unmount (also runs under StrictMode's double-invoke) ---
    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} />;
}

export default App;
