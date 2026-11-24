import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { VignetteShader } from 'three/addons/shaders/VignetteShader.js';
import type { CameraPresetId, SceneMood } from '../utils/greetingLink';
import {
  type DirectorRevealWeights,
  evaluateDirectorAtTime,
  evaluateDirectorReveals,
} from '../utils/cinematicDirector';
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
  buildKoiFish,
  buildLacBird,
  buildLotusCluster,
  buildLotusSampan,
  buildLyDynastyDragon,
  buildOnePillarPagoda,
  buildShorelineRockAndReeds,
  buildTheHucBridge,
  buildVietnameseFluteKite,
  buildVolumetricClouds,
  buildVolumetricSunbeams,
} from './builders';

interface HeritageSceneProps {
  mood: SceneMood;
  cameraPreset: CameraPresetId;
  cameraPresetNonce: number;
  releaseLanternNonce: number;
  introBurstNonce?: number;
  isScrollIntro?: boolean;
  isMusicPlaying: boolean;
  lanternCount: number;
  isDirectorMode: boolean;
  directorShowTime: number;
  isVerticalFrame: boolean;
  onUserInteractCamera?: () => void;
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
    fogDensity: 0.0084,
    keyColor: new THREE.Color(0xffdba8),
    keyIntensity: 2.65,
    hemiSky: new THREE.Color(0x9ec0d8),
    hemiGround: new THREE.Color(0x8a6144),
    hemiIntensity: 0.72,
    rimColor: new THREE.Color(0xffb56b),
    rimIntensity: 1.08,
    lanternPointIntensity: 2.8,
    pavilionGlow: 1.05,
    lanternGlow: 0.85,
    waterColor: new THREE.Color(0x1d6268),
    envIntensity: 0.54,
    waterShimmerOpacity: 0.16,
    exposure: 1.02,
    sunsetBlend: 0.0,
    nightBlend: 0.0,
    bloomStrength: 0.25,
    sunbeamOpacity: 0.14,
    sunbeamColor: new THREE.Color(0xffe2a6),
    fireflyOpacity: 0.0,
    waterSparkleColor: new THREE.Color(0xffe9be),
    waterSparkleStrength: 0.58,
    waterDeepColor: new THREE.Color(0x103c49),
    waterSkyHorizon: new THREE.Color(0xf4cfa8),
    cloudBaseColor: new THREE.Color(0xc9a399),
    cloudLitColor: new THREE.Color(0xfff3e0),
    cloudRimColor: new THREE.Color(0xffd28b),
    cloudOpacity: 0.56,
  },
  sunset: {
    fogColor: new THREE.Color(0xc76e54),
    fogDensity: 0.0094,
    keyColor: new THREE.Color(0xff9a52),
    keyIntensity: 2.48,
    hemiSky: new THREE.Color(0x9a5f84),
    hemiGround: new THREE.Color(0x7c3e2c),
    hemiIntensity: 0.68,
    rimColor: new THREE.Color(0xff7d44),
    rimIntensity: 1.6,
    lanternPointIntensity: 8.6,
    pavilionGlow: 1.92,
    lanternGlow: 1.75,
    waterColor: new THREE.Color(0x2d354a),
    envIntensity: 0.34,
    waterShimmerOpacity: 0.42,
    exposure: 1.04,
    sunsetBlend: 1.0,
    nightBlend: 0.0,
    bloomStrength: 0.36,
    sunbeamOpacity: 0.23,
    sunbeamColor: new THREE.Color(0xffaa5c),
    fireflyOpacity: 0.56,
    waterSparkleColor: new THREE.Color(0xffc272),
    waterSparkleStrength: 0.88,
    waterDeepColor: new THREE.Color(0x1c1e34),
    waterSkyHorizon: new THREE.Color(0xeb8458),
    cloudBaseColor: new THREE.Color(0x6e3a4b),
    cloudLitColor: new THREE.Color(0xffb474),
    cloudRimColor: new THREE.Color(0xff8a46),
    cloudOpacity: 0.62,
  },
  night: {
    fogColor: new THREE.Color(0x181024),
    fogDensity: 0.011,
    keyColor: new THREE.Color(0x9cb4e8),
    keyIntensity: 0.62,
    hemiSky: new THREE.Color(0x3a3668),
    hemiGround: new THREE.Color(0x4f2124),
    hemiIntensity: 0.52,
    rimColor: new THREE.Color(0xff9c4a),
    rimIntensity: 1.48,
    lanternPointIntensity: 15.8,
    pavilionGlow: 2.85,
    lanternGlow: 2.55,
    waterColor: new THREE.Color(0x0b182b),
    envIntensity: 0.16,
    waterShimmerOpacity: 0.58,
    exposure: 1.01,
    sunsetBlend: 0.0,
    nightBlend: 1.0,
    bloomStrength: 0.46,
    sunbeamOpacity: 0.0,
    sunbeamColor: new THREE.Color(0xffc478),
    fireflyOpacity: 0.96,
    waterSparkleColor: new THREE.Color(0xffd27a),
    waterSparkleStrength: 0.64,
    waterDeepColor: new THREE.Color(0x050b18),
    waterSkyHorizon: new THREE.Color(0x2d2448),
    cloudBaseColor: new THREE.Color(0x13132b),
    cloudLitColor: new THREE.Color(0x363b6b),
    cloudRimColor: new THREE.Color(0x9cb8f0),
    cloudOpacity: 0.44,
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
  baseScale: number;
}

interface SwimmingKoi {
  group: THREE.Group;
  tailPivot: THREE.Group;
  centerX: number;
  centerZ: number;
  radiusX: number;
  radiusZ: number;
  speed: number;
  angleOffset: number;
  baseScale: number;
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
  introBurstNonce = 0,
  isScrollIntro = false,
  isMusicPlaying,
  lanternCount,
  isDirectorMode,
  directorShowTime,
  isVerticalFrame,
  onUserInteractCamera,
}: HeritageSceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  const moodRef = useRef<SceneMood>(mood);
  const musicPlayingRef = useRef<boolean>(isMusicPlaying);
  const directorModeRef = useRef<boolean>(isDirectorMode);
  const directorTimeRef = useRef<number>(directorShowTime);
  const verticalFrameRef = useRef<boolean>(isVerticalFrame);
  const scrollIntroRef = useRef<boolean>(isScrollIntro);
  const onUserInteractRef = useRef(onUserInteractCamera);
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
  const introBurstQueueRef = useRef<number>(0);
  const lastIntroBurstNonceRef = useRef<number>(introBurstNonce);

  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  useEffect(() => {
    musicPlayingRef.current = isMusicPlaying;
  }, [isMusicPlaying]);

  useEffect(() => {
    directorModeRef.current = isDirectorMode;
    if (isDirectorMode) {
      cameraRequestRef.current.active = false;
    }
  }, [isDirectorMode]);

  useEffect(() => {
    directorTimeRef.current = directorShowTime;
  }, [directorShowTime]);

  useEffect(() => {
    verticalFrameRef.current = isVerticalFrame;
  }, [isVerticalFrame]);

  useEffect(() => {
    scrollIntroRef.current = isScrollIntro;
  }, [isScrollIntro]);

  useEffect(() => {
    onUserInteractRef.current = onUserInteractCamera;
  }, [onUserInteractCamera]);

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
    if (introBurstNonce !== lastIntroBurstNonceRef.current) {
      lastIntroBurstNonceRef.current = introBurstNonce;
      introBurstQueueRef.current += 1;
    }
  }, [introBurstNonce]);

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
    renderer.toneMapping = THREE.AgXToneMapping;
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
      if (directorModeRef.current && onUserInteractRef.current) {
        onUserInteractRef.current();
      }
    };
    controls.addEventListener('start', onControlStart);

    // Optional GPU-only Post-Processing (subtle golden bloom + cinema vignette)
    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    if (!isSoftwareGl) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        initialTheme.bloomStrength,
        0.52,
        0.84,
      );
      composer.addPass(bloomPass);
      const vignettePass = new ShaderPass(VignetteShader);
      vignettePass.uniforms['offset'].value = 1.02;
      vignettePass.uniforms['darkness'].value = 0.72;
      composer.addPass(vignettePass);
      composer.addPass(new OutputPass());
    }

    // Sculpted Warm/Cool 3-Point Golden-Hour Heritage Lighting Rig
    const keyLight = new THREE.DirectionalLight(
      initialTheme.keyColor,
      initialTheme.keyIntensity,
    );
    keyLight.position.set(22, 17, 13);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(2048, 2048);
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

    // 0. Painterly 3-Act Sky Domes: Golden-Hour Dawn · Imperial Sunset (Hoàng Hôn) · Harvest-Moon Festival Night
    const skyDawnGeo = new THREE.SphereGeometry(128, 32, 20);
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

    const skySunsetGeo = new THREE.SphereGeometry(125, 32, 20);
    geos.push(skySunsetGeo);
    const skySunsetMat = new THREE.MeshBasicMaterial({
      map: textures.skySunsetMap,
      side: THREE.BackSide,
      fog: false,
      transparent: true,
      opacity: initialTheme.sunsetBlend,
      depthWrite: false,
    });
    mats.push(skySunsetMat);
    const skySunsetMesh = new THREE.Mesh(skySunsetGeo, skySunsetMat);
    skySunsetMesh.rotation.y = Math.PI * 0.5;
    skySunsetMesh.renderOrder = -19;
    scene.add(skySunsetMesh);

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
    skyNightMesh.renderOrder = -18;
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
    starField.renderOrder = -17;
    scene.add(starField);

    // 1. Real-Time Mirror Lake (Planar Reflector on GPU + 4-Octave Gerstner / Beer-Lambert / Fresnel Water Shader)
    let lakeReflector: Reflector | null = null;
    if (!isSoftwareGl) {
      const reflectorGeo = new THREE.CircleGeometry(74, 48);
      geos.push(reflectorGeo);
      lakeReflector = new Reflector(reflectorGeo, {
        clipBias: 0.003,
        textureWidth: 512,
        textureHeight: 512,
        color: 0x8ea4ae,
      });
      lakeReflector.rotation.x = -Math.PI / 2;
      lakeReflector.position.y = -0.014;
      scene.add(lakeReflector);
    }

    const waterGeo = new THREE.CircleGeometry(96, 64);
    waterGeo.rotateX(-Math.PI / 2);
    geos.push(waterGeo);
    const waterUniforms = {
      uWaterTime: { value: 0 },
      uWaterSparkleColor: { value: initialTheme.waterSparkleColor.clone() },
      uWaterSparkleStrength: { value: initialTheme.waterSparkleStrength },
      uWaterDeepColor: { value: initialTheme.waterDeepColor.clone() },
      uWaterSkyHorizon: { value: initialTheme.waterSkyHorizon.clone() },
    };
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: initialTheme.waterColor.clone(),
      bumpMap: textures.waterRippleMap,
      bumpScale: 0.065,
      roughness: 0.14,
      metalness: 0.18,
      clearcoat: 0.65,
      clearcoatRoughness: 0.12,
      transparent: !isSoftwareGl,
      opacity: isSoftwareGl ? 1.0 : 0.68,
    });
    waterMat.onBeforeCompile = (shader) => {
      shader.uniforms.uWaterTime = waterUniforms.uWaterTime;
      shader.uniforms.uWaterSparkleColor = waterUniforms.uWaterSparkleColor;
      shader.uniforms.uWaterSparkleStrength = waterUniforms.uWaterSparkleStrength;
      shader.uniforms.uWaterDeepColor = waterUniforms.uWaterDeepColor;
      shader.uniforms.uWaterSkyHorizon = waterUniforms.uWaterSkyHorizon;

      shader.vertexShader =
        'varying vec3 vLakeWorldPos;\n' +
        shader.vertexShader.replace(
          '#include <begin_vertex>',
          `
          #include <begin_vertex>
          vLakeWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
          `,
        );

      shader.fragmentShader =
        `
        uniform float uWaterTime;
        uniform vec3 uWaterSparkleColor;
        uniform float uWaterSparkleStrength;
        uniform vec3 uWaterDeepColor;
        uniform vec3 uWaterSkyHorizon;
        varying vec3 vLakeWorldPos;
        ` +
        shader.fragmentShader.replace(
          '#include <dithering_fragment>',
          `
          vec2 wp = vLakeWorldPos.xz;
          float dist = length(wp);
          // 4-octave anisotropic Gerstner-inspired lake ripples
          float warp = sin(wp.x * 0.20 + wp.y * 0.34 + uWaterTime * 0.42) * 1.45;
          float w1 = sin(wp.y * 2.55 + warp + uWaterTime * 1.28);
          float w2 = sin((wp.y * 3.95 - wp.x * 0.46) - uWaterTime * 1.08);
          float w3 = sin((wp.y * 5.45 + wp.x * 0.62) + uWaterTime * 1.58);
          float w4 = sin((wp.y * 7.80 - wp.x * 0.92) + uWaterTime * 1.92);
          float waveMix = w1 * 0.40 + w2 * 0.30 + w3 * 0.18 + w4 * 0.12;
          float crest = pow(max(0.0, waveMix * 0.5 + 0.5), 9.5);

          // Beer-Lambert radial depth absorption: shallow jade rim near island -> deep mirror sapphire lake
          float depthBlend = smoothstep(12.2, 34.0, dist);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, uWaterDeepColor, depthBlend * 0.58);

          // Schlick Fresnel grazing sky mirror reflection so lake melts into horizon mountains
          float viewY = max(0.0, normalize(cameraPosition - vLakeWorldPos).y);
          float fresnel = 0.04 + 0.96 * pow(1.0 - viewY, 4.0);
          float horizonReflect = fresnel * smoothstep(10.0, 56.0, dist) * 0.62;
          gl_FragColor.rgb = mix(gl_FragColor.rgb, uWaterSkyHorizon, horizonReflect);

          // Luminous directional sun/moon reflection column aligned with the sanctuary axis
          float sunColumn = exp(-pow(wp.x * 0.066, 2.0)) * smoothstep(32.0, -32.0, wp.y);
          float gentleRipple = pow(max(0.0, (w1 + w2) * 0.25 + 0.5), 5.0) * 0.16;
          float distFade = exp(-dist * 0.015);
          float shimmer = (crest * (0.28 + sunColumn * 1.48) + gentleRipple * sunColumn + fresnel * 0.26) * distFade * uWaterSparkleStrength;
          gl_FragColor.rgb += uWaterSparkleColor * shimmer;
          #include <dithering_fragment>
          `,
        );
    };
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

    // Grand Sunken Đông Sơn Bronze Drum Courtyard Medallion (upgraded brushed bronze PBR clearcoat)
    const drumGeo = new THREE.CylinderGeometry(5.35, 5.48, 0.07, 64);
    geos.push(drumGeo);
    const drumMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: textures.dongSonMap,
      bumpMap: textures.dongSonBump,
      bumpScale: 0.09,
      roughness: 0.31,
      metalness: 0.82,
      clearcoat: 0.36,
      clearcoatRoughness: 0.24,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    mats.push(drumMat);
    const drumPlaza = new THREE.Mesh(drumGeo, drumMat);
    drumPlaza.position.set(0.9, 0.37, 3.25);
    drumPlaza.receiveShadow = true;
    scene.add(drumPlaza);

    // Soft radial contact shadow grounding discs so key terrace monuments seat crisply on the courtyard
    const contactShadowGeo = new THREE.PlaneGeometry(1, 1);
    contactShadowGeo.rotateX(-Math.PI / 2);
    geos.push(contactShadowGeo);
    const contactShadowMat = new THREE.MeshBasicMaterial({
      map: textures.contactShadowMap,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    mats.push(contactShadowMat);
    const addGroundContactShadow = (x: number, z: number, sx: number, sz: number) => {
      const m = new THREE.Mesh(contactShadowGeo, contactShadowMat);
      m.position.set(x, 0.378, z);
      m.scale.set(sx, 1, sz);
      scene.add(m);
      return m;
    };
    const pavilionShadow = addGroundContactShadow(-0.8, -1.6, 8.2, 8.2);
    const flagTowerShadow = addGroundContactShadow(7.4, -2.5, 6.2, 6.2);
    const leftDrumShadow = addGroundContactShadow(-4.35, 1.9, 2.3, 2.3);
    const rightDrumShadow = addGroundContactShadow(2.85, 1.9, 2.3, 2.3);
    addGroundContactShadow(-5.0, 5.2, 3.4, 2.6);
    const peachShadow = addGroundContactShadow(-7.6, -2.4, 3.2, 3.2);
    const apricotShadow = addGroundContactShadow(8.6, 3.6, 3.2, 3.2);

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
    const festivalFlagGroups: THREE.Group[] = [];
    festivalFlagSpecs.forEach((f) => {
      const { group: fg, flagItem } = buildFestivalFlagPole(textures, geos, mats, f.phase);
      fg.position.set(...f.pos);
      fg.rotation.y = f.rotY;
      scene.add(fg);
      festivalFlagGroups.push(fg);
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
    const bambooGroves: THREE.Group[] = [];
    bambooSpecs.forEach((b) => {
      const grove = buildBambooGrove(b.scale, geos, mats);
      grove.position.set(...b.pos);
      grove.rotation.y = b.rotY;
      scene.add(grove);
      bambooGroves.push(grove);
    });

    // 9. Hội An Silk Lantern Poles framing the ceremonial courtyard
    const lanternSilkMats: THREE.MeshStandardMaterial[] = [bridgeLanternMat];
    const lanternPoleGroups: THREE.Group[] = [];
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
      lanternPoleGroups.push(poleGroup);
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

    // 12. Layered Tràng An / Hạ Long Limestone Karst Mountains + Drifting Mist Bands + Volumetric FBM Cloud Banks
    const { group: karstHorizon, mistPlanes } = buildKarstHorizon(textures, geos, mats);
    scene.add(karstHorizon);

    const {
      group: volumetricCloudsGroup,
      shaderMat: volumetricCloudsMat,
      cloudPlanes,
    } = buildVolumetricClouds(geos, mats);
    scene.add(volumetricCloudsGroup);

    // 12B. Celestial Sky Cultural Tableau: Volumetric Sunbeams + Vầng Hào Quang 54 Dân Tộc + 360° Dải Lụa Thổ Cẩm + Rồng Thời Lý + Diều Sáo
    const { group: sunbeamGroup, shaderMat: sunbeamMat } = buildVolumetricSunbeams(geos, mats);
    scene.add(sunbeamGroup);

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

    // Iconic Soaring Vietnamese Rồng Thời Lý (Lý Dynasty Dragon) + Golden Stardust Wake Trail
    const {
      group: lyDragon,
      segments: dragonSegments,
      pearl: dragonPearl,
      pearlGlowMat: dragonPearlMat,
    } = buildLyDynastyDragon(geos, mats);
    scene.add(lyDragon);
    const _dragonLookTarget = new THREE.Vector3();

    const dragonTrailCount = 48;
    const dragonTrailPos = new Float32Array(dragonTrailCount * 3);
    const dragonTrailCol = new Float32Array(dragonTrailCount * 3);
    const dragonTrailGeo = new THREE.BufferGeometry();
    dragonTrailGeo.setAttribute('position', new THREE.BufferAttribute(dragonTrailPos, 3));
    dragonTrailGeo.setAttribute('color', new THREE.BufferAttribute(dragonTrailCol, 3));
    geos.push(dragonTrailGeo);
    const dragonTrailMat = new THREE.PointsMaterial({
      size: 0.72,
      map: textures.sparkMap,
      vertexColors: true,
      transparent: true,
      opacity: 0.86,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    mats.push(dragonTrailMat);
    const dragonTrailPoints = new THREE.Points(dragonTrailGeo, dragonTrailMat);
    dragonTrailPoints.renderOrder = 4;
    dragonTrailPoints.frustumCulled = false;
    scene.add(dragonTrailPoints);

    // 12D. Living Pond Koi Fish (8 Cá Chép Đỏ - Vàng) + Concentric Lake Ripples
    const swimmingKoi: SwimmingKoi[] = [];
    const koiSpecs: Array<{
      variant: 'gold' | 'vermilion' | 'calico';
      cx: number;
      cz: number;
      rx: number;
      rz: number;
      speed: number;
      offset: number;
      scale: number;
    }> = [
      { variant: 'gold', cx: -8.6, cz: 7.4, rx: 2.3, rz: 1.7, speed: 0.42, offset: 0.0, scale: 1.05 },
      { variant: 'vermilion', cx: -8.6, cz: 7.4, rx: 1.8, rz: 1.4, speed: 0.46, offset: 2.1, scale: 0.92 },
      { variant: 'calico', cx: -11.4, cz: 2.4, rx: 2.6, rz: 2.0, speed: 0.36, offset: 4.0, scale: 1.0 },
      { variant: 'gold', cx: -11.4, cz: 2.4, rx: 2.1, rz: 1.6, speed: 0.4, offset: 1.2, scale: 0.88 },
      { variant: 'vermilion', cx: 6.4, cz: 10.6, rx: 2.4, rz: 1.6, speed: 0.38, offset: 0.8, scale: 1.02 },
      { variant: 'calico', cx: 6.4, cz: 10.6, rx: 1.7, rz: 1.3, speed: 0.44, offset: 3.4, scale: 0.9 },
      { variant: 'gold', cx: -3.2, cz: 12.2, rx: 2.2, rz: 1.4, speed: 0.35, offset: 5.0, scale: 0.96 },
      { variant: 'vermilion', cx: 10.2, cz: 5.2, rx: 2.0, rz: 1.8, speed: 0.41, offset: 2.8, scale: 0.94 },
    ];
    koiSpecs.forEach((ks) => {
      const { group: kg, tailPivot } = buildKoiFish(ks.variant, geos, mats);
      const baseScale = ks.scale * 1.24;
      kg.scale.setScalar(baseScale);
      scene.add(kg);
      swimmingKoi.push({
        group: kg,
        tailPivot,
        centerX: ks.cx,
        centerZ: ks.cz,
        radiusX: ks.rx,
        radiusZ: ks.rz,
        speed: ks.speed,
        angleOffset: ks.offset,
        baseScale,
      });
    });

    // Expanding concentric lake ripple rings around lotus beds & Koi fish
    const rippleRingGeo = new THREE.PlaneGeometry(1.6, 1.6);
    rippleRingGeo.rotateX(-Math.PI / 2);
    geos.push(rippleRingGeo);
    const rippleRings: Array<{ mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; cx: number; cz: number; phase: number }> = [];
    const rippleCenters: Array<[number, number]> = [
      [-8.6, 7.4],
      [-11.2, 2.2],
      [-5.6, 10.8],
      [6.2, 10.4],
      [9.8, 5.4],
      [-12.2, -2.0],
      [2.6, 12.6],
      [-2.8, 12.2],
    ];
    rippleCenters.forEach(([rx, rz], idx) => {
      const mat = new THREE.MeshBasicMaterial({
        map: textures.waterRippleRingMap,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      mats.push(mat);
      const mesh = new THREE.Mesh(rippleRingGeo, mat);
      mesh.position.set(rx, 0.022, rz);
      scene.add(mesh);
      rippleRings.push({ mesh, mat, cx: rx, cz: rz, phase: idx * 0.78 });
    });

    // 12E. Enchanted Sunset & Night Festival Fireflies (42 Đom Đóm Đêm Lễ Hội)
    const fireflyCount = 42;
    const fireflyPos = new Float32Array(fireflyCount * 3);
    const fireflyCol = new Float32Array(fireflyCount * 3);
    const fireflySeeds = Array.from({ length: fireflyCount }, (_, i) => {
      const a = (i / fireflyCount) * Math.PI * 2 + (i % 5) * 0.21;
      const r = 4.6 + (i % 7) * 1.45;
      return {
        bx: Math.cos(a) * r + 0.5,
        by: 0.95 + (i % 6) * 0.72,
        bz: Math.sin(a) * r + 0.4,
        phase: i * 1.37,
        speed: 0.75 + (i % 4) * 0.22,
      };
    });
    const fireflyGeo = new THREE.BufferGeometry();
    fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPos, 3));
    fireflyGeo.setAttribute('color', new THREE.BufferAttribute(fireflyCol, 3));
    geos.push(fireflyGeo);
    const fireflyMat = new THREE.PointsMaterial({
      size: 0.62,
      map: textures.sparkMap,
      vertexColors: true,
      transparent: true,
      opacity: initialTheme.fireflyOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    mats.push(fireflyMat);
    const fireflyPoints = new THREE.Points(fireflyGeo, fireflyMat);
    fireflyPoints.renderOrder = 4;
    fireflyPoints.frustumCulled = false;
    scene.add(fireflyPoints);

    const fluteKites: Array<{
      group: THREE.Group;
      tails: THREE.Mesh[];
      basePos: [number, number, number];
      baseScale: number;
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
      fluteKites.push({ group: kg, tails, basePos: ks.pos, baseScale: ks.scale, phase: ks.phase });
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
      const baseScale = 0.92 + (i % 3) * 0.15;
      bg.scale.setScalar(baseScale);
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
        baseScale,
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
      const targetBaseFov = nextAspect < 0.85 ? 60 : 44;
      if (!directorModeRef.current) {
        camera.fov = targetBaseFov;
      }
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
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
    if (resizeObserver) {
      resizeObserver.observe(container);
    }

    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let elapsed = 0;
    let lastClimaxBurstTime = -10;
    let introCelebrationTimer = 0;
    let prevDirectorActive = directorModeRef.current;
    const liveReveals: DirectorRevealWeights = evaluateDirectorReveals(
      directorTimeRef.current,
      directorModeRef.current,
    );

    const applyRiseReveal = (
      obj: THREE.Object3D,
      baseY: number,
      weight: number,
      baseScale = 1,
      dropY = 1.6,
    ) => {
      if (weight <= 0.005) {
        obj.visible = false;
        return;
      }
      obj.visible = true;
      obj.scale.setScalar(baseScale * (0.04 + 0.96 * weight));
      obj.position.y = baseY - (1 - weight) * dropY;
    };

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

      // 0. Celebratory sky salvo when the Imperial Scroll shatters into fireworks!
      if (introBurstQueueRef.current > 0) {
        introBurstQueueRef.current = 0;
        introCelebrationTimer = 4.2;
        const salvoAnchors: Array<[number, number, number]> = [
          [-10.5, 13.8, -11.0],
          [10.8, 14.2, -11.4],
          [0.0, 15.8, -12.6],
          [-6.2, 12.2, -9.8],
          [6.4, 12.6, -9.8],
        ];
        for (let b = 0; b < fwBurstCount; b++) {
          resetFireworkBurst(b, salvoAnchors[b % salvoAnchors.length]);
          fwBursts[b].age = b * 0.06;
        }
      }
      if (introCelebrationTimer > 0) {
        introCelebrationTimer = Math.max(0, introCelebrationTimer - dt);
      }

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

      // 2. Smooth 3-Act Atmosphere Crossfade: Bình Minh ↔ Hoàng Hôn ↔ Đêm Hoa Đăng
      const targetTheme = MOOD_THEMES[moodRef.current];
      const dampT = 1 - Math.exp(-5.5 * transitionDt);

      (scene.background as THREE.Color).lerp(targetTheme.fogColor, dampT);
      const fog = scene.fog as THREE.FogExp2;
      fog.color.lerp(targetTheme.fogColor, dampT);
      fog.density = THREE.MathUtils.lerp(fog.density, targetTheme.fogDensity, dampT);
      skySunsetMat.opacity = THREE.MathUtils.lerp(
        skySunsetMat.opacity,
        targetTheme.sunsetBlend,
        dampT,
      );
      skyNightMat.opacity = THREE.MathUtils.lerp(
        skyNightMat.opacity,
        targetTheme.nightBlend,
        dampT,
      );
      starMat.opacity = THREE.MathUtils.lerp(
        starMat.opacity,
        targetTheme.nightBlend * 0.92,
        dampT,
      );
      scene.environmentIntensity = THREE.MathUtils.lerp(
        scene.environmentIntensity,
        targetTheme.envIntensity,
        dampT,
      );

      // Progressive 3D reveals: 100% immediate in Normal Mode, lyric-synced gradual manifestation in Director Mode
      const targetReveals = evaluateDirectorReveals(
        directorTimeRef.current,
        directorModeRef.current,
      );
      const justEnteredDirector = directorModeRef.current && !prevDirectorActive;
      prevDirectorActive = directorModeRef.current;
      const revealDamp = justEnteredDirector ? 1 : 1 - Math.exp(-5.0 * transitionDt);
      (Object.keys(liveReveals) as Array<keyof DirectorRevealWeights>).forEach((key) => {
        liveReveals[key] = THREE.MathUtils.lerp(liveReveals[key], targetReveals[key], revealDamp);
      });

      // Stage architectural & floral reveals cleanly (+ contact shadows synced to each monument)
      applyRiseReveal(pavilion, 0.36, liveReveals.pavilion, 1, 2.2);
      pavilionShadow.visible = liveReveals.pavilion > 0.05;
      applyRiseReveal(leftDrum, 0.36, liveReveals.pavilion, 1, 0.9);
      leftDrumShadow.visible = liveReveals.pavilion > 0.05;
      applyRiseReveal(rightDrum, 0.36, liveReveals.pavilion, 1, 0.9);
      rightDrumShadow.visible = liveReveals.pavilion > 0.05;
      applyRiseReveal(theHucBridge, 0.02, liveReveals.lakeLife, 1, 1.0);
      for (let i = 0; i < lanternPoleGroups.length; i++) {
        applyRiseReveal(lanternPoleGroups[i], 0.36, liveReveals.lakeLife, 1, 1.4);
      }
      applyRiseReveal(onePillarPagoda, 0.0, liveReveals.floraPagoda, 1, 2.0);
      applyRiseReveal(peachTree, 0.34, liveReveals.floraPagoda, 1, 1.4);
      peachShadow.visible = liveReveals.floraPagoda > 0.05;
      applyRiseReveal(apricotTree, 0.34, liveReveals.floraPagoda, 1, 1.4);
      apricotShadow.visible = liveReveals.floraPagoda > 0.05;
      for (let i = 0; i < bambooGroves.length; i++) {
        applyRiseReveal(bambooGroves[i], 0.34, liveReveals.floraPagoda, 1, 1.2);
      }
      applyRiseReveal(flagTower, 0.36, liveReveals.flags, 1, 2.6);
      flagTowerShadow.visible = liveReveals.flags > 0.05;
      for (let i = 0; i < festivalFlagGroups.length; i++) {
        applyRiseReveal(festivalFlagGroups[i], 0.36, liveReveals.flags, 1, 1.8);
      }

      // Update Volumetric FBM Cloud Banks across Dawn -> Sunset -> Night
      volumetricCloudsMat.uniforms.uTime.value = elapsed;
      (volumetricCloudsMat.uniforms.uBaseColor.value as THREE.Color).lerp(
        targetTheme.cloudBaseColor,
        dampT,
      );
      (volumetricCloudsMat.uniforms.uLitColor.value as THREE.Color).lerp(
        targetTheme.cloudLitColor,
        dampT,
      );
      (volumetricCloudsMat.uniforms.uRimColor.value as THREE.Color).lerp(
        targetTheme.cloudRimColor,
        dampT,
      );
      volumetricCloudsMat.uniforms.uOpacity.value = THREE.MathUtils.lerp(
        volumetricCloudsMat.uniforms.uOpacity.value,
        targetTheme.cloudOpacity,
        dampT,
      );
      for (let i = 0; i < cloudPlanes.length; i++) {
        const cp = cloudPlanes[i];
        cp.mesh.position.x = cp.baseX + Math.sin(elapsed * cp.speed + cp.phase) * 2.2;
        cp.mesh.position.y = cp.baseY + Math.cos(elapsed * cp.speed * 0.7 + cp.phase) * 0.45;
      }

      // Update GLSL Volumetric Sunbeams & Mirror Water Shader uniforms
      sunbeamGroup.visible = liveReveals.pavilion > 0.01;
      sunbeamMat.uniforms.uTime.value = elapsed;
      sunbeamMat.uniforms.uOpacity.value = THREE.MathUtils.lerp(
        sunbeamMat.uniforms.uOpacity.value,
        targetTheme.sunbeamOpacity * liveReveals.pavilion,
        dampT,
      );
      (sunbeamMat.uniforms.uColor.value as THREE.Color).lerp(targetTheme.sunbeamColor, dampT);

      waterUniforms.uWaterTime.value = elapsed;
      waterUniforms.uWaterSparkleColor.value.lerp(targetTheme.waterSparkleColor, dampT);
      waterUniforms.uWaterSparkleStrength.value = THREE.MathUtils.lerp(
        waterUniforms.uWaterSparkleStrength.value,
        targetTheme.waterSparkleStrength,
        dampT,
      );
      waterUniforms.uWaterDeepColor.value.lerp(targetTheme.waterDeepColor, dampT);
      waterUniforms.uWaterSkyHorizon.value.lerp(targetTheme.waterSkyHorizon, dampT);

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
        (moodRef.current === 'night' ? 2.55 : moodRef.current === 'sunset' ? 1.85 : 1.1) * musicPulse,
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

      // 3. Camera Choreography: Serene Scroll-Intro Glide OR 4-Act Director Mode OR Smooth Preset Transitions
      if (scrollIntroRef.current) {
        const sway = Math.sin(elapsed * 0.16) * 3.8;
        _targetCamPos.set(sway, 9.6 + Math.sin(elapsed * 0.22) * 0.45, 31.4);
        _targetLookAt.set(-0.4, 5.2, -4.0);
        const introDamp = 1 - Math.exp(-2.2 * transitionDt);
        camera.position.lerp(_targetCamPos, introDamp);
        controls.target.lerp(_targetLookAt, introDamp);
      } else if (directorModeRef.current) {
        const sample = evaluateDirectorAtTime(directorTimeRef.current);
        _targetCamPos.set(...sample.position);
        _targetLookAt.set(...sample.target);
        const dirDamp = 1 - Math.exp(-3.2 * transitionDt);
        camera.position.lerp(_targetCamPos, dirDamp);
        controls.target.lerp(_targetLookAt, dirDamp);

        const desiredFov =
          (camera.aspect < 0.85 || verticalFrameRef.current ? sample.fov + 15 : sample.fov);
        if (Math.abs(camera.fov - desiredFov) > 0.05) {
          camera.fov = THREE.MathUtils.lerp(camera.fov, desiredFov, dirDamp);
          camera.updateProjectionMatrix();
        }

        // During chorus climax windows, automatically launch celebratory lanterns & extra fireworks
        if (sample.isClimax && elapsed - lastClimaxBurstTime > 3.2) {
          lastClimaxBurstTime = elapsed;
          spawnWishLantern();
          if (moodRef.current === 'night') {
            resetFireworkBurst(Math.floor(Math.random() * fwBurstCount), [
              (Math.random() - 0.5) * 20,
              14.0 + Math.random() * 2.5,
              -13.2,
            ]);
          }
        }
      } else if (cameraRequestRef.current.active) {
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

      // 5. Gentle lake rock on Sampan boat & lotus clusters (synced with lakeLife reveal)
      sampan.visible = liveReveals.lakeLife > 0.01;
      if (sampan.visible) {
        sampan.scale.setScalar(0.04 + 0.96 * liveReveals.lakeLife);
        sampan.position.y =
          0.04 + Math.sin(elapsed * 1.1) * 0.04 - (1 - liveReveals.lakeLife) * 0.6;
        sampan.rotation.z = Math.sin(elapsed * 0.95) * 0.038;
        sampan.rotation.x = Math.cos(elapsed * 0.78) * 0.022;
      }

      for (let i = 0; i < floatingLotuses.length; i++) {
        const lotus = floatingLotuses[i];
        lotus.visible = liveReveals.lakeLife > 0.01;
        if (lotus.visible) {
          lotus.scale.setScalar(0.05 + 0.95 * liveReveals.lakeLife);
          lotus.position.y =
            0.02 + Math.sin(elapsed * 1.25 + i * 0.9) * 0.028 - (1 - liveReveals.lakeLife) * 0.35;
          lotus.rotation.z = Math.sin(elapsed * 0.85 + i) * 0.025;
        }
      }

      // Subtle slow drift on atmospheric mountain mist bands
      for (let i = 0; i < mistPlanes.length; i++) {
        mistPlanes[i].position.y = 2.2 + (i % 3) * 1.1 + Math.sin(elapsed * 0.3 + i) * 0.22;
      }

      // 6. Animate Celestial 54-Ethnic Unity Halo, 360° Brocade Sky Ribbon, Rồng Thời Lý Dragon, Kites & Fireworks
      unityTableau.visible = liveReveals.unityHalo > 0.01;
      unityTableau.scale.setScalar(0.18 + 0.82 * liveReveals.unityHalo);
      haloMesh.rotation.z = elapsed * 0.065;
      orbRingGroup.rotation.z = -elapsed * 0.09;
      const targetHaloOpacity = (moodRef.current === 'night' ? 0.86 : 0.54) * liveReveals.unityHalo;
      haloMat.opacity = THREE.MathUtils.lerp(haloMat.opacity, targetHaloOpacity * musicPulse, dampT);

      encirclingRibbon.visible = liveReveals.brocadeRibbon > 0.01;
      encirclingRibbon.scale.set(1, 0.08 + 0.92 * liveReveals.brocadeRibbon, 1);
      const targetRibbonOpacity =
        (moodRef.current === 'night' ? 0.84 : 0.76) * liveReveals.brocadeRibbon;
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

      // Animate soaring articulated Vietnamese Rồng Thời Lý (emerges on "Rồng thiêng từ đây vút bay" in Director Mode!)
      lyDragon.visible = liveReveals.dragon > 0.01;
      dragonTrailPoints.visible = liveReveals.dragon > 0.01;
      if (lyDragon.visible) {
        lyDragon.scale.setScalar(0.08 + 0.92 * liveReveals.dragon);
        const dragonAngleOffset = -Math.PI * 0.67; // Starts in scenic upper-left sky on load!
        const evalDragonPos = (tParam: number, out: THREE.Vector3) => {
          const a = dragonAngleOffset + tParam;
          const rX = 16.0 + Math.sin(a * 6.5) * 1.15 + Math.sin(a * 2.0) * 1.4;
          const rZ = 14.4 + Math.cos(a * 6.5) * 0.95 + Math.cos(a * 2.0) * 1.2;
          const y =
            14.2 +
            (1 - liveReveals.dragon) * 4.5 +
            Math.sin(a * 9.5 + elapsed * 2.1) * 1.32 +
            Math.cos(a * 3.0) * 0.72;
          out.set(Math.cos(a) * rX, y, Math.sin(a) * rZ - 2.4);
        };

        const dragonHeadT = elapsed * 0.22;
        // Glowing Dragon Pearl gliding just ahead of the dragon's open jaws
        evalDragonPos(dragonHeadT + 0.088, dragonPearl.position);
        dragonPearl.lookAt(camera.position);
        dragonPearlMat.emissiveIntensity =
          (moodRef.current === 'night' ? 2.5 : 1.4) * musicPulse * liveReveals.dragon;

        for (let s = 0; s < dragonSegments.length; s++) {
          const segT = dragonHeadT - s * 0.0265;
          const seg = dragonSegments[s];
          evalDragonPos(segT, seg.position);
          evalDragonPos(segT + 0.024, _dragonLookTarget);
          seg.lookAt(_dragonLookTarget);
          // Subtle sinuous side-roll as the dragon weaves through clouds
          seg.rotateZ(Math.sin(elapsed * 2.4 - s * 0.4) * 0.18);
        }

        // Luminous Golden Stardust Wake streaming behind Rồng Thời Lý
        const dTrailPosAttr = dragonTrailGeo.attributes.position as THREE.BufferAttribute;
        const dTrailColAttr = dragonTrailGeo.attributes.color as THREE.BufferAttribute;
        for (let p = 0; p < dragonTrailCount; p++) {
          const frac = p / dragonTrailCount;
          const trailT = dragonHeadT - 0.14 - frac * 1.15;
          evalDragonPos(trailT, _dragonLookTarget);
          const scatter = 0.28 + frac * 0.65;
          const idx = p * 3;
          dragonTrailPos[idx] = _dragonLookTarget.x + Math.sin(elapsed * 4.5 + p * 1.9) * scatter;
          dragonTrailPos[idx + 1] =
            _dragonLookTarget.y + Math.cos(elapsed * 3.8 + p * 2.3) * scatter * 0.72;
          dragonTrailPos[idx + 2] =
            _dragonLookTarget.z + Math.sin(elapsed * 3.2 + p * 1.4) * scatter;

          const sparkle = (1 - frac) * (0.68 + Math.sin(elapsed * 12 + p * 2.1) * 0.32);
          dragonTrailCol[idx] = 1.0 * sparkle;
          dragonTrailCol[idx + 1] = (0.82 - frac * 0.25) * sparkle;
          dragonTrailCol[idx + 2] = (0.38 - frac * 0.18) * sparkle;
        }
        dTrailPosAttr.needsUpdate = true;
        dTrailColAttr.needsUpdate = true;
        const baseDragonTrailOpacity =
          moodRef.current === 'night' ? 0.94 : moodRef.current === 'sunset' ? 0.82 : 0.62;
        dragonTrailMat.opacity = baseDragonTrailOpacity * liveReveals.dragon;
      }

      // Living Pond Koi Fish gliding smoothly + concentric expanding lake ripples
      for (let k = 0; k < swimmingKoi.length; k++) {
        const koi = swimmingKoi[k];
        koi.group.visible = liveReveals.lakeLife > 0.01;
        if (koi.group.visible) {
          const a = koi.angleOffset + elapsed * koi.speed;
          const kx = koi.centerX + Math.cos(a) * koi.radiusX;
          const kz = koi.centerZ + Math.sin(a) * koi.radiusZ;
          const nextA = a + 0.08;
          const nx = koi.centerX + Math.cos(nextA) * koi.radiusX;
          const nz = koi.centerZ + Math.sin(nextA) * koi.radiusZ;
          koi.group.scale.setScalar(koi.baseScale * (0.05 + 0.95 * liveReveals.lakeLife));
          koi.group.position.set(kx, 0.015 + Math.sin(elapsed * 2.2 + k) * 0.012, kz);
          koi.group.lookAt(nx, 0.015, nz);
          koi.tailPivot.rotation.y = Math.sin(elapsed * 7.4 + k * 1.7) * 0.42;
        }
      }

      for (let r = 0; r < rippleRings.length; r++) {
        const ring = rippleRings[r];
        const cycle = (elapsed * 0.36 + ring.phase) % 1;
        const sc = 0.55 + cycle * 1.85;
        ring.mesh.scale.set(sc, 1, sc);
        ring.mat.opacity =
          Math.sin(cycle * Math.PI) *
          (moodRef.current === 'night' ? 0.32 : 0.22) *
          liveReveals.lakeLife;
      }

      // Enchanted Sunset & Night Festival Fireflies weaving around bamboo & blossoms
      fireflyMat.opacity = THREE.MathUtils.lerp(
        fireflyMat.opacity,
        targetTheme.fireflyOpacity * liveReveals.nightCelebration,
        dampT,
      );
      if (fireflyMat.opacity > 0.02) {
        const ffPosAttr = fireflyGeo.attributes.position as THREE.BufferAttribute;
        const ffColAttr = fireflyGeo.attributes.color as THREE.BufferAttribute;
        for (let i = 0; i < fireflyCount; i++) {
          const ff = fireflySeeds[i];
          const idx = i * 3;
          fireflyPos[idx] = ff.bx + Math.sin(elapsed * ff.speed + ff.phase) * 0.95;
          fireflyPos[idx + 1] =
            ff.by + Math.sin(elapsed * (ff.speed * 1.3) + ff.phase * 1.7) * 0.52;
          fireflyPos[idx + 2] = ff.bz + Math.cos(elapsed * (ff.speed * 0.9) + ff.phase) * 0.95;

          const glow =
            0.45 + 0.55 * Math.pow(0.5 + 0.5 * Math.sin(elapsed * 3.6 + ff.phase * 2.1), 2);
          fireflyCol[idx] = 1.0 * glow;
          fireflyCol[idx + 1] = 0.92 * glow;
          fireflyCol[idx + 2] = 0.48 * glow;
        }
        ffPosAttr.needsUpdate = true;
        ffColAttr.needsUpdate = true;
      }

      // Animate Night Festival Fireworks + Immediate Celebratory Intro Salvo when Imperial Scroll shatters
      const introBurstAlpha = introCelebrationTimer > 0 ? Math.min(1, introCelebrationTimer / 1.1) : 0;
      const targetFwOpacity = Math.max(
        targetTheme.nightBlend * 0.96 * liveReveals.nightCelebration,
        introBurstAlpha * 0.96,
      );
      fwMat.opacity = THREE.MathUtils.lerp(fwMat.opacity, targetFwOpacity, dampT);
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
        fk.group.visible = liveReveals.kites > 0.01;
        if (fk.group.visible) {
          fk.group.scale.setScalar(fk.baseScale * (0.06 + 0.94 * liveReveals.kites));
          fk.group.position.x = fk.basePos[0] + Math.sin(elapsed * 0.55 + fk.phase) * 0.85;
          fk.group.position.y =
            fk.basePos[1] +
            Math.sin(elapsed * 0.9 + fk.phase) * 0.42 +
            (1 - liveReveals.kites) * 3.5;
          fk.group.rotation.z = Math.sin(elapsed * 0.75 + fk.phase) * 0.14;
          for (let t = 0; t < fk.tails.length; t++) {
            fk.tails[t].rotation.z = Math.sin(elapsed * 2.8 + fk.phase + t * 0.9) * 0.28;
            fk.tails[t].rotation.x = Math.cos(elapsed * 2.2 + fk.phase + t) * 0.16;
          }
        }
      }

      // 6B. Soaring Sculpted Vietnamese Chim Hạc / Chim Lạc flock (sweeps in on "Thương cánh chim Lạc Hồng"!)
      for (let i = 0; i < soaringBirds.length; i++) {
        const b = soaringBirds[i];
        b.group.visible = liveReveals.lacBirds > 0.01;
        if (b.group.visible) {
          const a = b.angleOffset + elapsed * b.speed;
          const bx = Math.cos(a) * (b.radius + (1 - liveReveals.lacBirds) * 14.0);
          const bz = Math.sin(a) * (b.radius + (1 - liveReveals.lacBirds) * 14.0) - 2.0;
          const by =
            b.height + Math.sin(elapsed * 0.8 + i) * 0.55 + (1 - liveReveals.lacBirds) * 5.0;
          b.group.scale.setScalar(b.baseScale * (0.06 + 0.94 * liveReveals.lacBirds));
          b.group.position.set(bx, by, bz);
          // Face tangent direction of flight
          b.group.rotation.y = -a;
          b.group.rotation.z = 0.16;
          const flap = Math.sin(elapsed * b.flapSpeed + i * 1.3) * 0.36;
          b.rightWing.rotation.z = flap;
          b.leftWing.rotation.z = -flap;
        }
      }

      // 7. Floating glowing water hoa đăng drifting gently on the lake
      waterLanternInst.visible = liveReveals.kites > 0.01;
      if (waterLanternInst.visible) {
        for (let i = 0; i < waterLanternCount; i++) {
          const wl = waterLanternSeeds[i];
          const a = wl.angle + elapsed * wl.speed;
          _dummy.position.set(
            Math.cos(a) * wl.radius,
            0.02 + Math.sin(elapsed * 1.6 + wl.phase) * 0.025,
            Math.sin(a) * wl.radius + 1.5,
          );
          _dummy.rotation.set(0, a + elapsed * 0.15, Math.sin(elapsed + wl.phase) * 0.04);
          _dummy.scale.setScalar(wl.scale * liveReveals.kites);
          _dummy.updateMatrix();
          waterLanternInst.setMatrixAt(i, _dummy.matrix);
        }
        waterLanternInst.instanceMatrix.needsUpdate = true;
      }

      // 8. Rising festive sky lanterns (camera-proximity guarded + synced with nightCelebration reveal)
      skyLanternInst.visible = liveReveals.nightCelebration > 0.01;
      if (skyLanternInst.visible) {
        for (let i = 0; i < skyLanternCount; i++) {
          const s = lanternSeeds[i];
          const yLoop = ((s.yBase + elapsed * s.speed) % 21) + 2.0;
          const swayX = s.x + Math.sin(elapsed * 0.65 + s.phase) * 0.65;
          const swayZ = s.z + Math.cos(elapsed * 0.55 + s.phase) * 0.55;
          const dx = swayX - camera.position.x;
          const dy = yLoop - camera.position.y;
          const dz = swayZ - camera.position.z;
          const camDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const camGuard = THREE.MathUtils.smoothstep(camDist, 8.5, 14.0);
          _dummy.position.set(swayX, yLoop, swayZ);
          _dummy.rotation.set(0, elapsed * 0.2 + s.phase, Math.sin(elapsed + s.phase) * 0.06);
          _dummy.scale.setScalar(s.scale * camGuard * liveReveals.nightCelebration);
          _dummy.updateMatrix();
          skyLanternInst.setMatrixAt(i, _dummy.matrix);
        }
        skyLanternInst.instanceMatrix.needsUpdate = true;
      }

      // 9. Softly drifting Hoa Đào & Hoa Mai petals
      driftPetalInst.visible = liveReveals.floraPagoda > 0.01;
      if (driftPetalInst.visible) {
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
          _dummy.scale.setScalar((0.85 + (i % 3) * 0.22) * liveReveals.floraPagoda);
          _dummy.updateMatrix();
          driftPetalInst.setMatrixAt(i, _dummy.matrix);
        }
        driftPetalInst.instanceMatrix.needsUpdate = true;
      }

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

      // 12. Animate user-released wish lanterns (with smooth camera-proximity guard)
      for (let i = activeWishLanterns.length - 1; i >= 0; i--) {
        const w = activeWishLanterns[i];
        w.age += dt;
        w.mesh.position.y += w.velocityY * dt;
        w.mesh.position.x += (w.driftX + Math.sin(elapsed * 1.4 + w.phase) * 0.32) * dt;
        w.mesh.position.z += (w.driftZ + Math.cos(elapsed * 1.2 + w.phase) * 0.28) * dt;
        w.mesh.rotation.y += dt * 0.45;
        const camDist = w.mesh.position.distanceTo(camera.position);
        const camGuard = THREE.MathUtils.smoothstep(camDist, 5.2, 9.2);
        w.mesh.scale.setScalar(camGuard);
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
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      controls.removeEventListener('start', onControlStart);
      canvasEl.removeEventListener('webglcontextlost', onContextLost);
      canvasEl.removeEventListener('webglcontextrestored', onContextRestored);
      controls.dispose();

      activeWishLanterns.forEach((w) => scene.remove(w.mesh));
      if (lakeReflector) {
        lakeReflector.dispose();
      }
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
        className="absolute inset-0 flex items-center justify-center bg-[#f4e2ce] text-[#2b1815] p-6"
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
      data-director={isDirectorMode ? 'on' : 'off'}
      data-vertical={isVerticalFrame ? 'on' : 'off'}
      data-lanterns={lanternCount}
      className="absolute inset-0 h-full w-full select-none"
      aria-label="Không gian 3D tương tác Khuê Văn Các, Chùa Một Cột, Cột Cờ Hà Nội, Cầu Thê Húc và Đầm Sen Ngày Văn Hóa Việt Nam 24-11"
    />
  );
}
