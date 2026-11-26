import * as THREE from 'three';
import { useGameStore, type Quality, onQualityChange, onPauseChange } from './store';
import { initInput, readInput } from './input';
import { createCollisionWorld } from '../physics/collision';
import { createPlayer, stepPlayer, BOUND } from '../player/player';
import {
  createVehicle, stepVehicle, enterVehicle, exitVehicle, nearestVehicle,
  type Vehicle
} from '../vehicle/vehicle';
import type { VehicleCategory } from '../vehicle/specs';
import { buildWorld } from '../world/builder';
import { buildProps } from '../world/props';
import { loadDhakaTile, type DhakaTile } from '../world/dhakaTile';
import { disposeMaterials } from '../world/materials';
import { minimapState, resetMinimap } from './minimap';
import { evalWater, applyBuoyancy } from '../water/water';
import { createWeather, stepWeather } from '../weather/weather';
import { RainSystem } from '../weather/rain';
import { createNpcSystem } from '../npcs/pedestrians';
import { createTrafficSystem } from '../traffic/traffic';
import { createTrafficLights } from '../traffic/trafficLights';
import { buildInteriors, type InteriorSystem } from '../interiors/interiors';
import { createAudioSystem, type AudioSystem } from '../audio/audio';
import { saveGame, loadGame } from '../saves/saves';
import { cloudSave, cloudLoad } from '../backend/client';
import { createStreamingManager } from '../geography/streaming';
import { travelState } from './travelState';
import { previewTileFallback } from './tileFallback';
import { createAdaptiveResolution } from './adaptive';
import { detectGpu } from './gpuDetect';
import { createStagedLoader } from './stagedLoader';

export interface Engine {
  dispose(): void;
}

interface QualityProfile {
  renderScale: number;
  shadowMapSize: number;
  fogFar: number;
  treeCount: number;
  pixelRatioCap: number;
  npcCount: number;
  trafficCount: number;
}

const QUALITY: Record<Quality, QualityProfile> = {
  low: { renderScale: 0.5, shadowMapSize: 512, fogFar: 240, treeCount: 40, pixelRatioCap: 1.5, npcCount: 20, trafficCount: 12 },
  medium: { renderScale: 0.75, shadowMapSize: 1024, fogFar: 320, treeCount: 70, pixelRatioCap: 1.5, npcCount: 40, trafficCount: 20 },
  high: { renderScale: 1.0, shadowMapSize: 2048, fogFar: 400, treeCount: 100, pixelRatioCap: 2, npcCount: 60, trafficCount: 28 },
  ultra: { renderScale: 1.0, shadowMapSize: 4096, fogFar: 500, treeCount: 140, pixelRatioCap: 2, npcCount: 90, trafficCount: 40 }
};

const DAY_LENGTH = 300;
const ENTER_RANGE = 4.5;
const DOOR_RANGE = 2.6;

const FLEET: Array<{ category: VehicleCategory; x: number; z: number; yaw: number }> = [
  { category: 'sedan', x: 10, z: -46, yaw: 0 },
  { category: 'cng', x: 14, z: -38, yaw: 0.3 },
  { category: 'rickshaw', x: -14, z: -38, yaw: -0.3 },
  { category: 'motorcycle', x: 18, z: -46, yaw: 0 },
  { category: 'bus', x: 28, z: -60, yaw: Math.PI / 2 }
];

const ENGINE_PITCH: Record<VehicleCategory, number> = {
  sedan: 0.55, cng: 0.8, rickshaw: 0.9, motorcycle: 0.65, bus: 0.25
};

export async function createEngine(canvas: HTMLCanvasElement): Promise<Engine> {
  const store = useGameStore.getState();
  store.setTouch(matchMedia('(pointer: coarse)').matches);
  store.setProgress(10, 'Starting renderer…');

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch (err) {
    throw new Error(
      'WebGL is not available in this browser. ' +
        (err instanceof Error ? err.message : '')
    );
  }
  const prof = QUALITY[useGameStore.getState().quality] ?? QUALITY.high;
  const adaptive = createAdaptiveResolution();
  const applyResolution = () => {
    const ratio = Math.min(devicePixelRatio, prof.pixelRatioCap) * adaptive.scale;
    renderer.setPixelRatio(ratio);
    renderer.setSize(innerWidth, innerHeight, false);
  };
  applyResolution();
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  store.setProgress(20, 'Renderer ready');
  await frame();

  const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 1200);
  store.setProgress(30, 'Camera ready');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9fb8c8);
  scene.fog = new THREE.Fog(0x9fb8c8, prof.fogFar / 3, prof.fogFar);
  const hemi = new THREE.HemisphereLight(0xbfd6e4, 0x3a4030, 0.85);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe9c4, 2.0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(prof.shadowMapSize, prof.shadowMapSize);
  sun.shadow.camera.left = -90;
  sun.shadow.camera.right = 90;
  sun.shadow.camera.top = 90;
  sun.shadow.camera.bottom = -90;
  sun.shadow.camera.far = 500;
  sun.shadow.bias = -0.0004;
  scene.add(sun, sun.target);
  store.setProgress(40, 'Scene ready');
  await frame();

  // GPU capability probe (non-blocking; WebGL2 stays the renderer)
  void detectGpu().then((cap) => {
    useGameStore.getState().setStatus(
      cap.webgpu ? 'WebGPU available (renderer: WebGL2)' : 'Renderer: WebGL2'
    );
  });

  let physics = createCollisionWorld();
  store.setProgress(55, 'Physics ready');
  await frame();

  store.setProgress(65, 'World data…');
  const streaming = createStreamingManager(() => previewTileFallback());
  let tile = await streaming.getActive();
  useGameStore.getState().setHud({
    preview: tile.preview,
    location: tile.name
  });
  travelState.currentDistrict = streaming.currentDistrictId ?? 'dhaka';

  store.setProgress(75, 'World geometry…');
  let world = buildWorld(scene, physics, tile, prof.treeCount);
  let props = buildProps(tile);
  scene.add(props.group);
  let interiors: InteriorSystem = buildInteriors(scene, physics);
  let lights = createTrafficLights(scene, tile);
  store.setProgress(85, 'Characters & traffic…');
  await frame();

  resetMinimap();
  minimapState.roads = tile.roads.map((r) => ({ x1: r.x1, z1: r.z1, x2: r.x2, z2: r.z2, width: r.width }));
  minimapState.buildings = tile.buildings.map((b) => ({ x: b.x, z: b.z, w: b.w, d: b.d }));
  minimapState.water = tile.water.map((w) => ({ x: w.cx, z: w.cz, r: w.r }));

  const player = createPlayer(scene);
  const fleet: Vehicle[] = FLEET.map((f) =>
    createVehicle(scene, f.category, f.x, f.z, f.yaw)
  );
  player.group.position.copy(player.pos);

  const weather = createWeather();
  const rain = new RainSystem(scene, 2400);
  let npcs = createNpcSystem(scene, tile, prof.npcCount);
  let traffic = createTrafficSystem(scene, tile, prof.trafficCount);
  const audio: AudioSystem = createAudioSystem();

  const cleanupInput = initInput();

  store.setProgress(92, 'Compiling shaders…');
  renderer.compile(scene, camera);
  await frame();
  store.setProgress(100, 'Ready');
  await frame();

  const offQuality = onQualityChange((q) => {
    const np = QUALITY[q] ?? QUALITY.high;
    sun.shadow.mapSize.set(np.shadowMapSize, np.shadowMapSize);
    if (sun.shadow.map) {
      sun.shadow.map.dispose();
      sun.shadow.map = null;
    }
    prof.fogFar = np.fogFar;
    prof.pixelRatioCap = np.pixelRatioCap;
    adaptive.reset();
    applyResolution();
  });

  let paused = false;
  const offPause = onPauseChange((p) => {
    paused = p;
  });

  const onKey = (e: KeyboardEvent) => {
    if (e.code === 'Escape') {
      useGameStore.getState().setPaused(!useGameStore.getState().paused);
    }
  };
  window.addEventListener('keydown', onKey);

  const unlockAudio = () => audio.unlock();
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });

  let disposed = false;
  let last = performance.now();
  let raf = 0;
  let fpsT = 0;
  let fpsN = 0;
  let hudT = 0;
  let stepT = 0;
  let dayT = 0.22;
  let traveling = false;
  const camState = { yaw: Math.PI, pitch: -0.18, dist: 6.4 };
  const camPos = new THREE.Vector3(4, 3, -34);
  const skyDay = new THREE.Color(0x9fb8c8);
  const skyNight = new THREE.Color(0x0a1424);
  const skyRain = new THREE.Color(0x6a7a88);
  const underwaterFogColor = new THREE.Color(0x1a5a7a);
  const dir = new THREE.Vector3();
  const want = new THREE.Vector3();
  let activeVehicle: Vehicle | null = null;
  let qualityFogFar = prof.fogFar;
  const rnd = () => Math.random();
  const staged = createStagedLoader();

  function stepWeatherAndSky(dt: number): void {
    stepWeather(weather, dt, rnd);
    dayT = (dayT + dt / DAY_LENGTH) % 1;
    const elev = Math.sin((dayT - 0.25) * Math.PI * 2);
    const sunAngle = (dayT - 0.25) * Math.PI * 2;
    sun.position.set(
      Math.cos(sunAngle) * 220,
      elev * 260 + 10,
      Math.sin(sunAngle) * 60 + 40
    );
    const day = Math.max(0, Math.min(1, elev * 1.6 + 0.35));
    sun.intensity = day * 2.1 * weather.darkness;
    sun.color.setHSL(
      0.09,
      Math.min(0.5, day * 0.5),
      Math.max(0.42, Math.min(0.66, 0.5 + elev * 0.12))
    );
    const sky = skyNight.clone().lerp(skyDay, day);
    sky.lerp(skyRain, weather.intensity * 0.7);
    if (weather.flash > 0) sky.lerp(new THREE.Color(0xdfe9f4), 0.7);
    scene.background = sky;
    hemi.intensity = (0.12 + day * 0.8) * weather.darkness;

    const underwater =
      !activeVehicle && evalWater(player.pos, world.waterZones).state === 'underwater';
    if (underwater) {
      scene.fog!.color.copy(underwaterFogColor);
      scene.fog!.near = 0.1;
      scene.fog!.far = 12;
    } else {
      scene.fog!.color.copy(sky);
      scene.fog!.near = (qualityFogFar / 3) * weather.visibility;
      scene.fog!.far = qualityFogFar * weather.visibility;
    }
  }

  function pushClock(): void {
    const hh = Math.floor(dayT * 24);
    const mm = Math.floor(((dayT * 24) % 1) * 60);
    const elev = Math.sin((dayT - 0.25) * Math.PI * 2);
    useGameStore.getState().setHud({
      clock: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
      phase: elev > 0 ? 'Day' : 'Night'
    });
  }

  function saveDataNow() {
    return {
      version: 1 as const,
      savedAt: Date.now(),
      player: { x: player.pos.x, y: player.pos.y, z: player.pos.z, yaw: player.yaw },
      dayT,
      weatherKind: weather.kind,
      quality: useGameStore.getState().quality,
      district: travelState.currentDistrict
    };
  }

  function applyLoaded(data: {
    player: { x: number; y: number; z: number; yaw: number };
    dayT: number;
  }): void {
    player.pos.set(data.player.x, data.player.y, data.player.z);
    player.yaw = data.player.yaw;
    dayT = data.dayT;
  }

  function handleSaveLoad(): void {
    const req = travelState.saveRequest;
    if (!req) return;
    travelState.saveRequest = null;
    if (req.kind === 'save') {
      const data = saveDataNow();
      void cloudSave(req.slot, data).then((r) => {
        travelState.saveResult = r.msg;
      });
      saveGame(req.slot, data);
    } else {
      void cloudLoad(req.slot).then((r) => {
        travelState.saveResult = r.msg;
        if (r.ok && r.data) applyLoaded(r.data);
      });
    }
  }

  /** Staged async travel: the frame loop keeps rendering (with the loading
   *  overlay up) while the rebuild happens a step per frame. */
  async function handleTravel(): Promise<void> {
    const dest = travelState.travelRequest;
    if (!dest || dest === travelState.currentDistrict || traveling) {
      travelState.travelRequest = null;
      return;
    }
    travelState.travelRequest = null;
    traveling = true;
    travelState.travelProgress = 0.05;
    useGameStore.getState().setProgress(20, `Loading ${dest}…`);
    const newTile = await streaming.travelTo(dest);
    travelState.currentDistrict = dest;

    const old = { props, world, lights, npcs, traffic, interiors, physics };
    let newWorld!: ReturnType<typeof buildWorld>;
    let newProps!: ReturnType<typeof buildProps>;
    let newInteriors!: InteriorSystem;
    let newLights!: ReturnType<typeof createTrafficLights>;
    let newNpcs!: ReturnType<typeof createNpcSystem>;
    let newTraffic!: ReturnType<typeof createTrafficSystem>;
    let newPhysics!: ReturnType<typeof createCollisionWorld>;

    try {
      await staged.run(
        [
          { label: `Unloading ${travelState.travelTarget ?? 'old tile'}…`, fn: () => {} },
          { label: 'Disposing old systems…', fn: () => {
            old.props.dispose();
            old.world.dispose();
            old.lights.dispose();
            old.npcs.dispose();
            old.traffic.dispose();
            old.interiors.dispose();
            old.physics.dispose();
          }},
          { label: 'Building terrain & roads…', fn: () => {
            newPhysics = createCollisionWorld();
            newWorld = buildWorld(scene, newPhysics, newTile, prof.treeCount);
          }},
          { label: 'Placing props & shops…', fn: () => {
            newProps = buildProps(newTile);
            scene.add(newProps.group);
            newInteriors = buildInteriors(scene, newPhysics);
          }},
          { label: 'Setting up traffic…', fn: () => {
            newLights = createTrafficLights(scene, newTile);
            newNpcs = createNpcSystem(scene, newTile, prof.npcCount);
            newTraffic = createTrafficSystem(scene, newTile, prof.trafficCount);
          }},
          { label: 'Finalizing…', fn: () => {
            physics = newPhysics;
            world = newWorld;
            props = newProps;
            interiors = newInteriors;
            lights = newLights;
            npcs = newNpcs;
            traffic = newTraffic;
            tile = newTile;

            resetMinimap();
            minimapState.roads = newTile.roads.map((r) => ({ x1: r.x1, z1: r.z1, x2: r.x2, z2: r.z2, width: r.width }));
            minimapState.buildings = newTile.buildings.map((b) => ({ x: b.x, z: b.z, w: b.w, d: b.d }));
            minimapState.water = newTile.water.map((w) => ({ x: w.cx, z: w.cz, r: w.r }));

            player.pos.set(4, 0, -40);
            player.vel.set(0, 0, 0);
            player.yaw = Math.PI;
            if (activeVehicle) {
              activeVehicle.occupied = false;
              activeVehicle = null;
              player.group.visible = true;
              useGameStore.getState().setHud({ speed: null });
            }
          }}
        ],
        (p, label) => {
          travelState.travelProgress = p;
          useGameStore.getState().setProgress(20 + p * 75, label);
        }
      );
    } catch (err) {
      useGameStore.getState().setBootError(
        `Travel failed: ${err instanceof Error ? err.message : String(err)}`
      );
      traveling = false;
      return;
    }

    travelState.travelProgress = 1;
    traveling = false;
    adaptive.reset();
    useGameStore.getState().setProgress(100, 'Ready');
    useGameStore.getState().setHud({
      preview: newTile.preview,
      location: newTile.name
    });
  }

  function loop(now: number): void {
    if (disposed) return;
    raf = requestAnimationFrame(loop);
    const dt = paused ? 0 : Math.min((now - last) / 1000, 0.05);
    last = now;
    if (paused) {
      renderer.render(scene, camera);
      return;
    }
    // during travel the loop keeps running; world refs are consistent because
    // the swap happens in one atomic step at the end of the staged build
    const isTraveling = traveling;

    stepWeatherAndSky(dt);
    handleSaveLoad();
    if (!isTraveling) lights.update(dt);
    const snap = readInput();
    camState.yaw -= snap.lookDX * 0.0042;
    camState.pitch = Math.max(-1.1, Math.min(0.5, camState.pitch - snap.lookDY * 0.0042));

    if (!isTraveling) {
      if (!activeVehicle) {
        stepPlayer(player, {
          moveX: snap.moveX,
          moveZ: snap.moveZ,
          run: snap.run,
          jumpQueued: snap.jumpQueued,
          camYaw: camState.yaw,
          dt,
          collision: physics,
          waterZones: world.waterZones
        });
        const water = evalWater(player.pos, world.waterZones);
        applyBuoyancy(player.pos, player.vel, water.state, dt);

        stepT += dt;
        const moveSpd = Math.hypot(player.vel.x, player.vel.z);
        if (moveSpd > 0.5 && stepT > (snap.run ? 0.28 : 0.42)) {
          stepT = 0;
          audio.footstep();
        }

        const inside = interiors.insideOf(player.pos);
        audio.setAmbience(inside !== null);

        const door = interiors.nearestDoor(player.pos, DOOR_RANGE);
        const nearV = nearestVehicle(fleet, player.pos, ENTER_RANGE);
        if (door) {
          useGameStore.getState().setHud({ prompt: 'Enter shop' });
        } else if (nearV) {
          useGameStore.getState().setHud({ prompt: `Press E — ${nearV.spec.label}` });
        } else {
          useGameStore.getState().setHud({ prompt: null });
        }
        if (snap.actionPressed && nearV && !door) {
          enterVehicle(nearV, player);
          activeVehicle = nearV;
          useGameStore.getState().setHud({ prompt: null, speed: 0 });
          audio.setAmbience(false);
        }
      } else {
        stepVehicle(activeVehicle, {
          moveX: snap.moveX,
          moveZ: snap.moveZ,
          dt,
          collision: physics,
          bound: BOUND,
          grip: weather.grip
        });
        if (snap.actionPressed) {
          exitVehicle(activeVehicle, player);
          useGameStore.getState().setHud({ speed: null });
          activeVehicle = null;
        }
        hudT += dt;
        if (hudT > 0.1) {
          hudT = 0;
          useGameStore.getState().setHud({
            speed: Math.round(Math.abs(activeVehicle.speed) * 3.6)
          });
        }
        const spd01 = Math.min(1, Math.abs(activeVehicle.speed) / activeVehicle.spec.maxSpeed);
        audio.setEngine(ENGINE_PITCH[activeVehicle.category], spd01, true);
      }
      if (!activeVehicle) audio.setEngine(0, 0, false);
      audio.setRain(weather.intensity);

      traffic.update(dt, player.pos.x, player.pos.z, (x, z, axis) =>
        lights.shouldStop(x, z, axis)
      );
      npcs.update(dt, player.pos.x, player.pos.z);
    }

    minimapState.px = player.pos.x;
    minimapState.pz = player.pos.z;
    minimapState.yaw = camState.yaw;
    minimapState.driving = activeVehicle !== null;
    minimapState.vehicleX = activeVehicle ? activeVehicle.pos.x : fleet[0].pos.x;
    minimapState.vehicleZ = activeVehicle ? activeVehicle.pos.z : fleet[0].pos.z;

    const camTarget = activeVehicle ? activeVehicle.pos : player.pos;
    const th = activeVehicle ? activeVehicle.pos.y + 1.6 : player.pos.y + 1.7;
    const tyaw = activeVehicle ? activeVehicle.yaw + Math.PI : camState.yaw;
    const d = activeVehicle
      ? camState.dist + 3 + activeVehicle.spec.bodyL * 0.5 + Math.abs(activeVehicle.speed) * 0.1
      : camState.dist;
    dir.set(
      Math.sin(tyaw) * Math.cos(camState.pitch),
      Math.sin(-camState.pitch),
      Math.cos(tyaw) * Math.cos(camState.pitch)
    );
    want.set(camTarget.x - dir.x * d, th - dir.y * d + 1.4, camTarget.z - dir.z * d);
    camPos.lerp(want, 1 - Math.pow(0.0001, dt));
    camera.position.copy(camPos);
    camera.lookAt(camTarget.x, th + 0.5, camTarget.z);

    rain.update(dt, weather.intensity, camPos.x, camPos.z);

    renderer.render(scene, camera);

    fpsT += dt;
    fpsN++;
    if (fpsT >= 0.5) {
      const fps = Math.round(fpsN / fpsT);
      useGameStore.getState().setHud({ fps });
      adaptive.reportFps(fps);
      if (adaptive.scale !== lastAdaptiveScale) {
        lastAdaptiveScale = adaptive.scale;
        applyResolution();
      }
      fpsT = 0;
      fpsN = 0;
      pushClock();
    }
  }
  let lastAdaptiveScale = adaptive.scale;

  function frame(): Promise<void> {
    return new Promise((r) => requestAnimationFrame(r));
  }

  function onResize(): void {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
  }
  window.addEventListener('resize', onResize);

  const travelTimer = setInterval(() => {
    if (travelState.travelRequest) void handleTravel();
  }, 250);

  last = performance.now();
  raf = requestAnimationFrame(loop);

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      clearInterval(travelTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
      offQuality();
      offPause();
      cleanupInput();
      audio.dispose();
      rain.dispose();
      props.dispose();
      interiors.dispose();
      lights.dispose();
      npcs.dispose();
      traffic.dispose();
      world.dispose();
      physics.dispose();
      streaming.dispose();
      disposeMaterials();
      renderer.dispose();
    }
  };
}
