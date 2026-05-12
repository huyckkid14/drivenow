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
const leftSignalBtn = document.querySelector("#leftSignal");
const rightSignalBtn = document.querySelector("#rightSignal");
const hazardsBtn = document.querySelector("#hazards");

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
const CAR_HALF_WIDTH = 1.23;
const CAR_HALF_LENGTH = 2.12;
const STOP_DISTANCE = 13.5;
const STOP_LINE_OFFSET = ROAD_HALF + 0.75;
const SIGNAL_GREEN_TIME = 4.5;
const SIGNAL_YELLOW_TIME = 1.25;
const SIGNAL_ALL_RED_TIME = 2;
const HONK_COOLDOWN = 1.2;
const COLLISION_BROAD_PHASE = 5.3;
const BUILDING_BOUNCE = 0.18;
const CRASH_FRICTION = 4.8;
const CRASH_SPIN_FRICTION = 3.6;
const TRAFFIC_CYCLE = (SIGNAL_GREEN_TIME + SIGNAL_YELLOW_TIME + SIGNAL_ALL_RED_TIME) * 2;

const state = {
  crashed: false,
  playerCrashed: false,
  signal: "off",
  hazard: false,
  time: 0,
  audio: null,
  lastCrashSound: -10,
  lastHonkSound: -10,
  greenBlockTimer: 0,
  toggleHeld: new Set(),
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

  window.addEventListener("keydown", onKeyDown, { capture: true });
  window.addEventListener("keypress", onKeyPress, { capture: true });
  window.addEventListener("keyup", onKeyUp, { capture: true });
  window.addEventListener("resize", onResize);
  renderer.domElement.tabIndex = 0;
  renderer.domElement.addEventListener("pointerdown", () => {
    renderer.domElement.focus();
    ensureAudio();
  });
  renderer.domElement.focus();
  leftSignalBtn.addEventListener("click", () => toggleSignal("left"));
  rightSignalBtn.addEventListener("click", () => toggleSignal("right"));
  hazardsBtn.addEventListener("click", toggleHazards);
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
      const corners = [
        { px: x - 6.3, pz: z - 6.3, axis: "ns", yaw: 0, lx: x - 6.3, lz: z - 3.75 },
        { px: x + 6.3, pz: z + 6.3, axis: "ns", yaw: Math.PI, lx: x + 6.3, lz: z + 3.75 },
        { px: x - 6.3, pz: z + 6.3, axis: "ew", yaw: -Math.PI / 2, lx: x - 3.75, lz: z + 6.3 },
        { px: x + 6.3, pz: z - 6.3, axis: "ew", yaw: Math.PI / 2, lx: x + 3.75, lz: z - 6.3 },
      ];

      for (const corner of corners) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 4.9, 12), poleMat);
        pole.position.set(corner.px, 2.1, corner.pz);
        pole.castShadow = true;
        city.add(pole);

        const armLength = Math.abs(corner.lx - corner.px) > Math.abs(corner.lz - corner.pz) ? "x" : "z";
        const arm = new THREE.Mesh(
          new THREE.BoxGeometry(armLength === "x" ? 2.8 : 0.18, 0.18, armLength === "z" ? 2.8 : 0.18),
          poleMat,
        );
        arm.position.set((corner.px + corner.lx) / 2, 4.78, (corner.pz + corner.lz) / 2);
        city.add(arm);

        const light = makeSignalLamp(x, z, corner.axis, new THREE.Vector3(corner.lx, 4.42, corner.lz));
        light.group.rotation.y = corner.yaw;
        trafficLights.push(light);
      }
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
    braking: false,
    velocity: new THREE.Vector3(),
    angularVelocity: 0,
    crashed: false,
    crashTimer: 0,
    lastSafe: player.position.clone(),
    indicators: player.userData.indicators,
    brakeLights: player.userData.brakeLights,
  };
  city.add(player);
  cars.push(player);
  collidableCars.push(player);
  state.player = player;
}

function createBots() {
  const starts = makeBotStarts();

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
      braking: false,
      velocity: new THREE.Vector3(),
      angularVelocity: 0,
      crashed: false,
    crashTimer: 0,
    lastHonk: -10,
    indicators: bot.userData.indicators,
    brakeLights: bot.userData.brakeLights,
  };
    city.add(bot);
    cars.push(bot);
    collidableCars.push(bot);
  });
}

function makeBotStarts() {
  const starts = [];
  for (const z of GRID) {
    starts.push({ x: -64, z: z + LANES[1], dir: "east" });
    starts.push({ x: 64, z: z + LANES[0], dir: "west" });
  }
  for (const x of GRID) {
    starts.push({ x: x + LANES[0], z: 64, dir: "north" });
    starts.push({ x: x + LANES[1], z: -64, dir: "south" });
  }

  const extra = [
    { x: -37, z: 1.75, dir: "east" },
    { x: 35, z: -1.75, dir: "west" },
    { x: -25.25, z: 38, dir: "north" },
    { x: 28.75, z: -36, dir: "south" },
    { x: -42, z: 28.75, dir: "east" },
    { x: 44, z: 25.25, dir: "west" },
    { x: -55.75, z: 42, dir: "north" },
    { x: 55.75, z: -42, dir: "south" },
  ];
  return starts.concat(extra);
}

function makeCar(color, isPlayer) {
  const car = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.08 });
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0x1e3945, roughness: 0.24, metalness: 0.08 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffa400, emissiveIntensity: 0 });
  const headlightMat = new THREE.MeshStandardMaterial({ color: 0xf7f2d8, emissive: 0xfff0b0, emissiveIntensity: 0.75 });
  const brakeMat = new THREE.MeshStandardMaterial({ color: 0x9d1010, emissive: 0xff1515, emissiveIntensity: 0.12 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.72, 4.1), bodyMat);
  body.position.y = 0.65;
  body.castShadow = true;
  body.receiveShadow = true;
  car.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.78, 1.8), cabinMat);
  cabin.position.set(0, 1.25, -0.25);
  cabin.castShadow = true;
  car.add(cabin);

  for (const x of [-0.58, 0.58]) {
    const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.16), headlightMat.clone());
    headlight.position.set(x, 0.82, 2.14);
    car.add(headlight);
  }

  const indicators = [];
  const brakeLights = [];
  for (const spec of [
    { side: "left", x: 1.23, z: 1.72, rot: Math.PI / 2 },
    { side: "left", x: 1.23, z: -1.72, rot: Math.PI / 2 },
    { side: "right", x: -1.23, z: 1.72, rot: Math.PI / 2 },
    { side: "right", x: -1.23, z: -1.72, rot: Math.PI / 2 },
    { side: "left", x: 0.96, z: 2.18, rot: 0 },
    { side: "right", x: -0.96, z: 2.18, rot: 0 },
    { side: "left", x: 0.96, z: -2.18, rot: 0 },
    { side: "right", x: -0.96, z: -2.18, rot: 0 },
  ]) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.14), lightMat.clone());
    lamp.position.set(spec.x, 0.86, spec.z);
    lamp.rotation.y = spec.rot;
    car.add(lamp);
    indicators.push({ side: spec.side, lamp });
  }

  for (const x of [-0.62, 0.62]) {
    const brake = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.26, 0.16), brakeMat.clone());
    brake.position.set(x, 0.86, -2.14);
    car.add(brake);
    brakeLights.push(brake);
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
  car.userData.brakeLights = brakeLights;
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
  updateCrashPhysics(dt);
  updatePlayer(dt);
  updateBots(dt);
  updateDriverReactions(dt);
  updateCollisions(dt);
  updateSignals(dt);
  updateCamera(dt);
  updateHud();
  renderer.render(scene, camera);
}

function updateTrafficLights() {
  const phase = state.time % TRAFFIC_CYCLE;
  const ewYellowStart = SIGNAL_GREEN_TIME;
  const ewAllRedStart = ewYellowStart + SIGNAL_YELLOW_TIME;
  const nsGreenStart = ewAllRedStart + SIGNAL_ALL_RED_TIME;
  const nsYellowStart = nsGreenStart + SIGNAL_GREEN_TIME;
  const nsAllRedStart = nsYellowStart + SIGNAL_YELLOW_TIME;

  for (const light of trafficLights) {
    if (light.axis === "ew") {
      light.state = phase < ewYellowStart ? "green" : phase < ewAllRedStart ? "yellow" : "red";
    } else {
      light.state = phase >= nsGreenStart && phase < nsYellowStart ? "green" : phase >= nsYellowStart && phase < nsAllRedStart ? "yellow" : "red";
    }
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
  if (data.immobilized || data.crashed) return;

  const throttle = keys.has("arrowup") ? 1 : 0;
  const brakeKey = keys.has("arrowdown") ? 1 : 0;
  const steerInput = (keys.has("arrowleft") ? 1 : 0) - (keys.has("arrowright") ? 1 : 0);
  data.steer = moveToward(data.steer, steerInput, dt * 4.8);

  const accel = throttle * 18;
  const brake = brakeKey * (data.speed > 0.2 ? 34 : 13);
  const drag = 4.2 + Math.abs(data.speed) * 0.1;
  data.braking = Boolean(brakeKey || (!throttle && data.speed > 4));
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
    if (data.player || data.immobilized || data.crashed) continue;

    const frontBlocked = findCarAhead(bot, 14);
    const signalStop = stopInfoForSignal(bot);
    const redBlocked = Boolean(signalStop);
    const targetSpeed = frontBlocked || redBlocked ? 0 : data.desiredSpeed;
    const rate = targetSpeed < data.speed ? (redBlocked ? 34 : 22) : 7;
    data.braking = targetSpeed < data.speed - 0.5;
    data.speed = moveToward(data.speed, targetSpeed, rate * dt);

    maybeTurnAtIntersection(bot);
    const forward = dirs[data.dir];
    const previous = bot.position.clone();
    bot.rotation.y = lerpAngle(bot.rotation.y, yawForDir(data.dir), dt * 7);
    data.velocity.copy(forward).multiplyScalar(data.speed);
    bot.position.addScaledVector(data.velocity, dt);
    if (signalStop) alignWithStopLine(bot, signalStop, dt, previous, !frontBlocked);
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

function stopInfoForSignal(bot) {
  const data = bot.userData;
  const forward = dirs[data.dir];
  const axis = data.dir === "east" || data.dir === "west" ? "ew" : "ns";
  const ix = nearestGrid(bot.position.x);
  const iz = nearestGrid(bot.position.z);
  const stopCenter = stopCenterForDirection(ix, iz, data.dir);
  const toStop = stopCenter.clone().sub(bot.position);
  const ahead = toStop.dot(forward);
  if (ahead > STOP_DISTANCE || ahead < -CAR_HALF_LENGTH - 0.9) return null;
  const laneAligned = axis === "ew" ? Math.abs(bot.position.z - iz) < ROAD_HALF : Math.abs(bot.position.x - ix) < ROAD_HALF;
  if (!laneAligned) return null;
  const light = trafficLights.find((item) => item.x === ix && item.z === iz && item.axis === axis);
  if (!light || light.state === "green") return null;
  return { stopCenter, forward, ahead };
}

function stopCenterForDirection(ix, iz, dir) {
  if (dir === "east") return new THREE.Vector3(ix - STOP_LINE_OFFSET - CAR_HALF_LENGTH, 0, iz + LANES[1]);
  if (dir === "west") return new THREE.Vector3(ix + STOP_LINE_OFFSET + CAR_HALF_LENGTH, 0, iz + LANES[0]);
  if (dir === "north") return new THREE.Vector3(ix + LANES[0], 0, iz + STOP_LINE_OFFSET + CAR_HALF_LENGTH);
  return new THREE.Vector3(ix + LANES[1], 0, iz - STOP_LINE_OFFSET - CAR_HALF_LENGTH);
}

function alignWithStopLine(bot, stop, dt, previous, canCreep) {
  const data = bot.userData;
  const offset = stop.stopCenter.clone().sub(bot.position);
  const along = offset.dot(stop.forward);
  const side = offset.clone().addScaledVector(stop.forward, -along);
  const previousAlong = stop.stopCenter.clone().sub(previous).dot(stop.forward);

  if (side.lengthSq() > 0.0001) bot.position.addScaledVector(side, Math.min(1, dt * 4.5));
  if (Math.abs(along) < 0.06 || (previousAlong >= 0 && along <= 0)) {
    bot.position.copy(stop.stopCenter);
    data.speed = 0;
    data.velocity.set(0, 0, 0);
    data.braking = true;
    return;
  }

  if (along > 0) {
    if (canCreep && Math.abs(data.speed) < 0.2) {
      bot.position.addScaledVector(stop.forward, Math.min(along, 1.8 * dt));
    }
    return;
  }

  if (canBackUpToStopLine(bot, stop)) {
    const reverseStep = Math.min(-along, 2.4 * dt);
    bot.position.addScaledVector(stop.forward, -reverseStep);
    data.speed = 0;
    data.velocity.set(0, 0, 0);
    data.braking = true;
  }
}

function canBackUpToStopLine(bot, stop) {
  const needed = stop.stopCenter.distanceTo(bot.position);
  if (needed > 2.5) return false;
  for (const other of collidableCars) {
    if (other === bot || other.userData.immobilized) continue;
    const delta = other.position.clone().sub(bot.position);
    const behind = -delta.dot(stop.forward);
    if (behind <= 0 || behind > needed + CAR_HALF_LENGTH * 2.4) continue;
    const side = delta.lengthSq() - behind * behind;
    if (side < 7.5) return false;
  }
  return true;
}

function findCarAhead(car, distance) {
  const forward = getForward(car);
  for (const other of collidableCars) {
    if (other === car || other.userData.immobilized) continue;
    const delta = other.position.clone().sub(car.position);
    const ahead = delta.dot(forward);
    if (ahead <= 0 || ahead > distance) continue;
    const side = delta.lengthSq() - ahead * ahead;
    if (side < 6.1) return other;
  }
  return null;
}

function updateDriverReactions(dt) {
  const player = state.player;
  const data = player.userData;
  if (data.immobilized || data.crashed || state.playerCrashed) return;

  const signal = playerSignalInfo();
  const botBehind = findBotBehindPlayer(19);
  const blockingGreen = signal && signal.light.state === "green" && Math.abs(data.speed) < 0.6 && botBehind;
  state.greenBlockTimer = blockingGreen ? state.greenBlockTimer + dt : 0;
  if (state.greenBlockTimer > 1.1) {
    requestHonk(botBehind, "short");
  }

  if (signal && signal.light.state !== "green" && signal.along < -CAR_HALF_LENGTH * 0.45) {
    requestNearbyHonk("angry", 24);
  }

  for (const bot of cars) {
    const botData = bot.userData;
    if (botData.player || botData.immobilized || botData.crashed) continue;
    const forward = dirs[botData.dir];
    const delta = player.position.clone().sub(bot.position);
    const ahead = delta.dot(forward);
    if (ahead <= 0.8 || ahead > 9.5) continue;
    const sideSq = delta.lengthSq() - ahead * ahead;
    if (sideSq > 7.8) continue;
    const playerForward = getForward(player);
    const crossing = Math.abs(playerForward.dot(forward)) < 0.72;
    const abruptBlock = botData.speed > Math.max(4, Math.abs(data.speed) + 4);
    if (crossing || abruptBlock) requestHonk(bot, "angry");
  }
}

function playerSignalInfo() {
  const player = state.player;
  const forward = getForward(player).normalize();
  const dir = directionFromForward(forward);
  const axis = dir === "east" || dir === "west" ? "ew" : "ns";
  const ix = nearestGrid(player.position.x);
  const iz = nearestGrid(player.position.z);
  const stopCenter = stopCenterForDirection(ix, iz, dir);
  const toStop = stopCenter.clone().sub(player.position);
  const along = toStop.dot(dirs[dir]);
  if (along > STOP_DISTANCE || along < -ROAD_HALF - CAR_HALF_LENGTH) return null;
  const laneAligned = axis === "ew" ? Math.abs(player.position.z - iz) < ROAD_HALF : Math.abs(player.position.x - ix) < ROAD_HALF;
  if (!laneAligned) return null;
  const light = trafficLights.find((item) => item.x === ix && item.z === iz && item.axis === axis);
  return light ? { light, dir, along } : null;
}

function findBotBehindPlayer(distance) {
  const player = state.player;
  const playerForward = getForward(player).normalize();
  let closest = null;
  let closestBehind = Infinity;

  for (const bot of cars) {
    const data = bot.userData;
    if (data.player || data.immobilized || data.crashed) continue;
    const botForward = dirs[data.dir];
    if (botForward.dot(playerForward) < 0.78) continue;
    const delta = player.position.clone().sub(bot.position);
    const behind = delta.dot(botForward);
    if (behind <= CAR_HALF_LENGTH || behind > distance) continue;
    const sideSq = delta.lengthSq() - behind * behind;
    if (sideSq > 7.2) continue;
    if (behind < closestBehind) {
      closest = bot;
      closestBehind = behind;
    }
  }

  return closest;
}

function requestNearbyHonk(kind, distance) {
  const player = state.player;
  let closest = null;
  let closestDistance = Infinity;
  for (const car of cars) {
    if (car.userData.player || car.userData.immobilized || car.userData.crashed) continue;
    const distanceToPlayer = car.position.distanceTo(player.position);
    if (distanceToPlayer > distance || distanceToPlayer >= closestDistance) continue;
    closest = car;
    closestDistance = distanceToPlayer;
  }
  if (closest) requestHonk(closest, kind);
}

function requestHonk(car, kind = "short") {
  const data = car.userData;
  if (state.time - data.lastHonk < HONK_COOLDOWN) return;
  if (state.time - state.lastHonkSound < 0.34) return;
  data.lastHonk = state.time;
  state.lastHonkSound = state.time;
  playHonkSound(kind);
}

function updateCollisions(dt) {
  for (let i = 0; i < collidableCars.length; i++) {
    for (let j = i + 1; j < collidableCars.length; j++) {
      const a = collidableCars[i];
      const b = collidableCars[j];
      if (a.userData.immobilized && b.userData.immobilized) continue;
      if (a.userData.crashed && b.userData.crashed) continue;
      if (a.position.distanceTo(b.position) > COLLISION_BROAD_PHASE) continue;
      const hit = carCollision(a, b);
      if (!hit) continue;
      applyCrashImpulse(a, b, dt, hit);
    }
  }
}

function applyCrashImpulse(a, b, dt, hit) {
  const normal = hit.normal.clone();
  const overlap = hit.depth;
  a.position.addScaledVector(normal, overlap * 0.52 + 0.18);
  b.position.addScaledVector(normal, -overlap * 0.52 - 0.18);

  const velocityA = carVelocity(a);
  const velocityB = carVelocity(b);
  const relativeVelocity = velocityA.clone().sub(velocityB);
  const closingSpeed = Math.max(0, -relativeVelocity.dot(normal));
  const restitution = 0.32;
  const impulseMag = Math.max(3.8, closingSpeed * (1 + restitution) * 0.55 + relativeVelocity.length() * 0.14);
  const impulse = normal.clone().multiplyScalar(impulseMag);
  const tangent = new THREE.Vector3(-normal.z, 0, normal.x);
  const scrape = tangent.multiplyScalar(THREE.MathUtils.clamp(relativeVelocity.dot(tangent) * 0.26, -5.5, 5.5));

  const postA = velocityA.clone().add(impulse).add(scrape);
  const postB = velocityB.clone().addScaledVector(impulse, -1).addScaledVector(scrape, -1);
  const spin = THREE.MathUtils.clamp(relativeVelocity.dot(new THREE.Vector3(-normal.z, 0, normal.x)) * 0.09, -2.8, 2.8);

  startCrashSlide(a, postA, spin);
  startCrashSlide(b, postB, -spin);
  playCrashSound(Math.min(1, velocityA.clone().sub(velocityB).length() / 30));
  state.crashed = true;
  if (a.userData.player || b.userData.player) {
    state.playerCrashed = true;
    restartBtn.hidden = false;
    statusEl.textContent = "Crash - restart ready";
  }
}

function startCrashSlide(car, velocity, angularVelocity) {
  const data = car.userData;
  data.speed = 0;
  data.velocity.copy(velocity).clampLength(2.5, 24);
  data.angularVelocity = THREE.MathUtils.clamp((data.angularVelocity || 0) + angularVelocity, -3.6, 3.6);
  data.braking = true;
  data.crashed = true;
  data.immobilized = false;
  data.hazard = true;
  data.crashTimer = 0;
}

function updateCrashPhysics(dt) {
  for (const car of collidableCars) {
    const data = car.userData;
    if (!data.crashed || data.immobilized) continue;

    const previous = car.position.clone();
    car.position.addScaledVector(data.velocity, dt);
    car.rotation.y += data.angularVelocity * dt;
    resolveBuildingCollisions(car, previous);
    car.position.x = THREE.MathUtils.clamp(car.position.x, -BOUNDS, BOUNDS);
    car.position.z = THREE.MathUtils.clamp(car.position.z, -BOUNDS, BOUNDS);

    const speed = data.velocity.length();
    const nextSpeed = Math.max(0, speed - CRASH_FRICTION * dt);
    if (speed > 0.001) data.velocity.multiplyScalar(nextSpeed / speed);
    data.angularVelocity = moveToward(data.angularVelocity, 0, CRASH_SPIN_FRICTION * dt);
    data.crashTimer += dt;

    if (data.crashTimer > 0.45 && data.velocity.length() < 0.35 && Math.abs(data.angularVelocity) < 0.12) {
      data.velocity.set(0, 0, 0);
      data.angularVelocity = 0;
      data.immobilized = true;
      data.crashed = false;
      data.braking = true;
    }
  }
}

function carCollision(a, b) {
  const boxA = carBox(a);
  const boxB = carBox(b);
  const axes = [boxA.right, boxA.forward, boxB.right, boxB.forward];
  let minOverlap = Infinity;
  let bestAxis = null;

  for (const axis of axes) {
    const rangeA = projectBox(boxA, axis);
    const rangeB = projectBox(boxB, axis);
    const overlap = Math.min(rangeA.max, rangeB.max) - Math.max(rangeA.min, rangeB.min);
    if (overlap <= 0) return null;
    if (overlap < minOverlap) {
      minOverlap = overlap;
      bestAxis = axis;
    }
  }

  const centerDelta = a.position.clone().sub(b.position);
  if (centerDelta.dot(bestAxis) < 0) bestAxis = bestAxis.clone().multiplyScalar(-1);
  return { normal: bestAxis.clone().normalize(), depth: minOverlap };
}

function carBox(car) {
  const forward = getForward(car).normalize();
  const right = new THREE.Vector3(forward.z, 0, -forward.x);
  return {
    center: car.position.clone(),
    forward,
    right,
    halfWidth: CAR_HALF_WIDTH,
    halfLength: CAR_HALF_LENGTH,
  };
}

function projectBox(box, axis) {
  const center = box.center.dot(axis);
  const radius =
    Math.abs(box.right.dot(axis)) * box.halfWidth + Math.abs(box.forward.dot(axis)) * box.halfLength;
  return { min: center - radius, max: center + radius };
}

function updateSignals(dt) {
  for (const car of cars) {
    const data = car.userData;
    data.blink += dt * 3.2;
    const on = Math.sin(data.blink * Math.PI) > 0;
    const useHazard = data.hazard || (data.player && state.hazard);
    const left = useHazard || (data.player && state.signal === "left");
    const right = useHazard || (data.player && state.signal === "right");
    setSignalLamps(data.indicators, left && on, right && on);
    setBrakeLights(data.brakeLights, data.braking || data.immobilized);
  }
}

function setSignalLamps(indicators, leftActive, rightActive) {
  for (const indicator of indicators) {
    const active = indicator.side === "left" ? leftActive : rightActive;
    indicator.lamp.material.emissiveIntensity = active ? 4.5 : 0;
    indicator.lamp.material.color.set(active ? 0xffb000 : 0xffd166);
    indicator.lamp.scale.set(active ? 1.55 : 1, active ? 1.35 : 1, active ? 1.35 : 1);
  }
}

function setBrakeLights(lamps, active) {
  for (const lamp of lamps) {
    lamp.material.emissiveIntensity = active ? 3.4 : 0.12;
    lamp.material.color.set(active ? 0xff2020 : 0x9d1010);
    lamp.scale.z = active ? 1.65 : 1;
  }
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
  leftSignalBtn.classList.toggle("active", !state.hazard && state.signal === "left");
  rightSignalBtn.classList.toggle("active", !state.hazard && state.signal === "right");
  hazardsBtn.classList.toggle("active", state.hazard || state.player.userData.hazard);
  if (!state.playerCrashed) {
    statusEl.textContent = state.crashed ? "Crash in city" : "City clear";
  }
}

function onKeyDown(event) {
  const key = normalizeKey(event);
  if (!key) return;
  ensureAudio();
  keys.add(key);
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "q", "e", "z"].includes(key)) {
    event.preventDefault();
    event.stopPropagation();
  }
  if (event.repeat && ["q", "e", "z"].includes(key)) return;
  if (state.toggleHeld.has(key)) return;
  if (key === "q") toggleSignal("left");
  if (key === "e") toggleSignal("right");
  if (key === "z") toggleHazards();
  if (["q", "e", "z"].includes(key)) state.toggleHeld.add(key);
}

function onKeyPress(event) {
  const key = normalizeKey(event);
  if (!["q", "e", "z"].includes(key)) return;
  event.preventDefault();
  event.stopPropagation();
  if (state.toggleHeld.has(key)) return;
  if (key === "q") toggleSignal("left");
  if (key === "e") toggleSignal("right");
  if (key === "z") toggleHazards();
  state.toggleHeld.add(key);
}

function onKeyUp(event) {
  const key = normalizeKey(event);
  if (!key) return;
  keys.delete(key);
  state.toggleHeld.delete(key);
}

function normalizeKey(event) {
  const byCode = {
    ArrowUp: "arrowup",
    ArrowDown: "arrowdown",
    ArrowLeft: "arrowleft",
    ArrowRight: "arrowright",
    KeyQ: "q",
    KeyE: "e",
    KeyZ: "z",
  };
  if (byCode[event.code]) return byCode[event.code];
  return event.key ? event.key.toLowerCase() : "";
}

function toggleSignal(direction) {
  state.signal = state.signal === direction ? "off" : direction;
  state.hazard = false;
  renderer.domElement.focus();
}

function toggleHazards() {
  state.hazard = !state.hazard;
  state.signal = "off";
  renderer.domElement.focus();
}

function ensureAudio() {
  if (state.audio) return state.audio;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  state.audio = new AudioContext();
  return state.audio;
}

function playCrashSound(force = 0.7) {
  if (state.time - state.lastCrashSound < 0.35) return;
  state.lastCrashSound = state.time;
  const audio = ensureAudio();
  if (!audio) return;
  if (audio.state === "suspended") audio.resume();

  const duration = 0.38;
  const now = audio.currentTime;
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1050 + force * 650, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16 + force * 0.24, now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  filter.connect(gain);
  gain.connect(audio.destination);

  const sampleCount = Math.floor(audio.sampleRate * duration);
  const buffer = audio.createBuffer(1, sampleCount, audio.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i++) {
    const t = i / sampleCount;
    samples[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.2);
  }
  const noise = audio.createBufferSource();
  noise.buffer = buffer;
  noise.connect(filter);
  noise.start(now);

  const thud = audio.createOscillator();
  const thudGain = audio.createGain();
  thud.type = "triangle";
  thud.frequency.setValueAtTime(92 + force * 35, now);
  thud.frequency.exponentialRampToValueAtTime(34, now + 0.22);
  thudGain.gain.setValueAtTime(0.18 + force * 0.18, now);
  thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
  thud.connect(thudGain);
  thudGain.connect(audio.destination);
  thud.start(now);
  thud.stop(now + 0.25);
}

function playHonkSound(kind = "short") {
  const audio = ensureAudio();
  if (!audio) return;
  if (audio.state === "suspended") audio.resume();

  const angry = kind === "angry";
  const now = audio.currentTime;
  const duration = angry ? 0.34 : 0.18;
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();
  const horn = audio.createOscillator();
  const body = audio.createOscillator();

  filter.type = "bandpass";
  filter.frequency.setValueAtTime(520, now);
  filter.Q.setValueAtTime(2.4, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(angry ? 0.2 : 0.14, now + 0.025);
  gain.gain.setValueAtTime(angry ? 0.2 : 0.14, now + duration * 0.62);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  horn.type = "square";
  body.type = "sawtooth";
  horn.frequency.setValueAtTime(angry ? 466 : 392, now);
  body.frequency.setValueAtTime(angry ? 349 : 294, now);
  if (angry) horn.frequency.setValueAtTime(440, now + 0.15);

  horn.connect(filter);
  body.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  horn.start(now);
  body.start(now);
  horn.stop(now + duration);
  body.stop(now + duration);
}

function restartCity() {
  for (const car of cars) city.remove(car);
  cars.length = 0;
  collidableCars.length = 0;
  state.crashed = false;
  state.playerCrashed = false;
  state.signal = "off";
  state.hazard = false;
  state.greenBlockTimer = 0;
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

function directionFromForward(forward) {
  let best = "south";
  let bestDot = -Infinity;
  for (const [dir, vector] of Object.entries(dirs)) {
    const dot = forward.dot(vector);
    if (dot > bestDot) {
      best = dir;
      bestDot = dot;
    }
  }
  return best;
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
