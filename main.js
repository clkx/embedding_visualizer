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

var light = new THREE.HemisphereLight("#ffffff", 0x404040, 5);
scene.add(light);

const spheres = []; // Store all spheres
const lines = []; // Store lines for later removal
const overlays = []; // Store overlay spheres for later removal
const originalColors = new Map(); // Store original colors for resetting
const loadingDiv = document.getElementById('loadingDiv'); // Access loading animation element

const genreColors = {
    'Blues': "#1f77b4",
    'Classical': "#f89727",
    'Country': "#2ca02c",
    'Disco': "#1cc47e",
    'Hip-hop': "#9467bd",
    'Jazz': "#f74e72",
    'Metal': "#fc54c9",
    'Pop': "#f87f7f",
    'Reggae': "#f1f132",
    'Rock': "#48cbda"
};

let isColoredByGenre = false;

function createSphere(xPosition, yPosition, zPosition, name, genre, prompt) {
    const geometry = new THREE.SphereGeometry(15, 32, 16);
    const material = new THREE.MeshPhongMaterial({ color: "#ffffff" });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(xPosition, yPosition, zPosition);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    scene.add(sphere);

    sphere.userData = { name, genre, prompt };
    spheres.push(sphere); // Add to spheres array
    originalColors.set(sphere, material.color.getHex()); // Save original color
}

async function fetchData() {
    const response = await fetch('https://embedding-visualizer-backend.onrender.com/fixed');
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
titleDiv.innerHTML = '⏯️音樂視覺化探索工具';
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

document.body.addEventListener('dblclick', onDoubleClick, false);

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
        infoDiv.innerHTML = `🔥Prompt: ${intersected.userData.prompt}<br>📗Genre: ${intersected.userData.genre}`;
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

function onDoubleClick(event) {
    event.preventDefault();
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(spheres);

    if (intersects.length > 0) {
        const intersected = intersects[0].object;
        navigator.clipboard.writeText(intersected.userData.prompt).then(() => {
            alert("Prompt copied to clipboard!");
        });
    }
}

document.body.addEventListener('click', onMouseClick, false);
document.body.addEventListener('contextmenu', onRightClick, false);

function onMouseClick(event) {
    if (event.button !== 0) return; // Only respond to left-clicks

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

function onRightClick(event) {
    event.preventDefault();
    if (event.button !== 2) return; // Only respond to right-clicks

    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(spheres);

    if (intersects.length > 0) {
        const clickedSphere = intersects[0].object;
        highlightNearbySpheres(clickedSphere);
    }
}

// Function to find and connect the nearest sphere
function connectNearestSphere(selectedSphere) {
    // Reset colors of previously connected spheres
    spheres.forEach(sphere => {
        sphere.material.color.set(0xE9E9E9);
    });

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
        const material = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 10, opacity: 1.0, transparent: true });
        const points = [];
        points.push(new THREE.Vector3(selectedSphere.position.x, selectedSphere.position.y, selectedSphere.position.z));
        points.push(new THREE.Vector3(nearestSphere.position.x, nearestSphere.position.y, nearestSphere.position.z));
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, material);
        
        // Create arrow helper
        const direction = new THREE.Vector3().subVectors(nearestSphere.position, selectedSphere.position).normalize();
        const arrowHelper = new THREE.ArrowHelper(direction, selectedSphere.position, minDistance, 0xffffff, 20, 10);

        scene.add(line);
        scene.add(arrowHelper);
        lines.push({ line, arrowHelper });

        // Change color of connected spheres
        selectedSphere.material.color.set("#00ace0");
        nearestSphere.material.color.set("#00ace0");

        // Remove the line after 3 seconds with fading effect
        setTimeout(() => {
            fadeOutLine(line, arrowHelper);
        }, 300);
    }
}

function fadeOutLine(line, arrowHelper) {
    let opacity = 1.0;
    const fadeEffect = setInterval(() => {
        if (opacity <= 0.1) {
            clearInterval(fadeEffect);
            scene.remove(line);
            scene.remove(arrowHelper);
        } else {
            opacity -= 0.1;
            line.material.opacity = opacity;
            arrowHelper.setColor(new THREE.Color(`rgba(255, 255, 255, ${opacity})`));
        }
    }, 50);
}

// Function to highlight nearby spheres
function highlightNearbySpheres(selectedSphere) {
    // Clear previous overlays and reset colors
    overlays.forEach(overlay => scene.remove(overlay));
    overlays.length = 0;
    spheres.forEach(sphere => {
        sphere.material.color.set(0xE9E9E9);
    });

    // Find nearest 5 spheres
    const distances = spheres.map(sphere => {
        return { sphere, distance: selectedSphere.position.distanceTo(sphere.position) };
    }).filter(item => item.sphere !== selectedSphere).sort((a, b) => a.distance - b.distance);

    const nearestSpheres = distances.slice(0, 5).map(item => item.sphere);

    // Create overlay sphere
    const overlayGeometry = new THREE.SphereGeometry(distances[4].distance, 32, 32);
    const overlayMaterial = new THREE.MeshBasicMaterial({ color: "#00ace0", opacity: 0.3, transparent: true });
    const overlaySphere = new THREE.Mesh(overlayGeometry, overlayMaterial);
    overlaySphere.position.copy(selectedSphere.position);
    scene.add(overlaySphere);
    overlays.push(overlaySphere);

    // Change color of nearby spheres
    nearestSpheres.forEach(sphere => {
        sphere.material.color.set("#00ace0");
    });

    // Fade out overlay and reset colors after 5 seconds
    setTimeout(() => {
        fadeOutOverlay(overlaySphere, nearestSpheres);
    }, 5000);
    
}

function fadeOutOverlay(overlaySphere, nearestSpheres) {
    let opacity = 0.3;
    const fadeEffect = setInterval(() => {
        if (opacity <= 0.1) {
            clearInterval(fadeEffect);
            scene.remove(overlaySphere);
            nearestSpheres.forEach(sphere => {
                sphere.material.color.set(0xE9E9E9);
            });
        } else {
            opacity -= 0.1;
            overlaySphere.material.opacity = opacity;
        }
    }, 100);
}

// Function to toggle genre coloring
function toggleGenreColors() {
    // Reset to original colors first
    spheres.forEach(sphere => {
        sphere.material.color.set(originalColors.get(sphere));
    });
    
    if (!isColoredByGenre) {
        // Color by genre
        spheres.forEach(sphere => {
            const genreColor = genreColors[sphere.userData.genre];
            if (genreColor) {
                sphere.material.color.set(genreColor);
            }
        });
    }

    isColoredByGenre = !isColoredByGenre;
}

// Function to toggle camera rotation
function toggleCameraRotation() {
    isAnimating = !isAnimating;
}

const colorButton = document.getElementById('colorButton');
colorButton.addEventListener('click', toggleGenreColors);

const rotateButton = document.getElementById('rotateButton');
rotateButton.addEventListener('click', toggleCameraRotation);

fetchData();
