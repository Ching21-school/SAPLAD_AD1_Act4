import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'dat.gui';

// Create the scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); 

// Set up the camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(2, 2, 5);

// Set up the renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); 
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Load the snow texture
const textureLoader = new THREE.TextureLoader();
const snowTexture = textureLoader.load('/textures/snow_texture.jpg'); 

// Add a ground plane with snow texture
const planeGeometry = new THREE.PlaneGeometry(10, 10);
const planeMaterial = new THREE.MeshStandardMaterial({
  map: snowTexture, 
  roughness: 1,     
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.receiveShadow = true;
scene.add(plane);

// Load the GLTF models
const loader = new GLTFLoader();

const models = [
  { path: '/models/Christmas.glb', name: 'Christmas' },
  { path: '/models/Santa.glb', name: 'Santa' },
  { path: '/models/Igloo.glb', name: 'Igloo' },
  { path: '/models/Pine.glb', name: 'Pine' } 
];

models.forEach(modelData => {
  loader.load(
    modelData.path, 
    (gltf) => {
      const model = gltf.scene;
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Set a position for each model to avoid overlapping
      if (modelData.name === 'Christmas') {
        model.position.set(0, 0.3, 0); 
      } else if (modelData.name === 'Santa') {
        model.position.set(3, 0.7, 0); 
        model.scale.set(2, 2, 2);
        model.rotation.y = Math.PI; 
      } else if (modelData.name === 'Igloo') {
        model.position.set(2, 1, -2); 
        model.scale.set(2, 2, 2);
      } else if (modelData.name === 'Pine') { 
        model.position.set(-2, 0, -3); 
        model.scale.set(1, 1, 1);
      }

      scene.add(model);
    },
    (xhr) => console.log(`Model ${(xhr.loaded / xhr.total) * 100}% loaded`),
    (error) => console.error('An error occurred:', error)
  );
});

// Snowflake system
const snowflakes = [];
const snowflakeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

function createSnowflake(size) {
  const snowflake = new THREE.Mesh(new THREE.SphereGeometry(size, 6, 6), snowflakeMaterial);
  snowflake.position.set(
    Math.random() * 10 - 5, 
    Math.random() * 10 + 1, 
    Math.random() * 10 - 5  
  );
  snowflakes.push(snowflake);
  scene.add(snowflake);
}

function updateSnowflakes(speed) {
  snowflakes.forEach((snowflake) => {
    snowflake.position.y -= speed;
    if (snowflake.position.y < 0) {
      snowflake.position.y = Math.random() * 10 + 1;
    }
  });
}

// Populate snowflakes with the initial size
let snowflakeCount = 100;
for (let i = 0; i < snowflakeCount; i++) createSnowflake(0.05); // Default size is 0.05

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; 

const gui = new GUI();
const options = {
  snowflakeSpeed: 0.05,
  snowflakeSize: 0.05,
  snowflakeCount: 100,
  ambientLightIntensity: 0.6,
  directionalLightIntensity: 0.8,
  shadowsEnabled: true,
};

// Update snowflake count
function updateSnowflakeCount() {
  snowflakes.forEach((snowflake) => scene.remove(snowflake));
  snowflakes.length = 0;
  for (let i = 0; i < options.snowflakeCount; i++) createSnowflake(options.snowflakeSize);
}

gui.add(options, 'snowflakeSpeed', 0.01, 0.2).name('Snowflake Speed');
gui.add(options, 'snowflakeSize', 0.01, 0.2).name('Snowflake Size').onChange((value) => {
  // Clear existing snowflakes
  snowflakes.forEach((snowflake) => scene.remove(snowflake));
  snowflakes.length = 0;

  // Recreate snowflakes with new size
  for (let i = 0; i < options.snowflakeCount; i++) createSnowflake(value);
});
gui.add(options, 'snowflakeCount', 50, 500, 10).name('Snowflake Count').onChange(updateSnowflakeCount);
gui.add(options, 'ambientLightIntensity', 0, 1).name('Ambient Light').onChange((value) => {
  ambientLight.intensity = value;
});
gui.add(options, 'directionalLightIntensity', 0, 2).name('Directional Light').onChange((value) => {
  directionalLight.intensity = value;
});
gui.add(options, 'shadowsEnabled').name('Enable Shadows').onChange((value) => {
  renderer.shadowMap.enabled = value;
  directionalLight.castShadow = value;
  plane.receiveShadow = value;
  snowflakes.forEach((snowflake) => {
    snowflake.castShadow = value;
    snowflake.receiveShadow = value;
  });
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update(); 
  updateSnowflakes(options.snowflakeSpeed);
  renderer.render(scene, camera);
}

// Handle resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
