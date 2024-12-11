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
scene.background = new THREE.Color(0xaaaaaa);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(0, 20, 50); // Adjusted camera position for a more zoomed-out view
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);
controls.update();

// Ground Plane
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: 0x444444 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Load Road Texture
const textureLoader = new THREE.TextureLoader();
const roadTexture = textureLoader.load('./road_texture.jpg');
roadTexture.wrapS = THREE.RepeatWrapping;
roadTexture.wrapT = THREE.RepeatWrapping;
roadTexture.repeat.set(1, 20);

// Main Road
const mainRoad = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 100),
  new THREE.MeshStandardMaterial({ map: roadTexture })
);
mainRoad.rotation.x = -Math.PI / 2;
mainRoad.position.set(0, 0.01, 0);
mainRoad.receiveShadow = true;
scene.add(mainRoad);

// Side Roads
const sideRoad1 = new THREE.Mesh(
  new THREE.PlaneGeometry(4, 40),
  new THREE.MeshStandardMaterial({ map: roadTexture })
);
sideRoad1.rotation.x = -Math.PI / 2;
sideRoad1.position.set(-7, 0.01, -30);
sideRoad1.receiveShadow = true;
scene.add(sideRoad1);

const sideRoad2 = new THREE.Mesh(
  new THREE.PlaneGeometry(4, 40),
  new THREE.MeshStandardMaterial({ map: roadTexture })
);
sideRoad2.rotation.x = -Math.PI / 2;
sideRoad2.position.set(7, 0.01, 30);
sideRoad2.receiveShadow = true;
scene.add(sideRoad2);

// Placeholder for Buildings
const buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
for (let i = 0; i < 5; i++) {
  const building = new THREE.Mesh(
    new THREE.BoxGeometry(5, 15, 5),
    buildingMaterial
  );
  building.position.set(-20 + i * 10, 7.5, -40);
  building.castShadow = true;
  scene.add(building);
}

// Function to remove all lights
function removeLights() {
  scene.traverse((object) => {
    if (object.isLight) {
      scene.remove(object);
    }
  });
}

// Function to set up day lighting
function setupDayLighting() {
  removeLights();

  // Bright ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  // Sunlight (directional light)
  const sunLight = new THREE.DirectionalLight(0xffffff, 1);
  sunLight.position.set(100, 100, 100);
  sunLight.castShadow = true;
  scene.add(sunLight);

  // Set a bright daytime background
  scene.background = new THREE.Color(0x87ceeb); // Sky blue
}

// Function to set up night lighting
function setupNightLighting() {
  removeLights();

  // Dim ambient light
  const ambientLight = new THREE.AmbientLight(0x333333, 0.5);
  scene.add(ambientLight);

  // Moonlight 
  const moonLight = new THREE.DirectionalLight(0x9999ff, 0.3);
  moonLight.position.set(-100, 100, -100);
  scene.add(moonLight);

  // Add streetlights
  const streetLight1 = new THREE.PointLight(0xffaa33, 1, 30);
  streetLight1.position.set(-7, 10, -20);
  scene.add(streetLight1);

  const streetLight2 = new THREE.PointLight(0xffaa33, 1, 30);
  streetLight2.position.set(7, 10, 20);
  scene.add(streetLight2);

  // Set a dark nighttime background
  scene.background = new THREE.Color(0x000022); // Dark blue
}

// Add a button to toggle between day and night modes
const button = document.createElement('button');
button.innerText = 'Switch to Night Mode';
button.style.position = 'absolute';
button.style.top = '10px';
button.style.left = '10px';
button.style.zIndex = '1000';
document.body.appendChild(button);

//current mode
let isDay = true;


button.addEventListener('click', () => {
  if (isDay) {
    setupNightLighting();
    button.innerText = 'Switch to Day Mode';
  } else {
    setupDayLighting();
    button.innerText = 'Switch to Night Mode';
  }
  isDay = !isDay;
});

// Initial lighting setup
setupDayLighting();

let speed = 0.2;

const speedControl = document.createElement('input');
speedControl.type = 'range';
speedControl.min = '0.1';
speedControl.max = '2.0';
speedControl.step = '0.1';
speedControl.value = '0.2';
speedControl.style.position = 'absolute';
speedControl.style.top = '80px'; 
speedControl.style.left = '10px';
speedControl.style.zIndex = '1000';

const speedLabel = document.createElement('div');
speedLabel.style.position = 'absolute';
speedLabel.style.top = '50px'; 
speedLabel.style.left = '10px';
speedLabel.style.zIndex = '1000';
speedLabel.style.color = '#fff';
speedLabel.style.backgroundColor = '#333';
speedLabel.style.padding = '5px';
speedLabel.style.borderRadius = '5px';
speedLabel.textContent = `Speed: ${speedControl.value}`;

document.body.appendChild(speedControl);
document.body.appendChild(speedLabel);

// Slider speed
speedControl.addEventListener('input', (event) => {
  speed = parseFloat(event.target.value); 
  speedLabel.textContent = `Speed: ${speed}`; 
});

let carMesh = null;
const movement = { forward: false, backward: false, left: false, right: false };
const rotationSpeed = 0.05;

const loader = new GLTFLoader();
loader.setPath('./bmw_m6_gran_coupe/');
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

//adding city
let cityMesh = null;

// Collision detection variables
const buildingBoundingBoxes = [];
let carBoundingBox = new THREE.Box3();

const cLoader = new GLTFLoader();
cLoader.setPath('./full_gameready_city_buildings/');
cLoader.load(
    'scene.gltf',
    (gltf) => {
        console.log('Model successfully loaded:', gltf.scene);
        cityMesh = gltf.scene;
        cityMesh.scale.set(20,20,20);

        //how to scan for bounding boxes??
        cityMesh.traverse((child) => {
          if (child.isMesh) {
            const boundingBox = new THREE.Box3().setFromObject(child);
            buildingBoundingBoxes.push(boundingBox);
          }
        });

        scene.add(cityMesh);
    },
    (xhr) => {
        console.log(`Loading progress: ${(xhr.loaded / xhr.total) * 100}`);
    },
    (error) => {
        console.error('Error loading model:', error);
    }
);


window.addEventListener('keydown', (event) => {
  switch (event.key.toLowerCase()) {
    case 's':
      movement.forward = true;
      break;
    case 'w':
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
    case 's':
      movement.forward = false;
      break;
    case 'w':
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

function updateCarMovement() {
  if (!carMesh) return;

  if (movement.forward) {
    carMesh.translateZ(-speed);
  }
  if (movement.backward) {
    carMesh.translateZ(speed);
  }
  if (movement.left) {
    carMesh.rotation.y += rotationSpeed;
  }
  if (movement.right) {
    carMesh.rotation.y -= rotationSpeed;
  }
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 2.0;

function animate() {
  requestAnimationFrame(animate);

  updateCarMovement();

  if (carMesh) {
    const carPosition = new THREE.Vector3();
    carMesh.getWorldPosition(carPosition);

    
    const offset = new THREE.Vector3(0, 30, -55); //camera angle and such
    offset.applyQuaternion(carMesh.quaternion);
    const cameraPosition = carPosition.clone().add(offset);

    camera.position.copy(cameraPosition);
    camera.lookAt(carPosition); 
  }

  renderer.render(scene, camera);
}

animate();
