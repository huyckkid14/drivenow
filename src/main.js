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
const botSensitivityEl = document.querySelector("#botSensitivity");
const botSensitivityValueEl = document.querySelector("#botSensitivityValue");
const trafficDensityEl = document.querySelector("#trafficDensity");
const trafficDensityValueEl = document.querySelector("#trafficDensityValue");

const clock = new THREE.Clock();
const keys = new Set();
const cars = [];
const trafficLights = [];
const roadSegments = [];
const collidableCars = [];
const damagePieces = [];
const exhaustSmoke = [];
const npcPedestrians = [];
const buildingObstacles = [];
const botSpawnCandidates = [];
const botEntryCandidates = [];
const buildings = new THREE.Group();
const roads = new THREE.Group();
const city = new THREE.Group();
const botColors = [0x3d78ff, 0xf25f5c, 0x70c1b3, 0xf7b267, 0xb388eb, 0x64b96a, 0xef476f];

const ROAD_HALF = 4.7;
const LANES = [-1.75, 1.75];
const PLAYER_LANE_OFFSET = 9.5;
const PLAYER_LANE_WIDTH = 12.5;
const GRID = [-54, -27, 0, 27, 54];
const BOUNDS = 68;
const PLAYER_BOUNDS = 215;
const RACE_CENTER_X = 145;
const RACE_OUTER_X = 65;
const RACE_OUTER_Z = 45;
const RACE_INNER_X = 45;
const RACE_INNER_Z = 25;
const CAR_RADIUS = 2.35;
const CAR_HALF_WIDTH = 1.23;
const CAR_HALF_LENGTH = 2.12;
const STOP_DISTANCE = 13.5;
const STOP_LINE_OFFSET = ROAD_HALF + 0.75;
const SIGNAL_GREEN_TIME = 10;
const SIGNAL_YELLOW_TIME = 2;
const SIGNAL_ALL_RED_TIME = 2;
const HONK_COOLDOWN = 1.2;
const ANGRY_HONK_COOLDOWN = 0.62;
const DANGER_HONK_COOLDOWN = 0.28;
const COLLISION_BROAD_PHASE = 5.3;
const BUILDING_BOUNCE = 0.18;
const CRASH_FRICTION = 4.8;
const CRASH_SPIN_FRICTION = 3.6;
const DAMAGE_GRAVITY = 16;
const DAMAGE_FRICTION = 2.8;
const DAMAGE_BOUNDS = BOUNDS - 2;
const SAME_LANE_SPAWN_CLEARANCE = 5.2;
const MAX_BOT_CARS = 200;
const BOT_POPULATION_SPACING = 5.8;
const SPAWN_BODY_MARGIN = 0.22;
const BOT_BUMPER_GAP = 0.38;
const ENGINE_AUDIO_RANGE = 48;
const MAX_ENGINE_VOICES = 28;
const ENGINE_VOLUME = 2.14;
const REV_SMOKE_INTERVAL = 0.055;
const TRAFFIC_CYCLE = (SIGNAL_GREEN_TIME + SIGNAL_YELLOW_TIME + SIGNAL_ALL_RED_TIME) * 2;
const PLAYER_START = new THREE.Vector3(RACE_CENTER_X, 0, 35);

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
  botSensitivity: 0,
  trafficDensity: 1,
  trafficInitialized: false,
  onFoot: false,
  crashLook: {
    active: false,
    lastX: 0,
    lastY: 0,
    yaw: 0,
    pitch: 0,
  },
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
    new THREE.PlaneGeometry(460, 460),
    new THREE.MeshStandardMaterial({ color: 0x4b8b5a, roughness: 0.95 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  city.add(ground);

  createRoads();
  createRacingArea();
  createBlocks();
  createTrafficLights();
  createPlayer();
  createPedestrian();
  createNpcPedestrians();
  createBots();
  createSkylineDetails();

  window.addEventListener("keydown", onKeyDown, { capture: true });
  window.addEventListener("keypress", onKeyPress, { capture: true });
  window.addEventListener("keyup", onKeyUp, { capture: true });
  window.addEventListener("resize", onResize);
  renderer.domElement.tabIndex = 0;
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  renderer.domElement.focus();
  leftSignalBtn.addEventListener("click", () => toggleSignal("left"));
  rightSignalBtn.addEventListener("click", () => toggleSignal("right"));
  hazardsBtn.addEventListener("click", toggleHazards);
  botSensitivityEl.addEventListener("input", updateBotSensitivity);
  trafficDensityEl.addEventListener("input", updateTrafficDensity);
  restartBtn.addEventListener("click", restartCity);
  updateBotSensitivity();
  updateTrafficDensity();
  loadingEl.hidden = true;
}

function createRoads() {
  const asphalt = new THREE.MeshStandardMaterial({ color: 0x2a2f33, roughness: 0.82 });
  const stripe = new THREE.MeshStandardMaterial({ color: 0xf5f1d0, roughness: 0.7 });
  const crosswalk = new THREE.MeshStandardMaterial({ color: 0xe9ece8, roughness: 0.75 });
  const playerLane = new THREE.MeshStandardMaterial({ color: 0x345f70, roughness: 0.78 });

  for (const z of GRID) {
    const road = new THREE.Mesh(new THREE.BoxGeometry(145, 0.08, ROAD_HALF * 2), asphalt);
    road.position.set(0, 0.04, z);
    road.receiveShadow = true;
    roads.add(road);
    roadSegments.push({ axis: "x", fixed: z });

    addPlayerLaneSegments("x", z, playerLane);

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

    addPlayerLaneSegments("z", x, playerLane);

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

function createRacingArea() {
  const asphalt = new THREE.MeshStandardMaterial({ color: 0x24282c, roughness: 0.76 });
  const curbRed = new THREE.MeshStandardMaterial({ color: 0xd93636, roughness: 0.65 });
  const curbWhite = new THREE.MeshStandardMaterial({ color: 0xf4f4ed, roughness: 0.65 });
  const connector = new THREE.Mesh(new THREE.BoxGeometry(22, 0.1, 10), asphalt);
  connector.position.set(78, 0.07, 0);
  connector.receiveShadow = true;
  roads.add(connector);

  const trackShape = new THREE.Shape();
  trackShape.absellipse(0, 0, RACE_OUTER_X, RACE_OUTER_Z, 0, Math.PI * 2, false);
  const infield = new THREE.Path();
  infield.absellipse(0, 0, RACE_INNER_X, RACE_INNER_Z, 0, Math.PI * 2, false);
  trackShape.holes.push(infield);
  const track = new THREE.Mesh(new THREE.ShapeGeometry(trackShape, 96), asphalt);
  track.rotation.x = -Math.PI / 2;
  track.position.set(RACE_CENTER_X, 0.09, 0);
  track.receiveShadow = true;
  roads.add(track);

  for (let i = 0; i < 96; i++) {
    const angle = (i / 96) * Math.PI * 2;
    const material = i % 2 ? curbWhite : curbRed;
    for (const [rx, rz] of [[RACE_OUTER_X - 0.45, RACE_OUTER_Z - 0.45], [RACE_INNER_X + 0.45, RACE_INNER_Z + 0.45]]) {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.16, 0.65), material);
      curb.position.set(RACE_CENTER_X + Math.cos(angle) * rx, 0.17, Math.sin(angle) * rz);
      curb.rotation.y = -angle;
      roads.add(curb);
    }
  }

  for (let z = -4; z <= 4; z += 1) {
    const startTile = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.13, 0.9),
      (Math.round(z) + 4) % 2 ? curbWhite : new THREE.MeshStandardMaterial({ color: 0x161616 }),
    );
    startTile.position.set(RACE_CENTER_X - RACE_OUTER_X + 6, 0.18, z);
    roads.add(startTile);
  }

  const gateMaterial = new THREE.MeshStandardMaterial({ color: 0x168dcc, emissive: 0x0b4261, emissiveIntensity: 0.5 });
  for (const z of [-5.7, 5.7]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(1, 5.5, 1), gateMaterial);
    pillar.position.set(69.5, 2.75, z);
    pillar.castShadow = true;
    roads.add(pillar);
  }
  const banner = new THREE.Mesh(new THREE.BoxGeometry(1, 0.9, 12.4), gateMaterial);
  banner.position.set(69.5, 5.2, 0);
  roads.add(banner);
}

function isRacingArea(position) {
  const dx = position.x - RACE_CENTER_X;
  const outer = (dx * dx) / (RACE_OUTER_X * RACE_OUTER_X) + (position.z * position.z) / (RACE_OUTER_Z * RACE_OUTER_Z);
  return (position.x >= BOUNDS - 2 && position.x <= RACE_CENTER_X && Math.abs(position.z) <= 5.5) || outer <= 1.08;
}

function addPlayerLaneSegments(axis, fixed, material) {
  const intersectionClearance = ROAD_HALF + 1;
  const boundaries = [-BOUNDS, ...GRID, BOUNDS];

  for (let i = 0; i < boundaries.length - 1; i++) {
    const from = boundaries[i];
    const to = boundaries[i + 1];
    const start = from + (GRID.includes(from) ? intersectionClearance : 0);
    const end = to - (GRID.includes(to) ? intersectionClearance : 0);
    const length = end - start;
    if (length <= 0) continue;

    for (const side of [-1, 1]) {
      const reserved = new THREE.Mesh(
        axis === "x"
          ? new THREE.BoxGeometry(length, 0.07, PLAYER_LANE_WIDTH)
          : new THREE.BoxGeometry(PLAYER_LANE_WIDTH, 0.07, length),
        material,
      );
      if (axis === "x") {
        reserved.position.set((start + end) / 2, 0.1, fixed + side * PLAYER_LANE_OFFSET);
      } else {
        reserved.position.set(fixed + side * PLAYER_LANE_OFFSET, 0.11, (start + end) / 2);
      }
      reserved.receiveShadow = true;
      roads.add(reserved);
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
        buildingObstacles.push({ x: bx, z: bz, halfX: w / 2 + 0.1, halfZ: d / 2 + 0.1 });

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
  player.position.copy(PLAYER_START);
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
    lastDamage: -10,
    bodyColor: 0xffd23f,
    lastSafe: player.position.clone(),
    revRatio: 0,
    revSmokeTimer: 0,
    driftRatio: 0,
    driftSmokeTimer: 0,
    indicators: player.userData.indicators,
    brakeLights: player.userData.brakeLights,
    driverDoor: player.userData.driverDoor,
  };
  city.add(player);
  cars.push(player);
  collidableCars.push(player);
  state.player = player;
}

function createPedestrian() {
  const person = new THREE.Group();
  const clothes = new THREE.MeshStandardMaterial({ color: 0x2878d0, roughness: 0.72 });
  const pants = new THREE.MeshStandardMaterial({ color: 0x273546, roughness: 0.8 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xd59a72, roughness: 0.8 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.82, 0.34), clothes);
  body.position.y = 1.25;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), skin);
  head.position.y = 1.91;
  const leftArm = pedestrianLimb(0.18, 0.72, clothes, 0.45, 1.46);
  const rightArm = pedestrianLimb(0.18, 0.72, clothes, -0.45, 1.46);
  const leftLeg = pedestrianLimb(0.22, 0.82, pants, 0.2, 0.72);
  const rightLeg = pedestrianLimb(0.22, 0.82, pants, -0.2, 0.72);
  body.castShadow = true;
  head.castShadow = true;
  person.add(body, head, leftArm, rightArm, leftLeg, rightLeg);
  person.userData = { velocity: new THREE.Vector3(), speed: 0, steer: 0, gait: 0, leftArm, rightArm, leftLeg, rightLeg };
  person.visible = false;
  city.add(person);
  state.pedestrian = person;

  const beacon = new THREE.Group();
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.42, 7, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x73dcff, transparent: true, opacity: 0.36, depthWrite: false }),
  );
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 16, 10),
    new THREE.MeshBasicMaterial({ color: 0xbdf3ff }),
  );
  beam.position.y = 4.2;
  marker.position.y = 7.7;
  beacon.add(beam, marker);
  beacon.visible = false;
  city.add(beacon);
  state.carBeacon = beacon;
}

function pedestrianLimb(width, length, material, x, y) {
  const pivot = new THREE.Group();
  const limb = new THREE.Mesh(new THREE.BoxGeometry(width, length, width), material);
  limb.position.y = -length / 2;
  limb.castShadow = true;
  pivot.position.set(x, y, 0);
  pivot.add(limb);
  return pivot;
}

function createNpcPedestrians() {
  let index = 0;
  for (const x of GRID) {
    for (const z of GRID) {
      for (const horizontal of [true, false]) {
        const person = makeNpcPedestrian(index);
        const side = index % 2 ? -1 : 1;
        if (horizontal) person.position.set(x - 7.2, 0, z + side * (ROAD_HALF + 2.1));
        else person.position.set(x + side * (ROAD_HALF + 2.1), 0, z + 7.2);
        person.userData.axis = horizontal ? "x" : "z";
        person.userData.direction = horizontal ? 1 : -1;
        person.userData.routeMin = (horizontal ? x : z) - 8.5;
        person.userData.routeMax = (horizontal ? x : z) + 8.5;
        person.rotation.y = horizontal ? Math.PI / 2 : Math.PI;
        city.add(person);
        npcPedestrians.push(person);
        index += 1;
      }
    }
  }
}

function makeNpcPedestrian(index) {
  const person = new THREE.Group();
  const shirtColors = [0xc94b4b, 0x4f7fc8, 0x55a36a, 0xd18b3f, 0x8c62b8];
  const shirt = new THREE.MeshStandardMaterial({ color: shirtColors[index % shirtColors.length], roughness: 0.78 });
  const pants = new THREE.MeshStandardMaterial({ color: 0x263443, roughness: 0.85 });
  const skin = new THREE.MeshStandardMaterial({ color: index % 3 === 0 ? 0x8f5d3f : 0xd09a76, roughness: 0.85 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.76, 0.3), shirt);
  torso.position.y = 1.2;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 7), skin);
  head.position.y = 1.82;
  const leftArm = pedestrianLimb(0.16, 0.66, shirt, 0.39, 1.4);
  const rightArm = pedestrianLimb(0.16, 0.66, shirt, -0.39, 1.4);
  const leftLeg = pedestrianLimb(0.2, 0.76, pants, 0.17, 0.72);
  const rightLeg = pedestrianLimb(0.2, 0.76, pants, -0.17, 0.72);
  person.add(torso, head, leftArm, rightArm, leftLeg, rightLeg);
  person.traverse((part) => { if (part.isMesh) part.castShadow = true; });
  person.userData = { speed: 1.05 + (index % 4) * 0.12, gait: index, fallenUntil: 0, leftArm, rightArm, leftLeg, rightLeg };
  return person;
}

function createBots() {
  botSpawnCandidates.length = 0;
  botSpawnCandidates.push(...makeBotStarts());
  botEntryCandidates.length = 0;
  botEntryCandidates.push(...makeBotEntries());
  state.trafficInitialized = false;
  updateTrafficSpawns();
}

function makeBotEntries() {
  const entries = [];
  for (const z of GRID) {
    entries.push({ x: -BOUNDS, z: z + LANES[1], dir: "east" });
    entries.push({ x: BOUNDS, z: z + LANES[0], dir: "west" });
  }
  for (const x of GRID) {
    entries.push({ x: x + LANES[0], z: BOUNDS, dir: "north" });
    entries.push({ x: x + LANES[1], z: -BOUNDS, dir: "south" });
  }
  return entries;
}

function makeBotStarts() {
  const horizontal = [];
  const vertical = [];

  for (const z of GRID) {
    for (let x = -BOUNDS; x <= BOUNDS; x += BOT_POPULATION_SPACING) {
      horizontal.push({ x, z: z + LANES[1], dir: "east" });
      horizontal.push({ x: -x, z: z + LANES[0], dir: "west" });
    }
  }

  for (const x of GRID) {
    for (let z = -BOUNDS; z <= BOUNDS; z += BOT_POPULATION_SPACING) {
      vertical.push({ x: x + LANES[0], z: -z, dir: "north" });
      vertical.push({ x: x + LANES[1], z, dir: "south" });
    }
  }

  const starts = [];
  const count = Math.max(horizontal.length, vertical.length);
  for (let i = 0; i < count; i++) {
    if (horizontal[i]) starts.push(horizontal[i]);
    if (vertical[i]) starts.push(vertical[i]);
  }
  return starts;
}

function spawnBot(start) {
  const index = cars.length;
  const bot = makeCar(botColors[index % botColors.length], false);
  bot.position.set(start.x, 0, start.z);
  bot.rotation.y = yawForDir(start.dir);
  bot.userData = {
    player: false,
    speed: 0,
    desiredSpeed: 13 + (index % 3) * 2.2,
    maxSpeed: 20,
    dir: start.dir,
    turnMemory: state.time,
    immobilized: false,
    hazard: false,
    blink: Math.random(),
    braking: false,
    velocity: new THREE.Vector3(),
    angularVelocity: 0,
    crashed: false,
    crashTimer: 0,
    lastHonk: -10,
    lastDamage: -10,
    lastPlayerDistance: null,
    avoidanceSide: 0,
    avoidanceTimer: 0,
    bodyColor: botColors[index % botColors.length],
    indicators: bot.userData.indicators,
    brakeLights: bot.userData.brakeLights,
  };
  city.add(bot);
  cars.push(bot);
  collidableCars.push(bot);
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

    const door = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.68, 1.55), bodyMat.clone());
    door.position.set(1.22, 0.72, -0.2);
    door.geometry.translate(0, 0, 0.72);
    car.add(door);
    car.userData.driverDoor = door;
  }

  car.userData.indicators = indicators;
  car.userData.brakeLights = brakeLights;
  car.userData.body = body;
  car.userData.cabin = cabin;
  car.userData.wheels = car.children.filter((child) => child.geometry?.type === "CylinderGeometry");
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
  updatePieceCarPushes();
  updateDamagePieces(dt);
  updateExhaustSmoke(dt);
  updatePlayer(dt);
  updatePedestrian(dt);
  updateNpcPedestrians(dt);
  updateCarDoor(dt);
  updateBots(dt);
  updateEngineSounds(dt);
  updateTrafficSpawns();
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
  if (data.immobilized || data.crashed || state.onFoot) {
    data.revRatio = moveToward(data.revRatio || 0, 0, dt * 4.5);
    return;
  }

  const throttle = keys.has("arrowup") ? 1 : 0;
  const brakeKey = keys.has("arrowdown") ? 1 : 0;
  const handbrake = keys.has("space") && Math.abs(data.speed) > 7;
  const stationaryRev = Boolean(throttle && brakeKey && Math.abs(data.speed) < 0.35);
  data.revRatio = moveToward(data.revRatio || 0, stationaryRev ? 1 : 0, dt * (stationaryRev ? 2.8 : 4.5));
  if (stationaryRev) {
    data.speed = 0;
    data.velocity.set(0, 0, 0);
    data.revSmokeTimer = (data.revSmokeTimer || 0) - dt;
    if (data.revSmokeTimer <= 0 && data.revRatio > 0.18) {
      emitExhaustSmoke(car, data.revRatio);
      data.revSmokeTimer = REV_SMOKE_INTERVAL;
    }
  }
  const steerInput = (keys.has("arrowleft") ? 1 : 0) - (keys.has("arrowright") ? 1 : 0);
  data.steer = moveToward(data.steer, steerInput, dt * 4.8);
  data.driftRatio = moveToward(data.driftRatio || 0, handbrake ? 1 : 0, dt * (handbrake ? 4.2 : 2.6));

  const accel = stationaryRev ? 0 : throttle * 18;
  const brake = stationaryRev ? 0 : brakeKey * (data.speed > 0.2 ? 34 : 13);
  const drag = 4.2 + Math.abs(data.speed) * 0.1;
  data.braking = Boolean(brakeKey || (!throttle && data.speed > 4));
  if (!stationaryRev) {
    data.speed += accel * dt;
    data.speed -= brake * dt;
  }
  if (!throttle && !brakeKey) data.speed -= Math.sign(data.speed) * drag * dt;
  if (Math.abs(data.speed) < 0.1) data.speed = 0;
  data.speed = THREE.MathUtils.clamp(data.speed, -7.5, data.maxSpeed);

  if (Math.abs(data.speed) > 0.4) {
    const speedFactor = THREE.MathUtils.clamp(Math.abs(data.speed) / data.maxSpeed, 0.18, 1);
    car.rotation.y += data.steer * dt * (1.18 + speedFactor * 1.25) * Math.sign(data.speed || 1);
    if (handbrake) car.rotation.y += data.steer * dt * 1.65 * speedFactor * Math.sign(data.speed);
  }

  const forward = getForward(car);
  const previous = car.position.clone();
  const desiredVelocity = forward.multiplyScalar(data.speed);
  if (data.velocity.lengthSq() < 0.01) data.velocity.copy(desiredVelocity);
  const grip = THREE.MathUtils.lerp(10, 0.85, data.driftRatio);
  data.velocity.lerp(desiredVelocity, Math.min(1, grip * dt));
  if (handbrake) {
    data.speed = moveToward(data.speed, 0, dt * (1.7 + Math.abs(data.steer) * 2.4));
    data.driftSmokeTimer -= dt;
    if (data.driftSmokeTimer <= 0 && Math.abs(data.steer) > 0.18) {
      emitDriftSmoke(car, data.driftRatio);
      data.driftSmokeTimer = 0.045;
    }
  }
  car.position.addScaledVector(data.velocity, dt);
  keepNearRoad(car);
  resolveBuildingCollisions(car, previous);
  car.position.x = THREE.MathUtils.clamp(car.position.x, -PLAYER_BOUNDS, PLAYER_BOUNDS);
  car.position.z = THREE.MathUtils.clamp(car.position.z, -PLAYER_BOUNDS, PLAYER_BOUNDS);
}

function updatePedestrian(dt) {
  const person = state.pedestrian;
  if (!person || !state.onFoot) return;
  const data = person.userData;
  const moveInput = (keys.has("arrowup") ? 1 : 0) - (keys.has("arrowdown") ? 1 : 0);
  const steerInput = (keys.has("arrowleft") ? 1 : 0) - (keys.has("arrowright") ? 1 : 0);
  const targetSpeed = moveInput > 0 ? 4.8 : moveInput < 0 ? -2.8 : 0;
  data.speed = moveToward(data.speed, targetSpeed, dt * (moveInput ? 10 : 14));
  data.steer = moveToward(data.steer, steerInput, dt * 7);
  const walkingSpeed = Math.abs(data.speed);
  if (walkingSpeed > 0.05) {
    const previous = person.position.clone();
    person.rotation.y += data.steer * dt * 2.25 * Math.sign(data.speed);
    const forward = new THREE.Vector3(Math.sin(person.rotation.y), 0, Math.cos(person.rotation.y));
    data.velocity.copy(forward).multiplyScalar(data.speed);
    person.position.addScaledVector(data.velocity, dt);
    resolvePedestrianBuildings(person, previous);
    person.position.x = THREE.MathUtils.clamp(person.position.x, -PLAYER_BOUNDS, PLAYER_BOUNDS);
    person.position.z = THREE.MathUtils.clamp(person.position.z, -PLAYER_BOUNDS, PLAYER_BOUNDS);
  }
  data.gait += dt * data.speed * 2.4;
  const stride = Math.sin(data.gait) * Math.min(0.72, walkingSpeed * 0.14);
  data.leftLeg.rotation.x = stride;
  data.rightLeg.rotation.x = -stride;
  data.leftArm.rotation.x = -stride * 0.75;
  data.rightArm.rotation.x = stride * 0.75;
  if (state.carBeacon) {
    state.carBeacon.position.copy(state.player.position);
    state.carBeacon.rotation.y += dt * 0.8;
  }
}

function updateCarDoor(dt) {
  const door = state.player?.userData.driverDoor;
  if (!door) return;
  const target = state.onFoot ? -1.05 : 0;
  door.rotation.y = moveToward(door.rotation.y, target, dt * 2.8);
}

function updateNpcPedestrians(dt) {
  const player = state.player;
  for (const person of npcPedestrians) {
    const data = person.userData;
    if (data.fallenUntil > state.time) continue;
    if (Math.abs(person.rotation.x) > 0.02 || person.position.y > 0.01) {
      person.rotation.x = moveToward(person.rotation.x, 0, dt * 3.2);
      person.position.y = moveToward(person.position.y, 0, dt * 0.9);
      continue;
    }

    if (!state.onFoot && !state.playerCrashed && Math.abs(player.userData.speed) > 1.2 && person.position.distanceTo(player.position) < 2.25) {
      knockDownPedestrian(person);
      continue;
    }

    const travel = data.speed * data.direction * dt;
    const next = person.position.clone();
    if (data.axis === "x") next.x += travel;
    else next.z += travel;
    if (npcMustWaitForSignal(person) || npcStepBlockedByCar(next)) {
      setNpcWalkingPose(data, 0);
      continue;
    }
    if (data.axis === "x") {
      person.position.x = next.x;
      person.rotation.y = data.direction * Math.PI / 2;
      if (person.position.x <= data.routeMin || person.position.x >= data.routeMax) data.direction *= -1;
    } else {
      person.position.z = next.z;
      person.rotation.y = data.direction < 0 ? Math.PI : 0;
      if (person.position.z <= data.routeMin || person.position.z >= data.routeMax) data.direction *= -1;
    }
    data.gait += dt * data.speed * 3.2;
    setNpcWalkingPose(data, Math.sin(data.gait) * 0.48);
  }
}

function setNpcWalkingPose(data, stride) {
  data.leftLeg.rotation.x = stride;
  data.rightLeg.rotation.x = -stride;
  data.leftArm.rotation.x = -stride * 0.72;
  data.rightArm.rotation.x = stride * 0.72;
}

function npcStepBlockedByCar(next) {
  for (const car of cars) {
    if (!car.visible || car.userData.waitingForEntry) continue;
    const forward = getForward(car).normalize();
    const right = new THREE.Vector3(forward.z, 0, -forward.x);
    const delta = next.clone().sub(car.position);
    if (Math.abs(delta.dot(right)) <= CAR_HALF_WIDTH + 0.48 && Math.abs(delta.dot(forward)) <= CAR_HALF_LENGTH + 0.48) return true;
  }
  return false;
}

function npcMustWaitForSignal(person) {
  const data = person.userData;
  const positionValue = data.axis === "x" ? person.position.x : person.position.z;
  let crossing = null;
  let distance = Infinity;
  for (const gridValue of GRID) {
    const ahead = (gridValue - positionValue) * data.direction;
    if (ahead > 0 && ahead < distance) {
      distance = ahead;
      crossing = gridValue;
    }
  }
  if (crossing === null || distance < ROAD_HALF + 0.2 || distance > ROAD_HALF + 1.7) return false;
  const x = data.axis === "x" ? crossing : nearestGrid(person.position.x);
  const z = data.axis === "z" ? crossing : nearestGrid(person.position.z);
  const axis = data.axis === "x" ? "ew" : "ns";
  const light = trafficLights.find((item) => item.x === x && item.z === z && item.axis === axis);
  return Boolean(light && light.state !== "green");
}

function knockDownPedestrian(person) {
  const data = person.userData;
  if (data.fallenUntil > state.time) return;
  data.fallenUntil = state.time + 5;
  person.rotation.x = -Math.PI / 2;
  person.position.y = 0.38;
  data.leftLeg.rotation.x = 0;
  data.rightLeg.rotation.x = 0;
  data.leftArm.rotation.x = -0.6;
  data.rightArm.rotation.x = 0.6;
  state.player.userData.speed *= 0.86;
  statusEl.textContent = "Pedestrian hit — they will get back up";
}

function resolvePedestrianBuildings(person, previous) {
  const radius = 0.42;
  for (const obstacle of buildingObstacles) {
    const closestX = THREE.MathUtils.clamp(person.position.x, obstacle.x - obstacle.halfX, obstacle.x + obstacle.halfX);
    const closestZ = THREE.MathUtils.clamp(person.position.z, obstacle.z - obstacle.halfZ, obstacle.z + obstacle.halfZ);
    if ((person.position.x - closestX) ** 2 + (person.position.z - closestZ) ** 2 < radius ** 2) {
      person.position.copy(previous);
      person.userData.velocity.set(0, 0, 0);
      person.userData.speed = 0;
      return;
    }
  }
}

function toggleCarExit() {
  const car = state.player;
  const person = state.pedestrian;
  if (!car || !person || car.userData.crashed || car.userData.immobilized) return;
  if (!state.onFoot) {
    if (Math.abs(car.userData.speed) > 0.35) {
      statusEl.textContent = "Stop the car before getting out";
      return;
    }
    state.onFoot = true;
    car.userData.speed = 0;
    car.userData.velocity.set(0, 0, 0);
    const exitPoint = new THREE.Vector3(2.1, 0, -0.15);
    car.localToWorld(exitPoint);
    person.position.copy(exitPoint);
    person.rotation.y = car.rotation.y;
    person.visible = true;
    state.carBeacon.visible = true;
    statusEl.textContent = "On foot — follow the blue beacon back to your car";
    return;
  }
  if (person.position.distanceTo(car.position) > 3.3) {
    statusEl.textContent = "Move closer to your car to get in";
    return;
  }
  state.onFoot = false;
  person.userData.velocity.set(0, 0, 0);
  person.userData.speed = 0;
  person.userData.steer = 0;
  person.visible = false;
  state.carBeacon.visible = false;
  statusEl.textContent = "Back in the car";
}

function updateBots(dt) {
  for (const bot of cars) {
    const data = bot.userData;
    if (data.player || data.immobilized || data.crashed) continue;
    if (data.waitingForEntry) {
      if (canSpawnBotAt(data.waitingForEntry, bot)) {
        bot.position.set(data.waitingForEntry.x, 0, data.waitingForEntry.z);
        data.dir = data.waitingForEntry.dir;
        data.speed = 0;
        data.velocity.set(0, 0, 0);
        data.waitingForEntry = null;
        bot.visible = true;
        bot.rotation.y = yawForDir(data.dir);
        snapToLane(bot);
      }
      continue;
    }

    const frontTraffic = findNearestCarAhead(bot, 28);
    const sensitivity = state.botSensitivity;
    const pedestrianAvoidance = getPedestrianYield(bot);
    const queueAvoidance = pedestrianAvoidance ? null : getQueueReverse(bot, frontTraffic);
    const avoidance = pedestrianAvoidance || queueAvoidance || (sensitivity > 0 ? getPlayerAvoidance(bot, sensitivity, dt) : null);
    data.pedestrianBacking = Boolean(avoidance?.reverseForPedestrian);
    const signalStop = stopInfoForSignal(bot);
    const boxStop = signalStop ? null : stopInfoForBlockedIntersection(bot, frontTraffic);
    const intersectionStop = signalStop || boxStop;
    const intersectionBlocked = Boolean(intersectionStop);
    const followingSpeed = followingTargetSpeed(bot, frontTraffic);
    const approachSpeed = intersectionApproachSpeed(bot);
    const cruisingSpeed = Math.min(data.desiredSpeed, followingSpeed, approachSpeed);
    const targetSpeed = avoidance ? avoidance.speed : intersectionBlocked ? 0 : cruisingSpeed;
    const tightGap = frontTraffic && frontTraffic.gap <= BOT_BUMPER_GAP + 1.1;
    const rate = targetSpeed < data.speed ? (intersectionBlocked || tightGap ? 34 : 26) : 7;
    data.braking = targetSpeed < data.speed - 0.5;
    data.speed = moveToward(data.speed, targetSpeed, rate * dt);

    if (!avoidance) maybeTurnAtIntersection(bot);
    const forward = dirs[data.dir];
    const previous = bot.position.clone();
    const travel = avoidance ? avoidance.direction : forward;
    const reversing = travel.dot(forward) < -0.5;
    const facing = reversing ? forward : travel;
    const targetYaw = Math.atan2(facing.x, facing.z);
    bot.rotation.y = lerpAngle(bot.rotation.y, targetYaw, dt * (avoidance ? 10 : 7));
    const travelSpeed = reversing ? Math.min(Math.abs(data.speed), avoidance.speed) : Math.abs(data.speed);
    data.velocity.copy(travel).multiplyScalar(travelSpeed);
    bot.position.addScaledVector(data.velocity, dt);
    if (intersectionStop && !avoidance) {
      alignWithStopLine(bot, intersectionStop, dt, previous, !frontTraffic && !boxStop);
    }
    if (avoidance) resolveBuildingCollisions(bot, previous);
    wrapBot(bot);
  }
}

function updateBotSensitivity() {
  state.botSensitivity = Number(botSensitivityEl.value) / 100;
  const value = Number(botSensitivityEl.value);
  botSensitivityValueEl.value = value === 0 ? "Original" : value < 35 ? "Alert" : value < 70 ? "Defensive" : "Extreme";
}

function getPedestrianYield(bot) {
  const data = bot.userData;
  const forward = dirs[data.dir];
  const right = new THREE.Vector3(forward.z, 0, -forward.x);
  const stoppingRange = 5.5 + Math.abs(data.speed || 0) * 0.85;
  const people = npcPedestrians.filter((person) => person.userData.fallenUntil <= state.time);
  if (state.onFoot && state.pedestrian?.visible) people.push(state.pedestrian);
  for (const person of people) {
    const delta = person.position.clone().sub(bot.position);
    const ahead = delta.dot(forward);
    const lateral = Math.abs(delta.dot(right));
    if (ahead >= -1.2 && ahead <= stoppingRange && lateral <= CAR_HALF_WIDTH + 1.05) {
      if (ahead <= CAR_HALF_LENGTH + 4.2) {
        return {
          direction: forward.clone().multiplyScalar(-1),
          speed: 2.8,
          reverseForPedestrian: true,
        };
      }
      return { direction: forward.clone(), speed: 0 };
    }
  }
  return null;
}

function getQueueReverse(bot, frontTraffic) {
  if (!frontTraffic || !frontTraffic.car.userData.pedestrianBacking || frontTraffic.gap > 6.5) return null;
  return {
    direction: dirs[bot.userData.dir].clone().multiplyScalar(-1),
    speed: 2.8,
    reverseForPedestrian: true,
  };
}

function updateTrafficDensity() {
  const value = Number(trafficDensityEl.value);
  state.trafficDensity = value / 100;
  trafficDensityValueEl.value = `${Math.round(MAX_BOT_CARS * state.trafficDensity)} cars`;
  trimTrafficToTarget();
}

function getPlayerAvoidance(bot, sensitivity, dt) {
  const data = bot.userData;
  const player = state.player;
  if (!player || player.userData.crashed || player.userData.immobilized) return null;

  const forward = dirs[data.dir];
  const right = new THREE.Vector3(forward.z, 0, -forward.x);
  const delta = player.position.clone().sub(bot.position);
  const relativeVelocity = carVelocity(player).sub(forward.clone().multiplyScalar(data.speed || 0));
  const horizon = 0.35 + sensitivity * 2.15;
  const speedSq = relativeVelocity.lengthSq();
  const closestTime = speedSq > 0.001
    ? THREE.MathUtils.clamp(delta.dot(relativeVelocity) / -speedSq, 0, horizon)
    : 0;
  const closest = delta.clone().addScaledVector(relativeVelocity, closestTime);
  const triggerRadius = CAR_RADIUS * (0.72 + sensitivity * 1.2);
  const side = delta.dot(right);
  const playerInCurrentLane = Math.abs(side) <= CAR_HALF_WIDTH * 2 + 0.35;
  const playerClosing = delta.lengthSq() > 0.001 && relativeVelocity.dot(delta.clone().normalize()) < -0.5;
  const collisionImminent = closestTime > 0 && closest.length() <= triggerRadius && playerClosing;
  if (!playerInCurrentLane || !collisionImminent) {
    data.avoidanceTimer = Math.max(0, data.avoidanceTimer - dt);
    if (data.avoidanceTimer === 0) data.avoidanceSide = 0;
    return null;
  }

  const ahead = delta.dot(forward);
  if (data.avoidanceSide === 0) data.avoidanceSide = side >= 0 ? -1 : 1;
  data.avoidanceTimer = 0.45 + sensitivity * 1.15;

  const reverseDirection = forward.clone().multiplyScalar(-1);
  const reverseClear = isEvasionPathClear(bot, reverseDirection, 3 + sensitivity * 4);
  if (ahead > -0.5 && reverseClear) {
    return {
      direction: reverseDirection,
      speed: 3 + sensitivity * 5,
    };
  }

  const canLeaveRoad = sensitivity >= 0.68;
  const lateralStrength = canLeaveRoad ? 0.95 : 0.28 + sensitivity * 0.48;
  const swerve = forward.clone().addScaledVector(right, data.avoidanceSide * lateralStrength).normalize();
  const swerveClear = isEvasionPathClear(bot, swerve, 3 + sensitivity * 6);

  if (swerveClear) {
    return {
      direction: swerve,
      speed: Math.max(5, data.desiredSpeed * (0.42 + sensitivity * 0.45)),
    };
  }

  return { direction: forward, speed: 0 };
}

function isEvasionPathClear(bot, direction, distance) {
  const probe = bot.position.clone().addScaledVector(direction, distance);
  if (Math.abs(probe.x) > BOUNDS || Math.abs(probe.z) > BOUNDS) return false;
  if (isPlayerOnlyLanePosition(probe)) return false;

  for (const obstacle of buildingObstacles) {
    const closestX = THREE.MathUtils.clamp(probe.x, obstacle.x - obstacle.halfX, obstacle.x + obstacle.halfX);
    const closestZ = THREE.MathUtils.clamp(probe.z, obstacle.z - obstacle.halfZ, obstacle.z + obstacle.halfZ);
    if ((probe.x - closestX) ** 2 + (probe.z - closestZ) ** 2 < CAR_RADIUS ** 2) return false;
  }

  for (const car of collidableCars) {
    if (car === bot || car === state.player || car.userData.immobilized) continue;
    if (probe.distanceToSquared(car.position) < (CAR_RADIUS * 1.8) ** 2) return false;
  }
  return true;
}

function isPlayerOnlyLanePosition(position) {
  const horizontalOffset = Math.abs(position.z - nearestGrid(position.z));
  const verticalOffset = Math.abs(position.x - nearestGrid(position.x));
  const laneInnerEdge = PLAYER_LANE_OFFSET - PLAYER_LANE_WIDTH / 2 - CAR_HALF_WIDTH;
  const laneOuterEdge = PLAYER_LANE_OFFSET + PLAYER_LANE_WIDTH / 2 + CAR_HALF_WIDTH;
  const onHorizontalReservedLane =
    horizontalOffset >= laneInnerEdge && horizontalOffset <= laneOuterEdge;
  const onVerticalReservedLane =
    verticalOffset >= laneInnerEdge && verticalOffset <= laneOuterEdge;
  return onHorizontalReservedLane || onVerticalReservedLane;
}

function updateTrafficSpawns() {
  if (state.playerCrashed || !botSpawnCandidates.length) return;

  const targetBotCount = Math.round(MAX_BOT_CARS * state.trafficDensity);
  let botCount = cars.length - 1;
  const candidates = state.trafficInitialized ? botEntryCandidates : botSpawnCandidates;
  for (const candidate of candidates) {
    if (botCount >= targetBotCount) break;
    if (!canSpawnBotAt(candidate)) continue;

    spawnBot(candidate);
    botCount += 1;
  }
  state.trafficInitialized = true;
  trafficDensityValueEl.value = `${botCount} cars`;
}

function trimTrafficToTarget() {
  if (!state.player) return;
  const targetBotCount = Math.round(MAX_BOT_CARS * state.trafficDensity);
  let botCount = cars.length - 1;
  if (botCount <= targetBotCount) return;

  const removable = cars
    .filter((car) => !car.userData.player && !car.userData.crashed && !car.userData.immobilized)
    .sort((a, b) => b.position.distanceToSquared(state.player.position) - a.position.distanceToSquared(state.player.position));

  for (const bot of removable) {
    if (botCount <= targetBotCount) break;
    destroyEngineVoice(bot);
    city.remove(bot);
    removeFromArray(cars, bot);
    removeFromArray(collidableCars, bot);
    botCount -= 1;
  }
}

function canSpawnBotAt(candidate, ignoredCar = null) {
  if (isIntersectionSpawnZone(candidate)) return false;

  for (const car of collidableCars) {
    if (car === ignoredCar) continue;
    if (car.userData.waitingForEntry) continue;
    if (spawnFootprintOverlapsCar(candidate, car)) return false;
    if (sameLaneDistanceToCar(candidate, car) <= SAME_LANE_SPAWN_CLEARANCE) return false;
  }

  return true;
}

function isIntersectionSpawnZone(candidate) {
  const intersectionClearance = ROAD_HALF + CAR_HALF_LENGTH + 0.6;
  if (candidate.dir === "east" || candidate.dir === "west") {
    return GRID.some((x) => Math.abs(candidate.x - x) < intersectionClearance);
  }
  return GRID.some((z) => Math.abs(candidate.z - z) < intersectionClearance);
}

function spawnFootprintOverlapsCar(candidate, car) {
  const candidateForward = dirs[candidate.dir];
  const candidateRight = new THREE.Vector3(candidateForward.z, 0, -candidateForward.x);
  const carForward = getForward(car).normalize();
  const carRight = new THREE.Vector3(carForward.z, 0, -carForward.x);
  const delta = car.position.clone().sub(new THREE.Vector3(candidate.x, 0, candidate.z));
  const candidateHalfLength = CAR_HALF_LENGTH + SPAWN_BODY_MARGIN;
  const candidateHalfWidth = CAR_HALF_WIDTH + SPAWN_BODY_MARGIN;
  const carHalfLength = CAR_HALF_LENGTH + SPAWN_BODY_MARGIN;
  const carHalfWidth = CAR_HALF_WIDTH + SPAWN_BODY_MARGIN;

  for (const axis of [candidateForward, candidateRight, carForward, carRight]) {
    const centerDistance = Math.abs(delta.dot(axis));
    const candidateRadius =
      candidateHalfLength * Math.abs(candidateForward.dot(axis)) +
      candidateHalfWidth * Math.abs(candidateRight.dot(axis));
    const carRadius =
      carHalfLength * Math.abs(carForward.dot(axis)) +
      carHalfWidth * Math.abs(carRight.dot(axis));
    if (centerDistance >= candidateRadius + carRadius) return false;
  }

  return true;
}

function sameLaneDistanceToCar(candidate, car) {
  if (candidate.dir === "east" || candidate.dir === "west") {
    if (Math.abs(candidate.z - car.position.z) < 0.8) return Math.abs(candidate.x - car.position.x);
  } else if (Math.abs(candidate.x - car.position.x) < 0.8) {
    return Math.abs(candidate.z - car.position.z);
  }

  return Infinity;
}

function maybeTurnAtIntersection(bot) {
  const data = bot.userData;
  const nearestX = nearestGrid(bot.position.x);
  const nearestZ = nearestGrid(bot.position.z);
  const atIntersection = Math.abs(bot.position.x - nearestX) < 0.7 && Math.abs(bot.position.z - nearestZ) < 0.7;
  if (!atIntersection || state.time - data.turnMemory < 1.2) return;

  data.turnMemory = state.time;
  const options = turnOptions(data.dir);
  const pick = options[Math.floor(Math.abs(Math.sin(bot.id + state.time * 0.71)) * options.length)];
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

function stopInfoForBlockedIntersection(bot, frontTraffic) {
  if (!frontTraffic) return null;
  const data = bot.userData;
  const forward = dirs[data.dir];
  const ix = nearestGrid(bot.position.x);
  const iz = nearestGrid(bot.position.z);
  const stopCenter = stopCenterForDirection(ix, iz, data.dir);
  const ahead = stopCenter.clone().sub(bot.position).dot(forward);
  if (ahead < -0.15 || ahead > STOP_DISTANCE) return null;
  const clearIntersectionDistance = ahead + ROAD_HALF * 2 + CAR_HALF_LENGTH * 2 + BOT_BUMPER_GAP;
  if (frontTraffic.ahead > clearIntersectionDistance) return null;
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

function findNearestCarAhead(car, distance) {
  const forward = getForward(car);
  let nearest = null;
  for (const other of collidableCars) {
    if (other === car) continue;
    if (other.userData.waitingForEntry) continue;
    const delta = other.position.clone().sub(car.position);
    const ahead = delta.dot(forward);
    if (ahead <= 0 || ahead > distance) continue;
    const side = delta.lengthSq() - ahead * ahead;
    if (side >= 6.1) continue;
    if (!nearest || ahead < nearest.ahead) {
      nearest = {
        car: other,
        ahead,
        gap: ahead - CAR_HALF_LENGTH * 2,
      };
    }
  }
  return nearest;
}

function followingTargetSpeed(bot, frontTraffic) {
  if (!frontTraffic) return bot.userData.desiredSpeed;
  const forward = dirs[bot.userData.dir];
  const leadSpeed = Math.max(0, carVelocity(frontTraffic.car).dot(forward));
  const usableGap = Math.max(0, frontTraffic.gap - BOT_BUMPER_GAP);
  return THREE.MathUtils.clamp(leadSpeed + usableGap * 1.65, 0, bot.userData.desiredSpeed);
}

function intersectionApproachSpeed(bot) {
  const data = bot.userData;
  const forward = dirs[data.dir];
  const ix = nearestGrid(bot.position.x);
  const iz = nearestGrid(bot.position.z);
  const stopCenter = stopCenterForDirection(ix, iz, data.dir);
  const ahead = stopCenter.clone().sub(bot.position).dot(forward);
  if (ahead < 0 || ahead > 18) return data.desiredSpeed;
  return THREE.MathUtils.lerp(3.5, 9, ahead / 18);
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

  const reversingTarget = findBotInReversePath(8.5);
  if (reversingTarget && !isWaitingAtRedLight(reversingTarget)) {
    requestHonk(reversingTarget, "danger");
  }

  for (const bot of cars) {
    const botData = bot.userData;
    if (botData.player || botData.immobilized || botData.crashed) continue;
    const waitingAtRed = isWaitingAtRedLight(bot);
    const forward = dirs[botData.dir];
    const delta = player.position.clone().sub(bot.position);
    const distanceToPlayer = delta.length();
    const previousDistance = botData.lastPlayerDistance;
    const botVelocity = dirs[botData.dir].clone().multiplyScalar(botData.speed || 0);
    const relativeVelocity = data.velocity.clone().sub(botVelocity);
    const closingSpeed = distanceToPlayer > 0.001 ? -delta.dot(relativeVelocity) / distanceToPlayer : 0;
    const closestSoon = predictedCollisionDistance(delta, relativeVelocity, bot);
    const suddenClose =
      previousDistance &&
      distanceToPlayer < 8.5 &&
      closingSpeed > 2.4 &&
      (botData.speed > 1 || closestSoon < CAR_RADIUS * 0.9) &&
      closestSoon < CAR_RADIUS * 1.28 &&
      (previousDistance - distanceToPlayer > 1.6 || (previousDistance > 11 && distanceToPlayer < 6.5));
    if (suddenClose && !waitingAtRed) requestHonk(bot, "danger");
    botData.lastPlayerDistance = distanceToPlayer;

    const ahead = delta.dot(forward);
    if (ahead <= 0.8 || ahead > 9.5) continue;
    const sideSq = delta.lengthSq() - ahead * ahead;
    if (sideSq > 7.8) continue;
    const playerForward = getForward(player);
    const crossing = Math.abs(playerForward.dot(forward)) < 0.72;
    const abruptBlock = botData.speed > Math.max(4, Math.abs(data.speed) + 4);
    if ((crossing || abruptBlock) && !waitingAtRed) requestHonk(bot, "angry");
  }
}

function isWaitingAtRedLight(bot) {
  const data = bot.userData;
  return Math.abs(data.speed || 0) < 1.1 && Boolean(stopInfoForSignal(bot));
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

function findBotInReversePath(distance) {
  const player = state.player;
  const data = player.userData;
  if (data.speed > -0.35) return null;

  const reverse = getForward(player).multiplyScalar(-1).normalize();
  let closest = null;
  let closestAhead = Infinity;

  for (const bot of cars) {
    if (bot.userData.player || bot.userData.immobilized || bot.userData.crashed) continue;
    const delta = bot.position.clone().sub(player.position);
    const ahead = delta.dot(reverse);
    if (ahead <= CAR_HALF_LENGTH || ahead > distance) continue;
    const sideSq = delta.lengthSq() - ahead * ahead;
    if (sideSq > 8.2) continue;
    if (ahead < closestAhead) {
      closest = bot;
      closestAhead = ahead;
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
  const cooldown = kind === "danger" ? DANGER_HONK_COOLDOWN : kind === "angry" ? ANGRY_HONK_COOLDOWN : HONK_COOLDOWN;
  const globalCooldown = kind === "danger" ? 0.13 : kind === "angry" ? 0.24 : 0.34;
  if (state.time - data.lastHonk < cooldown) return;
  if (state.time - state.lastHonkSound < globalCooldown) return;
  data.lastHonk = state.time;
  state.lastHonkSound = state.time;
  playHonkSound(kind);
}

function predictedCollisionDistance(delta, relativeVelocity, bot) {
  const speedSq = relativeVelocity.lengthSq();
  if (speedSq < 0.001) return delta.length();
  const botForward = dirs[bot.userData.dir];
  const botRight = new THREE.Vector3(botForward.z, 0, -botForward.x);
  let closest = Infinity;

  for (let t = 0; t <= 1.2; t += 0.2) {
    const predicted = delta.clone().addScaledVector(relativeVelocity, t);
    const along = Math.abs(predicted.dot(botForward));
    const side = Math.abs(predicted.dot(botRight));
    if (along > CAR_HALF_LENGTH * 1.55 || side > CAR_HALF_WIDTH * 2.2) continue;
    closest = Math.min(closest, predicted.length());
  }

  return closest;
}

function updateCollisions(dt) {
  for (let i = 0; i < collidableCars.length; i++) {
    for (let j = i + 1; j < collidableCars.length; j++) {
      const a = collidableCars[i];
      const b = collidableCars[j];
      if (a.userData.waitingForEntry || b.userData.waitingForEntry) continue;
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

  spawnCollisionDamage(a, normal.clone().multiplyScalar(-1), postA, closingSpeed);
  spawnCollisionDamage(b, normal, postB, closingSpeed);
  startCrashSlide(a, postA, spin);
  startCrashSlide(b, postB, -spin);
  playCrashSound(Math.min(1, velocityA.clone().sub(velocityB).length() / 30));
  state.crashed = true;
  if (a.userData.player || b.userData.player) {
    state.playerCrashed = true;
    restartBtn.hidden = false;
    statusEl.textContent = "Crash - drag to spin";
  }
}

function spawnCollisionDamage(car, hitNormal, impactVelocity, closingSpeed) {
  const data = car.userData;
  if (state.time - data.lastDamage < 0.35) return;
  data.lastDamage = state.time;

  const localHit = hitNormal.clone().normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), -car.rotation.y);
  const sideHit = Math.abs(localHit.x) > Math.abs(localHit.z);
  const sideSign = sideHit ? Math.sign(localHit.x || 1) : Math.sign(localHit.z || 1);
  const count = THREE.MathUtils.clamp(Math.ceil(closingSpeed / 4), 3, 7);
  const color = data.bodyColor || 0x777777;
  deformCarBody(car, localHit, sideHit, sideSign, closingSpeed);

  for (let i = 0; i < count; i++) {
    const wide = 0.38 + Math.random() * 0.62;
    const tall = 0.12 + Math.random() * 0.18;
    const deep = 0.32 + Math.random() * 0.55;
    const geometry = new THREE.BoxGeometry(sideHit ? tall : wide, tall, sideHit ? wide : tall);
    const piece = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: i % 3 === 0 ? 0x1f2427 : color,
        roughness: 0.72,
        metalness: 0.18,
      }),
    );

    const local = sideHit
      ? new THREE.Vector3(sideSign * (CAR_HALF_WIDTH + 0.08), 0.52 + Math.random() * 0.56, THREE.MathUtils.randFloatSpread(CAR_HALF_LENGTH * 1.55))
      : new THREE.Vector3(THREE.MathUtils.randFloatSpread(CAR_HALF_WIDTH * 1.4), 0.52 + Math.random() * 0.56, sideSign * (CAR_HALF_LENGTH + 0.12));
    car.localToWorld(local);
    piece.position.copy(local);
    piece.rotation.copy(car.rotation);
    piece.castShadow = true;
    piece.receiveShadow = true;
    city.add(piece);

    const outward = hitNormal.clone().normalize();
    const velocity = impactVelocity
      .clone()
      .multiplyScalar(0.28 + Math.random() * 0.12)
      .addScaledVector(outward, 3.2 + Math.random() * 5.5)
      .add(new THREE.Vector3(THREE.MathUtils.randFloatSpread(2.2), 4.2 + Math.random() * 5.4, THREE.MathUtils.randFloatSpread(2.2)));

    damagePieces.push({
      mesh: piece,
      velocity,
      angularVelocity: new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(4.2),
        THREE.MathUtils.randFloatSpread(5.5),
        THREE.MathUtils.randFloatSpread(4.2),
      ),
      restY: tall / 2,
      bounced: false,
    });
  }
}

function deformCarBody(car, localHit, sideHit, sideSign, closingSpeed) {
  const data = car.userData;
  const crush = THREE.MathUtils.clamp(0.2 + closingSpeed * 0.026, 0.28, 0.58);
  const body = data.body;
  const cabin = data.cabin;
  if (!body || !cabin) return;

  body.scale.x = Math.max(0.72, body.scale.x - (sideHit ? crush : crush * 0.35));
  body.scale.z = Math.max(0.7, body.scale.z - (sideHit ? crush * 0.22 : crush));
  body.scale.y = Math.max(0.68, body.scale.y - crush * 0.28);
  body.position.x -= sideHit ? sideSign * crush * 0.42 : localHit.x * crush * 0.18;
  body.position.z -= sideHit ? localHit.z * crush * 0.14 : sideSign * crush * 0.38;
  body.rotation.z += sideHit ? -sideSign * crush * 0.28 : 0;
  body.rotation.x += sideHit ? 0 : sideSign * crush * 0.22;
  body.material.color.lerp(new THREE.Color(0x3b3834), 0.22);
  body.material.roughness = 0.9;

  cabin.scale.x = Math.max(0.78, cabin.scale.x - (sideHit ? crush * 0.24 : crush * 0.12));
  cabin.scale.z = Math.max(0.76, cabin.scale.z - (sideHit ? crush * 0.1 : crush * 0.22));
  cabin.rotation.z += sideHit ? -sideSign * crush * 0.22 : 0;
  cabin.position.y = Math.max(1.08, cabin.position.y - crush * 0.12);

  const damagedSide = sideHit ? sideSign : Math.sign(localHit.x || 1);
  for (const wheel of data.wheels || []) {
    if (Math.sign(wheel.position.x || damagedSide) !== damagedSide) continue;
    wheel.rotation.y += THREE.MathUtils.randFloatSpread(0.45);
    wheel.position.x *= 0.92;
    wheel.position.y = Math.max(0.22, wheel.position.y - crush * 0.18);
  }

  addBrokenCavity(car, localHit, sideHit, sideSign, crush);
  addTornPanels(car, localHit, sideHit, sideSign, crush);
}

function addBrokenCavity(car, localHit, sideHit, sideSign, crush) {
  const cavityMat = new THREE.MeshStandardMaterial({ color: 0x050607, roughness: 1, metalness: 0.12 });
  const rawMetalMat = new THREE.MeshStandardMaterial({ color: 0xc7beb0, roughness: 0.75, metalness: 0.55 });
  const z = THREE.MathUtils.clamp(localHit.z * CAR_HALF_LENGTH, -1.45, 1.45);
  const x = THREE.MathUtils.clamp(localHit.x * CAR_HALF_WIDTH, -0.78, 0.78);
  const center = sideHit
    ? new THREE.Vector3(sideSign * (CAR_HALF_WIDTH + 0.09), 0.76, z)
    : new THREE.Vector3(x, 0.76, sideSign * (CAR_HALF_LENGTH + 0.09));
  const cavity = new THREE.Mesh(
    new THREE.BoxGeometry(sideHit ? 0.16 : 1.85, 0.78, sideHit ? 1.85 : 0.16),
    cavityMat,
  );
  cavity.position.copy(center);
  cavity.rotation.y = sideHit ? 0 : Math.PI / 2;
  cavity.scale.set(1 + crush * 0.75, 1 + crush * 0.42, 1 + crush * 0.75);
  car.add(cavity);

  for (let i = 0; i < 4; i++) {
    const rib = new THREE.Mesh(
      new THREE.BoxGeometry(sideHit ? 0.2 : 1.25, 0.08, sideHit ? 1.25 : 0.2),
      rawMetalMat,
    );
    rib.position.copy(center);
    rib.position.y += -0.36 + i * 0.24;
    if (sideHit) rib.position.x += sideSign * 0.03;
    else rib.position.z += sideSign * 0.03;
    rib.rotation.y = cavity.rotation.y;
    rib.rotation.z = THREE.MathUtils.randFloatSpread(0.22);
    car.add(rib);
  }
}

function addTornPanels(car, localHit, sideHit, sideSign, crush) {
  const color = car.userData.bodyColor || 0x777777;
  const edgeMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.86,
    metalness: 0.22,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x24211f,
    roughness: 0.92,
    metalness: 0.18,
  });
  const baseZ = THREE.MathUtils.clamp(localHit.z * CAR_HALF_LENGTH, -1.55, 1.55);
  const baseX = THREE.MathUtils.clamp(localHit.x * CAR_HALF_WIDTH, -0.82, 0.82);
  for (let i = 0; i < 5; i++) {
    const shard = new THREE.Mesh(
      new THREE.BoxGeometry(0.08 + Math.random() * 0.12, 0.1 + Math.random() * 0.16, 0.52 + Math.random() * 0.44),
      i % 2 ? edgeMat : darkMat,
    );
    const offset = THREE.MathUtils.randFloatSpread(0.9);
    shard.position.set(
      sideHit ? sideSign * (CAR_HALF_WIDTH + 0.12 + Math.random() * 0.12) : baseX + offset * 0.6,
      0.55 + Math.random() * 0.62,
      sideHit ? baseZ + offset : sideSign * (CAR_HALF_LENGTH + 0.12 + Math.random() * 0.12),
    );
    if (!sideHit) {
      shard.rotation.y = Math.PI / 2;
    }
    shard.rotation.x = THREE.MathUtils.randFloatSpread(0.45);
    shard.rotation.z = THREE.MathUtils.randFloatSpread(0.55) + (sideHit ? sideSign * crush : 0);
    shard.scale.x *= 1 + crush;
    car.add(shard);
  }
}

function updateDamagePieces(dt) {
  for (let i = damagePieces.length - 1; i >= 0; i--) {
    const piece = damagePieces[i];
    const restY = piece.restY || 0.08;
    piece.velocity.y -= DAMAGE_GRAVITY * dt;
    piece.mesh.position.addScaledVector(piece.velocity, dt);
    piece.mesh.rotation.x += piece.angularVelocity.x * dt;
    piece.mesh.rotation.y += piece.angularVelocity.y * dt;
    piece.mesh.rotation.z += piece.angularVelocity.z * dt;
    keepDamagePieceInBounds(piece);

    if (piece.mesh.position.y <= restY) {
      piece.mesh.position.y = restY;
      if (!piece.bounced && Math.abs(piece.velocity.y) > 1.2) {
        piece.velocity.y = Math.abs(piece.velocity.y) * 0.34;
        piece.bounced = true;
      } else {
        piece.velocity.y = 0;
      }
      piece.velocity.x = moveToward(piece.velocity.x, 0, DAMAGE_FRICTION * dt);
      piece.velocity.z = moveToward(piece.velocity.z, 0, DAMAGE_FRICTION * dt);
      piece.angularVelocity.multiplyScalar(Math.max(0, 1 - dt * 2.4));
    }

    if (piece.bounced && piece.mesh.position.y < restY + 0.35 && piece.velocity.lengthSq() < 0.18) {
      piece.mesh.position.y = restY;
      piece.velocity.set(0, 0, 0);
      piece.angularVelocity.set(0, 0, 0);
    }
  }
}

function emitExhaustSmoke(car, intensity) {
  const material = new THREE.MeshBasicMaterial({
    color: 0xc8ced1,
    transparent: true,
    opacity: 0.3 + intensity * 0.28,
    depthWrite: false,
  });
  const puff = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), material);
  const rear = new THREE.Vector3(0.58, 0.48, -2.28);
  car.localToWorld(rear);
  puff.position.copy(rear);
  puff.scale.setScalar(0.7 + Math.random() * 0.45);
  city.add(puff);

  const rearward = getForward(car).multiplyScalar(-1);
  exhaustSmoke.push({
    mesh: puff,
    age: 0,
    life: 0.75 + Math.random() * 0.45,
    velocity: rearward.multiplyScalar(1.2 + intensity * 2.2).add(
      new THREE.Vector3(THREE.MathUtils.randFloatSpread(0.7), 0.65 + Math.random() * 0.65, THREE.MathUtils.randFloatSpread(0.7)),
    ),
  });
}

function emitDriftSmoke(car, intensity) {
  for (const x of [-0.92, 0.92]) {
    const material = new THREE.MeshBasicMaterial({
      color: 0xe1e3e4,
      transparent: true,
      opacity: 0.22 + intensity * 0.2,
      depthWrite: false,
    });
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), material);
    const wheelPoint = new THREE.Vector3(x, 0.24, -1.35);
    car.localToWorld(wheelPoint);
    puff.position.copy(wheelPoint);
    city.add(puff);
    const sideways = new THREE.Vector3(THREE.MathUtils.randFloatSpread(1.2), 0.35, THREE.MathUtils.randFloatSpread(1.2));
    exhaustSmoke.push({
      mesh: puff,
      age: 0,
      life: 0.55 + Math.random() * 0.35,
      velocity: car.userData.velocity.clone().multiplyScalar(0.12).add(sideways),
    });
  }
}

function updateExhaustSmoke(dt) {
  for (let i = exhaustSmoke.length - 1; i >= 0; i--) {
    const puff = exhaustSmoke[i];
    puff.age += dt;
    puff.mesh.position.addScaledVector(puff.velocity, dt);
    puff.velocity.y += dt * 0.45;
    puff.mesh.scale.addScalar(dt * 1.35);
    puff.mesh.material.opacity = Math.max(0, (1 - puff.age / puff.life) * 0.48);
    if (puff.age >= puff.life) {
      city.remove(puff.mesh);
      puff.mesh.geometry.dispose();
      puff.mesh.material.dispose();
      exhaustSmoke.splice(i, 1);
    }
  }
}

function keepDamagePieceInBounds(piece) {
  if (piece.mesh.position.x > DAMAGE_BOUNDS) {
    piece.mesh.position.x = DAMAGE_BOUNDS;
    piece.velocity.x = Math.min(0, -Math.abs(piece.velocity.x) * 0.45);
    piece.velocity.z *= 0.72;
  } else if (piece.mesh.position.x < -DAMAGE_BOUNDS) {
    piece.mesh.position.x = -DAMAGE_BOUNDS;
    piece.velocity.x = Math.max(0, Math.abs(piece.velocity.x) * 0.45);
    piece.velocity.z *= 0.72;
  }

  if (piece.mesh.position.z > DAMAGE_BOUNDS) {
    piece.mesh.position.z = DAMAGE_BOUNDS;
    piece.velocity.z = Math.min(0, -Math.abs(piece.velocity.z) * 0.45);
    piece.velocity.x *= 0.72;
  } else if (piece.mesh.position.z < -DAMAGE_BOUNDS) {
    piece.mesh.position.z = -DAMAGE_BOUNDS;
    piece.velocity.z = Math.max(0, Math.abs(piece.velocity.z) * 0.45);
    piece.velocity.x *= 0.72;
  }
}

function updatePieceCarPushes() {
  for (const piece of damagePieces) {
    if (piece.mesh.position.y > 0.75) continue;
    for (const car of collidableCars) {
      const delta = piece.mesh.position.clone().sub(car.position);
      if (Math.abs(delta.y) > 1.1) continue;
      const forward = getForward(car);
      const right = new THREE.Vector3(forward.z, 0, -forward.x);
      const along = delta.dot(forward);
      const side = delta.dot(right);
      if (Math.abs(along) > CAR_HALF_LENGTH + 0.6 || Math.abs(side) > CAR_HALF_WIDTH + 0.45) continue;
      const push = delta.setY(0);
      if (push.lengthSq() < 0.001) push.copy(forward);
      push.normalize();
      const speed = Math.max(2.5, Math.abs(car.userData.speed || 0));
      piece.velocity.addScaledVector(push, speed * 0.22);
      piece.velocity.addScaledVector(forward, (car.userData.speed || 0) * 0.2);
      piece.velocity.y = Math.max(piece.velocity.y, 0.7);
      piece.angularVelocity.add(new THREE.Vector3(side * 0.3, speed * 0.12, -along * 0.25));
      break;
    }
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
    const boundary = data.player ? PLAYER_BOUNDS : BOUNDS;
    car.position.x = THREE.MathUtils.clamp(car.position.x, -boundary, boundary);
    car.position.z = THREE.MathUtils.clamp(car.position.z, -boundary, boundary);

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
  if (state.onFoot && state.pedestrian) {
    const person = state.pedestrian;
    const walkForward = new THREE.Vector3(Math.sin(person.rotation.y), 0, Math.cos(person.rotation.y));
    const target = person.position.clone().addScaledVector(walkForward, -15).add(new THREE.Vector3(0, 11, 0));
    camera.position.lerp(target, 1 - Math.pow(0.001, dt));
    camera.lookAt(person.position.clone().addScaledVector(walkForward, 8).add(new THREE.Vector3(0, 2.2, 0)));
    return;
  }
  const baseForward = getWorldForward(car);
  const forward = state.playerCrashed
    ? baseForward.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), state.crashLook.yaw).normalize()
    : baseForward;
  const carPosition = car.getWorldPosition(new THREE.Vector3());
  const vertical = state.playerCrashed ? new THREE.Vector3(0, 11 + state.crashLook.pitch, 0) : new THREE.Vector3(0, 11, 0);
  const target = carPosition
    .clone()
    .addScaledVector(forward, -15)
    .add(vertical);
  camera.position.lerp(target, 1 - Math.pow(0.001, dt));
  const look = carPosition.clone().addScaledVector(forward, 8).add(new THREE.Vector3(0, 2.2, 0));
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
  if (state.onFoot) {
    const distance = state.pedestrian.position.distanceTo(state.player.position);
    statusEl.textContent = distance <= 3.3 ? "Press C to get back in" : "On foot — follow the blue beacon to your car";
  } else if (!state.playerCrashed) {
    statusEl.textContent = state.crashed ? "Crash in city" : "City clear";
  }
}

function onKeyDown(event) {
  const key = normalizeKey(event);
  if (!key) return;
  ensureAudio();
  keys.add(key);
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "space", "q", "e", "z", "c"].includes(key)) {
    event.preventDefault();
    event.stopPropagation();
  }
  if (event.repeat && ["q", "e", "z", "c"].includes(key)) return;
  if (state.toggleHeld.has(key)) return;
  if (key === "q") toggleSignal("left");
  if (key === "e") toggleSignal("right");
  if (key === "z") toggleHazards();
  if (key === "c") toggleCarExit();
  if (["q", "e", "z", "c"].includes(key)) state.toggleHeld.add(key);
}

function onKeyPress(event) {
  const key = normalizeKey(event);
  if (!["q", "e", "z", "c"].includes(key)) return;
  event.preventDefault();
  event.stopPropagation();
  if (state.toggleHeld.has(key)) return;
  if (key === "q") toggleSignal("left");
  if (key === "e") toggleSignal("right");
  if (key === "z") toggleHazards();
  if (key === "c") toggleCarExit();
  state.toggleHeld.add(key);
}

function onKeyUp(event) {
  const key = normalizeKey(event);
  if (!key) return;
  keys.delete(key);
  state.toggleHeld.delete(key);
}

function onPointerDown(event) {
  renderer.domElement.focus();
  ensureAudio();
  if (!state.playerCrashed) return;
  state.crashLook.active = true;
  state.crashLook.lastX = event.clientX;
  state.crashLook.lastY = event.clientY;
  renderer.domElement.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function onPointerMove(event) {
  if (!state.crashLook.active) return;
  const dx = event.clientX - state.crashLook.lastX;
  const dy = event.clientY - state.crashLook.lastY;
  state.crashLook.lastX = event.clientX;
  state.crashLook.lastY = event.clientY;
  state.crashLook.yaw = THREE.MathUtils.clamp(state.crashLook.yaw - dx * 0.01, -1.45, 1.45);
  state.crashLook.pitch = THREE.MathUtils.clamp(state.crashLook.pitch + dy * 0.08, -5, 6);
  event.preventDefault();
}

function onPointerUp() {
  state.crashLook.active = false;
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
    KeyC: "c",
    Space: "space",
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
  if (state.audio) {
    if (state.audio.state === "suspended") state.audio.resume();
    return state.audio;
  }
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  state.audio = new AudioContext();
  return state.audio;
}

function updateEngineSounds(dt) {
  const audio = state.audio;
  if (!audio || audio.state === "suspended" || !state.player) return;

  const listener = state.player.position;
  const audible = cars
    .filter((car) => car.visible && !car.userData.waitingForEntry)
    .map((car) => ({ car, distance: car.position.distanceTo(listener) }))
    .filter((item) => item.car.userData.player || item.distance <= ENGINE_AUDIO_RANGE)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, MAX_ENGINE_VOICES);
  const active = new Set(audible.map((item) => item.car));

  for (const car of cars) {
    if (car.userData.engineVoice && !active.has(car)) destroyEngineVoice(car);
  }

  const playerForward = getForward(state.player).normalize();
  const playerRight = new THREE.Vector3(playerForward.z, 0, -playerForward.x);
  const now = audio.currentTime;

  for (const { car, distance } of audible) {
    const data = car.userData;
    const voice = data.engineVoice || createEngineVoice(car, audio);
    const speed = Math.abs(data.speed || 0);
    const previousSpeed = data.lastEngineSpeed ?? speed;
    const acceleration = dt > 0 ? (speed - previousSpeed) / dt : 0;
    data.lastEngineSpeed = speed;
    const roadSpeedRatio = THREE.MathUtils.clamp(speed / Math.max(1, data.maxSpeed || 20), 0, 1);
    const speedRatio = data.player ? Math.max(roadSpeedRatio, data.revRatio || 0) : roadSpeedRatio;
    const load = THREE.MathUtils.clamp(acceleration / 12, -0.25, 1);
    const rpmFrequency = 34 + speedRatio * 92 + Math.max(0, load) * 12;
    const falloff = data.player ? 1 : Math.pow(Math.max(0, 1 - distance / ENGINE_AUDIO_RANGE), 2);
    const baseGain = 0.006 + speedRatio * 0.018 + Math.max(0, load) * 0.009;
    const targetGain = ENGINE_VOLUME * falloff * (data.player ? baseGain * 1.7 : baseGain);
    const pan = data.player
      ? 0
      : THREE.MathUtils.clamp(car.position.clone().sub(listener).dot(playerRight) / 24, -0.9, 0.9);

    voice.low.frequency.setTargetAtTime(rpmFrequency, now, 0.055);
    voice.high.frequency.setTargetAtTime(rpmFrequency * 2.03, now, 0.045);
    voice.filter.frequency.setTargetAtTime(260 + speedRatio * 1250 + Math.max(0, load) * 450, now, 0.08);
    voice.gain.gain.setTargetAtTime(targetGain, now, 0.07);
    voice.panner.pan.setTargetAtTime(pan, now, 0.08);
  }
}

function createEngineVoice(car, audio) {
  const low = audio.createOscillator();
  const high = audio.createOscillator();
  const lowGain = audio.createGain();
  const highGain = audio.createGain();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  const panner = audio.createStereoPanner();

  low.type = "sawtooth";
  high.type = "triangle";
  low.frequency.value = 34;
  high.frequency.value = 69;
  lowGain.gain.value = 0.72;
  highGain.gain.value = 0.28;
  filter.type = "lowpass";
  filter.Q.value = 1.4;
  filter.frequency.value = 320;
  gain.gain.value = 0;
  low.connect(lowGain).connect(filter);
  high.connect(highGain).connect(filter);
  filter.connect(gain).connect(panner).connect(getEngineMaster(audio));
  low.start();
  high.start();
  car.userData.engineVoice = { low, high, filter, gain, panner };
  return car.userData.engineVoice;
}

function getEngineMaster(audio) {
  if (state.engineMaster) return state.engineMaster;
  const compressor = audio.createDynamicsCompressor();
  compressor.threshold.value = -12;
  compressor.knee.value = 18;
  compressor.ratio.value = 6;
  compressor.attack.value = 0.004;
  compressor.release.value = 0.18;
  compressor.connect(audio.destination);
  state.engineMaster = compressor;
  return compressor;
}

function destroyEngineVoice(car) {
  const voice = car.userData.engineVoice;
  if (!voice) return;
  const now = state.audio?.currentTime || 0;
  try {
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(0, now);
    voice.low.stop(now + 0.02);
    voice.high.stop(now + 0.02);
  } catch {
    // A restart or traffic trim may encounter an already stopped voice.
  }
  car.userData.engineVoice = null;
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

  const angry = kind === "angry" || kind === "danger";
  const danger = kind === "danger";
  const now = audio.currentTime;
  const bursts = danger ? 3 : 1;
  const burstGap = 0.16;
  const duration = danger ? 0.11 : angry ? 0.42 : 0.22;
  const baseGain = danger ? 0.18 : angry ? 0.22 : 0.15;

  for (let i = 0; i < bursts; i++) {
    const start = now + i * burstGap;
    const end = start + duration;
    const gain = audio.createGain();
    const filter = audio.createBiquadFilter();
    const lowHorn = audio.createOscillator();
    const highHorn = audio.createOscillator();
    const growl = audio.createOscillator();

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(620, start);
    filter.Q.setValueAtTime(1.15, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(baseGain, start + 0.018);
    gain.gain.setValueAtTime(baseGain, start + duration * 0.72);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    lowHorn.type = "sawtooth";
    highHorn.type = "sawtooth";
    growl.type = "triangle";
    lowHorn.frequency.setValueAtTime(349.23, start);
    highHorn.frequency.setValueAtTime(440, start);
    growl.frequency.setValueAtTime(174.61, start);
    if (angry) {
      lowHorn.frequency.linearRampToValueAtTime(329.63, end);
      highHorn.frequency.linearRampToValueAtTime(415.3, end);
    }

    lowHorn.connect(filter);
    highHorn.connect(filter);
    growl.connect(filter);
    filter.connect(gain);
    gain.connect(audio.destination);
    lowHorn.start(start);
    highHorn.start(start);
    growl.start(start);
    lowHorn.stop(end);
    highHorn.stop(end);
    growl.stop(end);
  }
}

function restartCity() {
  if (state.pedestrian) city.remove(state.pedestrian);
  if (state.carBeacon) city.remove(state.carBeacon);
  for (const car of cars) {
    destroyEngineVoice(car);
    city.remove(car);
  }
  cars.length = 0;
  collidableCars.length = 0;
  state.crashed = false;
  state.playerCrashed = false;
  state.signal = "off";
  state.hazard = false;
  state.onFoot = false;
  state.greenBlockTimer = 0;
  state.crashLook.active = false;
  state.crashLook.yaw = 0;
  state.crashLook.pitch = 0;
  for (const person of npcPedestrians) {
    person.userData.fallenUntil = 0;
    person.rotation.x = 0;
    person.position.y = 0;
  }
  city.rotation.y = 0;
  restartBtn.hidden = true;
  createPlayer();
  createPedestrian();
  createBots();
}

function resolveBuildingCollisions(car, previous) {
  let hit = false;
  const collisionRadius = car.userData.player && isPlayerOnlyLanePosition(car.position) ? CAR_HALF_WIDTH : CAR_RADIUS;
  for (const obstacle of buildingObstacles) {
    const closestX = THREE.MathUtils.clamp(car.position.x, obstacle.x - obstacle.halfX, obstacle.x + obstacle.halfX);
    const closestZ = THREE.MathUtils.clamp(car.position.z, obstacle.z - obstacle.halfZ, obstacle.z + obstacle.halfZ);
    const dx = car.position.x - closestX;
    const dz = car.position.z - closestZ;
    const distSq = dx * dx + dz * dz;
    if (distSq > collisionRadius * collisionRadius) continue;

    let normal = new THREE.Vector3(dx, 0, dz);
    if (normal.lengthSq() < 0.001) {
      const fromPrevious = previous.clone().sub(new THREE.Vector3(obstacle.x, 0, obstacle.z));
      normal.set(fromPrevious.x, 0, fromPrevious.z);
      if (normal.lengthSq() < 0.001) normal.set(0, 0, 1);
    }
    normal.normalize();
    const penetration = collisionRadius - Math.sqrt(Math.max(distSq, 0.0001));
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
  if (car.userData.player && isRacingArea(car.position)) return;
  if (car.userData.player && isPlayerOnlyLanePosition(car.position)) return;
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
  const data = bot.userData;
  const next = { x: bot.position.x, z: bot.position.z, dir: data.dir };
  let wrapped = false;

  if (next.x > BOUNDS) {
    next.x = -BOUNDS;
    wrapped = true;
  }
  if (next.x < -BOUNDS) {
    next.x = BOUNDS;
    wrapped = true;
  }
  if (next.z > BOUNDS) {
    next.z = -BOUNDS;
    wrapped = true;
  }
  if (next.z < -BOUNDS) {
    next.z = BOUNDS;
    wrapped = true;
  }
  if (!wrapped) return;

  if (canSpawnBotAt(next, bot)) {
    bot.position.set(next.x, 0, next.z);
    snapToLane(bot);
    return;
  }

  data.speed = 0;
  data.velocity.set(0, 0, 0);
  data.waitingForEntry = next;
  bot.visible = false;
}

function removeFromArray(items, item) {
  const index = items.indexOf(item);
  if (index >= 0) items.splice(index, 1);
}

function getForward(car) {
  return new THREE.Vector3(Math.sin(car.rotation.y), 0, Math.cos(car.rotation.y));
}

function getWorldForward(car) {
  return getForward(car).applyQuaternion(city.quaternion).normalize();
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
