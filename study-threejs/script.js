// scence
// camera
// mesh -> geometry and material
// renderer
// req animation frame
import * as THREE from "three";
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  70,
);
camera.position.z = 5;
// camera.position.x = 2;
// camera.position.y = 1;
scene.add(camera);

let box = new THREE.BoxGeometry(1, 1, 1);
let material = new THREE.MeshBasicMaterial({ color: "red", antialias: true });
let mesh = new THREE.Mesh(box, material);

// mesh.position.x = 1;
// mesh.position.y = 1;

// mesh.position.z = 2;
// mesh.rotation.x = 0.5;
// mesh.scale.x = 2

mesh.rotation.y = Math.PI * 0.25;
scene.add(mesh);

let renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("canvas"),
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

renderer.render(scene, camera);
let clock = new THREE.Clock();

(function animate() {
  requestAnimationFrame(animate);
  mesh.rotation.y += clock.getElapsedTime();
  // mesh.rotation.z += clock.getElapsedTime();
  renderer.render(scene, camera);
})();
