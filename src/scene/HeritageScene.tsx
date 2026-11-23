import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { CameraPresetId, SceneMood } from '../utils/greetingLink';
import { createSceneTextures } from './textures';
import {
  buildBambooGrove,
  buildCeremonialLanternPole,
  buildCulturalStele,
  buildHanoiFlagTower,
  buildKarstHorizon,
  buildKhueVanPavilion,
  buildLotusCluster,
  buildTheHucBridge,
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
    position: [1.5, 8.1, 25.0],
    target: [1.3, 4.8, -0.6],
  },
  pavilion: {
    position: [-5.8, 5.4, 11.4],
    target: [-1.4, 4.5, -1.0],
  },
  flagtower: {
    position: [12.4, 8.8, 12.2],
    target: [5.6, 7.6, -2.4],
  },
  lotus: {
    position: [-6.0, 3.3, 13.4],
    target: [-3.8, 1.8, 5.2],
  },
};

const MOOD_THEMES = {
  dawn: {
    fogColor: new THREE.Color(0xf7dfc4),
    fogDensity: 0.0092,
    keyColor: new THREE.Color(0xffe9c7),
    keyIntensity: 2.05,
    hemiSky: new THREE.Color(0xdeebf5),
    hemiGround: new THREE.Color(0xb88c68),
    hemiIntensity: 1.15,
    rimColor: new THREE.Color(0xffc98b),
    rimIntensity: 0.85,
    lanternPointIntensity: 2.2,
    pavilionGlow: 0.95,
    lanternGlow: 0.78,
    waterColor: new THREE.Color(0x3a8d8a),
    exposure: 1.02,
    nightBlend: 0.0,
  },
  night: {
    fogColor: new THREE.Color(0x231528),
    fogDensity: 0.0128,
    keyColor: new THREE.Color(0xa6bae8),
    keyIntensity: 0.62,
    hemiSky: new THREE.Color(0x463d6e),
    hemiGround: new THREE.Color(0x5a2526),
    hemiIntensity: 0.68,
    rimColor: new THREE.Color(0xffa452),
    rimIntensity: 1.38,
    lanternPointIntensity: 14.5,
    pavilionGlow: 2.7,
    lanternGlow: 2.4,
    waterColor: new THREE.Color(0x1b3446),
    exposure: 1.0,
    nightBlend: 1.0,
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
    pmremGenerator.dispose();

    const aspect = width / height;
    const baseFov = aspect < 0.85 ? 58 : 44;
    const camera = new THREE.PerspectiveCamera(baseFov, aspect, 0.25, 240);
    const initCam = CAMERA_PRESETS.overview;
    camera.position.set(...initCam.position);

    const controls = new OrbitControls(camera, canvasEl);
    controls.target.set(...initCam.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI * 0.485;
    controls.minPolarAngle = 0.22;
    controls.minDistance = 7.5;
    controls.maxDistance = 36;
    controls.enablePan = false;
    controls.update();

    const onControlStart = () => {
      cameraRequestRef.current.active = false;
    };
    controls.addEventListener('start', onControlStart);

    // Soft Warm/Cool 3-Point Heritage Lighting Rig
    const keyLight = new THREE.DirectionalLight(
      initialTheme.keyColor,
      initialTheme.keyIntensity,
    );
    keyLight.position.set(16, 20, 14);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 58;
    keyLight.shadow.camera.left = -18;
    keyLight.shadow.camera.right = 18;
    keyLight.shadow.camera.top = 18;
    keyLight.shadow.camera.bottom = -18;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
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
    rimLight.position.set(-14, 12, -16);
    scene.add(rimLight);

    const pavilionPointLight = new THREE.PointLight(
      0xffae4a,
      initialTheme.lanternPointIntensity,
      24,
      1.6,
    );
    pavilionPointLight.position.set(-1.4, 5.2, -0.8);
    scene.add(pavilionPointLight);

    const plazaPointLight = new THREE.PointLight(
      0xff9348,
      initialTheme.lanternPointIntensity * 0.78,
      20,
      1.6,
    );
    plazaPointLight.position.set(-1.5, 3.2, 6.4);
    scene.add(plazaPointLight);

    const textures = createSceneTextures(renderer.capabilities.getMaxAnisotropy());
    const geos: THREE.BufferGeometry[] = [];
    const mats: THREE.Material[] = [];

    // 0. Painterly Watercolor Sky Domes (Dawn & Velvet Twilight Night crossfade)
    const skyDawnGeo = new THREE.SphereGeometry(118, 32, 20);
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
    scene.add(skyDawnMesh);

    const skyNightGeo = new THREE.SphereGeometry(114, 32, 20);
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
    scene.add(skyNightMesh);

    // 1. Luminous Silk Lake Surface with gentle animated ripples
    const waterGeo = new THREE.CircleGeometry(82, 64);
    waterGeo.rotateX(-Math.PI / 2);
    geos.push(waterGeo);
    const waterMat = new THREE.MeshStandardMaterial({
      color: initialTheme.waterColor.clone(),
      bumpMap: textures.waterRippleMap,
      bumpScale: 0.025,
      roughness: 0.14,
      metalness: 0.32,
    });
    mats.push(waterMat);
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = 0;
    waterMesh.receiveShadow = true;
    scene.add(waterMesh);

    // 2. Warm Sandstone Ceremonial Island & Đông Sơn Bronze Drum Plaza
    const islandGeo = new THREE.CylinderGeometry(10.8, 11.7, 0.34, 56);
    geos.push(islandGeo);
    const islandMat = new THREE.MeshStandardMaterial({
      color: 0xf7e9d4,
      map: textures.stoneMap,
      bumpMap: textures.stoneBump,
      bumpScale: 0.03,
      roughness: 0.88,
      metalness: 0.03,
    });
    mats.push(islandMat);
    const mainIsland = new THREE.Mesh(islandGeo, islandMat);
    mainIsland.position.set(1.2, 0.08, -0.5);
    mainIsland.receiveShadow = true;
    scene.add(mainIsland);

    // Soft gilded rim encircling the courtyard island
    const islandRimGeo = new THREE.TorusGeometry(10.82, 0.09, 10, 64);
    islandRimGeo.rotateX(Math.PI / 2);
    geos.push(islandRimGeo);
    const goldAccentMat = new THREE.MeshStandardMaterial({
      color: 0xe9be5b,
      roughness: 0.28,
      metalness: 0.85,
    });
    mats.push(goldAccentMat);
    const islandRim = new THREE.Mesh(islandRimGeo, goldAccentMat);
    islandRim.position.set(1.2, 0.25, -0.5);
    scene.add(islandRim);

    // Đông Sơn Bronze Drum Medallion
    const drumGeo = new THREE.CylinderGeometry(5.6, 5.72, 0.06, 64);
    geos.push(drumGeo);
    const drumMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.dongSonMap,
      bumpMap: textures.dongSonBump,
      bumpScale: 0.055,
      roughness: 0.36,
      metalness: 0.76,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    mats.push(drumMat);
    const drumPlaza = new THREE.Mesh(drumGeo, drumMat);
    drumPlaza.position.set(1.0, 0.28, 3.2);
    drumPlaza.receiveShadow = true;
    scene.add(drumPlaza);

    // Curved Vermilion Arched Cầu Thê Húc Bridge leading to the island
    const theHucBridge = buildTheHucBridge(geos, mats);
    theHucBridge.position.set(0.6, 0.02, 12.6);
    scene.add(theHucBridge);

    // 3. Hero Monument 1: Khuê Văn Các Cultural Pavilion
    const { group: pavilion, glowMat: pavilionGlowMat } = buildKhueVanPavilion(
      textures,
      geos,
      mats,
    );
    pavilion.position.set(-1.4, 0.25, -1.2);
    scene.add(pavilion);

    // 4. Hero Monument 2: Cột Cờ Hà Nội + Waving Vietnamese Flag
    const {
      group: flagTower,
      flagMesh,
      flagRestPositions,
    } = buildHanoiFlagTower(textures, geos, mats);
    flagTower.position.set(6.8, 0.25, -2.6);
    scene.add(flagTower);

    // 5. Cultural Stele (Cố Tổng Bí thư Nguyễn Phú Trọng's quote) + Bronze Incense Burners
    const stele = buildCulturalStele(textures, geos, mats);
    stele.position.set(-4.5, 0.25, 5.2);
    stele.rotation.y = 0.38;
    scene.add(stele);

    // 6. Graceful Vietnamese Bamboo Groves (Lũy Tre Xanh) framing the island flanks
    const bambooSpecs: Array<{ pos: [number, number, number]; scale: number; rotY: number }> = [
      { pos: [-7.8, 0.24, -1.8], scale: 1.12, rotY: 0.4 },
      { pos: [-6.8, 0.24, -6.2], scale: 0.96, rotY: 1.8 },
      { pos: [10.4, 0.24, -4.8], scale: 1.05, rotY: -0.9 },
      { pos: [9.6, 0.24, 1.4], scale: 0.88, rotY: 2.4 },
    ];
    bambooSpecs.forEach((b) => {
      const grove = buildBambooGrove(b.scale, geos, mats);
      grove.position.set(...b.pos);
      grove.rotation.y = b.rotY;
      scene.add(grove);
    });

    // 7. Hội An Silk Lantern Poles framing the ceremonial courtyard
    const lanternSilkMats: THREE.MeshStandardMaterial[] = [];
    const poleSpecs: Array<{ pos: [number, number, number]; rotY: number; color: number }> = [
      { pos: [-6.2, 0.25, 3.5], rotY: 0.4, color: 0xeb4c3c },
      { pos: [7.6, 0.25, 3.8], rotY: Math.PI - 0.4, color: 0xf8b13c },
      { pos: [-6.4, 0.25, -4.4], rotY: -0.35, color: 0xf8b13c },
      { pos: [3.6, 0.25, 7.6], rotY: Math.PI + 0.5, color: 0xeb4c3c },
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

    // 8. Lush Gradient-Blush 3D Lotus Clusters
    const floatingLotuses: THREE.Group[] = [];
    const lotusSpecs: Array<{ pos: [number, number, number]; scale: number; tint: number }> = [
      { pos: [-6.8, 0.02, 8.8], scale: 1.5, tint: 0xffd8e4 },
      { pos: [-4.0, 0.02, 11.4], scale: 1.22, tint: 0xffe4ec },
      { pos: [5.0, 0.02, 9.8], scale: 1.45, tint: 0xffd0df },
      { pos: [7.6, 0.02, 7.8], scale: 1.18, tint: 0xffe0ea },
      { pos: [-10.0, 0.02, 3.4], scale: 1.38, tint: 0xffd8e4 },
      { pos: [-10.6, 0.02, -3.5], scale: 1.28, tint: 0xffe2ec },
      { pos: [11.8, 0.02, 2.4], scale: 1.32, tint: 0xffd2e0 },
      { pos: [11.2, 0.02, -6.5], scale: 1.22, tint: 0xffe0ea },
      { pos: [-3.2, 0.02, 14.2], scale: 1.12, tint: 0xffd8e4 },
      { pos: [4.2, 0.02, 13.8], scale: 1.18, tint: 0xffe4ec },
    ];
    lotusSpecs.forEach((l, idx) => {
      const lotus = buildLotusCluster(l.scale, l.tint, textures, geos, mats);
      lotus.position.set(...l.pos);
      lotus.rotation.y = idx * 0.8;
      scene.add(lotus);
      floatingLotuses.push(lotus);
    });

    // 9. Soft Watercolor Rolling Mountain Horizon
    const karstHorizon = buildKarstHorizon(geos, mats);
    scene.add(karstHorizon);

    // 10. InstancedMesh Ambient Sky Lanterns (36 drifting glowing lanterns)
    const skyLanternCount = 36;
    const skyLanternGeo = new THREE.CylinderGeometry(0.24, 0.16, 0.42, 10);
    geos.push(skyLanternGeo);
    const skyLanternMat = new THREE.MeshStandardMaterial({
      color: 0xffd788,
      emissive: 0xff9333,
      emissiveIntensity: 1.45,
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
      const radius = 9 + (i % 7) * 3.8;
      return {
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        yBase: 2.5 + (i % 9) * 2.2,
        speed: 0.28 + (i % 5) * 0.07,
        phase: i * 1.13,
        scale: 0.72 + (i % 4) * 0.16,
      };
    });
    for (let i = 0; i < skyLanternCount; i++) {
      const s = lanternSeeds[i];
      _dummy.position.set(s.x, s.yBase, s.z);
      _dummy.scale.setScalar(s.scale);
      _dummy.updateMatrix();
      skyLanternInst.setMatrixAt(i, _dummy.matrix);
      _lerpColor.setHex(i % 3 === 0 ? 0xffcf6b : i % 3 === 1 ? 0xff9b54 : 0xffe6a6);
      skyLanternInst.setColorAt(i, _lerpColor);
    }
    skyLanternInst.instanceMatrix.needsUpdate = true;
    if (skyLanternInst.instanceColor) skyLanternInst.instanceColor.needsUpdate = true;
    scene.add(skyLanternInst);

    // 11. InstancedMesh Floating Soft Pink Lotus Petals drifting on the breeze (48 petals)
    const petalCount = 48;
    const petalShape = new THREE.Shape();
    petalShape.moveTo(0, 0);
    petalShape.bezierCurveTo(0.08, 0.07, 0.07, 0.18, 0, 0.24);
    petalShape.bezierCurveTo(-0.07, 0.18, -0.08, 0.07, 0, 0);
    const driftPetalGeo = new THREE.ShapeGeometry(petalShape, 5);
    geos.push(driftPetalGeo);
    const driftPetalMat = new THREE.MeshBasicMaterial({
      color: 0xffb3c8,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
    });
    mats.push(driftPetalMat);
    const driftPetalInst = new THREE.InstancedMesh(driftPetalGeo, driftPetalMat, petalCount);
    driftPetalInst.frustumCulled = false;
    const petalSeeds = Array.from({ length: petalCount }, (_, i) => ({
      x: (((i * 41) % 100) / 100 - 0.5) * 26,
      y: 1.5 + (((i * 67) % 100) / 100) * 11,
      z: (((i * 83) % 100) / 100 - 0.5) * 22,
      phase: i * 0.77,
      speed: 0.32 + (i % 4) * 0.09,
    }));
    scene.add(driftPetalInst);

    // 12. InstancedMesh Golden Shimmer Motes (64 warm motes)
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
      x: (((i * 37) % 100) / 100 - 0.5) * 28,
      y: 0.8 + ((i * 53) % 100) / 100 * 12,
      z: (((i * 71) % 100) / 100 - 0.5) * 26,
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
      const dist = 2.8 + Math.random() * 4.5;
      g.position.set(
        Math.cos(angle) * dist,
        0.55,
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
    };
    window.addEventListener('resize', onResize);

    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let elapsed = 0;

    const flagPosAttr = flagMesh.geometry.attributes.position as THREE.BufferAttribute;
    const flagArr = flagPosAttr.array as Float32Array;
    const flagVertCount = flagPosAttr.count;

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

      // 1. Spawn any queued user wish lanterns
      while (lanternSpawnQueueRef.current > 0) {
        lanternSpawnQueueRef.current -= 1;
        spawnWishLantern();
      }

      // 2. Smooth painterly Dawn ↔ Velvet Night mood & sky dome crossfade
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
      for (let i = 0; i < lanternSilkMats.length; i++) {
        lanternSilkMats[i].emissiveIntensity = THREE.MathUtils.lerp(
          lanternSilkMats[i].emissiveIntensity,
          targetTheme.lanternGlow * musicPulse,
          dampT,
        );
      }
      waterMat.color.lerp(targetTheme.waterColor, dampT);
      textures.waterRippleMap.offset.x = (elapsed * 0.014) % 1;
      textures.waterRippleMap.offset.y = (elapsed * 0.009) % 1;

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

      // 4. Animate waving 3D Vietnamese Flag
      const waveSpeed = musicPlayingRef.current ? 4.4 : 3.2;
      for (let i = 0; i < flagVertCount; i++) {
        const idx = i * 3;
        const rx = flagRestPositions[idx];
        const ry = flagRestPositions[idx + 1];
        const distFromPole = Math.max(0, (rx - 0.06) / 3.35);
        const amp = Math.pow(distFromPole, 1.25) * 0.25;
        const waveZ =
          Math.sin(distFromPole * 5.6 - elapsed * waveSpeed + ry * 0.45) * amp +
          Math.sin(distFromPole * 9.0 - elapsed * (waveSpeed * 1.45)) * amp * 0.28;
        const droopY = -distFromPole * distFromPole * 0.07;
        flagArr[idx] = rx;
        flagArr[idx + 1] = ry + droopY;
        flagArr[idx + 2] = waveZ;
      }
      flagPosAttr.needsUpdate = true;

      // 5. Gentle floating bob on lotus blossoms
      for (let i = 0; i < floatingLotuses.length; i++) {
        const lotus = floatingLotuses[i];
        lotus.position.y = 0.02 + Math.sin(elapsed * 1.25 + i * 0.9) * 0.028;
        lotus.rotation.z = Math.sin(elapsed * 0.85 + i) * 0.025;
      }

      // 6. Rising festive sky lanterns
      for (let i = 0; i < skyLanternCount; i++) {
        const s = lanternSeeds[i];
        const yLoop = ((s.yBase + elapsed * s.speed) % 20) + 1.8;
        const swayX = s.x + Math.sin(elapsed * 0.65 + s.phase) * 0.65;
        const swayZ = s.z + Math.cos(elapsed * 0.55 + s.phase) * 0.55;
        _dummy.position.set(swayX, yLoop, swayZ);
        _dummy.rotation.set(0, elapsed * 0.2 + s.phase, Math.sin(elapsed + s.phase) * 0.06);
        _dummy.scale.setScalar(s.scale);
        _dummy.updateMatrix();
        skyLanternInst.setMatrixAt(i, _dummy.matrix);
      }
      skyLanternInst.instanceMatrix.needsUpdate = true;

      // 7. Softly drifting pink lotus petals
      for (let i = 0; i < petalCount; i++) {
        const p = petalSeeds[i];
        const yFall = 12 - ((elapsed * p.speed + p.phase * 1.8) % 11.2);
        const xDrift = p.x + Math.sin(elapsed * 0.85 + p.phase) * 1.3;
        const zDrift = p.z + Math.cos(elapsed * 0.72 + p.phase) * 1.1;
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

      // 8. Shimmering golden particles
      for (let i = 0; i < moteCount; i++) {
        const m = moteSeeds[i];
        const y = ((m.y + elapsed * m.speed) % 13) + 0.6;
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

      // 9. Animate user-released wish lanterns
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

      renderer.render(scene, camera);

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
        className="fixed inset-0 flex items-center justify-center bg-[#f8ead8] text-[#2b1815] p-6"
      >
        <div className="max-w-lg border border-[#d6b98c] bg-[#fdf8f0] p-8 text-center">
          <p className="text-sm font-semibold text-[#b91c1c]">24 · 11 · Ngày Văn Hóa Việt Nam</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-[#2b1815]">
            Văn hóa còn thì dân tộc còn, văn hóa mất thì dân tộc mất
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#5c4338]">
            Trình duyệt hiện chưa bật tăng tốc đồ họa WebGL để hiển thị không gian 3D Khuê Văn Các
            và Cột Cờ Hà Nội. Bạn vẫn có thể nghe lời mở đầu, nhạc nền và tạo thiệp chia sẻ.
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
      aria-label="Không gian 3D tương tác Khuê Văn Các, Cột Cờ Hà Nội, Cầu Thê Húc và Đầm Sen Ngày Văn Hóa Việt Nam 24-11"
    />
  );
}
