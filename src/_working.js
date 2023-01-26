import * as THREE from 'three';
import * as YUKA from 'yuka';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import gsap from "gsap"

const renderer = new THREE.WebGLRenderer({antialias: true});

renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

renderer.setClearAlpha(0x000);

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(0,10,0);
camera.lookAt(scene.position);

const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
scene.add(directionalLight);

const vehicle = new YUKA.Vehicle();

vehicle.scale.set(0.15, 0.15, 0.15);

function sync(entity, renderComponent) {
    renderComponent.matrix.copy(entity.worldMatrix);
}

const entityManager = new YUKA.EntityManager();
entityManager.add(vehicle);

const loader = new GLTFLoader();
const group = new THREE.Group();
// loader.load('./assets/Striker.glb', function(glb) {
//     const model = glb.scene;
//     model.matrixAutoUpdate = false;
//     group.add(model);
//     scene.add(group);
//     vehicle.setRenderComponent(model, sync);
// });
const targetGeometry = new THREE.SphereGeometry(3);
const targetMaterial = new THREE.MeshStandardMaterial({color: 0xFFEAFF});
const targetMesh = new THREE.Mesh(targetGeometry, targetMaterial);

const model = targetMesh;
model.matrixAutoUpdate = false;
group.add(model);
scene.add(group);
vehicle.setRenderComponent(model, sync);

const cursorGeometry = new THREE.BoxGeometry(0.33,0.33,0.33);
const cursorMaterial = new THREE.MeshPhongMaterial({color: 0xFFEA00});
const cursorMesh = new THREE.Mesh(cursorGeometry, cursorMaterial);
cursorMesh.matrixAutoUpdate = false;
scene.add(cursorMesh);

const bgMesh = new THREE.Mesh(targetGeometry,targetMaterial)
bgMesh.position.y=(0)
bgMesh.position.z=(5)
bgMesh.position.x=(-5)
scene.add(bgMesh)

const target = new YUKA.GameEntity();
target.setRenderComponent(cursorMesh, sync);
entityManager.add(target);

const arriveBehavior = new YUKA.ArriveBehavior(target.position, 0.18,0);
vehicle.steering.add(arriveBehavior);

vehicle.position.set(-3, 0, -3);

vehicle.maxSpeed = 500;
vehicle.maxForce = 500
vehicle.mass = 0.1

const mousePosition = new THREE.Vector2();

window.addEventListener('mousemove', function(e) {
    mousePosition.x = (e.clientX / this.window.innerWidth) * 2 - 1;
    mousePosition.y = -(e.clientY / this.window.innerHeight) * 2 + 1;
});

const planeGeo = new THREE.PlaneGeometry(2500, 2500);
const planeMat = new THREE.MeshBasicMaterial({visible: false});
const planeMesh = new THREE.Mesh(planeGeo, planeMat);
planeMesh.rotation.x = -0.5 * Math.PI;
scene.add(planeMesh);
planeMesh.name = 'plane';

const raycaster = new THREE.Raycaster();
let tempV = new THREE.Vector3()

window.addEventListener('click', function(e) {
    raycaster.setFromCamera(mousePosition, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    console.log(intersects)
    for(let i = 0; i < intersects.length; i++) {
        if(intersects[i].object.name === 'plane')
            target.position.set(intersects[i].point.x, 0, intersects[i].point.z);
           if (intersects[i].point.x > (camera.position.x)) {
                console.log("Over")
                gsap.to(camera.position, {x: intersects[i].point.x, duration: 2.2})
                camera.updateProjectionMatrix()
            } else if (e.clientX < (window.innerWidth * 0.2)) {
                gsap.to(camera.position, {x: intersects[i].point.x, duration: 2})
                camera.updateProjectionMatrix()
            }
    }
});

// setInterval(function(){
//     const x = Math.random() * 3;
//     const y = Math.random() * 3;
//     const z = Math.random() * 3;

//     target.position.set(x, y, z);
// }, 2000);

const time = new YUKA.Time();

function animate(t) {
    const delta = time.update().getDelta();
    entityManager.update(delta);
    group.position.y = 0.05 * Math.sin(t / 500);
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});