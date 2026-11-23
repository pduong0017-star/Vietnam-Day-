import * as THREE from 'three';
import type { SceneTextureBundle } from './textures';

export interface AnimatedFlagItem {
  mesh: THREE.Mesh;
  restPositions: Float32Array;
  width: number;
  phase: number;
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
      opacity: 0.5,
    }),
    mats,
  );
  const disc = new THREE.Mesh(geo, mat);
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.015;
  return disc;
}

/**
 * Sweeping curved Vietnamese terracotta pagoda roof tier with upturned dragon-scroll eaves,
 * carved dark ironwood underside rafters (xà gồ / đấu củng), and gilded ridge cresting.
 */
function createCurvedPagodaRoof(
  baseWidth: number,
  topWidth: number,
  height: number,
  eaveLift: number,
  tileMat: THREE.Material,
  darkWoodMat: THREE.Material,
  goldMat: THREE.Material,
  geos: THREE.BufferGeometry[],
): THREE.Group {
  const roofGroup = new THREE.Group();

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
      const v = iy / segY;
      const yBase = Math.pow(v, 1.38) * height;
      const halfSpan = THREE.MathUtils.lerp(halfBase, halfTop, v);
      const zOut = THREE.MathUtils.lerp(halfBase, halfTop, v);

      for (let ix = 0; ix <= segX; ix++) {
        const u = ix / segX;
        const x = THREE.MathUtils.lerp(-halfSpan, halfSpan, u);
        const edgeDist = Math.abs(u * 2 - 1);
        const cornerCurve = Math.pow(edgeDist, 2.3) * (1 - v) * eaveLift;
        positions.push(x, yBase + cornerCurve, zOut);
        uvs.push(u * 2.4, v * 1.5);
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

    // Carved dark ironwood timber eave fascia + exposed rafter tails underneath
    const fascia = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(baseWidth * 0.88, 0.08, 0.09), geos),
      darkWoodMat,
    );
    const a = (side * Math.PI) / 2;
    fascia.rotation.y = a;
    fascia.position.set(
      Math.sin(a) * (halfBase - 0.14),
      -0.02,
      Math.cos(a) * (halfBase - 0.14),
    );
    roofGroup.add(fascia);
  }

  // Four curved aged-bronze/gold hip ridges with upturned dragon-scroll eaves (đầu đao)
  for (let c = 0; c < 4; c++) {
    const angle = (c * Math.PI) / 2 + Math.PI / 4;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rTop = halfTop * Math.SQRT2;
    const rBase = halfBase * Math.SQRT2;
    const rTip = rBase + 0.36;

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(cos * rTop, height + 0.04, sin * rTop),
      new THREE.Vector3(
        cos * THREE.MathUtils.lerp(rTop, rBase, 0.5),
        height * 0.35 + eaveLift * 0.25,
        sin * THREE.MathUtils.lerp(rTop, rBase, 0.5),
      ),
      new THREE.Vector3(cos * rBase, eaveLift + 0.04, sin * rBase),
      new THREE.Vector3(cos * rTip, eaveLift + 0.34, sin * rTip),
    ]);
    const ridgeGeo = trackGeo(new THREE.TubeGeometry(curve, 16, 0.072, 8, false), geos);
    const ridgeMesh = new THREE.Mesh(ridgeGeo, goldMat);
    ridgeMesh.castShadow = true;
    roofGroup.add(ridgeMesh);

    // Underside ironwood corner bracket (đấu củng)
    const bracket = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.14, 0.16, 0.72), geos),
      darkWoodMat,
    );
    bracket.position.set(cos * (rBase * 0.74), -0.08, sin * (rBase * 0.74));
    bracket.rotation.y = -angle + Math.PI / 2;
    bracket.rotation.x = 0.25;
    roofGroup.add(bracket);
  }

  return roofGroup;
}

/**
 * Hero Monument 1: Khuê Văn Các (Văn Miếu - Quốc Tử Giám) with authentic aged terracotta
 * clay roof tiles, textured cinnabar-lacquer wood, ironwood brackets, and carved stone steps.
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
      color: 0xf4eee3,
      map: textures.stoneMap,
      bumpMap: textures.stoneBump,
      bumpScale: 0.06,
      roughness: 0.9,
      metalness: 0.03,
    }),
    mats,
  );

  const darkStoneMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x5c574d,
      map: textures.stoneMap,
      bumpMap: textures.stoneBump,
      bumpScale: 0.05,
      roughness: 0.88,
      metalness: 0.06,
    }),
    mats,
  );

  const lacquerRedMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.lacquerWoodMap,
      bumpMap: textures.lacquerWoodBump,
      bumpScale: 0.03,
      roughness: 0.56,
      metalness: 0.06,
    }),
    mats,
  );

  const deepWoodMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.darkWoodMap,
      bumpMap: textures.darkWoodBump,
      bumpScale: 0.04,
      roughness: 0.76,
      metalness: 0.04,
    }),
    mats,
  );

  const goldMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xd9a742,
      roughness: 0.28,
      metalness: 0.86,
    }),
    mats,
  );

  const terracottaMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.terracottaTileMap,
      bumpMap: textures.terracottaTileBump,
      bumpScale: 0.09,
      roughness: 0.82,
      metalness: 0.04,
      side: THREE.DoubleSide,
    }),
    mats,
  );

  const glowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffe4a0,
      emissive: 0xffa430,
      emissiveIntensity: 1.0,
      roughness: 0.4,
      metalness: 0.0,
    }),
    mats,
  );

  // 1. 3-tier carved Ninh Bình stone terrace plinth
  const tier1 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(6.9, 0.42, 6.9), geos), stoneMat);
  tier1.position.y = 0.21;
  tier1.receiveShadow = true;
  tier1.castShadow = true;
  group.add(tier1);

  const tier2 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(6.0, 0.36, 6.0), geos), stoneMat);
  tier2.position.y = 0.6;
  tier2.receiveShadow = true;
  tier2.castShadow = true;
  group.add(tier2);

  const tier3 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(5.15, 0.28, 5.15), geos), stoneMat);
  tier3.position.y = 0.92;
  tier3.receiveShadow = true;
  tier3.castShadow = true;
  group.add(tier3);

  // Front & back stone ceremonial stairs with carved flanking cheek-walls (thành bậc đá)
  const stairGeo = trackGeo(new THREE.BoxGeometry(2.15, 0.22, 0.42), geos);
  const cheekGeo = trackGeo(new THREE.BoxGeometry(0.24, 0.56, 1.55), geos);
  const capBallGeo = trackGeo(new THREE.SphereGeometry(0.14, 12, 12), geos);
  for (const dir of [1, -1]) {
    for (let s = 0; s < 4; s++) {
      const step = new THREE.Mesh(stairGeo, stoneMat);
      step.position.set(0, 0.11 + s * 0.24, dir * (3.65 - s * 0.32));
      step.receiveShadow = true;
      step.castShadow = true;
      group.add(step);
    }
    for (const sx of [-1.18, 1.18]) {
      const cheek = new THREE.Mesh(cheekGeo, darkStoneMat);
      cheek.position.set(sx, 0.44, dir * 3.16);
      cheek.rotation.x = dir * 0.42;
      cheek.castShadow = true;
      group.add(cheek);

      const post = new THREE.Mesh(capBallGeo, stoneMat);
      post.position.set(sx, 0.48, dir * 3.84);
      group.add(post);
    }
  }

  // 2. Four lower square stone pier plinths + cinnabar-lacquer timber columns
  const baseY = 1.06;
  const colOffset = 1.72;
  const plinthFootGeo = trackGeo(new THREE.CylinderGeometry(0.38, 0.48, 0.28, 16), geos);
  const colGeo = trackGeo(new THREE.CylinderGeometry(0.25, 0.29, 2.75, 20), geos);
  const goldCollarGeo = trackGeo(new THREE.TorusGeometry(0.28, 0.045, 10, 20), geos);

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const foot = new THREE.Mesh(plinthFootGeo, darkStoneMat);
      foot.position.set(sx * colOffset, baseY + 0.14, sz * colOffset);
      foot.castShadow = true;
      group.add(foot);

      const col = new THREE.Mesh(colGeo, lacquerRedMat);
      col.position.set(sx * colOffset, baseY + 1.56, sz * colOffset);
      col.castShadow = true;
      col.receiveShadow = true;
      group.add(col);

      const collar = new THREE.Mesh(goldCollarGeo, goldMat);
      collar.rotation.x = Math.PI / 2;
      collar.position.set(sx * colOffset, baseY + 2.74, sz * colOffset);
      group.add(collar);
    }
  }

  // Heavy carved dark ironwood cross-beam cornice + ornamental gold fascia band
  const lowerBeam = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(4.48, 0.4, 4.48), geos),
    deepWoodMat,
  );
  lowerBeam.position.y = baseY + 2.98;
  lowerBeam.castShadow = true;
  group.add(lowerBeam);

  const trimBand = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(4.6, 0.1, 4.6), geos),
    goldMat,
  );
  trimBand.position.y = baseY + 2.84;
  group.add(trimBand);

  // 3. Lower sweeping curved terracotta roof skirt
  const lowerRoof = createCurvedPagodaRoof(
    6.55,
    3.52,
    1.22,
    0.5,
    terracottaMat,
    deepWoodMat,
    goldMat,
    geos,
  );
  lowerRoof.position.y = baseY + 3.06;
  group.add(lowerRoof);

  // 4. Upper Khuê Văn pavilion chamber (with carved ironwood corner pilasters & 4 sunburst windows)
  const upperBaseY = baseY + 4.22;
  const chamber = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(3.2, 2.05, 3.2), geos),
    lacquerRedMat,
  );
  chamber.position.y = upperBaseY + 1.02;
  chamber.castShadow = true;
  chamber.receiveShadow = true;
  group.add(chamber);

  const pilasterGeo = trackGeo(new THREE.BoxGeometry(0.18, 2.08, 0.18), geos);
  for (const sx of [-1.58, 1.58]) {
    for (const sz of [-1.58, 1.58]) {
      const pilaster = new THREE.Mesh(pilasterGeo, deepWoodMat);
      pilaster.position.set(sx, upperBaseY + 1.02, sz);
      group.add(pilaster);
    }
  }

  const glowCore = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(1.12, 1.12, 1.5, 24), geos),
    glowMat,
  );
  glowCore.position.y = upperBaseY + 1.05;
  group.add(glowCore);

  // Circular Sunburst Windows (Cửa sổ tròn mặt trời Khuê Văn Các)
  const ringOuterGeo = trackGeo(new THREE.TorusGeometry(0.68, 0.088, 12, 32), geos);
  const ringInnerGeo = trackGeo(new THREE.TorusGeometry(0.24, 0.055, 10, 24), geos);
  const rayGeo = trackGeo(new THREE.BoxGeometry(0.06, 0.44, 0.07), geos);
  const windowDiscGeo = trackGeo(new THREE.CircleGeometry(0.64, 28), geos);

  for (let side = 0; side < 4; side++) {
    const winGroup = new THREE.Group();
    const angle = (side * Math.PI) / 2;

    const disc = new THREE.Mesh(windowDiscGeo, glowMat);
    disc.position.z = 0.01;
    winGroup.add(disc);

    const outerRing = new THREE.Mesh(ringOuterGeo, goldMat);
    outerRing.position.z = 0.045;
    winGroup.add(outerRing);

    const innerRing = new THREE.Mesh(ringInnerGeo, goldMat);
    innerRing.position.z = 0.055;
    winGroup.add(innerRing);

    for (let r = 0; r < 8; r++) {
      const ra = (r * Math.PI) / 4;
      const spoke = new THREE.Mesh(rayGeo, goldMat);
      spoke.position.set(Math.cos(ra) * 0.45, Math.sin(ra) * 0.45, 0.048);
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

  // Carved wooden balcony balustrade with vertical spindles around upper chamber
  const railGeo = trackGeo(new THREE.BoxGeometry(3.72, 0.09, 0.09), geos);
  const spindleGeo = trackGeo(new THREE.BoxGeometry(0.06, 0.34, 0.06), geos);
  for (let side = 0; side < 4; side++) {
    const a = (side * Math.PI) / 2;
    const railGroup = new THREE.Group();
    railGroup.rotation.y = a;
    railGroup.position.set(Math.sin(a) * 1.84, upperBaseY + 0.14, Math.cos(a) * 1.84);
    const topRail = new THREE.Mesh(railGeo, goldMat);
    topRail.position.y = 0.22;
    railGroup.add(topRail);
    for (let sp = -3; sp <= 3; sp++) {
      const spindle = new THREE.Mesh(spindleGeo, deepWoodMat);
      spindle.position.set(sp * 0.52, 0.04, 0);
      railGroup.add(spindle);
    }
    group.add(railGroup);
  }

  // 5. Upper curved terracotta pagoda roof + sculpted golden lotus finial
  const upperRoof = createCurvedPagodaRoof(
    5.55,
    0.46,
    1.98,
    0.62,
    terracottaMat,
    deepWoodMat,
    goldMat,
    geos,
  );
  upperRoof.position.y = upperBaseY + 1.98;
  group.add(upperRoof);

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
  const finial = new THREE.Mesh(trackGeo(new THREE.LatheGeometry(finialPts, 24), geos), goldMat);
  finial.position.y = upperBaseY + 3.92;
  finial.castShadow = true;
  group.add(finial);

  // Hanging glowing crimson-gold ceremonial lantern under pavilion arch
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
  innerLantern.position.y = baseY + 1.82;
  group.add(innerLantern);

  group.add(makeContactShadow(4.5, textures.contactShadowMap, geos, mats));

  return { group, glowMat };
}

/**
 * Hero Monument 2 (NEW): Chùa Một Cột (One Pillar Pagoda — Diên Hựu Tự)
 * Iconic lotus-shaped wooden pagoda perched on a single carved stone pillar rising from the lotus pond.
 */
export function buildOnePillarPagoda(
  textures: SceneTextureBundle,
  geos: THREE.BufferGeometry[],
  mats: THREE.Material[],
): { group: THREE.Group; glowMat: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();
  group.name = 'OnePillarPagoda';

  const stoneMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xd8cfc0,
      map: textures.stoneMap,
      bumpMap: textures.stoneBump,
      bumpScale: 0.065,
      roughness: 0.9,
      metalness: 0.03,
    }),
    mats,
  );
  const darkWoodMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.darkWoodMap,
      bumpMap: textures.darkWoodBump,
      bumpScale: 0.04,
      roughness: 0.78,
      metalness: 0.04,
    }),
    mats,
  );
  const lacquerMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.lacquerWoodMap,
      bumpMap: textures.lacquerWoodBump,
      bumpScale: 0.03,
      roughness: 0.56,
      metalness: 0.06,
    }),
    mats,
  );
  const terracottaMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.terracottaTileMap,
      bumpMap: textures.terracottaTileBump,
      bumpScale: 0.09,
      roughness: 0.82,
      metalness: 0.04,
      side: THREE.DoubleSide,
    }),
    mats,
  );
  const goldMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xdca944,
      roughness: 0.28,
      metalness: 0.86,
    }),
    mats,
  );
  const glowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffe49c,
      emissive: 0xff9d2e,
      emissiveIntensity: 1.05,
      roughness: 0.38,
      metalness: 0.0,
    }),
    mats,
  );

  // 1. Submerged & waterline carved mossy stone lotus plinth
  const baseDisc = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(1.5, 1.85, 0.52, 20), geos),
    stoneMat,
  );
  baseDisc.position.y = 0.06;
  baseDisc.receiveShadow = true;
  group.add(baseDisc);

  // 2. Iconic sculpted cylindrical stone pillar (Cột đá đơn)
  const pillar = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.62, 0.7, 2.75, 24), geos),
    stoneMat,
  );
  pillar.position.y = 1.55;
  pillar.castShadow = true;
  pillar.receiveShadow = true;
  group.add(pillar);

  // Carved stone collar ring
  const collar = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.68, 0.1, 10, 24), geos),
    stoneMat,
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 2.78;
  group.add(collar);

  // 3. Eight radiating ironwood diagonal timber struts supporting the Lotus Blossom shrine (Hệ thanh chống gỗ lim)
  const strutGeo = trackGeo(new THREE.BoxGeometry(0.14, 1.55, 0.14), geos);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const strut = new THREE.Mesh(strutGeo, darkWoodMat);
    strut.position.set(Math.cos(a) * 0.92, 2.52, Math.sin(a) * 0.92);
    strut.rotation.y = -a;
    strut.rotation.z = -0.58;
    strut.castShadow = true;
    group.add(strut);
  }

  // 4. Elevated wooden lotus shrine deck & balustrade
  const deckY = 3.12;
  const deck = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(3.25, 0.24, 3.25), geos),
    darkWoodMat,
  );
  deck.position.y = deckY;
  deck.castShadow = true;
  deck.receiveShadow = true;
  group.add(deck);

  // Timber shrine hall (Liên Hoa Đài)
  const hall = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.35, 1.52, 2.35), geos),
    lacquerMat,
  );
  hall.position.y = deckY + 0.88;
  hall.castShadow = true;
  group.add(hall);

  // Glowing golden lattice shrine doors on 4 sides
  const doorFrameGeo = trackGeo(new THREE.BoxGeometry(1.12, 1.08, 0.08), geos);
  const doorGlowGeo = trackGeo(new THREE.PlaneGeometry(0.92, 0.92), geos);
  for (let s = 0; s < 4; s++) {
    const a = (s * Math.PI) / 2;
    const dg = new THREE.Group();
    dg.rotation.y = a;
    dg.position.set(Math.sin(a) * 1.19, deckY + 0.82, Math.cos(a) * 1.19);
    dg.add(new THREE.Mesh(doorFrameGeo, darkWoodMat));
    const pane = new THREE.Mesh(doorGlowGeo, glowMat);
    pane.position.z = 0.045;
    dg.add(pane);
    const barV = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.05, 0.94, 0.03), geos), goldMat);
    barV.position.z = 0.055;
    dg.add(barV);
    const barH = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.94, 0.05, 0.03), geos), goldMat);
    barH.position.z = 0.055;
    dg.add(barH);
    group.add(dg);
  }

  // Balcony railing around deck
  const railGeo = trackGeo(new THREE.BoxGeometry(3.3, 0.08, 0.08), geos);
  for (let s = 0; s < 4; s++) {
    const a = (s * Math.PI) / 2;
    const r = new THREE.Mesh(railGeo, goldMat);
    r.rotation.y = a;
    r.position.set(Math.sin(a) * 1.6, deckY + 0.44, Math.cos(a) * 1.6);
    group.add(r);
  }

  // 5. Sweeping curved terracotta pagoda roof + golden lotus flame finial (Lưỡng long / bầu rượu)
  const roof = createCurvedPagodaRoof(
    4.65,
    0.58,
    1.62,
    0.55,
    terracottaMat,
    darkWoodMat,
    goldMat,
    geos,
  );
  roof.position.y = deckY + 1.6;
  group.add(roof);

  const crest = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.24, 14, 14), geos),
    goldMat,
  );
  crest.position.y = deckY + 3.36;
  group.add(crest);

  // Iconic small stone stair causeway leading up to the pagoda entrance on the +X side (toward main island)
  const stepGeo = trackGeo(new THREE.BoxGeometry(0.45, 0.24, 1.1), geos);
  for (let s = 0; s < 6; s++) {
    const step = new THREE.Mesh(stepGeo, stoneMat);
    step.position.set(1.85 + s * 0.38, deckY - 0.35 - s * 0.46, 0);
    step.castShadow = true;
    step.receiveShadow = true;
    group.add(step);
  }

  return { group, glowMat };
}

/**
 * Hero Monument 3: Cột Cờ Hà Nội (Hanoi Flag Tower) with weathered Citadel brick,
 * stone battlements, arched gateways, and waving 3D Vietnamese National Flag.
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
      bumpScale: 0.08,
      roughness: 0.9,
      metalness: 0.03,
    }),
    mats,
  );

  const stoneTrimMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xd8cbb4,
      map: textures.stoneMap,
      bumpMap: textures.stoneBump,
      bumpScale: 0.04,
      roughness: 0.86,
      metalness: 0.04,
    }),
    mats,
  );

  const darkArchMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x201510,
      roughness: 0.94,
      metalness: 0.0,
    }),
    mats,
  );

  const brassMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xdcb04c,
      roughness: 0.24,
      metalness: 0.9,
    }),
    mats,
  );

  const flagMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.flagMap,
      roughness: 0.66,
      metalness: 0.03,
      side: THREE.DoubleSide,
    }),
    mats,
  );

  const tiers = [
    { topR: 2.38, botR: 2.7, h: 1.5, y: 0.75 },
    { topR: 1.74, botR: 2.02, h: 1.35, y: 2.175 },
    { topR: 1.24, botR: 1.46, h: 1.15, y: 3.425 },
  ];

  const merlonGeo = trackGeo(new THREE.BoxGeometry(0.28, 0.22, 0.16), geos);

  tiers.forEach((t, idx) => {
    const geo = trackGeo(new THREE.CylinderGeometry(t.topR, t.botR, t.h, 4), geos);
    geo.rotateY(Math.PI / 4);
    const mesh = new THREE.Mesh(geo, brickMat);
    mesh.position.y = t.y;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    const ledgeW = t.topR * Math.SQRT2 + 0.18;
    const ledge = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(ledgeW, 0.15, ledgeW), geos),
      stoneTrimMat,
    );
    ledge.position.y = t.y + t.h / 2 + 0.05;
    ledge.castShadow = true;
    group.add(ledge);

    // Carved stone parapet battlements (tường hoa răng cưa) around each Citadel tier
    const halfL = ledgeW / 2 - 0.12;
    const merlonsPerSide = 5 - idx;
    for (let side = 0; side < 4; side++) {
      const a = (side * Math.PI) / 2;
      for (let m = 0; m < merlonsPerSide; m++) {
        const frac = merlonsPerSide === 1 ? 0 : (m / (merlonsPerSide - 1)) * 2 - 1;
        const localX = frac * (halfL - 0.18);
        const merlon = new THREE.Mesh(merlonGeo, stoneTrimMat);
        const rx = localX * Math.cos(a) + halfL * Math.sin(a);
        const rz = -localX * Math.sin(a) + halfL * Math.cos(a);
        merlon.position.set(rx, t.y + t.h / 2 + 0.22, rz);
        merlon.rotation.y = a;
        group.add(merlon);
      }
    }

    // Arched gateway portal with semicircular arch top & carved stone surround
    if (idx < 2) {
      const aw = 0.56 - idx * 0.1;
      const ah = 0.74 - idx * 0.12;
      const az = (t.topR + t.botR) * 0.355 + 0.04;
      const archRect = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(aw, ah, 0.16), geos),
        darkArchMat,
      );
      archRect.position.set(0, t.y - 0.18, az);
      group.add(archRect);

      const archTop = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(aw / 2, aw / 2, 0.16, 16), geos),
        darkArchMat,
      );
      archTop.rotation.x = Math.PI / 2;
      archTop.position.set(0, t.y - 0.18 + ah / 2, az);
      group.add(archTop);

      const archRim = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(aw / 2 + 0.04, 0.045, 8, 16, Math.PI), geos),
        stoneTrimMat,
      );
      archRim.position.set(0, t.y - 0.18 + ah / 2, az + 0.07);
      group.add(archRim);
    }
  });

  // Octagonal fluted central shaft
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
    trackGeo(new THREE.CylinderGeometry(0.96, 0.84, 0.96, 8), geos),
    brickMat,
  );
  crown.position.y = 7.56;
  crown.castShadow = true;
  group.add(crown);

  const crownRim = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(1.1, 1.04, 0.18, 8), geos),
    stoneTrimMat,
  );
  crownRim.position.y = 8.1;
  group.add(crownRim);

  const portGeo = trackGeo(new THREE.BoxGeometry(0.24, 0.42, 0.12), geos);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const port = new THREE.Mesh(portGeo, darkArchMat);
    port.rotation.y = a;
    port.position.set(Math.sin(a) * 0.88, 7.56, Math.cos(a) * 0.88);
    group.add(port);
  }

  // Tall brushed-brass flagpole + golden orb finial
  const poleH = 3.55;
  const pole = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.055, 0.088, poleH, 12), geos),
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

  // Waving 3D Vietnamese National Flag
  const flagW = 3.35;
  const flagH = 2.22;
  const flagGeo = trackGeo(new THREE.PlaneGeometry(flagW, flagH, 24, 12), geos);
  flagGeo.translate(flagW / 2 + 0.06, 0, 0);
  const flagRestPositions = new Float32Array(
    (flagGeo.attributes.position as THREE.BufferAttribute).array,
  );

  const flagMesh = new THREE.Mesh(flagGeo, flagMat);
  flagMesh.position.set(0, 8.18 + poleH - flagH / 2 - 0.12, 0);
  flagMesh.rotation.y = Math.PI + 0.34;
  flagMesh.castShadow = true;
  group.add(flagMesh);

  group.add(makeContactShadow(3.2, textures.contactShadowMap, geos, mats));

  return { group, flagMesh, flagRestPositions };
}

/**
 * Hero Monument 4: Ceremonial Cultural Stele on a Sculpted Heritage Stone Tortoise (Bia Rùa Văn Miếu)
 * featuring Cố Tổng Bí thư Nguyễn Phú Trọng's quote, curved pediment arch, and bronze incense burners.
 */
export function buildCulturalStele(
  textures: SceneTextureBundle,
  geos: THREE.BufferGeometry[],
  mats: THREE.Material[],
): THREE.Group {
  const group = new THREE.Group();

  const stoneMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe2d8c5,
      map: textures.stoneMap,
      bumpMap: textures.stoneBump,
      bumpScale: 0.05,
      roughness: 0.88,
      metalness: 0.04,
    }),
    mats,
  );

  const tortoiseStoneMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x676b5e,
      map: textures.stoneMap,
      bumpMap: textures.stoneBump,
      bumpScale: 0.07,
      roughness: 0.84,
      metalness: 0.08,
    }),
    mats,
  );

  const goldMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xdca944,
      roughness: 0.28,
      metalness: 0.86,
    }),
    mats,
  );

  const bronzeMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x7c5924,
      roughness: 0.34,
      metalness: 0.84,
    }),
    mats,
  );

  const plaqueMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.steleMap,
      roughness: 0.44,
      metalness: 0.1,
    }),
    mats,
  );

  // Carved stone floor plinth
  const plinth = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.25, 0.2, 1.35), geos),
    stoneMat,
  );
  plinth.position.y = 0.1;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  // Sculpted stylized Heritage Stone Tortoise (Rùa đá Văn Miếu) bearing the stele
  const shell = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.72, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), geos),
    tortoiseStoneMat,
  );
  shell.scale.set(1.22, 0.62, 0.92);
  shell.position.set(0, 0.18, 0.04);
  shell.castShadow = true;
  group.add(shell);

  // Tortoise head peeking forward with dignity
  const head = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.2, 12, 10), geos),
    tortoiseStoneMat,
  );
  head.scale.set(0.95, 0.8, 1.25);
  head.position.set(0, 0.34, 0.78);
  group.add(head);

  // Four grounded tortoise legs
  const legGeo = trackGeo(new THREE.CylinderGeometry(0.12, 0.15, 0.24, 10), geos);
  for (const lx of [-0.66, 0.66]) {
    for (const lz of [-0.36, 0.42]) {
      const leg = new THREE.Mesh(legGeo, tortoiseStoneMat);
      leg.position.set(lx, 0.24, lz);
      group.add(leg);
    }
  }

  // Main carved stone stele slab resting atop the tortoise back
  const slab = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(1.56, 2.24, 0.26), geos),
    stoneMat,
  );
  slab.position.y = 1.66;
  slab.castShadow = true;
  group.add(slab);

  // Curved traditional cloud-scroll pediment crown (trán bia cong) cleanly flush with slab
  const archShape = new THREE.Shape();
  archShape.moveTo(-0.78, 0);
  archShape.absellipse(0, 0, 0.78, 0.3, 0, Math.PI, false, 0);
  archShape.lineTo(-0.78, 0);
  const archGeo = trackGeo(
    new THREE.ExtrudeGeometry(archShape, { depth: 0.26, bevelEnabled: false, curveSegments: 24 }),
    geos,
  );
  archGeo.translate(0, 0, -0.13);
  const archCrown = new THREE.Mesh(archGeo, stoneMat);
  archCrown.position.set(0, 2.78, 0);
  archCrown.castShadow = true;
  group.add(archCrown);

  const goldArchRim = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.785, 0.052, 8, 24, Math.PI), geos),
    goldMat,
  );
  goldArchRim.scale.set(1, 0.385, 1);
  goldArchRim.position.set(0, 2.78, 0.135);
  group.add(goldArchRim);

  // Crisp crimson-and-gold lacquer plaque
  const plaque = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(1.38, 2.06), geos),
    plaqueMat,
  );
  plaque.position.set(0, 1.66, 0.142);
  group.add(plaque);

  // Two cast-bronze tripod incense burners (Lư Hương Đồng) flanking the stele
  const urnPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.18, 0.04),
    new THREE.Vector2(0.12, 0.16),
    new THREE.Vector2(0.32, 0.34),
    new THREE.Vector2(0.28, 0.56),
    new THREE.Vector2(0.22, 0.64),
    new THREE.Vector2(0.34, 0.72),
    new THREE.Vector2(0.25, 0.74),
  ];
  const urnGeo = trackGeo(new THREE.LatheGeometry(urnPts, 20), geos);
  const emberMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffb347,
      emissive: 0xff6e1a,
      emissiveIntensity: 1.2,
      roughness: 0.6,
    }),
    mats,
  );
  const emberGeo = trackGeo(new THREE.CircleGeometry(0.22, 14), geos);
  for (const side of [-1, 1]) {
    const urn = new THREE.Mesh(urnGeo, bronzeMat);
    urn.position.set(side * 1.54, 0.0, 0.25);
    urn.castShadow = true;
    group.add(urn);

    const ember = new THREE.Mesh(emberGeo, emberMat);
    ember.rotation.x = -Math.PI / 2;
    ember.position.set(side * 1.54, 0.71, 0.25);
    group.add(ember);
  }

  group.add(makeContactShadow(1.95, textures.contactShadowMap, geos, mats));
  group.scale.setScalar(1.16);
  return group;
}

/**
 * Hero Prop (NEW): Sculpted 3D Đông Sơn Bronze Drum mounted on a Carved Ceremonial Timber Cradle.
 */
export function buildBronzeDrumProp(
  textures: SceneTextureBundle,
  geos: THREE.BufferGeometry[],
  mats: THREE.Material[],
): THREE.Group {
  const group = new THREE.Group();

  const bronzeBodyMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x8a6934,
      bumpMap: textures.dongSonBump,
      bumpScale: 0.03,
      roughness: 0.36,
      metalness: 0.82,
    }),
    mats,
  );
  const drumTopMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.dongSonMap,
      bumpMap: textures.dongSonBump,
      bumpScale: 0.05,
      roughness: 0.34,
      metalness: 0.8,
    }),
    mats,
  );
  const standMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.darkWoodMap,
      roughness: 0.74,
      metalness: 0.05,
    }),
    mats,
  );
  const goldMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xdca944,
      roughness: 0.28,
      metalness: 0.86,
    }),
    mats,
  );

  // Carved wooden base stand
  const standBase = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.62, 0.72, 0.22, 16), geos),
    standMat,
  );
  standBase.position.y = 0.11;
  standBase.castShadow = true;
  group.add(standBase);

  // Hourglass Đông Sơn bronze drum profile via LatheGeometry
  const drumPts = [
    new THREE.Vector2(0.46, 0.0),
    new THREE.Vector2(0.42, 0.14),
    new THREE.Vector2(0.32, 0.36),
    new THREE.Vector2(0.36, 0.56),
    new THREE.Vector2(0.56, 0.74),
    new THREE.Vector2(0.58, 0.86),
    new THREE.Vector2(0.54, 0.9),
  ];
  const drumBody = new THREE.Mesh(
    trackGeo(new THREE.LatheGeometry(drumPts, 24), geos),
    bronzeBodyMat,
  );
  drumBody.position.y = 0.2;
  drumBody.castShadow = true;
  group.add(drumBody);

  // Engraved bronze tympanum face on top
  const tympanum = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.56, 0.56, 0.04, 24), geos),
    drumTopMat,
  );
  tympanum.position.y = 1.1;
  group.add(tympanum);

  // Four bronze ceremonial handles around waist
  const handleGeo = trackGeo(new THREE.TorusGeometry(0.08, 0.022, 8, 12), geos);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const h = new THREE.Mesh(handleGeo, goldMat);
    h.position.set(Math.cos(a) * 0.44, 0.84, Math.sin(a) * 0.44);
    h.rotation.y = -a + Math.PI / 2;
    group.add(h);
  }

  return group;
}

/**
 * Hero Prop (NEW): Traditional Vietnamese Five-Color Festival Flag (Cờ Hội Ngũ Sắc).
 * Fluttering silk square flag on a lacquered staff with golden spearhead finial.
 */
export function buildFestivalFlagPole(
  textures: SceneTextureBundle,
  geos: THREE.BufferGeometry[],
  mats: THREE.Material[],
  phase: number,
): { group: THREE.Group; flagItem: AnimatedFlagItem } {
  const group = new THREE.Group();

  const stoneMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x7c7466,
      map: textures.stoneMap,
      roughness: 0.88,
      metalness: 0.04,
    }),
    mats,
  );
  const poleMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.lacquerWoodMap,
      roughness: 0.55,
      metalness: 0.05,
    }),
    mats,
  );
  const goldMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe0b24a,
      roughness: 0.26,
      metalness: 0.88,
    }),
    mats,
  );
  const flagMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.festivalFlagMap,
      roughness: 0.65,
      metalness: 0.04,
      side: THREE.DoubleSide,
    }),
    mats,
  );

  // Carved stone flag socket
  const socket = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.2, 0.28, 0.32, 12), geos),
    stoneMat,
  );
  socket.position.y = 0.16;
  group.add(socket);

  // Slightly angled festive bamboo-lacquer staff
  const staffHolder = new THREE.Group();
  staffHolder.rotation.z = -0.14;
  group.add(staffHolder);

  const staffH = 4.65;
  const staff = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.042, 0.062, staffH, 10), geos),
    poleMat,
  );
  staff.position.y = staffH / 2 + 0.12;
  staff.castShadow = true;
  staffHolder.add(staff);

  // Golden spearhead finial & crimson tassel
  const spear = new THREE.Mesh(
    trackGeo(new THREE.ConeGeometry(0.085, 0.38, 8), geos),
    goldMat,
  );
  spear.position.y = staffH + 0.3;
  staffHolder.add(spear);

  // Square five-color festival flag (Cờ vuông lễ hội)
  const flagW = 1.48;
  const flagH = 1.42;
  const flagGeo = trackGeo(new THREE.PlaneGeometry(flagW, flagH, 14, 10), geos);
  flagGeo.translate(flagW / 2 + 0.04, 0, 0);
  const restPositions = new Float32Array(
    (flagGeo.attributes.position as THREE.BufferAttribute).array,
  );
  const flagMesh = new THREE.Mesh(flagGeo, flagMat);
  flagMesh.position.set(0, staffH - flagH / 2 - 0.05, 0);
  flagMesh.castShadow = true;
  staffHolder.add(flagMesh);

  return {
    group,
    flagItem: { mesh: flagMesh, restPositions, width: flagW, phase },
  };
}

/**
 * Hero Prop (NEW): Vietnamese Festival Blossom Tree — Hoa Đào (pink peach) or Hoa Mai (golden apricot).
 * Organic gnarled ironwood trunk, spreading forked limbs, and layered warm blossom clusters.
 */
export function buildBlossomTree(
  variant: 'peach' | 'apricot',
  scale: number,
  textures: SceneTextureBundle,
  geos: THREE.BufferGeometry[],
  mats: THREE.Material[],
): THREE.Group {
  const group = new THREE.Group();

  const barkMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.darkWoodMap,
      bumpMap: textures.darkWoodBump,
      bumpScale: 0.06,
      roughness: 0.9,
      metalness: 0.02,
    }),
    mats,
  );

  const blossomCardMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: variant === 'peach' ? textures.peachBlossomMap : textures.apricotBlossomMap,
      alphaTest: 0.32,
      roughness: 0.76,
      metalness: 0.0,
      emissive: variant === 'peach' ? 0x5c1a2e : 0x6e4a0a,
      emissiveIntensity: 0.14,
      side: THREE.DoubleSide,
    }),
    mats,
  );

  // Curved organic main trunk
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.24, 1.05, 0.12),
    new THREE.Vector3(-0.1, 2.25, -0.06),
    new THREE.Vector3(0.18, 3.25, 0.18),
  ]);
  const trunk = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(trunkCurve, 14, 0.18, 9, false), geos),
    barkMat,
  );
  trunk.castShadow = true;
  group.add(trunk);

  // Gnarled root flare base
  const rootBase = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.19, 0.34, 0.5, 10), geos),
    barkMat,
  );
  rootBase.position.y = 0.25;
  group.add(rootBase);

  // Spreading gnarled branches
  const branchSpecs = [
    {
      pts: [
        new THREE.Vector3(0.08, 1.9, 0.04),
        new THREE.Vector3(1.1, 2.6, 0.5),
        new THREE.Vector3(1.95, 3.15, 0.75),
      ],
      radius: 0.09,
    },
    {
      pts: [
        new THREE.Vector3(-0.04, 2.15, -0.04),
        new THREE.Vector3(-1.15, 2.9, 0.38),
        new THREE.Vector3(-1.88, 3.38, 0.62),
      ],
      radius: 0.09,
    },
    {
      pts: [
        new THREE.Vector3(0.04, 2.4, -0.04),
        new THREE.Vector3(-0.45, 3.25, -1.05),
        new THREE.Vector3(-0.78, 3.85, -1.65),
      ],
      radius: 0.08,
    },
    {
      pts: [
        new THREE.Vector3(0.14, 2.75, 0.12),
        new THREE.Vector3(0.75, 3.65, -0.72),
        new THREE.Vector3(1.22, 4.18, -1.15),
      ],
      radius: 0.075,
    },
    {
      pts: [
        new THREE.Vector3(0.15, 3.05, 0.16),
        new THREE.Vector3(0.05, 3.9, 0.65),
        new THREE.Vector3(-0.18, 4.45, 0.92),
      ],
      radius: 0.07,
    },
  ];

  // Delicate intersecting botanical blossom sprig cards (zero spherical/plastic blobs)
  const sprigGeo = trackGeo(new THREE.PlaneGeometry(1.55, 1.55), geos);

  const addBlossomSprigCluster = (
    x: number,
    y: number,
    z: number,
    clusterScale: number,
    yawSeed: number,
  ) => {
    const holder = new THREE.Group();
    holder.position.set(x, y, z);
    holder.scale.setScalar(clusterScale);

    // Three crossed angled planes give lush 3D volume from every orbit angle
    for (let k = 0; k < 3; k++) {
      const card = new THREE.Mesh(sprigGeo, blossomCardMat);
      card.rotation.y = yawSeed + (k * Math.PI) / 3;
      card.rotation.x = (k - 1) * 0.28;
      card.rotation.z = (k === 1 ? 0.18 : -0.14);
      holder.add(card);
    }
    group.add(holder);
  };

  branchSpecs.forEach((b, bi) => {
    const curve = new THREE.CatmullRomCurve3(b.pts);
    const mesh = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(curve, 10, b.radius, 7, false), geos),
      barkMat,
    );
    mesh.castShadow = true;
    group.add(mesh);

    const tip = b.pts[b.pts.length - 1];
    const mid = b.pts[1];
    addBlossomSprigCluster(tip.x, tip.y + 0.12, tip.z, 1.05, bi * 0.9);
    addBlossomSprigCluster(
      tip.x * 0.72 + mid.x * 0.28,
      tip.y + 0.25,
      tip.z * 0.72 + mid.z * 0.28,
      0.86,
      bi * 1.4 + 0.5,
    );
    addBlossomSprigCluster(mid.x, mid.y + 0.28, mid.z, 0.82, bi * 0.6 + 1.2);
  });

  // Airy crown blossom canopy
  addBlossomSprigCluster(0.12, 4.18, 0.14, 1.24, 0.4);
  addBlossomSprigCluster(-0.45, 3.85, 0.45, 0.95, 1.6);
  addBlossomSprigCluster(0.55, 3.72, -0.32, 0.92, 2.3);

  group.scale.setScalar(scale);
  return group;
}

/**
 * Hero Prop (NEW): Traditional Wooden Vietnamese Sampan Boat (Thuyền Hoa Đăng)
 * gently bobbing on the lotus lake with glowing silk lanterns & fresh lotus blossoms.
 */
export function buildLotusSampan(
  textures: SceneTextureBundle,
  geos: THREE.BufferGeometry[],
  mats: THREE.Material[],
): { group: THREE.Group; lanternMat: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();

  const hullMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.darkWoodMap,
      bumpMap: textures.darkWoodBump,
      bumpScale: 0.05,
      roughness: 0.82,
      metalness: 0.04,
      side: THREE.DoubleSide,
    }),
    mats,
  );
  const redTrimMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.lacquerWoodMap,
      roughness: 0.56,
      metalness: 0.06,
    }),
    mats,
  );
  const lanternMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffc66d,
      emissive: 0xff8a24,
      emissiveIntensity: 1.25,
      roughness: 0.4,
    }),
    mats,
  );
  const goldMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe0b24a,
      roughness: 0.28,
      metalness: 0.86,
    }),
    mats,
  );

  // Curved wooden hull built via custom lofted ribs
  const len = 3.8;
  const segL = 14;
  const segW = 8;
  const hullGeo = new THREE.BufferGeometry();
  const pos: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];

  for (let il = 0; il <= segL; il++) {
    const u = il / segL; // 0 = stern, 1 = bow
    const z = (u - 0.5) * len;
    const beamFactor = Math.sin(u * Math.PI);
    const halfBeam = 0.62 * Math.pow(beamFactor, 0.72);
    const sheerLift = Math.pow(Math.abs(u * 2 - 1), 2.1) * 0.48;

    for (let iw = 0; iw <= segW; iw++) {
      const v = iw / segW; // 0 = port rim, 0.5 = keel, 1 = starboard rim
      const s = v * 2 - 1;
      const x = s * halfBeam;
      const y = Math.pow(Math.abs(s), 1.8) * 0.42 + sheerLift - 0.08;
      pos.push(x, y, z);
      uvs.push(u * 2, v);
    }
  }

  const stride = segW + 1;
  for (let il = 0; il < segL; il++) {
    for (let iw = 0; iw < segW; iw++) {
      const a = il * stride + iw;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      idx.push(a, c, d, a, d, b);
    }
  }
  hullGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  hullGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  hullGeo.setIndex(idx);
  hullGeo.computeVertexNormals();
  trackGeo(hullGeo, geos);

  const hull = new THREE.Mesh(hullGeo, hullMat);
  hull.castShadow = true;
  hull.receiveShadow = true;
  group.add(hull);

  // Cross-thwart wooden benches inside sampan
  for (const bz of [-0.75, 0.0, 0.75]) {
    const bench = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.92, 0.06, 0.24), geos),
      hullMat,
    );
    bench.position.set(0, 0.22, bz);
    group.add(bench);
  }

  // Bowed bamboo/lacquer prow lantern pole carrying a glowing Hội An silk lantern
  const poleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.35, 1.38),
    new THREE.Vector3(0, 1.15, 1.72),
    new THREE.Vector3(0, 1.38, 2.02),
  ]);
  const prowPole = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(poleCurve, 10, 0.028, 7, false), geos),
    redTrimMat,
  );
  group.add(prowPole);

  const lanternGeo = trackGeo(new THREE.SphereGeometry(0.2, 14, 12), geos);
  const prowLantern = new THREE.Mesh(lanternGeo, lanternMat);
  prowLantern.scale.set(0.95, 1.18, 0.95);
  prowLantern.position.set(0, 1.12, 2.02);
  group.add(prowLantern);

  const prowCap = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 10), geos),
    goldMat,
  );
  prowCap.position.set(0, 1.34, 2.02);
  group.add(prowCap);

  // Glowing lotus basket & resting bamboo oar inside the boat
  const centerLantern = new THREE.Mesh(lanternGeo, lanternMat);
  centerLantern.scale.set(0.85, 0.75, 0.85);
  centerLantern.position.set(0, 0.38, -0.15);
  group.add(centerLantern);

  const oar = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.025, 0.032, 2.8, 8), geos),
    hullMat,
  );
  oar.rotation.x = Math.PI / 2 - 0.1;
  oar.rotation.z = 0.16;
  oar.position.set(0.32, 0.36, -0.3);
  group.add(oar);

  return { group, lanternMat };
}

/**
 * Upgraded Natural Multi-Scale Vietnamese Lotus Pond Cluster (Đầm Sen)
 * Includes veined lily pads, raised stemmed leaves, open gradient blossoms, and pink lotus buds.
 */
export function buildLotusCluster(
  scale: number,
  petalTint: number,
  textures: SceneTextureBundle,
  geos: THREE.BufferGeometry[],
  mats: THREE.Material[],
): THREE.Group {
  const group = new THREE.Group();

  const padShape = new THREE.Shape();
  padShape.moveTo(0, 0);
  padShape.absarc(0, 0, 1.02, 0.16, Math.PI * 2 - 0.16, false);
  padShape.lineTo(0, 0);
  const padGeo = trackGeo(
    new THREE.ExtrudeGeometry(padShape, {
      depth: 0.028,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.02,
      bevelSegments: 2,
    }),
    geos,
  );
  padGeo.rotateX(Math.PI / 2);

  const padMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.lotusPadMap,
      roughness: 0.74,
      metalness: 0.02,
    }),
    mats,
  );

  const stemMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x35643e,
      roughness: 0.78,
      metalness: 0.02,
    }),
    mats,
  );

  // Three organic varied floating pads
  const pad1 = new THREE.Mesh(padGeo, padMat);
  pad1.position.y = 0.04;
  pad1.receiveShadow = true;
  group.add(pad1);

  const pad2 = new THREE.Mesh(padGeo, padMat);
  pad2.scale.set(0.68, 1, 0.68);
  pad2.position.set(0.84, 0.03, 0.44);
  pad2.rotation.y = 2.1;
  group.add(pad2);

  const pad3 = new THREE.Mesh(padGeo, padMat);
  pad3.scale.set(0.56, 1, 0.56);
  pad3.position.set(-0.74, 0.025, 0.56);
  pad3.rotation.y = -1.2;
  group.add(pad3);

  // Tall-stemmed cupped raised lotus leaf (lá sen vươn cao) for botanical realism
  const tallStem = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.024, 0.03, 0.72, 6), geos),
    stemMat,
  );
  tallStem.position.set(-0.48, 0.36, -0.38);
  tallStem.rotation.z = 0.18;
  group.add(tallStem);

  const raisedLeaf = new THREE.Mesh(
    trackGeo(new THREE.ConeGeometry(0.52, 0.16, 14, 1, true), geos),
    padMat,
  );
  raisedLeaf.rotation.x = Math.PI;
  raisedLeaf.position.set(-0.54, 0.72, -0.38);
  raisedLeaf.rotation.z = 0.14;
  group.add(raisedLeaf);

  // Softly curved lotus petals
  const petalShape = new THREE.Shape();
  petalShape.moveTo(0, 0);
  petalShape.bezierCurveTo(0.26, 0.16, 0.24, 0.56, 0, 0.88);
  petalShape.bezierCurveTo(-0.24, 0.56, -0.26, 0.16, 0, 0);

  const petalGeo = trackGeo(
    new THREE.ExtrudeGeometry(petalShape, {
      depth: 0.018,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 2,
    }),
    geos,
  );

  const outerPetalMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: petalTint,
      map: textures.lotusPetalMap,
      roughness: 0.58,
      metalness: 0.01,
      emissive: 0x56162a,
      emissiveIntensity: 0.12,
    }),
    mats,
  );

  const innerPetalMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.lotusPetalMap,
      roughness: 0.5,
      metalness: 0.01,
      emissive: 0x681f35,
      emissiveIntensity: 0.15,
    }),
    mats,
  );

  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const holder = new THREE.Group();
    holder.rotation.y = a;
    const p = new THREE.Mesh(petalGeo, outerPetalMat);
    p.position.set(0, 0.08, 0.11);
    p.rotation.x = 1.12;
    holder.add(p);
    group.add(holder);
  }

  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.24;
    const holder = new THREE.Group();
    holder.rotation.y = a;
    const p = new THREE.Mesh(petalGeo, innerPetalMat);
    p.scale.set(0.76, 0.78, 0.78);
    p.position.set(0, 0.12, 0.08);
    p.rotation.x = 0.56;
    holder.add(p);
    group.add(holder);
  }

  // Golden lotus seed pod
  const stamenMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xedc044,
      emissive: 0xc98418,
      emissiveIntensity: 0.35,
      roughness: 0.52,
      metalness: 0.14,
    }),
    mats,
  );
  const pod = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.18, 0.09, 0.2, 14), geos),
    stamenMat,
  );
  pod.position.y = 0.24;
  group.add(pod);

  // Accompanying rising lotus bud (búp sen hồng) on slender stem
  const budStem = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.02, 0.026, 0.62, 6), geos),
    stemMat,
  );
  budStem.position.set(0.56, 0.3, -0.3);
  budStem.rotation.z = -0.18;
  group.add(budStem);

  const budPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.12, 0.08),
    new THREE.Vector2(0.16, 0.22),
    new THREE.Vector2(0.09, 0.42),
    new THREE.Vector2(0.0, 0.52),
  ];
  const bud = new THREE.Mesh(
    trackGeo(new THREE.LatheGeometry(budPts, 12), geos),
    innerPetalMat,
  );
  bud.position.set(0.62, 0.56, -0.3);
  bud.rotation.z = -0.18;
  group.add(bud);

  group.scale.setScalar(scale);
  return group;
}

/**
 * Hội An Ceremonial Silk Lantern Pole (with textured lacquer wood & warm silk ribs).
 */
export function buildCeremonialLanternPole(
  textures: SceneTextureBundle,
  silkColor: number,
  geos: THREE.BufferGeometry[],
  mats: THREE.Material[],
): { group: THREE.Group; silkMat: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();

  const stoneMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x766d60,
      map: textures.stoneMap,
      roughness: 0.88,
      metalness: 0.04,
    }),
    mats,
  );
  const poleMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.darkWoodMap,
      roughness: 0.64,
      metalness: 0.05,
    }),
    mats,
  );
  const goldMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xdca944,
      roughness: 0.26,
      metalness: 0.88,
    }),
    mats,
  );
  const silkMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: silkColor,
      emissive: silkColor,
      emissiveIntensity: 0.9,
      roughness: 0.52,
      metalness: 0.0,
    }),
    mats,
  );

  const footing = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.24, 0.34, 0.36, 12), geos),
    stoneMat,
  );
  footing.position.y = 0.18;
  group.add(footing);

  const pole = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.065, 0.09, 3.6, 12), geos),
    poleMat,
  );
  pole.position.y = 2.05;
  pole.castShadow = true;
  group.add(pole);

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
 * Curved Vermilion Vietnamese Arched Bridge (Cầu Thê Húc) with textured ironwood deck,
 * lacquered timber railings, golden finials, and warm bridge lanterns.
 */
export function buildTheHucBridge(
  textures: SceneTextureBundle,
  geos: THREE.BufferGeometry[],
  mats: THREE.Material[],
): { group: THREE.Group; bridgeLanternMat: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();

  const redWoodMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.lacquerWoodMap,
      bumpMap: textures.lacquerWoodBump,
      bumpScale: 0.03,
      roughness: 0.56,
      metalness: 0.05,
    }),
    mats,
  );
  const deckWoodMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.darkWoodMap,
      bumpMap: textures.darkWoodBump,
      bumpScale: 0.04,
      roughness: 0.82,
      metalness: 0.03,
    }),
    mats,
  );
  const goldMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xdca944,
      roughness: 0.28,
      metalness: 0.86,
    }),
    mats,
  );
  const bridgeLanternMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffd07a,
      emissive: 0xff8a24,
      emissiveIntensity: 1.0,
      roughness: 0.42,
    }),
    mats,
  );

  const span = 7.4;
  const width = 3.2;
  const archHeight = 0.92;
  const planks = 20;
  const plankGeo = trackGeo(new THREE.BoxGeometry(width, 0.14, span / planks + 0.05), geos);

  for (let i = 0; i <= planks; i++) {
    const t = i / planks;
    const z = (t - 0.5) * span;
    const y = Math.sin(t * Math.PI) * archHeight + 0.22;
    const slope = Math.cos(t * Math.PI) * ((archHeight * Math.PI) / span);
    const plank = new THREE.Mesh(plankGeo, deckWoodMat);
    plank.position.set(0, y, z);
    plank.rotation.x = -Math.atan(slope);
    plank.receiveShadow = true;
    plank.castShadow = true;
    group.add(plank);
  }

  // Timber support pilings planted firmly into the lakebed
  const pilingGeo = trackGeo(new THREE.CylinderGeometry(0.09, 0.11, 1.4, 8), geos);
  for (const sx of [-1.25, 1.25]) {
    for (const pz of [-2.4, -0.8, 0.8, 2.4]) {
      const piling = new THREE.Mesh(pilingGeo, deckWoodMat);
      piling.position.set(sx, 0.18, pz);
      group.add(piling);
    }
  }

  const postGeo = trackGeo(new THREE.CylinderGeometry(0.068, 0.078, 0.9, 10), geos);
  const ballGeo = trackGeo(new THREE.SphereGeometry(0.11, 12, 12), geos);
  const miniLanternGeo = trackGeo(new THREE.SphereGeometry(0.14, 12, 10), geos);

  for (const sx of [-1, 1]) {
    const xPos = sx * (width / 2 - 0.1);
    const railPts: THREE.Vector3[] = [];
    const midRailPts: THREE.Vector3[] = [];
    const beamPts: THREE.Vector3[] = [];

    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const z = (t - 0.5) * span;
      const y = Math.sin(t * Math.PI) * archHeight + 0.22;
      beamPts.push(new THREE.Vector3(xPos, y - 0.08, z));
      midRailPts.push(new THREE.Vector3(xPos, y + 0.44, z));
      railPts.push(new THREE.Vector3(xPos, y + 0.84, z));

      if (i % 2 === 0) {
        const post = new THREE.Mesh(postGeo, redWoodMat);
        post.position.set(xPos, y + 0.44, z);
        post.castShadow = true;
        group.add(post);

        // Glowing warm bridge lanterns on alternate posts, golden finials on others
        if (i === 2 || i === 5 || i === 8) {
          const lan = new THREE.Mesh(miniLanternGeo, bridgeLanternMat);
          lan.scale.set(0.95, 1.2, 0.95);
          lan.position.set(xPos, y + 1.0, z);
          group.add(lan);
        } else {
          const cap = new THREE.Mesh(ballGeo, goldMat);
          cap.position.set(xPos, y + 0.94, z);
          group.add(cap);
        }
      }
    }

    const beamGeo = trackGeo(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(beamPts), 24, 0.11, 8, false),
      geos,
    );
    const railGeo = trackGeo(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts), 24, 0.068, 8, false),
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

  return { group, bridgeLanternMat };
}

/**
 * Organic Vietnamese Bamboo Grove (Lũy Tre Làng) with natural olive-emerald culms.
 */
export function buildBambooGrove(
  scale: number,
  geos: THREE.BufferGeometry[],
  mats: THREE.Material[],
): THREE.Group {
  const group = new THREE.Group();

  const stalkMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x456e3f,
      roughness: 0.62,
      metalness: 0.03,
    }),
    mats,
  );

  const leafMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x55844c,
      roughness: 0.72,
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),
    mats,
  );

  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.12, 0.25, 0, 0.76);
  leafShape.quadraticCurveTo(-0.12, 0.25, 0, 0);
  const leafGeo = trackGeo(new THREE.ShapeGeometry(leafShape, 5), geos);

  const stalks = [
    { x: 0.0, z: 0.0, h: 5.2, bendX: 0.34, bendZ: 0.16 },
    { x: -0.42, z: 0.28, h: 4.4, bendX: -0.38, bendZ: 0.24 },
    { x: 0.36, z: -0.25, h: 4.7, bendX: 0.44, bendZ: -0.2 },
    { x: -0.22, z: -0.38, h: 3.8, bendX: -0.24, bendZ: -0.3 },
    { x: 0.48, z: 0.32, h: 3.5, bendX: 0.38, bendZ: 0.26 },
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

    for (let k = 0; k < 6; k++) {
      const t = 0.5 + k * 0.095;
      const pt = curve.getPoint(Math.min(0.98, t));
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
 * Shoreline organic rock & reed bank cluster (Đá kè & Lau sậy ven hồ)
 * softens the island-water transition so the island looks grounded in nature.
 */
export function buildShorelineRockAndReeds(
  scale: number,
  textures: SceneTextureBundle,
  geos: THREE.BufferGeometry[],
  mats: THREE.Material[],
): THREE.Group {
  const group = new THREE.Group();

  const rockMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x717565,
      map: textures.stoneMap,
      bumpMap: textures.stoneBump,
      bumpScale: 0.08,
      roughness: 0.92,
      metalness: 0.03,
    }),
    mats,
  );
  const reedMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x4b7444,
      roughness: 0.78,
      metalness: 0.02,
    }),
    mats,
  );
  const plumeMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xdcccb0,
      roughness: 0.86,
      metalness: 0.0,
    }),
    mats,
  );

  const rockGeo = trackGeo(new THREE.DodecahedronGeometry(0.55, 1), geos);
  const r1 = new THREE.Mesh(rockGeo, rockMat);
  r1.scale.set(1.3, 0.65, 1.05);
  r1.position.set(0, 0.12, 0);
  r1.rotation.set(0.2, 0.6, 0.1);
  group.add(r1);

  const r2 = new THREE.Mesh(rockGeo, rockMat);
  r2.scale.set(0.85, 0.5, 0.78);
  r2.position.set(0.68, 0.06, 0.34);
  r2.rotation.set(-0.2, 1.4, 0.2);
  group.add(r2);

  // Slender lakeside reeds with warm feathery cattail/reed plumes
  const stalkGeo = trackGeo(new THREE.CylinderGeometry(0.014, 0.024, 1.55, 5), geos);
  const plumeGeo = trackGeo(new THREE.ConeGeometry(0.055, 0.34, 6), geos);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const hScale = 0.8 + (i % 3) * 0.24;
    const stalk = new THREE.Mesh(stalkGeo, reedMat);
    stalk.scale.set(1, hScale, 1);
    stalk.position.set(Math.cos(a) * 0.45, 0.65 * hScale, Math.sin(a) * 0.45);
    stalk.rotation.z = Math.cos(a) * 0.18;
    stalk.rotation.x = Math.sin(a) * 0.16;
    group.add(stalk);

    if (i % 2 === 0) {
      const plume = new THREE.Mesh(plumeGeo, plumeMat);
      plume.position.set(
        Math.cos(a) * (0.45 + 0.16),
        1.32 * hScale,
        Math.sin(a) * (0.45 + 0.16),
      );
      plume.rotation.z = Math.cos(a) * 0.22;
      group.add(plume);
    }
  }

  group.scale.setScalar(scale);
  return group;
}

/**
 * Stylized Golden Đông Sơn Chim Lạc (Mythic Vietnamese Crane) for soaring sky choreography.
 */
export function buildLacBird(
  geos: THREE.BufferGeometry[],
  mats: THREE.Material[],
): { group: THREE.Group; leftWing: THREE.Mesh; rightWing: THREE.Mesh } {
  const group = new THREE.Group();

  const goldBirdMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf4cf6b,
      emissive: 0xc28622,
      emissiveIntensity: 0.45,
      roughness: 0.3,
      metalness: 0.82,
      side: THREE.DoubleSide,
    }),
    mats,
  );

  // Slender aerodynamic body + long crest & beak
  const body = new THREE.Mesh(
    trackGeo(new THREE.ConeGeometry(0.11, 1.05, 8), geos),
    goldBirdMat,
  );
  body.rotation.x = Math.PI / 2;
  group.add(body);

  const beak = new THREE.Mesh(
    trackGeo(new THREE.ConeGeometry(0.035, 0.48, 6), geos),
    goldBirdMat,
  );
  beak.rotation.x = Math.PI / 2;
  beak.position.z = 0.72;
  group.add(beak);

  // Swept crescent Đông Sơn wings
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.bezierCurveTo(0.45, 0.18, 0.95, 0.08, 1.35, -0.28);
  wingShape.bezierCurveTo(0.82, -0.22, 0.35, -0.26, 0, -0.28);
  wingShape.closePath();
  const wingGeo = trackGeo(new THREE.ShapeGeometry(wingShape, 6), geos);
  wingGeo.rotateX(-Math.PI / 2);

  const rightWing = new THREE.Mesh(wingGeo, goldBirdMat);
  rightWing.position.set(0.05, 0.02, 0.14);
  group.add(rightWing);

  const leftWing = new THREE.Mesh(wingGeo, goldBirdMat);
  leftWing.scale.x = -1;
  leftWing.position.set(-0.05, 0.02, 0.14);
  group.add(leftWing);

  return { group, leftWing, rightWing };
}

/**
 * Dramatic Multi-Layered Tràng An / Hạ Long Limestone Karst Mountain Horizon + Drifting Mist Bands.
 * Replaces cartoon smooth clay mounds with rugged faceted limestone peaks fading through golden mist.
 */
export function buildKarstHorizon(
  textures: SceneTextureBundle,
  geos: THREE.BufferGeometry[],
  mats: THREE.Material[],
): { group: THREE.Group; mistPlanes: THREE.Mesh[] } {
  const group = new THREE.Group();
  const mistPlanes: THREE.Mesh[] = [];

  const peakMatNear = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x3b5954,
      roughness: 0.94,
      metalness: 0.0,
      flatShading: true,
    }),
    mats,
  );
  const peakMatMid = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x5c767a,
      roughness: 0.96,
      metalness: 0.0,
      flatShading: true,
    }),
    mats,
  );
  const peakMatFar = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x8d95a1,
      roughness: 0.98,
      metalness: 0.0,
      flatShading: true,
    }),
    mats,
  );

  // Build 3 distinct craggy limestone peak templates with deterministic rock ridges
  const peakTemplates: THREE.BufferGeometry[] = [];
  for (let variant = 0; variant < 3; variant++) {
    const geo = new THREE.ConeGeometry(1.0, 1.0, 11, 5);
    geo.translate(0, 0.5, 0);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const ang = Math.atan2(z, x);
      const ridge =
        1.0 +
        0.26 * Math.sin(ang * 3 + variant * 1.7) +
        0.16 * Math.cos(ang * 5 - y * 3.1 + variant * 2.3);
      // Slight rocky shoulder & asymmetric limestone summit
      const shoulder = y > 0.15 && y < 0.85 ? 1.15 : 1.0;
      const tiltX = y * (variant === 0 ? 0.18 : variant === 1 ? -0.15 : 0.08);
      pos.setXYZ(i, x * ridge * shoulder + tiltX, y, z * ridge * shoulder);
    }
    geo.computeVertexNormals();
    trackGeo(geo, geos);
    peakTemplates.push(geo);
  }

  // Ring 1 (Near misty karst outcrops), Ring 2 (Mid dramatic Tràng An spires), Ring 3 (Far horizon ridges)
  const rings = [
    { count: 14, distBase: 44, hBase: 7.5, hVar: 4.5, rMul: 0.95, mat: peakMatNear },
    { count: 18, distBase: 58, hBase: 12.5, hVar: 6.5, rMul: 1.05, mat: peakMatMid },
    { count: 22, distBase: 76, hBase: 17.0, hVar: 8.0, rMul: 1.25, mat: peakMatFar },
  ];

  rings.forEach((ring, ri) => {
    for (let i = 0; i < ring.count; i++) {
      const angle = (i / ring.count) * Math.PI * 2 + ri * 0.23;
      const dist = ring.distBase + ((i * 7 + ri * 3) % 5) * 2.4;
      const h = ring.hBase + (((i * 11 + ri * 5) % 10) / 10) * ring.hVar;
      const r = h * ring.rMul * (0.78 + ((i * 3) % 4) * 0.14);

      const peak = new THREE.Mesh(peakTemplates[(i + ri) % 3], ring.mat);
      peak.position.set(Math.cos(angle) * dist, -0.6, Math.sin(angle) * dist);
      peak.scale.set(r, h, r * (0.72 + (i % 3) * 0.18));
      peak.rotation.y = i * 1.1 + ri;
      group.add(peak);
    }
  });

  // Soft drifting mountain mist ribbons (sương mây bảng lảng trên mặt hồ)
  const mistMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: textures.mistCloudMap,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    mats,
  );
  const mistGeo = trackGeo(new THREE.PlaneGeometry(24, 7.5), geos);

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + 0.12;
    const dist = 34 + (i % 3) * 8;
    const mist = new THREE.Mesh(mistGeo, mistMat);
    mist.position.set(Math.cos(angle) * dist, 2.2 + (i % 3) * 1.1, Math.sin(angle) * dist);
    mist.lookAt(0, mist.position.y, 0);
    group.add(mist);
    mistPlanes.push(mist);
  }

  return { group, mistPlanes };
}
