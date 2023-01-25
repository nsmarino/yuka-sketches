import * as THREE from 'three'
import * as YUKA from 'yuka'
import { renderer, scene } from './core/renderer'
import { fpsGraph, gui } from './core/gui'
import camera from './core/camera'
import { controls } from './core/orbit-control'

import './style.css'

// Shaders
import vertexShader from '/@/shaders/vertex.glsl'
import fragmentShader from '/@/shaders/fragment.glsl'

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight('#ffffff', 1)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.normalBias = 0.05
directionalLight.position.set(0.25, 2, 2.25)

scene.add(directionalLight)

const sphereMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uFrequency: { value: new THREE.Vector2(20, 15) },
  },
  vertexShader,
  fragmentShader,
})

const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 32),
  sphereMaterial,
)
sphere.position.set(0, 2, 0)
sphere.castShadow = true
// scene.add(sphere)

// Set up mesh ("render component" for Yuka Vehicle)
const vehicleGeometry = new THREE.ConeGeometry( 0.1, 0.5, 8 );
vehicleGeometry.rotateX(Math.PI * 0.5);
const vehicleMaterial = new THREE.MeshNormalMaterial();
const vehicleMesh = new THREE.Mesh(vehicleGeometry, vehicleMaterial);
vehicleMesh.matrixAutoUpdate = false;
scene.add(vehicleMesh);

const vehicle = new YUKA.Vehicle();
vehicle.setRenderComponent(vehicleMesh, sync);
function sync(entity, renderComponent) {
    renderComponent.matrix.copy(entity.worldMatrix);
}

// ADD PATH FOR VEHICLE TO FOLLOW
const path = new YUKA.Path();
path.add( new YUKA.Vector3(-4, 0, 4));
path.add( new YUKA.Vector3(-6, 0, 0));
path.add( new YUKA.Vector3(-4, 0, -4));
path.add( new YUKA.Vector3(0, 0, 0));
path.add( new YUKA.Vector3(4, 0, -4));
path.add( new YUKA.Vector3(6, 0, 0));
path.add( new YUKA.Vector3(4, 0, 4));
path.add( new YUKA.Vector3(0, 0, 6));

path.loop = true;
console.log("Path", path)

vehicle.position.copy(path.current());
vehicle.maxSpeed = 2

const followPathBehavior = new YUKA.FollowPathBehavior(path, 0.5);
vehicle.steering.add(followPathBehavior);

const onPathBehavior = new YUKA.OnPathBehavior(path);
onPathBehavior.radius = 0.2;
vehicle.steering.add(onPathBehavior);

const entityManager = new YUKA.EntityManager();
entityManager.add(vehicle);

const position = [];
for(let i = 0; i < path._waypoints.length; i++) {
    const waypoint = path._waypoints[i];
    position.push(waypoint.x, waypoint.y, waypoint.z);
}

const lineGeometry = new THREE.BufferGeometry();
// itemSize = 3 because there are 3 values (components) per vertex
lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));

const lineMaterial = new THREE.LineBasicMaterial({color: 0xFF0000});
const lines = new THREE.LineLoop(lineGeometry, lineMaterial);
scene.add(lines);

const time = new YUKA.Time();

const DirectionalLightFolder = gui.addFolder({
  title: 'Directional Light',
})
Object.keys(directionalLight.position).forEach(key => {
  DirectionalLightFolder.addInput(
    directionalLight.position,
    key,
    {
      min: -100,
      max: 100,
      step: 1,
    },
  )
})

const clock = new THREE.Clock()

const loop = () => {
  const elapsedTime = clock.getElapsedTime()

  sphereMaterial.uniforms.uTime.value = elapsedTime

  fpsGraph.begin()

  controls.update()

  const delta = time.update().getDelta();
  entityManager.update(delta);

  renderer.render(scene, camera)

  fpsGraph.end()
  requestAnimationFrame(loop)
}

loop()
