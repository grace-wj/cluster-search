import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import gsap from 'gsap';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 50); 
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#background'),
});

/* set renderer properties */
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.render(scene, camera);

// Set up the composer for post-processing effects
const composer = new EffectComposer(renderer);

// Add the basic render pass
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Set up OutlinePass
const outlinePass = new OutlinePass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    scene,
    camera
);
composer.addPass(outlinePass);

// Change the outline style (optional)
outlinePass.edgeStrength = 5;   // Outline thickness
outlinePass.edgeGlow = 1;       // How much the outline glows
outlinePass.edgeThickness = 2;  // Edge size
outlinePass.pulsePeriod = 0;    // Speed of glow pulse effect, set to 0 for no pulsing
outlinePass.visibleEdgeColor.set('#ffffff');  // Color of the visible edges
outlinePass.hiddenEdgeColor.set('#000000');   // Color of hidden edges

/* add raycaster */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

/* add hover event listener */
window.addEventListener('mousemove', onHover, false);

function onHover(event) {
  // Convert mouse position to normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update the raycaster with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  // Calculate objects intersecting the raycaster
  const intersects = raycaster.intersectObjects(scene.children);

  if (intersects.length > 0) {
    const hoveredObject = intersects[0].object;
    if (hoveredObject.isPlanet) {
      outlinePass.selectedObjects = [hoveredObject]; // Highlight the hovered planet by adding it to OutlinePass's selectedObjects array
    }
  } else {
    // Clear the outline when not hovering over any planet
    outlinePass.selectedObjects = [];
  }
}

/* add click event listener */
window.addEventListener('dblclick', onDoubleClick, false);

function onDoubleClick(event) {
  // Convert mouse position to normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update the raycaster with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  // Calculate objects intersecting the raycaster
  const intersects = raycaster.intersectObjects(scene.children);

  if (intersects.length > 0) {
    // Handle the click event
    const clickedObject = intersects[0].object;
    if (clickedObject.isPlanet) {
      animateCameraToPlanet(clickedObject);
    }
  }
}

// Function to display sidebar
function showSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.style.display = 'block';
  setTimeout(() => {
    sidebar.classList.add('show'); // Add the 'show' class after a tiny delay
  }, 10); // Small delay to ensure transition works
}
// Close the sidebar
function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.remove('show'); // Remove the 'show' class
  setTimeout(() => {
    sidebar.style.display = 'none'; // Set display to none after the transition
  }, 500); // Wait for the transition to complete (0.5s)
  animateCameraToStart()
}

document.getElementById('close-btn').addEventListener('click', () => {
  closeSidebar();
});

function animateCameraToStart() {

  const initialLookPosition = controls.target.clone(); // find initial look position
  const targetLookPosition = new THREE.Vector3(0, 0, 0); // target look position is center

  gsap.to(camera.position, {
    duration: 2,
    x: 0,
    y: 0,
    z: 50,
    onUpdate: function() {
      // Lerp the look-at position between the initial and final positions
      const lerpLookAt = new THREE.Vector3().lerpVectors(initialLookPosition, targetLookPosition, this.progress());
      controls.target.copy(lerpLookAt); // update the OrbitControls target to match the look position
      controls.update(); // ensure OrbitControls respects the new target
      camera.lookAt(lerpLookAt);  // update camera look position
    },
    onComplete: function() {
      controls.target.copy(targetLookPosition);
      controls.update();
      controls.enabled = true; // Re-enable orbit controls to move the camera again
    }
  })
}

function animateCameraToPlanet(object) {
  controls.enabled = false; // disable OrbitControls to stop further movement

  const targetPosition = object.position.clone(); // calculate final camera position as in front of and to the side of object
  targetPosition.x -= 10;
  targetPosition.z += 20;
  const targetLookPosition = object.position.clone(); // calculate final look position as behind and to the side of object
  targetLookPosition.x -= 10;
  targetLookPosition.z -= 30;

  const initialLookPosition = controls.target.clone(); // find initial look position (dictated by orbitcontrols target)


  // GSAP animation to move the camera
  gsap.to(camera.position, {
    duration: 2,
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z,
    onUpdate: function() {
      // Lerp the look-at position between the initial and final positions
      const lerpLookAt = new THREE.Vector3().lerpVectors(initialLookPosition, targetLookPosition, this.progress());
      controls.target.copy(lerpLookAt); // update the OrbitControls target to match the look position
      controls.update(); // ensure OrbitControls respects the new target
      camera.lookAt(lerpLookAt);  // update camera look position
    },
    onComplete: function() {
      controls.target.copy(targetLookPosition);
      camera.lookAt(targetLookPosition);
      controls.update(); // ensure OrbitControls respects the new target
      
      showSidebar();
    }
  });
}

/* add stars at random positions */
function addStar() {
  const starGeo = new THREE.OctahedronGeometry(0.25, 0);
  const starMat = new THREE.MeshBasicMaterial({color: 0xFFFFFF, wireframe: true});
  const star = new THREE.Mesh(starGeo, starMat);

  const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));

  star.position.set(x, y, z);
  star.rotation.set(x, y, z);

  star.isPlanet = false; // mark as non-interactive

  scene.add(star);
}

/* add planets at random positions */
function addMoon() {
  const moonGeo = new THREE.SphereGeometry(2, 32, 16);
  const moonTex = new THREE.TextureLoader().load('moon.jpg');
  moonTex.colorSpace = THREE.SRGBColorSpace;
  const moonMat = new THREE.MeshBasicMaterial({map: moonTex})
  const moon = new THREE.Mesh(moonGeo, moonMat);

  const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));

  moon.position.set(x, y, z);
  moon.rotation.set(x, y, z);

  moon.isPlanet = true;

  scene.add(moon);
}

/* add earth */
const earthGeo = new THREE.SphereGeometry(5, 32, 16);
const earthTex = new THREE.TextureLoader().load('earth.jpg');
earthTex.colorSpace = THREE.SRGBColorSpace;
const earthMat = new THREE.MeshBasicMaterial({map: earthTex})
const earth = new THREE.Mesh(earthGeo, earthMat);
const [earthX, earthY, earthZ] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));
earth.position.set(earthX, earthY, earthZ);

earth.isPlanet = true;

scene.add(earth);

/* add mars */
const marsGeo = new THREE.SphereGeometry(4, 32, 16);
const marsTex = new THREE.TextureLoader().load('mars.jpg');
marsTex.colorSpace = THREE.SRGBColorSpace;
const marsMat = new THREE.MeshBasicMaterial({map: marsTex})
const mars = new THREE.Mesh(marsGeo, marsMat);
const [marsX, marsY, marsZ] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));
mars.position.set(marsX, marsY, marsZ);

mars.isPlanet = true;

scene.add(mars);

/* add sun */
const sunGeo = new THREE.SphereGeometry(10, 32, 16);
const sunTex = new THREE.TextureLoader().load('sun.jpg');
sunTex.colorSpace = THREE.SRGBColorSpace;
const sunMat = new THREE.MeshBasicMaterial({map: sunTex})
const sun = new THREE.Mesh(sunGeo, sunMat);
const [sunX, sunY, sunZ] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));
mars.position.set(sunX, sunY, sunZ);

sun.isPlanet = true;

scene.add(sun);

// Create a new OutlinePass specifically for the sun
const sunOutlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
composer.addPass(sunOutlinePass);

// Add the sun to the sunOutlinePass
sunOutlinePass.selectedObjects = [sun];

// Configure the outline appearance for the sun
sunOutlinePass.edgeStrength = 5; // Intensity of the outline
sunOutlinePass.edgeGlow = 2;     // Soft glow effect
sunOutlinePass.edgeThickness = 10.0; // Thickness of the outline
sunOutlinePass.pulsePeriod = 5;     // No pulsing, keep it constant
sunOutlinePass.visibleEdgeColor.set('#f7a51a'); // White outline
sunOutlinePass.hiddenEdgeColor.set('#000000');  // No hidden edges


/* add background texture */
const spaceTexture = new THREE.TextureLoader().load('night-sky.jpeg');
spaceTexture.colorSpace = THREE.SRGBColorSpace;
scene.background = spaceTexture;

Array(200).fill().forEach(addStar);
Array(10).fill().forEach(addMoon);


/* add grid helper and controls */
//const gridHelper = new THREE.GridHelper(200, 50);
//scene.add(gridHelper);
const controls = new OrbitControls(camera, renderer.domElement);
controls.maxDistance = 80; // Maximum zoom-out distance

/* animate everything */
function animate() {
  requestAnimationFrame(animate);

  earth.rotation.x += 0.001;
  earth.rotation.y += 0.0025;
  earth.rotation.z += 0.001;

  sun.rotation.x -= 0.001;
  sun.rotation.y -= 0.0025;
  sun.rotation.z -= 0.001;

  mars.rotation.x += 0.001;
  mars.rotation.y += 0.0025;

  composer.render();
  //renderer.render(scene, camera);
  controls.update();
}
animate();
