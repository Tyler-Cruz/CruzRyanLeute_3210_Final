import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaaaaa); // Lighter background color for brightness

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(0, 15, 30); // Higher position to view the city
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);
controls.update();

// Ground Plane
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100), // Large ground for the city
  new THREE.MeshStandardMaterial({ color: 0x444444 }) // Darker ground to contrast with roads
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Load Road Texture
const textureLoader = new THREE.TextureLoader();
const roadTexture = textureLoader.load('./road_texture.jpg'); // Update with the correct path to your texture file
roadTexture.wrapS = THREE.RepeatWrapping;
roadTexture.wrapT = THREE.RepeatWrapping;
roadTexture.repeat.set(1, 20); // Adjust to repeat texture along the road length

// Main Road
const mainRoad = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 100), // Wide and long main road
  new THREE.MeshStandardMaterial({ map: roadTexture })
);
mainRoad.rotation.x = -Math.PI / 2;
mainRoad.position.set(0, 0.01, 0);
mainRoad.receiveShadow = true;
scene.add(mainRoad);

// Side Roads
const sideRoad1 = new THREE.Mesh(
  new THREE.PlaneGeometry(4, 40), // Smaller road
  new THREE.MeshStandardMaterial({ map: roadTexture })
);
sideRoad1.rotation.x = -Math.PI / 2;
sideRoad1.position.set(-7, 0.01, -30); // Positioning relative to the main road
sideRoad1.receiveShadow = true;
scene.add(sideRoad1);

const sideRoad2 = new THREE.Mesh(
  new THREE.PlaneGeometry(4, 40), // Smaller road
  new THREE.MeshStandardMaterial({ map: roadTexture })
);
sideRoad2.rotation.x = -Math.PI / 2;
sideRoad2.position.set(7, 0.01, 30); // Positioning relative to the main road
sideRoad2.receiveShadow = true;
scene.add(sideRoad2);

// Street Lighting
const streetLight1 = new THREE.PointLight(0xffffff, 1, 30); // Bright streetlights
streetLight1.position.set(-7, 10, -20);
scene.add(streetLight1);

const streetLight2 = new THREE.PointLight(0xffffff, 1, 30);
streetLight2.position.set(7, 10, 20);
scene.add(streetLight2);

// Add Ambient Light for General Brightness
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // General brightness
scene.add(ambientLight);

// Spot Light for Directional Brightness
const spotLight = new THREE.SpotLight(0xffffff, 2); // Stronger light for overall illumination
spotLight.position.set(0, 50, 50);
spotLight.castShadow = true;
scene.add(spotLight);

// Placeholder for Buildings
const buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
for (let i = 0; i < 5; i++) {
  const building = new THREE.Mesh(
    new THREE.BoxGeometry(5, 15, 5),
    buildingMaterial
  );
  building.position.set(-20 + i * 10, 7.5, -40); // Row of buildings
  building.castShadow = true;
  scene.add(building);
}
let carMesh = null;
const movement = { forward: false, backward: false, left: false, right: false }; // Track movement state
const speed = 0.2; // Movement speed
const rotationSpeed = 0.05; // Rotation speed

// GLTF Loader
const loader = new GLTFLoader();
loader.setPath('./bmw_m6_gran_coupe/'); // Ensure this path is correct
loader.load(
  'scene.gltf',
  (gltf) => {
    console.log('Model successfully loaded:', gltf.scene);
    carMesh = gltf.scene;
    carMesh.scale.set(10, 10, 10);
    scene.add(carMesh);
  },
  (xhr) => {
    console.log(`Loading progress: ${(xhr.loaded / xhr.total) * 100}%`);
  },
  (error) => {
    console.error('Error loading model:', error);
  }
);

// event Listeners for keyboard input
// WASD controls for moving car around
window.addEventListener('keydown', (event) => {
  switch (event.key.toLowerCase()) {
    case 'w':
      movement.forward = true;
      break;
    case 's':
      movement.backward = true;
      break;
    case 'a':
      movement.left = true;
      break;
    case 'd':
      movement.right = true;
      break;
  }
});

window.addEventListener('keyup', (event) => {
  switch (event.key.toLowerCase()) {
    case 'w':
      movement.forward = false;
      break;
    case 's':
      movement.backward = false;
      break;
    case 'a':
      movement.left = false;
      break;
    case 'd':
      movement.right = false;
      break;
  }
});

// car movement Update Function
function updateCarMovement() {
  if (!carMesh) return;

  if (movement.forward) {
    carMesh.translateZ(-speed); // move forward
  }
  if (movement.backward) {
    carMesh.translateZ(speed); // move backward
  }
  if (movement.left) {
    carMesh.rotation.y += rotationSpeed; // rotate left
  }
  if (movement.right) {
    carMesh.rotation.y -= rotationSpeed; // rotate right
  }
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Tone Mapping to Enhance Brightness
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 2.0; // Increase exposure to brighten the scene

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  updateCarMovement();
  renderer.render(scene, camera);
}

animate();
