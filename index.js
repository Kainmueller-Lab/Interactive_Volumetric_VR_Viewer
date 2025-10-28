import * as THREE from 'three';
import { NRRDLoader } from 'three/addons/loaders/NRRDLoader.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { HTMLMesh } from 'three/addons/interactive/HTMLMesh.js';
import { InteractiveGroup } from 'three/addons/interactive/InteractiveGroup.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import { VolumeShader } from './shaders/VolumeShader.js';


// PARAMETERS
let VOLUME_PATH;
VOLUME_PATH = './data/examples/worm.nrrd';
// VOLUME_PATH = './data/examples/stent.nrrd';
VOLUME_PATH = './data/examples/heart_256.nrrd';
//  VOLUME_PATH = './data/examples/eye_512.nrrd';

const ROTATIONSPEED = 0.01; // Try: 0.001 for slow, 0.01 for fast
const FOV = 80;
const SCALE_COEFF = 0.5;

const vrPosition = new THREE.Vector3(0, 1.7, 0);
const vrDirection = new THREE.Vector3(0, 0, -1);

// GUI + data config
const isoThreshold = 0.2;
const rotation = new THREE.Euler(90 * Math.PI / 180, 0 * Math.PI / 180, 0);


let scene, camera, renderer;
let rotatingGroup, group;
let volumeMaterial;
let TransformsGuiMesh, DataGuiMesh;
let controller1, controller2;


const params = {
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

  // Setup camera
  camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 0.1, 5000);
  camera.position.copy(vrPosition);
  let lookAtPos = new THREE.Vector3();
  lookAtPos.addVectors(vrPosition, vrDirection);
  camera.lookAt(lookAtPos);

  // Setup light & environment
  setupEnvironmentLighting();

  // Load volumetric data
  rotatingGroup = new THREE.Group(); // Add rotating group to enable transforms
  scene.add(rotatingGroup);
  addVolume(VOLUME_PATH, rotatingGroup);

  // Add auxiliary scene objects
  setupSceneObjects();

  // Add XR button and XR controllers
  setupXRButton();
  setupControllers();

  // Add GUI
  setupGUIs();

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
    rotatingGroup.rotation.y += ROTATIONSPEED;

    // Update the GUIs
    if (TransformsGuiMesh) TransformsGuiMesh.material.map.update();
    if (
      DataGuiMesh)
      DataGuiMesh.material.map.update();

    renderer.render(scene, camera);
  });
}


// =======================================
// Volume Loading & Material Setup
// =======================================

function addVolume(volumePath, rotateGroup) {
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
    uniforms['u_renderstyle'].value = params.useIsoSurface;
    uniforms['u_renderthreshold'].value = params.threshold;
    uniforms['u_cmdata'].value = cmtextures[params.colormap];

    const geometry = new THREE.BoxGeometry(sx, sy, sz);
    geometry.translate(sx / 2, sy / 2, sz / 2);
    volumeMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
      side: THREE.BackSide
    });
    const mesh = new THREE.Mesh(geometry, volumeMaterial);
    mesh.position.set(-sx / 2, -sy / 2, -sz / 2);

    // === Create group hierarchy ===
    const yawGroup = new THREE.Group();
    const placingGroup = new THREE.Group();

    scene.add(yawGroup);
    yawGroup.add(rotateGroup);
    rotateGroup.add(placingGroup);
    placingGroup.add(mesh);

    // === Positioning ===
    const maxLength = Math.max(sx, sy, sz);
    const center = new THREE.Vector3(0, 1.7, -maxLength * 0.5);
    const [cx, cy, cz] = center;
    yawGroup.position.set(cx, cy, cz);
    yawGroup.lookAt(vrPosition); // Make it face the camera

    // === Apply fixed rotation to placingGroup ===
    placingGroup.rotation.copy(rotation);

    // Scale
    const volumeScale = params.scale * SCALE_COEFF;
    rotatingGroup.scale.set(volumeScale, volumeScale, volumeScale);
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
  for (let i = 1; i < num_circles + 1; i++) {
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

function setupGUIs() {
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


  // Transforms panel
  const transformsGui = new GUI({ width: guiWidth });
  transformsGui.title(`Spatial Transforms`);
  transformsGui.add(params, 'scale', 1, 3, 0.1).name('Scale').onChange((v) => {
    rotatingGroup.scale.set(v * SCALE_COEFF, v * SCALE_COEFF, v * SCALE_COEFF);
  });
  transformsGui.add(params, 'rotLR', -180, 180, 1).name('Rotate Left/Right').onChange((v) => {
    rotatingGroup.rotation.y = v * Math.PI / 180;
  });
  transformsGui.add(params, 'rotUD', -180, 180, 1).name('Rotate Up/Down').onChange((v) => {
    rotatingGroup.rotation.x = v * Math.PI / 180;
  });
  transformsGui.domElement.style.visibility = 'hidden';

  TransformsGuiMesh = new HTMLMesh(transformsGui.domElement);
  const position = new THREE.Vector3(0, guiHeight, 0);
  position.z -= guiDistance;
  TransformsGuiMesh.position.copy(position);
  TransformsGuiMesh.lookAt(vrPosition);
  const localX = new THREE.Vector3(1, 0, 0); // local x direction
  const TransformsOffset = localX.applyQuaternion(TransformsGuiMesh.quaternion).multiplyScalar(offset);
  TransformsGuiMesh.position.add(TransformsOffset);
  TransformsGuiMesh.scale.setScalar(guiScale);

  // Data panel
  const dataGui = new GUI({ width: guiWidth });
  dataGui.title(`Volume Visualization`);

  dataGui.add(params, 'useIsoSurface', 0, 1, 1)
    .name('MIP <> Isosurface')
    .onChange((v) => {
      if (volumeMaterial && volumeMaterial.uniforms?.u_renderstyle) {
        volumeMaterial.uniforms['u_renderstyle'].value = v ? 1 : 0;
      }
    });
  dataGui.add(params, 'threshold', 0, 1, 0.01)
    .name('Isosurf. Threshold')
    .onChange((value) => {
      if (volumeMaterial && volumeMaterial.uniforms?.u_renderthreshold) {
        volumeMaterial.uniforms['u_renderthreshold'].value = value;
      }
    });
  dataGui.add(params, 'colormap', 1, 4, 1).name('Colormap').onChange((v) => {
    if (volumeMaterial && volumeMaterial.uniforms?.u_cmdata) {
      volumeMaterial.uniforms['u_cmdata'].value = cmtextures[v];
    }
  });
  dataGui.domElement.style.visibility = 'hidden';

  DataGuiMesh = new HTMLMesh(dataGui.domElement);
  const position2 = new THREE.Vector3(0, guiHeight, 0);
  position2.z -= guiDistance;
  DataGuiMesh.position.copy(position2);
  DataGuiMesh.lookAt(vrPosition);
  const localX2 = new THREE.Vector3(-1, 0, 0); // local x direction
  const dataOffset = localX2.applyQuaternion(
    DataGuiMesh.quaternion).multiplyScalar(offset);
  DataGuiMesh.position.add(dataOffset);
  DataGuiMesh.scale.setScalar(guiScale);

  // Add to interactive group
  group.add(TransformsGuiMesh);
  group.add(DataGuiMesh);
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
    .setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -5)]);

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

