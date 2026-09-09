/**
 * 3D Aero Piston Engine Digital Twin Renderer (Three.js)
 * Sponsoring Challenge: SIH26054 (DRDO) - MALE UAV Health Monitoring
 */

let scene, camera, renderer, controls;
let engineGroup, crankshaft, propeller, explodedGroup;
let cylinders = [];
let pistons = [];
let connectingRods = [];
let sensors = [];

let isExploded = false;
let isHeatmapActive = false;
let currentRPM = 5200;
let cylinderTemps = [160, 162, 158, 161]; // °C for Cyl 1, 2, 3, 4

// Initial camera position
const defaultCameraPos = { x: 4.5, y: 3.2, z: 5.5 };

function init3DEngine() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 460;

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);
    scene.fog = new THREE.FogExp2(0x090d16, 0.04);

    // Camera
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(defaultCameraPos.x, defaultCameraPos.y, defaultCameraPos.z);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Orbit Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.minDistance = 2;
    controls.maxDistance = 15;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.2); // Cyan key light
    dirLight1.position.set(5, 8, 5);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xff9944, 0.6); // Warm rim light
    dirLight2.position.set(-5, -2, -5);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x38bdf8, 0.8, 10);
    pointLight.position.set(0, 2, 0);
    scene.add(pointLight);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(16, 20, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = -1.6;
    scene.add(gridHelper);

    // Build Engine Assembly
    buildEngineAssembly();

    // Raycaster for Interactive Selection
    setupRaycaster();

    // Resize Handler
    window.addEventListener('resize', onWindowResize);

    // Animation Loop
    animate(0);
}

function buildEngineAssembly() {
    engineGroup = new THREE.Group();
    scene.add(engineGroup);

    // Materials
    const crankcaseMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.8,
        roughness: 0.3
    });

    const cylinderMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        metalness: 0.9,
        roughness: 0.2
    });

    const pistonMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.95,
        roughness: 0.1
    });

    const sensorMat = new THREE.MeshStandardMaterial({
        color: 0x0ea5e9,
        emissive: 0x0284c7,
        emissiveIntensity: 0.5,
        metalness: 0.5
    });

    // 1. Central Crankcase Block
    const crankcaseGeo = new THREE.BoxGeometry(1.6, 1.2, 2.4);
    const crankcase = new THREE.Mesh(crankcaseGeo, crankcaseMat);
    crankcase.userData = { name: "Engine Crankcase Block", id: "ENG-BLK-01", type: "block" };
    engineGroup.add(crankcase);

    // 2. Crankshaft & Front Hub
    const crankGeo = new THREE.CylinderGeometry(0.2, 0.2, 2.8, 16);
    crankshaft = new THREE.Mesh(crankGeo, pistonMat);
    crankshaft.rotation.x = Math.PI / 2;
    crankshaft.userData = { name: "Forged Steel Crankshaft", id: "ENG-CRK-01", type: "crank" };
    engineGroup.add(crankshaft);

    // Propeller Hub & Blades
    const propHubGeo = new THREE.ConeGeometry(0.35, 0.6, 16);
    const propHub = new THREE.Mesh(propHubGeo, crankcaseMat);
    propHub.rotation.x = -Math.PI / 2;
    propHub.position.z = 1.6;

    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const bladeGeo = new THREE.BoxGeometry(2.6, 0.18, 0.04);
    propeller = new THREE.Mesh(bladeGeo, bladeMat);
    propeller.position.z = 1.5;
    propeller.add(propHub);
    propeller.userData = { name: "Carbon Fiber UAV Propeller", id: "ENG-PRP-01", type: "propeller" };
    engineGroup.add(propeller);

    // 3. Four Opposed Cylinders & Pistons (Boxer Layout)
    // Cylinder layout: Left side (X < 0) = Cyl 1, 3 | Right side (X > 0) = Cyl 2, 4
    const cylPositions = [
        { id: 1, x: -1.2, z: -0.6, dir: -1, name: "Cylinder #1 (Left Front)" },
        { id: 2, x: 1.2, z: -0.6, dir: 1, name: "Cylinder #2 (Right Front)" },
        { id: 3, x: -1.2, z: 0.6, dir: -1, name: "Cylinder #3 (Left Rear)" },
        { id: 4, x: 1.2, z: 0.6, dir: 1, name: "Cylinder #4 (Right Rear)" }
    ];

    cylPositions.forEach((pos, idx) => {
        const cylHolder = new THREE.Group();
        cylHolder.position.set(pos.x, 0, pos.z);

        // Cylinder Sleeve
        const sleeveGeo = new THREE.CylinderGeometry(0.42, 0.42, 1.2, 24, 1, true);
        const cylMeshMaterial = cylinderMat.clone();
        const sleeve = new THREE.Mesh(sleeveGeo, cylMeshMaterial);
        sleeve.rotation.z = Math.PI / 2;
        sleeve.userData = { name: pos.name, id: `ENG-CYL-0${pos.id}`, cylIdx: idx, type: "cylinder" };
        cylHolder.add(sleeve);

        // Cooling Fins on Cylinder
        for (let f = -0.4; f <= 0.4; f += 0.15) {
            const finGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.03, 24);
            const fin = new THREE.Mesh(finGeo, cylMeshMaterial);
            fin.rotation.z = Math.PI / 2;
            fin.position.x = f * pos.dir;
            cylHolder.add(fin);
        }

        // Cylinder Head Cover
        const headGeo = new THREE.BoxGeometry(0.2, 0.9, 0.9);
        const headMat = cylinderMat.clone();
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.x = 0.65 * pos.dir;
        head.userData = { name: `${pos.name} Head & Valves`, id: `ENG-HD-0${pos.id}`, cylIdx: idx, type: "cylinder" };
        cylHolder.add(head);

        // CHT Thermocouple Sensor Node
        const sensorGeo = new THREE.SphereGeometry(0.08, 12, 12);
        const sensorMesh = new THREE.Mesh(sensorGeo, sensorMat.clone());
        sensorMesh.position.set(0.72 * pos.dir, 0.4, 0);
        sensorMesh.userData = { name: `CHT Sensor #${pos.id}`, id: `SNS-CHT-0${pos.id}`, type: "sensor" };
        cylHolder.add(sensorMesh);

        sensors.push(sensorMesh);
        cylinders.push({ group: cylHolder, mat: cylMeshMaterial, headMat: headMat, basePos: { x: pos.x, y: 0, z: pos.z }, dir: pos.dir, idx: idx });

        // Piston inside Cylinder
        const pistonGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.35, 20);
        const piston = new THREE.Mesh(pistonGeo, pistonMat);
        piston.rotation.z = Math.PI / 2;
        piston.position.set(0.3 * pos.dir, 0, pos.z);
        piston.userData = { name: `Piston Assembly #${pos.id}`, id: `ENG-PST-0${pos.id}`, cylIdx: idx, type: "piston" };
        engineGroup.add(piston);

        pistons.push({ mesh: piston, basePos: { x: 0.3 * pos.dir, z: pos.z }, dir: pos.dir, phaseOffset: (idx % 2 === 0) ? 0 : Math.PI });

        // Connecting Rod
        const rodGeo = new THREE.BoxGeometry(0.6, 0.08, 0.08);
        const rod = new THREE.Mesh(rodGeo, pistonMat);
        engineGroup.add(rod);
        connectingRods.push({ mesh: rod, cylIdx: idx, dir: pos.dir, z: pos.z });
    });
}

function animate(timestamp) {
    requestAnimationFrame(animate);

    if (controls) controls.update();

    const time = timestamp * 0.001;
    // Calculate crank rotation speed based on live RPM
    const radPerSec = (currentRPM / 60) * Math.PI * 2 * 0.02;

    if (crankshaft) crankshaft.rotation.y += radPerSec * 0.1;
    if (propeller) propeller.rotation.z += radPerSec * 0.15;

    // Animate Pistons reciprocating
    const strokeAmp = 0.25;
    pistons.forEach((p, idx) => {
        const angle = (time * radPerSec) + p.phaseOffset;
        const offset = Math.sin(angle) * strokeAmp;

        if (!isExploded) {
            p.mesh.position.x = p.basePos.x + (offset * p.dir);

            // Update connecting rod position
            if (connectingRods[idx]) {
                connectingRods[idx].mesh.position.set(p.mesh.position.x - (0.3 * p.dir), 0, p.z);
                connectingRods[idx].mesh.rotation.z = Math.cos(angle) * 0.15;
            }
        }
    });

    // Update Cylinder Thermal Emissive Colors based on live CHT telemetry
    cylinders.forEach((c) => {
        const temp = cylinderTemps[c.idx] || 160;
        let color = new THREE.Color(0x64748b);
        let emissive = new THREE.Color(0x000000);

        if (isHeatmapActive || temp > 190) {
            // Thermal Gradient: 150°C (Normal Blue/Green) -> 200°C (Orange) -> 240°C (Critical Bright Red)
            if (temp < 180) {
                emissive.setHSL(0.55, 0.8, 0.2); // Cool Cyan/Blue
            } else if (temp < 210) {
                emissive.setHSL(0.08, 1.0, 0.4); // Warning Orange/Amber
            } else {
                emissive.setHSL(0.0, 1.0, 0.5); // Danger Red
            }
        }

        c.mat.emissive = emissive;
        c.mat.emissiveIntensity = isHeatmapActive ? 0.7 : (temp > 200 ? 0.8 : 0.1);
        c.headMat.emissive = emissive;
        c.headMat.emissiveIntensity = c.mat.emissiveIntensity;
    });

    renderer.render(scene, camera);
}

function updateEngineRPM(rpm) {
    currentRPM = rpm;
}

function updateCylinderTemps(tempsArray) {
    cylinderTemps = tempsArray;
}

function toggleExplodedView() {
    isExploded = !isExploded;
    const btn = document.getElementById('btn-exploded');
    if (btn) {
        btn.classList.toggle('bg-sky-600', isExploded);
        btn.classList.toggle('text-white', isExploded);
    }

    const duration = 800; // ms
    const startTime = performance.now();

    cylinders.forEach((c) => {
        const startX = c.group.position.x;
        const targetX = isExploded ? c.basePos.x * 2.2 : c.basePos.x;

        function animateExplode() {
            const now = performance.now();
            const progress = Math.min((now - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic

            c.group.position.x = startX + (targetX - startX) * ease;

            if (progress < 1) requestAnimationFrame(animateExplode);
        }
        animateExplode();
    });
}

function toggleHeatmap3D() {
    isHeatmapActive = !isHeatmapActive;
    const btn = document.getElementById('btn-heatmap');
    if (btn) {
        btn.classList.toggle('bg-amber-600', isHeatmapActive);
        btn.classList.toggle('text-white', isHeatmapActive);
    }
}

function reset3DCamera() {
    if (!camera || !controls) return;
    camera.position.set(defaultCameraPos.x, defaultCameraPos.y, defaultCameraPos.z);
    controls.target.set(0, 0, 0);
    controls.update();
}

function setupRaycaster() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const container = document.getElementById('canvas-container');
    container.addEventListener('click', (event) => {
        const rect = container.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length > 0) {
            let clickedObj = intersects[0].object;
            // Traverse up to find object with userData
            while (clickedObj && (!clickedObj.userData || !clickedObj.userData.name) && clickedObj.parent) {
                clickedObj = clickedObj.parent;
            }

            if (clickedObj && clickedObj.userData && clickedObj.userData.name) {
                openComponentInspection(clickedObj.userData);
            }
        }
    });
}

function openComponentInspection(data) {
    const label = document.getElementById('inspected-part-label');
    if (label) label.innerText = `Selected: ${data.name}`;

    const modal = document.getElementById('component-modal');
    if (!modal) return;

    document.getElementById('modal-part-name').innerText = data.name;
    document.getElementById('modal-part-id').innerText = `ID: ${data.id || 'ENG-PART-01'}`;

    const cylIdx = data.cylIdx !== undefined ? data.cylIdx : 0;
    const temp = cylinderTemps[cylIdx] || 162;
    document.getElementById('modal-part-temp').innerText = `${temp} °C`;

    let healthStr = "98.4% (Healthy)";
    let healthColor = "text-emerald-400";
    if (temp > 210) {
        healthStr = "64.1% (Thermal Critical)";
        healthColor = "text-rose-400";
    } else if (temp > 185) {
        healthStr = "84.2% (Elevated Stress)";
        healthColor = "text-amber-400";
    }

    const healthElem = document.getElementById('modal-part-health');
    healthElem.innerText = healthStr;
    healthElem.className = `text-sm font-bold font-mono ${healthColor}`;

    modal.classList.remove('hidden');
}

function closeComponentModal() {
    const modal = document.getElementById('component-modal');
    if (modal) modal.classList.add('hidden');
}

function onWindowResize() {
    const container = document.getElementById('canvas-container');
    if (!container || !renderer || !camera) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 460;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// Auto-initialize when window loads
window.addEventListener('DOMContentLoaded', () => {
    init3DEngine();
});
