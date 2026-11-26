import * as THREE from 'three';
import { useGameStore, type Quality, onQualityChange } from './store';
import { initInput, readInput } from './input';
import { createCollisionWorld } from '../physics/collision';
import { createPlayer, stepPlayer, BOUND } from '../player/player';
import { createVehicle, stepVehicle, enterVehicle, exitVehicle } from '../vehicle/vehicle';
import { buildWorld } from '../world/builder';
import { disposeMaterials } from '../world/materials';
import { disposeProceduralTextures } from '../world/textures';
import { detectWebGL } from './webglDetect';
import { createPerfSampler } from './perf';
import { createAdaptiveResolution } from './adaptive';
import { createBuildingLod } from '../world/lod';
import { createStreamingManager } from '../geo/streaming';
import { travelState } from './travelState';
import { createStagedLoader } from './stagedLoader';
import type { DhakaTile } from '../world/dhakaTile';

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
const BOOT_TIMEOUT_MS = 20_000;

function frameOrTimeout(): Promise<void> {
  return new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(finish, 50);
    requestAnimationFrame(finish);
  });
}

export async function createEngine(canvas: HTMLCanvasElement): Promise<Engine> {
  const store = useGameStore.getState();
  store.setTouch(matchMedia('(pointer: coarse)').matches);
  store.setProgress(5, 'Checking graphics capability…');

  // ---- WebGL capability probe ----
  const cap = detectWebGL(canvas);
  if (cap.kind !== 'ok') {
    throw new Error(cap.message);
  }
  store.setProgress(10, cap.webgl2 ? 'WebGL2 ready' : 'WebGL ready (compatibility mode)');

  // ---- renderer ----
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch (err) {
    throw new Error(
      'Renderer could not be created even though WebGL passed the capability check. ' +
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
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // ---- context loss handling ----
  let contextLost = false;
  let firstFrameConfirmed = false;
  const onContextLost = (e: Event) => {
    e.preventDefault();
    contextLost = true;
    useGameStore.getState().setStatus('GPU context lost — waiting for recovery…');
    useGameStore.getState().setHud({ fps: 0 });
  };
  const onContextRestored = () => {
    contextLost = false;
    firstFrameConfirmed = false;
    useGameStore.getState().setStatus('GPU context restored — resuming…');
  };
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);

  // ---- boot watchdog ----
  const watchdog = setTimeout(() => {
    if (!firstFrameConfirmed) {
      useGameStore.getState().setBootError(
        'Engine startup timed out (20s). This usually means the browser throttled ' +
          'the page (background tab) or the GPU driver is not responding. Reload to retry.'
      );
    }
  }, BOOT_TIMEOUT_MS);

  let disposed = false;

  function step(p: number, label: string): void {
    if (disposed) return;
    useGameStore.getState().setProgress(p, label);
  }

  step(15, 'Renderer ready');
  await frameOrTimeout();

  // ---- camera ----
  const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 1200);
  step(25, 'Camera ready');

  // ---- scene / lights ----
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
  step(35, 'Scene ready');
  await frameOrTimeout();

  // ---- physics ----
  let physics = createCollisionWorld();
  step(50, 'Physics ready');
  await frameOrTimeout();

  // ---- world (streaming-managed) ----
  const streaming = createStreamingManager();
  const perf = createPerfSampler(renderer, cap.webgl2 ? 'webgl2' : 'webgl', streaming);
  step(60, 'World data…');
  let tile = await streaming.activate('dhaka');
  useGameStore.getState().setHud({
    preview: tile.preview,
    location: tile.name
  });
  step(70, 'World geometry…');
  let world = buildWorld(scene, physics, tile, prof.treeCount);
  let buildingLod = createBuildingLod(world.buildingDetailGroup, world.buildingCoarseGroup);
  step(80, 'Character & vehicle…');
  await frameOrTimeout();

  // ---- player + vehicle ----
  const player = createPlayer(scene);
  const vehicle = createVehicle(scene, physics);
  player.group.position.copy(player.pos);

  // ---- input ----
  const cleanupInput = initInput();

  // ---- pre-compile shaders ----
  step(90, 'Compiling shaders…');
  try {
    renderer.compile(scene, camera);
  } catch (err) {
    clearTimeout(watchdog);
    throw new Error(
      'Shader compilation failed. Your GPU may be blocklisted or the driver is outdated. ' +
        (err instanceof Error ? err.message : '')
    );
  }
  await frameOrTimeout();
  step(95, 'Rendering first frame…');

  // ---- live quality switching (Phase H) ----
  const offQuality = onQualityChange((q) => {
    const np = QUALITY[q] ?? QUALITY.high;
    sun.shadow.mapSize.set(np.shadowMapSize, np.shadowMapSize);
    if (sun.shadow.map) {
      sun.shadow.map.dispose();
      (sun.shadow as { map: null }).map = null;
    }
    prof.fogFar = np.fogFar;
    prof.pixelRatioCap = np.pixelRatioCap;
    if (scene.fog) {
      scene.fog.near = np.fogFar / 3;
      scene.fog.far = np.fogFar;
    }
    adaptive.reset();
    applyResolution();
  });

  // ---- staged travel ----
  const staged = createStagedLoader();
  let traveling = false;

  async function handleTravel(): Promise<void> {
    const dest = travelState.travelRequest;
    if (!dest || traveling) {
      travelState.travelRequest = null;
      return;
    }
    travelState.travelRequest = null;
    traveling = true;
    travelState.traveling = true;
    travelState.travelProgress = 0.05;
    useGameStore.getState().setProgress(30, `Loading ${dest}…`);

    const newTile = await streaming.activate(dest);

    const oldWorld = world;
    const oldPhysics = physics;
    let newWorld: ReturnType<typeof buildWorld> | null = null;
    let newPhysics: ReturnType<typeof createCollisionWorld> | null = null;

    try {
      await staged.run(
        [
          { label: 'Disposing old world…', fn: () => {
            oldWorld.dispose();
            oldPhysics.dispose();
          }},
          { label: 'Building new district…', fn: () => {
            newPhysics = createCollisionWorld();
            newWorld = buildWorld(scene, newPhysics!, newTile, prof.treeCount);
          }},
          { label: 'Relocating player…', fn: () => {
            physics = newPhysics!;
            world = newWorld!;
            buildingLod = createBuildingLod(world.buildingDetailGroup, world.buildingCoarseGroup);
            tile = newTile;
            if (vehicle.occupied) exitVehicle(vehicle, player);
            player.pos.set(4, 0, -40);
            player.vel.set(0, 0, 0);
            player.group.position.copy(player.pos);
            useGameStore.getState().setHud({
              preview: newTile.preview,
              location: newTile.name,
              speed: null,
              prompt: null
            });
          }}
        ],
        (p, label) => {
          travelState.travelProgress = p;
          useGameStore.getState().setProgress(30 + p * 65, label);
        }
      );
    } catch (err) {
      traveling = false;
      travelState.traveling = false;
      useGameStore.getState().setBootError(
        `Travel failed: ${err instanceof Error ? err.message : String(err)}`
      );
      return;
    }

    traveling = false;
    travelState.traveling = false;
    travelState.travelProgress = 1;
    travelState.message = `Arrived: ${newTile.name}`;
    useGameStore.getState().setProgress(100, 'Ready');
  }

  // ---- game loop ----
  let last = performance.now();
  let raf = 0;
  let fpsT = 0;
  let fpsN = 0;
  let hudT = 0;
  let streamT = 0;
  let dayT = 0.22;
  const camState = { yaw: Math.PI, pitch: -0.18, dist: 6.4 };
  const camPos = new THREE.Vector3(4, 3, -34);
  const skyDay = new THREE.Color(0x9fb8c8);
  const skyNight = new THREE.Color(0x0a1424);
  const dir = new THREE.Vector3();
  const want = new THREE.Vector3();
  let lastAdaptiveScale = adaptive.scale;

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
    if (contextLost) {
      return;
    }
    const frameStart = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    try {
      updateSky(dt);

      if (travelState.travelRequest) void handleTravel();

      streamT += dt;
      if (streamT > 1 && !traveling) {
        streamT = 0;
        streaming.update(player.pos.x, player.pos.z);
      }

      const snap = readInput();
      camState.yaw -= snap.lookDX * 0.0042;
      camState.pitch = Math.max(-1.1, Math.min(0.5, camState.pitch - snap.lookDY * 0.0042));

      const simActive = !traveling;

      if (simActive) {
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
          hudT += dt;
          if (hudT > 0.1) {
            hudT = 0;
            useGameStore.getState().setHud({
              speed: Math.round(Math.abs(vehicle.speed) * 3.6)
            });
          }
        }
      }

      // building LOD follows the camera (Phase H)
      buildingLod.update(camPos.x, camPos.z);

      updateCamera(dt);
      renderer.render(scene, camera);

      if (!firstFrameConfirmed) {
        firstFrameConfirmed = true;
        clearTimeout(watchdog);
        useGameStore.getState().setProgress(100, 'Ready');
      }

      const frameMs = performance.now() - frameStart;
      perf.tick(frameMs);

      // adaptive resolution reacts to the measured fps (Phase H)
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
    } catch (err) {
      if (disposed) return;
      useGameStore.getState().setBootError(
        `Render error: ${err instanceof Error ? err.message : String(err)}. ` +
          'The GPU may have reset. Reload to retry.'
      );
      cancelAnimationFrame(raf);
    }
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
      clearTimeout(watchdog);
      cancelAnimationFrame(raf);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      window.removeEventListener('resize', onResize);
      offQuality();
      cleanupInput();
      world.dispose();
      physics.dispose();
      streaming.dispose();
      disposeMaterials();
      disposeProceduralTextures();
      renderer.dispose();
    }
  };
}
