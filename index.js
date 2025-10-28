import * as THREE from 'three';
import { NRRDLoader } from 'three/addons/loaders/NRRDLoader.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { HTMLMesh } from 'three/addons/interactive/HTMLMesh.js';
import { InteractiveGroup } from 'three/addons/interactive/InteractiveGroup.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import { VolumeShader } from './shaders/VolumeShader.js';

let scene, camera, renderer;
let rotatingGroup;
let volumeCenter;
let thresholdUniformRefs = {};
let volumeMaterials = {};
let organTransformsGuiMesh, organDataGuiMesh;
let controller1, controller2;
let group; // GUI group

// PARAMETERS
let VOLUME_PATH;
VOLUME_PATH = './data/examples/worm.nrrd';
VOLUME_PATH = './data/examples/stent.nrrd';
// VOLUME_PATH = './data/examples/heart_256.nrrd';
// VOLUME_PATH = './data/examples/eye_512.nrrd';

const ROTATIONSPEED = 0.00;
const FOV = 80;
const HIDEGUI = false;
const SCALE_COEFF = 0.5;

const vrPosition = new THREE.Vector3(0, 1.7, 0);
const vrDirection = new THREE.Vector3(0, 0, -1);

// GUI + data config
const DISTANCE = 170;
const isoThreshold = 0.;
const rotation = new THREE.Euler(90 * Math.PI / 180, 0 * Math.PI / 180, 0);


const organParams = {
  threshold: isoThreshold,
  scale: 1,
  rotLR: 0,
  rotUD: 0,
  colormap: 1,
  useIsoSurface: 1,
}

const cmtextures = {
  4: new THREE.TextureLoader().load('textures/cm_viridis.png'),
  3: new THREE.TextureLoader().load('textures/cm_plasma.png'),
  2: new THREE.TextureLoader().load('textures/cm_inferno.png'),
  1: new THREE.TextureLoader().load('textures/cm_turbo.png'),
};

// =======================================
// Init
// =======================================

init();
animate();

function init() {
  // Setup scene
  scene = new THREE.Scene();
  initializeCenter(DISTANCE);

  // Setup camera
  camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 0.1, 5000);
  camera.position.copy(vrPosition);
  camera.lookAt(volumeCenter);

  // Setup light & environment
  setupEnvironmentLighting();

  // Load volumetric data
  rotatingGroup = new THREE.Group(); // Add rotating group to enable transforms
  scene.add(rotatingGroup);
  addVolume(VOLUME_PATH, volumeCenter, rotatingGroup);

  // Add auxiliary scene objects
  setupSceneObjects();

  // Add XR button and XR controllers
  setupXRButton();
  setupControllers();

  // Add GUI
  setupOrganGUIs();

  // Add credits
  setupCredits(renderer);
  
  // On window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function animate() {
  renderer.setAnimationLoop(() => {
    // Rotate the volumes
    rotatingGroup.rotation.x += ROTATIONSPEED;

    // Update the GUIs
    if (organTransformsGuiMesh) organTransformsGuiMesh.material.map.update();
    if (organDataGuiMesh) organDataGuiMesh.material.map.update();

    renderer.render(scene, camera);
  });
}


// =======================================
// Volume Loading & Material Setup
// =======================================

function initializeCenter(distance) {
  const center = new THREE.Vector3(0, 1.7, 0);
  center.z -= distance;
  volumeCenter = center;
}

function addVolume(volumePath, center, rotateGroup) {
  const threshold = isoThreshold;
  organParams.threshold = threshold;
  const [cx, cy, cz] = center;

  new NRRDLoader().load(volumePath, (volume) => {
    const sx = volume.xLength;
    const sy = volume.yLength;
    const sz = volume.zLength;
    const texture = new THREE.Data3DTexture(volume.data, sx, sy, sz);
    texture.format = THREE.RedFormat;
    texture.type = THREE.FloatType;
    texture.minFilter = texture.magFilter = THREE.LinearFilter;
    texture.unpackAlignment = 1;
    texture.needsUpdate = true;

    const shader = VolumeShader;
    const uniforms = THREE.UniformsUtils.clone(shader.uniforms);
    uniforms['u_data'].value = texture;
    uniforms['u_size'].value.set(sx, sy, sz);
    uniforms['u_clim'].value.set(0, 1);
    uniforms['u_renderstyle'].value = organParams.useIsoSurface;
    uniforms['u_renderthreshold'].value = organParams.threshold;
    uniforms['u_cmdata'].value = cmtextures[organParams.colormap];

    thresholdUniformRefs = uniforms['u_renderthreshold'];

    const geometry = new THREE.BoxGeometry(sx, sy, sz);
    geometry.translate(sx / 2, sy / 2, sz / 2);
    volumeMaterials = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
      side: THREE.BackSide
    });
    const mesh = new THREE.Mesh(geometry, volumeMaterials);
    mesh.position.set(-sx / 2, -sy / 2, -sz / 2);

    // === Create group hierarchy ===
    const yawGroup = new THREE.Group();
    const placingGroup = new THREE.Group();

    scene.add(yawGroup);
    yawGroup.add(rotateGroup);
    rotateGroup.add(placingGroup);
    placingGroup.add(mesh);

    // === Positioning ===
    yawGroup.position.set(cx, cy, cz);
    yawGroup.lookAt(vrPosition); // Make it face the camera

    // === Apply fixed organ-specific rotation to placingGroup ===
    placingGroup.rotation.copy(rotation);

    // Scale
    const organScale = organParams.scale * SCALE_COEFF;
    rotatingGroup.scale.set(organScale, organScale, organScale);
  });
}


// =======================================
// Scene Objects
// =======================================

function setupSceneObjects() {
  const floorRadius = 2;
  addCylindricalFloor(scene, floorRadius, 0.1, 64, 10);
};

function addCylindricalFloor(scene, radius, height, radialSegments, gridLines) {
  // 1. Cylinder floor (grey)
  const cylinderGeometry = new THREE.CylinderGeometry(radius, radius, height, radialSegments);
  const cylinderMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
  const metallicMaterial = new THREE.MeshStandardMaterial({
    color: 0x888888,       // base grey color
    metalness: 0.6,         // fully metallic
    roughness: 0.2          // low roughness = shinier
  });
  const cylinder = new THREE.Mesh(cylinderGeometry, metallicMaterial);
  cylinder.position.y = -height / 2; // So top surface lies at y=0
  scene.add(cylinder);

  // 2. Grid circle on top face (white edges)
  const num_circles = 5;
  for (let i = 1; i < num_circles+1; i++) {
    const circleGeometry = new THREE.CircleGeometry(i * radius / num_circles, radialSegments);
    circleGeometry.rotateX(-Math.PI / 2); // face up
    const circleEdges = new THREE.EdgesGeometry(circleGeometry);
    const circleLine = new THREE.LineSegments(
      circleEdges,
      new THREE.LineBasicMaterial({ color: 0xffffff })
    );
    circleLine.position.y = 0.01; // Slightly above the floor to avoid z-fighting
    scene.add(circleLine);
  }

  // 3. Radial lines (white)
  const center = new THREE.Vector3(0, 0.011, 0); // Slightly above for visibility
  for (let i = 0; i < gridLines; i++) {
    const angle = (i / gridLines) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    const points = [center.clone(), new THREE.Vector3(x, center.y, z)];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xffffff }));
    scene.add(line);
  }
}


// =======================================
// Environment Lighting 
// =======================================
function setupEnvironmentLighting() {
  // Lighting
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(0, 1, 0);
  scene.add(dirLight);
}

// =======================================
// GUI
// =======================================

function setupOrganGUIs() {
  const offset = 0.75;
  const guiDistance = 3.5;
  const guiScale = 6.0;
  const guiHeight = -0.5;
  const guiWidth = 250;

  if (!group) {
    group = new InteractiveGroup();
    group.listenToPointerEvents(renderer, camera);
    scene.add(group);

    // if controllers already exist, hook them up now
    if (controller1) group.listenToXRControllerEvents(controller1);
    if (controller2) group.listenToXRControllerEvents(controller2);
  }
  
  // const group = new InteractiveGroup();
  // group.listenToPointerEvents(renderer, camera);
  // scene.add(group);

  // Transforms panel
  const transformsGui = new GUI({ width: guiWidth });
  transformsGui.title(`Spatial Transforms`);
  transformsGui.add(organParams, 'scale', 1, 3, 0.1).name('Scale').onChange((v) => {
    rotatingGroup.scale.set(v*SCALE_COEFF, v*SCALE_COEFF, v*SCALE_COEFF);
  });
  transformsGui.add(organParams, 'rotLR', -180, 180, 1).name('Rotate Left/Right').onChange((v) => {
    rotatingGroup.rotation.y = v * Math.PI / 180;
  });
  transformsGui.add(organParams, 'rotUD', -180, 180, 1).name('Rotate Up/Down').onChange((v) => {
    rotatingGroup.rotation.x = v * Math.PI / 180;
  });
  transformsGui.domElement.style.visibility = 'hidden';
  
  organTransformsGuiMesh = new HTMLMesh(transformsGui.domElement);
  const position = new THREE.Vector3(0, guiHeight, 0);
  position.z -= guiDistance;
  organTransformsGuiMesh.position.copy(position);
  organTransformsGuiMesh.lookAt(vrPosition);
  const localX = new THREE.Vector3(1, 0, 0); // local x direction
  const organTransformsOffset = localX.applyQuaternion(organTransformsGuiMesh.quaternion).multiplyScalar(offset);
  organTransformsGuiMesh.position.add(organTransformsOffset);
  organTransformsGuiMesh.scale.setScalar(guiScale);
  
  // Data panel
  const dataGui = new GUI({ width: guiWidth });
  dataGui.title(`Volume Visualization`);

  dataGui.add(organParams, 'useIsoSurface', 0, 1, 1)
    .name('MIP <> Isosurface')
    .onChange((v) => {
      if (volumeMaterials && volumeMaterials.uniforms?.u_renderstyle) {
        volumeMaterials.uniforms['u_renderstyle'].value = v ? 1 : 0;
      }
    });
    dataGui.add(organParams, 'threshold', 0, 1, 0.01)
    .name('Isosurf. Threshold')
    .onChange((value) => {
      if (thresholdUniformRefs) thresholdUniformRefs.value = value;
    });
    dataGui.add(organParams, 'colormap', 1, 4, 1).name('Colormap').onChange((v) => {
      if (volumeMaterials && volumeMaterials.uniforms?.u_cmdata) {
        volumeMaterials.uniforms['u_cmdata'].value = cmtextures[v];
      }
  });
  dataGui.domElement.style.visibility = 'hidden';

  organDataGuiMesh = new HTMLMesh(dataGui.domElement);
  const position2 = new THREE.Vector3(0, guiHeight, 0);
  position2.z -= guiDistance;
  organDataGuiMesh.position.copy(position2);
  organDataGuiMesh.lookAt(vrPosition);
  const localX2 = new THREE.Vector3(-1, 0, 0); // local x direction
  const organDataOffset = localX2.applyQuaternion(organDataGuiMesh.quaternion).multiplyScalar(offset);
  organDataGuiMesh.position.add(organDataOffset);
  organDataGuiMesh.scale.setScalar(guiScale); 

  // Add to interactive group
  group.add(organTransformsGuiMesh);
  group.add(organDataGuiMesh);
  
  if (HIDEGUI) {
    organTransformsGuiMesh.visible = false;
    organDataGuiMesh.visible = false;
  }
}

// =======================================
// VR Controls
// =======================================

// Setup XR Button
function setupXRButton() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);
  const vrButton = VRButton.createButton(renderer);
  vrButton.style.position = 'absolute';
  vrButton.style.top = '50px';
  vrButton.style.height = '50px';
  vrButton.style.zIndex = '999';
  document.body.appendChild(vrButton);
};

function setupControllers() {
  const geometry = new THREE.BufferGeometry()
    .setFromPoints([ new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,-5) ]);

  controller1 = renderer.xr.getController(0);
  controller1.add(new THREE.Line(geometry));
  scene.add(controller1);

  controller2 = renderer.xr.getController(1);
  controller2.add(new THREE.Line(geometry));
  scene.add(controller2);

  const factory = new XRControllerModelFactory();
  const grip1 = renderer.xr.getControllerGrip(0);
  grip1.add(factory.createControllerModel(grip1));
  scene.add(grip1);

  const grip2 = renderer.xr.getControllerGrip(1);
  grip2.add(factory.createControllerModel(grip2));
  scene.add(grip2);

  // hook controllers into the interactive group if it already exists
  if (group) {
    group.listenToXRControllerEvents(controller1);
    group.listenToXRControllerEvents(controller2);
  }
}

// =======================================
// Credit watermark
// =======================================

function setupCredits(renderer) {
  const creditsDiv = document.createElement('div');
  creditsDiv.id = 'credits';
  creditsDiv.innerHTML = 'Code by C. Karg from Kainmüller Lab';
  creditsDiv.style.position = 'absolute';
  creditsDiv.style.top = '10px';
  creditsDiv.style.right = '10px';
  creditsDiv.style.fontSize = '12px';
  creditsDiv.style.color = '#888';
  creditsDiv.style.fontFamily = 'sans-serif';
  creditsDiv.style.background = 'rgba(255, 255, 255, 0.2)';
  creditsDiv.style.padding = '5px 8px';
  creditsDiv.style.borderRadius = '5px';
  creditsDiv.style.zIndex = '999';
  document.body.appendChild(creditsDiv);

  // XR session change detection
  renderer.xr.addEventListener('sessionstart', () => {
    creditsDiv.style.display = 'none';
  });

  renderer.xr.addEventListener('sessionend', () => {
    creditsDiv.style.display = 'block';
  });
}

