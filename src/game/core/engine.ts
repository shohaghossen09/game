import * as THREE from 'three';
import { useGameStore, type Quality } from './store';
import { initInput, readInput } from './input';
import { createCollisionWorld } from '../physics/collision';
import { createPlayer, stepPlayer, BOUND } from '../player/player';
import { createVehicle, stepVehicle, enterVehicle, exitVehicle } from '../vehicle/vehicle';
import { buildWorld } from '../world/builder';
import { loadDhakaTile } from '../world/dhakaTile';
import { disposeMaterials } from '../world/materials';

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

const DAY_LENGTH = 300; // seconds for a full day

export async function createEngine(canvas: HTMLCanvasElement): Promise<Engine> {
  const store = useGameStore.getState();
  store.setTouch(matchMedia('(pointer: coarse)').matches);
  store.setProgress(10, 'Starting renderer…');

  // renderer
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
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.setPixelRatio(Math.min(devicePixelRatio, prof.pixelRatioCap));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  store.setProgress(20, 'Renderer ready');
  await frame();

  // camera
  const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 1200);
  store.setProgress(30, 'Camera ready');

  // scene / lights
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

  // physics
  const physics = createCollisionWorld();
  store.setProgress(55, 'Physics ready');
  await frame();

  // world data + geometry
  store.setProgress(65, 'World data…');
  const tile = await loadDhakaTile();
  useGameStore.getState().setHud({
    preview: tile.preview,
    location: tile.name
  });
  store.setProgress(75, 'World geometry…');
  const world = buildWorld(scene, physics, tile, prof.treeCount);
  store.setProgress(85, 'Character & vehicle…');
  await frame();

  // player + vehicle
  const player = createPlayer(scene);
  const vehicle = createVehicle(scene, physics);
  player.group.position.copy(player.pos);

  // input
  const cleanupInput = initInput();

  // compile shaders
  store.setProgress(92, 'Compiling shaders…');
  renderer.compile(scene, camera);
  await frame();
  store.setProgress(100, 'Ready');
  await frame();

  // ---- game loop ----
  let disposed = false;
  let last = performance.now();
  let raf = 0;
  let fpsT = 0;
  let fpsN = 0;
  let hudT = 0;
  let dayT = 0.22; // start ~07:30
  const camState = { yaw: Math.PI, pitch: -0.18, dist: 6.4 };
  const camPos = new THREE.Vector3(4, 3, -34);
  const skyDay = new THREE.Color(0x9fb8c8);
  const skyNight = new THREE.Color(0x0a1424);
  const dir = new THREE.Vector3();
  const want = new THREE.Vector3();

  function updateSky(dt: number): void {
    dayT = (dayT + dt / DAY_LENGTH) % 1;
    const elev = Math.sin((dayT - 0.25) * Math.PI * 2);
    const sunAngle = (dayT - 0.25) * Math.PI * 2;
    sun.position.set(
      Math.cos(sunAngle) * 220,
      elev * 260 + 10,
      Math.sin(sunAngle) * 60 + 40
    );
    const day = Math.max(0, Math.min(1, elev * 1.6 + 0.35));
    sun.intensity = day * 2.1;
    sun.color.setHSL(
      0.09,
      Math.min(0.5, day * 0.5),
      Math.max(0.42, Math.min(0.66, 0.5 + elev * 0.12))
    );
    const sky = skyNight.clone().lerp(skyDay, day);
    scene.background = sky;
    if (scene.fog) scene.fog.color.copy(sky);
    hemi.intensity = 0.12 + day * 0.8;
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

  function updateCamera(dt: number): void {
    const target = vehicle.occupied ? vehicle.pos : player.pos;
    const th = vehicle.occupied ? vehicle.pos.y + 1.6 : player.pos.y + 1.7;
    const tyaw = vehicle.occupied ? vehicle.yaw + Math.PI : camState.yaw;
    const d = vehicle.occupied
      ? camState.dist + 4 + Math.abs(vehicle.speed) * 0.12
      : camState.dist;
    dir.set(
      Math.sin(tyaw) * Math.cos(camState.pitch),
      Math.sin(-camState.pitch),
      Math.cos(tyaw) * Math.cos(camState.pitch)
    );
    want.set(target.x - dir.x * d, th - dir.y * d + 1.4, target.z - dir.z * d);
    camPos.lerp(want, 1 - Math.pow(0.0001, dt));
    camera.position.copy(camPos);
    camera.lookAt(target.x, th + 0.5, target.z);
  }

  function loop(now: number): void {
    if (disposed) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    updateSky(dt);
    const snap = readInput();
    camState.yaw -= snap.lookDX * 0.0042;
    camState.pitch = Math.max(-1.1, Math.min(0.5, camState.pitch - snap.lookDY * 0.0042));

    if (!vehicle.occupied) {
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
      const near = player.pos.distanceTo(vehicle.pos) < 4.5;
      if (snap.actionPressed) {
        if (near) {
          enterVehicle(vehicle, player);
          useGameStore.getState().setHud({ prompt: null, speed: 0 });
        } else {
          useGameStore.getState().setHud({ prompt: near ? 'Press E to drive' : null });
        }
      } else {
        useGameStore.getState().setHud({ prompt: near ? 'Press E to drive' : null });
      }
    } else {
      stepVehicle(vehicle, {
        moveX: snap.moveX,
        moveZ: snap.moveZ,
        dt,
        collision: physics,
        bound: BOUND
      });
      if (snap.actionPressed) {
        exitVehicle(vehicle, player);
        useGameStore.getState().setHud({ speed: null });
      }
      // throttle HUD updates
      hudT += dt;
      if (hudT > 0.1) {
        hudT = 0;
        useGameStore.getState().setHud({
          speed: Math.round(Math.abs(vehicle.speed) * 3.6)
        });
      }
    }

    updateCamera(dt);
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
    return new Promise((r) => requestAnimationFrame(() => r()));
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
      cleanupInput();
      world.dispose();
      physics.dispose();
      disposeMaterials();
      renderer.dispose();
    }
  };
}
