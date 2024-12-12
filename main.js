import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


// creating renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);


//initializing scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaaaaa);


// initializing camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(0, 20, 50); // adjusted camera position for a more zoomed-out view
camera.lookAt(0, 0, 0);


// initializing controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);
controls.update();



// Add a button to toggle between day and night modes
const button = document.createElement('button');
button.innerText = 'Switch to Night Mode';
button.style.position = 'absolute';
button.style.top = '10px';
button.style.left = '10px';
button.style.zIndex = '1000';
document.body.appendChild(button);


let isDay = true; // current mode
let transitioning = false; 
let transitionStartTime = 0; 
const transitionDuration = 3; 

const clock = new THREE.Clock(); 

// interpolate between two colors
function interpolateColor(color1, color2, t) {
  return color1.clone().lerp(color2, t);
}

// interpolate light intensity
function interpolateIntensity(start, end, t) {
  return start + (end - start) * t;
}

let ambientLight, directionalLight, streetLights = [];

// Function to initialize lights
function initLights() {
  ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(100, 100, 100);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  const gridRows = 4; // number of rows in the grid
  const gridCols = 5; // number of columns in the grid
  const gridSpacing = 200; // distance between lights in the grid
  const lightHeight = 10; //height
  const lightRange = 100; // diameter
  const lightIntensity = 1; // intensity

  for (let i = 0; i < gridRows; i++) {
    for (let j = 0; j < gridCols; j++) {
      const streetLight = new THREE.PointLight(0xffaa33, lightIntensity, lightRange);
      streetLight.position.set(
        i * gridSpacing - (gridRows * gridSpacing) / 2,
        lightHeight,
        j * gridSpacing - (gridCols * gridSpacing) / 2
      );
      scene.add(streetLight);
      streetLights.push(streetLight);
    }
  }
}

initLights();

// key controls for night mode toggle
button.addEventListener('click', () => {
  if (transitioning) return; // Prevent overlapping transitions night-day)
  transitioning = true;
  transitionStartTime = clock.getElapsedTime();
  isDay = !isDay;
  button.innerText = isDay ? 'Switch to Night Mode' : 'Switch to Day Mode';
});


// lighting transition for night mode toggle 
function updateLightingTransition() {
  if (!transitioning) return;

  const elapsedTime = clock.getElapsedTime() - transitionStartTime;
  const t = Math.min(elapsedTime / transitionDuration, 1); 

  if (isDay) {
    //day
    ambientLight.color = interpolateColor(new THREE.Color(0x333333), new THREE.Color(0xffffff), t);
    ambientLight.intensity = interpolateIntensity(0.5, 0.8, t);

    directionalLight.color = interpolateColor(new THREE.Color(0x9999ff), new THREE.Color(0xffffff), t);
    directionalLight.intensity = interpolateIntensity(0.3, 1, t);

    streetLights.forEach((light) => {
      light.intensity = interpolateIntensity(1, 0, t); 
    });

    scene.background = interpolateColor(new THREE.Color(0x000022), new THREE.Color(0x87ceeb), t);
  } else {
    // Transition to night
    ambientLight.color = interpolateColor(new THREE.Color(0xffffff), new THREE.Color(0x333333), t);
    ambientLight.intensity = interpolateIntensity(0.8, 0.5, t);

    directionalLight.color = interpolateColor(new THREE.Color(0xffffff), new THREE.Color(0x9999ff), t);
    directionalLight.intensity = interpolateIntensity(1, 0.3, t);

    streetLights.forEach((light) => {
      light.intensity = interpolateIntensity(0, 2000, t); 
    });

    scene.background = interpolateColor(new THREE.Color(0x87ceeb), new THREE.Color(0x000022), t);
  }

  if (t === 1) transitioning = false; 
}

const hydrants = [];
const hydrantBoundingBoxes = []; // store bounding boxes for collision detection
const hydrantCount = 20; // number of hydrants to place
const hydrantSize = 5; // adjust size 


// function to create fire hydrants
function createFireHydrant(position) {
  // Load the texture
  const textureLoader = new THREE.TextureLoader();
  const hydrantTexture = textureLoader.load('./rough-red-painted-rusty-metal-surface-high-resolution-texture_422666-1344.avif');

  const baseMaterial = new THREE.MeshStandardMaterial({
    map: hydrantTexture,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 1.2, 16), baseMaterial);
  base.position.set(0, 1.2, 0);
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), baseMaterial);
  const connectors = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.5, 16), baseMaterial);
  const topOfTop = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1, 16), baseMaterial);

  topOfTop.position.y = 1.7;
  top.position.set(0, 1.6, 0); // Positioning the top
  connectors.rotation.z = Math.PI / 2; // Laying the connector sideways
  connectors.position.y = 1.5;

  const hydrant = new THREE.Group();
  hydrant.add(base);
  hydrant.add(top);
  hydrant.add(connectors);
  hydrant.add(topOfTop);

  hydrant.scale.set(hydrantSize, hydrantSize, hydrantSize);
  hydrant.position.copy(position);

  scene.add(hydrant);

  // Create bounding box for collision detection
  const boundingBox = new THREE.Box3().setFromObject(hydrant);
  hydrantBoundingBoxes.push(boundingBox);

  return hydrant;
}

// Place hydrants in random positions on the map
const mapSize = 1000; // Assuming map size
for (let i = 0; i < hydrantCount; i++) {
  const position = new THREE.Vector3(
    Math.random() * mapSize - mapSize / 2,
    0, // Ground level
    Math.random() * mapSize - mapSize / 2
  );
  const hydrant = createFireHydrant(position);
  hydrants.push(hydrant);
}

// Function to create explosion particles
function createExplosion(position) {
  const particleCount = 100; 
  const particlesGeometry = new THREE.BufferGeometry();
  const positions = [];
  const velocities = []; 

  for (let i = 0; i < particleCount; i++) {
    positions.push(position.x, position.y, position.z); 
    velocities.push(
      (Math.random() - 0.5) * 10, // Random X velocity
      Math.random() * 10,         // Random Y velocity
      (Math.random() - 0.5) * 10  // Random Z velocity
    );
  }

  particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  particlesGeometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));

  const particlesMaterial = new THREE.PointsMaterial({
    color: 0xff4500, // change color to blue maybe
    size: 0.5,
    transparent: true,
    opacity: 0.8,
  });

  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particles);

  //animate particles
  const explosionDuration = 2; // Duration in seconds
  let elapsed = 0;


  // animating explosion for hydrant 
  function animateExplosion() {
    elapsed += clock.getDelta();
    const positions = particles.geometry.attributes.position.array;
    const velocities = particles.geometry.attributes.velocity.array;

    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += velocities[i / 3 * 3] * 0.1; // X position
      positions[i + 1] += velocities[i / 3 * 3 + 1] * 0.1; // Y position
      positions[i + 2] += velocities[i / 3 * 3 + 2] * 0.1; // Z position
    }

    particles.geometry.attributes.position.needsUpdate = true;

    if (elapsed < explosionDuration) {
      requestAnimationFrame(animateExplosion);
    } else {
      scene.remove(particles); // remove particles after explosion ends
    }
  }

  animateExplosion();
}

// explode and fall when person is hit by car 
function explodeAndFall(person) {
  const explosionDuration = 2; // Duration of explosion and fall in seconds
  const parts = person.children; // Head, body, and skirt
  const velocities = []; // Store random velocities for each part

  parts.forEach(() => {
    velocities.push(
      new THREE.Vector3(
        (Math.random() - 0.5) * 5, // Random X velocity
        Math.random() * 5 + 5, // Upward Y velocity
        (Math.random() - 0.5) * 5 // Random Z velocity
      )
    );
  });

  let elapsed = 0;

// animating explosion of people
  function animateExplosion2() {
    const delta = clock.getDelta();
    elapsed += delta;

    parts.forEach((part, index) => {
      part.position.addScaledVector(velocities[index], delta); // Move parts
      part.rotation.x += Math.random() * 0.1; // Random rotation
      part.rotation.z += Math.random() * 0.1;
    });

    if (elapsed > explosionDuration) {
      scene.remove(person); // Remove person after animation
    } else {
      requestAnimationFrame(animateExplosion);
    }
  }

  animateExplosion2();
}


// function to animate people collisions
function updatePersonCollisions() {
  if (!carMesh) return;

  carBoundingBox.setFromObject(carMesh);

  for (let i = people.length - 1; i >= 0; i--) {
    const personData = people[i];
    const person = personData.object;
    const personBoundingBox = new THREE.Box3().setFromObject(person);

    if (carBoundingBox.intersectsBox(personBoundingBox)) {
      explodeAndFall(person); // trigger explosion and fall animation
      people.splice(i, 1); // remove person from the array
    }
  }
}


// check for collisions
function updateCollisions() {
  if (!carMesh) return;

  const carBoundingBox = new THREE.Box3().setFromObject(carMesh);

  hydrants.forEach((hydrant, index) => {
    const hydrantBoundingBox = hydrantBoundingBoxes[index];

    if (carBoundingBox.intersectsBox(hydrantBoundingBox)) {
      // Trigger explosion
      createExplosion(hydrant.position);

      // Remove hydrant from scene
      scene.remove(hydrant);
      hydrants.splice(index, 1);
      hydrantBoundingBoxes.splice(index, 1);
    }
  });
}

// initializing conditions for rain
let rainParticles = null;
let isRaining = false;

// function to create rain
function createRain() {
  const rainCount = 100000; //how many raindrops there are
  const rainGeometry = new THREE.BufferGeometry();
  const rainVertices = [];

  for (let i = 0; i < rainCount; i++) {
    const x = Math.random() * 20000 - 10000; //adjust where rain is (idk the dimensions of map thingy)
    const y = Math.random() * 100; 
    const z = Math.random() * 200 - 100; 
    rainVertices.push(x, y, z);
  }

  rainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(rainVertices, 3));

  const rainMaterial = new THREE.PointsMaterial({
    color: 0x87CEEB, 
    size: 0.2, //thickness of rain (if we wanna make snow we gotta just copy this and make it bigger, and use white color)
    transparent: true,
  });

  rainParticles = new THREE.Points(rainGeometry, rainMaterial);
  rainParticles.visible = false; 
  scene.add(rainParticles);
}

// rain button 
const rainButton = document.createElement('button');
rainButton.innerText = 'Toggle Rain';
rainButton.style.position = 'absolute';
rainButton.style.top = '120px';
rainButton.style.left = '10px';
rainButton.style.zIndex = '1000';
document.body.appendChild(rainButton);

rainButton.addEventListener('click', () => {
  isRaining = !isRaining;
  rainParticles.visible = isRaining;
});

//rain animation
function updateRain() {
  if (!rainParticles || !isRaining) return;

  const positions = rainParticles.geometry.attributes.position.array;

  for (let i = 1; i < positions.length; i += 3) {
    positions[i] -= 0.5; // raining

    if (positions[i] < 0) {
      positions[i] = 100; // particles to the top
    }
  }

  rainParticles.geometry.attributes.position.needsUpdate = true;
}

//initialize rain particles
createRain();


const people = [];
const personCount = 30;
const peopleBoundingBoxes = [];

// function to create people and make them random colors
function createPerson() {
  const personMaterial = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
  
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), personMaterial);
  const body = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.5), personMaterial);

  const skirt = new THREE.Mesh(new THREE.ConeGeometry(1.25, 1.5, 7), personMaterial); 

  const person = new THREE.Group();
  head.position.set(0, 3, 0);
  body.position.set(0,1.5,0);
  skirt.position.set(0, 0.5, 0)
  person.add(head);
  person.add(body);
  person.add(skirt);
  person.scale.set(4, 4, 4);
  const mapSize = 1000; //just need to figure out how big the map is
  
  person.position.set(
    Math.random() * mapSize - mapSize / 2,
    0.01, 
    Math.random() * mapSize - mapSize / 2);

  scene.add(person);
  return person;
}


// direction and speed of people
for (let i = 0; i < personCount; i++) {
  const person = createPerson();
  people.push({
    object: person,
    direction: new THREE.Vector3(
      Math.random() * 2 - 1,
      0,
      Math.random() * 2 - 1
    ).normalize(), // initial direction
    speed: Math.random() * 0.5 + 0.05, // walking speed
  });
}

// Update people movement
function updatePeople() {
  people.forEach((personData) => {
    const { object, direction, speed } = personData;

    object.position.addScaledVector(direction, speed);

    // Change direction randomly
    if (Math.random() < 0.01) {
      direction.set(
        Math.random() * 2000 - 100,
        0,
        Math.random() * 200 - 100
      ).normalize();
    }

  });
}


// speed controls
let speed = 0.2; //should we make car go faster?? like up the whole range ?

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


// loading car from external file
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


const buildingBoundingBoxes = [];

// loading city from external file
const cLoader = new GLTFLoader();
cLoader.setPath('./full_gameready_city_buildings/')
cLoader.load(
    'scene.gltf',
    (gltf) => {
        console.log('Model successfully loaded:', gltf.scene);
        cityMesh = gltf.scene;
        cityMesh.scale.set(20,20,20);

        //how to scan for bounding boxes
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


// key controls
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

let carBoundingBox = new THREE.Box3();


// function to update movement of car
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


// animate function
function animate() {
  requestAnimationFrame(animate);

  updateCarMovement();
  updateLightingTransition();
  updateRain();
  updatePeople();
  updateCollisions();
  updatePersonCollisions();

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
