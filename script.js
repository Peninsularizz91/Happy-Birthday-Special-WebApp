// --- Scene Setup ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050005, 0.012);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 18);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// --- Mouse Interaction Setup ---
const mouse = new THREE.Vector2(-1000, -1000);
const targetMouse = new THREE.Vector2(-1000, -1000);

window.addEventListener('mousemove', (event) => {
  targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  targetMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xff1493, 3, 50);
pointLight.position.set(0, 0, 5);
scene.add(pointLight);

const dirLight = new THREE.DirectionalLight(0xffb6c1, 1.5);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// --- Low-Poly Shape 3D Heart Geometry ko yan ---
function heartFunction(u, v, target) {
  u = (u - 0.5) * Math.PI * 2;
  v = (v - 0.5) * Math.PI;

  const x = 16 * Math.pow(Math.sin(u), 3) * Math.cos(v);
  const y = (13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u)) * Math.cos(v);
  const z = 5 * Math.sin(v);

  target.set(x * 0.12, y * 0.12, z * 0.12);
}

function createLowPolyHeartGeometry(uSegments, vSegments) {
  const geom = new THREE.BufferGeometry();
  const positions = [];

  for (let i = 0; i < uSegments; i++) {
    const u1 = i / uSegments;
    const u2 = (i + 1) / uSegments;

    for (let j = 0; j < vSegments; j++) {
      const v1 = j / vSegments;
      const v2 = (j + 1) / vSegments;

      const p1 = new THREE.Vector3();
      const p2 = new THREE.Vector3();
      const p3 = new THREE.Vector3();
      const p4 = new THREE.Vector3();

      heartFunction(u1, v1, p1);
      heartFunction(u2, v1, p2);
      heartFunction(u2, v2, p3);
      heartFunction(u1, v2, p4);

      positions.push(p1.x, p1.y, p1.z);
      positions.push(p2.x, p2.y, p2.z);
      positions.push(p4.x, p4.y, p4.z);

      positions.push(p2.x, p2.y, p2.z);
      positions.push(p3.x, p3.y, p3.z);
      positions.push(p4.x, p4.y, p4.z);
    }
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.computeVertexNormals();
  return geom;
}

const heartGeometry = createLowPolyHeartGeometry(12, 10);

const heartMaterial = new THREE.MeshPhongMaterial({
  color: 0xe0557d,
  emissive: 0x330011,
  specular: 0xffffff,
  shininess: 30,
  flatShading: true,
  transparent: true,
  opacity: 0.95
});

const heartMesh = new THREE.Mesh(heartGeometry, heartMaterial);
heartMesh.scale.set(1.3, 1.3, 1.3);
scene.add(heartMesh);

// --- Outer Particle Heart Trail na maangas syempre ---
const trailCount = 2500;
const trailGeo = new THREE.BufferGeometry();
const trailPositions = new Float32Array(trailCount * 3);
const trailColors = new Float32Array(trailCount * 3);

const colorChoices = [
  new THREE.Color(0xff1493),
  new THREE.Color(0xff69b4),
  new THREE.Color(0xffb6c1),
  new THREE.Color(0xffffff)
];

for (let i = 0; i < trailCount; i++) {
  const t = Math.random() * Math.PI * 2;
  const hx = 16 * Math.pow(Math.sin(t), 3);
  const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);

  const spread = 0.4;
  trailPositions[i * 3] = (hx / 2.2) + (Math.random() - 0.5) * spread;
  trailPositions[i * 3 + 1] = (hy / 2.2) + (Math.random() - 0.5) * spread;
  trailPositions[i * 3 + 2] = (Math.random() - 0.5) * 2;

  const color = colorChoices[Math.floor(Math.random() * colorChoices.length)];
  trailColors[i * 3] = color.r;
  trailColors[i * 3 + 1] = color.g;
  trailColors[i * 3 + 2] = color.b;
}

trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
trailGeo.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));

function createParticleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.3, 'rgba(255,105,180,0.8)');
  gradient.addColorStop(0.8, 'rgba(255,20,147,0.2)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

const particleTexture = createParticleTexture();

const trailMaterial = new THREE.PointsMaterial({
  size: 0.35,
  map: particleTexture,
  transparent: true,
  vertexColors: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

const particleHeart = new THREE.Points(trailGeo, trailMaterial);
scene.add(particleHeart);

// --- Interactive Background Floating Particles gawa ko yern ---
const bgCount = 1200;
const bgGeo = new THREE.BufferGeometry();
const bgOriginalPos = new Float32Array(bgCount * 3);
const bgPositions = new Float32Array(bgCount * 3);
const bgColors = new Float32Array(bgCount * 3);

for (let i = 0; i < bgCount; i++) {
  const x = (Math.random() - 0.5) * 45;
  const y = (Math.random() - 0.5) * 35;
  const z = (Math.random() - 0.5) * 20 - 5;

  bgOriginalPos[i * 3] = x;
  bgOriginalPos[i * 3 + 1] = y;
  bgOriginalPos[i * 3 + 2] = z;

  bgPositions[i * 3] = x;
  bgPositions[i * 3 + 1] = y;
  bgPositions[i * 3 + 2] = z;

  const color = colorChoices[Math.floor(Math.random() * colorChoices.length)];
  bgColors[i * 3] = color.r;
  bgColors[i * 3 + 1] = color.g;
  bgColors[i * 3 + 2] = color.b;
}

bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
bgGeo.setAttribute('color', new THREE.BufferAttribute(bgColors, 3));

const bgMaterial = new THREE.PointsMaterial({
  size: 0.25,
  map: particleTexture,
  transparent: true,
  vertexColors: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

const bgParticleSystem = new THREE.Points(bgGeo, bgMaterial);
scene.add(bgParticleSystem);

// --- Click Event for Heart Interactivity ---
const raycaster = new THREE.Raycaster();
const clickMouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
  clickMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  clickMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(clickMouse, camera);
  const intersects = raycaster.intersectObject(heartMesh);

  if (intersects.length > 0) {
    const envelopeWrapper = document.getElementById('envelope-wrapper');
    envelopeWrapper.classList.remove('hidden');
    envelopeWrapper.classList.add('pop-in');
  }
});

// --- Animation Loop ---
const clock = new THREE.Clock();
const mouse3D = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();

  mouse.x += (targetMouse.x - mouse.x) * 0.1;
  mouse.y += (targetMouse.y - mouse.y) * 0.1;

  raycaster.setFromCamera(mouse, camera);
  raycaster.ray.at(18, mouse3D);

  const pulse = 1 + Math.sin(elapsedTime * 3.5) * 0.05;
  heartMesh.scale.set(1.3 * pulse, 1.3 * pulse, 1.3 * pulse);
  heartMesh.rotation.y = Math.sin(elapsedTime * 0.5) * 0.2;

  particleHeart.rotation.y = elapsedTime * 0.08;

  const positionsAttr = bgGeo.attributes.position;
  for (let i = 0; i < bgCount; i++) {
    const px = bgOriginalPos[i * 3];
    const py = bgOriginalPos[i * 3 + 1];
    const pz = bgOriginalPos[i * 3 + 2];

    const dx = px - mouse3D.x;
    const dy = py - mouse3D.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const maxDist = 4;
    if (dist < maxDist) {
      const force = (1 - dist / maxDist) * 2;
      positionsAttr.array[i * 3] = px + (dx / dist) * force;
      positionsAttr.array[i * 3 + 1] = py + (dy / dist) * force;
    } else {
      positionsAttr.array[i * 3] += (px - positionsAttr.array[i * 3]) * 0.05;
      positionsAttr.array[i * 3 + 1] += (py - positionsAttr.array[i * 3 + 1]) * 0.05;
    }
  }
  positionsAttr.needsUpdate = true;

  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});



// ---Seal Button Click Event (Triggers Unfolding & Letter Reveal cuz why not)---
document.addEventListener('DOMContentLoaded', () => {
  const sealBtn = document.getElementById('seal-btn');
  const envelope = document.querySelector('.envelope');

  if (sealBtn) {
    sealBtn.addEventListener('click', (e) => {
      e.stopPropagation(); 
      
      // trigger ang animation
      envelope.classList.add('open');
      
      //  background video kapag binuksan na
      const video = document.getElementById('matrix-video');
      if (video) {
        video.play().catch(err => console.log("Autoplay blocked:", err));
      }
    });
  }
});



document.addEventListener('DOMContentLoaded', () => {
  const sealBtn = document.getElementById('seal-btn');
  const envelope = document.querySelector('.envelope');
  const topFlap = document.querySelector('.envelope-top-flap');
  const video = document.getElementById('matrix-video');

  let isBrokenPermanently = false;

  // Open Sequence with Crack Effect 
  if (sealBtn) {
    sealBtn.addEventListener('click', (e) => {
      e.stopPropagation();

      if (!envelope.classList.contains('open')) {
        // 1. Ito yung Crack Animation
        envelope.classList.add('breaking');
        
        // 2. Pagkatapos ng maikling delay (300ms), buksan ang envelope flap
        setTimeout(() => {
          envelope.classList.remove('breaking');
          envelope.classList.add('open');
          isBrokenPermanently = true;

          if (video) {
            video.play().catch(err => console.log("Autoplay blocked:", err));
          }
        }, 300);
      }
    });
  }

  // Close Sequence (Triangle Flap Click)
  if (topFlap) {
    topFlap.addEventListener('click', (e) => {
      e.stopPropagation();

      if (envelope.classList.contains('open')) {
        envelope.classList.remove('open');
        
        // Kung nabasag na ang seal noon, mananatili itong may sira/broken
        if (isBrokenPermanently) {
          envelope.classList.add('broken');
        }

        if (video) {
          video.pause();
          video.currentTime = 0;
        }
      }
    });
  }
});