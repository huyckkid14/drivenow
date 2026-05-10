import * as THREE from "three";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bc8e8);
scene.fog = new THREE.Fog(0x9bc8e8, 105, 255);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 600);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const speedEl = document.querySelector("#speed");
const signalEl = document.querySelector("#signal");
const statusEl = document.querySelector("#status");
const restartBtn = document.querySelector("#restart");
const loadingEl = document.querySelector("#loading");

const clock = new THREE.Clock();
const keys = new Set();
const cars = [];
const trafficLights = [];
const roadSegments = [];
const collidableCars = [];
const buildingObstacles = [];
const buildings = new THREE.Group();
const roads = new THREE.Group();
const city = new THREE.Group();
const botColors = [0x3d78ff, 0xf25f5c, 0x70c1b3, 0xf7b267, 0xb388eb, 0x64b96a, 0xef476f];

const ROAD_HALF = 4.7;
const LANES = [-1.75, 1.75];
const GRID = [-54, -27, 0, 27, 54];
const BOUNDS = 68;
const CAR_RADIUS = 2.35;
const STOP_DISTANCE = 11.5;
const COLLISION_DISTANCE = 2.75;
const BUILDING_BOUNCE = 0.18;
const TRAFFIC_CYCLE = 10;

const state = {
  crashed: false,
  playerCrashed: false,
  signal: "off",
  hazard: false,
  time: 0,
};

const dirs = {
  east: new THREE.Vector3(1, 0, 0),
  west: new THREE.Vector3(-1, 0, 0),
  north: new THREE.Vector3(0, 0, -1),
  south: new THREE.Vector3(0, 0, 1),
};

init();
animate();

function init() {
  scene.add(city);
  city.add(buildings, roads);

  const hemi = new THREE.HemisphereLight(0xf7fbff, 0x47624f, 2.2);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffffff, 2.7);
  sun.position.set(-45, 80, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -120;
  sun.shadow.camera.right = 120;
  sun.shadow.camera.top = 120;
  sun.shadow.camera.bottom = -120;
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(180, 180),
    new THREE.MeshStandardMaterial({ color: 0x4b8b5a, roughness: 0.95 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  city.add(ground);

  createRoads();
  createBlocks();
  createTrafficLights();
  createPlayer();
  createBots();
  createSkylineDetails();

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
  window.addEventListener("resize", onResize);
  renderer.domElement.tabIndex = 0;
  renderer.domElement.addEventListener("click", () => renderer.domElement.focus());
  renderer.domElement.focus();
  restartBtn.addEventListener("click", restartCity);
  loadingEl.hidden = true;
}

function createRoads() {
  const asphalt = new THREE.MeshStandardMaterial({ color: 0x2a2f33, roughness: 0.82 });
  const stripe = new THREE.MeshStandardMaterial({ color: 0xf5f1d0, roughness: 0.7 });
  const crosswalk = new THREE.MeshStandardMaterial({ color: 0xe9ece8, roughness: 0.75 });

  for (const z of GRID) {
    const road = new THREE.Mesh(new THREE.BoxGeometry(145, 0.08, ROAD_HALF * 2), asphalt);
    road.position.set(0, 0.04, z);
    road.receiveShadow = true;
    roads.add(road);
    roadSegments.push({ axis: "x", fixed: z });

    for (let x = -66; x <= 66; x += 9) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.1, 0.16), stripe);
      dash.position.set(x, 0.11, z);
      roads.add(dash);
    }
  }

  for (const x of GRID) {
    const road = new THREE.Mesh(new THREE.BoxGeometry(ROAD_HALF * 2, 0.09, 145), asphalt);
    road.position.set(x, 0.05, 0);
    road.receiveShadow = true;
    roads.add(road);
    roadSegments.push({ axis: "z", fixed: x });

    for (let z = -66; z <= 66; z += 9) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.11, 4.2), stripe);
      dash.position.set(x, 0.12, z);
      roads.add(dash);
    }
  }

  for (const x of GRID) {
    for (const z of GRID) {
      const plaza = new THREE.Mesh(new THREE.BoxGeometry(ROAD_HALF * 2.05, 0.12, ROAD_HALF * 2.05), asphalt);
      plaza.position.set(x, 0.13, z);
      roads.add(plaza);

      for (let i = -2; i <= 2; i++) {
        const hStripe = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.15, 0.38), crosswalk);
        hStripe.position.set(x + i * 1.15, 0.2, z - ROAD_HALF - 1.2);
        roads.add(hStripe);
        const vStripe = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.15, 5.4), crosswalk);
        vStripe.position.set(x - ROAD_HALF - 1.2, 0.2, z + i * 1.15);
        roads.add(vStripe);
      }
    }
  }
}

function createBlocks() {
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xbfc5b8, roughness: 0.86 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x86a7bf, roughness: 0.45, metalness: 0.08 });

  for (let xi = 0; xi < GRID.length - 1; xi++) {
    for (let zi = 0; zi < GRID.length - 1; zi++) {
      const cx = (GRID[xi] + GRID[xi + 1]) / 2;
      const cz = (GRID[zi] + GRID[zi + 1]) / 2;
      const pad = new THREE.Mesh(new THREE.BoxGeometry(15.6, 0.18, 15.6), sidewalkMat);
      pad.position.set(cx, 0.1, cz);
      pad.receiveShadow = true;
      buildings.add(pad);

      const count = 2 + ((xi + zi) % 2);
      for (let i = 0; i < count; i++) {
        const w = 4.8 + ((i + xi) % 3) * 1.4;
        const d = 4.6 + ((i + zi) % 3) * 1.2;
        const h = 7 + ((xi * 5 + zi * 3 + i * 4) % 18);
        const bx = cx + (i % 2 ? 4.2 : -4.1);
        const bz = cz + (i > 1 ? 4.0 : -3.8);
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(0.07 + ((xi + zi + i) % 5) * 0.055, 0.25, 0.45),
          roughness: 0.68,
        });
        const tower = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        tower.position.set(bx, h / 2 + 0.2, bz);
        tower.castShadow = true;
        tower.receiveShadow = true;
        buildings.add(tower);
        buildingObstacles.push({ x: bx, z: bz, halfX: w / 2 + 0.7, halfZ: d / 2 + 0.7 });

        for (let y = 2.2; y < h - 1; y += 2.6) {
          const win = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.55, 0.08), glassMat);
          win.position.set(bx, y, bz - d / 2 - 0.05);
          buildings.add(win);
        }
      }
    }
  }
}

function createTrafficLights() {
  for (const x of GRID) {
    for (const z of GRID) {
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x28312f, roughness: 0.6 });
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 4.9, 12), poleMat);
      pole.position.set(x + 6.4, 2.1, z + 6.4);
      pole.castShadow = true;
      city.add(pole);

      const armA = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 3.2), poleMat);
      armA.position.set(x + 6.4, 4.78, z + 4.9);
      const armB = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.18, 0.18), poleMat);
      armB.position.set(x + 4.9, 4.78, z + 6.4);
      city.add(armA, armB);

      const nsLight = makeSignalLamp(x, z, "ns", new THREE.Vector3(x + 6.42, 4.42, z + 3.75));
      const ewLight = makeSignalLamp(x, z, "ew", new THREE.Vector3(x + 3.75, 4.42, z + 6.42));
      ewLight.group.rotation.y = Math.PI / 2;
      trafficLights.push(nsLight, ewLight);
    }
  }
}

function makeSignalLamp(x, z, axis, position) {
  const group = new THREE.Group();
  group.position.copy(position);
  const housing = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 2.25, 0.42),
    new THREE.MeshStandardMaterial({ color: 0x151918, roughness: 0.55 }),
  );
  housing.castShadow = true;
  const red = lampDisc(0xff241d, 0.68);
  const yellow = lampDisc(0xffcf33, 0);
  const green = lampDisc(0x36dc6d, -0.68);
  group.add(housing, red, yellow, green);
  city.add(group);
  return { x, z, axis, group, red, yellow, green, state: "red" };
}

function lampDisc(color, y) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 24, 12),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.16, roughness: 0.28 }),
  );
  mesh.position.y = y;
  mesh.position.z = -0.24;
  return mesh;
}

function createPlayer() {
  const player = makeCar(0xffd23f, true);
  player.name = "player";
  player.position.set(-50, 0, -1.75);
  player.rotation.y = Math.PI / 2;
  player.userData = {
    player: true,
    speed: 0,
    maxSpeed: 30,
    route: null,
    immobilized: false,
    hazard: false,
    blink: 0,
    steer: 0,
    velocity: new THREE.Vector3(),
    lastSafe: player.position.clone(),
    indicators: player.userData.indicators,
  };
  city.add(player);
  cars.push(player);
  collidableCars.push(player);
  state.player = player;
}

function createBots() {
  const starts = [
    { x: -60, z: 1.75, dir: "east" },
    { x: 60, z: -25.25, dir: "west" },
    { x: -1.75, z: 60, dir: "north" },
    { x: 25.25, z: -60, dir: "south" },
    { x: -60, z: 28.75, dir: "east" },
    { x: 60, z: 52.25, dir: "west" },
    { x: -28.75, z: -60, dir: "south" },
    { x: 52.25, z: 60, dir: "north" },
    { x: -60, z: -52.25, dir: "east" },
    { x: 1.75, z: -60, dir: "south" },
  ];

  starts.forEach((start, index) => {
    const bot = makeCar(botColors[index % botColors.length], false);
    bot.position.set(start.x, 0, start.z);
    bot.rotation.y = yawForDir(start.dir);
    bot.userData = {
      player: false,
      speed: 10 + (index % 4) * 1.5,
      desiredSpeed: 13 + (index % 3) * 2.2,
      maxSpeed: 20,
      dir: start.dir,
      turnMemory: 0,
      immobilized: false,
      hazard: false,
      blink: Math.random(),
      velocity: new THREE.Vector3(),
      indicators: bot.userData.indicators,
    };
    city.add(bot);
    cars.push(bot);
    collidableCars.push(bot);
  });
}

function makeCar(color, isPlayer) {
  const car = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.08 });
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0x1e3945, roughness: 0.24, metalness: 0.08 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffa400, emissiveIntensity: 0 });
  const rearMat = new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0xff1111, emissiveIntensity: 0.15 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.72, 4.1), bodyMat);
  body.position.y = 0.65;
  body.castShadow = true;
  body.receiveShadow = true;
  car.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.78, 1.8), cabinMat);
  cabin.position.set(0, 1.25, -0.25);
  cabin.castShadow = true;
  car.add(cabin);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.35, 0.42), rearMat);
  nose.position.set(0, 0.76, 2.12);
  car.add(nose);

  const indicators = [];
  for (const [x, z] of [
    [-1.05, 2.12],
    [1.05, 2.12],
    [-1.05, -2.12],
    [1.05, -2.12],
  ]) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.18), lightMat.clone());
    lamp.position.set(x, 0.82, z);
    car.add(lamp);
    indicators.push(lamp);
  }

  for (const [x, z] of [
    [-1.2, -1.35],
    [1.2, -1.35],
    [-1.2, 1.35],
    [1.2, 1.35],
  ]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.28, 16), tireMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.33, z);
    wheel.castShadow = true;
    car.add(wheel);
  }

  if (isPlayer) {
    const marker = new THREE.Mesh(
      new THREE.ConeGeometry(0.65, 1.15, 3),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x9ee7ff, emissiveIntensity: 0.32 }),
    );
    marker.position.set(0, 2.35, 0);
    marker.rotation.y = Math.PI;
    car.add(marker);
  }

  car.userData.indicators = indicators;
  return car;
}

function createSkylineDetails() {
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x276f42, roughness: 0.8 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7a5630, roughness: 0.8 });
  for (let i = 0; i < 70; i++) {
    const x = -72 + (i * 17) % 145;
    const z = -72 + (i * 31) % 145;
    if (isOnRoad(x, z)) continue;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 1.2, 8), trunkMat);
    trunk.position.set(x, 0.65, z);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.5, 9), treeMat);
    crown.position.set(x, 2.15, z);
    crown.castShadow = true;
    city.add(trunk, crown);
  }
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.045);
  state.time += dt;
  updateTrafficLights();
  updatePlayer(dt);
  updateBots(dt);
  updateCollisions(dt);
  updateSignals(dt);
  updateCamera(dt);
  updateHud();
  renderer.render(scene, camera);
}

function updateTrafficLights() {
  const phase = state.time % TRAFFIC_CYCLE;
  const ewGreen = phase < 4.5;
  const yellow = phase >= 4.5 && phase < 5.5;
  for (const light of trafficLights) {
    const green = light.axis === "ew" ? ewGreen : !ewGreen && phase >= 5.5;
    const caution = light.axis === "ew" ? yellow : phase >= 9 && phase < 10;
    light.state = green ? "green" : caution ? "yellow" : "red";
    light.red.material.emissiveIntensity = light.state === "red" ? 1.8 : 0.08;
    light.yellow.material.emissiveIntensity = light.state === "yellow" ? 1.7 : 0.08;
    light.green.material.emissiveIntensity = light.state === "green" ? 1.6 : 0.08;
    light.red.scale.setScalar(light.state === "red" ? 1.22 : 0.82);
    light.yellow.scale.setScalar(light.state === "yellow" ? 1.22 : 0.82);
    light.green.scale.setScalar(light.state === "green" ? 1.22 : 0.82);
  }
}

function updatePlayer(dt) {
  const car = state.player;
  const data = car.userData;
  if (data.immobilized) return;

  const throttle = keys.has("arrowup") ? 1 : 0;
  const brakeKey = keys.has("arrowdown") ? 1 : 0;
  const steerInput = (keys.has("arrowleft") ? 1 : 0) - (keys.has("arrowright") ? 1 : 0);
  data.steer = moveToward(data.steer, steerInput, dt * 4.8);

  const accel = throttle * 18;
  const brake = brakeKey * (data.speed > 0.2 ? 34 : 13);
  const drag = 4.2 + Math.abs(data.speed) * 0.1;
  data.speed += accel * dt;
  data.speed -= brake * dt;
  if (!throttle && !brakeKey) data.speed -= Math.sign(data.speed) * drag * dt;
  if (Math.abs(data.speed) < 0.1) data.speed = 0;
  data.speed = THREE.MathUtils.clamp(data.speed, -7.5, data.maxSpeed);

  if (Math.abs(data.speed) > 0.4) {
    const speedFactor = THREE.MathUtils.clamp(Math.abs(data.speed) / data.maxSpeed, 0.18, 1);
    car.rotation.y += data.steer * dt * (1.18 + speedFactor * 1.25) * Math.sign(data.speed || 1);
  }

  const forward = getForward(car);
  const previous = car.position.clone();
  data.velocity.copy(forward).multiplyScalar(data.speed);
  car.position.addScaledVector(data.velocity, dt);
  keepNearRoad(car);
  resolveBuildingCollisions(car, previous);
  car.position.x = THREE.MathUtils.clamp(car.position.x, -BOUNDS, BOUNDS);
  car.position.z = THREE.MathUtils.clamp(car.position.z, -BOUNDS, BOUNDS);
}

function updateBots(dt) {
  for (const bot of cars) {
    const data = bot.userData;
    if (data.player || data.immobilized) continue;

    const frontBlocked = findCarAhead(bot, 14);
    const redBlocked = mustStopForSignal(bot);
    const targetSpeed = frontBlocked || redBlocked ? 0 : data.desiredSpeed;
    const rate = targetSpeed < data.speed ? 22 : 7;
    data.speed = moveToward(data.speed, targetSpeed, rate * dt);

    maybeTurnAtIntersection(bot);
    const forward = dirs[data.dir];
    bot.rotation.y = lerpAngle(bot.rotation.y, yawForDir(data.dir), dt * 7);
    data.velocity.copy(forward).multiplyScalar(data.speed);
    bot.position.addScaledVector(data.velocity, dt);
    wrapBot(bot);
  }
}

function maybeTurnAtIntersection(bot) {
  const data = bot.userData;
  const nearestX = nearestGrid(bot.position.x);
  const nearestZ = nearestGrid(bot.position.z);
  const atIntersection = Math.abs(bot.position.x - nearestX) < 0.7 && Math.abs(bot.position.z - nearestZ) < 0.7;
  if (!atIntersection || state.time - data.turnMemory < 1.2) return;

  data.turnMemory = state.time;
  const options = turnOptions(data.dir);
  const pick = options[Math.floor(Math.abs(Math.sin(bot.id.length + state.time * 0.71)) * options.length)];
  data.dir = pick;
  snapToLane(bot);
}

function turnOptions(dir) {
  if (dir === "east" || dir === "west") return Math.random() < 0.62 ? [dir] : [dir, "north", "south"];
  return Math.random() < 0.62 ? [dir] : [dir, "east", "west"];
}

function snapToLane(bot) {
  const data = bot.userData;
  if (data.dir === "east") bot.position.z = nearestGrid(bot.position.z) + LANES[1];
  if (data.dir === "west") bot.position.z = nearestGrid(bot.position.z) + LANES[0];
  if (data.dir === "north") bot.position.x = nearestGrid(bot.position.x) + LANES[0];
  if (data.dir === "south") bot.position.x = nearestGrid(bot.position.x) + LANES[1];
}

function mustStopForSignal(bot) {
  const data = bot.userData;
  const forward = dirs[data.dir];
  const axis = data.dir === "east" || data.dir === "west" ? "ew" : "ns";
  const ix = nearestGrid(bot.position.x);
  const iz = nearestGrid(bot.position.z);
  const toStop = new THREE.Vector3(ix - bot.position.x, 0, iz - bot.position.z);
  const ahead = toStop.dot(forward);
  if (ahead < 1.8 || ahead > STOP_DISTANCE) return false;
  const laneAligned = axis === "ew" ? Math.abs(bot.position.z - iz) < ROAD_HALF : Math.abs(bot.position.x - ix) < ROAD_HALF;
  if (!laneAligned) return false;
  const light = trafficLights.find((item) => item.x === ix && item.z === iz && item.axis === axis);
  return light && light.state !== "green";
}

function findCarAhead(car, distance) {
  const forward = getForward(car);
  for (const other of collidableCars) {
    if (other === car || other.userData.immobilized) continue;
    const delta = other.position.clone().sub(car.position);
    const ahead = delta.dot(forward);
    if (ahead <= 0 || ahead > distance) continue;
    const side = delta.lengthSq() - ahead * ahead;
    if (side < 8) return other;
  }
  return null;
}

function updateCollisions(dt) {
  for (let i = 0; i < collidableCars.length; i++) {
    for (let j = i + 1; j < collidableCars.length; j++) {
      const a = collidableCars[i];
      const b = collidableCars[j];
      if (a.userData.immobilized && b.userData.immobilized) continue;
      const dist = a.position.distanceTo(b.position);
      if (dist > COLLISION_DISTANCE) continue;
      immobilizeCollision(a, b, dt);
    }
  }
}

function immobilizeCollision(a, b, dt) {
  const normal = a.position.clone().sub(b.position);
  if (normal.lengthSq() < 0.001) normal.copy(getForward(a));
  normal.y = 0;
  normal.normalize();

  const overlap = Math.max(0, COLLISION_DISTANCE - a.position.distanceTo(b.position));
  a.position.addScaledVector(normal, overlap * 0.55 + 0.35);
  b.position.addScaledVector(normal, -overlap * 0.55 - 0.35);

  const velocityA = carVelocity(a);
  const velocityB = carVelocity(b);
  const relativeVelocity = velocityA.clone().sub(velocityB);
  const closingSpeed = Math.max(0, -relativeVelocity.dot(normal));
  const impulse = normal.clone().multiplyScalar(closingSpeed * 0.62 + relativeVelocity.length() * 0.18);
  a.position.addScaledVector(impulse, dt * 0.36);
  b.position.addScaledVector(impulse, -dt * 0.36);

  const tangent = new THREE.Vector3(-normal.z, 0, normal.x);
  const spin = THREE.MathUtils.clamp(relativeVelocity.dot(tangent) * 0.045, -0.7, 0.7);
  a.rotation.y += spin;
  b.rotation.y -= spin;

  for (const car of [a, b]) {
    car.userData.speed = 0;
    car.userData.velocity.set(0, 0, 0);
    car.userData.immobilized = true;
    car.userData.hazard = true;
  }
  state.crashed = true;
  if (a.userData.player || b.userData.player) {
    state.playerCrashed = true;
    restartBtn.hidden = false;
    statusEl.textContent = "Crash - restart ready";
  }
}

function updateSignals(dt) {
  for (const car of cars) {
    const data = car.userData;
    data.blink += dt * 3.2;
    const on = Math.sin(data.blink * Math.PI) > 0;
    const useHazard = data.hazard || (data.player && state.hazard);
    const left = useHazard || (data.player && state.signal === "left");
    const right = useHazard || (data.player && state.signal === "right");
    const lamps = data.indicators;
    setLamp(lamps[0], left && on);
    setLamp(lamps[2], left && on);
    setLamp(lamps[1], right && on);
    setLamp(lamps[3], right && on);
  }
}

function setLamp(lamp, active) {
  lamp.material.emissiveIntensity = active ? 2.8 : 0;
  lamp.material.color.set(active ? 0xffb000 : 0xffd166);
}

function updateCamera(dt) {
  const car = state.player;
  const forward = getForward(car);
  const target = car.position
    .clone()
    .addScaledVector(forward, -15)
    .add(new THREE.Vector3(0, 11, 0));
  camera.position.lerp(target, 1 - Math.pow(0.001, dt));
  const look = car.position.clone().addScaledVector(forward, 8).add(new THREE.Vector3(0, 2.2, 0));
  camera.lookAt(look);
}

function updateHud() {
  const speed = Math.round(Math.abs(state.player.userData.speed) * 2.237);
  speedEl.textContent = `${speed} mph`;
  if (state.hazard || state.player.userData.hazard) signalEl.textContent = "Hazards";
  else if (state.signal === "left") signalEl.textContent = "Left indicator";
  else if (state.signal === "right") signalEl.textContent = "Right indicator";
  else signalEl.textContent = "Signals off";
  if (!state.playerCrashed) {
    statusEl.textContent = state.crashed ? "Crash in city" : "City clear";
  }
}

function onKeyDown(event) {
  const key = event.key.toLowerCase();
  keys.add(key);
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "q", "r", "z"].includes(key)) {
    event.preventDefault();
  }
  if (event.repeat && ["q", "r", "z"].includes(key)) return;
  if (key === "q") {
    state.signal = state.signal === "left" ? "off" : "left";
    state.hazard = false;
  }
  if (key === "r") {
    state.signal = state.signal === "right" ? "off" : "right";
    state.hazard = false;
  }
  if (key === "z") {
    state.hazard = !state.hazard;
    state.signal = "off";
  }
}

function restartCity() {
  for (const car of cars) city.remove(car);
  cars.length = 0;
  collidableCars.length = 0;
  state.crashed = false;
  state.playerCrashed = false;
  state.signal = "off";
  state.hazard = false;
  restartBtn.hidden = true;
  createPlayer();
  createBots();
}

function resolveBuildingCollisions(car, previous) {
  let hit = false;
  for (const obstacle of buildingObstacles) {
    const closestX = THREE.MathUtils.clamp(car.position.x, obstacle.x - obstacle.halfX, obstacle.x + obstacle.halfX);
    const closestZ = THREE.MathUtils.clamp(car.position.z, obstacle.z - obstacle.halfZ, obstacle.z + obstacle.halfZ);
    const dx = car.position.x - closestX;
    const dz = car.position.z - closestZ;
    const distSq = dx * dx + dz * dz;
    if (distSq > CAR_RADIUS * CAR_RADIUS) continue;

    let normal = new THREE.Vector3(dx, 0, dz);
    if (normal.lengthSq() < 0.001) {
      const fromPrevious = previous.clone().sub(new THREE.Vector3(obstacle.x, 0, obstacle.z));
      normal.set(fromPrevious.x, 0, fromPrevious.z);
      if (normal.lengthSq() < 0.001) normal.set(0, 0, 1);
    }
    normal.normalize();
    const penetration = CAR_RADIUS - Math.sqrt(Math.max(distSq, 0.0001));
    car.position.addScaledVector(normal, penetration + 0.04);

    const velocity = carVelocity(car);
    const normalSpeed = velocity.dot(normal);
    if (normalSpeed < 0) {
      velocity.addScaledVector(normal, -(1 + BUILDING_BOUNCE) * normalSpeed);
    }
    car.userData.speed = Math.min(0, velocity.dot(getForward(car))) * 0.35;
    car.userData.velocity.copy(velocity.multiplyScalar(0.25));
    hit = true;
  }
  if (hit && Math.abs(car.userData.speed) < 1.2) car.userData.speed = 0;
}

function keepNearRoad(car) {
  const onHorizontal = GRID.some((z) => Math.abs(car.position.z - z) < ROAD_HALF + 1.1);
  const onVertical = GRID.some((x) => Math.abs(car.position.x - x) < ROAD_HALF + 1.1);
  if (onHorizontal || onVertical) return;
  const nx = nearestGrid(car.position.x);
  const nz = nearestGrid(car.position.z);
  if (Math.abs(car.position.x - nx) < Math.abs(car.position.z - nz)) {
    car.position.x = moveToward(car.position.x, nx, 0.26);
  } else {
    car.position.z = moveToward(car.position.z, nz, 0.26);
  }
}

function wrapBot(bot) {
  if (bot.position.x > BOUNDS) bot.position.x = -BOUNDS;
  if (bot.position.x < -BOUNDS) bot.position.x = BOUNDS;
  if (bot.position.z > BOUNDS) bot.position.z = -BOUNDS;
  if (bot.position.z < -BOUNDS) bot.position.z = BOUNDS;
  snapToLane(bot);
}

function getForward(car) {
  return new THREE.Vector3(Math.sin(car.rotation.y), 0, Math.cos(car.rotation.y));
}

function carVelocity(car) {
  if (car.userData.velocity && car.userData.velocity.lengthSq() > 0.001) {
    return car.userData.velocity.clone();
  }
  return getForward(car).multiplyScalar(car.userData.speed || 0);
}

function yawForDir(dir) {
  return { east: Math.PI / 2, west: -Math.PI / 2, north: Math.PI, south: 0 }[dir];
}

function nearestGrid(value) {
  return GRID.reduce((best, item) => (Math.abs(value - item) < Math.abs(value - best) ? item : best), GRID[0]);
}

function isOnRoad(x, z) {
  return GRID.some((line) => Math.abs(x - line) < ROAD_HALF + 2 || Math.abs(z - line) < ROAD_HALF + 2);
}

function moveToward(current, target, amount) {
  if (current < target) return Math.min(current + amount, target);
  return Math.max(current - amount, target);
}

function lerpAngle(a, b, t) {
  const diff = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + diff * THREE.MathUtils.clamp(t, 0, 1);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
