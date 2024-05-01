// main.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;

camera.position.set(2000, 2000, 2000);
controls.update();

const axesHelper = new THREE.AxesHelper(50);
scene.add(axesHelper);

var light = new THREE.HemisphereLight(0x00aaff, 0x404040, 5);
scene.add(light);

const spheres = []; // Store all spheres
const lines = []; // Store lines for later removal
const loadingDiv = document.getElementById('loadingDiv'); // Access loading animation element

function createSphere(xPosition, yPosition, zPosition, name, genre, prompt) {
    const geometry = new THREE.SphereGeometry(15, 32, 16);
    const material = new THREE.MeshPhongMaterial({ color: 0xE9E9E9 });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(xPosition, yPosition, zPosition);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    scene.add(sphere);

    sphere.userData = { name, genre, prompt };
    spheres.push(sphere); // Add to spheres array
}

async function fetchData() {
    const response = await fetch('https://embedding-visualizer-backend.onrender.com/all');
    const data = await response.json();

    data.forEach(item => {
        createSphere(item.umap_3d[0] * 1000, item.umap_3d[1] * 1000, item.umap_3d[2] * 1000, item.name, item.genre, item.prompt);
    });
    loadingDiv.style.display = 'none'; // Hide the loading animation when data is loaded
    animate()
}

let isAnimating = true;
let clickCount = 0;  // Track the number of clicks

function animate() {
    requestAnimationFrame(animate);
    if (isAnimating) {
        camera.position.x = camera.position.x * Math.cos(0.001) - camera.position.z * Math.sin(0.001);
        camera.position.z = camera.position.z * Math.cos(0.001) + camera.position.x * Math.sin(0.001);
    }
    camera.lookAt(scene.position);
    controls.update();
    renderer.render(scene, camera);
}

const infoDiv = document.createElement('div');
infoDiv.id = 'infoDiv';
document.body.appendChild(infoDiv);

const titleDiv = document.createElement('div');
titleDiv.id = 'titleDiv';
titleDiv.innerHTML = '⏯️音樂視覺化工具';
document.body.appendChild(titleDiv);

document.addEventListener('mousemove', onMouseMove, false);
document.body.addEventListener('click', () => {
    clickCount++;
    if (clickCount === 1) {
        titleDiv.style.transition = 'opacity 1s';
        titleDiv.style.opacity = '0';
        setTimeout(() => titleDiv.remove(), 1000);
    } else if (clickCount === 2) {
        isAnimating = false;  // Stop the camera rotation
    }
});

function onMouseMove(event) {
    event.preventDefault();
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(spheres);

    if (intersects.length > 0) {
        const intersected = intersects[0].object;
        infoDiv.innerHTML = `🪪Name: ${intersected.userData.name}<br>📗Genre: ${intersected.userData.genre}<br>🔥Prompt: ${intersected.userData.prompt}`;
        infoDiv.style.display = 'block';

        let posX = event.clientX + 10;
        let posY = event.clientY + 10;
        if (posX + infoDiv.offsetWidth > window.innerWidth) {
            posX = window.innerWidth - infoDiv.offsetWidth - 10;
        }
        if (posY + infoDiv.offsetHeight > window.innerHeight) {
            posY = window.innerHeight - infoDiv.offsetHeight - 10;
        }
        infoDiv.style.left = `${posX}px`;
        infoDiv.style.top = `${posY}px`;
    } else {
        infoDiv.style.display = 'none';
    }
}

document.body.addEventListener('click', onMouseClick, false);

function onMouseClick(event) {
    event.preventDefault();
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(spheres);

    if (intersects.length > 0) {
        const clickedSphere = intersects[0].object;
        connectNearestSphere(clickedSphere);
    }
}

// Function to find and connect the nearest sphere
function connectNearestSphere(selectedSphere) {
    let minDistance = Infinity;
    let nearestSphere = null;

    spheres.forEach(sphere => {
        if (sphere !== selectedSphere) {
            const distance = selectedSphere.position.distanceTo(sphere.position);
            if (distance < minDistance) {
                minDistance = distance;
                nearestSphere = sphere;
            }
        }
    });

    if (nearestSphere) {
        const material = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 1.0, transparent: true });
        const points = [];
        points.push(new THREE.Vector3(selectedSphere.position.x, selectedSphere.position.y, selectedSphere.position.z));
        points.push(new THREE.Vector3(nearestSphere.position.x, nearestSphere.position.y, nearestSphere.position.z));
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        lines.push(line);

        // Remove the line after 5 seconds with fading effect
        setTimeout(() => {
            fadeOutLine(line);
        }, 5000);
    }
}

function fadeOutLine(line) {
    let opacity = 1.0;
    const fadeEffect = setInterval(() => {
        if (opacity <= 0.5) {
            clearInterval(fadeEffect);
            scene.remove(line);
        } else {
            opacity -= 0.2;
            line.material.opacity = opacity;
        }
    }, 50);
}

fetchData();
// animate()
