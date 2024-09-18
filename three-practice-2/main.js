import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 30); 
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#background'),
});

/* set renderer properties */
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.render(scene, camera);

/* add raycaster */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

/* add click event listener */
window.addEventListener('click', onClick, false);

function onClick(event) {
  // Convert mouse position to normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update the raycaster with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  // Calculate objects intersecting the raycaster
  const intersects = raycaster.intersectObjects(scene.children);

  if (intersects.length > 0) {
    // Handle the click event (for example, change the cube's color)
    intersects[0].object.material.color.set(0xff0000);  // Change to red on click
    console.log("Object clicked:", intersects[0].object);
  }
}

/* add stars at random positions */
function addStar() {
  const starGeo = new THREE.OctahedronGeometry(0.25, 0);
  const starMat = new THREE.MeshBasicMaterial({color: 0xFFFFFF, wireframe: true});
  const star = new THREE.Mesh(starGeo, starMat);

  const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));

  star.position.set(x, y, z);
  star.rotation.set(x, y, z);
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
scene.add(earth);

/* add mars */
const marsGeo = new THREE.SphereGeometry(4, 32, 16);
const marsTex = new THREE.TextureLoader().load('mars.jpg');
marsTex.colorSpace = THREE.SRGBColorSpace;
const marsMat = new THREE.MeshBasicMaterial({map: marsTex})
const mars = new THREE.Mesh(marsGeo, marsMat);
const [marsX, marsY, marsZ] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));
mars.position.set(marsX, marsY, marsZ);
scene.add(mars);

/* add sun */
const sunGeo = new THREE.SphereGeometry(10, 32, 16);
const sunTex = new THREE.TextureLoader().load('sun.jpg');
sunTex.colorSpace = THREE.SRGBColorSpace;
const sunMat = new THREE.MeshBasicMaterial({map: sunTex})
const sun = new THREE.Mesh(sunGeo, sunMat);
const [sunX, sunY, sunZ] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));
mars.position.set(sunX, sunY, sunZ);
scene.add(sun);


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

  renderer.render(scene, camera);
  controls.update();
}
animate();
