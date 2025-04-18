import './style.css'
import * as THREE from 'three';
import { InteractionManager } from 'three.interactive';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Create header
const app = document.getElementById('app')!;
const header = document.createElement('div');
header.className = 'header';
header.innerHTML = `
  <button id="reset-view">Reset View</button>
  <button id="toggle-wireframe">Toggle Wireframe</button>
  <button id="toggle-rotation">Toggle Rotation</button>
  <button id="screenshot">Screenshot</button>
`;
app.appendChild(header);

// Create viewer container
const viewerContainer = document.createElement('div');
viewerContainer.className = 'viewer-container';
app.appendChild(viewerContainer);

// Set up scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(viewerContainer.clientWidth, viewerContainer.clientHeight);
viewerContainer.appendChild(renderer.domElement);

// Set up orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 1;
controls.maxDistance = 50;
controls.maxPolarAngle = Math.PI;

// Set up interaction manager
const interactionManager = new InteractionManager(
  renderer,
  camera,
  renderer.domElement
);

// Set up lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

let currentObject: THREE.Object3D | null = null;
let isRotating = true;

// Function to show error message
function showError(message: string) {
  // Remove any existing error message
  const existingError = document.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }

  // Create and show new error message
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);

  // Remove error message after 5 seconds
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

// Load OBJ model
const loader = new OBJLoader();
loader.load(
  'male_ecorche.obj', // Replace with your model file path
  (object) => {
    currentObject = object;
    
    // Make the object interactive
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        interactionManager.add(child);
        
        // Add click event
        child.addEventListener('click', (event) => {
          console.log('Model clicked!', event);
        });
      }
    });
    
    scene.add(object);
    
    // Center and scale the object
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    object.position.sub(center);
    
    // Adjust camera position
    camera.position.z = 5;
    controls.update();
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  (error) => {
    const errorMessage = 'Error loading model: ' + error.message;
    console.error(errorMessage);
    showError(errorMessage);
  }
);

// Button handlers
document.getElementById('reset-view')?.addEventListener('click', () => {
  if (currentObject) {
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    controls.reset();
  }
});

document.getElementById('toggle-wireframe')?.addEventListener('click', () => {
  if (currentObject) {
    currentObject.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material.wireframe = !child.material.wireframe;
      }
    });
  }
});

document.getElementById('toggle-rotation')?.addEventListener('click', () => {
  isRotating = !isRotating;
  controls.enabled = !isRotating;
});

document.getElementById('screenshot')?.addEventListener('click', () => {
  const dataUrl = renderer.domElement.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = 'model-screenshot.png';
  link.href = dataUrl;
  link.click();
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  if (currentObject && isRotating) {
    currentObject.rotation.y += 0.01;
  }
  
  controls.update();
  interactionManager.update();
  renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
  const width = viewerContainer.clientWidth;
  const height = viewerContainer.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});
