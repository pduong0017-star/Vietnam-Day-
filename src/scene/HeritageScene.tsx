import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import type { CameraPresetId, SceneMood } from '../utils/greetingLink';
import { createSceneTextures } from './textures';
import {
  type AnimatedFlagItem,
  buildBambooGrove,
  buildBlossomTree,
  buildBronzeDrumProp,
  buildCelestialUnityTableau,
  buildCeremonialLanternPole,
  buildCulturalStele,
  buildEncirclingBrocadeRibbon,
  buildFestivalFlagPole,
  buildHanoiFlagTower,
  buildKarstHorizon,
  buildKhueVanPavilion,
  buildLacBird,
  buildLotusCluster,
  buildLotusSampan,
  buildLyDynastyDragon,
  buildOnePillarPagoda,
  buildShorelineRockAndReeds,
  buildTheHucBridge,
  buildVietnameseFluteKite,
} from './builders';

interface HeritageSceneProps {
  mood: SceneMood;
  cameraPreset: CameraPresetId;
  cameraPresetNonce: number;
  releaseLanternNonce: number;
  isMusicPlaying: boolean;
  lanternCount: number;
}

interface CameraPresetSpec {
  position: [number, number, number];
  target: [number, number, number];
}

const CAMERA_PRESETS: Record<CameraPresetId, CameraPresetSpec> = {
  overview: {
    position: [0.0, 8.8, 28.4],
    target: [-0.4, 4.7, -0.8],
  },
  pavilion: {
    position: [-5.4, 5.4, 11.4],
    target: [-1.0, 4.4, -1.4],
  },
  flagtower: {
    position: [13.2, 8.8, 12.6],
    target: [6.4, 7.6, -2.4],
  },
  lotus: {
    position: [-7.0, 3.6, 13.8],
    target: [-5.2, 2.0, 4.8],
  },
};

const MOOD_THEMES = {
  dawn: {
    fogColor: new THREE.Color(0xe6bfa0),
    fogDensity: 0.0086,
    keyColor: new THREE.Color(0xffdba8),
    keyIntensity: 2.65,
    hemiSky: new THREE.Color(0x9ec0d8),
    hemiGround: new THREE.Color(0x8a6144),
    hemiIntensity: 0.72,
    rimColor: new THREE.Color(0xffb56b),
    rimIntensity: 1.05,
    lanternPointIntensity: 2.8,
    pavilionGlow: 1.05,
    lanternGlow: 0.85,
    waterColor: new THREE.Color(0x1f6266),
    envIntensity: 0.52,
    waterShimmerOpacity: 0.14,
    exposure: 1.02,
    nightBlend: 0.0,
    bloomStrength: 0.24,
  },
  night: {
    fogColor: new THREE.Color(0x181024),
    fogDensity: 0.0112,
    keyColor: new THREE.Color(0x9cb4e8),
    keyIntensity: 0.62,
    hemiSky: new THREE.Color(0x3a3668),
    hemiGround: new THREE.Color(0x4f2124),
    hemiIntensity: 0.52,
    rimColor: new THREE.Color(0xff9c4a),
    rimIntensity: 1.45,
    lanternPointIntensity: 15.5,
    pavilionGlow: 2.8,
    lanternGlow: 2.5,
    waterColor: new THREE.Color(0x0b182b),
    envIntensity: 0.16,
    waterShimmerOpacity: 0.58,
    exposure: 1.0,
    nightBlend: 1.0,
    bloomStrength: 0.48,
  },
};

interface ActiveWishLantern {
  mesh: THREE.Group;
  velocityY: number;
  driftX: number;
  driftZ: number;
  phase: number;
  age: number;
  maxAge: number;
}

interface SoaringBird {
  group: THREE.Group;
  leftWing: THREE.Mesh;
  rightWing: THREE.Mesh;
  radius: number;
  height: number;
  speed: number;
  angleOffset: number;
  flapSpeed: number;
}

// Pre-allocated scratch math objects (zero per-frame GC)
const _dummy = new THREE.Object3D();
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _lerpColor = new THREE.Color();

export function HeritageScene({
  mood,
  cameraPreset,
  cameraPresetNonce,
  releaseLanternNonce,
  isMusicPlaying,
  lanternCount,
}: HeritageSceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  const moodRef = useRef<SceneMood>(mood);
  const musicPlayingRef = useRef<boolean>(isMusicPlaying);
  const cameraRequestRef = useRef<{
    preset: CameraPresetId;
    nonce: number;
    active: boolean;
  }>({
    preset: cameraPreset,
    nonce: cameraPresetNonce,
    active: false,
  });
  const lanternSpawnQueueRef = useRef<number>(0);
  const lastLanternNonceRef = useRef<number>(releaseLanternNonce);

  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  useEffect(() => {
    musicPlayingRef.current = isMusicPlaying;
  }, [isMusicPlaying]);

  useEffect(() => {
    if (cameraPresetNonce !== cameraRequestRef.current.nonce) {
      cameraRequestRef.current = {
        preset: cameraPreset,
        nonce: cameraPresetNonce,
        active: true,
      };
    }
  }, [cameraPreset, cameraPresetNonce]);

  useEffect(() => {
    if (releaseLanternNonce !== lastLanternNonceRef.current) {
      lastLanternNonceRef.current = releaseLanternNonce;
      lanternSpawnQueueRef.current += 1;
    }
  }, [releaseLanternNonce]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL strictly via GPU renderer string
    const probeCanvas = document.createElement('canvas');
    const probeGl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!probeGl) {
      setWebglUnavailable(true);
      return;
    }
    const debugExt = probeGl.getExtension('WEBGL_debug_renderer_info');
    const rendererParam = debugExt ? debugExt.UNMASKED_RENDERER_WEBGL : probeGl.RENDERER;
    const gpuName = String(probeGl.getParameter(rendererParam));
    probeGl.getExtension('WEBGL_lose_context')?.loseContext();
    const isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpuName);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = MOOD_THEMES[moodRef.current].exposure;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvasEl = renderer.domElement;
    canvasEl.style.display = 'block';
    canvasEl.style.width = '100%';
    canvasEl.style.height = '100%';
    container.appendChild(canvasEl);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglUnavailable(true);
    };
    const onContextRestored = () => {
      setWebglUnavailable(false);
    };
    canvasEl.addEventListener('webglcontextlost', onContextLost);
    canvasEl.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    const initialTheme = MOOD_THEMES[moodRef.current];
    scene.background = initialTheme.fogColor.clone();
    scene.fog = new THREE.FogExp2(initialTheme.fogColor.getHex(), initialTheme.fogDensity);

    // Studio PBR environment reflections via RoomEnvironment on every device
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = initialTheme.envIntensity;
    pmremGenerator.dispose();

    const aspect = width / height;
    const baseFov = aspect < 0.85 ? 58 : 44;
    const camera = new THREE.PerspectiveCamera(baseFov, aspect, 0.25, 260);
    const initCam = CAMERA_PRESETS.overview;
    camera.position.set(...initCam.position);

    const controls = new OrbitControls(camera, canvasEl);
    controls.target.set(...initCam.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI * 0.485;
    controls.minPolarAngle = 0.2;
    controls.minDistance = 7.5;
    controls.maxDistance = 42;
    controls.enablePan = false;
    controls.update();

    const onControlStart = () => {
      cameraRequestRef.current.active = false;
    };
    controls.addEventListener('start', onControlStart);

    // Optional GPU-only Post-Processing (subtle cinematic golden bloom)
    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    if (!isSoftwareGl) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        initialTheme.bloomStrength,
        0.45,
        0.86,
      );
      composer.addPass(bloomPass);
      composer.addPass(new OutputPass());
    }

    // Sculpted Warm/Cool 3-Point Golden-Hour Heritage Lighting Rig
    const keyLight = new THREE.DirectionalLight(
      initialTheme.keyColor,
      initialTheme.keyIntensity,
    );
    keyLight.position.set(22, 17, 13);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 68;
    keyLight.shadow.camera.left = -22;
    keyLight.shadow.camera.right = 22;
    keyLight.shadow.camera.top = 22;
    keyLight.shadow.camera.bottom = -22;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.025;
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(
      initialTheme.hemiSky,
      initialTheme.hemiGround,
      initialTheme.hemiIntensity,
    );
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(
      initialTheme.rimColor,
      initialTheme.rimIntensity,
    );
    rimLight.position.set(-18, 12, -18);
    scene.add(rimLight);

    const pavilionPointLight = new THREE.PointLight(
      0xffa842,
      initialTheme.lanternPointIntensity,
      26,
      1.6,
    );
    pavilionPointLight.position.set(-0.8, 5.2, -1.2);
    scene.add(pavilionPointLight);

    const pagodaPointLight = new THREE.PointLight(
      0xff9b3c,
      initialTheme.lanternPointIntensity * 0.85,
      20,
      1.6,
    );
    pagodaPointLight.position.set(-12.0, 4.8, -2.0);
    scene.add(pagodaPointLight);

    const plazaPointLight = new THREE.PointLight(
      0xff9348,
      initialTheme.lanternPointIntensity * 0.72,
      22,
      1.6,
    );
    plazaPointLight.position.set(-2.0, 3.2, 6.8);
    scene.add(plazaPointLight);

    const textures = createSceneTextures(renderer.capabilities.getMaxAnisotropy());
    const geos: THREE.BufferGeometry[] = [];
    const mats: THREE.Material[] = [];

    // 0. Painterly Golden-Hour Dawn & Harvest-Moon Night Sky Domes
    const skyDawnGeo = new THREE.SphereGeometry(126, 32, 20);
    geos.push(skyDawnGeo);
    const skyDawnMat = new THREE.MeshBasicMaterial({
      map: textures.skyDawnMap,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
    });
    mats.push(skyDawnMat);
    const skyDawnMesh = new THREE.Mesh(skyDawnGeo, skyDawnMat);
    skyDawnMesh.rotation.y = Math.PI * 0.5;
    skyDawnMesh.renderOrder = -20;
    scene.add(skyDawnMesh);

    const skyNightGeo = new THREE.SphereGeometry(122, 32, 20);
    geos.push(skyNightGeo);
    const skyNightMat = new THREE.MeshBasicMaterial({
      map: textures.skyNightMap,
      side: THREE.BackSide,
      fog: false,
      transparent: true,
      opacity: initialTheme.nightBlend,
      depthWrite: false,
    });
    mats.push(skyNightMat);
    const skyNightMesh = new THREE.Mesh(skyNightGeo, skyNightMat);
    skyNightMesh.rotation.y = Math.PI * 0.5;
    skyNightMesh.renderOrder = -19;
    scene.add(skyNightMesh);

    // Crisp night starfield dome (razor-sharp stars above the festival skyline)
    const starCount = 260;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = ((i * 137.508) % 360) * (Math.PI / 180);
      const phi = 0.14 + (((i * 29) % 100) / 100) * 1.12;
      const r = 114;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi) + 8;
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      if (i % 4 === 0) {
        starColors[i * 3] = 1.0;
        starColors[i * 3 + 1] = 0.9;
        starColors[i * 3 + 2] = 0.68;
      } else {
        starColors[i * 3] = 0.88;
        starColors[i * 3 + 1] = 0.93;
        starColors[i * 3 + 2] = 1.0;
      }
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    geos.push(starGeo);
    const starMat = new THREE.PointsMaterial({
      size: 2.0,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity: initialTheme.nightBlend * 0.9,
      fog: false,
      depthWrite: false,
    });
    mats.push(starMat);
    const starField = new THREE.Points(starGeo, starMat);
    starField.renderOrder = -18;
    scene.add(starField);

    // 1. Reflective Shimmering Lake Surface with animated wave ripples
    const waterGeo = new THREE.CircleGeometry(96, 64);
    waterGeo.rotateX(-Math.PI / 2);
    geos.push(waterGeo);
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: initialTheme.waterColor.clone(),
      bumpMap: textures.waterRippleMap,
      bumpScale: 0.05,
      roughness: 0.22,
      metalness: 0.14,
      clearcoat: 0.35,
      clearcoatRoughness: 0.2,
    });
    mats.push(waterMat);
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = 0;
    waterMesh.receiveShadow = true;
    scene.add(waterMesh);

    // Warm golden lantern & pagoda shimmer reflections rippling on the lake surface
    const waterGlowMat = new THREE.MeshBasicMaterial({
      map: textures.waterGlowMap,
      transparent: true,
      opacity: initialTheme.waterShimmerOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    mats.push(waterGlowMat);
    const waterGlowGeo = new THREE.PlaneGeometry(1, 1);
    waterGlowGeo.rotateX(-Math.PI / 2);
    geos.push(waterGlowGeo);

    const waterShimmers: Array<{ mesh: THREE.Mesh; baseScaleX: number; baseScaleZ: number; phase: number }> = [];
    const shimmerSpecs: Array<[number, number, number, number, number]> = [
      [-12.4, -0.6, 6.2, 8.2, 0.0], // Under Chùa Một Cột
      [0.8, 13.7, 5.8, 7.6, 1.1],   // Under Cầu Thê Húc bridge lanterns
      [10.8, 7.4, 4.2, 5.2, 2.2],   // Under Wooden Sampan prow lantern
      [-5.2, 11.2, 5.0, 6.0, 3.4],  // Foreground lotus lantern shimmer
      [5.4, 11.4, 4.6, 5.6, 4.5],   // Right foreground water reflection
    ];
    shimmerSpecs.forEach(([sx, sz, w, d, phase]) => {
      const m = new THREE.Mesh(waterGlowGeo, waterGlowMat);
      m.position.set(sx, 0.018, sz);
      m.scale.set(w, 1, d);
      scene.add(m);
      waterShimmers.push({ mesh: m, baseScaleX: w, baseScaleZ: d, phase });
    });

    // 2. Multi-Tiered Carved Ninh Bình Stone Embankment & Bát Tràng Paved Courtyard Island
    const islandCenter = new THREE.Vector3(1.0, 0, -0.5);
    const submergedStoneMat = new THREE.MeshStandardMaterial({
      color: 0x5c5b4f,
      map: textures.stoneMap,
      bumpMap: textures.stoneBump,
      bumpScale: 0.08,
      roughness: 0.92,
      metalness: 0.04,
    });
    mats.push(submergedStoneMat);

    const embankmentMat = new THREE.MeshStandardMaterial({
      color: 0xd4c8b2,
      map: textures.stoneMap,
      bumpMap: textures.stoneBump,
      bumpScale: 0.07,
      roughness: 0.88,
      metalness: 0.04,
    });
    mats.push(embankmentMat);

    const courtyardMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.courtyardPavingMap,
      bumpMap: textures.courtyardPavingBump,
      bumpScale: 0.055,
      roughness: 0.84,
      metalness: 0.04,
    });
    mats.push(courtyardMat);

    // Tier A: Submerged dark mossy foundation stone
    const foundationGeo = new THREE.CylinderGeometry(11.9, 12.6, 0.28, 56);
    geos.push(foundationGeo);
    const foundation = new THREE.Mesh(foundationGeo, submergedStoneMat);
    foundation.position.set(islandCenter.x, -0.02, islandCenter.z);
    scene.add(foundation);

    // Tier B: Carved stone quay wall
    const quayGeo = new THREE.CylinderGeometry(11.15, 11.6, 0.28, 56);
    geos.push(quayGeo);
    const quay = new THREE.Mesh(quayGeo, embankmentMat);
    quay.position.set(islandCenter.x, 0.18, islandCenter.z);
    quay.receiveShadow = true;
    scene.add(quay);

    // Tier C: Bát Tràng paved heritage courtyard surface
    const courtyardGeo = new THREE.CylinderGeometry(10.72, 10.85, 0.12, 56);
    geos.push(courtyardGeo);
    const courtyard = new THREE.Mesh(courtyardGeo, courtyardMat);
    courtyard.position.set(islandCenter.x, 0.31, islandCenter.z);
    courtyard.receiveShadow = true;
    scene.add(courtyard);

    // Carved stone lotus balustrade bollards (Lan can đá trụ sen) encircling the courtyard rim
    const goldAccentMat = new THREE.MeshStandardMaterial({
      color: 0xdca944,
      roughness: 0.28,
      metalness: 0.86,
    });
    mats.push(goldAccentMat);

    const bollardGeo = new THREE.BoxGeometry(0.28, 0.72, 0.28);
    const bollardCapGeo = new THREE.SphereGeometry(0.14, 10, 10);
    const railSegGeo = new THREE.BoxGeometry(2.1, 0.12, 0.14);
    geos.push(bollardGeo, bollardCapGeo, railSegGeo);

    const bollardCount = 28;
    const bollardRadius = 10.68;
    for (let i = 0; i < bollardCount; i++) {
      const a = (i / bollardCount) * Math.PI * 2;
      const bx = islandCenter.x + Math.sin(a) * bollardRadius;
      const bz = islandCenter.z + Math.cos(a) * bollardRadius;
      // Leave generous openings at front Cầu Thê Húc bridge, Bia Rùa front, & left Chùa Một Cột vista
      const nearFrontBridge = bz > 9.4 && Math.abs(bx - 0.8) < 2.6;
      const nearPagodaView = bx < -8.8 && Math.abs(bz + 2.0) < 2.5;
      const nearSteleFront = bx < -2.6 && bz > 4.2 && bz < 8.8;
      if (nearFrontBridge || nearPagodaView || nearSteleFront) continue;

      const post = new THREE.Mesh(bollardGeo, embankmentMat);
      post.position.set(bx, 0.68, bz);
      post.rotation.y = a;
      post.castShadow = true;
      scene.add(post);

      const cap = new THREE.Mesh(bollardCapGeo, goldAccentMat);
      cap.position.set(bx, 1.12, bz);
      scene.add(cap);
    }

    // Grand Sunken Đông Sơn Bronze Drum Courtyard Medallion
    const drumGeo = new THREE.CylinderGeometry(5.35, 5.48, 0.07, 64);
    geos.push(drumGeo);
    const drumMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.dongSonMap,
      bumpMap: textures.dongSonBump,
      bumpScale: 0.08,
      roughness: 0.34,
      metalness: 0.78,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    mats.push(drumMat);
    const drumPlaza = new THREE.Mesh(drumGeo, drumMat);
    drumPlaza.position.set(0.9, 0.37, 3.25);
    drumPlaza.receiveShadow = true;
    scene.add(drumPlaza);

    // Curved Vermilion Arched Cầu Thê Húc Bridge with warm bridge lanterns
    const { group: theHucBridge, bridgeLanternMat } = buildTheHucBridge(textures, geos, mats);
    theHucBridge.position.set(0.8, 0.02, 13.7);
    scene.add(theHucBridge);

    // 3. Hero Monument 1: Khuê Văn Các (Center)
    const { group: pavilion, glowMat: pavilionGlowMat } = buildKhueVanPavilion(
      textures,
      geos,
      mats,
    );
    pavilion.position.set(-0.8, 0.36, -1.6);
    scene.add(pavilion);

    // Two Sculpted 3D Đông Sơn Bronze Drums on Carved Ironwood Stands flanking Khuê Văn Các
    const leftDrum = buildBronzeDrumProp(textures, geos, mats);
    leftDrum.position.set(-4.35, 0.36, 1.9);
    scene.add(leftDrum);

    const rightDrum = buildBronzeDrumProp(textures, geos, mats);
    rightDrum.position.set(2.85, 0.36, 1.9);
    scene.add(rightDrum);

    // 4. Hero Monument 2 (NEW): Chùa Một Cột (One Pillar Pagoda) rising from the left lotus lake
    const { group: onePillarPagoda, glowMat: pagodaGlowMat } = buildOnePillarPagoda(
      textures,
      geos,
      mats,
    );
    onePillarPagoda.position.set(-12.4, 0.0, -2.0);
    onePillarPagoda.rotation.y = 0.22;
    scene.add(onePillarPagoda);

    // 5. Hero Monument 3: Cột Cờ Hà Nội + Waving Vietnamese National Flag (Right)
    const {
      group: flagTower,
      flagMesh,
      flagRestPositions,
    } = buildHanoiFlagTower(textures, geos, mats);
    flagTower.position.set(7.4, 0.36, -2.5);
    scene.add(flagTower);

    const animatedFlags: AnimatedFlagItem[] = [
      { mesh: flagMesh, restPositions: flagRestPositions, width: 3.35, phase: 0 },
    ];

    // 6. Hero Monument 4: Cultural Stele on Sculpted Stone Tortoise (Bia Rùa Văn Miếu)
    const stele = buildCulturalStele(textures, geos, mats);
    stele.position.set(-5.0, 0.36, 5.2);
    stele.rotation.y = 0.4;
    scene.add(stele);

    // 7. Traditional Vietnamese Five-Color Festival Flags (Cờ Hội Ngũ Sắc) fluttering on the courtyard
    const festivalFlagSpecs: Array<{ pos: [number, number, number]; rotY: number; phase: number }> = [
      { pos: [-8.4, 0.36, -0.3], rotY: 0.55, phase: 0.6 },
      { pos: [-6.8, 0.36, -5.8], rotY: 0.85, phase: 1.9 },
      { pos: [9.5, 0.36, 1.6], rotY: Math.PI - 0.55, phase: 2.8 },
      { pos: [6.4, 0.36, 6.8], rotY: Math.PI - 0.35, phase: 4.1 },
    ];
    festivalFlagSpecs.forEach((f) => {
      const { group: fg, flagItem } = buildFestivalFlagPole(textures, geos, mats, f.phase);
      fg.position.set(...f.pos);
      fg.rotation.y = f.rotY;
      scene.add(fg);
      animatedFlags.push(flagItem);
    });

    // 8. Vietnamese Festival Blossom Trees: Hoa Đào (North) & Hoa Mai (South) + Bamboo Groves
    const peachTree = buildBlossomTree('peach', 1.05, textures, geos, mats);
    peachTree.position.set(-7.6, 0.34, -2.4);
    peachTree.rotation.y = 0.7;
    scene.add(peachTree);

    const apricotTree = buildBlossomTree('apricot', 1.08, textures, geos, mats);
    apricotTree.position.set(8.6, 0.34, 3.6);
    apricotTree.rotation.y = -1.2;
    scene.add(apricotTree);

    const bambooSpecs: Array<{ pos: [number, number, number]; scale: number; rotY: number }> = [
      { pos: [-5.6, 0.34, -7.8], scale: 1.08, rotY: 0.4 },
      { pos: [2.6, 0.34, -8.8], scale: 1.0, rotY: 1.8 },
      { pos: [10.4, 0.34, -4.6], scale: 1.04, rotY: -0.9 },
      { pos: [-8.2, 0.34, 4.8], scale: 0.84, rotY: 2.3 },
    ];
    bambooSpecs.forEach((b) => {
      const grove = buildBambooGrove(b.scale, geos, mats);
      grove.position.set(...b.pos);
      grove.rotation.y = b.rotY;
      scene.add(grove);
    });

    // 9. Hội An Silk Lantern Poles framing the ceremonial courtyard
    const lanternSilkMats: THREE.MeshStandardMaterial[] = [bridgeLanternMat];
    const poleSpecs: Array<{ pos: [number, number, number]; rotY: number; color: number }> = [
      { pos: [-6.4, 0.36, 3.4], rotY: 0.4, color: 0xe84838 },
      { pos: [7.6, 0.36, 4.2], rotY: Math.PI - 0.4, color: 0xf4ae38 },
      { pos: [-4.4, 0.36, -6.2], rotY: -0.35, color: 0xf4ae38 },
      { pos: [3.6, 0.36, 7.6], rotY: Math.PI + 0.5, color: 0xe84838 },
    ];
    poleSpecs.forEach((spec) => {
      const { group: poleGroup, silkMat } = buildCeremonialLanternPole(
        textures,
        spec.color,
        geos,
        mats,
      );
      poleGroup.position.set(...spec.pos);
      poleGroup.rotation.y = spec.rotY;
      scene.add(poleGroup);
      lanternSilkMats.push(silkMat);
    });

    // 10. Traditional Wooden Lotus Sampan Boat (Thuyền Hoa Đăng) floating clearly in open foreground lake
    const { group: sampan, lanternMat: sampanLanternMat } = buildLotusSampan(textures, geos, mats);
    sampan.position.set(10.8, 0.04, 7.4);
    sampan.rotation.y = -0.88;
    scene.add(sampan);
    lanternSilkMats.push(sampanLanternMat);

    // 11. Lush Multi-Scale Đầm Sen (Lotus Pond) + Shoreline Rocks & Reeds
    const floatingLotuses: THREE.Group[] = [];
    const lotusSpecs: Array<{ pos: [number, number, number]; scale: number; tint: number }> = [
      { pos: [-7.4, 0.02, 9.2], scale: 1.38, tint: 0xffd6e2 },
      { pos: [-4.2, 0.02, 12.2], scale: 1.15, tint: 0xffe4ec },
      { pos: [4.6, 0.02, 10.6], scale: 1.32, tint: 0xffd0df },
      { pos: [8.0, 0.02, 10.4], scale: 1.12, tint: 0xffe0ea },
      { pos: [-10.8, 0.02, 4.6], scale: 1.28, tint: 0xffd8e4 },
      { pos: [-14.2, 0.02, 1.4], scale: 1.22, tint: 0xffe2ec },
      { pos: [-10.6, 0.02, -6.2], scale: 1.26, tint: 0xffd8e4 },
      { pos: [-15.8, 0.02, -4.4], scale: 1.18, tint: 0xffe4ec },
      { pos: [12.4, 0.02, 2.2], scale: 1.24, tint: 0xffd2e0 },
      { pos: [11.8, 0.02, -6.6], scale: 1.15, tint: 0xffe0ea },
      { pos: [-3.2, 0.02, 15.6], scale: 1.06, tint: 0xffd8e4 },
      { pos: [4.0, 0.02, 15.2], scale: 1.1, tint: 0xffe4ec },
    ];
    lotusSpecs.forEach((l, idx) => {
      const lotus = buildLotusCluster(l.scale, l.tint, textures, geos, mats);
      lotus.position.set(...l.pos);
      lotus.rotation.y = idx * 0.85;
      scene.add(lotus);
      floatingLotuses.push(lotus);
    });

    const shorelineSpecs: Array<{ pos: [number, number, number]; scale: number; rotY: number }> = [
      { pos: [-9.8, 0.0, 6.2], scale: 1.2, rotY: 0.4 },
      { pos: [-10.4, 0.0, -5.6], scale: 1.15, rotY: 1.8 },
      { pos: [11.8, 0.0, 4.6], scale: 1.25, rotY: -0.9 },
      { pos: [11.6, 0.0, -5.2], scale: 1.1, rotY: 2.2 },
      { pos: [-4.6, 0.0, 10.6], scale: 0.95, rotY: 0.9 },
      { pos: [6.4, 0.0, 9.2], scale: 1.05, rotY: -1.6 },
      { pos: [-14.6, 0.0, -0.4], scale: 1.15, rotY: 0.7 },
    ];
    shorelineSpecs.forEach((s) => {
      const bank = buildShorelineRockAndReeds(s.scale, textures, geos, mats);
      bank.position.set(...s.pos);
      bank.rotation.y = s.rotY;
      scene.add(bank);
    });

    // 12. Layered Tràng An / Hạ Long Limestone Karst Mountains + Drifting Mist Bands
    const { group: karstHorizon, mistPlanes } = buildKarstHorizon(textures, geos, mats);
    scene.add(karstHorizon);

    // 12B. Celestial Sky Cultural Tableau: Vầng Hào Quang 54 Dân Tộc + 360° Dải Lụa Thổ Cẩm + Rồng Thời Lý + Diều Sáo
    const {
      group: unityTableau,
      haloMesh,
      haloMat,
      orbRingGroup,
    } = buildCelestialUnityTableau(textures, geos, mats);
    unityTableau.position.set(-0.6, 12.6, -15.2);
    scene.add(unityTableau);

    const {
      mesh: encirclingRibbon,
      mat: brocadeRibbonMat,
      baseTheta: ribbonBaseTheta,
      baseV: ribbonBaseV,
    } = buildEncirclingBrocadeRibbon(textures, geos, mats);
    encirclingRibbon.position.set(0.4, 0, -0.5);
    scene.add(encirclingRibbon);

    // Iconic Soaring Vietnamese Rồng Thời Lý (Lý Dynasty Dragon) undulating gracefully across the sky
    const {
      group: lyDragon,
      segments: dragonSegments,
      pearl: dragonPearl,
      pearlGlowMat: dragonPearlMat,
    } = buildLyDynastyDragon(geos, mats);
    scene.add(lyDragon);
    const _dragonLookTarget = new THREE.Vector3();

    const fluteKites: Array<{
      group: THREE.Group;
      tails: THREE.Mesh[];
      basePos: [number, number, number];
      phase: number;
    }> = [];
    const kiteSpecs: Array<{ pos: [number, number, number]; scale: number; rotY: number; phase: number }> = [
      { pos: [-17.4, 11.2, -10.4], scale: 0.96, rotY: 0.36, phase: 0.0 },
      { pos: [11.8, 16.0, -14.2], scale: 0.84, rotY: -0.24, phase: 2.1 },
      { pos: [16.2, 13.0, -10.8], scale: 0.92, rotY: -0.44, phase: 4.0 },
    ];
    kiteSpecs.forEach((ks) => {
      const { group: kg, tails } = buildVietnameseFluteKite(textures, geos, mats);
      kg.position.set(...ks.pos);
      kg.scale.setScalar(ks.scale);
      kg.rotation.y = ks.rotY;
      scene.add(kg);
      fluteKites.push({ group: kg, tails, basePos: ks.pos, phase: ks.phase });
    });

    // 12C. Festive Night Sky Fireworks (Pháo Hoa Lễ Hội Ngày Văn Hóa) — pooled zero-GC Points burst engine
    const fwBurstCount = 5;
    const fwParticlesPerBurst = 96;
    const fwTotalParticles = fwBurstCount * fwParticlesPerBurst;
    const fwPositions = new Float32Array(fwTotalParticles * 3);
    const fwColors = new Float32Array(fwTotalParticles * 3);
    const fwBaseColors = new Float32Array(fwTotalParticles * 3);
    const fwVelocities = new Float32Array(fwTotalParticles * 3);

    const fwGeo = new THREE.BufferGeometry();
    fwGeo.setAttribute('position', new THREE.BufferAttribute(fwPositions, 3));
    fwGeo.setAttribute('color', new THREE.BufferAttribute(fwColors, 3));
    geos.push(fwGeo);

    const fwMat = new THREE.PointsMaterial({
      size: 1.08,
      map: textures.sparkMap,
      vertexColors: true,
      transparent: true,
      opacity: initialTheme.nightBlend,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    mats.push(fwMat);
    const fwPoints = new THREE.Points(fwGeo, fwMat);
    fwPoints.renderOrder = 5;
    fwPoints.frustumCulled = false;
    scene.add(fwPoints);

    const fwSpotAnchors: Array<[number, number, number]> = [
      [-15.2, 14.4, -13.5],
      [14.8, 14.8, -13.2],
      [-9.6, 15.6, -15.4],
      [10.2, 15.5, -15.0],
      [-12.8, 12.6, -11.5],
    ];
    const fwPalettes: Array<[number, number, number]> = [
      [0xffd662, 0xff5a48, 0xfff4c4], // Imperial Gold & Crimson
      [0xffa6c4, 0xffe49c, 0xffffff], // Lotus Pink & Pearl
      [0x76e8b8, 0xffd86b, 0xc8fff0], // Jade Emerald & Sun Gold
      [0xff9e52, 0xffdc70, 0xff6258], // Festival Amber & Vermilion
      [0x92c8ff, 0xffe48c, 0xffa8c8], // Five-Color Brocade Spark
    ];

    interface FireworkBurst {
      age: number;
      maxAge: number;
      origin: [number, number, number];
      paletteIdx: number;
    }

    const fwBursts: FireworkBurst[] = Array.from({ length: fwBurstCount }, (_, bIdx) => ({
      age: (bIdx * 0.55) % 2.4,
      maxAge: 2.3 + (bIdx % 3) * 0.35,
      origin: fwSpotAnchors[bIdx % fwSpotAnchors.length],
      paletteIdx: bIdx % fwPalettes.length,
    }));

    function resetFireworkBurst(bIdx: number, customOrigin?: [number, number, number]) {
      const burst = fwBursts[bIdx];
      burst.age = 0;
      burst.maxAge = 2.15 + Math.random() * 0.65;
      burst.paletteIdx = (burst.paletteIdx + 1) % fwPalettes.length;
      const baseAnchor = customOrigin ?? fwSpotAnchors[(bIdx + Math.floor(Math.random() * 3)) % fwSpotAnchors.length];
      burst.origin = [
        baseAnchor[0] + (Math.random() - 0.5) * 3.4,
        baseAnchor[1] + (Math.random() - 0.5) * 2.0,
        baseAnchor[2] + (Math.random() - 0.5) * 2.2,
      ];

      const palette = fwPalettes[burst.paletteIdx];
      const baseIdx = bIdx * fwParticlesPerBurst;
      for (let p = 0; p < fwParticlesPerBurst; p++) {
        const idx = (baseIdx + p) * 3;
        fwPositions[idx] = burst.origin[0];
        fwPositions[idx + 1] = burst.origin[1];
        fwPositions[idx + 2] = burst.origin[2];

        // Spherical chrysanthemum distribution + inner gold core ring
        const phi = Math.acos(1 - (2 * (p + 0.5)) / fwParticlesPerBurst);
        const theta = Math.PI * (1 + Math.sqrt(5)) * p;
        const speed = (p % 3 === 0 ? 4.4 : 2.9) + (p % 5) * 0.32;
        fwVelocities[idx] = Math.sin(phi) * Math.cos(theta) * speed;
        fwVelocities[idx + 1] = Math.cos(phi) * speed + 0.9;
        fwVelocities[idx + 2] = Math.sin(phi) * Math.sin(theta) * speed;

        _lerpColor.setHex(palette[p % palette.length]);
        fwBaseColors[idx] = _lerpColor.r;
        fwBaseColors[idx + 1] = _lerpColor.g;
        fwBaseColors[idx + 2] = _lerpColor.b;
        fwColors[idx] = _lerpColor.r;
        fwColors[idx + 1] = _lerpColor.g;
        fwColors[idx + 2] = _lerpColor.b;
      }
    }

    // Seed initial bursts staggered mid-bloom so Night mode bursts immediately with color!
    for (let b = 0; b < fwBurstCount; b++) {
      resetFireworkBurst(b);
      const preSim = b * 0.42;
      fwBursts[b].age = preSim;
      const baseIdx = b * fwParticlesPerBurst;
      for (let p = 0; p < fwParticlesPerBurst; p++) {
        const idx = (baseIdx + p) * 3;
        fwPositions[idx] += fwVelocities[idx] * preSim * 0.72;
        fwPositions[idx + 1] += fwVelocities[idx + 1] * preSim * 0.72 - 0.5 * 2.1 * preSim * preSim;
        fwPositions[idx + 2] += fwVelocities[idx + 2] * preSim * 0.72;
      }
    }
    (fwGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (fwGeo.attributes.color as THREE.BufferAttribute).needsUpdate = true;

    // 13. Soaring Sculpted Vietnamese Chim Hạc / Chim Lạc Flock circling gracefully overhead (7 cranes)
    const soaringBirds: SoaringBird[] = [];
    for (let i = 0; i < 7; i++) {
      const { group: bg, leftWing, rightWing } = buildLacBird(geos, mats);
      bg.scale.setScalar(0.92 + (i % 3) * 0.15);
      scene.add(bg);
      soaringBirds.push({
        group: bg,
        leftWing,
        rightWing,
        radius: 13.0 + (i % 3) * 3.5,
        height: 11.6 + (i % 4) * 1.4,
        speed: 0.15 + (i % 3) * 0.022,
        angleOffset: (i / 7) * Math.PI * 2,
        flapSpeed: 3.1 + (i % 3) * 0.4,
      });
    }

    // 14. InstancedMesh Floating Water Hoa Đăng (24 Glowing Lotus Water Lanterns on the lake)
    const waterLanternCount = 24;
    const waterLanternPts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.28, 0.04),
      new THREE.Vector2(0.32, 0.16),
      new THREE.Vector2(0.16, 0.24),
      new THREE.Vector2(0.0, 0.22),
    ];
    const waterLanternGeo = new THREE.LatheGeometry(waterLanternPts, 10);
    geos.push(waterLanternGeo);
    const waterLanternMat = new THREE.MeshStandardMaterial({
      color: 0xffd284,
      emissive: 0xff8c2b,
      emissiveIntensity: 1.55,
      roughness: 0.4,
      metalness: 0.0,
    });
    mats.push(waterLanternMat);
    const waterLanternInst = new THREE.InstancedMesh(
      waterLanternGeo,
      waterLanternMat,
      waterLanternCount,
    );
    waterLanternInst.frustumCulled = false;

    const waterLanternSeeds = Array.from({ length: waterLanternCount }, (_, i) => {
      const angle = (i / waterLanternCount) * Math.PI * 2 + 0.14;
      const radius = 12.8 + (i % 5) * 2.4;
      return {
        angle,
        radius,
        speed: 0.02 + (i % 4) * 0.008,
        phase: i * 0.9,
        scale: 0.8 + (i % 3) * 0.18,
      };
    });
    for (let i = 0; i < waterLanternCount; i++) {
      _lerpColor.setHex(i % 3 === 0 ? 0xffb3c6 : i % 3 === 1 ? 0xffd57e : 0xff9a62);
      waterLanternInst.setColorAt(i, _lerpColor);
    }
    if (waterLanternInst.instanceColor) waterLanternInst.instanceColor.needsUpdate = true;
    scene.add(waterLanternInst);

    // 15. InstancedMesh Ambient Sky Lanterns (36 drifting glowing lanterns)
    const skyLanternCount = 36;
    const skyLanternGeo = new THREE.CylinderGeometry(0.24, 0.16, 0.42, 10);
    geos.push(skyLanternGeo);
    const skyLanternMat = new THREE.MeshStandardMaterial({
      color: 0xffd788,
      emissive: 0xff8e2c,
      emissiveIntensity: 1.5,
      roughness: 0.45,
      metalness: 0.0,
    });
    mats.push(skyLanternMat);
    const skyLanternInst = new THREE.InstancedMesh(
      skyLanternGeo,
      skyLanternMat,
      skyLanternCount,
    );
    skyLanternInst.frustumCulled = false;

    const lanternSeeds = Array.from({ length: skyLanternCount }, (_, i) => {
      const angle = (i / skyLanternCount) * Math.PI * 2 + (i % 5) * 0.17;
      const radius = 10 + (i % 7) * 4.2;
      return {
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        yBase: 2.8 + (i % 9) * 2.2,
        speed: 0.28 + (i % 5) * 0.07,
        phase: i * 1.13,
        scale: 0.72 + (i % 4) * 0.16,
      };
    });
    for (let i = 0; i < skyLanternCount; i++) {
      _lerpColor.setHex(i % 3 === 0 ? 0xffcf6b : i % 3 === 1 ? 0xff9b54 : 0xffe6a6);
      skyLanternInst.setColorAt(i, _lerpColor);
    }
    if (skyLanternInst.instanceColor) skyLanternInst.instanceColor.needsUpdate = true;
    scene.add(skyLanternInst);

    // 16. InstancedMesh Floating Blossom & Lotus Petals (52 petals)
    const petalCount = 52;
    const petalShape = new THREE.Shape();
    petalShape.moveTo(0, 0);
    petalShape.bezierCurveTo(0.08, 0.07, 0.07, 0.18, 0, 0.24);
    petalShape.bezierCurveTo(-0.07, 0.18, -0.08, 0.07, 0, 0);
    const driftPetalGeo = new THREE.ShapeGeometry(petalShape, 5);
    geos.push(driftPetalGeo);
    const driftPetalMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.84,
      side: THREE.DoubleSide,
    });
    mats.push(driftPetalMat);
    const driftPetalInst = new THREE.InstancedMesh(driftPetalGeo, driftPetalMat, petalCount);
    driftPetalInst.frustumCulled = false;
    const petalSeeds = Array.from({ length: petalCount }, (_, i) => ({
      x: (((i * 41) % 100) / 100 - 0.5) * 30,
      y: 1.5 + (((i * 67) % 100) / 100) * 12,
      z: (((i * 83) % 100) / 100 - 0.5) * 26,
      phase: i * 0.77,
      speed: 0.32 + (i % 4) * 0.09,
    }));
    for (let i = 0; i < petalCount; i++) {
      // Mix of Hoa Đào pink and Hoa Mai warm golden petals
      _lerpColor.setHex(i % 3 === 0 ? 0xffdf7a : 0xffb0c8);
      driftPetalInst.setColorAt(i, _lerpColor);
    }
    if (driftPetalInst.instanceColor) driftPetalInst.instanceColor.needsUpdate = true;
    scene.add(driftPetalInst);

    // 17. InstancedMesh Soft Rising Incense Smoke Wisps from the two bronze burners by Bia Rùa
    const incenseCount = 16;
    const incenseGeo = new THREE.PlaneGeometry(0.45, 0.45);
    geos.push(incenseGeo);
    const incenseMat = new THREE.MeshBasicMaterial({
      map: textures.mistCloudMap,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    mats.push(incenseMat);
    const incenseInst = new THREE.InstancedMesh(incenseGeo, incenseMat, incenseCount);
    incenseInst.frustumCulled = false;
    scene.add(incenseInst);

    // 18. InstancedMesh Golden Shimmer Motes (64 warm motes)
    const moteCount = 64;
    const moteGeo = new THREE.OctahedronGeometry(0.05, 0);
    geos.push(moteGeo);
    const moteMat = new THREE.MeshBasicMaterial({
      color: 0xffebaa,
      transparent: true,
      opacity: 0.7,
    });
    mats.push(moteMat);
    const moteInst = new THREE.InstancedMesh(moteGeo, moteMat, moteCount);
    moteInst.frustumCulled = false;
    const moteSeeds = Array.from({ length: moteCount }, (_, i) => ({
      x: (((i * 37) % 100) / 100 - 0.5) * 32,
      y: 0.8 + (((i * 53) % 100) / 100) * 13,
      z: (((i * 71) % 100) / 100 - 0.5) * 28,
      phase: i * 0.61,
      speed: 0.25 + (i % 4) * 0.08,
    }));
    scene.add(moteInst);

    // Shared geometry/material for user-released wish lanterns
    const wishLanternPts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.24, 0.05),
      new THREE.Vector2(0.42, 0.34),
      new THREE.Vector2(0.4, 0.72),
      new THREE.Vector2(0.2, 0.94),
      new THREE.Vector2(0.0, 0.98),
    ];
    const wishBodyGeo = new THREE.LatheGeometry(wishLanternPts, 16);
    geos.push(wishBodyGeo);
    const wishBodyMat = new THREE.MeshStandardMaterial({
      color: 0xffdb8a,
      emissive: 0xff842b,
      emissiveIntensity: 2.2,
      roughness: 0.35,
      metalness: 0.0,
    });
    mats.push(wishBodyMat);
    const wishRimGeo = new THREE.TorusGeometry(0.24, 0.03, 8, 16);
    geos.push(wishRimGeo);

    const activeWishLanterns: ActiveWishLantern[] = [];

    function spawnWishLantern() {
      const g = new THREE.Group();
      const body = new THREE.Mesh(wishBodyGeo, wishBodyMat);
      g.add(body);
      const rim = new THREE.Mesh(wishRimGeo, goldAccentMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.04;
      g.add(rim);

      const angle = Math.random() * Math.PI * 2;
      const dist = 2.8 + Math.random() * 5.0;
      g.position.set(
        Math.cos(angle) * dist,
        0.65,
        2.5 + Math.sin(angle) * dist * 0.7,
      );
      scene.add(g);

      activeWishLanterns.push({
        mesh: g,
        velocityY: 1.05 + Math.random() * 0.45,
        driftX: (Math.random() - 0.5) * 0.4,
        driftZ: (Math.random() - 0.5) * 0.4,
        phase: Math.random() * Math.PI * 2,
        age: 0,
        maxAge: 16,
      });
    }

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      const nextAspect = w / h;
      camera.fov = nextAspect < 0.85 ? 58 : 44;
      camera.aspect = nextAspect;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (composer) {
        composer.setSize(w, h);
      }
      if (bloomPass) {
        bloomPass.resolution.set(w, h);
      }
    };
    window.addEventListener('resize', onResize);

    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let elapsed = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) {
            if (sync) gl.deleteSync(sync);
            return;
          }
          const status = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
          if (status === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 90);
      }
    }

    function tick() {
      if (disposed) return;

      const now = performance.now();
      const rawDt = Math.max(0.001, (now - lastTime) / 1000);
      const dt = Math.min(rawDt, 0.08);
      const transitionDt = Math.min(rawDt, 0.25);
      lastTime = now;
      elapsed += dt;

      // 1. Spawn any queued user wish lanterns (+ celebratory firework burst in night mode)
      while (lanternSpawnQueueRef.current > 0) {
        lanternSpawnQueueRef.current -= 1;
        spawnWishLantern();
        if (moodRef.current === 'night') {
          resetFireworkBurst(Math.floor(Math.random() * fwBurstCount), [
            (Math.random() - 0.5) * 18,
            14.2 + Math.random() * 2.2,
            -12.8,
          ]);
        }
      }

      // 2. Smooth Golden-Hour Dawn ↔ Harvest-Moon Festival Night crossfade
      const targetTheme = MOOD_THEMES[moodRef.current];
      const dampT = 1 - Math.exp(-7.2 * transitionDt);

      (scene.background as THREE.Color).lerp(targetTheme.fogColor, dampT);
      const fog = scene.fog as THREE.FogExp2;
      fog.color.lerp(targetTheme.fogColor, dampT);
      fog.density = THREE.MathUtils.lerp(fog.density, targetTheme.fogDensity, dampT);
      skyNightMat.opacity = THREE.MathUtils.lerp(
        skyNightMat.opacity,
        targetTheme.nightBlend,
        dampT,
      );
      starMat.opacity = THREE.MathUtils.lerp(
        starMat.opacity,
        targetTheme.nightBlend * 0.9,
        dampT,
      );
      scene.environmentIntensity = THREE.MathUtils.lerp(
        scene.environmentIntensity,
        targetTheme.envIntensity,
        dampT,
      );

      keyLight.color.lerp(targetTheme.keyColor, dampT);
      keyLight.intensity = THREE.MathUtils.lerp(keyLight.intensity, targetTheme.keyIntensity, dampT);
      hemiLight.color.lerp(targetTheme.hemiSky, dampT);
      hemiLight.groundColor.lerp(targetTheme.hemiGround, dampT);
      hemiLight.intensity = THREE.MathUtils.lerp(
        hemiLight.intensity,
        targetTheme.hemiIntensity,
        dampT,
      );
      rimLight.color.lerp(targetTheme.rimColor, dampT);
      rimLight.intensity = THREE.MathUtils.lerp(rimLight.intensity, targetTheme.rimIntensity, dampT);

      const musicPulse = musicPlayingRef.current ? 1 + Math.sin(elapsed * 4.2) * 0.12 : 1;
      pavilionPointLight.intensity = THREE.MathUtils.lerp(
        pavilionPointLight.intensity,
        targetTheme.lanternPointIntensity * musicPulse,
        dampT,
      );
      pagodaPointLight.intensity = THREE.MathUtils.lerp(
        pagodaPointLight.intensity,
        targetTheme.lanternPointIntensity * 0.85 * musicPulse,
        dampT,
      );
      plazaPointLight.intensity = THREE.MathUtils.lerp(
        plazaPointLight.intensity,
        targetTheme.lanternPointIntensity * 0.72 * musicPulse,
        dampT,
      );
      pavilionGlowMat.emissiveIntensity = THREE.MathUtils.lerp(
        pavilionGlowMat.emissiveIntensity,
        targetTheme.pavilionGlow * musicPulse,
        dampT,
      );
      pagodaGlowMat.emissiveIntensity = THREE.MathUtils.lerp(
        pagodaGlowMat.emissiveIntensity,
        targetTheme.pavilionGlow * musicPulse,
        dampT,
      );
      waterLanternMat.emissiveIntensity = THREE.MathUtils.lerp(
        waterLanternMat.emissiveIntensity,
        (moodRef.current === 'night' ? 2.5 : 1.1) * musicPulse,
        dampT,
      );
      waterGlowMat.opacity = THREE.MathUtils.lerp(
        waterGlowMat.opacity,
        targetTheme.waterShimmerOpacity * musicPulse,
        dampT,
      );
      for (let i = 0; i < lanternSilkMats.length; i++) {
        lanternSilkMats[i].emissiveIntensity = THREE.MathUtils.lerp(
          lanternSilkMats[i].emissiveIntensity,
          targetTheme.lanternGlow * musicPulse,
          dampT,
        );
      }

      if (bloomPass) {
        bloomPass.strength = THREE.MathUtils.lerp(
          bloomPass.strength,
          targetTheme.bloomStrength,
          dampT,
        );
      }

      waterMat.color.lerp(targetTheme.waterColor, dampT);
      textures.waterRippleMap.offset.x = (elapsed * 0.015) % 1;
      textures.waterRippleMap.offset.y = (elapsed * 0.01) % 1;

      for (let i = 0; i < waterShimmers.length; i++) {
        const sh = waterShimmers[i];
        const ripple = 1 + Math.sin(elapsed * 2.1 + sh.phase) * 0.07;
        sh.mesh.scale.set(sh.baseScaleX * ripple, 1, sh.baseScaleZ * (2 - ripple));
      }

      renderer.toneMappingExposure = THREE.MathUtils.lerp(
        renderer.toneMappingExposure,
        targetTheme.exposure,
        dampT,
      );

      // 3. Smooth damped camera preset transitions
      if (cameraRequestRef.current.active) {
        const spec = CAMERA_PRESETS[cameraRequestRef.current.preset];
        _targetCamPos.set(...spec.position);
        _targetLookAt.set(...spec.target);
        const camDamp = 1 - Math.exp(-6.5 * transitionDt);
        camera.position.lerp(_targetCamPos, camDamp);
        controls.target.lerp(_targetLookAt, camDamp);
        if (
          camera.position.distanceToSquared(_targetCamPos) < 0.006 &&
          controls.target.distanceToSquared(_targetLookAt) < 0.006
        ) {
          camera.position.copy(_targetCamPos);
          controls.target.copy(_targetLookAt);
          cameraRequestRef.current.active = false;
        }
      }

      controls.update();

      // 4. Animate waving National Flag & Five-Color Festival Flags
      const waveSpeed = musicPlayingRef.current ? 4.4 : 3.2;
      for (let f = 0; f < animatedFlags.length; f++) {
        const item = animatedFlags[f];
        const posAttr = item.mesh.geometry.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        const count = posAttr.count;
        const rest = item.restPositions;
        for (let i = 0; i < count; i++) {
          const idx = i * 3;
          const rx = rest[idx];
          const ry = rest[idx + 1];
          const distFromPole = Math.max(0, (rx - 0.04) / item.width);
          const amp = Math.pow(distFromPole, 1.25) * (f === 0 ? 0.25 : 0.16);
          const waveZ =
            Math.sin(distFromPole * 5.6 - elapsed * waveSpeed + ry * 0.45 + item.phase) * amp +
            Math.sin(distFromPole * 9.0 - elapsed * (waveSpeed * 1.45) + item.phase) * amp * 0.28;
          const droopY = -distFromPole * distFromPole * 0.06;
          arr[idx] = rx;
          arr[idx + 1] = ry + droopY;
          arr[idx + 2] = waveZ;
        }
        posAttr.needsUpdate = true;
      }

      // 5. Gentle lake rock on Sampan boat & lotus clusters
      sampan.position.y = 0.04 + Math.sin(elapsed * 1.1) * 0.04;
      sampan.rotation.z = Math.sin(elapsed * 0.95) * 0.038;
      sampan.rotation.x = Math.cos(elapsed * 0.78) * 0.022;

      for (let i = 0; i < floatingLotuses.length; i++) {
        const lotus = floatingLotuses[i];
        lotus.position.y = 0.02 + Math.sin(elapsed * 1.25 + i * 0.9) * 0.028;
        lotus.rotation.z = Math.sin(elapsed * 0.85 + i) * 0.025;
      }

      // Subtle slow drift on atmospheric mountain mist bands
      for (let i = 0; i < mistPlanes.length; i++) {
        mistPlanes[i].position.y = 2.2 + (i % 3) * 1.1 + Math.sin(elapsed * 0.3 + i) * 0.22;
      }

      // 6. Animate Celestial 54-Ethnic Unity Halo, 360° Brocade Sky Ribbon, Rồng Thời Lý Dragon, Kites & Fireworks
      haloMesh.rotation.z = elapsed * 0.065;
      orbRingGroup.rotation.z = -elapsed * 0.09;
      const targetHaloOpacity = moodRef.current === 'night' ? 0.86 : 0.54;
      haloMat.opacity = THREE.MathUtils.lerp(haloMat.opacity, targetHaloOpacity * musicPulse, dampT);
      const targetRibbonOpacity = moodRef.current === 'night' ? 0.84 : 0.76;
      brocadeRibbonMat.opacity = THREE.MathUtils.lerp(
        brocadeRibbonMat.opacity,
        targetRibbonOpacity,
        dampT,
      );

      // Smoothly glide & wave the 360° Ethnic Brocade Ribbon around the entire sanctuary
      textures.brocadeRibbonMap.offset.x = (elapsed * 0.032) % 1;
      const rPosAttr = encirclingRibbon.geometry.attributes.position as THREE.BufferAttribute;
      const rArr = rPosAttr.array as Float32Array;
      for (let i = 0; i < rPosAttr.count; i++) {
        const theta = ribbonBaseTheta[i];
        const vOffset = ribbonBaseV[i];
        const r = 22.0 + Math.sin(theta * 3 + elapsed * 0.4) * 1.8;
        const frontLift = Math.max(0, Math.sin(theta)) * 3.2;
        const yWave =
          13.9 +
          Math.sin(theta * 4 + 0.6 - elapsed * 0.85) * 1.45 +
          Math.cos(theta * 6 + elapsed * 1.15) * 0.32 +
          frontLift;
        const idx = i * 3;
        rArr[idx] = Math.cos(theta) * r;
        rArr[idx + 1] = yWave + vOffset;
        rArr[idx + 2] = Math.sin(theta) * r;
      }
      rPosAttr.needsUpdate = true;

      // Animate soaring articulated Vietnamese Rồng Thời Lý (Lý Dynasty Dragon) with iconic S-curve undulation
      const dragonAngleOffset = -Math.PI * 0.67; // Starts in scenic upper-left sky on load!
      const evalDragonPos = (tParam: number, out: THREE.Vector3) => {
        const a = dragonAngleOffset + tParam;
        const rX = 16.0 + Math.sin(a * 6.5) * 1.15 + Math.sin(a * 2.0) * 1.4;
        const rZ = 14.4 + Math.cos(a * 6.5) * 0.95 + Math.cos(a * 2.0) * 1.2;
        const y =
          14.2 +
          Math.sin(a * 9.5 + elapsed * 2.1) * 1.32 +
          Math.cos(a * 3.0) * 0.72;
        out.set(Math.cos(a) * rX, y, Math.sin(a) * rZ - 2.4);
      };

      const dragonHeadT = elapsed * 0.22;
      // Glowing Dragon Pearl gliding just ahead of the dragon's open jaws
      evalDragonPos(dragonHeadT + 0.088, dragonPearl.position);
      dragonPearl.lookAt(camera.position);
      dragonPearlMat.emissiveIntensity =
        (moodRef.current === 'night' ? 2.5 : 1.4) * musicPulse;

      for (let s = 0; s < dragonSegments.length; s++) {
        const segT = dragonHeadT - s * 0.0265;
        const seg = dragonSegments[s];
        evalDragonPos(segT, seg.position);
        evalDragonPos(segT + 0.024, _dragonLookTarget);
        seg.lookAt(_dragonLookTarget);
        // Subtle sinuous side-roll as the dragon weaves through clouds
        seg.rotateZ(Math.sin(elapsed * 2.4 - s * 0.4) * 0.18);
      }

      // Animate Night Festival Fireworks (Pháo Hoa Lễ Hội)
      fwMat.opacity = THREE.MathUtils.lerp(fwMat.opacity, targetTheme.nightBlend * 0.96, dampT);
      if (fwMat.opacity > 0.02) {
        const fwPosAttr = fwGeo.attributes.position as THREE.BufferAttribute;
        const fwColAttr = fwGeo.attributes.color as THREE.BufferAttribute;
        for (let b = 0; b < fwBurstCount; b++) {
          const burst = fwBursts[b];
          burst.age += dt;
          if (burst.age >= burst.maxAge) {
            resetFireworkBurst(b);
            continue;
          }
          const progress = burst.age / burst.maxAge;
          const fade = Math.max(0, Math.pow(1 - progress, 1.35));
          const drag = Math.exp(-1.15 * dt);
          const baseIdx = b * fwParticlesPerBurst;
          for (let p = 0; p < fwParticlesPerBurst; p++) {
            const idx = (baseIdx + p) * 3;
            fwVelocities[idx] *= drag;
            fwVelocities[idx + 1] = fwVelocities[idx + 1] * drag - 2.15 * dt;
            fwVelocities[idx + 2] *= drag;

            fwPositions[idx] += fwVelocities[idx] * dt;
            fwPositions[idx + 1] += fwVelocities[idx + 1] * dt;
            fwPositions[idx + 2] += fwVelocities[idx + 2] * dt;

            const twinkle = 0.78 + Math.sin(elapsed * 18 + p * 1.7) * 0.22;
            const bright = fade * twinkle;
            fwColors[idx] = fwBaseColors[idx] * bright;
            fwColors[idx + 1] = fwBaseColors[idx + 1] * bright;
            fwColors[idx + 2] = fwBaseColors[idx + 2] * bright;
          }
        }
        fwPosAttr.needsUpdate = true;
        fwColAttr.needsUpdate = true;
      }

      for (let k = 0; k < fluteKites.length; k++) {
        const fk = fluteKites[k];
        fk.group.position.x = fk.basePos[0] + Math.sin(elapsed * 0.55 + fk.phase) * 0.85;
        fk.group.position.y = fk.basePos[1] + Math.sin(elapsed * 0.9 + fk.phase) * 0.42;
        fk.group.rotation.z = Math.sin(elapsed * 0.75 + fk.phase) * 0.14;
        for (let t = 0; t < fk.tails.length; t++) {
          fk.tails[t].rotation.z = Math.sin(elapsed * 2.8 + fk.phase + t * 0.9) * 0.28;
          fk.tails[t].rotation.x = Math.cos(elapsed * 2.2 + fk.phase + t) * 0.16;
        }
      }

      // 6B. Soaring Sculpted Vietnamese Chim Hạc / Chim Lạc flock orbiting smoothly overhead
      for (let i = 0; i < soaringBirds.length; i++) {
        const b = soaringBirds[i];
        const a = b.angleOffset + elapsed * b.speed;
        const bx = Math.cos(a) * b.radius;
        const bz = Math.sin(a) * b.radius - 2.0;
        const by = b.height + Math.sin(elapsed * 0.8 + i) * 0.55;
        b.group.position.set(bx, by, bz);
        // Face tangent direction of flight
        b.group.rotation.y = -a;
        b.group.rotation.z = 0.16;
        const flap = Math.sin(elapsed * b.flapSpeed + i * 1.3) * 0.36;
        b.rightWing.rotation.z = flap;
        b.leftWing.rotation.z = -flap;
      }

      // 7. Floating glowing water hoa đăng drifting gently on the lake
      for (let i = 0; i < waterLanternCount; i++) {
        const wl = waterLanternSeeds[i];
        const a = wl.angle + elapsed * wl.speed;
        _dummy.position.set(
          Math.cos(a) * wl.radius,
          0.02 + Math.sin(elapsed * 1.6 + wl.phase) * 0.025,
          Math.sin(a) * wl.radius + 1.5,
        );
        _dummy.rotation.set(0, a + elapsed * 0.15, Math.sin(elapsed + wl.phase) * 0.04);
        _dummy.scale.setScalar(wl.scale);
        _dummy.updateMatrix();
        waterLanternInst.setMatrixAt(i, _dummy.matrix);
      }
      waterLanternInst.instanceMatrix.needsUpdate = true;

      // 8. Rising festive sky lanterns
      for (let i = 0; i < skyLanternCount; i++) {
        const s = lanternSeeds[i];
        const yLoop = ((s.yBase + elapsed * s.speed) % 21) + 2.0;
        const swayX = s.x + Math.sin(elapsed * 0.65 + s.phase) * 0.65;
        const swayZ = s.z + Math.cos(elapsed * 0.55 + s.phase) * 0.55;
        _dummy.position.set(swayX, yLoop, swayZ);
        _dummy.rotation.set(0, elapsed * 0.2 + s.phase, Math.sin(elapsed + s.phase) * 0.06);
        _dummy.scale.setScalar(s.scale);
        _dummy.updateMatrix();
        skyLanternInst.setMatrixAt(i, _dummy.matrix);
      }
      skyLanternInst.instanceMatrix.needsUpdate = true;

      // 9. Softly drifting Hoa Đào & Hoa Mai petals
      for (let i = 0; i < petalCount; i++) {
        const p = petalSeeds[i];
        const yFall = 13 - ((elapsed * p.speed + p.phase * 1.8) % 12.0);
        const xDrift = p.x + Math.sin(elapsed * 0.85 + p.phase) * 1.4;
        const zDrift = p.z + Math.cos(elapsed * 0.72 + p.phase) * 1.2;
        _dummy.position.set(xDrift, yFall, zDrift);
        _dummy.rotation.set(
          elapsed * 0.9 + p.phase,
          elapsed * 0.7 + p.phase,
          Math.sin(elapsed + p.phase) * 0.6,
        );
        _dummy.scale.setScalar(0.85 + (i % 3) * 0.22);
        _dummy.updateMatrix();
        driftPetalInst.setMatrixAt(i, _dummy.matrix);
      }
      driftPetalInst.instanceMatrix.needsUpdate = true;

      // 10. Delicate rising incense smoke wisps above Bia Rùa bronze burners
      for (let i = 0; i < incenseCount; i++) {
        const isLeft = i % 2 === 0;
        const cycle = ((elapsed * 0.45 + i * 0.22) % 1);
        const baseX = isLeft ? -6.58 : -3.42;
        const baseZ = isLeft ? 6.08 : 4.82;
        _dummy.position.set(
          baseX + Math.sin(elapsed * 1.2 + i) * 0.14 * cycle,
          1.25 + cycle * 1.85,
          baseZ + Math.cos(elapsed * 1.1 + i) * 0.12 * cycle,
        );
        _dummy.rotation.set(0, 0.4, cycle * 0.6);
        _dummy.scale.setScalar(0.45 + cycle * 1.1);
        _dummy.updateMatrix();
        incenseInst.setMatrixAt(i, _dummy.matrix);
      }
      incenseInst.instanceMatrix.needsUpdate = true;

      // 11. Shimmering golden particles
      for (let i = 0; i < moteCount; i++) {
        const m = moteSeeds[i];
        const y = ((m.y + elapsed * m.speed) % 13.5) + 0.6;
        _dummy.position.set(
          m.x + Math.sin(elapsed * 0.9 + m.phase) * 0.4,
          y,
          m.z + Math.cos(elapsed * 0.8 + m.phase) * 0.4,
        );
        const pulse = 0.65 + Math.sin(elapsed * 2.6 + m.phase) * 0.35;
        _dummy.scale.setScalar(pulse);
        _dummy.rotation.set(elapsed, m.phase, 0);
        _dummy.updateMatrix();
        moteInst.setMatrixAt(i, _dummy.matrix);
      }
      moteInst.instanceMatrix.needsUpdate = true;

      // 12. Animate user-released wish lanterns
      for (let i = activeWishLanterns.length - 1; i >= 0; i--) {
        const w = activeWishLanterns[i];
        w.age += dt;
        w.mesh.position.y += w.velocityY * dt;
        w.mesh.position.x += (w.driftX + Math.sin(elapsed * 1.4 + w.phase) * 0.32) * dt;
        w.mesh.position.z += (w.driftZ + Math.cos(elapsed * 1.2 + w.phase) * 0.28) * dt;
        w.mesh.rotation.y += dt * 0.45;
        if (w.age > w.maxAge) {
          scene.remove(w.mesh);
          activeWishLanterns.splice(i, 1);
        }
      }

      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      controls.removeEventListener('start', onControlStart);
      canvasEl.removeEventListener('webglcontextlost', onContextLost);
      canvasEl.removeEventListener('webglcontextrestored', onContextRestored);
      controls.dispose();

      activeWishLanterns.forEach((w) => scene.remove(w.mesh));
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      textures.dispose();
      envTarget.dispose();
      if (composer) {
        composer.dispose();
      }
      renderer.dispose();

      if (canvasEl.parentNode === container) {
        container.removeChild(canvasEl);
      }
    };
  }, []);

  if (webglUnavailable) {
    return (
      <div
        data-testid="heritage-canvas-fallback"
        className="fixed inset-0 flex items-center justify-center bg-[#f4e2ce] text-[#2b1815] p-6"
      >
        <div className="max-w-lg border border-[#d6b98c] bg-[#fdf8f0] p-8 text-center">
          <p className="text-sm font-semibold text-[#b91c1c]">24 · 11 · Ngày Văn Hóa Việt Nam</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-[#2b1815]">
            Văn hóa còn thì dân tộc còn, văn hóa mất thì dân tộc mất
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#5c4338]">
            Trình duyệt hiện chưa bật tăng tốc đồ họa WebGL để hiển thị không gian 3D Khuê Văn Các,
            Chùa Một Cột và Cột Cờ Hà Nội. Bạn vẫn có thể nghe lời mở đầu, nhạc nền và tạo thiệp chia sẻ.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      data-testid="heritage-canvas-wrapper"
      data-mood={mood}
      data-camera={cameraPreset}
      data-lanterns={lanternCount}
      className="fixed inset-0 h-full w-full select-none"
      aria-label="Không gian 3D tương tác Khuê Văn Các, Chùa Một Cột, Cột Cờ Hà Nội, Cầu Thê Húc và Đầm Sen Ngày Văn Hóa Việt Nam 24-11"
    />
  );
}
