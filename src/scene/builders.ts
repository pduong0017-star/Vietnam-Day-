import * as THREE from 'three';
import type { SceneTextureBundle } from './textures';

export interface HeritageSceneRefs {
  flagMesh: THREE.Mesh;
  flagRestPositions: Float32Array;
  pavilionGlowMat: THREE.MeshStandardMaterial;
  lanternSilkMats: THREE.MeshStandardMaterial[];
  floatingLotuses: THREE.Group[];
  disposables: {
    geometries: THREE.BufferGeometry[];
    materials: THREE.Material[];
  };
}

function trackGeo<T extends THREE.BufferGeometry>(
  geo: T,
  store: THREE.BufferGeometry[],
): T {
  store.push(geo);
  return geo;
}

function trackMat<T extends THREE.Material>(
  mat: T,
  store: THREE.Material[],
): T {
  store.push(mat);
  return mat;
}

function makeContactShadow(
  radius: number,
  shadowMap: THREE.CanvasTexture,
  geos: THREE.BufferGeometry[],
  mats: THREE.Material[],
): THREE.Mesh {
  const geo = trackGeo(new THREE.CircleGeometry(radius, 32), geos);
  const mat = trackMat(
    new THREE.MeshBasicMaterial({
      map: shadowMap,
      transparent: true,
      depthWrite: false,
      opacity: 0.45,
    }),
    mats,
  );
  const disc = new THREE.Mesh(geo, mat);
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.015;
  return disc;
}

/**
 * Builds a sweeping curved Vietnamese pagoda roof tier using custom vertex curvature
 * so corners lift gracefully (đầu đao cong vút), crowned with gilded ridge ribs.
 */
function createCurvedPagodaRoof(
  baseWidth: number,
  topWidth: number,
  height: number,
  eaveLift: number,
  tileMat: THREE.Material,
  goldMat: THREE.Material,
  geos: THREE.BufferGeometry[],
): THREE.Group {
  const roofGroup = new THREE.Group();

  // Four sloped faces assembled cleanly from subdivided planes bent upward at corners
  const segX = 12;
  const segY = 8;
  const halfBase = baseWidth / 2;
  const halfTop = topWidth / 2;

  for (let side = 0; side < 4; side++) {
    const geo = new THREE.BufferGeometry();
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let iy = 0; iy <= segY; iy++) {
      const v = iy / segY; // 0 = eave bottom, 1 = ridge top
      // Concave pagoda roof profile
      const yBase = Math.pow(v, 1.35) * height;
      const halfSpan = THREE.MathUtils.lerp(halfBase, halfTop, v);
      const zOut = THREE.MathUtils.lerp(halfBase, halfTop, v);

      for (let ix = 0; ix <= segX; ix++) {
        const u = ix / segX;
        const x = THREE.MathUtils.lerp(-halfSpan, halfSpan, u);
        // Edge factor: 0 at center, 1 at corners
        const edgeDist = Math.abs(u * 2 - 1);
        const cornerCurve = Math.pow(edgeDist, 2.3) * (1 - v) * eaveLift;
        positions.push(x, yBase + cornerCurve, zOut);
        uvs.push(u * 2.2, v * 1.4);
      }
    }

    const rowStride = segX + 1;
    for (let iy = 0; iy < segY; iy++) {
      for (let ix = 0; ix < segX; ix++) {
        const a = iy * rowStride + ix;
        const b = a + 1;
        const c = a + rowStride;
        const d = c + 1;
        indices.push(a, b, d, a, d, c);
      }
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    trackGeo(geo, geos);

    const mesh = new THREE.Mesh(geo, tileMat);
    mesh.rotation.y = (side * Math.PI) / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    roofGroup.add(mesh);
  }

  // Four curved golden hip ridges with upturned dragon-scroll corner eaves
  for (let c = 0; c < 4; c++) {
    const angle = (c * Math.PI) / 2 + Math.PI / 4;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rTop = halfTop * Math.SQRT2;
    const rBase = halfBase * Math.SQRT2;
    const rTip = rBase + 0.34;

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(cos * rTop, height + 0.04, sin * rTop),
      new THREE.Vector3(
        cos * THREE.MathUtils.lerp(rTop, rBase, 0.5),
        height * 0.36 + eaveLift * 0.25,
        sin * THREE.MathUtils.lerp(rTop, rBase, 0.5),
      ),
      new THREE.Vector3(cos * rBase, eaveLift + 0.04, sin * rBase),
      new THREE.Vector3(cos * rTip, eaveLift + 0.32, sin * rTip),
    ]);
    const ridgeGeo = trackGeo(new THREE.TubeGeometry(curve, 16, 0.075, 8, false), geos);
    const ridgeMesh = new THREE.Mesh(ridgeGeo, goldMat);
    ridgeMesh.castShadow = true;
    roofGroup.add(ridgeMesh);
  }

  return roofGroup;
}

/**
 * Hero Subject 1: Khuê Văn Các Cultural Pavilion (12+ composite parts).
 * Grounded at bottom-center y = 0.
 */
export function buildKhueVanPavilion(
  textures: SceneTextureBundle,
  geos: THREE.BufferGeometry[],
  mats: THREE.Material[],
): { group: THREE.Group; glowMat: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();
  group.name = 'KhueVanPavilion';

  const stoneMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.stoneMap,
      bumpMap: textures.stoneBump,
      bumpScale: 0.04,
      roughness: 0.86,
      metalness: 0.04,
    }),
    mats,
  );

  const darkStoneMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x57524b,
      roughness: 0.84,
      metalness: 0.08,
    }),
    mats,
  );

  const lacquerRedMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xa61d1d,
      roughness: 0.34,
      metalness: 0.08,
    }),
    mats,
  );

  const deepWoodMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x541b16,
      roughness: 0.58,
      metalness: 0.05,
    }),
    mats,
  );

  const goldMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe7b84b,
      roughness: 0.22,
      metalness: 0.88,
    }),
    mats,
  );

  const jadeTileMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: textures.jadeTileMap,
      bumpMap: textures.jadeTileBump,
      bumpScale: 0.06,
      roughness: 0.26,
      metalness: 0.1,
      clearcoat: 0.45,
      clearcoatRoughness: 0.25,
      side: THREE.DoubleSide,
    }),
    mats,
  );

  const glowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffe4a3,
      emissive: 0xffa630,
      emissiveIntensity: 0.9,
      roughness: 0.35,
      metalness: 0.0,
    }),
    mats,
  );

  // 1. 3-tier carved stone terrace plinth (y = 0 to 1.05)
  const tier1 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(6.8, 0.42, 6.8), geos), stoneMat);
  tier1.position.y = 0.21;
  tier1.receiveShadow = true;
  tier1.castShadow = true;
  group.add(tier1);

  const tier2 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(5.9, 0.36, 5.9), geos), stoneMat);
  tier2.position.y = 0.6;
  tier2.receiveShadow = true;
  tier2.castShadow = true;
  group.add(tier2);

  const tier3 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(5.1, 0.28, 5.1), geos), stoneMat);
  tier3.position.y = 0.92;
  tier3.receiveShadow = true;
  tier3.castShadow = true;
  group.add(tier3);

  // Front & back stone ceremonial stairs
  const stairGeo = trackGeo(new THREE.BoxGeometry(2.1, 0.22, 0.42), geos);
  for (const dir of [1, -1]) {
    for (let s = 0; s < 4; s++) {
      const step = new THREE.Mesh(stairGeo, stoneMat);
      step.position.set(0, 0.11 + s * 0.24, dir * (3.65 - s * 0.32));
      step.receiveShadow = true;
      step.castShadow = true;
      group.add(step);
    }
  }

  // 2. Four lower square stone pier pillars with carved recesses + vermilion accent columns
  const baseY = 1.06;
  const colOffset = 1.72;
  const plinthFootGeo = trackGeo(new THREE.CylinderGeometry(0.36, 0.44, 0.24, 16), geos);
  const colGeo = trackGeo(new THREE.CylinderGeometry(0.24, 0.28, 2.75, 20), geos);
  const goldCollarGeo = trackGeo(new THREE.TorusGeometry(0.27, 0.045, 10, 20), geos);

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const foot = new THREE.Mesh(plinthFootGeo, darkStoneMat);
      foot.position.set(sx * colOffset, baseY + 0.12, sz * colOffset);
      foot.castShadow = true;
      group.add(foot);

      const col = new THREE.Mesh(colGeo, lacquerRedMat);
      col.position.set(sx * colOffset, baseY + 1.56, sz * colOffset);
      col.castShadow = true;
      col.receiveShadow = true;
      group.add(col);

      const collar = new THREE.Mesh(goldCollarGeo, goldMat);
      collar.rotation.x = Math.PI / 2;
      collar.position.set(sx * colOffset, baseY + 2.75, sz * colOffset);
      group.add(collar);
    }
  }

  // Cross-beam cornice supporting upper pavilion
  const lowerBeam = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(4.4, 0.36, 4.4), geos),
    deepWoodMat,
  );
  lowerBeam.position.y = baseY + 2.98;
  lowerBeam.castShadow = true;
  group.add(lowerBeam);

  // Ornamental gold fascia trim around lower beam
  const trimBand = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(4.52, 0.1, 4.52), geos),
    goldMat,
  );
  trimBand.position.y = baseY + 2.86;
  group.add(trimBand);

  // 3. Lower sweeping curved jade ceramic roof skirt
  const lowerRoof = createCurvedPagodaRoof(
    6.4,
    3.5,
    1.18,
    0.46,
    jadeTileMat,
    goldMat,
    geos,
  );
  lowerRoof.position.y = baseY + 3.05;
  group.add(lowerRoof);

  // 4. Upper Khuê Văn pavilion chamber (with 4 iconic circular sunburst windows)
  const upperBaseY = baseY + 4.18;
  const chamber = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(3.2, 2.05, 3.2), geos),
    lacquerRedMat,
  );
  chamber.position.y = upperBaseY + 1.02;
  chamber.castShadow = true;
  chamber.receiveShadow = true;
  group.add(chamber);

  // Glowing interior core visible through sunburst windows
  const glowCore = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(1.12, 1.12, 1.5, 24), geos),
    glowMat,
  );
  glowCore.position.y = upperBaseY + 1.05;
  group.add(glowCore);

  // Circular Sunburst Windows (Cửa sổ tròn mặt trời Khuê Văn Các) on all 4 facades
  const ringOuterGeo = trackGeo(new THREE.TorusGeometry(0.66, 0.085, 12, 32), geos);
  const ringInnerGeo = trackGeo(new THREE.TorusGeometry(0.24, 0.055, 10, 24), geos);
  const rayGeo = trackGeo(new THREE.BoxGeometry(0.06, 0.42, 0.07), geos);
  const windowDiscGeo = trackGeo(new THREE.CircleGeometry(0.62, 28), geos);

  for (let side = 0; side < 4; side++) {
    const winGroup = new THREE.Group();
    const angle = (side * Math.PI) / 2;

    const disc = new THREE.Mesh(windowDiscGeo, glowMat);
    disc.position.z = 0.01;
    winGroup.add(disc);

    const outerRing = new THREE.Mesh(ringOuterGeo, goldMat);
    outerRing.position.z = 0.04;
    winGroup.add(outerRing);

    const innerRing = new THREE.Mesh(ringInnerGeo, goldMat);
    innerRing.position.z = 0.05;
    winGroup.add(innerRing);

    // 8 radial sunburst spokes
    for (let r = 0; r < 8; r++) {
      const ra = (r * Math.PI) / 4;
      const spoke = new THREE.Mesh(rayGeo, goldMat);
      spoke.position.set(Math.cos(ra) * 0.44, Math.sin(ra) * 0.44, 0.045);
      spoke.rotation.z = ra - Math.PI / 2;
      winGroup.add(spoke);
    }

    winGroup.rotation.y = angle;
    winGroup.position.set(
      Math.sin(angle) * 1.62,
      upperBaseY + 1.05,
      Math.cos(angle) * 1.62,
    );
    group.add(winGroup);
  }

  // Balcony golden balustrade around upper chamber
  const railGeo = trackGeo(new THREE.BoxGeometry(3.65, 0.1, 0.1), geos);
  for (let side = 0; side < 4; side++) {
    const rail = new THREE.Mesh(railGeo, goldMat);
    const a = (side * Math.PI) / 2;
    rail.rotation.y = a;
    rail.position.set(Math.sin(a) * 1.82, upperBaseY + 0.28, Math.cos(a) * 1.82);
    group.add(rail);
  }

  // 5. Upper double-tiered sweeping jade pagoda roof + golden lotus finial spire
  const upperRoof = createCurvedPagodaRoof(
    5.4,
    0.45,
    1.95,
    0.58,
    jadeTileMat,
    goldMat,
    geos,
  );
  upperRoof.position.y = upperBaseY + 1.98;
  group.add(upperRoof);

  // Sculpted LatheGeometry golden lotus crown finial
  const finialPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.42, 0.04),
    new THREE.Vector2(0.28, 0.22),
    new THREE.Vector2(0.36, 0.36),
    new THREE.Vector2(0.16, 0.56),
    new THREE.Vector2(0.24, 0.74),
    new THREE.Vector2(0.07, 1.04),
    new THREE.Vector2(0.0, 1.24),
  ];
  const finialGeo = trackGeo(new THREE.LatheGeometry(finialPts, 24), geos);
  const finial = new THREE.Mesh(finialGeo, goldMat);
  finial.position.y = upperBaseY + 3.88;
  finial.castShadow = true;
  group.add(finial);

  // Hanging interior lantern underneath pavilion arch
  const innerLanternPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.22, 0.06),
    new THREE.Vector2(0.38, 0.32),
    new THREE.Vector2(0.34, 0.62),
    new THREE.Vector2(0.16, 0.8),
    new THREE.Vector2(0.0, 0.84),
  ];
  const innerLantern = new THREE.Mesh(
    trackGeo(new THREE.LatheGeometry(innerLanternPts, 20), geos),
    glowMat,
  );
  innerLantern.position.y = baseY + 1.85;
  group.add(innerLantern);

  group.add(makeContactShadow(4.4, textures.contactShadowMap, geos, mats));

  return { group, glowMat };
}

/**
 * Hero Subject 2: Cột Cờ Hà Nội (Hanoi Flag Tower) with dynamically waving 3D Flag.
 * Grounded at bottom-center y = 0.
 */
export function buildHanoiFlagTower(
  textures: SceneTextureBundle,
  geos: THREE.BufferGeometry[],
  mats: THREE.Material[],
): { group: THREE.Group; flagMesh: THREE.Mesh; flagRestPositions: Float32Array } {
  const group = new THREE.Group();
  group.name = 'HanoiFlagTower';

  const brickMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.brickMap,
      bumpMap: textures.brickBump,
      bumpScale: 0.05,
      roughness: 0.86,
      metalness: 0.03,
    }),
    mats,
  );

  const stoneTrimMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe6dac5,
      roughness: 0.78,
      metalness: 0.05,
    }),
    mats,
  );

  const darkArchMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x261a14,
      roughness: 0.9,
      metalness: 0.0,
    }),
    mats,
  );

  const brassMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe5bb55,
      roughness: 0.2,
      metalness: 0.92,
    }),
    mats,
  );

  const flagMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.flagMap,
      roughness: 0.62,
      metalness: 0.04,
      side: THREE.DoubleSide,
    }),
    mats,
  );

  // 3 stepped tapered square brick tiers (rotated 45 deg so CylinderGeometry(4) aligns square)
  const tiers = [
    { topR: 2.35, botR: 2.65, h: 1.5, y: 0.75 },
    { topR: 1.72, botR: 1.98, h: 1.35, y: 2.175 },
    { topR: 1.24, botR: 1.44, h: 1.15, y: 3.425 },
  ];

  tiers.forEach((t, idx) => {
    const geo = trackGeo(new THREE.CylinderGeometry(t.topR, t.botR, t.h, 4), geos);
    geo.rotateY(Math.PI / 4);
    const mesh = new THREE.Mesh(geo, brickMat);
    mesh.position.y = t.y;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Cornice ledge
    const ledgeW = t.topR * Math.SQRT2 + 0.16;
    const ledge = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(ledgeW, 0.14, ledgeW), geos),
      stoneTrimMat,
    );
    ledge.position.y = t.y + t.h / 2 + 0.05;
    ledge.castShadow = true;
    group.add(ledge);

    // Arched gateway recess on front of first & second tier
    if (idx < 2) {
      const arch = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.55 - idx * 0.1, 0.8 - idx * 0.12, 0.15), geos),
        darkArchMat,
      );
      arch.position.set(0, t.y - 0.12, (t.topR + t.botR) * 0.35 + 0.04);
      group.add(arch);
    }
  });

  // Octagonal fluted central shaft (proportioned so waving flag crowns the hero frame)
  const shaft = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.76, 0.96, 3.1, 8), geos),
    brickMat,
  );
  shaft.position.y = 5.56;
  shaft.castShadow = true;
  shaft.receiveShadow = true;
  group.add(shaft);

  // Upper octagonal observation pavilion crown
  const crown = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.95, 0.84, 0.95, 8), geos),
    brickMat,
  );
  crown.position.y = 7.56;
  crown.castShadow = true;
  group.add(crown);

  const crownRim = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(1.08, 1.02, 0.18, 8), geos),
    stoneTrimMat,
  );
  crownRim.position.y = 8.1;
  group.add(crownRim);

  // Small dark viewing ports around octagonal crown
  const portGeo = trackGeo(new THREE.BoxGeometry(0.24, 0.4, 0.12), geos);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const port = new THREE.Mesh(portGeo, darkArchMat);
    port.rotation.y = a;
    port.position.set(Math.sin(a) * 0.87, 7.56, Math.cos(a) * 0.87);
    group.add(port);
  }

  // Tall brushed-brass flagpole + golden orb finial
  const poleH = 3.55;
  const pole = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.055, 0.085, poleH, 12), geos),
    brassMat,
  );
  pole.position.y = 8.18 + poleH / 2;
  pole.castShadow = true;
  group.add(pole);

  const orb = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.16, 16, 16), geos),
    brassMat,
  );
  orb.position.y = 8.18 + poleH + 0.12;
  group.add(orb);

  // Waving 3D Vietnamese National Flag anchored at x = 0, flying proudly into the frame
  const flagW = 3.35;
  const flagH = 2.22;
  const flagGeo = trackGeo(new THREE.PlaneGeometry(flagW, flagH, 24, 12), geos);
  // Shift geometry so x=0 is attached to the flagpole
  flagGeo.translate(flagW / 2 + 0.06, 0, 0);
  const flagRestPositions = new Float32Array(
    (flagGeo.attributes.position as THREE.BufferAttribute).array,
  );

  const flagMesh = new THREE.Mesh(flagGeo, flagMat);
  flagMesh.position.set(0, 8.18 + poleH - flagH / 2 - 0.12, 0);
  // Fly toward center-left/front so the full golden five-pointed star shines in overview
  flagMesh.rotation.y = Math.PI + 0.34;
  flagMesh.castShadow = true;
  group.add(flagMesh);

  group.add(makeContactShadow(3.1, textures.contactShadowMap, geos, mats));

  return { group, flagMesh, flagRestPositions };
}

/**
 * Hero Subject 3: Sculpted Multi-Petal Vietnamese Lotus Flower & Lily Pad (with soft gradient petal texture).
 */
export function buildLotusCluster(
  scale: number,
  petalTint: number,
  textures: SceneTextureBundle,
  geos: THREE.BufferGeometry[],
  mats: THREE.Material[],
): THREE.Group {
  const group = new THREE.Group();

  // Notched emerald lotus pad via ExtrudeGeometry
  const padShape = new THREE.Shape();
  padShape.moveTo(0, 0);
  padShape.absarc(0, 0, 1.08, 0.16, Math.PI * 2 - 0.16, false);
  padShape.lineTo(0, 0);
  const padGeo = trackGeo(
    new THREE.ExtrudeGeometry(padShape, {
      depth: 0.035,
      bevelEnabled: true,
      bevelThickness: 0.016,
      bevelSize: 0.025,
      bevelSegments: 3,
    }),
    geos,
  );
  padGeo.rotateX(Math.PI / 2);

  const padMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x348262,
      roughness: 0.58,
      metalness: 0.03,
    }),
    mats,
  );

  const pad = new THREE.Mesh(padGeo, padMat);
  pad.position.y = 0.05;
  pad.receiveShadow = true;
  group.add(pad);

  const pad2 = new THREE.Mesh(padGeo, padMat);
  pad2.scale.set(0.7, 1, 0.7);
  pad2.position.set(0.78, 0.035, 0.44);
  pad2.rotation.y = 2.1;
  group.add(pad2);

  // Softly rounded lotus petal shape
  const petalShape = new THREE.Shape();
  petalShape.moveTo(0, 0);
  petalShape.bezierCurveTo(0.28, 0.18, 0.25, 0.58, 0, 0.92);
  petalShape.bezierCurveTo(-0.25, 0.58, -0.28, 0.18, 0, 0);

  const petalGeo = trackGeo(
    new THREE.ExtrudeGeometry(petalShape, {
      depth: 0.022,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 3,
    }),
    geos,
  );

  const outerPetalMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: petalTint,
      map: textures.lotusPetalMap,
      roughness: 0.44,
      metalness: 0.01,
      emissive: 0x6e2038,
      emissiveIntensity: 0.16,
    }),
    mats,
  );

  const innerPetalMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.lotusPetalMap,
      roughness: 0.36,
      metalness: 0.01,
      emissive: 0x7c2942,
      emissiveIntensity: 0.2,
    }),
    mats,
  );

  // Outer petal ring (9 petals)
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const holder = new THREE.Group();
    holder.rotation.y = a;
    const p = new THREE.Mesh(petalGeo, outerPetalMat);
    p.position.set(0, 0.08, 0.12);
    p.rotation.x = 1.08;
    holder.add(p);
    group.add(holder);
  }

  // Inner petal ring (7 upright petals)
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.24;
    const holder = new THREE.Group();
    holder.rotation.y = a;
    const p = new THREE.Mesh(petalGeo, innerPetalMat);
    p.scale.set(0.78, 0.8, 0.8);
    p.position.set(0, 0.12, 0.08);
    p.rotation.x = 0.54;
    holder.add(p);
    group.add(holder);
  }

  // Golden lotus seed pod & stamen crown
  const stamenMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf7cd54,
      emissive: 0xdf9b22,
      emissiveIntensity: 0.48,
      roughness: 0.38,
      metalness: 0.25,
    }),
    mats,
  );
  const pod = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.19, 0.09, 0.22, 16), geos),
    stamenMat,
  );
  pod.position.y = 0.26;
  group.add(pod);

  group.scale.setScalar(scale);
  return group;
}

/**
 * Hero Subject 4: Hội An Ceremonial Silk Lantern Pole (7 composite parts).
 */
export function buildCeremonialLanternPole(
  textures: SceneTextureBundle,
  silkColor: number,
  geos: THREE.BufferGeometry[],
  mats: THREE.Material[],
): { group: THREE.Group; silkMat: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();

  const stoneMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x6e655b, roughness: 0.85, metalness: 0.05 }),
    mats,
  );
  const poleMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x5c1816, roughness: 0.42, metalness: 0.08 }),
    mats,
  );
  const goldMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xe3b448, roughness: 0.24, metalness: 0.88 }),
    mats,
  );
  const silkMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: silkColor,
      emissive: silkColor,
      emissiveIntensity: 0.85,
      roughness: 0.45,
      metalness: 0.0,
    }),
    mats,
  );

  // Carved stone footing
  const footing = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.24, 0.34, 0.36, 12), geos),
    stoneMat,
  );
  footing.position.y = 0.18;
  group.add(footing);

  // Vertical lacquered pole
  const pole = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.065, 0.09, 3.6, 12), geos),
    poleMat,
  );
  pole.position.y = 2.05;
  pole.castShadow = true;
  group.add(pole);

  // Curved crane-neck bracket arm
  const armCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 3.65, 0),
    new THREE.Vector3(0.22, 4.02, 0),
    new THREE.Vector3(0.68, 3.96, 0),
    new THREE.Vector3(0.76, 3.74, 0),
  ]);
  const arm = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(armCurve, 14, 0.036, 8, false), geos),
    goldMat,
  );
  group.add(arm);

  // Fluted Hội An silk lantern body via LatheGeometry
  const lanternPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.16, 0.04),
    new THREE.Vector2(0.32, 0.26),
    new THREE.Vector2(0.35, 0.48),
    new THREE.Vector2(0.28, 0.68),
    new THREE.Vector2(0.14, 0.82),
    new THREE.Vector2(0.0, 0.86),
  ];
  const lanternBody = new THREE.Mesh(
    trackGeo(new THREE.LatheGeometry(lanternPts, 18), geos),
    silkMat,
  );
  lanternBody.position.set(0.76, 2.86, 0);
  group.add(lanternBody);

  // Top & bottom gold caps + hanging tassel
  const capGeo = trackGeo(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 14), geos);
  const topCap = new THREE.Mesh(capGeo, goldMat);
  topCap.position.set(0.76, 3.71, 0);
  group.add(topCap);

  const botCap = new THREE.Mesh(capGeo, goldMat);
  botCap.position.set(0.76, 2.86, 0);
  group.add(botCap);

  const tassel = new THREE.Mesh(
    trackGeo(new THREE.ConeGeometry(0.06, 0.36, 10), geos),
    goldMat,
  );
  tassel.position.set(0.76, 2.64, 0);
  group.add(tassel);

  group.add(makeContactShadow(0.55, textures.contactShadowMap, geos, mats));

  return { group, silkMat };
}

/**
 * Hero Subject 5: Ceremonial Cultural Stele ("24 · 11 Ngày Văn Hóa Việt Nam") + Bronze Incense Burners.
 */
export function buildCulturalStele(
  textures: SceneTextureBundle,
  geos: THREE.BufferGeometry[],
  mats: THREE.Material[],
): THREE.Group {
  const group = new THREE.Group();

  const stoneMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.stoneMap,
      bumpMap: textures.stoneBump,
      bumpScale: 0.03,
      roughness: 0.82,
      metalness: 0.06,
    }),
    mats,
  );

  const goldMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe3b448,
      roughness: 0.24,
      metalness: 0.88,
    }),
    mats,
  );

  const bronzeMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x8a6429,
      roughness: 0.3,
      metalness: 0.85,
    }),
    mats,
  );

  const plaqueMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.steleMap,
      roughness: 0.36,
      metalness: 0.12,
    }),
    mats,
  );

  // Carved stone lotus base
  const base1 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.1, 0.28, 0.95), geos), stoneMat);
  base1.position.y = 0.14;
  base1.castShadow = true;
  base1.receiveShadow = true;
  group.add(base1);

  const base2 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.7, 0.22, 0.72), geos), stoneMat);
  base2.position.y = 0.38;
  group.add(base2);

  // Main stele slab with beveled frame
  const slab = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.54, 2.24, 0.26), geos), stoneMat);
  slab.position.y = 1.6;
  slab.castShadow = true;
  group.add(slab);

  // Front lacquer calligraphy plaque (offset cleanly to avoid Z-fighting)
  const plaque = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(1.36, 2.04), geos), plaqueMat);
  plaque.position.set(0, 1.6, 0.142);
  group.add(plaque);

  // Crowned curved golden pediment cap on top of stele
  const cap = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.78, 0.16, 0.42), geos), goldMat);
  cap.position.y = 2.76;
  group.add(cap);

  // Two cast-bronze tripod incense burners (Lư Hương) flanking the stele
  const urnPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.18, 0.04),
    new THREE.Vector2(0.12, 0.16),
    new THREE.Vector2(0.3, 0.34),
    new THREE.Vector2(0.28, 0.56),
    new THREE.Vector2(0.22, 0.64),
    new THREE.Vector2(0.32, 0.72),
    new THREE.Vector2(0.24, 0.74),
  ];
  const urnGeo = trackGeo(new THREE.LatheGeometry(urnPts, 20), geos);
  for (const side of [-1, 1]) {
    const urn = new THREE.Mesh(urnGeo, bronzeMat);
    urn.position.set(side * 1.48, 0.0, 0.25);
    urn.castShadow = true;
    group.add(urn);
  }

  group.add(makeContactShadow(1.85, textures.contactShadowMap, geos, mats));
  group.scale.setScalar(1.16);
  return group;
}

/**
 * Hero Subject 6: Curved Vermilion Vietnamese Arched Bridge (inspired by Cầu Thê Húc).
 */
export function buildTheHucBridge(
  geos: THREE.BufferGeometry[],
  mats: THREE.Material[],
): THREE.Group {
  const group = new THREE.Group();

  const redWoodMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xc22b26,
      roughness: 0.44,
      metalness: 0.06,
    }),
    mats,
  );
  const deckWoodMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x8f3424,
      roughness: 0.68,
      metalness: 0.04,
    }),
    mats,
  );
  const goldMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xecc05d,
      roughness: 0.26,
      metalness: 0.85,
    }),
    mats,
  );

  const span = 6.6;
  const width = 3.2;
  const archHeight = 0.82;
  const planks = 18;
  const plankGeo = trackGeo(new THREE.BoxGeometry(width, 0.14, span / planks + 0.05), geos);

  for (let i = 0; i <= planks; i++) {
    const t = i / planks;
    const z = (t - 0.5) * span;
    const y = Math.sin(t * Math.PI) * archHeight + 0.2;
    const slope = Math.cos(t * Math.PI) * (archHeight * Math.PI / span);
    const plank = new THREE.Mesh(plankGeo, deckWoodMat);
    plank.position.set(0, y, z);
    plank.rotation.x = -Math.atan(slope);
    plank.receiveShadow = true;
    plank.castShadow = true;
    group.add(plank);
  }

  // Curved vermilion arch beams & handrails on both sides
  const postGeo = trackGeo(new THREE.CylinderGeometry(0.065, 0.075, 0.85, 10), geos);
  const ballGeo = trackGeo(new THREE.SphereGeometry(0.11, 12, 12), geos);

  for (const sx of [-1, 1]) {
    const xPos = sx * (width / 2 - 0.1);
    const railPts: THREE.Vector3[] = [];
    const midRailPts: THREE.Vector3[] = [];
    const beamPts: THREE.Vector3[] = [];

    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const z = (t - 0.5) * span;
      const y = Math.sin(t * Math.PI) * archHeight + 0.2;
      beamPts.push(new THREE.Vector3(xPos, y - 0.08, z));
      midRailPts.push(new THREE.Vector3(xPos, y + 0.44, z));
      railPts.push(new THREE.Vector3(xPos, y + 0.82, z));

      if (i % 2 === 0) {
        const post = new THREE.Mesh(postGeo, redWoodMat);
        post.position.set(xPos, y + 0.42, z);
        post.castShadow = true;
        group.add(post);

        const cap = new THREE.Mesh(ballGeo, goldMat);
        cap.position.set(xPos, y + 0.9, z);
        group.add(cap);
      }
    }

    const beamGeo = trackGeo(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(beamPts), 24, 0.11, 8, false),
      geos,
    );
    const railGeo = trackGeo(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts), 24, 0.065, 8, false),
      geos,
    );
    const midGeo = trackGeo(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(midRailPts), 24, 0.04, 8, false),
      geos,
    );

    group.add(new THREE.Mesh(beamGeo, redWoodMat));
    group.add(new THREE.Mesh(railGeo, redWoodMat));
    group.add(new THREE.Mesh(midGeo, goldMat));
  }

  return group;
}

/**
 * Hero Subject 7: Organic Vietnamese Bamboo Grove (Lũy Tre Xanh) for lush botanical softness.
 */
export function buildBambooGrove(
  scale: number,
  geos: THREE.BufferGeometry[],
  mats: THREE.Material[],
): THREE.Group {
  const group = new THREE.Group();

  const stalkMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x4b8753,
      roughness: 0.48,
      metalness: 0.04,
    }),
    mats,
  );

  const leafMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x62a463,
      roughness: 0.56,
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),
    mats,
  );

  // Soft leaf blade geometry
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.12, 0.25, 0, 0.72);
  leafShape.quadraticCurveTo(-0.12, 0.25, 0, 0);
  const leafGeo = trackGeo(new THREE.ShapeGeometry(leafShape, 6), geos);

  const stalks = [
    { x: 0.0, z: 0.0, h: 4.8, bendX: 0.28, bendZ: 0.14 },
    { x: -0.42, z: 0.28, h: 4.1, bendX: -0.35, bendZ: 0.22 },
    { x: 0.36, z: -0.25, h: 4.4, bendX: 0.42, bendZ: -0.18 },
    { x: -0.22, z: -0.38, h: 3.5, bendX: -0.22, bendZ: -0.28 },
    { x: 0.48, z: 0.32, h: 3.3, bendX: 0.36, bendZ: 0.24 },
  ];

  stalks.forEach((s, idx) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s.x, 0, s.z),
      new THREE.Vector3(s.x + s.bendX * 0.25, s.h * 0.45, s.z + s.bendZ * 0.25),
      new THREE.Vector3(s.x + s.bendX, s.h, s.z + s.bendZ),
    ]);
    const culmGeo = trackGeo(new THREE.TubeGeometry(curve, 12, 0.06, 7, false), geos);
    const culm = new THREE.Mesh(culmGeo, stalkMat);
    culm.castShadow = true;
    group.add(culm);

    // Leaf clusters along upper half
    for (let k = 0; k < 5; k++) {
      const t = 0.55 + k * 0.1;
      const pt = curve.getPoint(t);
      const fan = new THREE.Group();
      fan.position.copy(pt);
      fan.rotation.y = idx * 1.4 + k * 1.9;
      for (let b = -1; b <= 1; b++) {
        const blade = new THREE.Mesh(leafGeo, leafMat);
        blade.rotation.x = 0.95 + Math.abs(b) * 0.2;
        blade.rotation.z = b * 0.45;
        fan.add(blade);
      }
      group.add(fan);
    }
  });

  group.scale.setScalar(scale);
  return group;
}

/**
 * Natural outdoor horizon perimeter: soft watercolor layered Vietnamese mountain ridges.
 */
export function buildKarstHorizon(
  geos: THREE.BufferGeometry[],
  mats: THREE.Material[],
): THREE.Group {
  const group = new THREE.Group();

  const peakMatNear = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x62857f,
      roughness: 0.95,
      metalness: 0.0,
    }),
    mats,
  );
  const peakMatFar = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x8da4a6,
      roughness: 0.98,
      metalness: 0.0,
    }),
    mats,
  );

  // Softly domed rolling Vietnamese mountain profile
  const karstPts = [
    new THREE.Vector2(0.0, 1.0),
    new THREE.Vector2(0.4, 0.95),
    new THREE.Vector2(0.68, 0.72),
    new THREE.Vector2(0.86, 0.36),
    new THREE.Vector2(1.0, 0.0),
  ];
  const karstGeo = trackGeo(new THREE.LatheGeometry(karstPts, 16), geos);

  const count = 20;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + 0.18;
    const isFar = i % 2 === 0;
    const dist = isFar ? 58 + (i % 3) * 6 : 44 + (i % 4) * 4;
    const h = isFar ? 5.6 + (i % 4) * 1.5 : 3.6 + (i % 3) * 1.2;
    const r = h * (1.85 + (i % 3) * 0.35);

    const peak = new THREE.Mesh(karstGeo, isFar ? peakMatFar : peakMatNear);
    peak.position.set(Math.cos(angle) * dist, -0.45, Math.sin(angle) * dist);
    peak.scale.set(r, h, r * (0.78 + (i % 2) * 0.25));
    peak.rotation.y = i * 0.9;
    group.add(peak);
  }

  return group;
}
