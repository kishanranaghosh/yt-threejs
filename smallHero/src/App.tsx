import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import "./App.css";

// Path is relative to the `public/` folder, served from the site root.
const MODEL_URL = "DamagedHelmet.gltf";

// Dispose every texture/material on a loaded model to free GPU memory.
function disposeModel(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      const materials = Array.isArray(obj.material)
        ? obj.material
        : [obj.material];
      for (const material of materials) {
        for (const key of Object.keys(material)) {
          const value = (material as unknown as Record<string, unknown>)[key];
          if (value && (value as THREE.Texture).isTexture) {
            (value as THREE.Texture).dispose();
          }
        }
        material.dispose();
      }
    }
  });
}

function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;

    // --- Scene ---
    const scene = new THREE.Scene();

    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0, 3.5);

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    mount.appendChild(renderer.domElement);

    // --- Environment + lighting (required so metallic PBR surfaces aren't black) ---
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;

    const keyLight = new THREE.DirectionalLight(0xffffff, 2);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    // --- Orbit controls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // smooth, inertial camera movement
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.5;
    controls.maxDistance = 12;

    // --- Keep the view correct on window resize ---
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // --- Animation loop (delta-time based for frame-rate independence) ---
    let model: THREE.Object3D | null = null;
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const delta = clock.getDelta();
      if (model) model.rotation.y += delta * 0.5; // gentle auto-spin

      controls.update();
      renderer.render(scene, camera);
    });

    // --- Load the glTF model ---
    const loader = new GLTFLoader();
    loader.load(
      MODEL_URL,
      (gltf) => {
        if (disposed) return;
        model = gltf.scene;

        // Center on the origin and normalize scale to a ~2-unit bounding box.
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        model.scale.setScalar(2 / maxDim);

        scene.add(model);
        setStatus("ready");
      },
      undefined,
      (error) => {
        if (disposed) return;
        console.error("Failed to load model:", error);
        setStatus("error");
      },
    );

    // --- Cleanup on unmount (also runs under StrictMode's double-invoke) ---
    return () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      if (model) disposeModel(model);
      scene.environment = null;
      envRT.dispose();
      pmrem.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      {status === "loading" && (
        <p style={overlayStyle}>Loading model…</p>
      )}
      {status === "error" && (
        <p style={overlayStyle}>
          Could not load <code>{MODEL_URL}</code>. Make sure it (and its
          referenced <code>.bin</code>/textures) exists in <code>public/</code>.
        </p>
      )}
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "grid",
  placeItems: "center",
  margin: 0,
  color: "#fff",
  font: "500 16px/1.5 system-ui, sans-serif",
  textAlign: "center",
  pointerEvents: "none",
};

export default App;
