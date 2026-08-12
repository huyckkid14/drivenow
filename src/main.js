import * as THREE from "three";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bc8e8);
scene.fog = new THREE.Fog(0x9bc8e8, 105, 255);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 600);
const leftMirrorCamera = new THREE.PerspectiveCamera(52, 2.05, 0.1, 240);
const rightMirrorCamera = new THREE.PerspectiveCamera(52, 2.05, 0.1, 240);
const rearviewCamera = new THREE.PerspectiveCamera(48, 3.1, 0.1, 240);
const backupCamera = new THREE.PerspectiveCamera(62, 2, 0.1, 120);
const leftMirrorTarget = new THREE.WebGLRenderTarget(256, 128);
const rightMirrorTarget = new THREE.WebGLRenderTarget(256, 128);
const rearviewTarget = new THREE.WebGLRenderTarget(320, 104);
const backupCameraTarget = new THREE.WebGLRenderTarget(512, 256);
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
const aimVignetteEl = document.querySelector("#aimVignette");
const pistolCrosshairEl = document.querySelector("#pistolCrosshair");
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
const settingsButtonEl = document.querySelector("#settingsButton");
const settingsOverlayEl = document.querySelector("#settingsOverlay");
const closeSettingsEl = document.querySelector("#closeSettings");
const resumeGameEl = document.querySelector("#resumeGame");
const qualitySettingEl = document.querySelector("#qualitySetting");
const fpsReadingEl = document.querySelector("#fpsReading");
const gameClockEl = document.querySelector("#gameClock");

const clock = new THREE.Clock();
const keys = new Set();
const cars = [];
const trafficLights = [];
const roadSegments = [];
const collidableCars = [];
const damagePieces = [];
const weaponEffects = [];
const grenades = [];
const rockets = [];
const solarFireballs = [];
const solarFires = [];
const solarImpactEmbers = [];
const solarScorches = [];
const solarFlameTextures = [];
const exhaustSmoke = [];
const npcPedestrians = [];
const crashResponders = [];
const hijackedDrivers = [];
const securityCameras = [];
const streetLights = [];
const streetLightPool = [];
const botHeadlightPool = [];
const buildingObstacles = [];
const botSpawnCandidates = [];
const botEntryCandidates = [];
const buildings = new THREE.Group();
const roads = new THREE.Group();
const city = new THREE.Group();
const botColors = [0x3d78ff, 0xf25f5c, 0x70c1b3, 0xf7b267, 0xb388eb, 0x64b96a, 0xef476f];
const DAY_DURATION = 120;
const NIGHT_DURATION = 180;
const SKY_CYCLE_DURATION = DAY_DURATION + NIGHT_DURATION;
const DAY_SKY = new THREE.Color(0x9bc8e8);
const SUNSET_SKY = new THREE.Color(0xf08b62);
const NIGHT_SKY = new THREE.Color(0x030817);
let hemisphereLight;
let sunLight;
let moonLight;
let sunDisk;
let moonDisk;
let starField;
let streetLightBulbMaterial;

const ROAD_HALF = 7.2;
const TRAFFIC_LANE_MAGNITUDES = [1.75, 5.25];
const PLAYER_LANE_WIDTH = 12.5;
// Keep the wide player-only shoulder completely beyond both ordinary lanes.
const PLAYER_LANE_OFFSET = ROAD_HALF + PLAYER_LANE_WIDTH / 2 + 0.35;
const GRID = [-108, -54, 0, 54, 108];
const BOUNDS = 128;
const PLAYER_BOUNDS = 290;
const RACE_CENTER_X = 220;
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
const PLAYER_BUILDING_CRASH_SPEED = 12;
const CRASH_FRICTION = 4.8;
const CRASH_SPIN_FRICTION = 3.6;
const DAMAGE_GRAVITY = 16;
const DAMAGE_FRICTION = 2.8;
const DAMAGE_BOUNDS = BOUNDS - 2;
const SAME_LANE_SPAWN_CLEARANCE = 5.2;
const MAX_BOT_CARS = 500;
const BOT_POPULATION_SPACING = 5.8;
const SPAWN_BODY_MARGIN = 0.22;
const BOT_BUMPER_GAP = 0.38;
const PLAYER_FOLLOW_GAP = 4.5;
const PLAYER_FOLLOW_TIME = 0.55;
const ENGINE_AUDIO_RANGE = 48;
const MAX_ENGINE_VOICES = 28;
const ENGINE_VOLUME = 2.14;
const REV_SMOKE_INTERVAL = 0.055;
const TRAFFIC_CYCLE = (SIGNAL_GREEN_TIME + SIGNAL_YELLOW_TIME + SIGNAL_ALL_RED_TIME) * 2;
const PLAYER_START = new THREE.Vector3(RACE_CENTER_X, 0, 35);
const SECURITY_ROOM_X = BOUNDS + 9;
const SECURITY_ROOM_ENTRY = new THREE.Vector3(SECURITY_ROOM_X, 0, 9.7);

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
  greenIntersectionPass: null,
  doorMotionStart: -10,
  carTransition: null,
  crashMeeting: null,
  buildingHelper: null,
  policeMode: false,
  policeTarget: null,
  policeSiren: null,
  policeInterview: false,
  policeConversation: null,
  policePistolDrawn: false,
  policePistol: null,
  policeRpg: null,
  policeFlashlightOn: false,
  policeFlashlight: null,
  policeFlashlightLight: null,
  policeFlashlightTarget: null,
  policeWeapon: "pistol",
  policeAim: { yaw: 0, pitch: 0 },
  policeAimZoom: 0,
  lastPoliceShot: -10,
  lastRpgShot: -10,
  policeTriggerHeld: false,
  policeTriggerStartedAt: -10,
  grenadeCharging: false,
  grenadeAimActive: false,
  grenadeChargeStartedAt: -10,
  grenadeChargeMeter: null,
  grenadeCameraSnapBack: false,
  introActive: document.documentElement.dataset.intro === "new",
  cameraView: 2,
  backupCameraActive: false,
  reverseCrossTrafficDirection: null,
  lastReverseCrossTrafficBeep: -10,
  blindSpotLeft: false,
  blindSpotRight: false,
  lastBlindSpotBeep: -10,
  gear: "drive",
  gearDragging: false,
  gearDragStartY: 0,
  gearDragStartZ: 0.16,
  gearDragZ: 0.16,
  cockpitLook: { yaw: 0, pitch: 0, lastMovedAt: -Infinity },
  botSensitivity: 0,
  trafficDensity: 1,
  trafficInitialized: false,
  settingsOpen: false,
  quality: "high",
  fpsFrames: 0,
  fpsElapsed: 0,
  skyTime: DAY_DURATION * 0.25,
  daylight: 1,
  sunDestroyed: false,
  destroyedSunPosition: new THREE.Vector3(),
  nextSolarFireballAt: Infinity,
  botHeadlightsOn: false,
  playerHeadlights: false,
  streetLightsOn: false,
  nextStreetLightRefresh: 0,
  nextBotHeadlightRefresh: 0,
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

window.setGameTime = setGameTime;

function init() {
  scene.add(city);
  city.add(buildings, roads);

  hemisphereLight = new THREE.HemisphereLight(0xf7fbff, 0x233342, 2.2);
  scene.add(hemisphereLight);

  sunLight = new THREE.DirectionalLight(0xffffff, 2.7);
  sunLight.position.set(-45, 80, 40);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.left = -120;
  sunLight.shadow.camera.right = 120;
  sunLight.shadow.camera.top = 120;
  sunLight.shadow.camera.bottom = -120;
  scene.add(sunLight);

  moonLight = new THREE.DirectionalLight(0x9db9ff, 0);
  scene.add(moonLight);
  createSkyCycleObjects();

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(460, 460),
    new THREE.MeshStandardMaterial({ color: 0x4b8b5a, roughness: 0.95 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  city.add(ground);

  createRoads();
  createStreetLights();
  createRacingArea();
  createBlocks();
  createSecurityCameraRoom();
  createTrafficLights();
  createIntersectionSecurityCameras();
  createPlayer();
  createPedestrian();
  createPoliceFlashlight();
  createPolicePistol();
  createPoliceRpg();
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
  settingsButtonEl.addEventListener("click", openSettings);
  closeSettingsEl.addEventListener("click", closeSettings);
  resumeGameEl.addEventListener("click", closeSettings);
  settingsOverlayEl.addEventListener("click", (event) => {
    if (event.target === settingsOverlayEl) closeSettings();
  });
  qualitySettingEl.addEventListener("change", applyQualitySetting);
  restartBtn.addEventListener("click", restartCity);
  policeInteractionEl.addEventListener("click", onPoliceInteractionClick);
  setupIntro();
  updateBotSensitivity();
  updateTrafficDensity();
  applyQualitySetting();
  updateDayNightCycle(0);
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
  const centerStripe = new THREE.MeshStandardMaterial({ color: 0xf3c62f, roughness: 0.7 });
  const laneStripe = new THREE.MeshStandardMaterial({ color: 0xf5f5ed, roughness: 0.7 });
  const crosswalk = new THREE.MeshStandardMaterial({ color: 0xe9ece8, roughness: 0.75 });
  const playerLane = new THREE.MeshStandardMaterial({ color: 0x345f70, roughness: 0.78 });

  for (const z of GRID) {
    const road = new THREE.Mesh(new THREE.BoxGeometry(BOUNDS * 2 + 10, 0.08, ROAD_HALF * 2), asphalt);
    road.position.set(0, 0.04, z);
    road.receiveShadow = true;
    roads.add(road);
    roadSegments.push({ axis: "x", fixed: z });

    addPlayerLaneSegments("x", z, playerLane);

    for (const centerOffset of [-0.14, 0.14]) {
      const centerLine = new THREE.Mesh(
        new THREE.BoxGeometry(BOUNDS * 2 + 10, 0.1, 0.12),
        centerStripe,
      );
      centerLine.position.set(0, 0.11, z + centerOffset);
      roads.add(centerLine);
    }

    for (let x = -BOUNDS; x <= BOUNDS; x += 9) {
      for (const side of [-1, 1]) {
        const laneDash = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.1, 0.1), laneStripe);
        laneDash.position.set(x, 0.11, z + side * 3.5);
        roads.add(laneDash);
      }
    }
  }

  for (const x of GRID) {
    const road = new THREE.Mesh(new THREE.BoxGeometry(ROAD_HALF * 2, 0.09, BOUNDS * 2 + 10), asphalt);
    road.position.set(x, 0.05, 0);
    road.receiveShadow = true;
    roads.add(road);
    roadSegments.push({ axis: "z", fixed: x });

    addPlayerLaneSegments("z", x, playerLane);

    for (const centerOffset of [-0.14, 0.14]) {
      const centerLine = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.11, BOUNDS * 2 + 10),
        centerStripe,
      );
      centerLine.position.set(x + centerOffset, 0.12, 0);
      roads.add(centerLine);
    }

    for (let z = -BOUNDS; z <= BOUNDS; z += 9) {
      for (const side of [-1, 1]) {
        const laneDash = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.11, 4.2), laneStripe);
        laneDash.position.set(x + side * 3.5, 0.12, z);
        roads.add(laneDash);
      }
    }
  }

  for (const x of GRID) {
    for (const z of GRID) {
      const plaza = new THREE.Mesh(new THREE.BoxGeometry(ROAD_HALF * 2.05, 0.12, ROAD_HALF * 2.05), asphalt);
      plaza.position.set(x, 0.13, z);
      roads.add(plaza);

      const stopLineLength = ROAD_HALF - 0.55;
      const stopLineCenter = ROAD_HALF / 2;
      const stopLineSpecs = [
        { x: x - STOP_LINE_OFFSET, z: z + stopLineCenter, width: 0.36, depth: stopLineLength },
        { x: x + STOP_LINE_OFFSET, z: z - stopLineCenter, width: 0.36, depth: stopLineLength },
        { x: x - stopLineCenter, z: z + STOP_LINE_OFFSET, width: stopLineLength, depth: 0.36 },
        { x: x + stopLineCenter, z: z - STOP_LINE_OFFSET, width: stopLineLength, depth: 0.36 },
      ];
      for (const spec of stopLineSpecs) {
        const stopLine = new THREE.Mesh(
          new THREE.BoxGeometry(spec.width, 0.15, spec.depth),
          crosswalk,
        );
        stopLine.position.set(spec.x, 0.2, spec.z);
        roads.add(stopLine);
      }
    }
  }
}

function createStreetLights() {
  const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x252d31, metalness: 0.62, roughness: 0.42 });
  streetLightBulbMaterial = new THREE.MeshStandardMaterial({
    color: 0x6f716b,
    emissive: 0xffe7a3,
    emissiveIntensity: 0.05,
    roughness: 0.18,
  });
  const boundaries = [-BOUNDS, ...GRID, BOUNDS];
  const alongPositions = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    const start = boundaries[i];
    const end = boundaries[i + 1];
    if (end - start < 38) continue;
    alongPositions.push(start + (end - start) / 3, start + (end - start) * 2 / 3);
  }

  for (const fixed of GRID) {
    for (const along of alongPositions) {
      addStreetLightFixture("x", along, fixed, -1, poleMaterial);
      addStreetLightFixture("x", along, fixed, 1, poleMaterial);
      addStreetLightFixture("z", along, fixed, -1, poleMaterial);
      addStreetLightFixture("z", along, fixed, 1, poleMaterial);
    }
  }

  for (let i = 0; i < 16; i++) {
    const light = new THREE.PointLight(0xffe4a0, 0, 34, 1.35);
    light.visible = false;
    light.castShadow = false;
    scene.add(light);
    streetLightPool.push(light);
  }
}

function addStreetLightFixture(axis, along, fixed, side, poleMaterial) {
  const poleOffset = PLAYER_LANE_OFFSET + PLAYER_LANE_WIDTH / 2 + 0.95;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 7.4, 10), poleMaterial);
  const arm = new THREE.Mesh(
    axis === "x" ? new THREE.BoxGeometry(0.13, 0.13, 2.6) : new THREE.BoxGeometry(2.6, 0.13, 0.13),
    poleMaterial,
  );
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 8), streetLightBulbMaterial);
  if (axis === "x") {
    pole.position.set(along, 3.7, fixed + side * poleOffset);
    arm.position.set(along, 7.35, fixed + side * (poleOffset - 1.3));
    bulb.position.set(along, 7.18, fixed + side * (poleOffset - 2.5));
  } else {
    pole.position.set(fixed + side * poleOffset, 3.7, along);
    arm.position.set(fixed + side * (poleOffset - 1.3), 7.35, along);
    bulb.position.set(fixed + side * (poleOffset - 2.5), 7.18, along);
  }
  pole.castShadow = false;
  arm.castShadow = false;
  city.add(pole, arm, bulb);
  streetLights.push({ bulb, position: bulb.position });
}

function createRacingArea() {
  const asphalt = new THREE.MeshStandardMaterial({ color: 0x24282c, roughness: 0.76 });
  const curbRed = new THREE.MeshStandardMaterial({ color: 0xd93636, roughness: 0.65 });
  const curbWhite = new THREE.MeshStandardMaterial({ color: 0xf4f4ed, roughness: 0.65 });
  const raceEntranceX = RACE_CENTER_X - RACE_OUTER_X;
  const connector = new THREE.Mesh(new THREE.BoxGeometry(raceEntranceX - BOUNDS + 8, 0.1, 10), asphalt);
  connector.position.set((BOUNDS + raceEntranceX) / 2, 0.07, 0);
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
    pillar.position.set(BOUNDS + 1.5, 2.75, z);
    pillar.castShadow = true;
    roads.add(pillar);
  }
  const banner = new THREE.Mesh(new THREE.BoxGeometry(1, 0.9, 12.4), gateMaterial);
  banner.position.set(BOUNDS + 1.5, 5.2, 0);
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
      const pad = new THREE.Mesh(new THREE.BoxGeometry(12, 0.18, 12), sidewalkMat);
      pad.position.set(cx, 0.1, cz);
      pad.receiveShadow = true;
      buildings.add(pad);

      const count = 1;
      for (let i = 0; i < count; i++) {
        const w = 7.8 + ((xi + zi) % 2) * 1.4;
        const d = 7.6 + ((xi * 2 + zi) % 2) * 1.2;
        const h = 7 + ((xi * 5 + zi * 3 + i * 4) % 18);
        const bx = cx;
        const bz = cz;
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
  // Compact corner-mounted signals keep the mast arms proportional to the road.
  const fixtureOffset = ROAD_HALF + 0.35;
  const lampOffset = ROAD_HALF - 2.45;
  for (const x of GRID) {
    for (const z of GRID) {
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x28312f, roughness: 0.6 });
      const corners = [
        { px: x - fixtureOffset, pz: z - fixtureOffset, axis: "ns", yaw: 0, lx: x - fixtureOffset, lz: z - lampOffset },
        { px: x + fixtureOffset, pz: z + fixtureOffset, axis: "ns", yaw: Math.PI, lx: x + fixtureOffset, lz: z + lampOffset },
        { px: x - fixtureOffset, pz: z + fixtureOffset, axis: "ew", yaw: -Math.PI / 2, lx: x - lampOffset, lz: z + fixtureOffset },
        { px: x + fixtureOffset, pz: z - fixtureOffset, axis: "ew", yaw: Math.PI / 2, lx: x + lampOffset, lz: z - fixtureOffset },
      ];

      for (const corner of corners) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 4.9, 12), poleMat);
        pole.position.set(corner.px, 2.1, corner.pz);
        pole.castShadow = true;
        city.add(pole);

        const armLength = Math.abs(corner.lx - corner.px) > Math.abs(corner.lz - corner.pz) ? "x" : "z";
        const armSpan = Math.hypot(corner.lx - corner.px, corner.lz - corner.pz);
        const arm = new THREE.Mesh(
          new THREE.BoxGeometry(armLength === "x" ? armSpan : 0.18, 0.18, armLength === "z" ? armSpan : 0.18),
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
  building.position.set(SECURITY_ROOM_X, 3.5, 17);
  building.castShadow = true;
  building.receiveShadow = true;
  buildings.add(building);
  buildingObstacles.push({ x: SECURITY_ROOM_X, z: 17, halfX: 7.1, halfZ: 6.1 });

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 3.4, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x10171c, metalness: 0.72, roughness: 0.28 }),
  );
  door.position.set(SECURITY_ROOM_X, 1.7, 10.92);
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
  sign.position.set(SECURITY_ROOM_X, 5.35, 10.76);
  sign.rotation.y = Math.PI;
  buildings.add(sign);

  const beacon = new THREE.PointLight(0x4dd9ff, 18, 12);
  beacon.position.set(SECURITY_ROOM_X, 3.8, 9.6);
  buildings.add(beacon);
}

function createIntersectionSecurityCameras() {
  const cameraOffset = ROAD_HALF + 0.55;
  const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x3b464b, metalness: 0.55, roughness: 0.38 });
  const cameraMaterial = new THREE.MeshStandardMaterial({ color: 0xe8edf0, metalness: 0.25, roughness: 0.42 });
  for (const x of GRID) {
    for (const z of GRID) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 6.5, 10), poleMaterial);
      pole.position.set(x + cameraOffset, 3.25, z + cameraOffset);
      city.add(pole);
      const oppositePole = pole.clone();
      oppositePole.position.set(x - cameraOffset, 3.25, z - cameraOffset);
      city.add(oppositePole);
      const housing = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.48, 1.15), cameraMaterial);
      housing.position.set(x + cameraOffset, 6.45, z + cameraOffset - 0.4);
      housing.rotation.x = -0.24;
      city.add(housing);
      const lens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.17, 0.17, 0.16, 12),
        new THREE.MeshBasicMaterial({ color: 0x071018 }),
      );
      lens.rotation.x = Math.PI / 2;
      lens.position.set(x + cameraOffset, 6.36, z + cameraOffset - 1.02);
      city.add(lens);

      const oppositeHousing = housing.clone();
      oppositeHousing.position.set(x - cameraOffset, 6.45, z - cameraOffset + 0.4);
      oppositeHousing.rotation.y = Math.PI;
      city.add(oppositeHousing);
      const oppositeLens = lens.clone();
      oppositeLens.position.set(x - cameraOffset, 6.36, z - cameraOffset + 1.02);
      city.add(oppositeLens);
      const recordingLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xff2c2c }),
      );
      recordingLight.position.set(x + cameraOffset + 0.27, 6.58, z + cameraOffset - 0.82);
      city.add(recordingLight);

      const view = new THREE.PerspectiveCamera(62, 1, 0.1, 260);
      view.position.set(x + cameraOffset, 6.35, z + cameraOffset - 0.4);
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
    driveDamage: 0,
    damagePull: 0,
    indicators: player.userData.indicators,
    brakeLights: player.userData.brakeLights,
    headlights: player.userData.headlights,
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
  ensurePlayerHeadlightBeams(player);
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
  backupCameraTarget.texture.colorSpace = THREE.SRGBColorSpace;
  const displayMaterial = new THREE.MeshBasicMaterial({ map: displayTexture, side: THREE.DoubleSide });
  const display = new THREE.Mesh(
    new THREE.PlaneGeometry(0.64, 0.3),
    displayMaterial,
  );
  display.position.set(-0.08, 1.23, 0.355);
  display.rotation.y = Math.PI;

  const reverseWarningCanvas = document.createElement("canvas");
  reverseWarningCanvas.width = 512;
  reverseWarningCanvas.height = 256;
  const reverseWarningTexture = new THREE.CanvasTexture(reverseWarningCanvas);
  reverseWarningTexture.colorSpace = THREE.SRGBColorSpace;
  const reverseWarning = new THREE.Mesh(
    new THREE.PlaneGeometry(0.64, 0.3),
    new THREE.MeshBasicMaterial({ map: reverseWarningTexture, transparent: true, depthTest: false, side: THREE.DoubleSide }),
  );
  reverseWarning.position.set(-0.08, 1.23, 0.349);
  reverseWarning.rotation.y = Math.PI;
  reverseWarning.renderOrder = 20;

  const clusterCanvas = document.createElement("canvas");
  clusterCanvas.width = 384;
  clusterCanvas.height = 192;
  const clusterTexture = new THREE.CanvasTexture(clusterCanvas);
  clusterTexture.colorSpace = THREE.SRGBColorSpace;
  const cluster = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.19),
    new THREE.MeshBasicMaterial({ map: clusterTexture, side: THREE.DoubleSide }),
  );
  cluster.position.set(0.38, 1.32, 0.345);
  cluster.rotation.y = Math.PI;

  const shifter = new THREE.Group();
  const shifterBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.09, 0.72),
    new THREE.MeshStandardMaterial({ color: 0x111619, roughness: 0.68 }),
  );
  const shifterSlot = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.02, 0.46),
    new THREE.MeshBasicMaterial({ color: 0x050708 }),
  );
  shifterSlot.position.y = 0.058;
  const shifterLever = new THREE.Group();
  const shifterBoot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.14, 0.15, 12),
    new THREE.MeshStandardMaterial({ color: 0x090b0c, roughness: 0.95 }),
  );
  shifterBoot.position.y = 0.12;
  const shifterHandle = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x20282c, roughness: 0.34, metalness: 0.28 }),
  );
  shifterHandle.scale.set(0.9, 0.72, 1.18);
  shifterHandle.position.y = 0.43;
  const shifterStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.027, 0.032, 0.36, 12),
    new THREE.MeshStandardMaterial({ color: 0xa8b3b8, roughness: 0.24, metalness: 0.82 }),
  );
  shifterStem.position.y = 0.27;
  shifterLever.position.z = 0.16;
  shifterLever.add(shifterBoot, shifterStem, shifterHandle);
  for (const [z, color] of [[0.27, 0x45df83], [-0.27, 0xffa23b]]) {
    const marker = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.025, 0.09),
      new THREE.MeshBasicMaterial({ color }),
    );
    marker.position.set(0.145, 0.065, z);
    marker.userData.gearSelector = true;
    shifter.add(marker);
  }
  shifter.position.set(-0.42, 0.82, -0.02);
  shifter.add(shifterBase, shifterSlot, shifterLever);
  shifterBase.userData.gearSelector = true;
  shifterHandle.userData.gearSelector = true;
  shifterStem.userData.gearSelector = true;
  shifterBoot.userData.gearSelector = true;

  const backupGuides = new THREE.Group();
  backupGuides.visible = false;
  for (const [color, z, width] of [[0x43e47a, -10.2, 2.35], [0xffd247, -7.2, 2.7], [0xff4b42, -4.25, 3.05]]) {
    const marker = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.045, 0.2),
      new THREE.MeshBasicMaterial({ color, depthTest: true }),
    );
    marker.position.set(0, 0.31, z);
    backupGuides.add(marker);
  }
  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.04, 6.25),
      new THREE.MeshBasicMaterial({ color: 0xf4fbff, depthTest: true }),
    );
    rail.position.set(side * 1.32, 0.305, -7.2);
    rail.rotation.y = side * 0.058;
    backupGuides.add(rail);
  }
  car.add(backupGuides);

  const infotainment = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.25),
    new THREE.MeshBasicMaterial({ color: 0x12344a, side: THREE.DoubleSide }),
  );
  infotainment.position.set(-0.72, 1.18, 0.36);
  infotainment.rotation.y = Math.PI;

  const mirrorMaterialLeft = new THREE.MeshBasicMaterial({ map: leftMirrorTarget.texture, side: THREE.DoubleSide });
  const mirrorMaterialRight = new THREE.MeshBasicMaterial({ map: rightMirrorTarget.texture, side: THREE.DoubleSide });
  const blindSpotIcons = {};
  for (const spec of [
    { side: "left", x: 1.34, material: mirrorMaterialLeft },
    { side: "right", x: -1.05, material: mirrorMaterialRight },
  ]) {
    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.34, 0.12), trim);
    housing.position.set(spec.x, 1.36, 0.68);
    const mirror = new THREE.Mesh(new THREE.PlaneGeometry(0.53, 0.26), spec.material);
    mirror.position.set(spec.x, 1.36, 0.61);
    mirror.rotation.y = Math.PI;
    const warningIcon = new THREE.Group();
    const warningShape = new THREE.Shape();
    warningShape.moveTo(0, 0.055);
    warningShape.lineTo(-0.052, -0.038);
    warningShape.lineTo(0.052, -0.038);
    warningShape.closePath();
    const warningTriangle = new THREE.Mesh(
      new THREE.ShapeGeometry(warningShape),
      new THREE.MeshBasicMaterial({ color: 0xffa51f, transparent: true, opacity: 0.95, depthTest: false, side: THREE.DoubleSide }),
    );
    const warningBar = new THREE.Mesh(
      new THREE.PlaneGeometry(0.009, 0.038),
      new THREE.MeshBasicMaterial({ color: 0x1b1000, depthTest: false, side: THREE.DoubleSide }),
    );
    warningBar.position.set(0, 0.004, 0.002);
    const warningDot = new THREE.Mesh(
      new THREE.CircleGeometry(0.006, 12),
      new THREE.MeshBasicMaterial({ color: 0x1b1000, depthTest: false, side: THREE.DoubleSide }),
    );
    warningDot.position.set(0, -0.023, 0.002);
    warningIcon.add(warningTriangle, warningBar, warningDot);
    warningIcon.position.set(spec.x + Math.sign(spec.x) * 0.17, 1.4, 0.59);
    warningIcon.rotation.y = Math.PI;
    warningIcon.renderOrder = 25;
    warningIcon.visible = false;
    blindSpotIcons[spec.side] = warningIcon;
    cockpit.add(housing, mirror, warningIcon);
  }

  const rearviewHousing = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.16, 0.1), trim);
  rearviewHousing.position.set(0, 2.01, 0.46);
  const rearviewMirror = new THREE.Mesh(
    new THREE.PlaneGeometry(0.4, 0.105),
    new THREE.MeshBasicMaterial({ map: rearviewTarget.texture, side: THREE.DoubleSide }),
  );
  rearviewMirror.position.set(0, 2.01, 0.4);
  rearviewMirror.rotation.y = Math.PI;
  const rearviewStem = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.12, 0.06), trim);
  rearviewStem.position.set(0, 2.11, 0.5);

  cockpit.add(dashboard, roof, windshield, wheel, wheelHub, display, reverseWarning, cluster, infotainment, shifter,
    rearviewHousing, rearviewMirror, rearviewStem);
  cockpit.userData.displayCanvas = displayCanvas;
  cockpit.userData.displayTexture = displayTexture;
  cockpit.userData.displayMaterial = displayMaterial;
  cockpit.userData.reverseWarningCanvas = reverseWarningCanvas;
  cockpit.userData.reverseWarningTexture = reverseWarningTexture;
  cockpit.userData.reverseWarning = reverseWarning;
  cockpit.userData.clusterCanvas = clusterCanvas;
  cockpit.userData.clusterTexture = clusterTexture;
  cockpit.userData.shifterLever = shifterLever;
  cockpit.userData.backupGuides = backupGuides;
  cockpit.userData.blindSpotIcons = blindSpotIcons;
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

  const chargeMeter = new THREE.Group();
  const meterBack = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 0.28),
    new THREE.MeshBasicMaterial({ color: 0x11171a, transparent: true, opacity: 0.9, depthTest: false, depthWrite: false }),
  );
  const meterFill = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 0.16),
    new THREE.MeshBasicMaterial({ color: 0x55d978, depthTest: false, depthWrite: false }),
  );
  meterFill.position.z = 0.012;
  meterFill.scale.x = 0.001;
  meterFill.userData.fullWidth = 1.5;
  meterBack.renderOrder = 50;
  meterFill.renderOrder = 51;
  chargeMeter.add(meterBack, meterFill);
  chargeMeter.visible = false;
  chargeMeter.renderOrder = 50;
  chargeMeter.userData.fill = meterFill;
  city.add(chargeMeter);
  state.grenadeChargeMeter = chargeMeter;
}

function updateGrenadeChargeMeter() {
  const meter = state.grenadeChargeMeter;
  const person = state.pedestrian;
  if (!meter || !person) return;
  meter.visible = state.grenadeCharging && state.onFoot && person.visible && !state.securityRoom;
  if (!meter.visible) return;
  const charge = THREE.MathUtils.clamp((state.time - state.grenadeChargeStartedAt) / 2, 0, 1);
  const fill = meter.userData.fill;
  fill.scale.x = Math.max(0.001, charge);
  fill.position.x = -(fill.userData.fullWidth * (1 - charge)) / 2;
  fill.material.color.set(charge < 0.5 ? 0x55d978 : charge < 0.85 ? 0xffca3a : 0xff5a45);
  if (state.grenadeAimActive) {
    meter.position.copy(camera.localToWorld(new THREE.Vector3(0, -0.48, -2.4)));
  } else {
    meter.position.copy(person.position).add(new THREE.Vector3(0, 2.75, 0));
  }
  meter.quaternion.copy(camera.quaternion);
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

function createPolicePistol() {
  scene.add(camera);
  const pistol = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x171a1e, roughness: 0.3, metalness: 0.78 });
  const gripMat = new THREE.MeshStandardMaterial({ color: 0x090a0b, roughness: 0.82 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xd59a72, roughness: 0.8 });
  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.68), metal);
  slide.position.set(0, 0.04, -0.24);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.5, 10), metal);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.04, -0.42);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.48, 0.24), gripMat);
  grip.position.set(0, -0.24, 0.02);
  grip.rotation.x = -0.2;
  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.3, 0.38), skin);
  hand.position.set(0, -0.25, 0.12);
  const muzzle = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 10, 7),
    new THREE.MeshBasicMaterial({ color: 0xffd45c, transparent: true, opacity: 0.95 }),
  );
  muzzle.position.set(0, 0.04, -0.77);
  muzzle.visible = false;
  pistol.add(slide, barrel, grip, hand, muzzle);
  pistol.position.set(0.36, -0.34, -0.78);
  pistol.rotation.set(-0.04, -0.08, 0.02);
  pistol.visible = false;
  pistol.userData.muzzle = muzzle;
  camera.add(pistol);
  state.policePistol = pistol;
}

function createPoliceFlashlight() {
  const flashlight = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x171b20, roughness: 0.36, metalness: 0.7 });
  const gripMaterial = new THREE.MeshStandardMaterial({ color: 0x090b0d, roughness: 0.78 });
  const lensMaterial = new THREE.MeshStandardMaterial({
    color: 0xe9f7ff,
    emissive: 0xd8f4ff,
    emissiveIntensity: 2.2,
    roughness: 0.18,
  });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.48, 12), bodyMaterial);
  body.rotation.x = Math.PI / 2;
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.085, 0.16, 12), bodyMaterial);
  head.rotation.x = Math.PI / 2;
  head.position.z = 0.3;
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.105, 16), lensMaterial);
  lens.position.z = 0.385;
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.19, 0.14), gripMaterial);
  grip.position.set(0, -0.12, -0.08);
  flashlight.add(body, head, lens, grip);
  flashlight.position.set(-0.47, 1.25, 0.3);
  flashlight.visible = false;
  flashlight.userData.ignoreBulletRay = true;
  state.pedestrian.add(flashlight);

  const target = new THREE.Object3D();
  const light = new THREE.SpotLight(0xeaf8ff, 105, 62, Math.PI / 8, 0.42, 1.25);
  light.target = target;
  light.visible = false;
  light.castShadow = false;
  scene.add(light, target);
  state.policeFlashlight = flashlight;
  state.policeFlashlightLight = light;
  state.policeFlashlightTarget = target;
}

function setPoliceFlashlight(active) {
  state.policeFlashlightOn = Boolean(active && state.policeMode && state.onFoot && !state.securityRoom);
  if (state.policeFlashlight) state.policeFlashlight.visible = state.policeFlashlightOn;
  if (state.policeFlashlightLight) state.policeFlashlightLight.visible = state.policeFlashlightOn;
}

function togglePoliceFlashlight() {
  if (!state.policeMode || !state.onFoot || state.securityRoom || state.carTransition) return;
  setPoliceFlashlight(!state.policeFlashlightOn);
  statusEl.textContent = state.policeFlashlightOn ? "Handheld flashlight on — F turns it off" : "Handheld flashlight off";
}

function updatePoliceFlashlight() {
  if (!state.policeFlashlightOn || !state.policeMode || !state.onFoot || state.securityRoom || !state.pedestrian?.visible) {
    setPoliceFlashlight(false);
    return;
  }
  const person = state.pedestrian;
  const origin = person.localToWorld(new THREE.Vector3(-0.47, 1.25, 0.68));
  const direction = new THREE.Vector3(0, state.policePistolDrawn ? Math.sin(state.policeAim.pitch) : -0.04,
    state.policePistolDrawn ? Math.cos(state.policeAim.pitch) : 1).applyQuaternion(person.getWorldQuaternion(new THREE.Quaternion())).normalize();
  state.policeFlashlight.rotation.x = state.policePistolDrawn ? -state.policeAim.pitch : 0.04;
  state.policeFlashlightLight.position.copy(origin);
  state.policeFlashlightTarget.position.copy(origin).addScaledVector(direction, 42);
  state.policeFlashlightLight.visible = true;
  state.policeFlashlight.visible = true;
}

function createPoliceRpg() {
  const rpg = new THREE.Group();
  const tubeMat = new THREE.MeshStandardMaterial({ color: 0x354735, roughness: 0.72, metalness: 0.2 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x171b18, roughness: 0.62, metalness: 0.45 });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.12, 1.35, 12), tubeMat);
  tube.rotation.x = Math.PI / 2;
  tube.position.z = -0.2;
  const rear = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.1, 0.3, 12), darkMat);
  rear.rotation.x = Math.PI / 2;
  rear.position.z = 0.55;
  const sight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.24), darkMat);
  sight.position.set(0.1, 0.14, -0.28);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.34, 0.18), darkMat);
  grip.position.set(0, -0.2, -0.15);
  rpg.add(tube, rear, sight, grip);
  rpg.position.set(0.42, -0.3, -0.72);
  rpg.rotation.set(-0.03, -0.08, 0.02);
  rpg.visible = false;
  rpg.userData.ignoreBulletRay = true;
  camera.add(rpg);
  state.policeRpg = rpg;
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
    for (const laneIndex of [0, 1]) {
      entries.push({ x: -BOUNDS, z: z + laneOffsetForDirection("east", laneIndex), dir: "east", laneIndex });
      entries.push({ x: BOUNDS, z: z + laneOffsetForDirection("west", laneIndex), dir: "west", laneIndex });
    }
  }
  for (const x of GRID) {
    for (const laneIndex of [0, 1]) {
      entries.push({ x: x + laneOffsetForDirection("north", laneIndex), z: BOUNDS, dir: "north", laneIndex });
      entries.push({ x: x + laneOffsetForDirection("south", laneIndex), z: -BOUNDS, dir: "south", laneIndex });
    }
  }
  return distributeTrafficCandidates(entries, 7411);
}

function makeBotStarts() {
  const horizontal = [];
  const vertical = [];

  for (const z of GRID) {
    for (let x = -BOUNDS; x <= BOUNDS; x += BOT_POPULATION_SPACING) {
      for (const laneIndex of [0, 1]) {
        horizontal.push({ x, z: z + laneOffsetForDirection("east", laneIndex), dir: "east", laneIndex });
        horizontal.push({ x: -x, z: z + laneOffsetForDirection("west", laneIndex), dir: "west", laneIndex });
      }
    }
  }

  for (const x of GRID) {
    for (let z = -BOUNDS; z <= BOUNDS; z += BOT_POPULATION_SPACING) {
      for (const laneIndex of [0, 1]) {
        vertical.push({ x: x + laneOffsetForDirection("north", laneIndex), z: -z, dir: "north", laneIndex });
        vertical.push({ x: x + laneOffsetForDirection("south", laneIndex), z, dir: "south", laneIndex });
      }
    }
  }

  const starts = [];
  const count = Math.max(horizontal.length, vertical.length);
  for (let i = 0; i < count; i++) {
    if (horizontal[i]) starts.push(horizontal[i]);
    if (vertical[i]) starts.push(vertical[i]);
  }
  return distributeTrafficCandidates(starts, 19387);
}

function distributeTrafficCandidates(candidates, seed) {
  // A deterministic shuffle prevents the first 200 slots from all belonging
  // to the same road or corner while keeping reloads reproducible.
  const distributed = [...candidates];
  let randomState = seed >>> 0;
  for (let i = distributed.length - 1; i > 0; i--) {
    randomState = (randomState * 1664525 + 1013904223) >>> 0;
    const swapIndex = randomState % (i + 1);
    [distributed[i], distributed[swapIndex]] = [distributed[swapIndex], distributed[i]];
  }
  return distributed;
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
    laneIndex: start.laneIndex || 0,
    nextLaneChangeAt: state.time + 5 + Math.random() * 10,
    laneChange: null,
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
    headlights: bot.userData.headlights,
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
  const headlightMat = new THREE.MeshStandardMaterial({ color: 0xb9b59f, emissive: 0xfff0b0, emissiveIntensity: 0.12 });
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

  const headlights = [];
  for (const x of [-0.58, 0.58]) {
    const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.16), headlightMat.clone());
    headlight.position.set(x, 0.82, 2.14);
    car.add(headlight);
    headlights.push(headlight);
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
  car.userData.headlights = headlights;
  car.userData.body = body;
  car.userData.cabin = cabin;
  car.userData.wheels = car.children.filter((child) => child.geometry?.type === "CylinderGeometry");
  return car;
}

function createSkylineDetails() {
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x276f42, roughness: 0.8 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7a5630, roughness: 0.8 });
  for (let i = 0; i < 70; i++) {
    const x = -BOUNDS + (i * 29) % (BOUNDS * 2);
    const z = -BOUNDS + (i * 47) % (BOUNDS * 2);
    if (isOnRoad(x, z)) continue;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 1.2, 8), trunkMat);
    trunk.position.set(x, 0.65, z);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.5, 9), treeMat);
    crown.position.set(x, 2.15, z);
    crown.castShadow = true;
    city.add(trunk, crown);
  }
}

function createSkyCycleObjects() {
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xfff1b0, fog: false, transparent: true });
  sunDisk = new THREE.Mesh(new THREE.SphereGeometry(10, 24, 16), sunMaterial);
  scene.add(sunDisk);

  const moonMaterial = new THREE.MeshBasicMaterial({ color: 0xdce7ff, fog: false, transparent: true });
  moonDisk = new THREE.Mesh(new THREE.SphereGeometry(7, 24, 16), moonMaterial);
  scene.add(moonDisk);

  const positions = [];
  for (let i = 0; i < 650; i++) {
    const azimuth = (i * 2.399963 + Math.sin(i * 17.17) * 0.35) % (Math.PI * 2);
    const elevation = 0.12 + ((i * 73) % 100) / 100 * 1.15;
    const radius = 430;
    positions.push(
      Math.cos(azimuth) * Math.cos(elevation) * radius,
      Math.sin(elevation) * radius,
      Math.sin(azimuth) * Math.cos(elevation) * radius,
    );
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const starMaterial = new THREE.PointsMaterial({
    color: 0xe8efff,
    size: 1.35,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
  });
  starField = new THREE.Points(starGeometry, starMaterial);
  scene.add(starField);

  for (let i = 0; i < 8; i++) {
    const target = new THREE.Object3D();
    // One pooled beam represents both physical bot headlights, so its output
    // matches the player's two 115-intensity beams.
    const light = new THREE.SpotLight(0xfff2c2, 230, 78, Math.PI / 7, 0.42, 1.2);
    light.target = target;
    light.visible = false;
    light.castShadow = false;
    scene.add(light, target);
    botHeadlightPool.push({ light, target, car: null });
  }
}

function updateDayNightCycle(dt) {
  state.skyTime = (state.skyTime + dt) % SKY_CYCLE_DURATION;
  if (state.sunDestroyed) {
    state.daylight = 0;
    scene.background.copy(NIGHT_SKY);
    scene.fog.color.copy(NIGHT_SKY);
    sunDisk.visible = false;
    sunLight.intensity = 0;
    moonDisk.position.set(-190, 210, 205);
    moonLight.position.copy(moonDisk.position).multiplyScalar(0.35);
    moonLight.intensity = 0.34;
    hemisphereLight.intensity = 0.2;
    hemisphereLight.color.set(0x819bd2);
    starField.material.opacity = 1;
    starField.rotation.y += dt * 0.004;
    moonDisk.material.opacity = 1;
    if (!state.botHeadlightsOn) {
      state.botHeadlightsOn = true;
      updateVehicleHeadlights(true);
    }
    updateStreetLights(true);
    updateBotHeadlightPool(true);
    return;
  }
  const daytime = state.skyTime < DAY_DURATION;
  const phase = daytime
    ? state.skyTime / DAY_DURATION
    : (state.skyTime - DAY_DURATION) / NIGHT_DURATION;
  const elevation = Math.sin(phase * Math.PI);
  const daylight = daytime ? THREE.MathUtils.smoothstep(elevation, 0.02, 0.58) : 0;
  const nightStrength = THREE.MathUtils.smoothstep(1 - daylight, 0.35, 0.96);
  state.daylight = daylight;

  const skyColor = NIGHT_SKY.clone().lerp(DAY_SKY, daylight);
  if (daytime) {
    const twilight = Math.max(0, 1 - Math.abs(phase - 0.5) * 2) > 0
      ? Math.max(0, 1 - daylight * 1.8) * Math.sin(phase * Math.PI)
      : 0;
    skyColor.lerp(SUNSET_SKY, twilight * 0.62);
  }
  scene.background.copy(skyColor);
  scene.fog.color.copy(skyColor);

  if (daytime) {
    const angle = phase * Math.PI;
    sunDisk.position.set(Math.cos(angle) * 350, 18 + elevation * 255, -210);
    sunLight.position.copy(sunDisk.position).multiplyScalar(0.35);
    sunDisk.material.opacity = THREE.MathUtils.smoothstep(elevation, 0, 0.12);
    moonDisk.material.opacity = 0;
  } else {
    const angle = phase * Math.PI;
    moonDisk.position.set(Math.cos(angle) * 350, 20 + elevation * 235, 205);
    moonLight.position.copy(moonDisk.position).multiplyScalar(0.35);
    moonDisk.material.opacity = THREE.MathUtils.smoothstep(elevation, 0, 0.12);
    sunDisk.material.opacity = 0;
  }
  sunLight.intensity = 0.05 + daylight * 2.65;
  sunLight.color.set(daylight < 0.35 ? 0xffad72 : 0xffffff);
  moonLight.intensity = nightStrength * elevation * 0.48;
  hemisphereLight.intensity = 0.16 + daylight * 2.04 + nightStrength * 0.08;
  hemisphereLight.color.set(daylight > 0.35 ? 0xf7fbff : 0x819bd2);
  starField.material.opacity = nightStrength * (0.62 + elevation * 0.38);
  starField.rotation.y += dt * 0.004;

  const botHeadlightsOn = nightStrength > 0.38;
  if (botHeadlightsOn !== state.botHeadlightsOn) {
    state.botHeadlightsOn = botHeadlightsOn;
    updateVehicleHeadlights(botHeadlightsOn);
  }
  updateStreetLights(botHeadlightsOn);
  updateBotHeadlightPool(botHeadlightsOn);
}

function setGameTime(hour, minute = 0) {
  let hours = Number(hour);
  let minutes = Number(minute);
  if (typeof hour === "string") {
    const match = hour.trim().match(/^(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?$/i);
    if (!match) throw new TypeError('Use setGameTime(20), setGameTime(20, 30), or setGameTime("8:00 PM").');
    hours = Number(match[1]);
    minutes = Number(match[2] || 0);
    const suffix = match[3]?.toLowerCase();
    if (suffix) {
      hours %= 12;
      if (suffix === "pm") hours += 12;
    }
  }
  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 0 || hours >= 24 || minutes < 0 || minutes >= 60) {
    throw new RangeError("Time must be between 00:00 and 23:59.");
  }
  const decimalHours = hours + minutes / 60;
  if (decimalHours >= 6 && decimalHours < 18) {
    state.skyTime = ((decimalHours - 6) / 12) * DAY_DURATION;
  } else {
    const hoursAfterSixPm = decimalHours >= 18 ? decimalHours - 18 : decimalHours + 6;
    state.skyTime = DAY_DURATION + (hoursAfterSixPm / 12) * NIGHT_DURATION;
  }
  updateDayNightCycle(0);
  updateHud();
  return formatGameClock();
}

function formatGameClock() {
  const daytime = state.skyTime < DAY_DURATION;
  const phase = daytime
    ? state.skyTime / DAY_DURATION
    : (state.skyTime - DAY_DURATION) / NIGHT_DURATION;
  const totalHours = (daytime ? 6 + phase * 12 : 18 + phase * 12) % 24;
  const hours24 = Math.floor(totalHours);
  const minutes = Math.floor((totalHours - hours24) * 60);
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function updateVehicleHeadlights(nightActive) {
  for (const car of cars) {
    const active = car.userData.player ? state.playerHeadlights : nightActive;
    setCarHeadlights(car, active);
    for (const beam of car.userData.headlightBeams || []) beam.visible = active && car === state.player;
  }
}

function setCarHeadlights(car, active) {
  for (const lamp of car.userData.headlights || []) {
    lamp.material.emissiveIntensity = active ? 9.5 : 0.12;
    lamp.material.color.set(active ? 0xfff9d9 : 0xb9b59f);
  }
}

function updateBotHeadlightPool(active) {
  if (!active) {
    for (const entry of botHeadlightPool) entry.light.visible = false;
    return;
  }
  if (state.time >= state.nextBotHeadlightRefresh) {
    state.nextBotHeadlightRefresh = state.time + 0.35;
    const playerPosition = state.player.position;
    const nearestBots = cars
      .filter((car) => !car.userData.player && car.visible && !car.userData.waitingForEntry && !car.userData.immobilized && !car.userData.destroyed)
      .map((car) => ({ car, distance: car.position.distanceToSquared(playerPosition) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, botHeadlightPool.length);
    for (let i = 0; i < botHeadlightPool.length; i++) botHeadlightPool[i].car = nearestBots[i]?.car || null;
  }
  for (const entry of botHeadlightPool) {
    const car = entry.car;
    if (!car || !car.visible || car.userData.immobilized) {
      entry.light.visible = false;
      continue;
    }
    const forward = getForward(car).normalize();
    entry.light.position.copy(car.position).addScaledVector(forward, 2.05);
    entry.light.position.y = 0.92;
    entry.target.position.copy(entry.light.position).addScaledVector(forward, 34);
    entry.target.position.y = 0.15;
    entry.light.visible = true;
  }
}

function updateStreetLights(active) {
  if (active !== state.streetLightsOn) {
    state.streetLightsOn = active;
    streetLightBulbMaterial.emissiveIntensity = active ? 7.5 : 0.05;
    streetLightBulbMaterial.color.set(active ? 0xfff0bd : 0x6f716b);
    if (!active) {
      for (const light of streetLightPool) light.visible = false;
    }
  }
  if (!active || state.time < state.nextStreetLightRefresh) return;
  state.nextStreetLightRefresh = state.time + 0.4;
  const playerPosition = state.player.position;
  const nearest = streetLights
    .map((fixture) => ({ fixture, distance: fixture.position.distanceToSquared(playerPosition) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, streetLightPool.length);
  for (let i = 0; i < streetLightPool.length; i++) {
    const light = streetLightPool[i];
    const fixture = nearest[i]?.fixture;
    if (!fixture) {
      light.visible = false;
      continue;
    }
    light.position.copy(fixture.position).add(new THREE.Vector3(0, -0.18, 0));
    light.intensity = 48;
    light.visible = true;
  }
}

function ensurePlayerHeadlightBeams(car) {
  if (car.userData.headlightBeams?.length) return;
  const target = new THREE.Object3D();
  target.position.set(0, 0.15, 38);
  car.add(target);
  const beams = [];
  for (const x of [-0.62, 0.62]) {
    const beam = new THREE.SpotLight(0xfff2c2, 115, 78, Math.PI / 7, 0.42, 1.2);
    beam.position.set(x, 0.86, 2.18);
    beam.target = target;
    beam.castShadow = false;
    beam.visible = false;
    car.add(beam);
    beams.push(beam);
  }
  car.userData.headlightBeams = beams;
}

function animate() {
  requestAnimationFrame(animate);
  const rawDelta = clock.getDelta();
  const dt = Math.min(rawDelta, 0.045);
  updateFpsReading(rawDelta);
  if (state.introActive) {
    updateCamera(dt);
    renderer.render(scene, camera);
    return;
  }
  if (state.settingsOpen) {
    renderer.render(scene, camera);
    return;
  }
  state.time += dt;
  updateDayNightCycle(dt);
  updateTrafficLights();
  updateCrashPhysics(dt);
  updateExplosionTumbles(dt);
  updatePieceCarPushes();
  updateDamagePieces(dt);
  updateWeaponEffects(dt);
  updateGrenades(dt);
  updateRockets(dt);
  updateSolarFireballs(dt);
  updateExhaustSmoke(dt);
  updatePlayer(dt);
  updatePedestrian(dt);
  updatePoliceFlashlight();
  updateNpcPedestrians(dt);
  updateBlastPedestrians(dt);
  updateCarDoor(dt);
  updateBuildingCrashHelper(dt);
  updateCrashMeeting(dt);
  updateBots(dt);
  updateReverseCrossTrafficWarning();
  updateBlindSpotWarnings();
  updatePoliceMode(dt);
  updateEngineSounds(dt);
  updateTrafficSpawns();
  updateDriverReactions(dt);
  updateCollisions(dt);
  updateSignals(dt);
  updateCamera(dt);
  updateGrenadeChargeMeter();
  updateHud();
  if (state.securityRoom) renderSecurityFeeds();
  else renderDrivingScene();
}

function updateFpsReading(delta) {
  state.fpsFrames += 1;
  state.fpsElapsed += delta;
  if (state.fpsElapsed < 0.5) return;
  const fps = Math.round(state.fpsFrames / state.fpsElapsed);
  fpsReadingEl.value = `${fps} FPS`;
  fpsReadingEl.textContent = `${fps} FPS`;
  state.fpsFrames = 0;
  state.fpsElapsed = 0;
}

function openSettings() {
  if (state.introActive) return;
  state.settingsOpen = true;
  settingsOverlayEl.hidden = false;
  keys.clear();
  state.toggleHeld.clear();
  state.policeTriggerHeld = false;
  stopPlayerHorn();
  if (document.pointerLockElement === renderer.domElement) document.exitPointerLock?.();
}

function closeSettings() {
  state.settingsOpen = false;
  settingsOverlayEl.hidden = true;
  clock.getDelta();
  renderer.domElement.focus();
}

function applyQualitySetting() {
  const quality = qualitySettingEl.value;
  state.quality = quality;
  const deviceRatio = window.devicePixelRatio || 1;
  const pixelRatio = quality === "low" ? 1 : quality === "medium" ? Math.min(deviceRatio, 1.35) : Math.min(deviceRatio, 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.shadowMap.enabled = quality !== "low";
  renderer.shadowMap.autoUpdate = quality !== "low";
  const mirrorWidth = quality === "low" ? 128 : quality === "medium" ? 192 : 256;
  leftMirrorTarget.setSize(mirrorWidth, Math.round(mirrorWidth / 2));
  rightMirrorTarget.setSize(mirrorWidth, Math.round(mirrorWidth / 2));
  rearviewTarget.setSize(quality === "low" ? 180 : quality === "medium" ? 240 : 320, quality === "low" ? 58 : quality === "medium" ? 78 : 104);
  backupCameraTarget.setSize(quality === "low" ? 256 : quality === "medium" ? 384 : 512, quality === "low" ? 128 : quality === "medium" ? 192 : 256);
  for (const feed of securityCameras) {
    const width = quality === "low" ? 160 : quality === "medium" ? 240 : 320;
    feed.target.setSize(width, Math.round(width * 9 / 16));
  }
  onResize();
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
  if (state.backupCameraActive) {
    cockpit.userData.backupGuides.visible = true;
    backupCamera.position.copy(car.localToWorld(new THREE.Vector3(0, 1.05, -2.08)));
    backupCamera.lookAt(car.localToWorld(new THREE.Vector3(0, 0.12, -18)));
    renderer.setRenderTarget(backupCameraTarget);
    renderer.clear();
    renderer.render(scene, backupCamera);
    cockpit.userData.backupGuides.visible = false;
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
  const throttle = keys.has("arrowup") ? 1 : 0;
  const brakeKey = keys.has("arrowdown") ? 1 : 0;
  const gearDirection = state.gear === "reverse" ? -1 : 1;
  if (data.player && data.immobilized && !data.destroyed && state.playerCrashed && (throttle || brakeKey) && !state.onFoot) {
    data.immobilized = false;
    data.limpMode = true;
    statusEl.textContent = "Wrecked car moving in limp mode — reduced power and unstable handling";
  }
  if (data.immobilized || data.crashed || state.onFoot || state.carTransition) {
    data.revRatio = moveToward(data.revRatio || 0, 0, dt * 4.5);
    return;
  }

  const damage = data.limpMode ? THREE.MathUtils.clamp(data.driveDamage || 0.35, 0.35, 1) : 0;
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
  const damagedPull = damage
    ? (data.damagePull || 1) * damage * 0.12 + Math.sin(state.time * 2.4) * damage * 0.1
    : 0;
  data.steer = moveToward(data.steer, THREE.MathUtils.clamp(steerInput + damagedPull, -1, 1), dt * (4.8 - damage * 1.9));
  data.driftRatio = moveToward(data.driftRatio || 0, handbrake ? 1 : 0, dt * (handbrake ? 4.2 : 2.6));

  const damagedPowerPulse = damage ? 0.48 + (Math.sin(state.time * 7.2) * 0.5 + 0.5) * 0.3 : 1;
  const accel = stationaryRev ? 0 : throttle * 18 * (1 - damage * 0.62) * damagedPowerPulse;
  const brake = stationaryRev ? 0 : brakeKey * 34 * (1 - damage * 0.38);
  const drag = 4.2 + Math.abs(data.speed) * 0.1 + damage * 1.8;
  const changingDirection = throttle && data.speed * gearDirection < -0.2;
  data.braking = Boolean(brakeKey || changingDirection || (!throttle && Math.abs(data.speed) > 4));
  if (!stationaryRev) {
    if (changingDirection) data.speed = moveToward(data.speed, 0, 34 * dt);
    else data.speed += gearDirection * accel * dt;
    if (brakeKey) data.speed = moveToward(data.speed, 0, brake * dt);
  }
  if (!throttle && !brakeKey) data.speed -= Math.sign(data.speed) * drag * dt;
  if (Math.abs(data.speed) < 0.1) data.speed = 0;
  const damagedMaxSpeed = damage ? THREE.MathUtils.lerp(15, 7, damage) : data.maxSpeed;
  data.speed = THREE.MathUtils.clamp(data.speed, damage ? -5.5 : -11, damagedMaxSpeed);

  if (Math.abs(data.speed) > 0.4) {
    const speedFactor = THREE.MathUtils.clamp(Math.abs(data.speed) / data.maxSpeed, 0.18, 1);
    car.rotation.y += data.steer * dt * (1.18 + speedFactor * 1.25) * Math.sign(data.speed || 1);
    if (handbrake) car.rotation.y += data.steer * dt * 1.65 * speedFactor * Math.sign(data.speed);
  }

  const forward = getForward(car);
  const previous = car.position.clone();
  const desiredVelocity = forward.multiplyScalar(data.speed);
  if (data.velocity.lengthSq() < 0.01) data.velocity.copy(desiredVelocity);
  const grip = THREE.MathUtils.lerp(10, 0.85, data.driftRatio) * (1 - damage * 0.5);
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
  if (person.userData.blastFlight) return;
  const data = person.userData;
  const moveInput = (keys.has("arrowup") ? 1 : 0) - (keys.has("arrowdown") ? 1 : 0);
  const steerInput = state.policePistolDrawn
    ? 0
    : (keys.has("arrowleft") ? 1 : 0) - (keys.has("arrowright") ? 1 : 0);
  const targetSpeed = moveInput > 0 ? 4.8 : moveInput < 0 ? -2.8 : 0;
  data.speed = moveToward(data.speed, targetSpeed, dt * (moveInput ? 10 : 14));
  data.steer = moveToward(data.steer, steerInput, dt * 7);
  if (state.policePistolDrawn) person.rotation.y = state.policeAim.yaw;
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
    state.cockpitLook.lastMovedAt = -Infinity;
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
  state.cameraView = 2;
  state.gear = "drive";
  state.backupCameraActive = false;
  holsterPolicePistol();
  setPoliceFlashlight(false);
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
    if (data.blastFlight) continue;
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
    const backupGuides = cockpit.userData.backupGuides;
    if (backupGuides) {
      oldPlayer.remove(backupGuides);
      target.add(backupGuides);
      backupGuides.visible = false;
    }
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
  targetData.driveDamage = 0;
  targetData.damagePull = 0;
  targetData.limpMode = false;
  targetData.lastSafe = target.position.clone();
  targetData.braking = false;
  targetData.hazard = false;
  targetData.immobilized = false;

  state.player = target;
  ensurePlayerHeadlightBeams(target);
  state.onFoot = false;
  state.cameraView = 2;
  state.gear = "drive";
  state.backupCameraActive = false;
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

function togglePolicePistol() {
  if (!state.policeMode || !state.onFoot || state.securityRoom || state.carTransition) return;
  state.policePistolDrawn = !state.policePistolDrawn;
  state.policePistol.visible = state.policePistolDrawn && state.policeWeapon === "pistol";
  state.policeRpg.visible = state.policePistolDrawn && state.policeWeapon === "rpg";
  if (state.policePistolDrawn) {
    state.policeAim.yaw = state.pedestrian.rotation.y;
    state.policeAim.pitch = 0;
    statusEl.textContent = `${state.policeWeapon === "rpg" ? "RPG" : "Pistol"} drawn — E changes weapon · click to fire · P to holster`;
    renderer.domElement.requestPointerLock?.().catch?.(() => {});
  } else {
    document.exitPointerLock?.();
    statusEl.textContent = "Pistol holstered — third-person view";
  }
}

function holsterPolicePistol() {
  state.policePistolDrawn = false;
  state.policeAimZoom = 0;
  state.policeTriggerHeld = false;
  if (state.policePistol) state.policePistol.visible = false;
  if (state.policeRpg) state.policeRpg.visible = false;
  if (document.pointerLockElement === renderer.domElement) document.exitPointerLock?.();
}

function switchPoliceWeapon() {
  if (!state.policePistolDrawn) return;
  state.policeWeapon = state.policeWeapon === "pistol" ? "rpg" : "pistol";
  state.policeTriggerHeld = false;
  state.policePistol.visible = state.policeWeapon === "pistol";
  state.policeRpg.visible = state.policeWeapon === "rpg";
  statusEl.textContent = `${state.policeWeapon === "rpg" ? "RPG" : "Pistol"} selected — E changes weapon`;
}

function firePoliceRpg() {
  if (!state.policePistolDrawn || state.policeWeapon !== "rpg" || state.time - state.lastRpgShot < 0.9) return;
  state.lastRpgShot = state.time;
  const direction = camera.getWorldDirection(new THREE.Vector3()).normalize();
  const rocket = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.72, 10),
    new THREE.MeshStandardMaterial({ color: 0x59664a, roughness: 0.65, metalness: 0.25 }),
  );
  body.rotation.x = Math.PI / 2;
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.09, 0.24, 10),
    new THREE.MeshStandardMaterial({ color: 0x272c26, roughness: 0.55, metalness: 0.35 }),
  );
  nose.rotation.x = -Math.PI / 2;
  nose.position.z = -0.48;
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.11, 0.4, 8),
    new THREE.MeshBasicMaterial({ color: 0xffa12b, transparent: true, opacity: 0.9 }),
  );
  flame.rotation.x = Math.PI / 2;
  flame.position.z = 0.55;
  rocket.add(body, nose, flame);
  rocket.position.copy(camera.position).addScaledVector(direction, 1.3);
  rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);
  rocket.userData.ignoreBulletRay = true;
  city.add(rocket);
  rockets.push({ mesh: rocket, direction, speed: 48, bornAt: state.time });
  playPoliceShotSound();
  statusEl.textContent = "RPG fired";
}

function firePolicePistol(automatic = false) {
  const shotInterval = automatic ? 0.085 : 0.18;
  if (!state.policePistolDrawn || state.time - state.lastPoliceShot < shotInterval) return;
  state.lastPoliceShot = state.time;
  state.policePistol.userData.muzzle.visible = true;
  playPoliceShotSound();

  policeRaycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const sunHit = canHitSun() ? policeRaycaster.intersectObject(sunDisk, false)[0] : null;
  const hits = policeRaycaster.intersectObjects(city.children, true);
  let target = null;
  let surfaceHit = null;
  let hitPoint = camera.position.clone().addScaledVector(camera.getWorldDirection(new THREE.Vector3()), 90);
  for (const hit of hits) {
    if (hit.object.userData.ignoreBulletRay || !hit.face) continue;
    surfaceHit = hit;
    hitPoint = hit.point.clone();
    let car = hit.object;
    while (car.parent && !cars.includes(car)) car = car.parent;
    if (cars.includes(car) && !car.userData.player && car.visible && !car.userData.waitingForEntry) target = car;
    break;
  }
  if (sunHit && (!surfaceHit || sunHit.distance < surfaceHit.distance)) {
    createPoliceShotTracer(sunHit.point);
    destroySun();
    return;
  }
  createPoliceShotTracer(hitPoint);
  if (surfaceHit) createBulletHole(surfaceHit);
  if (!target) return;
  target.userData.policeShotHits = (target.userData.policeShotHits || 0) + 1;
  statusEl.textContent = `Vehicle hit ${target.userData.policeShotHits}/5`;
  if (target.userData.policeShotHits >= 5) explodePoliceShotCar(target);
}

function createBulletHole(hit) {
  const surface = hit.object;
  surface.updateWorldMatrix(true, false);
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(surface.matrixWorld);
  const worldNormal = hit.face.normal.clone().applyMatrix3(normalMatrix).normalize();
  const mark = new THREE.Group();
  mark.userData.ignoreBulletRay = true;

  const chippedEdge = new THREE.Mesh(
    new THREE.CircleGeometry(0.115, 9),
    new THREE.MeshBasicMaterial({
      color: 0x5b554d,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
  );
  const darkCenter = new THREE.Mesh(
    new THREE.CircleGeometry(0.067, 12),
    new THREE.MeshBasicMaterial({
      color: 0x080706,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    }),
  );
  chippedEdge.userData.ignoreBulletRay = true;
  darkCenter.userData.ignoreBulletRay = true;
  darkCenter.position.z = 0.003;
  mark.add(chippedEdge, darkCenter);
  mark.position.copy(hit.point).addScaledVector(worldNormal, 0.014);
  mark.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), worldNormal);
  city.add(mark);
  surface.attach(mark);
}

function createPoliceShotTracer(hitPoint) {
  const muzzle = state.policePistol.userData.muzzle;
  const start = muzzle.getWorldPosition(new THREE.Vector3());
  const geometry = new THREE.BufferGeometry().setFromPoints([start, hitPoint]);
  const line = new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ color: 0xffe58a, transparent: true, opacity: 0.9 }),
  );
  city.add(line);
  weaponEffects.push({ mesh: line, bornAt: state.time, duration: 0.07, kind: "tracer" });
}

function explodePoliceShotCar(car) {
  const data = car.userData;
  data.policeShotHits = 0;
  data.speed = 0;
  data.velocity.set(0, 0, 0);
  data.angularVelocity = 0;
  data.crashed = false;
  data.immobilized = true;
  data.braking = true;
  data.hazard = true;
  data.policePullOver = null;
  data.policeRelease = null;
  data.explosionTumble = {
    startedAt: state.time,
    startX: car.rotation.x,
    startZ: car.rotation.z,
    startY: car.position.y,
    exposure: 1,
    axisX: THREE.MathUtils.randFloat(0.82, 1),
    axisZ: THREE.MathUtils.randFloatSpread(0.7),
    direction: Math.random() < 0.5 ? -1 : 1,
  };
  if (state.policeTarget === car) state.policeTarget = null;
  const shotDirection = camera.getWorldDirection(new THREE.Vector3());
  spawnCollisionDamage(car, shotDirection.clone().multiplyScalar(-1), shotDirection.multiplyScalar(18), 26);
  playExplosionSound();
  if (data.body?.material?.color) data.body.material.color.lerp(new THREE.Color(0x151515), 0.72);
  const explosionOrigin = car.position.clone().add(new THREE.Vector3(0, 1.05, 0));
  createVehicleExplosion(explosionOrigin);
  damageCarsNearExplosion(explosionOrigin, car);
  damagePedestriansNearExplosion(explosionOrigin);
  statusEl.textContent = "Vehicle disabled";
}

function damageCarsNearExplosion(origin, sourceCar) {
  const blastRadius = 12;
  for (const nearby of collidableCars) {
    if (nearby === sourceCar || !nearby.visible || nearby.userData.waitingForEntry) continue;
    const blastOffset = nearby.position.clone().add(new THREE.Vector3(0, 0.8, 0)).sub(origin);
    if (Math.abs(blastOffset.y) > 5.5) continue;
    const horizontalDistance = Math.hypot(blastOffset.x, blastOffset.z);
    if (horizontalDistance >= blastRadius) continue;
    const exposure = 1 - horizontalDistance / blastRadius;
    if (exposure < 0.08) continue;
    const outward = new THREE.Vector3(blastOffset.x, 0, blastOffset.z);
    if (outward.lengthSq() > 0.0025) outward.normalize();
    else outward.set(1, 0, 0);
    const impulseSpeed = exposure * 22;
    const blastVelocity = outward.clone().multiplyScalar(impulseSpeed);
    const damageStrength = exposure * 29;
    spawnCollisionDamage(nearby, outward.clone().multiplyScalar(-1), blastVelocity, damageStrength);

    const data = nearby.userData;
    data.hazard = true;
    data.braking = true;
    data.policePullOver = null;
    data.policeRelease = null;
    if (state.policeTarget === nearby) state.policeTarget = null;
    data.policeShotHits = (data.policeShotHits || 0) + Math.max(1, Math.round(exposure * 3));
    data.explosionTumble = {
      startedAt: state.time,
      startX: nearby.rotation.x,
      startZ: nearby.rotation.z,
      startY: nearby.position.y,
      exposure,
      axisX: THREE.MathUtils.randFloat(0.72, 1),
      axisZ: THREE.MathUtils.randFloatSpread(0.8),
      direction: Math.random() < 0.5 ? -1 : 1,
    };
    if (data.player) {
      data.driveDamage = THREE.MathUtils.clamp((data.driveDamage || 0) + exposure * 0.72, 0, 1);
      data.damagePull = Math.sign(outward.x || 1);
      state.playerCrashed = exposure > 0.48;
      state.crashed = true;
      if (state.playerCrashed) restartBtn.hidden = false;
    }

    if (exposure > 0.78) {
      data.speed = 0;
      data.velocity.set(0, 0, 0);
      data.angularVelocity = 0;
      data.crashed = false;
      data.immobilized = true;
    } else {
      startCrashSlide(nearby, blastVelocity, THREE.MathUtils.randFloatSpread(1.8) * exposure);
    }
  }
}

function updateExplosionTumbles() {
  for (const car of collidableCars) {
    const tumble = car.userData.explosionTumble;
    if (!tumble) continue;
    const age = state.time - tumble.startedAt;
    const flipDuration = 0.72;
    const totalDuration = 3.15;
    const startX = tumble.startX || 0;
    const startZ = tumble.startZ || 0;
    const startY = tumble.startY || 0;
    const finalRoll = startZ + tumble.direction * (tumble.exposure > 0.52 ? Math.PI * 1.5 : Math.PI * (0.55 + tumble.exposure * 0.35));
    const finalPitch = startX + tumble.axisZ * 0.22;
    const wreckHeight = Math.max(startY, 0.62 + tumble.exposure * 0.22);
    if (age >= totalDuration) {
      car.rotation.x = finalPitch;
      car.rotation.z = finalRoll;
      car.position.y = wreckHeight;
      car.userData.explosionTumble = null;
      continue;
    }
    if (age < flipDuration) {
      const progress = age / flipDuration;
      const eased = progress * progress * (3 - 2 * progress);
      car.rotation.x = THREE.MathUtils.lerp(startX, finalPitch, eased);
      car.rotation.z = THREE.MathUtils.lerp(startZ, finalRoll, eased);
      car.position.y = THREE.MathUtils.lerp(startY, wreckHeight, eased)
        + Math.sin(progress * Math.PI) * (0.65 + tumble.exposure * 2.15);
      continue;
    }
    const settleProgress = (age - flipDuration) / (totalDuration - flipDuration);
    const decay = Math.pow(1 - settleProgress, 2.2);
    const wobble = Math.sin((age - flipDuration) * 12.5) * decay * (0.22 + tumble.exposure * 0.5);
    car.rotation.x = finalPitch + wobble * tumble.axisX * 0.28;
    car.rotation.z = finalRoll + wobble * 0.36;
    car.position.y = wreckHeight + Math.abs(wobble) * 0.16;
  }
}

function damagePedestriansNearExplosion(origin) {
  const people = [];
  if (state.onFoot && state.pedestrian?.visible) people.push(state.pedestrian);
  for (const person of npcPedestrians) if (person.visible) people.push(person);
  for (const responder of crashResponders) if (responder.person?.visible) people.push(responder.person);
  if (state.buildingHelper?.person?.visible) people.push(state.buildingHelper.person);
  for (const driver of hijackedDrivers) if (driver.visible) people.push(driver);

  for (const person of new Set(people)) {
    const blastOffset = person.position.clone().add(new THREE.Vector3(0, 0.9, 0)).sub(origin);
    if (Math.abs(blastOffset.y) > 6.5) continue;
    const horizontalDistance = Math.hypot(blastOffset.x, blastOffset.z);
    if (horizontalDistance >= 15) continue;
    const exposure = 1 - horizontalDistance / 15;
    if (exposure < 0.08) continue;
    const direction = new THREE.Vector3(blastOffset.x, 0, blastOffset.z);
    if (direction.lengthSq() > 0.0025) direction.normalize();
    else direction.set(1, 0, 0);
    person.userData.speed = 0;
    person.userData.velocity = direction.multiplyScalar(3.5 + exposure * 8.5);
    person.userData.blastFlight = {
      startedAt: state.time,
      exposure,
      side: Math.random() < 0.5 ? -1 : 1,
      baseY: person.position.y,
      baseYaw: person.rotation.y,
      duration: 0.8 + exposure * 0.5,
      spinX: THREE.MathUtils.randFloat(2.2, 3.6) * Math.PI * 2,
      spinY: THREE.MathUtils.randFloat(0.8, 1.8) * Math.PI * 2,
      spinZ: THREE.MathUtils.randFloat(1.7, 3.1) * Math.PI * 2,
    };
  }
}

function updateBlastPedestrians(dt) {
  const people = [];
  if (state.pedestrian) people.push(state.pedestrian);
  people.push(...npcPedestrians, ...hijackedDrivers);
  for (const responder of crashResponders) if (responder.person) people.push(responder.person);

  for (const person of new Set(people)) {
    const flight = person.userData.blastFlight;
    if (!flight) continue;
    const age = state.time - flight.startedAt;
    const velocity = person.userData.velocity;
    const progress = THREE.MathUtils.clamp(age / flight.duration, 0, 1);
    if (progress < 1) {
      person.position.addScaledVector(velocity, dt);
      velocity.multiplyScalar(Math.max(0, 1 - dt * 1.85));
      const airborne = Math.sin(progress * Math.PI);
      const groundBlend = THREE.MathUtils.smoothstep(progress, 0.82, 1);
      person.position.y = flight.baseY + airborne * (1.4 + flight.exposure * 3.1) + groundBlend * 0.76;
      person.rotation.x = progress * flight.spinX * flight.side;
      person.rotation.y = flight.baseYaw + progress * flight.spinY * flight.side;
      person.rotation.z = progress * flight.spinZ * -flight.side;
      if (person.userData.leftArm) person.userData.leftArm.rotation.x = airborne * 1.25;
      if (person.userData.rightArm) person.userData.rightArm.rotation.x = -airborne * 1.1;
      if (person.userData.leftLeg) person.userData.leftLeg.rotation.x = -airborne * 0.62;
      if (person.userData.rightLeg) person.userData.rightLeg.rotation.x = airborne * 0.72;
      continue;
    }
    const downDuration = 1;
    const getUpDuration = 0.68;
    const groundedAge = age - flight.duration;
    velocity.set(0, 0, 0);
    if (flight.landedX === undefined) {
      const wrapAngle = (angle) => THREE.MathUtils.euclideanModulo(angle + Math.PI, Math.PI * 2) - Math.PI;
      flight.landedX = wrapAngle(person.rotation.x);
      flight.landedYaw = flight.baseYaw + wrapAngle(person.rotation.y - flight.baseYaw);
      flight.landedZ = wrapAngle(person.rotation.z);
      flight.landedY = flight.baseY + 0.76;
    }
    if (groundedAge < downDuration) {
      person.position.y = flight.landedY;
      person.rotation.x = flight.landedX;
      person.rotation.y = flight.landedYaw;
      person.rotation.z = flight.landedZ;
      continue;
    }
    const getUpProgress = THREE.MathUtils.clamp((groundedAge - downDuration) / getUpDuration, 0, 1);
    const standBlend = getUpProgress * getUpProgress * (3 - 2 * getUpProgress);
    person.position.y = THREE.MathUtils.lerp(flight.landedY, flight.baseY, standBlend);
    person.rotation.x = THREE.MathUtils.lerp(flight.landedX, 0, standBlend);
    person.rotation.y = THREE.MathUtils.lerp(flight.landedYaw, flight.baseYaw, standBlend);
    person.rotation.z = THREE.MathUtils.lerp(flight.landedZ, 0, standBlend);
    if (getUpProgress < 1) continue;
    person.rotation.x = 0;
    person.rotation.y = flight.baseYaw;
    person.rotation.z = 0;
    person.position.y = flight.baseY;
    if (person.userData.leftArm) person.userData.leftArm.rotation.x = 0;
    if (person.userData.rightArm) person.userData.rightArm.rotation.x = 0;
    if (person.userData.leftLeg) person.userData.leftLeg.rotation.x = 0;
    if (person.userData.rightLeg) person.userData.rightLeg.rotation.x = 0;
    person.userData.blastFlight = null;
  }
}

function createVehicleExplosion(origin) {
  const addEffect = (mesh, duration, kind, velocity = null) => {
    mesh.position.copy(origin);
    city.add(mesh);
    weaponEffects.push({ mesh, bornAt: state.time, duration, kind, velocity });
  };
  const fireball = new THREE.Mesh(
    new THREE.SphereGeometry(1, 20, 14),
    new THREE.MeshBasicMaterial({ color: 0xffc33b, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  fireball.renderOrder = 3;
  addEffect(fireball, 0.9, "fireball");
  const fireCore = new THREE.Mesh(
    new THREE.SphereGeometry(1, 18, 12),
    new THREE.MeshBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  fireCore.renderOrder = 4;
  addEffect(fireCore, 0.62, "fireCore");
  const smoke = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0x25282a, transparent: true, opacity: 0, depthWrite: false }),
  );
  smoke.renderOrder = 2;
  addEffect(smoke, 1.55, "smoke");
  const shockwave = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.09, 8, 32),
    new THREE.MeshBasicMaterial({ color: 0xffd46a, transparent: true, opacity: 0.8, depthWrite: false }),
  );
  shockwave.rotation.x = Math.PI / 2;
  addEffect(shockwave, 0.55, "shockwave");
  for (let i = 0; i < 18; i++) {
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.055 + Math.random() * 0.055, 6, 4),
      new THREE.MeshBasicMaterial({ color: i % 3 ? 0xff8a22 : 0xffe48a, transparent: true, opacity: 1 }),
    );
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 9;
    const velocity = new THREE.Vector3(Math.cos(angle) * speed, 3 + Math.random() * 8, Math.sin(angle) * speed);
    addEffect(spark, 0.65 + Math.random() * 0.45, "spark", velocity);
  }
}

function destroySun() {
  if (state.sunDestroyed) return;
  const origin = sunDisk.getWorldPosition(new THREE.Vector3());
  state.sunDestroyed = true;
  state.destroyedSunPosition.copy(origin);
  state.nextSolarFireballAt = state.time + 0.3;
  sunDisk.visible = false;
  const burst = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1, 4),
    new THREE.MeshBasicMaterial({ color: 0xff5a08, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  burst.position.copy(origin);
  city.add(burst);
  weaponEffects.push({ mesh: burst, bornAt: state.time, duration: 4.2, kind: "sunBurst" });
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1, 3),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  core.position.copy(origin);
  city.add(core);
  weaponEffects.push({ mesh: core, bornAt: state.time, duration: 2.4, kind: "sunCore" });

  const shockwave = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 20),
    new THREE.MeshBasicMaterial({
      color: 0xffd36a,
      transparent: true,
      opacity: 0.9,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  shockwave.position.copy(origin);
  city.add(shockwave);
  weaponEffects.push({ mesh: shockwave, bornAt: state.time, duration: 2.2, kind: "sunShockwave" });

  for (let i = 0; i < 24; i++) {
    const cloud = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1, 2),
      new THREE.MeshBasicMaterial({
        color: [0xff2d00, 0xff6508, 0xffa51c, 0xffd85a][i % 4],
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    const direction = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(1),
      THREE.MathUtils.randFloatSpread(1),
      THREE.MathUtils.randFloatSpread(1),
    ).normalize();
    cloud.position.copy(origin).addScaledVector(direction, THREE.MathUtils.randFloat(5, 22));
    city.add(cloud);
    weaponEffects.push({
      mesh: cloud,
      bornAt: state.time,
      duration: THREE.MathUtils.randFloat(3.2, 4.8),
      kind: "sunFireCloud",
      velocity: direction.multiplyScalar(THREE.MathUtils.randFloat(5, 14)),
      maxScale: THREE.MathUtils.randFloat(35, 72),
      phase: Math.random() * Math.PI * 2,
    });
  }

  for (let i = 0; i < 72; i++) {
    const fragment = new THREE.Mesh(
      new THREE.SphereGeometry(0.7 + Math.random() * 1.5, 8, 6),
      new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffaa22 : 0xffe37a, transparent: true, opacity: 1 }),
    );
    fragment.position.copy(origin);
    const velocity = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(120),
      THREE.MathUtils.randFloatSpread(120),
      THREE.MathUtils.randFloatSpread(120),
    );
    city.add(fragment);
    weaponEffects.push({ mesh: fragment, bornAt: state.time, duration: 3 + Math.random() * 2, kind: "sunFragment", velocity });
  }
  playExplosionSound();
  updateDayNightCycle(0);
  statusEl.textContent = "The sun exploded — permanent night · fireballs incoming";
}

function getSolarFlameTexture(index) {
  const variant = index % 4;
  if (solarFlameTextures[variant]) return solarFlameTextures[variant];
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const offset = (variant - 1.5) * 7;
  const outer = context.createLinearGradient(0, 250, 0, 8);
  outer.addColorStop(0, "rgba(255,45,5,0)");
  outer.addColorStop(0.08, "rgba(255,65,8,0.92)");
  outer.addColorStop(0.45, "rgba(255,132,12,0.8)");
  outer.addColorStop(0.78, "rgba(255,90,6,0.38)");
  outer.addColorStop(1, "rgba(255,45,0,0)");
  context.fillStyle = outer;
  context.beginPath();
  context.moveTo(13, 248);
  context.bezierCurveTo(4, 192, 34 + offset, 166, 28 + offset, 112);
  context.bezierCurveTo(24 + offset, 74, 60 + offset, 58, 65 + offset, 10);
  context.bezierCurveTo(91 + offset, 69, 103 - offset, 101, 91 - offset, 139);
  context.bezierCurveTo(119, 178, 124, 220, 115, 248);
  context.closePath();
  context.fill();
  const inner = context.createLinearGradient(0, 236, 0, 72);
  inner.addColorStop(0, "rgba(255,255,190,0)");
  inner.addColorStop(0.16, "rgba(255,246,150,0.95)");
  inner.addColorStop(0.62, "rgba(255,183,45,0.7)");
  inner.addColorStop(1, "rgba(255,120,10,0)");
  context.fillStyle = inner;
  context.beginPath();
  context.moveTo(38, 238);
  context.bezierCurveTo(28, 192, 54 - offset, 164, 56 + offset, 91);
  context.bezierCurveTo(79 + offset, 132, 96, 183, 88, 238);
  context.closePath();
  context.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  solarFlameTextures[variant] = texture;
  return texture;
}

function spawnSolarFireball() {
  const radius = THREE.MathUtils.randFloat(0.8, 1.65);
  const fireball = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.DodecahedronGeometry(radius * 0.62, 1),
    new THREE.MeshStandardMaterial({ color: 0x38130a, emissive: 0xff5217, emissiveIntensity: 3.8, roughness: 0.92 }),
  );
  fireball.add(core);
  const flames = [];
  for (let i = 0; i < 9; i++) {
    const length = radius * THREE.MathUtils.randFloat(2.3, 6.8);
    const width = radius * THREE.MathUtils.randFloat(0.75, 1.65);
    const flame = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: getSolarFlameTexture(i),
        color: 0xffffff,
        transparent: true,
        opacity: THREE.MathUtils.randFloat(0.5, 0.92),
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    const baseX = THREE.MathUtils.randFloatSpread(radius * 0.75);
    const baseZ = THREE.MathUtils.randFloatSpread(radius * 0.75);
    flame.position.set(baseX, radius * 0.15 + length / 2, baseZ);
    flame.userData.baseX = baseX;
    flame.userData.baseZ = baseZ;
    flame.userData.baseY = flame.position.y;
    flame.userData.phase = Math.random() * Math.PI * 2;
    flame.userData.baseOpacity = flame.material.opacity;
    flame.userData.baseWidth = width;
    flame.userData.baseHeight = length;
    flame.scale.set(width, length, 1);
    flames.push(flame);
    fireball.add(flame);
  }
  const target = new THREE.Vector3(
    THREE.MathUtils.randFloatSpread(BOUNDS * 1.8),
    radius * 0.45,
    THREE.MathUtils.randFloatSpread(BOUNDS * 1.8),
  );
  const sourceSpread = new THREE.Vector3(
    THREE.MathUtils.randFloatSpread(18),
    THREE.MathUtils.randFloatSpread(12),
    THREE.MathUtils.randFloatSpread(18),
  );
  fireball.position.copy(state.destroyedSunPosition).add(sourceSpread);
  const velocity = target.sub(fireball.position).normalize().multiplyScalar(THREE.MathUtils.randFloat(62, 78));
  city.add(fireball);
  solarFireballs.push({
    mesh: fireball,
    radius,
    core,
    flames,
    velocity,
  });
}

function updateSolarFireballs(dt) {
  if (!state.sunDestroyed) return;
  if (state.time >= state.nextSolarFireballAt && solarFireballs.length < 16) {
    spawnSolarFireball();
    state.nextSolarFireballAt = state.time + THREE.MathUtils.randFloat(0.28, 0.62);
  }
  for (let i = solarFireballs.length - 1; i >= 0; i--) {
    const fireball = solarFireballs[i];
    fireball.mesh.position.addScaledVector(fireball.velocity, dt);
    const trailDirection = fireball.velocity.clone().normalize().negate();
    fireball.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), trailDirection);
    fireball.core.rotation.x += dt * 3.4;
    fireball.core.rotation.z += dt * 2.7;
    for (const flame of fireball.flames) {
      const flicker = Math.sin(state.time * 15 + flame.userData.phase);
      flame.scale.x = flame.userData.baseWidth * (0.82 + flicker * 0.16);
      flame.scale.y = flame.userData.baseHeight * (0.9 + flicker * 0.22);
      flame.scale.z = 1;
      flame.position.x = flame.userData.baseX + Math.sin(state.time * 10 + flame.userData.phase) * fireball.radius * 0.16;
      flame.position.z = flame.userData.baseZ + Math.cos(state.time * 11 + flame.userData.phase) * fireball.radius * 0.16;
      flame.position.y = flame.userData.baseY + flicker * fireball.radius * 0.22;
      flame.material.opacity = THREE.MathUtils.clamp(flame.userData.baseOpacity + flicker * 0.16, 0.28, 1);
    }
    let impact = fireball.mesh.position.y <= fireball.radius * 0.55;
    if (!impact) {
      impact = collidableCars.some((car) =>
        car.visible && !car.userData.waitingForEntry && fireball.mesh.position.distanceToSquared(car.position) < (CAR_RADIUS + fireball.radius) ** 2,
      );
    }
    if (!impact) continue;
    const origin = fireball.mesh.position.clone();
    origin.y = Math.max(0.55, origin.y);
    city.remove(fireball.mesh);
    fireball.mesh.traverse((part) => {
      part.geometry?.dispose();
      part.material?.dispose();
    });
    solarFireballs.splice(i, 1);
    createSolarFire(origin);
  }
  updateSolarFires(dt);
}

function createSolarFire(origin) {
  const fire = new THREE.Group();
  fire.position.copy(origin);
  fire.position.y = 0.2;
  const scorch = new THREE.Mesh(
    new THREE.CircleGeometry(THREE.MathUtils.randFloat(2.8, 4.2), 30),
    new THREE.MeshBasicMaterial({ color: 0x160c08, transparent: true, opacity: 0.78, depthWrite: false }),
  );
  scorch.rotation.x = -Math.PI / 2;
  scorch.position.set(origin.x, 0.18, origin.z);
  scorch.rotation.z = Math.random() * Math.PI;
  city.add(scorch);
  solarScorches.push(scorch);
  if (solarScorches.length > 40) {
    const oldest = solarScorches.shift();
    city.remove(oldest);
    oldest.geometry.dispose();
    oldest.material.dispose();
  }
  const ember = new THREE.Mesh(
    new THREE.CircleGeometry(3.2, 28),
    new THREE.MeshBasicMaterial({ color: 0xb92f0c, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  ember.rotation.x = -Math.PI / 2;
  ember.position.y = 0.025;
  ember.scale.setScalar(0.28);
  fire.add(ember);
  const fireLight = new THREE.PointLight(0xff6a1a, 0, 22, 1.5);
  fireLight.position.y = 1.7;
  fire.add(fireLight);
  for (let i = 0; i < 6; i++) {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(THREE.MathUtils.randFloat(0.12, 0.34), 0),
      new THREE.MeshStandardMaterial({ color: 0x24130d, emissive: 0x7a1708, emissiveIntensity: 0.45, roughness: 1 }),
    );
    const angle = Math.random() * Math.PI * 2;
    const distance = THREE.MathUtils.randFloat(0.55, 2.4);
    rock.position.set(Math.cos(angle) * distance, 0.13, Math.sin(angle) * distance);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    fire.add(rock);
  }
  const flames = [];
  for (let i = 0; i < 13; i++) {
    const height = THREE.MathUtils.randFloat(1.4, 4.8);
    const width = THREE.MathUtils.randFloat(0.75, 1.7);
    const flame = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: getSolarFlameTexture(i + 1),
        color: 0xffffff,
        transparent: true,
        opacity: THREE.MathUtils.randFloat(0.55, 0.94),
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 2.2;
    flame.position.set(Math.cos(angle) * distance, height / 2, Math.sin(angle) * distance);
    flame.userData.baseX = flame.position.x;
    flame.userData.baseY = flame.position.y;
    flame.userData.baseZ = flame.position.z;
    flame.userData.baseOpacity = flame.material.opacity;
    flame.userData.phase = Math.random() * Math.PI * 2;
    flame.userData.baseWidth = width;
    flame.userData.baseHeight = height;
    flame.scale.set(width * 0.04, height * 0.04, 1);
    flames.push(flame);
    fire.add(flame);
  }
  const smoke = [];
  for (let i = 0; i < 5; i++) {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(0.65 + i * 0.14, 10, 7),
      new THREE.MeshBasicMaterial({ color: 0x292725, transparent: true, opacity: 0.32, depthWrite: false }),
    );
    puff.position.set(THREE.MathUtils.randFloatSpread(1.2), 2.8 + i * 0.75, THREE.MathUtils.randFloatSpread(1.2));
    puff.userData.baseY = puff.position.y;
    puff.userData.phase = Math.random() * Math.PI * 2;
    smoke.push(puff);
    fire.add(puff);
  }
  spawnSolarImpactEmbers(origin);
  playSolarImpactSound();
  city.add(fire);
  solarFires.push({ mesh: fire, ember, fireLight, flames, smoke, bornAt: state.time, duration: THREE.MathUtils.randFloat(10, 15) });
  for (let i = 0; i < solarFires.length; i++) solarFires[i].fireLight.visible = i >= solarFires.length - 8;
}

function spawnSolarImpactEmbers(origin) {
  for (let i = 0; i < 24; i++) {
    const ember = new THREE.Mesh(
      new THREE.SphereGeometry(THREE.MathUtils.randFloat(0.035, 0.11), 6, 4),
      new THREE.MeshBasicMaterial({ color: i % 3 ? 0xff7a18 : 0xffdf72, transparent: true, opacity: 1, depthWrite: false }),
    );
    ember.position.copy(origin).add(new THREE.Vector3(0, 0.35, 0));
    const angle = Math.random() * Math.PI * 2;
    const speed = THREE.MathUtils.randFloat(3, 12);
    city.add(ember);
    solarImpactEmbers.push({
      mesh: ember,
      velocity: new THREE.Vector3(Math.cos(angle) * speed, THREE.MathUtils.randFloat(3.5, 11), Math.sin(angle) * speed),
      bornAt: state.time,
      duration: THREE.MathUtils.randFloat(0.7, 1.5),
    });
  }
}

function updateSolarFires(dt) {
  for (let i = solarFires.length - 1; i >= 0; i--) {
    const fire = solarFires[i];
    const age = state.time - fire.bornAt;
    const smolder = THREE.MathUtils.smoothstep(age, 0, 1.25);
    const growth = THREE.MathUtils.smoothstep(age, 0.9, 3.8);
    const fade = THREE.MathUtils.clamp((fire.duration - age) / 1.8, 0, 1);
    const flameStrength = (0.035 + growth * 0.965) * fade;
    fire.ember.scale.setScalar((0.28 + growth * 0.72) * fade);
    fire.ember.material.opacity = (0.1 + smolder * 0.12 + growth * 0.2) * fade;
    fire.fireLight.intensity = (8 + growth * 42) * fade * (0.88 + Math.sin(state.time * 17 + fire.bornAt) * 0.12);
    for (const flame of fire.flames) {
      const flicker = Math.sin(state.time * 13 + flame.userData.phase);
      flame.scale.set(
        flame.userData.baseWidth * (0.86 + flicker * 0.15) * flameStrength,
        flame.userData.baseHeight * (0.9 + flicker * 0.22) * flameStrength,
        1,
      );
      flame.position.x = flame.userData.baseX * growth + Math.sin(state.time * 8 + flame.userData.phase) * 0.18 * growth;
      flame.position.z = flame.userData.baseZ * growth + Math.cos(state.time * 9 + flame.userData.phase) * 0.18 * growth;
      flame.position.y = flame.userData.baseY * Math.max(0.035, flameStrength);
      flame.material.opacity = flame.userData.baseOpacity * flameStrength;
    }
    for (const puff of fire.smoke) {
      puff.position.y += dt * 0.38;
      puff.position.x += Math.sin(state.time * 1.7 + puff.userData.phase) * dt * 0.18;
      puff.scale.setScalar(0.45 + smolder * 0.4 + growth * 0.35);
      puff.material.opacity = (0.08 + smolder * 0.16 + growth * 0.11) * fade;
    }
    if (age < fire.duration) continue;
    city.remove(fire.mesh);
    fire.mesh.traverse((part) => {
      part.geometry?.dispose();
      part.material?.dispose();
    });
    solarFires.splice(i, 1);
  }
  updateSolarImpactEmbers(dt);
}

function updateSolarImpactEmbers(dt) {
  for (let i = solarImpactEmbers.length - 1; i >= 0; i--) {
    const ember = solarImpactEmbers[i];
    const age = state.time - ember.bornAt;
    ember.velocity.y -= 18 * dt;
    ember.mesh.position.addScaledVector(ember.velocity, dt);
    if (ember.mesh.position.y < 0.16) {
      ember.mesh.position.y = 0.16;
      ember.velocity.y *= -0.22;
      ember.velocity.x *= 0.72;
      ember.velocity.z *= 0.72;
    }
    ember.mesh.material.opacity = THREE.MathUtils.clamp(1 - age / ember.duration, 0, 1);
    if (age < ember.duration) continue;
    city.remove(ember.mesh);
    ember.mesh.geometry.dispose();
    ember.mesh.material.dispose();
    solarImpactEmbers.splice(i, 1);
  }
}

function playSolarImpactSound() {
  const audio = ensureAudio();
  if (!audio) return;
  const now = audio.currentTime;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(82, now);
  oscillator.frequency.exponentialRampToValueAtTime(34, now + 0.32);
  gain.gain.setValueAtTime(0.22, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.4);
}

function updateWeaponEffects(dt) {
  if (state.policeTriggerHeld && state.policeWeapon === "pistol" && state.time - state.policeTriggerStartedAt >= 0.2) {
    firePolicePistol(true);
  }
  if (state.policePistol?.userData.muzzle) {
    state.policePistol.userData.muzzle.visible = state.policePistolDrawn && state.time - state.lastPoliceShot < 0.045;
    const recoil = Math.max(0, 1 - (state.time - state.lastPoliceShot) / 0.16);
    const aiming = state.policePistolDrawn && keys.has("shift");
    state.policeAimZoom = moveToward(state.policeAimZoom, aiming ? 1 : 0, dt * 5.5);
    state.policePistol.position.x = THREE.MathUtils.lerp(0.36, 0, state.policeAimZoom);
    state.policePistol.position.y = THREE.MathUtils.lerp(-0.34, -0.2, state.policeAimZoom);
    state.policePistol.position.z = THREE.MathUtils.lerp(-0.78, -0.6, state.policeAimZoom) + recoil * 0.1;
    state.policePistol.rotation.x = -0.04 - recoil * 0.1;
    state.policePistol.rotation.y = THREE.MathUtils.lerp(-0.08, 0, state.policeAimZoom);
    state.policePistol.rotation.z = THREE.MathUtils.lerp(0.02, 0, state.policeAimZoom);
  }
  for (let i = weaponEffects.length - 1; i >= 0; i--) {
    const effect = weaponEffects[i];
    const progress = (state.time - effect.bornAt) / effect.duration;
    if (progress >= 1) {
      city.remove(effect.mesh);
      effect.mesh.geometry?.dispose();
      effect.mesh.material?.dispose();
      weaponEffects.splice(i, 1);
      continue;
    }
    effect.mesh.material.opacity = Math.max(0, 1 - progress);
    if (effect.kind === "fireball") effect.mesh.scale.setScalar(0.65 + Math.sin(progress * Math.PI) * 4.5);
    if (effect.kind === "fireCore") effect.mesh.scale.setScalar(0.35 + Math.sin(progress * Math.PI) * 2.7);
    if (effect.kind === "smoke") {
      effect.mesh.material.opacity = Math.sin(Math.min(1, progress * 2.4) * Math.PI / 2) * (1 - progress) * 0.68;
      effect.mesh.scale.setScalar(0.7 + progress * 4.6);
      effect.mesh.position.y += dt * 1.05;
    }
    if (effect.kind === "shockwave") effect.mesh.scale.setScalar(0.5 + progress * 6.5);
    if (effect.kind === "sunBurst") {
      effect.mesh.scale.setScalar(18 + Math.sin(Math.min(1, progress * 1.35) * Math.PI / 2) * 125);
      effect.mesh.rotation.y += dt * 0.35;
      effect.mesh.rotation.z -= dt * 0.2;
      effect.mesh.material.opacity = Math.min(1, (1 - progress) * 1.8);
    }
    if (effect.kind === "sunCore") {
      effect.mesh.scale.setScalar(12 + Math.sin(Math.min(1, progress * 1.7) * Math.PI / 2) * 82);
      effect.mesh.material.opacity = Math.min(1, (1 - progress) * 2.4);
    }
    if (effect.kind === "sunShockwave") {
      effect.mesh.scale.setScalar(20 + progress * 230);
      effect.mesh.material.opacity = Math.pow(1 - progress, 2) * 0.82;
    }
    if (effect.kind === "sunFireCloud") {
      const bloom = Math.sin(Math.min(1, progress * 1.5) * Math.PI / 2);
      effect.mesh.scale.setScalar(5 + bloom * effect.maxScale * (0.9 + Math.sin(progress * 13 + effect.phase) * 0.1));
      effect.mesh.position.addScaledVector(effect.velocity, dt);
      effect.velocity.multiplyScalar(Math.max(0, 1 - dt * 0.35));
      effect.mesh.rotation.x += dt * 0.2;
      effect.mesh.rotation.y -= dt * 0.27;
      effect.mesh.material.opacity = Math.min(0.95, (1 - progress) * 1.65);
    }
    if (effect.kind === "sunFragment" && effect.velocity) {
      effect.mesh.position.addScaledVector(effect.velocity, dt);
      effect.velocity.multiplyScalar(Math.max(0, 1 - dt * 0.55));
    }
    if (effect.kind === "spark" && effect.velocity) {
      effect.velocity.y -= 15 * dt;
      effect.mesh.position.addScaledVector(effect.velocity, dt);
    }
  }
}

function playPoliceShotSound() {
  const audio = ensureAudio();
  if (!audio) return;
  const now = audio.currentTime;
  const duration = 0.2;
  const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * duration), audio.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) {
    const t = i / samples.length;
    samples[i] = (Math.random() * 2 - 1) * Math.exp(-t * 18);
  }
  const crack = audio.createBufferSource();
  const crackFilter = audio.createBiquadFilter();
  const crackGain = audio.createGain();
  crack.buffer = buffer;
  crackFilter.type = "bandpass";
  crackFilter.frequency.value = 1900;
  crackFilter.Q.value = 0.75;
  crackGain.gain.setValueAtTime(0.42, now);
  crackGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  crack.connect(crackFilter);
  crackFilter.connect(crackGain);
  crackGain.connect(audio.destination);
  crack.start(now);

  const thump = audio.createOscillator();
  const thumpGain = audio.createGain();
  thump.type = "triangle";
  thump.frequency.setValueAtTime(135, now);
  thump.frequency.exponentialRampToValueAtTime(48, now + 0.11);
  thumpGain.gain.setValueAtTime(0.3, now);
  thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
  thump.connect(thumpGain);
  thumpGain.connect(audio.destination);
  thump.start(now);
  thump.stop(now + 0.15);
}

function playExplosionSound() {
  const audio = ensureAudio();
  if (!audio) return;
  const now = audio.currentTime;
  const duration = 1.15;
  const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * duration), audio.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) {
    const t = i / samples.length;
    samples[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.1);
  }
  const blast = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const blastGain = audio.createGain();
  blast.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1500, now);
  filter.frequency.exponentialRampToValueAtTime(180, now + duration);
  blastGain.gain.setValueAtTime(0.48, now);
  blastGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  blast.connect(filter);
  filter.connect(blastGain);
  blastGain.connect(audio.destination);
  blast.start(now);
  const boom = audio.createOscillator();
  const boomGain = audio.createGain();
  boom.type = "sine";
  boom.frequency.setValueAtTime(82, now);
  boom.frequency.exponentialRampToValueAtTime(28, now + 0.7);
  boomGain.gain.setValueAtTime(0.55, now);
  boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);
  boom.connect(boomGain);
  boomGain.connect(audio.destination);
  boom.start(now);
  boom.stop(now + 0.8);
}

function throwGrenade(chargeSeconds = 0) {
  if (!state.onFoot || state.securityRoom || state.carTransition || !state.pedestrian?.visible) return;
  const person = state.pedestrian;
  const forward = new THREE.Vector3(
    Math.sin(state.policeAim.yaw) * Math.cos(state.policeAim.pitch),
    Math.sin(state.policeAim.pitch),
    Math.cos(state.policeAim.yaw) * Math.cos(state.policeAim.pitch),
  ).normalize();
  const charge = THREE.MathUtils.clamp(chargeSeconds / 2, 0, 1);
  const grenade = new THREE.Group();
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0x35452a, roughness: 0.88, metalness: 0.18 }),
  );
  shell.scale.y = 1.28;
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.09, 0.11, 8),
    new THREE.MeshStandardMaterial({ color: 0x20251e, roughness: 0.62, metalness: 0.55 }),
  );
  cap.position.y = 0.24;
  const fuse = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 6, 4),
    new THREE.MeshBasicMaterial({ color: 0xff8a2b }),
  );
  fuse.position.set(0.07, 0.3, 0);
  grenade.add(shell, cap, fuse);
  grenade.position.copy(person.position).add(new THREE.Vector3(0, 1.55, 0)).addScaledVector(forward, 0.75);
  grenade.userData.ignoreBulletRay = true;
  city.add(grenade);
  grenades.push({
    mesh: grenade,
    fuse,
    velocity: forward.multiplyScalar(THREE.MathUtils.lerp(8, 25, charge)).add(
      new THREE.Vector3(0, THREE.MathUtils.lerp(6.2, 10.5, charge), 0),
    ),
    angularVelocity: new THREE.Vector3(8, 5, 7),
    thrownAt: state.time,
    explodeAt: state.time + 3,
  });
  statusEl.textContent = charge > 0.75
    ? "Grenade thrown at maximum strength — 3 second fuse"
    : "Grenade thrown — 3 second fuse";
}

function updateGrenades(dt) {
  for (let i = grenades.length - 1; i >= 0; i--) {
    const grenade = grenades[i];
    if (state.time >= grenade.explodeAt) {
      const origin = grenade.mesh.position.clone();
      city.remove(grenade.mesh);
      grenades.splice(i, 1);
      createVehicleExplosion(origin);
      playExplosionSound();
      damageCarsNearExplosion(origin, null);
      damagePedestriansNearExplosion(origin);
      continue;
    }
    grenade.velocity.y -= 15 * dt;
    const previous = grenade.mesh.position.clone();
    grenade.mesh.position.addScaledVector(grenade.velocity, dt);
    grenade.mesh.rotation.x += grenade.angularVelocity.x * dt;
    grenade.mesh.rotation.y += grenade.angularVelocity.y * dt;
    grenade.mesh.rotation.z += grenade.angularVelocity.z * dt;
    const hitBuilding = buildingObstacles.some((obstacle) =>
      Math.abs(grenade.mesh.position.x - obstacle.x) < obstacle.halfX + 0.18 &&
      Math.abs(grenade.mesh.position.z - obstacle.z) < obstacle.halfZ + 0.18,
    );
    if (hitBuilding) {
      grenade.mesh.position.copy(previous);
      grenade.velocity.x *= -0.45;
      grenade.velocity.z *= -0.45;
    }
    if (grenade.mesh.position.y <= 0.2) {
      grenade.mesh.position.y = 0.2;
      if (Math.abs(grenade.velocity.y) > 1.2) grenade.velocity.y = Math.abs(grenade.velocity.y) * 0.42;
      else grenade.velocity.y = 0;
      grenade.velocity.x *= Math.max(0, 1 - dt * 2.8);
      grenade.velocity.z *= Math.max(0, 1 - dt * 2.8);
      grenade.angularVelocity.multiplyScalar(Math.max(0, 1 - dt * 2.2));
    }
    const blink = Math.floor((grenade.explodeAt - state.time) * 8) % 2 === 0;
    grenade.fuse.visible = blink;
  }
}

function updateRockets(dt) {
  for (let i = rockets.length - 1; i >= 0; i--) {
    const rocket = rockets[i];
    const travel = rocket.speed * dt;
    policeRaycaster.set(rocket.mesh.position, rocket.direction);
    policeRaycaster.far = travel + 0.35;
    const cityHit = policeRaycaster.intersectObjects(city.children, true).find((entry) =>
      !entry.object.userData.ignoreBulletRay && !entry.object.parent?.userData.ignoreBulletRay,
    );
    const sunHit = canHitSun() ? policeRaycaster.intersectObject(sunDisk, false)[0] : null;
    const hit = sunHit && (!cityHit || sunHit.distance < cityHit.distance) ? sunHit : cityHit;
    if (!hit && state.time - rocket.bornAt < 10) {
      rocket.mesh.position.addScaledVector(rocket.direction, travel);
      continue;
    }
    const origin = hit ? hit.point.clone() : rocket.mesh.position.clone();
    city.remove(rocket.mesh);
    rockets.splice(i, 1);
    if (hit?.object === sunDisk) {
      destroySun();
      continue;
    }
    createVehicleExplosion(origin);
    playExplosionSound();
    damageCarsNearExplosion(origin, null);
    damagePedestriansNearExplosion(origin);
  }
  policeRaycaster.far = Infinity;
}

function canHitSun() {
  return !state.sunDestroyed && sunDisk?.visible && sunDisk.material.opacity > 0.08;
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
  holsterPolicePistol();
  setPoliceFlashlight(false);
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
    statusEl.textContent = "Vehicle pulled over — driver window lowered — press O to toggle siren";
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
    if (data.buildingHelpResponse) {
      updateBuildingHelperCar(bot, dt);
      continue;
    }
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
        data.laneIndex = data.waitingForEntry.laneIndex || 0;
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
    const policeClearance = getPoliceTrafficClearance(bot) || getPoliceSirenClearance(bot);
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
    if (data.policeYielded && !state.policeSiren && (!activePoliceStop || activePoliceStop.complete)) {
      // Once emergency traffic control ends, hand the car straight back to
      // normal signal/intersection logic. The old timed recovery drove forward
      // for several seconds without checking a newly red light.
      data.policeYielded = false;
      data.policeRecoveryUntil = 0;
      data.policeRecoverySpeed = 0;
      data.policeClearanceSpeed = 0;
      data.policeClearanceSign = 0;
    }
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
    const playerReverseYield = pedestrianAvoidance ? null : getPlayerReverseYield(bot);
    const queueAvoidance = pedestrianAvoidance || playerReverseYield ? null : getQueueReverse(bot, frontTraffic);
    const avoidance = pedestrianAvoidance || playerReverseYield || queueAvoidance || (sensitivity > 0 ? getPlayerAvoidance(bot, sensitivity, dt) : null);
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
    let targetSpeed = avoidance
      ? avoidance.speed
      : intersectionBackOut
        ? 0
        : signalStop
        ? Math.min(followingSpeed, redApproachSpeed)
        : boxStop ? 0 : cruisingSpeed;
    const clearLaneChange = data.laneChange &&
      !avoidance &&
      !intersectionBlocked &&
      (!frontTraffic || frontTraffic.gap > 12);
    if (clearLaneChange) {
      // Changing lanes is not a braking event. Preserve momentum when both the
      // maneuver and the road ahead are clear; genuine traffic and signal
      // stops above still take priority.
      targetSpeed = Math.max(targetSpeed, data.speed || 0, data.desiredSpeed * 0.85);
    }
    const safelyTailgated = !avoidance &&
      !intersectionBlocked &&
      (!frontTraffic || frontTraffic.gap > 7) &&
      isPlayerFollowingBotClosely(bot);
    if (safelyTailgated) {
      targetSpeed = Math.max(targetSpeed, data.speed || 0, Math.min(data.desiredSpeed, 9));
    }
    const tightGap = frontTraffic && frontTraffic.gap <= BOT_BUMPER_GAP + 1.1;
    const rate = targetSpeed < data.speed ? (intersectionBlocked || tightGap ? 34 : 26) : 7;
    data.braking = targetSpeed < data.speed - 0.5;
    data.speed = moveToward(data.speed, targetSpeed, rate * dt);

    updateBotLaneChange(bot, avoidance, intersectionStop);
    if (!avoidance && !data.laneChange) maybeTurnAtIntersection(bot);
    const forward = dirs[data.dir];
    const previous = bot.position.clone();
    const travel = avoidance ? avoidance.direction : botLaneChangeDirection(bot, forward);
    const reversing = travel.dot(forward) < -0.5;
    // A blocked lane change may reduce speed to zero before it can finish.
    // Keep a stopped car parallel with traffic instead of leaving it diagonally
    // across both lanes; it can steer back into the maneuver once moving again.
    const facing = reversing || Math.abs(data.speed) < 0.15 ? forward : travel;
    const targetYaw = Math.atan2(facing.x, facing.z);
    bot.rotation.y = lerpAngle(bot.rotation.y, targetYaw, dt * (avoidance ? 10 : 7));
    const travelSpeed = reversing ? Math.min(Math.abs(data.speed), avoidance.speed) : Math.abs(data.speed);
    data.velocity.copy(travel).multiplyScalar(travelSpeed);
    const candidate = bot.position.clone().addScaledVector(data.velocity, dt);
    const movementBlocked = botMovementBlocked(bot, candidate) && !(
      avoidance?.reverseForPlayer && playerReverseStepIsSafe(bot, candidate)
    );
    if (movementBlocked) {
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

function updateBotLaneChange(bot, avoidance, intersectionStop) {
  const data = bot.userData;
  if (data.laneChange) {
    const change = data.laneChange;
    if (change.phase === "signaling") {
      if (avoidance || intersectionStop || !isBotLaneChangeClear(bot, change.targetLane, dirs[data.dir])) {
        data.laneChange = null;
        data.nextLaneChangeAt = state.time + 4 + Math.random() * 6;
        return;
      }
      if (state.time - change.startedAt < 0.85) return;
      change.phase = "moving";
    }
    const targetCoordinate = botLaneCoordinate(data.dir, data.laneChange.targetLane, bot.position);
    const currentCoordinate = data.dir === "east" || data.dir === "west" ? bot.position.z : bot.position.x;
    if (Math.abs(currentCoordinate - targetCoordinate) < 0.1) {
      if (data.dir === "east" || data.dir === "west") bot.position.z = targetCoordinate;
      else bot.position.x = targetCoordinate;
      data.laneIndex = data.laneChange.targetLane;
      data.laneChange = null;
      data.nextLaneChangeAt = state.time + 7 + Math.random() * 12;
    }
    return;
  }
  if (avoidance || intersectionStop || state.time < (data.nextLaneChangeAt || 0) || Math.abs(data.speed || 0) < 5) return;
  const forward = dirs[data.dir];
  const alongCoordinate = data.dir === "east" || data.dir === "west" ? bot.position.x : bot.position.z;
  const intersectionDistance = Math.min(...GRID.map((value) => Math.abs(alongCoordinate - value)));
  if (intersectionDistance < ROAD_HALF + CAR_HALF_LENGTH + 5) return;
  const targetLane = (data.laneIndex || 0) === 0 ? 1 : 0;
  data.nextLaneChangeAt = state.time + 6 + Math.random() * 10;
  if (!isBotLaneChangeClear(bot, targetLane, forward)) return;
  data.laneChange = {
    targetLane,
    originalLane: data.laneIndex || 0,
    phase: "signaling",
    startedAt: state.time,
    signal: botLaneChangeSignal(bot, targetLane),
  };
}

function botLaneCoordinate(dir, laneIndex, position) {
  const fixed = nearestGrid(dir === "east" || dir === "west" ? position.z : position.x);
  return fixed + laneOffsetForDirection(dir, laneIndex);
}

function botLaneChangeDirection(bot, forward) {
  const change = bot.userData.laneChange;
  if (!change || change.phase === "signaling") return forward;
  const target = bot.position.clone().addScaledVector(forward, 13);
  const coordinate = botLaneCoordinate(bot.userData.dir, change.targetLane, bot.position);
  if (bot.userData.dir === "east" || bot.userData.dir === "west") target.z = coordinate;
  else target.x = coordinate;
  return target.sub(bot.position).normalize();
}

function isBotLaneChangeClear(bot, targetLane, forward) {
  const targetCoordinate = botLaneCoordinate(bot.userData.dir, targetLane, bot.position);
  for (const other of collidableCars) {
    if (other === bot || !other.visible || other.userData.waitingForEntry) continue;
    const otherChange = other.userData.laneChange;
    const along = other.position.clone().sub(bot.position).dot(forward);
    if (
      otherChange &&
      other.userData.dir === bot.userData.dir &&
      otherChange.targetLane === (bot.userData.laneIndex || 0) &&
      otherChange.originalLane === targetLane &&
      Math.abs(along) < 30
    ) return false;
    const otherCoordinate = bot.userData.dir === "east" || bot.userData.dir === "west" ? other.position.z : other.position.x;
    if (Math.abs(otherCoordinate - targetCoordinate) > CAR_HALF_WIDTH * 2 + 0.45) continue;
    if (along > -16 && along < 26) return false;
  }
  return true;
}

function botLaneChangeSignal(bot, targetLane) {
  const forward = dirs[bot.userData.dir];
  // In the car model local +X is the driver's left side.
  const left = new THREE.Vector3(forward.z, 0, -forward.x);
  const currentCoordinate = bot.userData.dir === "east" || bot.userData.dir === "west" ? bot.position.z : bot.position.x;
  const targetCoordinate = botLaneCoordinate(bot.userData.dir, targetLane, bot.position);
  const lateral = bot.userData.dir === "east" || bot.userData.dir === "west"
    ? new THREE.Vector3(0, 0, targetCoordinate - currentCoordinate)
    : new THREE.Vector3(targetCoordinate - currentCoordinate, 0, 0);
  return lateral.dot(left) >= 0 ? "left" : "right";
}

function getPlayerReverseYield(bot) {
  const player = state.player;
  const playerData = player.userData;
  const playerBacking = state.gear === "reverse" && (keys.has("arrowup") || (playerData.speed || 0) < -0.15);
  if (!playerBacking || state.onFoot || state.playerCrashed) return null;

  const playerForward = getForward(player).normalize();
  const playerReverse = playerForward.clone().multiplyScalar(-1);
  const botForward = dirs[bot.userData.dir] || getForward(bot).normalize();
  if (botForward.dot(playerForward) < 0.72) return null;

  const delta = bot.position.clone().sub(player.position);
  const behind = delta.dot(playerReverse);
  if (behind <= 0.5 || behind > 28) return null;
  const lateralSq = Math.max(0, delta.lengthSq() - behind * behind);
  if (lateralSq > 8.2) return null;

  const reverseSpeed = THREE.MathUtils.clamp(Math.abs(playerData.speed || 0) + 2, 4.5, 9.5);
  return {
    direction: botForward.clone().multiplyScalar(-1),
    speed: reverseSpeed,
    reverseForPlayer: true,
  };
}

function playerReverseStepIsSafe(bot, candidate) {
  if (buildingObstacles.some((obstacle) =>
    Math.abs(candidate.x - obstacle.x) < obstacle.halfX + CAR_HALF_WIDTH + 0.2 &&
    Math.abs(candidate.z - obstacle.z) < obstacle.halfZ + CAR_HALF_LENGTH + 0.2
  )) return false;

  const forward = getForward(bot).normalize();
  const right = new THREE.Vector3(forward.z, 0, -forward.x);
  const candidateBox = {
    center: candidate,
    forward,
    right,
    halfWidth: CAR_HALF_WIDTH + 0.08,
    halfLength: CAR_HALF_LENGTH + 0.08,
  };
  for (const other of collidableCars) {
    if (other === bot || !other.visible || other.userData.waitingForEntry) continue;
    if (candidate.distanceToSquared(other.position) > (CAR_HALF_LENGTH * 2.8) ** 2) continue;
    const otherBox = carBox(other);
    otherBox.halfWidth += 0.08;
    otherBox.halfLength += 0.08;
    let overlaps = true;
    for (const axis of [candidateBox.right, candidateBox.forward, otherBox.right, otherBox.forward]) {
      const candidateProjection = projectBox(candidateBox, axis);
      const otherProjection = projectBox(otherBox, axis);
      if (Math.min(candidateProjection.max, otherProjection.max) - Math.max(candidateProjection.min, otherProjection.min) <= 0) {
        overlaps = false;
        break;
      }
    }
    if (overlaps) return false;
  }
  return true;
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
  const laneOffset = laneOffsetForDirection(data.dir, data.laneIndex || 0);
  if (data.dir === "east" || data.dir === "west") destination.z = nearestGrid(bot.position.z) + laneOffset;
  if (data.dir === "north" || data.dir === "south") destination.x = nearestGrid(bot.position.x) + laneOffset;
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

function getPoliceSirenClearance(bot) {
  if (!state.policeMode || !state.policeSiren || state.onFoot || bot === state.policeTarget) return null;
  const policeCar = state.player;
  const policeForward = getForward(policeCar).normalize();
  const policeRight = new THREE.Vector3(policeForward.z, 0, -policeForward.x);
  const botForward = dirs[bot.userData.dir] || getForward(bot).normalize();
  const delta = bot.position.clone().sub(policeCar.position);
  const distance = delta.length();
  const along = delta.dot(policeForward);
  const lateral = Math.abs(delta.dot(policeRight));
  const alignment = botForward.dot(policeForward);

  // Cars crossing the emergency vehicle's immediate route clear it using
  // whichever physical forward/reverse movement takes them away fastest.
  if (Math.abs(alignment) < 0.55 && distance < 24 && Math.abs(along) < 18) {
    const routeEnd = policeCar.position.clone().addScaledVector(policeForward, 28);
    return {
      direction: policeRouteClearingDirection(bot, botForward, policeCar.position, routeEnd),
      speed: 4.5,
    };
  }

  if (lateral > 5.4) return null;
  // Head-on traffic physically backs away without rotating around.
  if (alignment < -0.65 && along > -4 && along < 32) {
    return { direction: botForward.clone().multiplyScalar(-1), speed: 5.5 };
  }
  if (alignment < 0.65) return null;
  // Traffic ahead keeps moving to open the corridor; traffic approaching the
  // police car from behind slows instead of crowding it.
  if (along > 0 && along < 42) {
    return { direction: botForward.clone(), speed: Math.max(14, bot.userData.desiredSpeed || 14) };
  }
  if (along < 0 && along > -24) {
    return { direction: botForward.clone(), speed: 3.5 };
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
  if (state.buildingHelper?.person?.visible) people.push(state.buildingHelper.person);
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
  const ahead = delta.dot(forward);
  if (ahead < -0.35) {
    data.avoidanceTimer = 0;
    data.avoidanceSide = 0;
    return null;
  }
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

function isPlayerFollowingBotClosely(bot) {
  const player = state.player;
  if (!player || state.onFoot || player.userData.crashed || player.userData.immobilized) return false;
  const forward = dirs[bot.userData.dir];
  const right = new THREE.Vector3(forward.z, 0, -forward.x);
  const delta = player.position.clone().sub(bot.position);
  const behind = -delta.dot(forward);
  if (behind <= CAR_HALF_LENGTH || behind > 10) return false;
  if (Math.abs(delta.dot(right)) > CAR_HALF_WIDTH * 2 + 0.35) return false;
  return getForward(player).dot(forward) > 0.65;
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
  const laneOffset = laneOffsetForDirection(data.dir, data.laneIndex || 0);
  if (data.dir === "east" || data.dir === "west") bot.position.z = nearestGrid(bot.position.z) + laneOffset;
  if (data.dir === "north" || data.dir === "south") bot.position.x = nearestGrid(bot.position.x) + laneOffset;
}

function laneOffsetForDirection(dir, laneIndex = 0) {
  const magnitude = TRAFFIC_LANE_MAGNITUDES[laneIndex] || TRAFFIC_LANE_MAGNITUDES[0];
  return dir === "east" || dir === "south" ? magnitude : -magnitude;
}

function stopInfoForSignal(bot) {
  const data = bot.userData;
  const forward = dirs[data.dir];
  const axis = data.dir === "east" || data.dir === "west" ? "ew" : "ns";
  const ix = nearestGrid(bot.position.x);
  const iz = nearestGrid(bot.position.z);
  if (data.signalCommit) {
    const commit = data.signalCommit;
    const clearMargin = ROAD_HALF + CAR_HALF_LENGTH + 1;
    const stillClearingCommittedIntersection =
      Math.abs(bot.position.x - commit.ix) <= clearMargin &&
      Math.abs(bot.position.z - commit.iz) <= clearMargin;
    if (stillClearingCommittedIntersection) return null;
    data.signalCommit = null;
  }
  const stopCenter = stopCenterForDirection(ix, iz, data.dir, data.laneIndex || 0);
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
  if (light.state === "yellow") {
    const speed = Math.abs(data.speed || 0);
    const safeStoppingDistance = speed * speed / (2 * 26) + 1.4;
    if (ahead <= Math.max(0.7, safeStoppingDistance)) {
      data.signalCommit = { ix, iz };
      return null;
    }
  }
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
  const stopCenter = stopCenterForDirection(ix, iz, data.dir, data.laneIndex || 0);
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

  const stopCenter = stopCenterForDirection(ix, iz, data.dir, data.laneIndex || 0);
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

function stopCenterForDirection(ix, iz, dir, laneIndex = 0) {
  const laneOffset = laneOffsetForDirection(dir, laneIndex);
  if (dir === "east") return new THREE.Vector3(ix - STOP_LINE_OFFSET - CAR_HALF_LENGTH, 0, iz + laneOffset);
  if (dir === "west") return new THREE.Vector3(ix + STOP_LINE_OFFSET + CAR_HALF_LENGTH, 0, iz + laneOffset);
  if (dir === "north") return new THREE.Vector3(ix + laneOffset, 0, iz + STOP_LINE_OFFSET + CAR_HALF_LENGTH);
  return new THREE.Vector3(ix + laneOffset, 0, iz - STOP_LINE_OFFSET - CAR_HALF_LENGTH);
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
  const followingGap = frontTraffic.car.userData.player
    ? PLAYER_FOLLOW_GAP + Math.max(0, bot.userData.speed || 0) * PLAYER_FOLLOW_TIME
    : BOT_BUMPER_GAP;
  const gapError = frontTraffic.gap - followingGap;
  return THREE.MathUtils.clamp(leadSpeed + gapError * 1.65, 0, bot.userData.desiredSpeed);
}

function updateReverseCrossTrafficWarning() {
  state.reverseCrossTrafficDirection = null;
  if (state.gear !== "reverse" || state.onFoot || state.playerCrashed) return;

  const player = state.player;
  const playerForward = getForward(player).normalize();
  const playerRear = playerForward.clone().multiplyScalar(-1);
  const playerRight = new THREE.Vector3(playerForward.z, 0, -playerForward.x);
  const playerVelocity = player.userData.velocity || new THREE.Vector3();
  let nearestArrival = Infinity;

  for (const car of collidableCars) {
    if (car === player || !car.visible || car.userData.waitingForEntry || car.userData.immobilized || car.userData.crashed) continue;
    const delta = car.position.clone().sub(player.position);
    const lateral = delta.dot(playerRight);
    const rearward = delta.dot(playerRear);
    if (Math.abs(lateral) < 2.8 || Math.abs(lateral) > 25 || rearward < -4 || rearward > 18) continue;

    const relativeVelocity = carVelocity(car).sub(playerVelocity);
    const lateralSpeed = relativeVelocity.dot(playerRight);
    if (lateral * lateralSpeed >= -0.2 || Math.abs(lateralSpeed) < 1.6) continue;
    const arrival = -lateral / lateralSpeed;
    if (arrival < 0 || arrival > 3) continue;
    const predictedRearward = rearward + relativeVelocity.dot(playerRear) * arrival;
    if (predictedRearward < -3 || predictedRearward > 12) continue;

    if (arrival < nearestArrival) {
      nearestArrival = arrival;
      state.reverseCrossTrafficDirection = lateralSpeed > 0 ? "right" : "left";
    }
  }

  if (state.reverseCrossTrafficDirection && state.time - state.lastReverseCrossTrafficBeep >= 1.35) {
    state.lastReverseCrossTrafficBeep = state.time;
    playReverseCrossTrafficBeep();
  }
}

function updateBlindSpotWarnings() {
  state.blindSpotLeft = false;
  state.blindSpotRight = false;
  const player = state.player;
  const cockpit = player?.userData?.cockpit;
  if (!player || state.onFoot || state.playerCrashed) {
    if (cockpit?.userData.blindSpotIcons) {
      cockpit.userData.blindSpotIcons.left.visible = false;
      cockpit.userData.blindSpotIcons.right.visible = false;
    }
    return;
  }

  const forward = getForward(player).normalize();
  const right = new THREE.Vector3(forward.z, 0, -forward.x);
  for (const car of collidableCars) {
    if (car === player || !car.visible || car.userData.waitingForEntry || car.userData.immobilized || car.userData.crashed) continue;
    if (getForward(car).normalize().dot(forward) < 0.25) continue;
    const delta = car.position.clone().sub(player.position);
    const longitudinal = delta.dot(forward);
    const lateral = delta.dot(right);
    if (longitudinal < -7.5 || longitudinal > 1.5) continue;
    if (Math.abs(lateral) < 2.15 || Math.abs(lateral) > 7.2) continue;
    if (lateral < 0) state.blindSpotRight = true;
    else state.blindSpotLeft = true;
  }

  if (cockpit?.userData.blindSpotIcons) {
    const pulse = 1 + Math.max(0, Math.sin(state.time * 7)) * 0.08;
    cockpit.userData.blindSpotIcons.left.visible = state.blindSpotLeft;
    cockpit.userData.blindSpotIcons.right.visible = state.blindSpotRight;
    cockpit.userData.blindSpotIcons.left.scale.setScalar(pulse);
    cockpit.userData.blindSpotIcons.right.scale.setScalar(pulse);
  }

  const signalingIntoOccupiedSide =
    (state.signal === "left" && state.blindSpotLeft) ||
    (state.signal === "right" && state.blindSpotRight);
  if (signalingIntoOccupiedSide) requestBlindSpotBeep();
}

function requestBlindSpotBeep() {
  if (state.time - state.lastBlindSpotBeep < 1.35) return;
  state.lastBlindSpotBeep = state.time;
  playReverseCrossTrafficBeep();
}

function intersectionApproachSpeed(bot) {
  const data = bot.userData;
  const forward = dirs[data.dir];
  const ix = nearestGrid(bot.position.x);
  const iz = nearestGrid(bot.position.z);
  const stopCenter = stopCenterForDirection(ix, iz, data.dir, data.laneIndex || 0);
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
  if (signal && signal.light.state === "green" && (data.speed || 0) > 0.35) {
    state.greenIntersectionPass = {
      ix: signal.ix,
      iz: signal.iz,
      axis: signal.axis,
      dir: signal.dir,
    };
  }
  const playerHasGreenRightOfWay = hasGreenIntersectionRightOfWay(player, data);
  const botBehind = findBotBehindPlayer(19);
  const blockingGreen = signal &&
    signal.light.state === "green" &&
    Math.abs(data.speed || 0) < 0.08 &&
    !keys.has("arrowup") &&
    botBehind;
  state.greenBlockTimer = blockingGreen ? state.greenBlockTimer + dt : 0;
  if (state.greenBlockTimer > 1.1) {
    requestHonk(botBehind, "short");
  }

  if (signal && signal.light.state !== "green" && signal.along < -CAR_HALF_LENGTH * 0.45 && !playerHasGreenRightOfWay) {
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
    if (suddenClose && !waitingAtRed && !playerHasGreenRightOfWay) requestHonk(bot, "danger");
    botData.lastPlayerDistance = distanceToPlayer;

    const ahead = delta.dot(forward);
    if (ahead <= 0.8 || ahead > 9.5) continue;
    const sideSq = delta.lengthSq() - ahead * ahead;
    if (sideSq > 7.8) continue;
    const playerForward = getForward(player);
    const crossing = Math.abs(playerForward.dot(forward)) < 0.72;
    const abruptBlock = botData.speed > Math.max(4, Math.abs(data.speed) + 4);
    if ((crossing || abruptBlock) && !waitingAtRed && !playerHasGreenRightOfWay) requestHonk(bot, "angry");
  }
}

function hasGreenIntersectionRightOfWay(player, data) {
  const pass = state.greenIntersectionPass;
  if (!pass) return false;
  if (state.onFoot || (data.speed || 0) < -0.1) {
    state.greenIntersectionPass = null;
    return false;
  }
  const center = new THREE.Vector3(pass.ix, 0, pass.iz);
  const forward = dirs[pass.dir];
  const offset = player.position.clone().sub(center);
  const progress = offset.dot(forward);
  const lateralSq = Math.max(0, offset.lengthSq() - progress * progress);
  const fullyClear = progress > ROAD_HALF + CAR_HALF_LENGTH + 3;
  const leftIntersectionPath = lateralSq > (ROAD_HALF + 2.5) ** 2;
  if (fullyClear || leftIntersectionPath) {
    state.greenIntersectionPass = null;
    return false;
  }
  return true;
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
    laneOffset = Math.min(...TRAFFIC_LANE_MAGNITUDES.map((offset) => Math.abs(Math.abs(zOffset) - offset)));
  } else {
    expectedDir = xOffset < 0 ? "north" : "south";
    laneOffset = Math.min(...TRAFFIC_LANE_MAGNITUDES.map((offset) => Math.abs(Math.abs(xOffset) - offset)));
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
    player.userData.driveDamage = THREE.MathUtils.clamp((player.userData.driveDamage || 0) + 0.25 + impactStrength * 0.5, 0.35, 1);
    player.userData.damagePull = Math.sign(localImpulse.x || spin || 1);
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
    if (!responder.person || responder.person.userData.blastFlight) continue;
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

function startBuildingCrashHelp() {
  if (state.buildingHelper) return;
  const crashNormal = state.player.userData.buildingCrashNormal?.clone().setY(0).normalize();
  if (!crashNormal) return;
  const eligible = cars
    .filter((car) => !car.userData.player && !car.userData.immobilized && !car.userData.crashed && !car.userData.policePullOver)
    .filter((car) => car.position.clone().sub(state.player.position).dot(crashNormal) > -1.5)
    .sort((a, b) => a.position.distanceToSquared(state.player.position) - b.position.distanceToSquared(state.player.position))
    .slice(0, 10);
  if (!eligible.length) return;
  const car = eligible[Math.floor(Math.random() * eligible.length)];
  const destination = findBuildingHelperDestination(state.player.position, car, crashNormal);
  if (!destination) return;
  car.userData.buildingHelpResponse = {
    destination,
    roadYaw: car.rotation.y,
    phase: "approach",
    route: null,
    routeIndex: 0,
  };
  car.userData.hazard = true;
  state.buildingHelper = { car, person: null };
  statusEl.textContent = "Car destroyed — a nearby driver is pulling over to help";
}

function findBuildingHelperDestination(playerPosition, helperCar, crashNormal) {
  const candidates = [];
  const tangent = new THREE.Vector3(-crashNormal.z, 0, crashNormal.x);
  for (const outwardDistance of [4.8, 6.2, 7.6, 9]) {
    for (const sideDistance of [0, 2.5, -2.5, 5, -5, 7.5, -7.5]) {
      candidates.push(
        playerPosition.clone()
          .addScaledVector(crashNormal, outwardDistance)
          .addScaledVector(tangent, sideDistance),
      );
    }
  }
  return candidates
    .filter((point) => Math.abs(point.x) < PLAYER_BOUNDS && Math.abs(point.z) < PLAYER_BOUNDS)
    .filter((point) => isPlayerOnlyLanePosition(point))
    .filter((point) => point.clone().sub(playerPosition).dot(crashNormal) >= 4.5)
    .filter((point) => !buildingObstacles.some((obstacle) =>
      Math.abs(point.x - obstacle.x) < obstacle.halfX + CAR_HALF_WIDTH + 0.45 &&
      Math.abs(point.z - obstacle.z) < obstacle.halfZ + CAR_HALF_LENGTH + 0.45,
    ))
    .filter((point) => !cars.some((car) =>
      car !== helperCar && car !== state.player && car.visible && point.distanceToSquared(car.position) < 24,
    ))
    .sort((a, b) => a.distanceToSquared(helperCar.position) - b.distanceToSquared(helperCar.position))[0] || null;
}

function updateBuildingHelperCar(car, dt) {
  const response = car.userData.buildingHelpResponse;
  if (!response) return;
  if (response.phase === "approach") {
    const delta = response.destination.clone().sub(car.position);
    if (delta.length() > 0.75) {
      const desiredYaw = Math.atan2(delta.x, delta.z);
      car.rotation.y = lerpAngle(car.rotation.y, desiredYaw, Math.min(1, dt * 1.8));
      car.userData.speed = moveToward(car.userData.speed || 0, 5.2, dt * 5.5);
      car.userData.velocity.copy(getForward(car)).multiplyScalar(car.userData.speed);
      const previous = car.position.clone();
      const candidate = car.position.clone().addScaledVector(car.userData.velocity, dt);
      if (!botMovementBlocked(car, candidate)) car.position.copy(candidate);
      else car.userData.speed = moveToward(car.userData.speed, 0, dt * 18);
      resolveBuildingCollisions(car, previous);
      car.userData.braking = car.userData.speed < 1;
      return;
    }
    response.phase = "stopping";
    response.stoppedAt = state.time;
  }
  car.userData.speed = 0;
  car.userData.velocity.set(0, 0, 0);
  car.userData.braking = true;
  car.rotation.y = lerpAngle(car.rotation.y, response.roadYaw, Math.min(1, dt * 2));
  const door = car.userData.driverDoor;
  if (door && !state.buildingHelper.person) door.rotation.y = moveToward(door.rotation.y, -1.05, dt * 2.8);
  if (!state.buildingHelper.person && state.time >= response.stoppedAt + 0.65 && (!door || door.rotation.y < -0.82)) {
    const person = makeNpcPedestrian(800);
    const exitPoint = new THREE.Vector3(2.3, 0, -0.35);
    car.localToWorld(exitPoint);
    person.position.copy(exitPoint);
    person.rotation.y = car.rotation.y;
    city.add(person);
    state.buildingHelper.person = person;
    response.phase = "walking";
    response.route = null;
    statusEl.textContent = "The driver pulled over and is coming to help";
  }
}

function updateBuildingCrashHelper(dt) {
  const helper = state.buildingHelper;
  if (!helper?.person) return;
  const response = helper.car.userData.buildingHelpResponse;
  const target = state.player.position.clone();
  const awayFromCar = helper.person.position.clone().sub(target).setY(0);
  if (awayFromCar.lengthSq() < 0.01) awayFromCar.set(1, 0, 0);
  target.addScaledVector(awayFromCar.normalize(), 2.4);
  if (!response.route || state.time >= (response.replanAt || 0)) {
    response.route = planCrashWalkingRoute(helper.person.position, target, helper.car);
    response.routeIndex = 0;
    response.replanAt = state.time + 1.3;
  }
  while (response.routeIndex < response.route.length - 1 && helper.person.position.distanceTo(response.route[response.routeIndex]) < 0.3) {
    response.routeIndex += 1;
  }
  const waypoint = response.route[response.routeIndex] || target;
  const delta = waypoint.clone().sub(helper.person.position);
  if (helper.person.position.distanceTo(target) < 0.35) {
    setNpcWalkingPose(helper.person.userData, 0);
    statusEl.textContent = "A nearby driver is here to help";
    return;
  }
  const distance = delta.length();
  if (distance < 0.01) return;
  delta.normalize();
  helper.person.position.addScaledVector(delta, Math.min(distance, dt * 2.2));
  helper.person.rotation.y = Math.atan2(delta.x, delta.z);
  helper.person.userData.gait += dt * 7;
  setNpcWalkingPose(helper.person.userData, Math.sin(helper.person.userData.gait) * 0.58);
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
    const botSignal = !data.player ? data.laneChange?.signal : null;
    const left = useHazard || (data.player ? state.signal === "left" : botSignal === "left");
    const right = useHazard || (data.player ? state.signal === "right" : botSignal === "right");
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
  camera.up.set(0, 1, 0);
  const targetFov = state.policePistolDrawn && keys.has("shift") ? 32 : 60;
  const nextFov = moveToward(camera.fov, targetFov, dt * 82);
  if (Math.abs(nextFov - camera.fov) > 0.001) {
    camera.fov = nextFov;
    camera.updateProjectionMatrix();
  }
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
    const personQuaternion = person.getWorldQuaternion(new THREE.Quaternion());
    if (state.policePistolDrawn || state.grenadeAimActive) {
      camera.up.set(0, 1, 0).applyQuaternion(personQuaternion).normalize();
      const eye = person.localToWorld(new THREE.Vector3(0, 1.86, 0));
      const direction = new THREE.Vector3(
        0,
        Math.sin(state.policeAim.pitch),
        Math.cos(state.policeAim.pitch),
      ).applyQuaternion(personQuaternion).normalize();
      camera.position.copy(eye).addScaledVector(direction, 0.16);
      camera.lookAt(eye.clone().addScaledVector(direction, 40));
      return;
    }
    const walkForward = new THREE.Vector3(Math.sin(person.rotation.y), 0, Math.cos(person.rotation.y));
    const target = person.position.clone().addScaledVector(walkForward, -15).add(new THREE.Vector3(0, 11, 0));
    if (state.grenadeCameraSnapBack) {
      camera.position.copy(target);
      state.grenadeCameraSnapBack = false;
    } else {
      camera.position.copy(target);
    }
    camera.lookAt(person.position.clone().addScaledVector(walkForward, 8).add(new THREE.Vector3(0, 2.2, 0)));
    return;
  }
  if (state.cameraView > 0) {
    const hoodView = state.cameraView === 1;
    if (!hoodView && state.time - state.cockpitLook.lastMovedAt >= 3) {
      state.cockpitLook.yaw = moveToward(state.cockpitLook.yaw, 0, dt * 0.92);
      state.cockpitLook.pitch = moveToward(state.cockpitLook.pitch, 0, dt * 0.68);
    }
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
    camera.up.set(0, 1, 0).applyQuaternion(car.getWorldQuaternion(new THREE.Quaternion())).normalize();
    // Close cameras must stay rigidly mounted. World-space smoothing makes them
    // lag through the car body when the player accelerates.
    camera.position.copy(target);
    camera.lookAt(look);
    return;
  }
  const baseForward = getWorldForward(car).setY(0);
  if (baseForward.lengthSq() < 0.01) baseForward.set(Math.sin(car.rotation.y), 0, Math.cos(car.rotation.y));
  baseForward.normalize();
  const forward = state.playerCrashed
    ? baseForward.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), state.crashLook.yaw).normalize()
    : baseForward;
  const carPosition = car.getWorldPosition(new THREE.Vector3());
  const vertical = state.playerCrashed ? new THREE.Vector3(0, 11 + state.crashLook.pitch, 0) : new THREE.Vector3(0, 11, 0);
  const target = carPosition.clone().addScaledVector(forward, -15).add(vertical);
  const look = carPosition.clone().addScaledVector(forward, 8).add(new THREE.Vector3(0, 2.2, 0));
  camera.position.copy(target);
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
  pistolCrosshairEl.hidden = !(state.policePistolDrawn || state.grenadeAimActive);
  const aimingDownSights = state.policePistolDrawn && state.policeAimZoom > 0.35;
  aimVignetteEl.hidden = !aimingDownSights;
  pistolCrosshairEl.classList.toggle("aiming", aimingDownSights);
  const speed = Math.round(Math.abs(state.player.userData.speed) * 2.237);
  gameClockEl.textContent = formatGameClock();
  const dashboardVisible = state.cameraView === 2 && !state.onFoot && !state.securityRoom && !state.policeInterview;
  const playerData = state.player.userData;
  if (playerData.cockpit) playerData.cockpit.visible = dashboardVisible;
  if (playerData.cabin) playerData.cabin.visible = !dashboardVisible;
  if (playerData.playerMarker) playerData.playerMarker.visible = !dashboardVisible;
  if (playerData.policeKit) playerData.policeKit.visible = !dashboardVisible;
  if (dashboardVisible) {
    const data = state.player.userData;
    state.backupCameraActive = state.gear === "reverse";
    const cockpit = data.cockpit;
    cockpit.userData.displayMaterial.map = state.backupCameraActive ? backupCameraTarget.texture : cockpit.userData.displayTexture;
    cockpit.userData.displayMaterial.needsUpdate = true;
    const speedRatio = THREE.MathUtils.clamp(Math.abs(data.speed || 0) / 36, 0, 1);
    const rpmRatio = Math.max(speedRatio, data.revRatio || 0);
    const rpm = Math.round((900 + rpmRatio * 6200) / 50) * 50;
    const blinkOn = Math.sin((data.blink || 0) * Math.PI) > 0;
    const hazardsOn = state.hazard || data.hazard;
    updateCockpitDisplay(speed, rpm, blinkOn && (hazardsOn || state.signal === "left"), blinkOn && (hazardsOn || state.signal === "right"));
    updateReverseWarningDisplay(cockpit);
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
    if (state.grenadeCharging) {
      const chargePercent = Math.round(THREE.MathUtils.clamp((state.time - state.grenadeChargeStartedAt) / 2, 0, 1) * 100);
      statusEl.textContent = `Charging grenade throw ${chargePercent}% — release Q`;
    } else if (state.policePistolDrawn) {
      statusEl.textContent = state.policeWeapon === "rpg"
        ? "RPG drawn — E selects pistol · click to fire · P to holster"
        : "Pistol drawn — E selects RPG · Shift to aim · click or hold for automatic fire · P to holster";
    } else {
      const distance = state.pedestrian.position.distanceTo(state.player.position);
      statusEl.textContent = state.player.userData.crashed || state.player.userData.immobilized
        ? "Wrecked car — continue on foot or restart"
        : distance <= 3.3 ? "Press C to get back in" : "On foot — follow the blue beacon to your car";
    }
  } else if (state.policeMode) {
    const stop = state.policeTarget?.userData.policePullOver;
    statusEl.textContent = !stop
      ? "POLICE MODE — click a bot car to initiate a stop"
      : stop.complete
        ? state.policeSiren
          ? "Vehicle pulled over — press 1 to speak with driver — O toggles siren"
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
  const player = state.player;
  const mapScale = 3.1;
  context.fillStyle = "#08171d";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.lineCap = "round";
  context.lineWidth = 17;
  context.strokeStyle = "#26363c";
  const heading = player.rotation.y;
  const headingSin = Math.sin(heading);
  const headingCos = Math.cos(heading);
  const projectMapPoint = (worldX, worldZ) => {
    const deltaX = worldX - player.position.x;
    const deltaZ = worldZ - player.position.z;
    return {
      x: canvas.width / 2 - (deltaX * headingCos - deltaZ * headingSin) * mapScale,
      y: canvas.height / 2 - (deltaX * headingSin + deltaZ * headingCos) * mapScale,
    };
  };
  for (const road of GRID) {
    const verticalStart = projectMapPoint(road, -BOUNDS);
    const verticalEnd = projectMapPoint(road, BOUNDS);
    context.beginPath();
    context.moveTo(verticalStart.x, verticalStart.y);
    context.lineTo(verticalEnd.x, verticalEnd.y);
    context.stroke();
    const horizontalStart = projectMapPoint(-BOUNDS, road);
    const horizontalEnd = projectMapPoint(BOUNDS, road);
    context.beginPath();
    context.moveTo(horizontalStart.x, horizontalStart.y);
    context.lineTo(horizontalEnd.x, horizontalEnd.y);
    context.stroke();
  }
  context.strokeStyle = "#b64a4a";
  context.lineWidth = 7;
  const drawRaceEllipse = (radiusX, radiusZ) => {
    context.beginPath();
    for (let i = 0; i <= 72; i++) {
      const angle = (i / 72) * Math.PI * 2;
      const point = projectMapPoint(
        RACE_CENTER_X + Math.cos(angle) * radiusX,
        Math.sin(angle) * radiusZ,
      );
      if (i === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    }
    context.stroke();
  };
  drawRaceEllipse(RACE_OUTER_X, RACE_OUTER_Z);
  drawRaceEllipse(RACE_INNER_X, RACE_INNER_Z);
  const raceEntranceStart = projectMapPoint(BOUNDS - 2, -5);
  const raceEntranceEnd = projectMapPoint(RACE_CENTER_X - RACE_OUTER_X + 2, -5);
  const raceEntranceStartBottom = projectMapPoint(BOUNDS - 2, 5);
  const raceEntranceEndBottom = projectMapPoint(RACE_CENTER_X - RACE_OUTER_X + 2, 5);
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(raceEntranceStart.x, raceEntranceStart.y);
  context.lineTo(raceEntranceEnd.x, raceEntranceEnd.y);
  context.moveTo(raceEntranceStartBottom.x, raceEntranceStartBottom.y);
  context.lineTo(raceEntranceEndBottom.x, raceEntranceEndBottom.y);
  context.stroke();
  context.lineWidth = 3;
  context.strokeStyle = "#5a747e";
  context.setLineDash([8, 9]);
  context.beginPath();
  context.moveTo(canvas.width / 2, 0);
  context.lineTo(canvas.width / 2, canvas.height);
  context.moveTo(0, canvas.height / 2);
  context.lineTo(canvas.width, canvas.height / 2);
  context.stroke();
  context.setLineDash([]);
  context.save();
  context.translate(canvas.width / 2, canvas.height / 2);
  context.fillStyle = state.policeMode ? "#4ea0ff" : "#55e6ff";
  context.strokeStyle = "#e9fcff";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(0, -19);
  context.lineTo(13, 16);
  context.lineTo(0, 10);
  context.lineTo(-13, 16);
  context.closePath();
  context.fill();
  context.stroke();
  context.restore();
  const raceLabel = projectMapPoint(RACE_CENTER_X, 0);
  if (raceLabel.x > 0 && raceLabel.x < canvas.width && raceLabel.y > 0 && raceLabel.y < canvas.height) {
    context.fillStyle = "#ffb1a7";
    context.font = "bold 18px system-ui";
    context.textAlign = "center";
    context.fillText("RACE TRACK", raceLabel.x, raceLabel.y + 6);
  }
  context.fillStyle = "rgba(5, 12, 15, 0.82)";
  context.fillRect(12, 12, 116, 34);
  context.fillStyle = "#dff8ff";
  context.font = "bold 21px system-ui";
  context.textAlign = "left";
  context.fillText("GPS · LIVE", 24, 36);
  cockpit.userData.displayTexture.needsUpdate = true;

  const clusterCanvas = cockpit.userData.clusterCanvas;
  const clusterContext = clusterCanvas.getContext("2d");
  clusterContext.fillStyle = "#05090b";
  clusterContext.fillRect(0, 0, clusterCanvas.width, clusterCanvas.height);
  clusterContext.fillStyle = leftActive ? "#ffb000" : "#36444a";
  clusterContext.font = "bold 38px system-ui";
  clusterContext.fillText("◀", 18, 48);
  clusterContext.fillStyle = rightActive ? "#ffb000" : "#36444a";
  clusterContext.fillText("▶", 322, 48);
  clusterContext.fillStyle = "#f4fbff";
  clusterContext.font = "bold 76px system-ui";
  clusterContext.textAlign = "center";
  clusterContext.fillText(String(speed), 192, 93);
  clusterContext.fillStyle = "#8faab5";
  clusterContext.font = "bold 21px system-ui";
  clusterContext.fillText("MPH", 192, 119);
  clusterContext.fillStyle = "#65d6ff";
  clusterContext.font = "bold 24px system-ui";
  clusterContext.fillText(`${rpm} RPM`, 192, 160);
  clusterContext.fillStyle = state.gear === "reverse" ? "#ffb64d" : "#66e59a";
  clusterContext.font = "bold 28px system-ui";
  clusterContext.textAlign = "right";
  clusterContext.fillText(state.gear === "reverse" ? "R" : "D", 356, 170);
  clusterContext.fillStyle = "#ffdc69";
  clusterContext.font = "bold 16px system-ui";
  clusterContext.fillText(formatGameClock(), 366, 27);
  if (state.policeMode) {
    clusterContext.fillStyle = "#e32636";
    clusterContext.fillRect(0, 0, clusterCanvas.width / 2, 8);
    clusterContext.fillStyle = "#247cff";
    clusterContext.fillRect(clusterCanvas.width / 2, 0, clusterCanvas.width / 2, 8);
  }
  clusterContext.textAlign = "start";
  cockpit.userData.clusterTexture.needsUpdate = true;
  const gearZ = state.gearDragging ? state.gearDragZ : state.gear === "reverse" ? -0.16 : 0.16;
  cockpit.userData.shifterLever.position.z = gearZ;
  cockpit.userData.shifterLever.rotation.x = gearZ * 0.7;
}

function updateReverseWarningDisplay(cockpit) {
  const canvas = cockpit.userData.reverseWarningCanvas;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  const direction = state.reverseCrossTrafficDirection;
  cockpit.userData.reverseWarning.visible = state.backupCameraActive && Boolean(direction);
  if (!direction) {
    cockpit.userData.reverseWarningTexture.needsUpdate = true;
    return;
  }

  const warningRight = direction === "right";
  const warningPulse = Math.sin(state.time * 18) > -0.25;
  context.fillStyle = warningPulse ? "rgba(220, 20, 20, 0.92)" : "rgba(105, 8, 8, 0.8)";
  context.beginPath();
  context.roundRect(120, 38, 272, 180, 24);
  context.fill();
  context.fillStyle = "#ffffff";
  context.font = "bold 112px system-ui";
  context.textAlign = "center";
  context.fillText(warningRight ? "▶" : "◀", 256, 154);
  context.font = "bold 24px system-ui";
  context.fillText("CROSS TRAFFIC", 256, 198);
  cockpit.userData.reverseWarningTexture.needsUpdate = true;
}

function onKeyDown(event) {
  const key = normalizeKey(event);
  if (!key) return;
  if (state.settingsOpen) {
    if (key === "escape") {
      event.preventDefault();
      closeSettings();
    }
    return;
  }
  ensureAudio();
  keys.add(key);
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "space", "q", "e", "f", "z", "c", "d", "h", "l", "p", "o", "1"].includes(key)) {
    event.preventDefault();
    event.stopPropagation();
  }
  if (event.repeat && key === "q" && state.grenadeCharging && !state.grenadeAimActive) {
    state.grenadeAimActive = true;
    const pointerLockRequest = renderer.domElement.requestPointerLock?.();
    pointerLockRequest?.catch?.(() => {});
  }
  if (event.repeat && ["q", "e", "f", "z", "c", "d", "h", "l", "p", "o", "1"].includes(key)) return;
  if (key === "escape" && state.securityRoom) {
    state.securitySelected = null;
    event.preventDefault();
    return;
  }
  if (state.toggleHeld.has(key)) return;
  if (key === "q") {
    if (state.onFoot && !state.securityRoom) {
      state.grenadeCharging = true;
      state.grenadeAimActive = false;
      state.grenadeChargeStartedAt = state.time;
      state.policeAim.yaw = state.pedestrian.rotation.y;
      state.policeAim.pitch = 0;
      renderer.domElement.focus();
      window.setTimeout(() => {
        if (!state.grenadeCharging || !keys.has("q")) return;
        state.grenadeAimActive = true;
        const pointerLockRequest = renderer.domElement.requestPointerLock?.();
        pointerLockRequest?.catch?.(() => {});
      }, 220);
      statusEl.textContent = "Charging grenade throw — release Q to throw";
    } else if (!state.onFoot) toggleSignal("left");
  }
  if (key === "e") {
    if (state.policePistolDrawn) switchPoliceWeapon();
    else toggleSignal("right");
  }
  if (key === "f") togglePoliceFlashlight();
  if (key === "z") toggleHazards();
  if (key === "c") toggleCarExit();
  if (key === "d" && !state.introActive && !state.onFoot && !state.securityRoom && !state.policeInterview) {
    state.cameraView = (state.cameraView + 1) % 3;
    state.cockpitLook.yaw = 0;
    state.cockpitLook.pitch = 0;
    state.cockpitLook.lastMovedAt = state.time;
    const viewName = ["Normal view", "Hood view", "Dashboard view"][state.cameraView];
    statusEl.textContent = `${viewName} — D changes view`;
  }
  if (key === "h" && !state.onFoot && !state.securityRoom) startPlayerHorn();
  if (key === "l" && !state.onFoot && !state.securityRoom) {
    state.playerHeadlights = !state.playerHeadlights;
    ensurePlayerHeadlightBeams(state.player);
    updateVehicleHeadlights(state.daylight < 0.45);
    statusEl.textContent = state.playerHeadlights ? "Headlights on" : "Headlights off";
  }
  if (key === "p") {
    if (state.onFoot && state.policeMode) togglePolicePistol();
    else togglePoliceMode();
  }
  if (key === "1") togglePoliceInterview();
  if (key === "o" && state.policeMode && !state.onFoot && !state.securityRoom) {
    if (state.policeSiren) {
      stopPoliceSiren();
      statusEl.textContent = "Police siren off";
    } else {
      startPoliceSiren();
      statusEl.textContent = "Police siren on — traffic yielding";
    }
  }
  if (["q", "e", "f", "z", "c", "d", "h", "l", "p", "o", "1"].includes(key)) state.toggleHeld.add(key);
}

function onKeyPress(event) {
  const key = normalizeKey(event);
  if (!["q", "e", "z", "c"].includes(key)) return;
  event.preventDefault();
  event.stopPropagation();
  if (state.toggleHeld.has(key)) return;
  if (key === "q") {
    if (state.onFoot) return;
    toggleSignal("left");
  }
  if (key === "e") {
    if (state.policePistolDrawn) switchPoliceWeapon();
    else toggleSignal("right");
  }
  if (key === "z") toggleHazards();
  if (key === "c") toggleCarExit();
  state.toggleHeld.add(key);
}

function onKeyUp(event) {
  const key = normalizeKey(event);
  if (!key) return;
  if (key === "h") stopPlayerHorn();
  if (key === "q" && state.grenadeCharging) {
    const chargeSeconds = Math.max(0, state.time - state.grenadeChargeStartedAt);
    const wasAimingGrenade = state.grenadeAimActive;
    state.grenadeCharging = false;
    state.grenadeAimActive = false;
    throwGrenade(chargeSeconds);
    if (!state.policePistolDrawn) {
      state.grenadeCameraSnapBack = wasAimingGrenade;
      if (document.pointerLockElement === renderer.domElement) document.exitPointerLock?.();
    }
  }
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
  if (state.policePistolDrawn) {
    if (state.policeWeapon === "rpg") {
      firePoliceRpg();
    } else {
      state.policeTriggerHeld = true;
      state.policeTriggerStartedAt = state.time;
      firePolicePistol(false);
    }
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
  if (beginGearDrag(event)) return;
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
  if (state.gearDragging) {
    const dragDistance = event.clientY - state.gearDragStartY;
    state.gearDragZ = THREE.MathUtils.clamp(state.gearDragStartZ - dragDistance * 0.006, -0.16, 0.16);
    if (state.gearDragZ < -0.045) setPlayerGear("reverse");
    else if (state.gearDragZ > 0.045) setPlayerGear("drive");
    event.preventDefault();
    return;
  }
  if (state.policePistolDrawn || state.grenadeAimActive) {
    state.policeAim.yaw -= event.movementX * 0.0025;
    state.policeAim.pitch = THREE.MathUtils.clamp(state.policeAim.pitch - event.movementY * 0.0022, -1.15, 1.15);
    state.pedestrian.rotation.y = state.policeAim.yaw;
    event.preventDefault();
    return;
  }
  if (state.cameraView === 2 && !state.onFoot && !state.securityRoom && !state.policeInterview) {
    const rect = renderer.domElement.getBoundingClientRect();
    const x = THREE.MathUtils.clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    const y = THREE.MathUtils.clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
    state.cockpitLook.yaw = -x * 1.42;
    state.cockpitLook.pitch = y * 0.34;
    state.cockpitLook.lastMovedAt = state.time;
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
  state.policeTriggerHeld = false;
  state.crashLook.active = false;
  state.gearDragging = false;
}

function beginGearDrag(event) {
  if (state.cameraView !== 2 || state.onFoot || state.securityRoom || state.policeInterview || state.carTransition) return false;
  const cockpit = state.player.userData.cockpit;
  if (!cockpit?.visible) return false;
  const rect = renderer.domElement.getBoundingClientRect();
  policePointer.set(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );
  policeRaycaster.setFromCamera(policePointer, camera);
  const hit = policeRaycaster.intersectObject(cockpit, true).find((entry) => entry.object.userData.gearSelector);
  if (!hit) return false;
  state.gearDragging = true;
  state.gearDragStartY = event.clientY;
  state.gearDragStartZ = state.gear === "reverse" ? -0.16 : 0.16;
  state.gearDragZ = state.gearDragStartZ;
  renderer.domElement.setPointerCapture?.(event.pointerId);
  statusEl.textContent = `Drag up for Drive · down for Reverse — currently ${state.gear === "reverse" ? "R" : "D"}`;
  event.preventDefault();
  return true;
}

function setPlayerGear(gear) {
  if (gear === state.gear) return;
  state.gear = gear;
  state.backupCameraActive = gear === "reverse";
  statusEl.textContent = gear === "reverse" ? "Reverse selected — ↑ accelerates backward" : "Drive selected — ↑ accelerates forward";
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
    KeyL: "l",
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
  ensureAudio();
  const occupied = direction === "left" ? state.blindSpotLeft : state.blindSpotRight;
  if (state.signal === direction && occupied) requestBlindSpotBeep();
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

function playReverseCrossTrafficBeep() {
  const audio = ensureAudio();
  if (!audio) return;
  if (audio.state === "suspended") audio.resume();
  const now = audio.currentTime;
  for (const [index, offset] of [0, 0.19, 0.55, 0.74].entries()) {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = now + offset;
    const end = start + 0.13;
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(index % 2 === 0 ? 920 : 780, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.28, start + 0.012);
    gain.gain.setValueAtTime(0.28, end - 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(end + 0.01);
  }
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
  state.grenadeCharging = false;
  state.grenadeAimActive = false;
  state.grenadeCameraSnapBack = false;
  holsterPolicePistol();
  setPoliceFlashlight(false);
  for (const grenade of grenades) city.remove(grenade.mesh);
  grenades.length = 0;
  for (const effect of weaponEffects) {
    city.remove(effect.mesh);
    effect.mesh.geometry?.dispose();
    effect.mesh.material?.dispose();
  }
  weaponEffects.length = 0;
  stopPoliceSiren();
  state.policeMode = false;
  state.policeTarget = null;
  state.policeSiren = null;
  state.policeInterview = false;
  state.policeConversation = null;
  document.body.classList.remove("police-interview");
  policeInteractionEl.hidden = true;
  if (state.pedestrian) city.remove(state.pedestrian);
  if (state.grenadeChargeMeter) city.remove(state.grenadeChargeMeter);
  state.grenadeChargeMeter = null;
  if (state.carBeacon) city.remove(state.carBeacon);
  if (state.crashMeeting?.arrow) city.remove(state.crashMeeting.arrow);
  if (state.buildingHelper?.person) city.remove(state.buildingHelper.person);
  for (const responder of crashResponders) {
    if (responder.person) city.remove(responder.person);
  }
  for (const driver of hijackedDrivers) city.remove(driver);
  hijackedDrivers.length = 0;
  crashResponders.length = 0;
  state.crashMeeting = null;
  state.buildingHelper = null;
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
  state.cameraView = 2;
  state.backupCameraActive = false;
  state.reverseCrossTrafficDirection = null;
  state.lastReverseCrossTrafficBeep = -10;
  state.blindSpotLeft = false;
  state.blindSpotRight = false;
  state.lastBlindSpotBeep = -10;
  state.gear = "drive";
  state.gearDragging = false;
  state.gearDragZ = 0.16;
  state.cockpitLook.yaw = 0;
  state.cockpitLook.pitch = 0;
  state.cockpitLook.lastMovedAt = -Infinity;
  state.greenBlockTimer = 0;
  state.greenIntersectionPass = null;
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
    const impactSpeed = Math.max(0, -normalSpeed);
    if (car.userData.player && !car.userData.destroyed && impactSpeed >= PLAYER_BUILDING_CRASH_SPEED) {
      triggerPlayerBuildingCrash(car, normal, velocity, impactSpeed);
      hit = true;
      break;
    }
    if (normalSpeed < 0) {
      velocity.addScaledVector(normal, -(1 + BUILDING_BOUNCE) * normalSpeed);
    }
    car.userData.speed = Math.min(0, velocity.dot(getForward(car))) * 0.35;
    car.userData.velocity.copy(velocity.multiplyScalar(0.25));
    hit = true;
  }
  if (hit && Math.abs(car.userData.speed) < 1.2) car.userData.speed = 0;
}

function triggerPlayerBuildingCrash(car, normal, incomingVelocity, impactSpeed) {
  const data = car.userData;
  data.destroyed = true;
  data.driveDamage = 1;
  data.limpMode = false;
  data.speed = 0;
  data.velocity.set(0, 0, 0);
  data.angularVelocity = 0;
  data.crashed = false;
  data.immobilized = true;
  data.braking = true;
  data.hazard = true;
  data.buildingCrashNormal = normal.clone();
  const localNormal = normal.clone().applyQuaternion(car.quaternion.clone().invert());
  data.cockpitImpact = {
    direction: localNormal,
    strength: THREE.MathUtils.clamp(impactSpeed / 22, 0.5, 1),
    spin: 0,
    startedAt: state.time,
  };
  spawnCollisionDamage(car, normal, incomingVelocity, impactSpeed);
  playCrashSound(Math.min(1, impactSpeed / 20));
  state.crashed = true;
  state.playerCrashed = true;
  restartBtn.hidden = false;
  statusEl.textContent = "Car destroyed by building impact";
  startBuildingCrashHelp();
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
  const next = { x: bot.position.x, z: bot.position.z, dir: data.dir, laneIndex: data.laneIndex || 0 };
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
