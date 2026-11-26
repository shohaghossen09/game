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
import { loadDhakaTile } from '../world/dhakaTile';
import { disposeMaterials } from '../world/materials';
import { minimapState, resetMinimap } from './minimap';
import { evalWater, applyBuoyancy } from '../water/water';
import { createWeather, stepWeather, type WeatherState } from '../weather/weather';
import { RainSystem } from '../weather/rain';

export interface Engine {
  dispose(): void;
}

interface QualityProfile {
  renderScale: number;
  shadowMapSize: number;
  fogFar: number;
  treeCount: number;
  pixelRatioCap: number;
}

const QUALITY: Record<Quality, QualityProfile> = {
  low: { renderScale: 0.5, shadowMapSize: 512, fogFar: 240, treeCount: 40, pixelRatioCap: 1.5 },
  medium: { renderScale: 0.75, shadowMapSize: 1024, fogFar: 320, treeCount: 70, pixelRatioCap: 1.5 },
  high: { renderScale: 1.0, shadowMapSize: 2048, fogFar: 400, treeCount: 100, pixelRatioCap: 2 },
  ultra: { renderScale: 1.0, shadowMapSize: 4096, fogFar: 500, treeCount: 140, pixelRatioCap: 2 }
};

const DAY_LENGTH = 300;
const ENTER_RANGE = 4.5;

const FLEET: Array<{ category: VehicleCategory; x: number; z: number; yaw: number }> = [
  { category: 'sedan', x: 10, z: -46, yaw: 0 },
  { category: 'cng', x: 14, z: -38, yaw: 0.3 },
  { category: 'rickshaw', x: -14, z: -38, yaw: -0.3 },
  { category: 'motorcycle', x: 18, z: -46, yaw: 0 },
  { category: 'bus', x: 28, z: -60, yaw: Math.PI / 2 }
];

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
  const applyResolution = () => {
    renderer.setPixelRatio(Math.min(devicePixelRatio, prof.pixelRatioCap));
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

  const physics = createCollisionWorld();
  store.setProgress(55, 'Physics ready');
  await frame();

  store.setProgress(65, 'World data…');
  const tile = await loadDhakaTile();
  useGameStore.getState().setHud({
    preview: tile.preview,
    location: tile.name
  });
  store.setProgress(75, 'World geometry…');
  const world = buildWorld(scene, physics, tile, prof.treeCount);
  const props = buildProps(tile);
  scene.add(props.group);
  store.setProgress(85, 'Character & vehicles…');
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

  // weather + rain
  const weather = createWeather();
  const rain = new RainSystem(scene, 2400);

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

  let disposed = false;
  let last = performance.now();
  let raf = 0;
  let fpsT = 0;
  let fpsN = 0;
  let hudT = 0;
  let dayT = 0.22;
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
    // sky: night -> rain-gray -> day, all lerped
    const sky = skyNight.clone().lerp(skyDay, day);
    sky.lerp(skyRain, weather.intensity * 0.7);
    // thunder flash: brief white boost
    if (weather.flash > 0) sky.lerp(new THREE.Color(0xdfe9f4), 0.7);
    scene.background = sky;
    hemi.intensity = (0.12 + day * 0.8) * weather.darkness;

    // fog: base range x visibility, underwater overrides
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

  function loop(now: number): void {
    if (disposed) return;
    raf = requestAnimationFrame(loop);
    const dt = paused ? 0 : Math.min((now - last) / 1000, 0.05);
    last = now;
    if (paused) {
      renderer.render(scene, camera);
      return;
    }

    stepWeatherAndSky(dt);
    const snap = readInput();
    camState.yaw -= snap.lookDX * 0.0042;
    camState.pitch = Math.max(-1.1, Math.min(0.5, camState.pitch - snap.lookDY * 0.0042));

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

      const near = nearestVehicle(fleet, player.pos, ENTER_RANGE);
      useGameStore.getState().setHud({
        prompt: near ? `Press E — ${near.spec.label}` : null
      });
      if (snap.actionPressed && near) {
        enterVehicle(near, player);
        activeVehicle = near;
        useGameStore.getState().setHud({ prompt: null, speed: 0 });
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
    }

    // minimap feed
    minimapState.px = player.pos.x;
    minimapState.pz = player.pos.z;
    minimapState.yaw = camState.yaw;
    minimapState.driving = activeVehicle !== null;
    minimapState.vehicleX = activeVehicle ? activeVehicle.pos.x : fleet[0].pos.x;
    minimapState.vehicleZ = activeVehicle ? activeVehicle.pos.z : fleet[0].pos.z;

    // camera
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

    // rain follows camera
    rain.update(dt, weather.intensity, camPos.x, camPos.z);

    renderer.render(scene, camera);

    fpsT += dt;
    fpsN++;
    if (fpsT >= 0.5) {
      useGameStore.getState().setHud({ fps: Math.round(fpsN / fpsT) });
      fpsT = 0;
      fpsN = 0;
      pushClock();
    }
  }

  function frame(): Promise<void> {
    return new Promise((r) => requestAnimationFrame(r));
  }

  function onResize(): void {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
  }
  window.addEventListener('resize', onResize);

  last = performance.now();
  raf = requestAnimationFrame(loop);

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
      offQuality();
      offPause();
      cleanupInput();
      rain.dispose();
      props.dispose();
      world.dispose();
      physics.dispose();
      disposeMaterials();
      renderer.dispose();
    }
  };
}
