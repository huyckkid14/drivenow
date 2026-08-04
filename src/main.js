import * as THREE from "three";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bc8e8);
scene.fog = new THREE.Fog(0x9bc8e8, 105, 255);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 600);
const leftMirrorCamera = new THREE.PerspectiveCamera(52, 2.05, 0.1, 240);
const rightMirrorCamera = new THREE.PerspectiveCamera(52, 2.05, 0.1, 240);
const rearviewCamera = new THREE.PerspectiveCamera(48, 3.1, 0.1, 240);
const leftMirrorTarget = new THREE.WebGLRenderTarget(256, 128);
const rightMirrorTarget = new THREE.WebGLRenderTarget(256, 128);
const rearviewTarget = new THREE.WebGLRenderTarget(320, 104);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
const policeRaycaster = new THREE.Raycaster();
const policePointer = new THREE.Vector2();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const securityMonitorScene = new THREE.Scene();
securityMonitorScene.background = new THREE.Color(0x071016);
const securityMonitorCamera = new THREE.OrthographicCamera(-2.5, 2.5, 2.5, -2.5, 0.1, 20);
securityMonitorCamera.position.z = 5;

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
const policeInteractionEl = document.querySelector("#policeInteraction");
const driverResponseEl = document.querySelector("#driverResponse");
const introOverlayEl = document.querySelector("#introOverlay");
const startNowBtn = document.querySelector("#startNow");

const clock = new THREE.Clock();
const keys = new Set();
const cars = [];
const trafficLights = [];
const roadSegments = [];
const collidableCars = [];
const damagePieces = [];
const exhaustSmoke = [];
const npcPedestrians = [];
const crashResponders = [];
const hijackedDrivers = [];
const securityCameras = [];
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
const SEVERE_HONK_COOLDOWN = 1.55;
const WRONG_WAY_HONK_COOLDOWN = 1.7;
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
const SECURITY_ROOM_ENTRY = new THREE.Vector3(72, 0, 9.7);

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
  doorMotionStart: -10,
  carTransition: null,
  crashMeeting: null,
  policeMode: false,
  policeTarget: null,
  policeSiren: null,
  policeInterview: false,
  policeConversation: null,
  introActive: document.documentElement.dataset.intro === "new",
  cameraView: 0,
  cockpitLook: { yaw: 0, pitch: 0 },
  botSensitivity: 0,
  trafficDensity: 1,
  trafficInitialized: false,
  onFoot: false,
  securityRoom: false,
  securitySelected: null,
  securityFeedCursor: 0,
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
  createSecurityCameraRoom();
  createTrafficLights();
  createIntersectionSecurityCameras();
  createPlayer();
  createPedestrian();
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
  policeInteractionEl.addEventListener("click", onPoliceInteractionClick);
  setupIntro();
  updateBotSensitivity();
  updateTrafficDensity();
  loadingEl.hidden = true;
}

function setupIntro() {
  if (!state.introActive) return;
  const revealDelay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 50 : 2850;
  window.setTimeout(() => introOverlayEl.classList.add("directions"), revealDelay);
  startNowBtn.addEventListener("click", () => {
    introOverlayEl.classList.add("leaving");
    state.introActive = false;
    clock.getDelta();
    renderer.domElement.focus();
    window.setTimeout(() => introOverlayEl.classList.add("finished"), 560);
  }, { once: true });
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

function createSecurityCameraRoom() {
  const wall = new THREE.MeshStandardMaterial({ color: 0x26323b, roughness: 0.58, metalness: 0.12 });
  const building = new THREE.Mesh(new THREE.BoxGeometry(14, 7, 12), wall);
  building.position.set(72, 3.5, 17);
  building.castShadow = true;
  building.receiveShadow = true;
  buildings.add(building);
  buildingObstacles.push({ x: 72, z: 17, halfX: 7.1, halfZ: 6.1 });

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 3.4, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x10171c, metalness: 0.72, roughness: 0.28 }),
  );
  door.position.set(72, 1.7, 10.92);
  buildings.add(door);

  const signCanvas = document.createElement("canvas");
  signCanvas.width = 1024;
  signCanvas.height = 160;
  const context = signCanvas.getContext("2d");
  context.fillStyle = "#101820";
  context.fillRect(0, 0, signCanvas.width, signCanvas.height);
  context.strokeStyle = "#59d9ff";
  context.lineWidth = 12;
  context.strokeRect(6, 6, signCanvas.width - 12, signCanvas.height - 12);
  context.fillStyle = "#e9fbff";
  context.font = "bold 62px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("SECURITY CAMERA ROOM", 512, 82);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(13, 2.05),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(signCanvas) }),
  );
  sign.position.set(72, 5.35, 10.76);
  sign.rotation.y = Math.PI;
  buildings.add(sign);

  const beacon = new THREE.PointLight(0x4dd9ff, 18, 12);
  beacon.position.set(72, 3.8, 9.6);
  buildings.add(beacon);
}

function createIntersectionSecurityCameras() {
  const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x3b464b, metalness: 0.55, roughness: 0.38 });
  const cameraMaterial = new THREE.MeshStandardMaterial({ color: 0xe8edf0, metalness: 0.25, roughness: 0.42 });
  for (const x of GRID) {
    for (const z of GRID) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 6.5, 10), poleMaterial);
      pole.position.set(x + 7.5, 3.25, z + 7.5);
      city.add(pole);
      const oppositePole = pole.clone();
      oppositePole.position.set(x - 7.5, 3.25, z - 7.5);
      city.add(oppositePole);
      const housing = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.48, 1.15), cameraMaterial);
      housing.position.set(x + 7.5, 6.45, z + 7.1);
      housing.rotation.x = -0.24;
      city.add(housing);
      const lens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.17, 0.17, 0.16, 12),
        new THREE.MeshBasicMaterial({ color: 0x071018 }),
      );
      lens.rotation.x = Math.PI / 2;
      lens.position.set(x + 7.5, 6.36, z + 6.48);
      city.add(lens);

      const oppositeHousing = housing.clone();
      oppositeHousing.position.set(x - 7.5, 6.45, z - 7.1);
      oppositeHousing.rotation.y = Math.PI;
      city.add(oppositeHousing);
      const oppositeLens = lens.clone();
      oppositeLens.position.set(x - 7.5, 6.36, z - 6.48);
      city.add(oppositeLens);
      const recordingLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xff2c2c }),
      );
      recordingLight.position.set(x + 7.77, 6.58, z + 6.68);
      city.add(recordingLight);

      const view = new THREE.PerspectiveCamera(62, 1, 0.1, 260);
      view.position.set(x + 7.5, 6.35, z + 7.1);
      view.lookAt(x, 0.5, z);
      const target = new THREE.WebGLRenderTarget(320, 180, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: true,
      });
      securityCameras.push({ x, z, view, target, monitor: null });
    }
  }
  createSecurityMonitorWall();
}

function createSecurityMonitorWall() {
  for (let i = 0; i < securityCameras.length; i++) {
    const feed = securityCameras[i];
    const column = i % 5;
    const row = Math.floor(i / 5);
    const monitor = new THREE.Mesh(
      new THREE.PlaneGeometry(0.96, 0.96),
      new THREE.MeshBasicMaterial({ map: feed.target.texture }),
    );
    monitor.position.set(column - 2, 2 - row, 0);
    monitor.userData.gridPosition = monitor.position.clone();
    securityMonitorScene.add(monitor);
    feed.monitor = monitor;
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
    body: player.userData.body,
    cabin: player.userData.cabin,
    playerMarker: player.userData.playerMarker,
    wheels: player.userData.wheels,
  };
  city.add(player);
  cars.push(player);
  collidableCars.push(player);
  state.player = player;
  createCockpitInterior(player);
}

function createCockpitInterior(car) {
  const cockpit = new THREE.Group();
  cockpit.visible = false;
  const trim = new THREE.MeshStandardMaterial({ color: 0x111619, roughness: 0.72, side: THREE.DoubleSide });
  const softTrim = new THREE.MeshStandardMaterial({ color: 0x252d31, roughness: 0.9, side: THREE.DoubleSide });
  const glass = new THREE.MeshStandardMaterial({ color: 0x9fc9db, transparent: true, opacity: 0.08, roughness: 0.08, side: THREE.DoubleSide });

  const dashboard = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.28, 0.72), trim);
  dashboard.position.set(0, 1.05, 0.73);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.13, 1.95), softTrim);
  roof.position.set(0, 2.18, -0.05);
  const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.84, 0.86), glass);
  windshield.position.set(0, 1.67, 0.86);
  windshield.rotation.x = -0.12;
  for (const [x, tilt] of [[-0.96, -0.12], [0.96, 0.12]]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.9, 0.15), softTrim);
    pillar.position.set(x, 1.69, 0.78);
    pillar.rotation.z = tilt;
    cockpit.add(pillar);
  }

  const wheel = new THREE.Mesh(
    new THREE.TorusGeometry(0.24, 0.035, 12, 32),
    new THREE.MeshStandardMaterial({ color: 0x07090a, roughness: 0.65, side: THREE.DoubleSide }),
  );
  wheel.position.set(0.38, 1.18, 0.32);
  wheel.rotation.x = -0.14;
  const wheelHub = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 20), trim);
  wheelHub.position.set(0.38, 1.18, 0.3);
  wheelHub.rotation.x = Math.PI / 2;

  const displayCanvas = document.createElement("canvas");
  displayCanvas.width = 512;
  displayCanvas.height = 256;
  const displayTexture = new THREE.CanvasTexture(displayCanvas);
  displayTexture.colorSpace = THREE.SRGBColorSpace;
  const display = new THREE.Mesh(
    new THREE.PlaneGeometry(0.64, 0.3),
    new THREE.MeshBasicMaterial({ map: displayTexture, side: THREE.DoubleSide }),
  );
  display.position.set(-0.08, 1.23, 0.355);
  display.rotation.y = Math.PI;

  const infotainment = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.25),
    new THREE.MeshBasicMaterial({ color: 0x12344a, side: THREE.DoubleSide }),
  );
  infotainment.position.set(-0.72, 1.18, 0.36);
  infotainment.rotation.y = Math.PI;

  const mirrorMaterialLeft = new THREE.MeshBasicMaterial({ map: leftMirrorTarget.texture, side: THREE.DoubleSide });
  const mirrorMaterialRight = new THREE.MeshBasicMaterial({ map: rightMirrorTarget.texture, side: THREE.DoubleSide });
  for (const spec of [
    { x: 1.34, material: mirrorMaterialLeft },
    { x: -1.05, material: mirrorMaterialRight },
  ]) {
    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.34, 0.12), trim);
    housing.position.set(spec.x, 1.36, 0.68);
    const mirror = new THREE.Mesh(new THREE.PlaneGeometry(0.53, 0.26), spec.material);
    mirror.position.set(spec.x, 1.36, 0.61);
    mirror.rotation.y = Math.PI;
    cockpit.add(housing, mirror);
  }

  const rearviewHousing = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.3, 0.12), trim);
  rearviewHousing.position.set(0, 1.88, 0.46);
  const rearviewMirror = new THREE.Mesh(
    new THREE.PlaneGeometry(0.76, 0.22),
    new THREE.MeshBasicMaterial({ map: rearviewTarget.texture, side: THREE.DoubleSide }),
  );
  rearviewMirror.position.set(0, 1.88, 0.385);
  rearviewMirror.rotation.y = Math.PI;
  const rearviewStem = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.08), trim);
  rearviewStem.position.set(0, 2.02, 0.5);

  cockpit.add(dashboard, roof, windshield, wheel, wheelHub, display, infotainment,
    rearviewHousing, rearviewMirror, rearviewStem);
  cockpit.userData.displayCanvas = displayCanvas;
  cockpit.userData.displayTexture = displayTexture;
  car.add(cockpit);
  car.userData.cockpit = cockpit;
  updateCockpitDisplay(0, 900);
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
  person.userData = {
    speed: 1.05 + (index % 4) * 0.12,
    gait: index,
    fallenUntil: 0,
    fallStart: -1,
    fallSide: 0,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
  };
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
    driverDoor: bot.userData.driverDoor,
    body: bot.userData.body,
    cabin: bot.userData.cabin,
    wheels: bot.userData.wheels,
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
    car.userData.playerMarker = marker;

  }

  const door = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.68, 1.55), bodyMat.clone());
  door.position.set(1.22, 0.72, 0.55);
  door.geometry.translate(0, 0, -0.72);
  car.add(door);
  car.userData.driverDoor = door;

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
  if (state.introActive) {
    updateCamera(dt);
    renderer.render(scene, camera);
    return;
  }
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
  updateCrashMeeting(dt);
  updateBots(dt);
  updatePoliceMode(dt);
  updateEngineSounds(dt);
  updateTrafficSpawns();
  updateDriverReactions(dt);
  updateCollisions(dt);
  updateSignals(dt);
  updateCamera(dt);
  updateHud();
  if (state.securityRoom) renderSecurityFeeds();
  else renderDrivingScene();
}

function renderDrivingScene() {
  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  renderer.setScissorTest(false);
  const cockpitActive = state.cameraView === 2 && !state.onFoot && !state.policeInterview;
  if (cockpitActive) renderCockpitMirrors();
  renderer.setRenderTarget(null);
  renderer.render(scene, camera);
}

function renderCockpitMirrors() {
  const car = state.player;
  const cockpit = car.userData.cockpit;
  const shadowUpdates = renderer.shadowMap.autoUpdate;
  renderer.shadowMap.autoUpdate = false;
  cockpit.visible = false;
  for (const spec of [
    { view: leftMirrorCamera, target: leftMirrorTarget, x: 1.34, outward: 3.2 },
    { view: rightMirrorCamera, target: rightMirrorTarget, x: -1.34, outward: -3.2 },
    { view: rearviewCamera, target: rearviewTarget, x: 0, outward: 0 },
  ]) {
    const centerMirror = spec.view === rearviewCamera;
    spec.view.position.copy(car.localToWorld(new THREE.Vector3(spec.x, centerMirror ? 1.72 : 1.42, 0.62)));
    spec.view.lookAt(car.localToWorld(new THREE.Vector3(spec.outward, centerMirror ? 1.58 : 1.2, -28)));
    renderer.setRenderTarget(spec.target);
    renderer.clear();
    renderer.render(scene, spec.view);
  }
  cockpit.visible = true;
  renderer.shadowMap.autoUpdate = shadowUpdates;
}

function renderSecurityFeeds() {
  const displaySize = renderer.getSize(new THREE.Vector2());
  const width = displaySize.x;
  const height = displaySize.y;
  const selected = state.securitySelected;
  const captures = selected === null
    ? [state.securityFeedCursor, (state.securityFeedCursor + 1) % securityCameras.length]
    : [selected];
  const shadowUpdates = renderer.shadowMap.autoUpdate;
  renderer.shadowMap.autoUpdate = false;
  for (const index of captures) {
    const feed = securityCameras[index];
    feed.view.aspect = 16 / 9;
    feed.view.updateProjectionMatrix();
    renderer.setRenderTarget(feed.target);
    renderer.clear();
    renderer.render(scene, feed.view);
  }
  renderer.shadowMap.autoUpdate = shadowUpdates;
  state.securityFeedCursor = (state.securityFeedCursor + captures.length) % securityCameras.length;

  for (let i = 0; i < securityCameras.length; i++) {
    const monitor = securityCameras[i].monitor;
    const highlighted = selected === i;
    monitor.visible = selected === null || highlighted;
    monitor.position.copy(highlighted ? new THREE.Vector3(0, 0, 0) : monitor.userData.gridPosition);
    monitor.scale.setScalar(highlighted ? 5 : 1);
  }
  renderer.setRenderTarget(null);
  renderer.setScissorTest(false);
  renderer.setScissor(0, 0, width, height);
  renderer.setViewport(0, 0, width, height);
  renderer.render(securityMonitorScene, securityMonitorCamera);
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
  if (state.policeInterview) {
    data.speed = 0;
    data.velocity.set(0, 0, 0);
    data.braking = true;
    return;
  }
  if (data.immobilized || data.crashed || state.onFoot || state.carTransition) {
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
  if (!person || !state.onFoot || state.securityRoom || state.carTransition) return;
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
  const elapsed = state.time - state.doorMotionStart;
  let target = 0;
  if (elapsed >= 0 && elapsed < 1.18) target = -1.05;
  const speed = target < 0 ? 3.2 : 2.25;
  door.rotation.y = moveToward(door.rotation.y, target, dt * speed);

  const transition = state.carTransition;
  if (!transition) return;
  const stepStart = 0.34;
  const stepEnd = 1.12;
  if (elapsed >= stepStart) {
    if (!transition.started) beginCarStep(transition);
    const progress = THREE.MathUtils.clamp((elapsed - stepStart) / (stepEnd - stepStart), 0, 1);
    animateCarStep(transition, progress);
    if (!transition.finished && progress >= 1) finishCarStep(transition);
  }
  if (elapsed >= 1.7) state.carTransition = null;
}

function carDoorwayPoint(x, z) {
  const point = new THREE.Vector3(x, 0, z);
  state.player.localToWorld(point);
  return point;
}

function beginCarStep(transition) {
  const car = state.player;
  const person = state.pedestrian;
  transition.started = true;
  transition.seatPoint = carDoorwayPoint(0.72, 0.12);
  transition.gapPoint = carDoorwayPoint(1.62, 0.08);
  transition.edgePoint = carDoorwayPoint(2.86, -0.42);
  transition.groundPoint = carDoorwayPoint(2.45, -1.1);
  if (transition.type === "exit") {
    state.cameraView = 0;
    state.cockpitLook.yaw = 0;
    state.cockpitLook.pitch = 0;
    state.onFoot = true;
    person.position.copy(transition.seatPoint);
    person.rotation.y = car.rotation.y;
    person.visible = true;
    state.carBeacon.visible = true;
    statusEl.textContent = "Stepping out…";
  } else {
    statusEl.textContent = "Stepping into car…";
  }
}

function animateCarStep(transition, progress) {
  const person = state.pedestrian;
  const exitPoints = [transition.seatPoint, transition.gapPoint, transition.edgePoint, transition.groundPoint];
  const entryPoints = [transition.from, transition.groundPoint, transition.edgePoint, transition.gapPoint, transition.seatPoint];
  const points = transition.type === "exit" ? exitPoints : entryPoints;
  const segmentFloat = progress * (points.length - 1);
  const segment = Math.min(points.length - 2, Math.floor(segmentFloat));
  const localProgress = segmentFloat - segment;
  const eased = localProgress * localProgress * (3 - 2 * localProgress);
  person.position.lerpVectors(points[segment], points[segment + 1], eased);
  person.position.y += Math.sin(progress * Math.PI) * 0.12;
  const stride = Math.sin(progress * Math.PI * 2) * 0.48;
  person.userData.leftLeg.rotation.x = stride;
  person.userData.rightLeg.rotation.x = -stride;
  person.userData.leftArm.rotation.x = -stride * 0.55;
  person.userData.rightArm.rotation.x = stride * 0.55;
}

function finishCarStep(transition) {
  const person = state.pedestrian;
  transition.finished = true;
  person.userData.leftLeg.rotation.x = 0;
  person.userData.rightLeg.rotation.x = 0;
  person.userData.leftArm.rotation.x = 0;
  person.userData.rightArm.rotation.x = 0;
  if (transition.type === "exit") {
    person.position.copy(transition.groundPoint);
    statusEl.textContent = "On foot — follow the blue beacon back to your car";
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

function updateNpcPedestrians(dt) {
  const player = state.player;
  for (const person of npcPedestrians) {
    const data = person.userData;
    if (data.fallStart >= 0) {
      const progress = THREE.MathUtils.clamp((state.time - data.fallStart) / 0.72, 0, 1);
      const eased = progress * progress * (3 - 2 * progress);
      person.rotation.x = THREE.MathUtils.lerp(data.fallFromX, -Math.PI / 2, eased);
      person.rotation.z = THREE.MathUtils.lerp(data.fallFromZ, data.fallSide * 0.16, eased);
      person.position.y = THREE.MathUtils.lerp(data.fallFromY, 0.38, eased);
      data.leftArm.rotation.x = THREE.MathUtils.lerp(data.fallLeftArm, -0.78, eased);
      data.rightArm.rotation.x = THREE.MathUtils.lerp(data.fallRightArm, 0.62, eased);
      data.leftLeg.rotation.x = THREE.MathUtils.lerp(data.fallLeftLeg, 0.18, eased);
      data.rightLeg.rotation.x = THREE.MathUtils.lerp(data.fallRightLeg, -0.12, eased);
      if (progress >= 1) data.fallStart = -1;
      continue;
    }
    if (data.fallenUntil > state.time) continue;
    if (Math.abs(person.rotation.x) > 0.02 || Math.abs(person.rotation.z) > 0.02 || person.position.y > 0.01) {
      person.rotation.x = moveToward(person.rotation.x, 0, dt * 3.2);
      person.rotation.z = moveToward(person.rotation.z, 0, dt * 1.8);
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
  data.fallStart = state.time;
  data.fallenUntil = state.time + 5.72;
  data.fallSide = Math.random() < 0.5 ? -1 : 1;
  data.fallFromX = person.rotation.x;
  data.fallFromZ = person.rotation.z;
  data.fallFromY = person.position.y;
  data.fallLeftArm = data.leftArm.rotation.x;
  data.fallRightArm = data.rightArm.rotation.x;
  data.fallLeftLeg = data.leftLeg.rotation.x;
  data.fallRightLeg = data.rightLeg.rotation.x;
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
  if (!car || !person) return;
  if (state.carTransition) return;
  if (state.securityRoom) {
    state.securityRoom = false;
    state.securitySelected = null;
    person.visible = true;
    person.position.copy(SECURITY_ROOM_ENTRY);
    statusEl.textContent = "Exited security camera room";
    return;
  }
  if (state.onFoot && person.position.distanceTo(SECURITY_ROOM_ENTRY) <= 4.2) {
    state.securityRoom = true;
    state.securitySelected = null;
    state.securityFeedCursor = 0;
    person.userData.velocity.set(0, 0, 0);
    person.userData.speed = 0;
    person.visible = false;
    statusEl.textContent = "Security feeds — C to exit";
    return;
  }
  if (state.onFoot) {
    const nearCurrentCar = person.position.distanceTo(car.position) <= 3.3;
    if (!nearCurrentCar) {
      const abandonedTarget = findAbandonedCarTarget(person.position);
      if (abandonedTarget) {
        transferPlayerControl(abandonedTarget, "Original car reclaimed — drive!");
        return;
      }
      const hijackTarget = findHijackTarget(person.position);
      if (hijackTarget) {
        hijackBotCar(hijackTarget);
        return;
      }
    }
  }
  if (!state.onFoot) {
    if (Math.abs(car.userData.speed) > 0.35) {
      statusEl.textContent = "Stop the car before getting out";
      return;
    }
    state.doorMotionStart = state.time;
    state.carTransition = { type: "exit", started: false, finished: false };
    car.userData.speed = 0;
    car.userData.velocity.set(0, 0, 0);
    statusEl.textContent = "Opening door…";
    return;
  }
  if (person.position.distanceTo(car.position) > 3.3) {
    statusEl.textContent = "Move closer to your car to get in";
    return;
  }
  if (car.userData.crashed || car.userData.immobilized) {
    statusEl.textContent = "The car is wrecked — continue on foot or restart";
    return;
  }
  state.doorMotionStart = state.time;
  state.carTransition = { type: "enter", started: false, finished: false, from: person.position.clone() };
  person.userData.velocity.set(0, 0, 0);
  person.userData.speed = 0;
  person.userData.steer = 0;
  statusEl.textContent = "Opening door…";
}

function findHijackTarget(position) {
  let closest = null;
  let closestDistance = 3.7;
  for (const car of cars) {
    const data = car.userData;
    if (data.player || data.abandonedPlayerCar || data.crashed || data.immobilized || data.waitingForEntry) continue;
    if (Math.abs(data.speed || 0) > 0.55) continue;
    const distance = car.position.distanceTo(position);
    if (distance >= closestDistance) continue;
    closest = car;
    closestDistance = distance;
  }
  return closest;
}

function findAbandonedCarTarget(position) {
  let closest = null;
  let closestDistance = 3.7;
  for (const car of cars) {
    const data = car.userData;
    if (!data.abandonedPlayerCar || data.crashed || data.waitingForEntry) continue;
    const distance = car.position.distanceTo(position);
    if (distance >= closestDistance) continue;
    closest = car;
    closestDistance = distance;
  }
  return closest;
}

function hijackBotCar(target) {
  const driver = makeNpcPedestrian(200 + hijackedDrivers.length);
  const ejectionPoint = new THREE.Vector3(2.15, 0.38, -0.15);
  target.localToWorld(ejectionPoint);
  driver.position.copy(ejectionPoint);
  driver.rotation.y = target.rotation.y;
  driver.rotation.x = -Math.PI / 2;
  driver.userData.leftArm.rotation.x = -0.72;
  driver.userData.rightArm.rotation.x = 0.66;
  driver.userData.leftLeg.rotation.x = 0.18;
  driver.userData.rightLeg.rotation.x = -0.12;
  driver.userData.fallenUntil = Infinity;
  city.add(driver);
  hijackedDrivers.push(driver);

  transferPlayerControl(target, "Car hijacked — drive!");
}

function transferPlayerControl(target, message) {
  if (state.policeMode) disablePoliceMode();
  const oldPlayer = state.player;
  const pedestrian = state.pedestrian;
  const oldData = oldPlayer.userData;
  const targetData = target.userData;

  const playerMarker = oldData.playerMarker
    || oldPlayer.children.find((child) => child.geometry?.type === "ConeGeometry" && child.position.y > 2);
  if (playerMarker) {
    oldPlayer.remove(playerMarker);
    target.add(playerMarker);
    oldData.playerMarker = null;
    targetData.playerMarker = playerMarker;
  }
  const cockpit = oldData.cockpit;
  if (cockpit) {
    oldPlayer.remove(cockpit);
    target.add(cockpit);
    cockpit.visible = false;
    oldData.cockpit = null;
    targetData.cockpit = cockpit;
  }
  if (oldData.cabin) oldData.cabin.visible = true;

  oldData.player = false;
  oldData.abandonedPlayerCar = true;
  oldData.immobilized = true;
  oldData.speed = 0;
  oldData.velocity.set(0, 0, 0);
  oldData.hazard = true;

  targetData.player = true;
  targetData.abandonedPlayerCar = false;
  targetData.speed = 0;
  targetData.maxSpeed = 30;
  targetData.steer = 0;
  targetData.velocity.set(0, 0, 0);
  targetData.angularVelocity = 0;
  targetData.revRatio = 0;
  targetData.revSmokeTimer = 0;
  targetData.driftRatio = 0;
  targetData.driftSmokeTimer = 0;
  targetData.lastSafe = target.position.clone();
  targetData.braking = false;
  targetData.hazard = false;
  targetData.immobilized = false;

  state.player = target;
  state.onFoot = false;
  state.playerCrashed = false;
  state.crashed = false;
  state.signal = "off";
  state.hazard = false;
  state.crashLook.active = false;
  state.carTransition = null;
  state.doorMotionStart = state.time - 1.19;
  if (targetData.driverDoor) targetData.driverDoor.rotation.y = -1.05;
  pedestrian.userData.velocity.set(0, 0, 0);
  pedestrian.userData.speed = 0;
  pedestrian.visible = false;
  state.carBeacon.visible = false;
  restartBtn.hidden = true;
  statusEl.textContent = message;
}

function togglePoliceMode() {
  if (state.policeInterview) return;
  if (state.onFoot || state.securityRoom || state.playerCrashed) return;
  if (state.policeMode) {
    disablePoliceMode();
    statusEl.textContent = "Police mode off";
    return;
  }
  state.policeMode = true;
  const car = state.player;
  const kit = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xf2f3f4, roughness: 0.38 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x080a0d, roughness: 0.36, metalness: 0.12 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x20252b, roughness: 0.3, metalness: 0.72 });
  const red = new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff0000, emissiveIntensity: 0.2 });
  const blue = new THREE.MeshStandardMaterial({ color: 0x2080ff, emissive: 0x0066ff, emissiveIntensity: 0.2 });
  const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.62, 1.72), white);
  const rightPanel = leftPanel.clone();
  leftPanel.position.set(1.215, 0.72, -0.05);
  rightPanel.position.set(-1.215, 0.72, -0.05);

  const hoodPanel = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.045, 1.15), white);
  hoodPanel.position.set(0, 1.035, 1.43);
  const trunkPanel = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.045, 0.72), white);
  trunkPanel.position.set(0, 1.035, -1.72);

  const roofBase = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.12, 0.46), dark);
  roofBase.position.set(0, 1.73, -0.2);
  const redLight = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.25, 0.42), red);
  const blueLight = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.25, 0.42), blue);
  redLight.position.set(0.42, 1.91, -0.2);
  blueLight.position.set(-0.42, 1.91, -0.2);

  const pushTop = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.14, 0.12), steel);
  const pushBottom = pushTop.clone();
  pushTop.position.set(0, 0.86, 2.34);
  pushBottom.position.set(0, 0.48, 2.34);
  const pushLeft = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.58, 0.12), steel);
  const pushRight = pushLeft.clone();
  pushLeft.position.set(0.7, 0.67, 2.34);
  pushRight.position.set(-0.7, 0.67, 2.34);

  const spotlightMat = new THREE.MeshStandardMaterial({ color: 0xe8f5ff, emissive: 0xc9eaff, emissiveIntensity: 1.2, metalness: 0.35 });
  const leftSpotlight = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 7), spotlightMat);
  const rightSpotlight = leftSpotlight.clone();
  leftSpotlight.position.set(0.96, 1.48, 0.43);
  rightSpotlight.position.set(-0.96, 1.48, 0.43);

  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 512;
  labelCanvas.height = 128;
  const labelContext = labelCanvas.getContext("2d");
  labelContext.fillStyle = "#f2f3f4";
  labelContext.fillRect(0, 0, 512, 128);
  labelContext.fillStyle = "#080a0d";
  labelContext.font = "900 72px Arial";
  labelContext.textAlign = "center";
  labelContext.textBaseline = "middle";
  labelContext.fillText("POLICE", 256, 67);
  const labelMaterial = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(labelCanvas), transparent: true });
  const leftLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.36), labelMaterial);
  const rightLabel = leftLabel.clone();
  leftLabel.position.set(1.257, 0.76, -0.05);
  leftLabel.rotation.y = Math.PI / 2;
  rightLabel.position.set(-1.257, 0.76, -0.05);
  rightLabel.rotation.y = -Math.PI / 2;

  kit.add(leftPanel, rightPanel, hoodPanel, trunkPanel, roofBase, redLight, blueLight,
    pushTop, pushBottom, pushLeft, pushRight, leftSpotlight, rightSpotlight, leftLabel, rightLabel);
  car.add(kit);
  car.userData.policeKit = kit;
  car.userData.policeRedLight = redLight;
  car.userData.policeBlueLight = blueLight;
  const body = car.userData.body || car.children.find((child) => child.geometry?.parameters?.width === 2.35);
  car.userData.body = body;
  car.userData.originalBodyColor = body.material.color.clone();
  car.userData.originalDoorColor = car.userData.driverDoor.material.color.clone();
  body.material.color.set(0x030405);
  body.material.roughness = 0.32;
  car.userData.driverDoor.material.color.set(0xf2f3f4);
  statusEl.textContent = "Police mode — click a bot car to initiate a stop";
}

function disablePoliceMode() {
  stopPoliceSiren();
  const car = state.player;
  if (car?.userData.policeKit) car.remove(car.userData.policeKit);
  if (car?.userData.originalBodyColor) car.userData.body.material.color.copy(car.userData.originalBodyColor);
  if (car?.userData.originalDoorColor) car.userData.driverDoor.material.color.copy(car.userData.originalDoorColor);
  if (state.policeTarget?.userData.policePullOver && !state.policeTarget.userData.policePullOver.complete) {
    state.policeTarget.userData.policePullOver = null;
    state.policeTarget.userData.hazard = false;
  }
  state.policeMode = false;
  state.policeTarget = null;
}

function selectPoliceTarget(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  policePointer.set(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );
  policeRaycaster.setFromCamera(policePointer, camera);
  const hits = policeRaycaster.intersectObjects(cars, true);
  for (const hit of hits) {
    let car = hit.object;
    while (car.parent && !cars.includes(car)) car = car.parent;
    if (!cars.includes(car) || car.userData.player || car.userData.crashed || car.userData.immobilized) continue;
    beginPoliceStop(car);
    return true;
  }
  return false;
}

function beginPoliceStop(car) {
  if (state.policeTarget?.userData.policePullOver) {
    state.policeTarget.userData.policePullOver = null;
    state.policeTarget.userData.hazard = false;
  }
  const destination = findPolicePullOverDestination(car);
  if (!destination) {
    statusEl.textContent = "No clear player-lane pull-over position";
    return;
  }
  car.userData.policePullOver = {
    acknowledgeUntil: state.time + 0.9,
    destination: destination.clone(),
    roadYaw: car.rotation.y,
    complete: false,
  };
  car.userData.hazard = true;
  state.policeTarget = car;
  startPoliceSiren();
  statusEl.textContent = "Target acknowledged — hazards on";
}

function findPolicePullOverDestination(target, roadYaw = target.rotation.y, excluded = null) {
  const direction = dirs[target.userData.dir] || getForward(target).normalize();
  const horizontal = Math.abs(direction.x) > Math.abs(direction.z);
  const fixed = nearestGrid(horizontal ? target.position.z : target.position.x);
  const laneCoordinate = horizontal ? target.position.z : target.position.x;
  const side = Math.sign(laneCoordinate - fixed) || 1;
  // Leave a complete car-width corridor between the traffic-road edge and the
  // pulled-over vehicle, plus a small steering margin for the player.
  const pullOverLaneCenter = ROAD_HALF + CAR_HALF_WIDTH * 3 + 0.65;
  const candidates = [];
  // Stay beside the target's own traffic lane and move slightly forward while
  // merging outward. Never choose a reserved lane across oncoming traffic.
  for (const forwardOffset of [8, 12, 18, 6, 24, 30]) {
    const point = target.position.clone().addScaledVector(direction, forwardOffset);
    if (horizontal) point.z = fixed + side * pullOverLaneCenter;
    else point.x = fixed + side * pullOverLaneCenter;
    point.x = THREE.MathUtils.clamp(point.x, -BOUNDS + 1.5, BOUNDS - 1.5);
    point.z = THREE.MathUtils.clamp(point.z, -BOUNDS + 1.5, BOUNDS - 1.5);
    const along = horizontal ? point.x : point.z;
    if (Math.abs(along - nearestGrid(along)) <= ROAD_HALF + 1.2) continue;
    candidates.push(point);
  }
  return candidates.find((point) =>
    (!excluded || point.distanceToSquared(excluded) > 1) &&
    isClearPolicePullOverPoint(point, target),
  );
}

function isClearPolicePullOverPoint(point, target) {
  if (!isPlayerOnlyLanePosition(point)) return false;
  // Use a full-car clearance radius, not only the destination's center point.
  // This keeps the pulled-over car's bumpers and sides clear of parked traffic.
  const clearance = CAR_HALF_LENGTH * 2 + 1.25;
  if (cars.some((car) =>
    car !== target && car.visible && !car.userData.waitingForEntry && car.position.distanceToSquared(point) < clearance * clearance,
  )) return false;
  return !buildingObstacles.some((obstacle) =>
    Math.abs(point.x - obstacle.x) < obstacle.halfX + 1.5 && Math.abs(point.z - obstacle.z) < obstacle.halfZ + 1.5,
  );
}

function updatePoliceMode(dt) {
  if (state.policeMode) {
    const flash = Math.floor(state.time * 7) % 2 === 0;
    const red = state.player.userData.policeRedLight;
    const blue = state.player.userData.policeBlueLight;
    if (red && blue) {
      red.material.emissiveIntensity = flash ? 5 : 0.18;
      blue.material.emissiveIntensity = flash ? 0.18 : 5;
    }
  }
  updatePoliceSiren();
  const car = state.policeTarget;
  const stop = car?.userData.policePullOver;
  if (!car || !stop || stop.complete) return;
  if (state.time < stop.acknowledgeUntil) {
    car.userData.speed = moveToward(car.userData.speed, Math.min(4, Math.max(0, car.userData.speed)), dt * 12);
    return;
  }
  if (!stop.aligning && !isClearPolicePullOverPoint(stop.destination, car)) {
    const replacement = findPolicePullOverDestination(car, stop.roadYaw, stop.destination);
    if (replacement) {
      stop.destination.copy(replacement);
    } else {
      car.userData.speed = 0;
      car.userData.velocity.set(0, 0, 0);
      car.userData.braking = true;
      statusEl.textContent = "Target waiting — no clear pull-over space";
      return;
    }
  }
  const finalDestination = stop.alignDestination || stop.destination;
  const delta = finalDestination.clone().sub(car.position);
  const distance = delta.length();
  if (distance <= 0.8 || stop.aligning) {
    if (!stop.alignDestination) stop.alignDestination = stop.destination.clone();
    stop.aligning = true;
    car.userData.speed = moveToward(car.userData.speed, 0, dt * 12);
    car.userData.velocity.set(0, 0, 0);
    car.userData.braking = true;
    car.position.lerp(stop.alignDestination, Math.min(1, dt * 3));
    car.rotation.y = lerpAngle(car.rotation.y, stop.roadYaw, Math.min(1, dt * 2.2));
    const angleRemaining = Math.abs(Math.atan2(
      Math.sin(stop.roadYaw - car.rotation.y),
      Math.cos(stop.roadYaw - car.rotation.y),
    ));
    if (car.position.distanceTo(stop.alignDestination) > 0.06 || angleRemaining > 0.018) {
      statusEl.textContent = "Target straightening smoothly in the player lane";
      return;
    }
    car.position.copy(stop.alignDestination);
    car.rotation.y = stop.roadYaw;
    stop.complete = true;
    revealPulledOverDriver(car);
    statusEl.textContent = "Vehicle pulled over — driver window lowered — press O to stop siren";
    return;
  }
  delta.normalize();
  car.userData.speed = moveToward(car.userData.speed, 4.8, dt * 6.5);
  const desiredYaw = Math.atan2(delta.x, delta.z);
  car.rotation.y = lerpAngle(car.rotation.y, desiredYaw, Math.min(1, dt * 1.7));
  const travelDirection = getForward(car).normalize();
  car.userData.velocity.copy(travelDirection).multiplyScalar(car.userData.speed);
  const candidate = car.position.clone().addScaledVector(car.userData.velocity, dt);
  car.userData.braking = false;
  car.position.copy(candidate);
}

function revealPulledOverDriver(car) {
  if (car.userData.visiblePoliceDriver) return;
  const skin = new THREE.MeshStandardMaterial({ color: 0xd09a76, roughness: 0.82 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x081017, roughness: 0.35, transparent: true, opacity: 0.72 });
  const openWindow = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.8), dark);
  openWindow.position.set(0.86, 1.38, -0.18);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8), skin);
  head.position.set(0.91, 1.5, -0.18);
  car.add(openWindow, head);
  car.userData.visiblePoliceDriver = head;
  car.userData.loweredWindow = openWindow;
}

function togglePoliceInterview() {
  if (state.policeInterview) {
    endPoliceInterview();
    return;
  }
  const target = state.policeTarget;
  const stop = target?.userData.policePullOver;
  if (!state.policeMode || !target || !stop?.complete) {
    if (state.policeMode) statusEl.textContent = "Wait until the selected vehicle has fully pulled over";
    return;
  }
  state.policeInterview = true;
  document.body.classList.add("police-interview");
  policeInteractionEl.hidden = false;
  state.policeConversation = {
    hasInsurance: Math.random() < 0.72,
  };
  showPoliceConversation(
    "Driver: Good afternoon, officer. What seems to be the problem?",
    [
      ["release", "You are free to go"],
      ["reason", "Do you know why I pulled you over?"],
    ],
  );
  state.player.userData.speed = 0;
  state.player.userData.velocity.set(0, 0, 0);
}

function showPoliceConversation(response, choices) {
  driverResponseEl.textContent = response;
  const actions = policeInteractionEl.querySelector(".interaction-actions");
  actions.replaceChildren(...choices.slice(0, 2).map(([action, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.policeAction = action;
    button.textContent = label;
    return button;
  }));
}

function onPoliceInteractionClick(event) {
  const button = event.target.closest("[data-police-action]");
  if (!button || !state.policeInterview) return;
  const action = button.dataset.policeAction;
  if (action === "release") {
    endPoliceInterview();
  } else if (action === "reason") {
    showPoliceConversation(
      "Driver: No, officer. I thought I was following the traffic rules.",
      [["explain", "Explain the violation"], ["documents", "License, registration, and insurance"]],
    );
  } else if (action === "explain") {
    showPoliceConversation(
      "Driver: I understand. I did not realize I was driving that fast.",
      [["documents", "Ask for documents"], ["warning", "Issue a warning"]],
    );
  } else if (action === "documents") {
    if (state.policeConversation?.hasInsurance) {
      showPoliceConversation(
        "Driver: Here are my license, registration, and valid insurance card.",
        [["speeding", "Issue $150 speeding fine"], ["warning", "Issue a warning"]],
      );
    } else {
      showPoliceConversation(
        "Driver: I have my license and registration, but I do not have insurance.",
        [["insurance", "Issue $250 no-insurance fine"], ["warning", "Issue a warning"]],
      );
    }
  } else if (action === "warning") {
    showPoliceConversation("Driver: Thank you, officer. I will be more careful.", [["release", "You are free to go"]]);
  } else if (action === "speeding") {
    showPoliceConversation("Driver: I understand the $150 speeding fine. I will slow down.", [["release", "You are free to go"]]);
  } else if (action === "insurance") {
    showPoliceConversation("Driver: I understand the $250 fine. I will arrange insurance before driving again.", [["release", "You are free to go"]]);
  }
  event.preventDefault();
  event.stopPropagation();
}

function endPoliceInterview() {
  const target = state.policeTarget;
  state.policeInterview = false;
  document.body.classList.remove("police-interview");
  policeInteractionEl.hidden = true;
  state.policeConversation = null;
  stopPoliceSiren();
  if (target) {
    const data = target.userData;
    data.policePullOver = null;
    data.policeRelease = createPoliceReleasePlan(target, 0);
    data.hazard = false;
    data.braking = false;
    data.speed = 0;
    data.velocity.set(0, 0, 0);
    if (data.visiblePoliceDriver) target.remove(data.visiblePoliceDriver);
    if (data.loweredWindow) target.remove(data.loweredWindow);
    data.visiblePoliceDriver = null;
    data.loweredWindow = null;
  }
  state.policeTarget = null;
  statusEl.textContent = "Traffic stop ended — driver returning to traffic";
  renderer.domElement.focus();
}

function startPoliceSiren() {
  stopPoliceSiren();
  const audio = ensureAudio();
  if (!audio) return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(640, audio.currentTime);
  gain.gain.setValueAtTime(0.085, audio.currentTime);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start();
  state.policeSiren = { oscillator, gain };
}

function updatePoliceSiren() {
  if (!state.policeSiren || !state.audio) return;
  const frequency = 720 + Math.sin(state.time * 5.8) * 260;
  state.policeSiren.oscillator.frequency.setTargetAtTime(frequency, state.audio.currentTime, 0.035);
}

function stopPoliceSiren() {
  if (!state.policeSiren || !state.audio) return;
  const now = state.audio.currentTime;
  state.policeSiren.gain.gain.setTargetAtTime(0.0001, now, 0.035);
  state.policeSiren.oscillator.stop(now + 0.14);
  state.policeSiren = null;
}

function updateBots(dt) {
  for (const bot of cars) {
    const data = bot.userData;
    if (data.player || data.immobilized || data.crashed) continue;
    if (data.policeRelease) {
      updateReleasedPoliceTarget(bot, dt);
      continue;
    }
    if (data.policePullOver) continue;
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

    const wasPoliceClearing = Boolean(data.policeClearing);
    const policeClearance = getPoliceTrafficClearance(bot);
    data.policeClearing = Boolean(policeClearance);
    if (policeClearance) {
      data.policeYielded = true;
      data.policeRecoveryUntil = 0;
      const previous = bot.position.clone();
      const botForward = dirs[data.dir] || getForward(bot).normalize();
      const requestedSign = policeClearance.direction.dot(botForward) >= 0 ? 1 : -1;
      const clearanceSign = wasPoliceClearing && data.policeClearanceSign
        ? data.policeClearanceSign
        : requestedSign;
      if (!wasPoliceClearing || data.policeClearanceSign !== clearanceSign) {
        data.policeClearanceSign = clearanceSign;
        data.policeClearanceSpeed = 0;
      }
      const clearanceDirection = botForward.clone().multiplyScalar(clearanceSign);
      data.braking = false;
      data.policeClearanceSpeed = moveToward(data.policeClearanceSpeed || 0, policeClearance.speed, dt * 5.5);
      data.speed = data.policeClearanceSpeed;
      data.velocity.copy(clearanceDirection).multiplyScalar(data.policeClearanceSpeed);
      const candidate = bot.position.clone().addScaledVector(data.velocity, dt);
      if (!policeClearanceMovementBlocked(bot, candidate)) bot.position.copy(candidate);
      else {
        data.speed = 0;
        data.policeClearanceSpeed = 0;
        data.velocity.set(0, 0, 0);
        data.braking = true;
      }
      resolveBuildingCollisions(bot, previous);
      continue;
    }

    const activePoliceStop = state.policeTarget?.userData.policePullOver;
    if (data.policeYielded && (!activePoliceStop || activePoliceStop.complete)) {
      if (!data.policeRecoveryUntil) {
        data.policeRecoveryUntil = state.time + 3.5;
        data.policeRecoverySpeed = 0;
        data.policeClearanceSpeed = 0;
        data.policeClearanceSign = 0;
      }
      const forward = dirs[data.dir] || getForward(bot).normalize();
      const previous = bot.position.clone();
      data.braking = false;
      data.policeRecoverySpeed = moveToward(data.policeRecoverySpeed || 0, Math.min(10, data.desiredSpeed || 10), dt * 5.5);
      data.speed = data.policeRecoverySpeed;
      data.velocity.copy(forward).multiplyScalar(data.policeRecoverySpeed);
      const candidate = bot.position.clone().addScaledVector(data.velocity, dt);
      if (!policeClearanceMovementBlocked(bot, candidate)) bot.position.copy(candidate);
      else {
        data.speed = 0;
        data.policeRecoverySpeed = 0;
        data.velocity.set(0, 0, 0);
        data.braking = true;
      }
      bot.rotation.y = lerpAngle(bot.rotation.y, Math.atan2(forward.x, forward.z), dt * 7);
      resolveBuildingCollisions(bot, previous);
      if (state.time >= data.policeRecoveryUntil && data.speed > 2) {
        data.policeYielded = false;
        data.policeRecoveryUntil = 0;
        data.policeRecoverySpeed = 0;
      }
      continue;
    }

    const frontTraffic = findNearestCarAhead(bot, 28);
    const sensitivity = state.botSensitivity;
    const pedestrianAvoidance = getPedestrianYield(bot);
    const queueAvoidance = pedestrianAvoidance ? null : getQueueReverse(bot, frontTraffic);
    const avoidance = pedestrianAvoidance || queueAvoidance || (sensitivity > 0 ? getPlayerAvoidance(bot, sensitivity, dt) : null);
    data.pedestrianBacking = Boolean(avoidance?.reverseForPedestrian);
    const intersectionBackOut = stopInfoForIntersectionBackOut(bot, frontTraffic);
    const signalStop = stopInfoForSignal(bot);
    const boxStop = signalStop || intersectionBackOut ? null : stopInfoForBlockedIntersection(bot, frontTraffic);
    const intersectionStop = intersectionBackOut || signalStop || boxStop;
    const intersectionBlocked = Boolean(intersectionStop);
    const followingSpeed = followingTargetSpeed(bot, frontTraffic);
    const approachSpeed = intersectionApproachSpeed(bot);
    const cruisingSpeed = Math.min(data.desiredSpeed, followingSpeed, approachSpeed);
    const redApproachSpeed = signalStop ? stopLineApproachSpeed(signalStop) : cruisingSpeed;
    const targetSpeed = avoidance
      ? avoidance.speed
      : intersectionBackOut
        ? 0
        : signalStop
        ? Math.min(followingSpeed, redApproachSpeed)
        : boxStop ? 0 : cruisingSpeed;
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
    const candidate = bot.position.clone().addScaledVector(data.velocity, dt);
    if (botMovementBlocked(bot, candidate)) {
      data.speed = 0;
      data.velocity.set(0, 0, 0);
      data.braking = true;
    } else {
      bot.position.copy(candidate);
    }
    if (intersectionStop && !avoidance) {
      alignWithStopLine(bot, intersectionStop, dt, previous, !frontTraffic && !boxStop);
    }
    if (avoidance) resolveBuildingCollisions(bot, previous);
    wrapBot(bot);
  }
}

function updateReleasedPoliceTarget(bot, dt) {
  const data = bot.userData;
  const release = data.policeRelease;
  if (release.phase === "reversing") {
    const reverseVelocity = getForward(bot).normalize().multiplyScalar(-3.4);
    const reverseCandidate = bot.position.clone().addScaledVector(reverseVelocity, dt);
    data.speed = -3.4;
    data.velocity.copy(reverseVelocity);
    data.braking = false;
    if (!botMovementBlocked(bot, reverseCandidate)) bot.position.copy(reverseCandidate);
    if (state.time >= release.reverseUntil) {
      const sharperPlan = createPoliceReleasePlan(bot, release.attempt + 1);
      data.policeRelease = sharperPlan;
      data.speed = 0;
      data.velocity.set(0, 0, 0);
    }
    return;
  }

  const targetPoint = release.phase === "merge" ? release.mergePoint : release.destination;
  const delta = targetPoint.clone().sub(bot.position);
  const distance = delta.length();
  if (distance <= 0.9 && release.phase === "merge") {
    release.phase = "lane";
    return;
  }
  if (distance <= 0.7) {
    bot.rotation.y = lerpAngle(bot.rotation.y, release.roadYaw, Math.min(1, dt * 3.2));
    const angleRemaining = Math.abs(Math.atan2(
      Math.sin(release.roadYaw - bot.rotation.y),
      Math.cos(release.roadYaw - bot.rotation.y),
    ));
    if (angleRemaining > 0.02) {
      data.speed = moveToward(data.speed, 2.5, dt * 5);
      data.velocity.copy(getForward(bot)).multiplyScalar(data.speed);
      return;
    }
    data.policeRelease = null;
    data.speed = 4;
    data.velocity.copy(dirs[data.dir]).multiplyScalar(data.speed);
    data.braking = false;
    return;
  }
  delta.normalize();
  const desiredYaw = Math.atan2(delta.x, delta.z);
  bot.rotation.y = lerpAngle(bot.rotation.y, desiredYaw, Math.min(1, dt * 1.45));
  data.speed = moveToward(data.speed, 5.5, dt * 5);
  const forward = getForward(bot).normalize();
  data.velocity.copy(forward).multiplyScalar(data.speed);
  const candidate = bot.position.clone().addScaledVector(data.velocity, dt);
  const blockingCar = findBotMovementBlocker(bot, candidate);
  if (!blockingCar) {
    bot.position.copy(candidate);
    data.braking = false;
    release.blockedFor = 0;
  } else {
    data.speed = 0;
    data.velocity.set(0, 0, 0);
    data.braking = true;
    const sameDirection = blockingCar.userData.dir === data.dir;
    const waitingForRed = sameDirection && (
      isWaitingAtRedLight(bot) || isWaitingAtRedLight(blockingCar)
    );
    release.blockedFor = waitingForRed ? 0 : release.blockedFor + dt;
    if (!waitingForRed && release.blockedFor > 0.45) {
      // Back straight out without changing the car's facing direction. The
      // next attempt uses a shorter, sharper path toward the proper lane.
      release.phase = "reversing";
      release.reverseUntil = state.time + 1.15;
      release.blockedFor = 0;
    }
  }
}

function createPoliceReleasePlan(bot, attempt) {
  const data = bot.userData;
  const forward = dirs[data.dir] || getForward(bot).normalize();
  const horizontal = data.dir === "east" || data.dir === "west";
  const destination = bot.position.clone().addScaledVector(forward, Math.max(10, 14 - attempt * 1.5));
  if (data.dir === "east") destination.z = nearestGrid(bot.position.z) + LANES[1];
  if (data.dir === "west") destination.z = nearestGrid(bot.position.z) + LANES[0];
  if (data.dir === "north") destination.x = nearestGrid(bot.position.x) + LANES[0];
  if (data.dir === "south") destination.x = nearestGrid(bot.position.x) + LANES[1];
  const mergePoint = bot.position.clone().addScaledVector(forward, Math.max(3.2, 5.2 - attempt * 0.5));
  const laneBias = Math.min(0.88, 0.68 + attempt * 0.08);
  if (horizontal) mergePoint.z = THREE.MathUtils.lerp(bot.position.z, destination.z, laneBias);
  else mergePoint.x = THREE.MathUtils.lerp(bot.position.x, destination.x, laneBias);
  return {
    phase: "merge",
    destination,
    mergePoint,
    roadYaw: yawForDir(data.dir),
    blockedFor: 0,
    attempt,
  };
}

function getPoliceTrafficClearance(bot) {
  const target = state.policeTarget;
  const stop = target?.userData.policePullOver;
  if (!target || !stop || stop.complete || bot === target) return null;
  const forward = new THREE.Vector3(Math.sin(stop.roadYaw), 0, Math.cos(stop.roadYaw));
  const right = new THREE.Vector3(forward.z, 0, -forward.x);
  const botForward = dirs[bot.userData.dir] || getForward(bot).normalize();
  const delta = bot.position.clone().sub(target.position);
  const along = delta.dot(forward);
  const lateral = Math.abs(delta.dot(right));
  const alignment = botForward.dot(forward);
  const route = stop.destination.clone().sub(target.position);
  const routeLengthSq = Math.max(0.001, route.lengthSq());
  const routeProgress = THREE.MathUtils.clamp(delta.dot(route) / routeLengthSq, 0, 1);
  const routeClosest = target.position.clone().addScaledVector(route, routeProgress);
  const distanceToRoute = bot.position.distanceTo(routeClosest);
  if (Math.abs(alignment) < 0.45 && distanceToRoute < 12 && delta.length() < 42) {
    return { direction: policeRouteClearingDirection(bot, botForward, target.position, stop.destination), speed: 6.5 };
  }
  if (alignment < -0.7 && along > -2 && along < 30 && lateral < 5.2) {
    return { direction: policeRouteClearingDirection(bot, botForward, target.position, stop.destination), speed: 6.5 };
  }
  if (alignment < 0.7 || lateral > 3.4) return null;
  if (along > 0 && along < 38) {
    return { direction: forward, speed: Math.max(18, bot.userData.desiredSpeed || 18) };
  }
  if (along < 0 && along > -22) {
    return { direction: forward.clone().multiplyScalar(-1), speed: 5.5 };
  }
  return null;
}

function policeRouteClearingDirection(bot, botForward, routeStart, routeEnd) {
  const forwardProbe = bot.position.clone().addScaledVector(botForward, 3);
  const reverseProbe = bot.position.clone().addScaledVector(botForward, -3);
  const score = (point) => {
    const route = routeEnd.clone().sub(routeStart);
    const lengthSq = Math.max(0.001, route.lengthSq());
    const progress = THREE.MathUtils.clamp(point.clone().sub(routeStart).dot(route) / lengthSq, 0, 1);
    const closest = routeStart.clone().addScaledVector(route, progress);
    return point.distanceToSquared(closest) + point.distanceToSquared(routeStart) * 0.18;
  };
  return score(forwardProbe) >= score(reverseProbe)
    ? botForward.clone()
    : botForward.clone().multiplyScalar(-1);
}

function policeClearanceMovementBlocked(bot, candidate) {
  const forward = getForward(bot).normalize();
  const right = new THREE.Vector3(forward.z, 0, -forward.x);
  for (let step = 1; step <= 4; step++) {
    const center = bot.position.clone().lerp(candidate, step / 4);
    const probe = {
      center,
      forward,
      right,
      halfWidth: CAR_HALF_WIDTH + 0.18,
      halfLength: CAR_HALF_LENGTH + 0.18,
    };
    for (const other of collidableCars) {
      if (other === bot || other === state.policeTarget || !other.visible || other.userData.waitingForEntry) continue;
      if (center.distanceToSquared(other.position) > 36) continue;
      const otherBox = carBox(other);
      otherBox.halfWidth += 0.18;
      otherBox.halfLength += 0.18;
      let overlaps = true;
      for (const axis of [probe.right, probe.forward, otherBox.right, otherBox.forward]) {
        const a = projectBox(probe, axis);
        const b = projectBox(otherBox, axis);
        if (Math.min(a.max, b.max) - Math.max(a.min, b.min) <= 0) {
          overlaps = false;
          break;
        }
      }
      if (overlaps) return true;
    }
    if (buildingObstacles.some((obstacle) =>
      Math.abs(center.x - obstacle.x) < obstacle.halfX + CAR_HALF_WIDTH + 0.15 &&
      Math.abs(center.z - obstacle.z) < obstacle.halfZ + CAR_HALF_WIDTH + 0.15,
    )) return true;
  }
  return false;
}

function botMovementBlocked(bot, candidate) {
  return Boolean(findBotMovementBlocker(bot, candidate));
}

function findBotMovementBlocker(bot, candidate) {
  const forward = getForward(bot).normalize();
  const right = new THREE.Vector3(forward.z, 0, -forward.x);
  const candidateBox = {
    center: candidate,
    forward,
    right,
    halfWidth: CAR_HALF_WIDTH + 0.08,
    halfLength: CAR_HALF_LENGTH + BOT_BUMPER_GAP * 0.5,
  };
  for (const other of collidableCars) {
    if (other === bot || !other.visible || other.userData.waitingForEntry) continue;
    const maxDistance = CAR_HALF_LENGTH * 2 + BOT_BUMPER_GAP + 0.8;
    if (candidate.distanceToSquared(other.position) > maxDistance * maxDistance) continue;
    const otherBox = carBox(other);
    otherBox.halfWidth += 0.08;
    otherBox.halfLength += BOT_BUMPER_GAP * 0.5;
    const axes = [candidateBox.right, candidateBox.forward, otherBox.right, otherBox.forward];
    let overlaps = true;
    for (const axis of axes) {
      const a = projectBox(candidateBox, axis);
      const b = projectBox(otherBox, axis);
      if (Math.min(a.max, b.max) - Math.max(a.min, b.min) <= 0) {
        overlaps = false;
        break;
      }
    }
    if (overlaps) return other;
  }
  return null;
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
  for (const responder of crashResponders) {
    if (responder.person?.visible) people.push(responder.person);
  }
  people.push(...hijackedDrivers);
  for (const person of people) {
    const delta = person.position.clone().sub(bot.position);
    const ahead = delta.dot(forward);
    const lateral = Math.abs(delta.dot(right));
    if (ahead >= -1.2 && ahead <= stoppingRange && lateral <= CAR_HALF_WIDTH + 1.05) {
      if (ahead <= CAR_HALF_LENGTH + 4.2) {
        if (!pedestrianReverseStaysOutOfIntersection(bot)) {
          return { direction: forward.clone(), speed: 0 };
        }
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
  if (!pedestrianReverseStaysOutOfIntersection(bot)) {
    return { direction: dirs[bot.userData.dir].clone(), speed: 0 };
  }
  return {
    direction: dirs[bot.userData.dir].clone().multiplyScalar(-1),
    speed: 2.8,
    reverseForPedestrian: true,
  };
}

function pedestrianReverseStaysOutOfIntersection(bot) {
  const reverse = dirs[bot.userData.dir].clone().multiplyScalar(-1);
  const candidate = bot.position.clone().addScaledVector(reverse, 0.45);
  const ix = nearestGrid(candidate.x);
  const iz = nearestGrid(candidate.z);
  const bodyMargin = ROAD_HALF + CAR_HALF_LENGTH + 0.2;
  return !(
    Math.abs(candidate.x - ix) < bodyMargin &&
    Math.abs(candidate.z - iz) < bodyMargin
  );
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
  // Keep control of a car that has crossed the paint so it can reverse back
  // to the stop line while the light is still red.
  const intersectionBackOutRange = ROAD_HALF * 2 + CAR_HALF_LENGTH + 0.8;
  if (ahead > STOP_DISTANCE || ahead < -intersectionBackOutRange) return null;
  const laneAligned = axis === "ew" ? Math.abs(bot.position.z - iz) < ROAD_HALF : Math.abs(bot.position.x - ix) < ROAD_HALF;
  if (!laneAligned) return null;
  const light = trafficLights.find((item) => item.x === ix && item.z === iz && item.axis === axis);
  if (!light || light.state === "green") return null;
  return { stopCenter, forward, ahead, clearingIntersection: ahead < -0.1 };
}

function stopInfoForBlockedIntersection(bot, frontTraffic) {
  if (!frontTraffic) return null;
  const data = bot.userData;
  const forward = dirs[data.dir];
  const leadForwardSpeed = Math.max(0, carVelocity(frontTraffic.car).dot(forward));
  // A moving lead car is actively clearing the box. Only hold at a green
  // light when traffic beyond the intersection is actually queued or stopped.
  if (leadForwardSpeed > 1.2) return null;
  const ix = nearestGrid(bot.position.x);
  const iz = nearestGrid(bot.position.z);
  const stopCenter = stopCenterForDirection(ix, iz, data.dir);
  const ahead = stopCenter.clone().sub(bot.position).dot(forward);
  if (ahead < -0.15 || ahead > STOP_DISTANCE) return null;
  const clearIntersectionDistance = ahead + ROAD_HALF * 2 + CAR_HALF_LENGTH * 2 + BOT_BUMPER_GAP;
  if (frontTraffic.ahead > clearIntersectionDistance) return null;
  return { stopCenter, forward, ahead };
}

function stopInfoForIntersectionBackOut(bot, frontTraffic) {
  const data = bot.userData;
  if (Math.abs(data.speed || 0) > 0.9) return null;
  const forward = dirs[data.dir];
  const ix = nearestGrid(bot.position.x);
  const iz = nearestGrid(bot.position.z);
  const insideMargin = ROAD_HALF + CAR_HALF_LENGTH;
  if (Math.abs(bot.position.x - ix) >= insideMargin || Math.abs(bot.position.z - iz) >= insideMargin) return null;

  const stoppedAhead = frontTraffic && (
    frontTraffic.gap <= BOT_BUMPER_GAP + 2.4 ||
    Math.max(0, carVelocity(frontTraffic.car).dot(forward)) < 0.8
  );
  if (!stoppedAhead && !botMovementBlocked(bot, bot.position.clone().addScaledVector(forward, 0.35))) return null;

  const stopCenter = stopCenterForDirection(ix, iz, data.dir);
  const ahead = stopCenter.clone().sub(bot.position).dot(forward);
  if (ahead >= -0.1) return null;
  return { stopCenter, forward, ahead, clearingIntersection: true };
}

function stopLineApproachSpeed(stop) {
  if (stop.ahead <= 0.12) return 0;
  // Continue toward the painted line under control instead of braking to a
  // full stop as soon as the signal enters the 13.5-unit detection range.
  return THREE.MathUtils.clamp(stop.ahead * 1.55, 1.25, 7.5);
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
    return;
  }

  if (stop.clearingIntersection) {
    // If a queue behind makes returning to the white line impossible, clear
    // the conflict box forward rather than remaining stopped in cross traffic.
    const escapeSpeed = 3.2;
    const candidate = bot.position.clone().addScaledVector(stop.forward, escapeSpeed * dt);
    if (!botMovementBlocked(bot, candidate)) {
      bot.position.copy(candidate);
      data.speed = escapeSpeed;
      data.velocity.copy(stop.forward).multiplyScalar(escapeSpeed);
      data.braking = false;
    }
  }
}

function canBackUpToStopLine(bot, stop) {
  const needed = stop.stopCenter.distanceTo(bot.position);
  const maximumReverse = stop.clearingIntersection
    ? ROAD_HALF * 2 + CAR_HALF_LENGTH + 0.8
    : ROAD_HALF + 0.5;
  if (needed > maximumReverse) return false;
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
  // Traffic yields silently to an actively responding police vehicle.
  if (state.policeMode && state.policeSiren) {
    state.greenBlockTimer = 0;
    return;
  }

  const signal = playerSignalInfo();
  const botBehind = findBotBehindPlayer(19);
  const blockingGreen = signal && signal.light.state === "green" && Math.abs(data.speed) < 0.6 && botBehind;
  state.greenBlockTimer = blockingGreen ? state.greenBlockTimer + dt : 0;
  if (state.greenBlockTimer > 1.1) {
    requestHonk(botBehind, "short");
  }

  if (signal && signal.light.state !== "green" && signal.along < -CAR_HALF_LENGTH * 0.45) {
    const conflictingBot = findConflictingIntersectionBot(signal);
    if (conflictingBot) requestHonk(conflictingBot, "severe");
  }

  const reversingTarget = findBotInReversePath(8.5);
  if (reversingTarget && !isWaitingAtRedLight(reversingTarget)) {
    requestHonk(reversingTarget, "severe");
  }

  const wrongWayWitness = findWrongWayWitness();
  if (wrongWayWitness) requestHonk(wrongWayWitness, "wrongWay");

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
  return light ? { light, dir, axis, along, ix, iz } : null;
}

function findConflictingIntersectionBot(signal) {
  const center = new THREE.Vector3(signal.ix, 0, signal.iz);
  let best = null;
  let bestArrival = Infinity;

  for (const bot of cars) {
    const data = bot.userData;
    if (data.player || data.immobilized || data.crashed || Math.abs(data.speed || 0) < 0.8) continue;
    const botAxis = data.dir === "east" || data.dir === "west" ? "ew" : "ns";
    if (botAxis === signal.axis) continue;

    const forward = dirs[data.dir];
    const toCenter = center.clone().sub(bot.position);
    const ahead = toCenter.dot(forward);
    const lateralSq = Math.max(0, toCenter.lengthSq() - ahead * ahead);
    if (lateralSq > (ROAD_HALF - 0.5) ** 2) continue;

    const insideIntersection = Math.abs(ahead) <= ROAD_HALF + CAR_HALF_LENGTH;
    const arrivingSoon = ahead > ROAD_HALF && ahead <= Math.max(13, Math.abs(data.speed) * 2.1);
    if (!insideIntersection && !arrivingSoon) continue;
    if (!insideIntersection && stopInfoForSignal(bot)) continue;

    const arrival = insideIntersection ? 0 : ahead / Math.max(0.8, Math.abs(data.speed));
    if (arrival < bestArrival) {
      best = bot;
      bestArrival = arrival;
    }
  }

  return best;
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

function findWrongWayWitness() {
  const player = state.player;
  const data = player.userData;
  if (data.speed < 2 || state.onFoot) return null;

  const nearestX = nearestGrid(player.position.x);
  const nearestZ = nearestGrid(player.position.z);
  const xOffset = player.position.x - nearestX;
  const zOffset = player.position.z - nearestZ;
  const onHorizontal = Math.abs(zOffset) < ROAD_HALF && Math.abs(xOffset) > ROAD_HALF + CAR_HALF_LENGTH;
  const onVertical = Math.abs(xOffset) < ROAD_HALF && Math.abs(zOffset) > ROAD_HALF + CAR_HALF_LENGTH;
  if (!onHorizontal && !onVertical) return null;

  let expectedDir;
  let laneOffset;
  if (onHorizontal) {
    expectedDir = zOffset > 0 ? "east" : "west";
    laneOffset = Math.abs(Math.abs(zOffset) - Math.abs(LANES[0]));
  } else {
    expectedDir = xOffset < 0 ? "north" : "south";
    laneOffset = Math.abs(Math.abs(xOffset) - Math.abs(LANES[0]));
  }
  if (laneOffset > CAR_HALF_WIDTH + 0.75) return null;
  if (getForward(player).dot(dirs[expectedDir]) > -0.35) return null;

  const expectedForward = dirs[expectedDir];
  let closest = null;
  let closestAhead = Infinity;
  for (const bot of cars) {
    const botData = bot.userData;
    if (botData.player || botData.immobilized || botData.crashed || botData.dir !== expectedDir) continue;
    const delta = player.position.clone().sub(bot.position);
    const ahead = delta.dot(expectedForward);
    if (ahead < 0.5 || ahead > 30) continue;
    const sideSq = Math.max(0, delta.lengthSq() - ahead * ahead);
    if (sideSq > 7.2) continue;
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
  const cooldown = kind === "wrongWay" ? WRONG_WAY_HONK_COOLDOWN : kind === "severe" ? SEVERE_HONK_COOLDOWN : kind === "danger" ? DANGER_HONK_COOLDOWN : kind === "angry" ? ANGRY_HONK_COOLDOWN : HONK_COOLDOWN;
  const globalCooldown = kind === "wrongWay" ? 1.2 : kind === "severe" ? 1.05 : kind === "danger" ? 0.13 : kind === "angry" ? 0.24 : 0.34;
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
      const activePoliceTarget = state.policeTarget?.userData.policePullOver?.complete === false
        ? state.policeTarget
        : null;
      if (activePoliceTarget && (a === activePoliceTarget || b === activePoliceTarget)) {
        const other = a === activePoliceTarget ? b : a;
        if (!other.userData.player) continue;
      }
      if (a.position.distanceTo(b.position) > COLLISION_BROAD_PHASE) continue;
      const hit = carCollision(a, b);
      if (!hit) continue;
      if (a.userData.immobilized || b.userData.immobilized) {
        resolveImmovableCarContact(a, b, hit);
        continue;
      }
      if (!a.userData.player && !b.userData.player) {
        if (a.userData.crashed || b.userData.crashed) {
          applyCrashImpulse(a, b, dt, hit);
          continue;
        }
        resolveBotContact(a, b, hit);
        continue;
      }
      applyCrashImpulse(a, b, dt, hit);
    }
  }
}

function resolveImmovableCarContact(a, b, hit) {
  const fixed = a.userData.immobilized ? a : b;
  const moving = fixed === a ? b : a;
  const impactSpeed = carVelocity(moving).sub(carVelocity(fixed)).length();
  if (impactSpeed > 0.7) playCrashSound(THREE.MathUtils.clamp(impactSpeed / 18, 0.18, 0.82));

  const separation = hit.depth + 0.1;
  if (fixed === a) moving.position.addScaledVector(hit.normal, -separation);
  else moving.position.addScaledVector(hit.normal, separation);

  fixed.userData.speed = 0;
  fixed.userData.velocity.set(0, 0, 0);
  fixed.userData.angularVelocity = 0;
  fixed.userData.braking = true;
  moving.userData.speed = 0;
  moving.userData.velocity.set(0, 0, 0);
  moving.userData.braking = true;
}

function resolveBotContact(a, b, hit) {
  const impactSpeed = carVelocity(a).sub(carVelocity(b)).length();
  if (impactSpeed > 0.7) playCrashSound(THREE.MathUtils.clamp(impactSpeed / 18, 0.18, 0.78));
  const normal = hit.normal.clone();
  const correction = hit.depth * 0.5 + 0.08;
  a.position.addScaledVector(normal, correction);
  b.position.addScaledVector(normal, -correction);

  const sameDirection = a.userData.dir === b.userData.dir;
  if (sameDirection) {
    const forward = dirs[a.userData.dir];
    const aAhead = b.position.clone().sub(a.position).dot(forward) > 0;
    const trailing = aAhead ? a : b;
    const leading = aAhead ? b : a;
    trailing.userData.speed = Math.min(trailing.userData.speed, Math.max(0, leading.userData.speed - 0.8));
    trailing.userData.velocity.set(0, 0, 0);
    trailing.userData.braking = true;
  } else {
    a.userData.speed = 0;
    b.userData.speed = 0;
    a.userData.velocity.set(0, 0, 0);
    b.userData.velocity.set(0, 0, 0);
    a.userData.braking = true;
    b.userData.braking = true;
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
    const player = a.userData.player ? a : b;
    const playerImpulse = (player === a ? impulse.clone().add(scrape) : impulse.clone().add(scrape).multiplyScalar(-1));
    const localImpulse = playerImpulse.applyQuaternion(player.quaternion.clone().invert());
    const impactStrength = THREE.MathUtils.clamp((closingSpeed + relativeVelocity.length() * 0.35) / 24, 0.12, 1);
    player.userData.cockpitImpact = {
      direction: localImpulse.lengthSq() > 0.001 ? localImpulse.normalize() : new THREE.Vector3(0, 0, -1),
      strength: impactStrength,
      spin: player === a ? spin : -spin,
      startedAt: state.time,
    };
    state.playerCrashed = true;
    ensureCrashMeeting(a, b);
    registerCrashResponder(a.userData.player ? b : a);
    restartBtn.hidden = false;
    statusEl.textContent = "Crash - drag to spin";
  } else if (state.playerCrashed && (a.userData.crashed || b.userData.crashed)) {
    registerCrashResponder(a);
    registerCrashResponder(b);
  }
}

function ensureCrashMeeting(a, b) {
  if (state.crashMeeting) return;
  const arrow = new THREE.Group();
  const arrowMat = new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0xff8c00, emissiveIntensity: 0.85 });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.72, 1.45, 12), arrowMat);
  cone.rotation.z = Math.PI;
  cone.position.y = 3.4;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.25, 0.12, 8, 28),
    new THREE.MeshStandardMaterial({ color: 0xffe58a, emissive: 0xffb000, emissiveIntensity: 0.65 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.16;
  arrow.add(cone, ring);
  city.add(arrow);
  state.crashMeeting = { point: a.position.clone().add(b.position).multiplyScalar(0.5), arrow, cars: new Set() };
  updateCrashMeetingPoint();
}

function registerCrashResponder(car) {
  if (!state.crashMeeting || !car || car.userData.player || state.crashMeeting.cars.has(car)) return;
  state.crashMeeting.cars.add(car);
  crashResponders.push({
    car,
    person: null,
    exitAt: state.time + 1.1 + crashResponders.length * 0.14,
    slot: crashResponders.length,
  });
  updateCrashMeetingPoint();
}

function updateCrashMeetingPoint() {
  const meeting = state.crashMeeting;
  if (!meeting) return;
  const involved = [state.player, ...meeting.cars];
  const center = involved.reduce((sum, car) => sum.add(car.position), new THREE.Vector3()).multiplyScalar(1 / involved.length);
  const candidates = playerLaneMeetingCandidates(center);
  meeting.point.copy(candidates.find(isClearCrashMeetingPoint) || candidates[0]);
  meeting.point.y = 0;
  meeting.arrow.position.copy(meeting.point);
}

function playerLaneMeetingCandidates(center) {
  const candidates = [];
  const samples = [0, 4, -4, 8, -8, 12, -12, 18, -18, 26, -26];
  const clampRoad = (value) => THREE.MathUtils.clamp(value, -BOUNDS + 1.5, BOUNDS - 1.5);
  for (const fixed of GRID) {
    for (const side of [-1, 1]) {
      for (const offset of samples) {
        const horizontal = new THREE.Vector3(clampRoad(center.x + offset), 0, fixed + side * PLAYER_LANE_OFFSET);
        const vertical = new THREE.Vector3(fixed + side * PLAYER_LANE_OFFSET, 0, clampRoad(center.z + offset));
        if (Math.abs(horizontal.x - nearestGrid(horizontal.x)) > ROAD_HALF + 1.2) candidates.push(horizontal);
        if (Math.abs(vertical.z - nearestGrid(vertical.z)) > ROAD_HALF + 1.2) candidates.push(vertical);
      }
    }
  }
  return candidates
    .filter((point) => isPlayerOnlyLanePosition(point))
    .sort((left, right) => left.distanceToSquared(center) - right.distanceToSquared(center));
}

function isClearCrashMeetingPoint(point) {
  if (cars.some((car) => car.position.distanceToSquared(point) < 12.25)) return false;
  return !buildingObstacles.some((obstacle) =>
    Math.abs(point.x - obstacle.x) < obstacle.halfX + 1.2 && Math.abs(point.z - obstacle.z) < obstacle.halfZ + 1.2,
  );
}

function updateCrashMeeting(dt) {
  const meeting = state.crashMeeting;
  if (!meeting) return;
  if ([...meeting.cars].some((car) => !car.userData.immobilized)) updateCrashMeetingPoint();
  meeting.arrow.position.y = 0.18 + Math.sin(state.time * 2.6) * 0.12;
  meeting.arrow.rotation.y += dt * 0.75;

  for (const responder of crashResponders) {
    const car = responder.car;
    const door = car.userData.driverDoor;
    const readyToExit = state.time >= responder.exitAt && (car.userData.immobilized || car.userData.speed < 1.4 || state.time >= responder.exitAt + 2.4);
    if (door) {
      const doorTarget = responder.person ? 0 : readyToExit || state.time >= responder.exitAt - 0.55 ? -1.05 : 0;
      door.rotation.y = moveToward(door.rotation.y, doorTarget, dt * (doorTarget ? 3 : 2.1));
    }
    if (!responder.person && readyToExit && (!door || door.rotation.y < -0.82)) spawnCrashResponder(responder);
    if (!responder.person) continue;
    const squeezing = cars.some((nearbyCar) => nearbyCar.position.distanceToSquared(responder.person.position) < 10.5);
    responder.person.scale.x = moveToward(responder.person.scale.x, squeezing ? 0.72 : 1, dt * 3.5);

    const angle = (responder.slot / Math.max(1, crashResponders.length)) * Math.PI * 2;
    const target = meeting.point.clone().add(new THREE.Vector3(Math.cos(angle) * 1.45, 0, Math.sin(angle) * 1.45));
    const forcingDirect = state.time < (responder.forceDirectUntil || 0);
    const routeStale = !responder.plannedTarget || responder.plannedTarget.distanceToSquared(target) > 1.2;
    const waypointBlocked = responder.route?.[responder.routeIndex] && isCrashRoutePointBlocked(responder.route[responder.routeIndex], responder.car);
    if (!forcingDirect && (!responder.route || routeStale || waypointBlocked || state.time >= responder.replanAt)) {
      responder.route = planCrashWalkingRoute(responder.person.position, target, responder.car);
      responder.routeIndex = 0;
      responder.plannedTarget = target.clone();
      responder.replanAt = state.time + 1.25;
    }
    while (!forcingDirect && responder.routeIndex < responder.route.length - 1 && responder.person.position.distanceTo(responder.route[responder.routeIndex]) < 0.28) {
      responder.routeIndex += 1;
    }
    const hasSafeRoute = !forcingDirect && responder.route.length > 0;
    const waypoint = hasSafeRoute ? responder.route[responder.routeIndex] : target;
    const delta = waypoint.clone().sub(responder.person.position);
    const distance = delta.length();
    if (distance < 0.12 && responder.person.position.distanceTo(target) < 0.3) {
      setNpcWalkingPose(responder.person.userData, 0);
      continue;
    }
    const step = Math.min(distance, dt * 2.15);
    delta.normalize();
    const next = responder.person.position.clone().addScaledVector(delta, step);
    if (hasSafeRoute && isCrashRoutePointBlocked(next, responder.car)) {
      responder.route = null;
      responder.replanAt = 0;
      responder.blockedSince ??= state.time;
      if (state.time - responder.blockedSince < 0.32) continue;
      responder.forceDirectUntil = state.time + 2.8;
    }
    responder.person.position.copy(next);
    responder.blockedSince = null;
    responder.person.rotation.y = Math.atan2(delta.x, delta.z);
    responder.person.userData.gait += dt * 7;
    setNpcWalkingPose(responder.person.userData, Math.sin(responder.person.userData.gait) * 0.58);
  }
}

function spawnCrashResponder(responder) {
  const person = makeNpcPedestrian(100 + responder.slot);
  const exitPoint = new THREE.Vector3(2.3, 0, -0.35);
  responder.car.localToWorld(exitPoint);
  person.position.copy(exitPoint);
  person.rotation.y = responder.car.rotation.y;
  city.add(person);
  responder.person = person;
  responder.route = null;
  responder.routeIndex = 0;
  responder.plannedTarget = null;
  responder.replanAt = 0;
  responder.blockedSince = null;
  responder.forceDirectUntil = 0;
}

function planCrashWalkingRoute(start, target, ownCar, padding = 6) {
  if (segmentClearForCrashDriver(start, target, ownCar)) return [target.clone()];
  const minX = Math.min(start.x, target.x) - padding;
  const maxX = Math.max(start.x, target.x) + padding;
  const minZ = Math.min(start.z, target.z) - padding;
  const maxZ = Math.max(start.z, target.z) + padding;
  const span = Math.max(maxX - minX, maxZ - minZ);
  const gridStep = Math.max(0.46, span / 72);
  const cols = Math.ceil((maxX - minX) / gridStep) + 1;
  const rows = Math.ceil((maxZ - minZ) / gridStep) + 1;
  const toKey = (x, z) => `${x},${z}`;
  const toPoint = (x, z) => new THREE.Vector3(minX + x * gridStep, 0, minZ + z * gridStep);
  const startCell = {
    x: THREE.MathUtils.clamp(Math.round((start.x - minX) / gridStep), 0, cols - 1),
    z: THREE.MathUtils.clamp(Math.round((start.z - minZ) / gridStep), 0, rows - 1),
  };
  const goalCell = {
    x: THREE.MathUtils.clamp(Math.round((target.x - minX) / gridStep), 0, cols - 1),
    z: THREE.MathUtils.clamp(Math.round((target.z - minZ) / gridStep), 0, rows - 1),
  };
  const startKey = toKey(startCell.x, startCell.z);
  const goalKey = toKey(goalCell.x, goalCell.z);
  const open = [{ ...startCell, g: 0, f: 0 }];
  const costs = new Map([[startKey, 0]]);
  const parents = new Map();
  const closed = new Set();
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

  while (open.length) {
    const current = popCrashRouteNode(open);
    const currentKey = toKey(current.x, current.z);
    if (closed.has(currentKey)) continue;
    if (currentKey === goalKey) {
      const cells = [];
      let key = goalKey;
      while (key && key !== startKey) {
        const [x, z] = key.split(",").map(Number);
        cells.push(toPoint(x, z));
        key = parents.get(key);
      }
      cells.reverse();
      cells.push(target.clone());
      return simplifyCrashRoute(start, cells, ownCar);
    }
    closed.add(currentKey);

    for (const [dx, dz] of directions) {
      const x = current.x + dx;
      const z = current.z + dz;
      if (x < 0 || z < 0 || x >= cols || z >= rows) continue;
      const key = toKey(x, z);
      if (closed.has(key)) continue;
      const point = toPoint(x, z);
      if (key !== goalKey && isCrashRoutePointBlocked(point, ownCar)) continue;
      if (dx && dz) {
        if (isCrashRoutePointBlocked(toPoint(current.x + dx, current.z), ownCar)) continue;
        if (isCrashRoutePointBlocked(toPoint(current.x, current.z + dz), ownCar)) continue;
      }
      const nextCost = current.g + (dx && dz ? 1.414 : 1);
      if (nextCost >= (costs.get(key) ?? Infinity)) continue;
      costs.set(key, nextCost);
      parents.set(key, currentKey);
      const heuristic = Math.hypot(goalCell.x - x, goalCell.z - z);
      pushCrashRouteNode(open, { x, z, g: nextCost, f: nextCost + heuristic });
    }
  }
  if (padding < 18) return planCrashWalkingRoute(start, target, ownCar, padding + 6);
  return [];
}

function pushCrashRouteNode(heap, node) {
  heap.push(node);
  let index = heap.length - 1;
  while (index > 0) {
    const parent = Math.floor((index - 1) / 2);
    if (heap[parent].f <= node.f) break;
    heap[index] = heap[parent];
    index = parent;
  }
  heap[index] = node;
}

function popCrashRouteNode(heap) {
  const first = heap[0];
  const last = heap.pop();
  if (!heap.length) return first;
  let index = 0;
  while (true) {
    const left = index * 2 + 1;
    const right = left + 1;
    if (left >= heap.length) break;
    const child = right < heap.length && heap[right].f < heap[left].f ? right : left;
    if (heap[child].f >= last.f) break;
    heap[index] = heap[child];
    index = child;
  }
  heap[index] = last;
  return first;
}

function simplifyCrashRoute(start, route, ownCar) {
  const simplified = [];
  let anchor = start;
  let index = 0;
  while (index < route.length) {
    let farthest = index;
    for (let candidate = index; candidate < route.length; candidate++) {
      if (!segmentClearForCrashDriver(anchor, route[candidate], ownCar)) break;
      farthest = candidate;
    }
    simplified.push(route[farthest]);
    anchor = route[farthest];
    index = farthest + 1;
  }
  return simplified;
}

function segmentClearForCrashDriver(start, end, ownCar) {
  const distance = start.distanceTo(end);
  const samples = Math.max(1, Math.ceil(distance / 0.45));
  for (let i = 1; i <= samples; i++) {
    const point = start.clone().lerp(end, i / samples);
    if (isCrashRoutePointBlocked(point, ownCar)) return false;
  }
  return true;
}

function isCrashRoutePointBlocked(point, ownCar) {
  for (const car of cars) {
    if (!car.visible || car.userData.waitingForEntry) continue;
    const dx = point.x - car.position.x;
    const dz = point.z - car.position.z;
    if (Math.abs(dx) > 4 || Math.abs(dz) > 4) continue;
    const sin = Math.sin(car.rotation.y);
    const cos = Math.cos(car.rotation.y);
    const side = dx * cos - dz * sin;
    const along = dx * sin + dz * cos;
    if (Math.abs(side) < CAR_HALF_WIDTH + 0.12 && Math.abs(along) < CAR_HALF_LENGTH - 0.12) return true;
  }
  return buildingObstacles.some((obstacle) =>
    Math.abs(point.x - obstacle.x) < obstacle.halfX + 0.25 && Math.abs(point.z - obstacle.z) < obstacle.halfZ + 0.25,
  );
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
  if (state.policeInterview && state.policeTarget) {
    const target = state.policeTarget;
    const closePosition = target.localToWorld(new THREE.Vector3(4.2, 2.15, -0.15));
    const windowPosition = target.localToWorld(new THREE.Vector3(0.95, 1.48, -0.18));
    camera.position.lerp(closePosition, 1 - Math.pow(0.0005, dt));
    camera.lookAt(windowPosition);
    return;
  }
  if (state.onFoot && state.pedestrian) {
    const person = state.pedestrian;
    const walkForward = new THREE.Vector3(Math.sin(person.rotation.y), 0, Math.cos(person.rotation.y));
    const target = person.position.clone().addScaledVector(walkForward, -15).add(new THREE.Vector3(0, 11, 0));
    camera.position.lerp(target, 1 - Math.pow(0.001, dt));
    camera.lookAt(person.position.clone().addScaledVector(walkForward, 8).add(new THREE.Vector3(0, 2.2, 0)));
    return;
  }
  if (state.cameraView > 0) {
    const hoodView = state.cameraView === 1;
    const cameraLocal = hoodView
      ? new THREE.Vector3(0, 1.72, 1.15)
      : new THREE.Vector3(0.34, 1.7, -0.62);
    const cockpitImpact = !hoodView ? getCockpitImpactMotion(car) : null;
    if (cockpitImpact) cameraLocal.add(cockpitImpact.position);
    const lookLocal = hoodView
      ? new THREE.Vector3(0, 1.35, 32)
      : new THREE.Vector3(
          0.34 + Math.sin(state.cockpitLook.yaw) * 28,
          1.48 - Math.sin(state.cockpitLook.pitch) * 28,
          Math.cos(state.cockpitLook.yaw) * 28,
        );
    if (cockpitImpact) lookLocal.add(cockpitImpact.look);
    const target = car.localToWorld(cameraLocal);
    const look = car.localToWorld(lookLocal);
    // Close cameras must stay rigidly mounted. World-space smoothing makes them
    // lag through the car body when the player accelerates.
    camera.position.copy(target);
    camera.lookAt(look);
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

function getCockpitImpactMotion(car) {
  const impact = car.userData.cockpitImpact;
  if (!impact) return null;
  const age = Math.max(0, state.time - impact.startedAt);
  if (age > 1.65) {
    car.userData.cockpitImpact = null;
    return null;
  }
  const direction = impact.direction;
  const initialKick = Math.exp(-age * 16);
  const suspensionDecay = Math.exp(-age * 4.4);
  const suspensionBounce = Math.sin(age * 23) * suspensionDecay;
  const spinWobble = Math.sin(age * 16 + 0.55) * suspensionDecay * THREE.MathUtils.clamp(impact.spin / 2.8, -1, 1);
  const strength = impact.strength;
  return {
    position: new THREE.Vector3(
      direction.x * strength * (initialKick * 0.2 + suspensionBounce * 0.085) + spinWobble * 0.045,
      strength * Math.sin(age * 28) * suspensionDecay * 0.055,
      direction.z * strength * (initialKick * 0.14 + suspensionBounce * 0.06),
    ),
    look: new THREE.Vector3(
      direction.x * strength * (initialKick * 2.8 + suspensionBounce * 1.35) + spinWobble * 2.4,
      -direction.z * strength * (initialKick * 0.8 + suspensionBounce * 0.5),
      0,
    ),
  };
}

function updateHud() {
  document.body.classList.toggle("security-view", state.securityRoom);
  const speed = Math.round(Math.abs(state.player.userData.speed) * 2.237);
  const dashboardVisible = state.cameraView === 2 && !state.onFoot && !state.securityRoom && !state.policeInterview;
  const playerData = state.player.userData;
  if (playerData.cockpit) playerData.cockpit.visible = dashboardVisible;
  if (playerData.cabin) playerData.cabin.visible = !dashboardVisible;
  if (playerData.playerMarker) playerData.playerMarker.visible = !dashboardVisible;
  if (playerData.policeKit) playerData.policeKit.visible = !dashboardVisible;
  if (dashboardVisible) {
    const data = state.player.userData;
    const speedRatio = THREE.MathUtils.clamp(Math.abs(data.speed || 0) / 36, 0, 1);
    const rpmRatio = Math.max(speedRatio, data.revRatio || 0);
    const rpm = Math.round((900 + rpmRatio * 6200) / 50) * 50;
    const blinkOn = Math.sin((data.blink || 0) * Math.PI) > 0;
    const hazardsOn = state.hazard || data.hazard;
    updateCockpitDisplay(speed, rpm, blinkOn && (hazardsOn || state.signal === "left"), blinkOn && (hazardsOn || state.signal === "right"));
  }
  speedEl.textContent = `${speed} mph`;
  if (state.hazard || state.player.userData.hazard) signalEl.textContent = "Hazards";
  else if (state.signal === "left") signalEl.textContent = "Left indicator";
  else if (state.signal === "right") signalEl.textContent = "Right indicator";
  else signalEl.textContent = "Signals off";
  leftSignalBtn.classList.toggle("active", !state.hazard && state.signal === "left");
  rightSignalBtn.classList.toggle("active", !state.hazard && state.signal === "right");
  hazardsBtn.classList.toggle("active", state.hazard || state.player.userData.hazard);
  if (state.securityRoom) {
    statusEl.textContent = state.securitySelected === null
      ? `ALL ${securityCameras.length} SECURITY FEEDS — click one to enlarge — C to exit`
      : `CAMERA ${state.securitySelected + 1} HIGHLIGHTED — Esc to view all — C to exit`;
  } else if (state.onFoot) {
    const distance = state.pedestrian.position.distanceTo(state.player.position);
    statusEl.textContent = state.player.userData.crashed || state.player.userData.immobilized
      ? "Wrecked car — continue on foot or restart"
      : distance <= 3.3 ? "Press C to get back in" : "On foot — follow the blue beacon to your car";
  } else if (state.policeMode) {
    const stop = state.policeTarget?.userData.policePullOver;
    statusEl.textContent = !stop
      ? "POLICE MODE — click a bot car to initiate a stop"
      : stop.complete
        ? state.policeSiren
          ? "Vehicle pulled over — press 1 to speak with driver — O stops siren"
          : "Vehicle pulled over — press 1 to speak with driver"
        : state.time < stop.acknowledgeUntil
          ? "Target acknowledged — hazards on"
          : "Target pulling over to player lane";
  } else if (!state.playerCrashed) {
    statusEl.textContent = state.crashed ? "Crash in city" : "City clear";
  }
}

function updateCockpitDisplay(speed, rpm, leftActive = false, rightActive = false) {
  const cockpit = state.player?.userData?.cockpit;
  if (!cockpit) return;
  const canvas = cockpit.userData.displayCanvas;
  const context = canvas.getContext("2d");
  context.fillStyle = "#05090b";
  context.fillRect(0, 0, canvas.width, canvas.height);
  if (state.policeMode) {
    context.fillStyle = "#e32636";
    context.fillRect(0, 0, canvas.width / 2, 18);
    context.fillStyle = "#247cff";
    context.fillRect(canvas.width / 2, 0, canvas.width / 2, 18);
    context.fillStyle = "#eaf5ff";
    context.font = "bold 22px system-ui";
    context.textAlign = "center";
    context.fillText("POLICE PATROL", 256, 46);
    context.textAlign = "start";
  }
  context.fillStyle = leftActive ? "#ffb000" : "#36444a";
  context.font = "bold 54px system-ui";
  context.fillText("◀", 28, state.policeMode ? 104 : 86);
  context.fillStyle = rightActive ? "#ffb000" : "#36444a";
  context.fillText("▶", 420, state.policeMode ? 104 : 86);
  context.fillStyle = "#f4fbff";
  context.font = "bold 104px system-ui";
  context.textAlign = "center";
  context.fillText(String(speed), 256, 122);
  context.fillStyle = "#8faab5";
  context.font = "bold 27px system-ui";
  context.fillText("MPH", 256, 158);
  context.fillStyle = "#65d6ff";
  context.font = "bold 30px system-ui";
  context.fillText(`${rpm} RPM`, 256, 218);
  context.textAlign = "start";
  cockpit.userData.displayTexture.needsUpdate = true;
}

function onKeyDown(event) {
  const key = normalizeKey(event);
  if (!key) return;
  ensureAudio();
  keys.add(key);
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "space", "q", "e", "z", "c", "d", "h", "p", "o", "1"].includes(key)) {
    event.preventDefault();
    event.stopPropagation();
  }
  if (event.repeat && ["q", "e", "z", "c", "d", "h", "p", "o", "1"].includes(key)) return;
  if (key === "escape" && state.securityRoom) {
    state.securitySelected = null;
    event.preventDefault();
    return;
  }
  if (state.toggleHeld.has(key)) return;
  if (key === "q") toggleSignal("left");
  if (key === "e") toggleSignal("right");
  if (key === "z") toggleHazards();
  if (key === "c") toggleCarExit();
  if (key === "d" && !state.introActive && !state.onFoot && !state.securityRoom && !state.policeInterview) {
    state.cameraView = (state.cameraView + 1) % 3;
    state.cockpitLook.yaw = 0;
    state.cockpitLook.pitch = 0;
    const viewName = ["Normal view", "Hood view", "Dashboard view"][state.cameraView];
    statusEl.textContent = `${viewName} — D changes view`;
  }
  if (key === "h" && !state.onFoot && !state.securityRoom) startPlayerHorn();
  if (key === "p") togglePoliceMode();
  if (key === "1") togglePoliceInterview();
  if (key === "o" && state.policeSiren) {
    stopPoliceSiren();
    statusEl.textContent = "Police siren off";
  }
  if (["q", "e", "z", "c", "d", "h", "p", "o", "1"].includes(key)) state.toggleHeld.add(key);
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
  if (key === "h") stopPlayerHorn();
  keys.delete(key);
  state.toggleHeld.delete(key);
}

function onPointerDown(event) {
  renderer.domElement.focus();
  ensureAudio();
  if (state.policeInterview) {
    event.preventDefault();
    return;
  }
  if (state.securityRoom) {
    const rect = renderer.domElement.getBoundingClientRect();
    const column = THREE.MathUtils.clamp(Math.floor(((event.clientX - rect.left) / rect.width) * 5), 0, 4);
    const row = THREE.MathUtils.clamp(Math.floor(((event.clientY - rect.top) / rect.height) * 5), 0, 4);
    state.securitySelected = row * 5 + column;
    event.preventDefault();
    return;
  }
  if (state.policeMode && !state.onFoot && selectPoliceTarget(event)) {
    event.preventDefault();
    return;
  }
  if (!state.playerCrashed || state.onFoot) return;
  state.crashLook.active = true;
  state.crashLook.lastX = event.clientX;
  state.crashLook.lastY = event.clientY;
  renderer.domElement.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function onPointerMove(event) {
  if (state.cameraView === 2 && !state.onFoot && !state.securityRoom && !state.policeInterview) {
    const rect = renderer.domElement.getBoundingClientRect();
    const x = THREE.MathUtils.clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    const y = THREE.MathUtils.clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
    state.cockpitLook.yaw = -x * 1.42;
    state.cockpitLook.pitch = y * 0.34;
    return;
  }
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
    KeyD: "d",
    KeyH: "h",
    KeyP: "p",
    KeyO: "o",
    Digit1: "1",
    Numpad1: "1",
    Space: "space",
    Escape: "escape",
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

  const wrongWay = kind === "wrongWay";
  const severe = kind === "severe" || wrongWay;
  const angry = kind === "angry" || kind === "danger" || severe;
  const danger = kind === "danger";
  const now = audio.currentTime;
  const bursts = danger ? 3 : 1;
  const burstGap = 0.16;
  const duration = wrongWay ? 1.5 : severe ? 1.35 : danger ? 0.11 : angry ? 0.42 : 0.22;
  const baseGain = severe ? 0.23 : danger ? 0.18 : angry ? 0.22 : 0.15;

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
    if (angry && !severe) {
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

function startPlayerHorn() {
  if (state.playerHorn) return;
  const audio = ensureAudio();
  if (!audio) return;
  if (audio.state === "suspended") audio.resume();
  const now = audio.currentTime;
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();
  const lowHorn = audio.createOscillator();
  const highHorn = audio.createOscillator();
  const growl = audio.createOscillator();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(620, now);
  filter.Q.setValueAtTime(1.15, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.15, now + 0.018);
  lowHorn.type = "sawtooth";
  highHorn.type = "sawtooth";
  growl.type = "triangle";
  lowHorn.frequency.setValueAtTime(349.23, now);
  highHorn.frequency.setValueAtTime(440, now);
  growl.frequency.setValueAtTime(174.61, now);
  lowHorn.connect(filter);
  highHorn.connect(filter);
  growl.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  lowHorn.start(now);
  highHorn.start(now);
  growl.start(now);
  state.playerHorn = { gain, lowHorn, highHorn, growl };
}

function stopPlayerHorn() {
  const horn = state.playerHorn;
  if (!horn || !state.audio) return;
  const now = state.audio.currentTime;
  horn.gain.gain.cancelScheduledValues(now);
  horn.gain.gain.setValueAtTime(Math.max(0.0001, horn.gain.gain.value), now);
  horn.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
  horn.lowHorn.stop(now + 0.08);
  horn.highHorn.stop(now + 0.08);
  horn.growl.stop(now + 0.08);
  state.playerHorn = null;
}

function restartCity() {
  stopPoliceSiren();
  state.policeMode = false;
  state.policeTarget = null;
  state.policeSiren = null;
  state.policeInterview = false;
  state.policeConversation = null;
  document.body.classList.remove("police-interview");
  policeInteractionEl.hidden = true;
  if (state.pedestrian) city.remove(state.pedestrian);
  if (state.carBeacon) city.remove(state.carBeacon);
  if (state.crashMeeting?.arrow) city.remove(state.crashMeeting.arrow);
  for (const responder of crashResponders) {
    if (responder.person) city.remove(responder.person);
  }
  for (const driver of hijackedDrivers) city.remove(driver);
  hijackedDrivers.length = 0;
  crashResponders.length = 0;
  state.crashMeeting = null;
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
  state.securityRoom = false;
  state.securitySelected = null;
  state.securityFeedCursor = 0;
  state.cameraView = 0;
  state.cockpitLook.yaw = 0;
  state.cockpitLook.pitch = 0;
  state.greenBlockTimer = 0;
  state.doorMotionStart = -10;
  state.carTransition = null;
  state.crashLook.active = false;
  state.crashLook.yaw = 0;
  state.crashLook.pitch = 0;
  for (const person of npcPedestrians) {
    person.userData.fallenUntil = 0;
    person.userData.fallStart = -1;
    person.rotation.x = 0;
    person.rotation.z = 0;
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
