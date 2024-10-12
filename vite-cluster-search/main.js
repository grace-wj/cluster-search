import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import gsap from 'gsap';

const planetInfo = { // sidebar info for each planet
  "Mercury": "Mercury, the closest planet to the Sun, might seem scorching hot, but it’s not the warmest—Venus takes that crown. A day on Mercury lasts an incredible 176 Earth days, which is actually longer than its year. Interestingly, despite its proximity to the Sun, Mercury harbors water ice in craters near its poles that are always in shadow.",
  "Venus": "Venus is an oddball in our solar system because it spins in the opposite direction to most planets, meaning the Sun rises in the west and sets in the east. Shrouded in thick clouds of sulfuric acid, its surface reaches temperatures hot enough to melt lead, making it the hottest planet despite not being closest to the Sun. Even more intriguing, a single day on Venus is longer than its year, since it takes more time to complete a full rotation than it does to orbit the Sun.",
  "Earth": "Earth, our home planet, is the only place we know of that supports life, thanks to its perfect balance of water, atmosphere, and temperature. With 71% of its surface covered by oceans, Earth is affectionately known as the \"Blue Planet.\" Its protective atmosphere not only shields us from harmful solar radiation but also keeps the surface temperature just right for life to thrive.",
  "Mars": "Mars is home to Olympus Mons, the tallest volcano in the solar system, which is nearly three times as high as Mount Everest. Known for its signature red hue due to iron oxide, or rust, covering its surface, the \"Red Planet\" is also a fascinating place for exploration. Mars has two small moons, Phobos and Deimos, which scientists believe might actually be captured asteroids.",
  "Jupiter": "Jupiter, the largest planet in our solar system, is so massive that over 1,300 Earths could fit inside it. Its Great Red Spot is an enormous storm that has been swirling for at least 350 years, possibly even longer. With at least 79 moons, including Ganymede—the biggest moon in the solar system—Jupiter offers a whole mini-world of fascinating natural satellites.",
  "Saturn": "Saturn, famous for its stunning rings made of ice and rock, is a gas giant with a unique claim to fame: it's less dense than water, meaning it could float if you had a big enough ocean. Its rings are not solid, but are made up of billions of particles, some as small as dust, others as large as mountains. Saturn's largest moon, Titan, has a thick atmosphere and lakes of liquid methane, making it a prime target for exploration.",
  "Uranus": "Uranus spins on its side, almost perpendicular to its orbit, likely due to a massive collision in its past. Its pale blue color comes from methane gas in its atmosphere, which filters out red light and reflects blue. Discovered in 1781 by William Herschel, Uranus was the first planet to be found with the aid of a telescope, and it also has a faint ring system similar to Saturn’s.",
  "Neptune": "Neptune, known for its deep blue color, boasts the most powerful winds in the solar system, with speeds that can reach up to 1,500 miles per hour. Like Uranus, its blue hue is caused by methane gas in its atmosphere, though its storms are far more intense. Neptune's largest moon, Triton, is unique for its retrograde orbit, which means it moves in the opposite direction of the planet's rotation, a clue that it may have been captured from the Kuiper Belt.",
  "Sun": "The sun is a massive ball of hot plasma, making up about 99.86% of the solar system’s total mass. It generates energy through nuclear fusion, converting hydrogen into helium at its core, which produces the sunlight we see. Interestingly, the light from the sun takes about eight minutes to reach Earth, meaning we see it as it was in the past!" 
}
const planets = []; // keep track of planet objects to prevent placement overlaps
const minDistance = 25; // set a minimum distance between objects

/* create scene, camera, and renderer */
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

/* Set up composer, outlinepass, and renderpass for post-processing outlines */
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
const outlinePass = new OutlinePass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    scene,
    camera
);
composer.addPass(outlinePass);

// set outline style for hovered objects
outlinePass.edgeStrength = 5;
outlinePass.edgeGlow = 1;
outlinePass.edgeThickness = 2;
outlinePass.pulsePeriod = 0;
outlinePass.visibleEdgeColor.set('#ffffff');
outlinePass.hiddenEdgeColor.set('#000000');

/* add raycaster to identify clicked object */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

/* for outline effect, hover event listener and handler */
window.addEventListener('mousemove', onHover, false);
function onHover(event) {
  // convert mouse position to normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera); // update the raycaster with the camera and mouse position
  const intersects = raycaster.intersectObjects(scene.children); // calculate objects intersecting the raycaster to find clicked object

  if (intersects.length > 0) {
    const hoveredObject = intersects[0].object;
    if (hoveredObject.isClickable) {
      outlinePass.selectedObjects = [hoveredObject]; // highlight the hovered planet
    }
  } else {
    outlinePass.selectedObjects = []; // clear the outline when not hovering over any planet
  }
}
/* for animation, dblclick event listener and handler */
window.addEventListener('dblclick', onDoubleClick, false);
function onDoubleClick(event) {
  // Convert mouse position to normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera); // update the raycaster with the camera and mouse position
  const intersects = raycaster.intersectObjects(scene.children); // calculate objects intersecting the raycaster to find clicked object

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    if (clickedObject.isClickable) { // only animate if object is a clickable planet
      animateCameraToPlanet(clickedObject);
    }
  }
}
/* to close sidebar, onclick listener/handler on exit-btn */
document.getElementById('exit-btn').addEventListener('click', () => {
  closeSidebar();
  animateCameraToStart();
});

/* function to display sidebar */
function showSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.style.display = 'block';
  setTimeout(() => {
    sidebar.classList.add('show'); // show after a small delay to ensure transition works
  }, 10);
}
/* function to hide sidebar */
function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.remove('show');
  setTimeout(() => {
    sidebar.style.display = 'none'; // set display to none after the transition
  }, 500);
}
/* function to update the sidebar content for each planet */
function updateSidebarContent(object) {
  const sidebarHeader = document.getElementById('sidebar-header');
  const sidebarContent = document.getElementById('sidebar-content');
  const exitText = document.getElementById('exit-text');

  const objectName = object.name;
  const objectContent = planetInfo[objectName];

  sidebarHeader.innerHTML = objectName;
  sidebarContent.innerHTML = objectContent;
  exitText.innerHTML = "Exit";
}

/* function that moves to initial camera/look position */
function animateCameraToStart() {
  const initialLookPosition = controls.target.clone(); // find initial look position
  const targetLookPosition = new THREE.Vector3(0, 0, 0); // target look position is center

  gsap.to(camera.position, {
    duration: 2,
    x: 0,
    y: 0,
    z: 50,
    onUpdate: function() {
      // lerp the look-at position between the initial and final positions
      const lerpLookAt = new THREE.Vector3().lerpVectors(initialLookPosition, targetLookPosition, this.progress());
      controls.target.copy(lerpLookAt); // update orbitcontrols target to match the look position
      controls.update(); // ensure orbitcontrols respects the new target
      camera.lookAt(lerpLookAt);  // update camera look position
    },
    onComplete: function() {
      controls.target.copy(targetLookPosition);
      controls.update();
      controls.enabled = true; // allow user to move camera again on completion
    }
  })
}
/* function that moves camera to clicked object and adjusts look position accordingly */
function animateCameraToPlanet(object) {
  controls.enabled = false; // prevent user from moving camera during the transition

  const targetPosition = object.position.clone(); // calculate final camera position as in front of and to the side of object
  targetPosition.x -= 10;
  targetPosition.z += 20;
  const targetLookPosition = object.position.clone(); // calculate final look position as behind and to the side of object
  targetLookPosition.x -= 10;
  targetLookPosition.z -= 30;

  const initialLookPosition = controls.target.clone(); // find initial look position (orbitcontrols target)

  gsap.to(camera.position, {
    duration: 2,
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z,
    onUpdate: function() {
      // lerp the look-at position between the initial and final positions
      const lerpLookAt = new THREE.Vector3().lerpVectors(initialLookPosition, targetLookPosition, this.progress());
      controls.target.copy(lerpLookAt);  // update orbitcontrols target to match the look position
      controls.update(); // ensure OrbitControls respects the new target
      camera.lookAt(lerpLookAt);  // update camera look position
    },
    onComplete: function() {
      controls.target.copy(targetLookPosition);
      camera.lookAt(targetLookPosition);
      controls.update(); // ensure OrbitControls respects the new target
      updateSidebarContent(object);
      showSidebar();
    }
  });
}

/* function to generate a VALID random object position between rangestart and rangeend */
function validRandPosition(rangeStart, rangeEnd) {
  let position;
  let validBool = false;
  while (!validBool) { // make sure the generated position is far enough from other objects
    position = randPositionClosed(rangeStart, rangeEnd);
    validBool = isValid(position);
  }
  return position;
}
/* function to generate a random object position within range */
function randPositionOpen(range) {
  const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(range));
  return new THREE.Vector3(x, y, z);
}
/* function to generate a random object position between rangestart and rangeend */
function randPositionClosed(rangeStart, rangeEnd) {
  const radius = THREE.MathUtils.randFloat(rangeStart, rangeEnd);

  /* generate random spherical coordinates */
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);

  /* convert to cartesian coordinates */
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}
/* returns true if position is far enough away from other objects, false otherwise */
function isValid(position) {
  for (const planet of planets) {
    if (position.distanceTo(planet.position) < minDistance) {
      return false;
    }
  }
  return true;
}

/* add background texture */
const spaceTexture = new THREE.TextureLoader().load('night-sky.jpeg');
spaceTexture.colorSpace = THREE.SRGBColorSpace;
scene.background = spaceTexture;

/* START ADDING OBJECTS */

/* add sun */
const sunGeo = new THREE.SphereGeometry(15, 32, 16);
const sunTex = new THREE.TextureLoader().load('sun.jpg');
sunTex.colorSpace = THREE.SRGBColorSpace;
const sunMat = new THREE.MeshBasicMaterial({map: sunTex})
const sun = new THREE.Mesh(sunGeo, sunMat);

sun.position.set(0, 0, 0);
planets.push(sun);

sun.isClickable = true;
sun.name = "Sun";

// create an outlinepass specifically for the sun
const sunOutlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
composer.addPass(sunOutlinePass);
sunOutlinePass.selectedObjects = [sun];

// set outline style for the sun
sunOutlinePass.edgeStrength = 6;
sunOutlinePass.edgeGlow = 2;
sunOutlinePass.edgeThickness = 12.0;
sunOutlinePass.pulsePeriod = 5;
sunOutlinePass.visibleEdgeColor.set('#f7a51a');
sunOutlinePass.hiddenEdgeColor.set('#000000');

scene.add(sun);

/* add mercury */
const mercuryGeo = new THREE.SphereGeometry(2, 32, 16);
const mercuryTex = new THREE.TextureLoader().load('mercury.jpg');
mercuryTex.colorSpace = THREE.SRGBColorSpace;
const mercuryMat = new THREE.MeshBasicMaterial({map: mercuryTex})
const mercury = new THREE.Mesh(mercuryGeo, mercuryMat);

mercury.position.copy(validRandPosition(14, 28));
planets.push(mercury);

mercury.isClickable = true;
mercury.name = "Mercury";

scene.add(mercury);

/* add venus */
const venusGeo = new THREE.SphereGeometry(2, 32, 16);
const venusTex = new THREE.TextureLoader().load('venus.jpg');
venusTex.colorSpace = THREE.SRGBColorSpace;
const venusMat = new THREE.MeshBasicMaterial({map: venusTex})
const venus = new THREE.Mesh(venusGeo, venusMat);

venus.position.copy(validRandPosition(28, 42));
planets.push(venus);

venus.isClickable = true;
venus.name = "Venus";

scene.add(venus);

/* add earth */
const earthGeo = new THREE.SphereGeometry(4, 32, 16);
const earthTex = new THREE.TextureLoader().load('earth.jpg');
earthTex.colorSpace = THREE.SRGBColorSpace;
const earthMat = new THREE.MeshBasicMaterial({map: earthTex})
const earth = new THREE.Mesh(earthGeo, earthMat);

earth.position.copy(validRandPosition(42, 56));
planets.push(earth);

earth.isClickable = true;
earth.name = "Earth";

scene.add(earth);

/* add mars */
const marsGeo = new THREE.SphereGeometry(4, 32, 16);
const marsTex = new THREE.TextureLoader().load('mars.jpg');
marsTex.colorSpace = THREE.SRGBColorSpace;
const marsMat = new THREE.MeshBasicMaterial({map: marsTex})
const mars = new THREE.Mesh(marsGeo, marsMat);

mars.position.copy(validRandPosition(56, 70));
planets.push(mars);

mars.isClickable = true;
mars.name = "Mars";

scene.add(mars);

/* add jupiter */
const jupiterGeo = new THREE.SphereGeometry(8, 32, 16);
const jupiterTex = new THREE.TextureLoader().load('jupiter.jpeg');
jupiterTex.colorSpace = THREE.SRGBColorSpace;
const jupiterMat = new THREE.MeshBasicMaterial({map: jupiterTex})
const jupiter = new THREE.Mesh(jupiterGeo, jupiterMat);

jupiter.position.copy(validRandPosition(70, 84));
planets.push(jupiter);

jupiter.isClickable = true;
jupiter.name = "Jupiter";

// create an outlinepass specifically for jupiter
const jupiterOutlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
composer.addPass(jupiterOutlinePass);
jupiterOutlinePass.selectedObjects = [jupiter];

// set outline style for jupiter
jupiterOutlinePass.edgeStrength = 3;
jupiterOutlinePass.edgeGlow = 1;
jupiterOutlinePass.edgeThickness = 5.0;
jupiterOutlinePass.pulsePeriod = 0;
jupiterOutlinePass.visibleEdgeColor.set('#e49b0f');
jupiterOutlinePass.hiddenEdgeColor.set('#000000');

scene.add(jupiter);

/* add saturn */
const saturnGeo = new THREE.SphereGeometry(7, 32, 16);
const saturnTex = new THREE.TextureLoader().load('saturn.jpg');
saturnTex.colorSpace = THREE.SRGBColorSpace;
const saturnMat = new THREE.MeshBasicMaterial({map: saturnTex})
const saturn = new THREE.Mesh(saturnGeo, saturnMat);

saturn.position.copy(validRandPosition(84, 98));
planets.push(saturn);

saturn.isClickable = true;
saturn.name = "Saturn";

// create an outlinepass specifically for saturn
const saturnOutlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
composer.addPass(saturnOutlinePass);
saturnOutlinePass.selectedObjects = [saturn];

// set outline style for saturn
saturnOutlinePass.edgeStrength = 3;
saturnOutlinePass.edgeGlow = 1;
saturnOutlinePass.edgeThickness = 5.0;
saturnOutlinePass.pulsePeriod = 0;
saturnOutlinePass.visibleEdgeColor.set('#eedc82');
saturnOutlinePass.hiddenEdgeColor.set('#000000');

scene.add(saturn);

/* add uranus */
const uranusGeo = new THREE.SphereGeometry(6, 32, 16);
const uranusTex = new THREE.TextureLoader().load('uranus.jpeg');
uranusTex.colorSpace = THREE.SRGBColorSpace;
const uranusMat = new THREE.MeshBasicMaterial({map: uranusTex})
const uranus = new THREE.Mesh(uranusGeo, uranusMat);

uranus.position.copy(validRandPosition(98, 112));
planets.push(uranus);

uranus.isClickable = true;
uranus.name = "Uranus";

// create an outlinepass specifically for uranus
const uranusOutlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
composer.addPass(uranusOutlinePass);
uranusOutlinePass.selectedObjects = [uranus];

// set outline style for uranus
uranusOutlinePass.edgeStrength = 3;
uranusOutlinePass.edgeGlow = 1;
uranusOutlinePass.edgeThickness = 5.0;
uranusOutlinePass.pulsePeriod = 0;
uranusOutlinePass.visibleEdgeColor.set('#add8e6'); 
uranusOutlinePass.hiddenEdgeColor.set('#000000');

scene.add(uranus);

/* add neptune */
const neptuneGeo = new THREE.SphereGeometry(5, 32, 16);
const neptuneTex = new THREE.TextureLoader().load('neptune.jpg');
neptuneTex.colorSpace = THREE.SRGBColorSpace;
const neptuneMat = new THREE.MeshBasicMaterial({map: neptuneTex})
const neptune = new THREE.Mesh(neptuneGeo, neptuneMat);

neptune.position.copy(validRandPosition(112, 126));
planets.push(neptune);

neptune.isClickable = true;
neptune.name = "Neptune";

// create an outlinepass specifically for neptune
const neptuneOutlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
composer.addPass(neptuneOutlinePass);
neptuneOutlinePass.selectedObjects = [neptune];

// set outline style for neptune
neptuneOutlinePass.edgeStrength = 2;
neptuneOutlinePass.edgeGlow = 2;
neptuneOutlinePass.edgeThickness = 5.0;
neptuneOutlinePass.pulsePeriod = 0;
neptuneOutlinePass.visibleEdgeColor.set('#0f3cab');
neptuneOutlinePass.hiddenEdgeColor.set('#000000');

scene.add(neptune);

/* function to add a star at a random position */
function addStar() {
  const starGeo = new THREE.OctahedronGeometry(0.25, 0);
  const starMat = new THREE.MeshBasicMaterial({color: 0xFFFFFF, wireframe: true});
  const star = new THREE.Mesh(starGeo, starMat);

  star.position.copy(randPositionOpen(225));
  
  star.isClickable = false; // mark as non-interactive

  scene.add(star);
}
/* function to add an asteroid at a random position */
function addAsteroid() {
  const asteroidGeo = new THREE.SphereGeometry(1, 32, 16);
  const asteroidTex = new THREE.TextureLoader().load('asteroid.jpg');
  asteroidTex.colorSpace = THREE.SRGBColorSpace;
  const asteroidMat = new THREE.MeshBasicMaterial({map: asteroidTex})
  const asteroid = new THREE.Mesh(asteroidGeo, asteroidMat);

  asteroid.position.copy(randPositionOpen(225));

  asteroid.isClickable = false;

  scene.add(asteroid);
}
/* randomly generate stars and asteroids */
Array(350).fill().forEach(addStar);
Array(7).fill().forEach(addAsteroid);

/* END ADDING OBJECTS */

/* add orbitcontrols to allow user navigation */
const controls = new OrbitControls(camera, renderer.domElement);
controls.maxDistance = 150; // maximum zoom-out distance

/* animate everything */
function animate() {
  requestAnimationFrame(animate);
  sun.rotation.y -= 0.002;

  mercury.rotation.y += 0.005;

  venus.rotation.y -= 0.003;

  earth.rotation.y += 0.0025;
  earth.rotation.z += 0.0025;

  mars.rotation.y += 0.003;
  mars.rotation.z += 0.0025;

  jupiter.rotation.y += 0.004;

  saturn.rotation.y += 0.001;
  saturn.rotation.z += 0.003;

  uranus.rotation.x -= 0.005;

  neptune.rotation.y += 0.002;
  neptune.rotation.z += 0.0025;

  composer.render(); // render using composer
  controls.update();
}
animate();
