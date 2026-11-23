import * as THREE from 'three';

export interface SceneTextureBundle {
  dongSonMap: THREE.CanvasTexture;
  dongSonBump: THREE.CanvasTexture;
  flagMap: THREE.CanvasTexture;
  festivalFlagMap: THREE.CanvasTexture;
  terracottaTileMap: THREE.CanvasTexture;
  terracottaTileBump: THREE.CanvasTexture;
  lacquerWoodMap: THREE.CanvasTexture;
  lacquerWoodBump: THREE.CanvasTexture;
  darkWoodMap: THREE.CanvasTexture;
  darkWoodBump: THREE.CanvasTexture;
  brickMap: THREE.CanvasTexture;
  brickBump: THREE.CanvasTexture;
  stoneMap: THREE.CanvasTexture;
  stoneBump: THREE.CanvasTexture;
  courtyardPavingMap: THREE.CanvasTexture;
  courtyardPavingBump: THREE.CanvasTexture;
  steleMap: THREE.CanvasTexture;
  lotusPetalMap: THREE.CanvasTexture;
  lotusPadMap: THREE.CanvasTexture;
  peachBlossomMap: THREE.CanvasTexture;
  apricotBlossomMap: THREE.CanvasTexture;
  waterRippleMap: THREE.CanvasTexture;
  waterGlowMap: THREE.CanvasTexture;
  brocadeRibbonMap: THREE.CanvasTexture;
  unityHaloMap: THREE.CanvasTexture;
  kiteMap: THREE.CanvasTexture;
  sparkMap: THREE.CanvasTexture;
  mistCloudMap: THREE.CanvasTexture;
  skyDawnMap: THREE.CanvasTexture;
  skyNightMap: THREE.CanvasTexture;
  contactShadowMap: THREE.CanvasTexture;
  dispose: () => void;
}

function makeCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function seededNoise(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

function configureTexture(
  canvas: HTMLCanvasElement,
  isColor: boolean,
  anisotropy: number,
  repeat?: [number, number],
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = anisotropy;
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  tex.needsUpdate = true;
  return tex;
}

function createDongSonTextures(anisotropy: number): {
  map: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const size = 1024;
  const half = size / 2;
  const [cCanvas, cCtx] = makeCanvas(size, size);
  const [bCanvas, bCtx] = makeCanvas(size, size);

  // Authentic aged Ngọc Lũ Đông Sơn cast bronze patina (dark antique umber-bronze + subtle verdigris)
  const grad = cCtx.createRadialGradient(half, half, 14, half, half, half);
  grad.addColorStop(0, '#c89942');
  grad.addColorStop(0.22, '#92692c');
  grad.addColorStop(0.55, '#594222');
  grad.addColorStop(0.84, '#3a3222');
  grad.addColorStop(1, '#272318');
  cCtx.fillStyle = grad;
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#383838';
  bCtx.fillRect(0, 0, size, size);

  // Hammered cast-bronze micro-grain & subtle antique verdigris patina
  for (let i = 0; i < 2600; i++) {
    const px = seededNoise(i, 1.3) * size;
    const py = seededNoise(i, 7.9) * size;
    const r = 1 + seededNoise(i, 3.1) * 3.0;
    cCtx.fillStyle =
      i % 6 === 0
        ? 'rgba(68, 106, 86, 0.09)'
        : i % 2 === 0
          ? 'rgba(248, 214, 134, 0.055)'
          : 'rgba(18, 12, 6, 0.09)';
    cCtx.fillRect(px, py, r, r);
  }

  // Concentric raised bronze divider rings matching Ngọc Lũ drum zones
  const ringRadii = [
    118, 127, 152, 160, 194, 202, 224, 232, 304, 312, 332, 340, 424, 432, 456, 464, 488, 496,
  ];
  for (const r of ringRadii) {
    cCtx.strokeStyle = '#e4b85e';
    cCtx.lineWidth = 3.2;
    cCtx.beginPath();
    cCtx.arc(half, half, r, 0, Math.PI * 2);
    cCtx.stroke();

    bCtx.strokeStyle = '#efefef';
    bCtx.lineWidth = 4.2;
    bCtx.beginPath();
    bCtx.arc(half, half, r, 0, Math.PI * 2);
    bCtx.stroke();
  }

  // Helper to draw both color and bump relief cleanly
  const drawOnBoth = (fn: (ctx: CanvasRenderingContext2D, isBump: boolean) => void) => {
    fn(cCtx, false);
    fn(bCtx, true);
  };

  // 1. Center 14-ray slender sharp Lạc Sun (Mặt trời 14 tia) + peacock-feather chevrons (họa tiết lông công)
  const rays = 14;
  const innerR = 38;
  const outerR = 115;

  drawOnBoth((ctx, isBump) => {
    ctx.save();
    ctx.translate(half, half);

    // Peacock-feather nested V-chevrons between every pair of sun rays
    ctx.strokeStyle = isBump ? '#dcdcdc' : '#d7a84f';
    ctx.lineWidth = isBump ? 3.2 : 2.5;
    for (let i = 0; i < rays; i++) {
      const aMid = ((i + 0.5) / rays) * Math.PI * 2;
      const halfSpan = (Math.PI / rays) * 0.72;
      for (let v = 0; v < 3; v++) {
        const tipR = 54 + v * 17;
        const baseR = 96 + v * 7;
        ctx.beginPath();
        ctx.moveTo(Math.cos(aMid - halfSpan * 0.78) * baseR, Math.sin(aMid - halfSpan * 0.78) * baseR);
        ctx.lineTo(Math.cos(aMid) * tipR, Math.sin(aMid) * tipR);
        ctx.lineTo(Math.cos(aMid + halfSpan * 0.78) * baseR, Math.sin(aMid + halfSpan * 0.78) * baseR);
        ctx.stroke();
      }
      // Small circle dot tucked at outer edge of each chevron
      ctx.fillStyle = isBump ? '#f2f2f2' : '#ebc46e';
      ctx.beginPath();
      ctx.arc(Math.cos(aMid) * 107, Math.sin(aMid) * 107, 3.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Slender pointed 14-ray star
    ctx.fillStyle = isBump ? '#ffffff' : '#f0c970';
    ctx.beginPath();
    for (let i = 0; i < rays * 2; i++) {
      const a = (i * Math.PI) / rays;
      const r = i % 2 === 0 ? outerR : innerR;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // Raised central bronze boss (núm mặt trời)
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fillStyle = isBump ? '#ffffff' : '#f7d886';
    ctx.fill();
    ctx.strokeStyle = isBump ? '#909090' : '#78521c';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  });

  // Helper: comb-teeth band (vành răng lược - vạch ngắn đều nhau)
  const drawCombBand = (rIn: number, rOut: number, count: number) => {
    drawOnBoth((ctx, isBump) => {
      ctx.strokeStyle = isBump ? '#dcdcdc' : '#d8aa52';
      ctx.lineWidth = isBump ? 2.6 : 2.0;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(half + Math.cos(a) * rIn, half + Math.sin(a) * rIn);
        ctx.lineTo(half + Math.cos(a) * rOut, half + Math.sin(a) * rOut);
        ctx.stroke();
      }
    });
  };

  // Helper: iconic Đông Sơn tangent-connected dotted circles band (vành vòng tròn đồng tâm tiếp tuyến)
  const drawTangentCircleBand = (midR: number, circleR: number, count: number) => {
    drawOnBoth((ctx, isBump) => {
      ctx.strokeStyle = isBump ? '#ececec' : '#e5bc62';
      ctx.fillStyle = isBump ? '#ffffff' : '#f5d484';
      ctx.lineWidth = isBump ? 2.8 : 2.3;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const aNext = ((i + 1) / count) * Math.PI * 2;
        const cx = half + Math.cos(a) * midR;
        const cy = half + Math.sin(a) * midR;
        const nx = half + Math.cos(aNext) * midR;
        const ny = half + Math.sin(aNext) * midR;

        // Tangent diagonal connector S-line between adjacent circles
        const tx1 = cx + Math.cos(a + 0.5) * circleR * 0.9;
        const ty1 = cy + Math.sin(a + 0.5) * circleR * 0.9;
        const tx2 = nx - Math.cos(aNext - 0.5) * circleR * 0.9;
        const ty2 = ny - Math.sin(aNext - 0.5) * circleR * 0.9;
        ctx.beginPath();
        ctx.moveTo(tx1, ty1);
        ctx.lineTo(tx2, ty2);
        ctx.stroke();

        // Outer circle + inner dot
        ctx.beginPath();
        ctx.arc(cx, cy, circleR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, circleR * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  };

  // Band 1: Inner comb-teeth (128..151) & Band 2: Tangent circles (161..193) & Band 3: Comb-teeth (203..223)
  drawCombBand(130, 149, 108);
  drawTangentCircleBand(177, 11.5, 36);
  drawCombBand(205, 221, 132);

  // Band 4 (234..302): Traditional Đông Sơn curved-roof stilt houses (nhà sàn mái cong) & feathered ceremonial frieze
  const friezeSegments = 12;
  drawOnBoth((ctx, isBump) => {
    ctx.strokeStyle = isBump ? '#eeeeee' : '#e6be68';
    ctx.fillStyle = isBump ? '#f4f4f4' : '#ecc672';
    ctx.lineWidth = isBump ? 3.2 : 2.6;
    for (let i = 0; i < friezeSegments; i++) {
      const a = (i / friezeSegments) * Math.PI * 2;
      ctx.save();
      ctx.translate(half, half);
      ctx.rotate(a);
      ctx.translate(268, 0);
      ctx.rotate(Math.PI / 2);

      if (i % 2 === 0) {
        // Curved boat-roof stilt house (nhà sàn mái cong Đông Sơn)
        ctx.beginPath();
        ctx.moveTo(-40, -14);
        ctx.quadraticCurveTo(0, 12, 40, -14);
        ctx.lineTo(28, -22);
        ctx.quadraticCurveTo(0, -4, -28, -22);
        ctx.closePath();
        ctx.fill();
        // Stilt posts & floor beam
        ctx.fillRect(-26, 4, 52, 4);
        ctx.fillRect(-22, -6, 4, 24);
        ctx.fillRect(18, -6, 4, 24);
        ctx.fillRect(-4, -2, 8, 12);
      } else {
        // Three rhythmic feathered festival figures (người hóa trang lông chim)
        for (const ox of [-24, 0, 24]) {
          ctx.beginPath();
          ctx.moveTo(ox, -20);
          ctx.quadraticCurveTo(ox + 10, -14, ox + 14, -4);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(ox, -12, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(ox, -8);
          ctx.lineTo(ox - 7, 14);
          ctx.lineTo(ox + 7, 14);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(ox - 4, 14);
          ctx.lineTo(ox - 6, 24);
          ctx.moveTo(ox + 4, 14);
          ctx.lineTo(ox + 6, 24);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  });

  // Inner divider comb-teeth (313..331)
  drawCombBand(315, 329, 168);

  // Band 5 (342..422): HERO BAND — 18 Authentic Chim Lạc flying COUNTER-CLOCKWISE (ngược chiều kim đồng hồ)
  const birdCount = 18;
  drawOnBoth((ctx, isBump) => {
    ctx.fillStyle = isBump ? '#ffffff' : '#f0cb75';
    ctx.strokeStyle = isBump ? '#f2f2f2' : '#e8bf66';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < birdCount; i++) {
      const a = (i / birdCount) * Math.PI * 2;
      ctx.save();
      ctx.translate(half, half);
      ctx.rotate(a);
      ctx.translate(382, 0);
      // Orient bird profile along counter-clockwise tangent (beak pointing in -Y local = CCW)
      ctx.rotate(-Math.PI / 2);

      // Streamlined arched body
      ctx.beginPath();
      ctx.moveTo(14, -2);
      ctx.quadraticCurveTo(0, -11, -16, -2);
      ctx.quadraticCurveTo(-2, 7, 14, -2);
      ctx.closePath();
      ctx.fill();

      // Long graceful S-curved neck + head + long pointed horizontal beak (pointing +X = CCW forward)
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(11, -3);
      ctx.bezierCurveTo(21, -5, 25, -10, 32, -9);
      ctx.stroke();

      // Head & long sharp beak
      ctx.beginPath();
      ctx.arc(33, -9, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(36, -11);
      ctx.lineTo(54, -9.5);
      ctx.lineTo(36, -7);
      ctx.closePath();
      ctx.fill();

      // Iconic flowing curved Đông Sơn crest plume (mào chim Lạc uốn cong về sau)
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(31, -12);
      ctx.bezierCurveTo(22, -23, 10, -24, 2, -19);
      ctx.stroke();

      // Upper sweeping curved wing (cánh trên vươn cong)
      ctx.beginPath();
      ctx.moveTo(5, -6);
      ctx.bezierCurveTo(10, -26, -6, -33, -24, -28);
      ctx.bezierCurveTo(-12, -21, -8, -14, -4, -6);
      ctx.closePath();
      ctx.fill();

      // Lower sweeping curved wing (cánh dưới xòe ngược)
      ctx.beginPath();
      ctx.moveTo(2, 3);
      ctx.bezierCurveTo(6, 22, -10, 29, -26, 24);
      ctx.bezierCurveTo(-14, 18, -10, 11, -6, 3);
      ctx.closePath();
      ctx.fill();

      // Long streaming forked tail feathers (đuôi dài xòe)
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.moveTo(-14, -2);
      ctx.quadraticCurveTo(-30, -9, -46, -11);
      ctx.moveTo(-14, 0);
      ctx.quadraticCurveTo(-32, 0, -50, 1);
      ctx.moveTo(-14, 2);
      ctx.quadraticCurveTo(-29, 8, -44, 10);
      ctx.stroke();

      // Two slender trailing crane legs
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(-4, 4);
      ctx.lineTo(-22, 13);
      ctx.moveTo(-8, 4);
      ctx.lineTo(-28, 11);
      ctx.stroke();

      ctx.restore();
    }
  });

  // Outer bands: Tangent circles (433..455) + Outer comb-teeth (466..486)
  drawTangentCircleBand(444, 9.2, 64);
  drawCombBand(467, 485, 220);

  return {
    map: configureTexture(cCanvas, true, anisotropy),
    bump: configureTexture(bCanvas, false, anisotropy),
  };
}

function createVietnamFlagTexture(anisotropy: number): THREE.CanvasTexture {
  const w = 768;
  const h = 512;
  const [canvas, ctx] = makeCanvas(w, h);

  // Rich woven silk ceremonial crimson
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#c8201d');
  grad.addColorStop(0.5, '#b81917');
  grad.addColorStop(1, '#a01514');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle woven silk crosshatch grain
  ctx.fillStyle = 'rgba(255, 240, 215, 0.04)';
  for (let y = 0; y < h; y += 3) {
    ctx.fillRect(0, y, w, 1);
  }
  ctx.fillStyle = 'rgba(40, 6, 4, 0.04)';
  for (let x = 0; x < w; x += 4) {
    ctx.fillRect(x, 0, 1, h);
  }

  // Luminous golden five-pointed star
  const cx = w / 2;
  const cy = h / 2;
  const outerR = h * 0.305;
  const innerR = outerR * 0.382;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  const starGrad = ctx.createRadialGradient(0, -10, 8, 0, 0, outerR);
  starGrad.addColorStop(0, '#ffe36e');
  starGrad.addColorStop(1, '#efb81a');
  ctx.fillStyle = starGrad;
  ctx.fill();
  ctx.restore();

  return configureTexture(canvas, true, anisotropy);
}

/**
 * Authentic Traditional Vietnamese Five-Color Festival Flag (Cờ Hội Ngũ Sắc / Cờ Thần)
 * with crimson flaming serrated triangle fringes (diềm lửa răng cưa) on alpha cutout,
 * five Ngũ Hành concentric silk bands, and gilded traditional floral-cloud medallion center.
 */
function createFestivalFlagTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const [canvas, ctx] = makeCanvas(size, size);
  ctx.clearRect(0, 0, size, size);

  // Main inner square body occupies x: [0..448], y: [54..458] leaving space for flaming fringes on top, right, bottom
  const left = 4;
  const top = 54;
  const bodyW = 442;
  const bodyH = 404;
  const right = left + bodyW;
  const bottom = top + bodyH;
  const toothDepth = 48;

  // 1. Flaming serrated triangle fringes (diềm lửa răng cưa) around Top, Right, Bottom edges
  const drawFlameEdge = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    nx: number,
    ny: number,
    count: number,
  ) => {
    for (let i = 0; i < count; i++) {
      const t0 = i / count;
      const tMid = (i + 0.5) / count;
      const t1 = (i + 1) / count;
      const ax = THREE.MathUtils.lerp(x1, x2, t0);
      const ay = THREE.MathUtils.lerp(y1, y2, t0);
      const bx = THREE.MathUtils.lerp(x1, x2, t1);
      const by = THREE.MathUtils.lerp(y1, y2, t1);
      const tipX = THREE.MathUtils.lerp(x1, x2, tMid) + nx * toothDepth;
      const tipY = THREE.MathUtils.lerp(y1, y2, tMid) + ny * toothDepth;

      // Alternate crimson flame & saffron-gold inner tongue accent
      ctx.fillStyle = i % 2 === 0 ? '#c8201d' : '#b21917';
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(tipX, tipY);
      ctx.lineTo(bx, by);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#f2c95d';
      ctx.lineWidth = 2.4;
      ctx.stroke();
    }
  };

  drawFlameEdge(left, top, right, top, 0, -1, 10);      // Top flame fringe
  drawFlameEdge(right, top, right, bottom, 1, 0, 9);    // Right flame fringe
  drawFlameEdge(right, bottom, left, bottom, 0, 1, 10); // Bottom flame fringe

  // 2. Five authentic Ngũ Hành concentric ceremonial silk squares (Hỏa - Thổ - Mộc - Kim - Thủy)
  const bands = [
    { pad: 0, color: '#c41e1b' },   // Đỏ (Hỏa - outer frame)
    { pad: 28, color: '#eab72c' },  // Vàng (Thổ)
    { pad: 62, color: '#1b7a4a' },  // Xanh lục (Mộc)
    { pad: 96, color: '#f3ebd6' },  // Trắng ngà (Kim)
    { pad: 128, color: '#1d4f91' }, // Xanh lam (Thủy)
    { pad: 158, color: '#a81919' }, // Tâm đỏ son trang trọng
  ];

  bands.forEach((b) => {
    ctx.fillStyle = b.color;
    ctx.fillRect(left + b.pad, top + b.pad, bodyW - b.pad * 2, bodyH - b.pad * 2);
    ctx.strokeStyle = 'rgba(244, 206, 108, 0.72)';
    ctx.lineWidth = 2.2;
    ctx.strokeRect(left + b.pad, top + b.pad, bodyW - b.pad * 2, bodyH - b.pad * 2);
  });

  // 3. Traditional gilded Vietnamese circular cloud-lotus rosette (Hoa văn chữ Thọ / Cúc cổ) in center
  const cx = left + bodyW / 2;
  const cy = top + bodyH / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = '#f7d56e';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.arc(0, 0, 38, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 29, 0, Math.PI * 2);
  ctx.stroke();

  // Traditional 4-scroll cloud fretwork inside medallion
  ctx.fillStyle = '#fae084';
  for (let i = 0; i < 8; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 4);
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.quadraticCurveTo(8, -18, 0, -26);
    ctx.quadraticCurveTo(-8, -18, 0, -10);
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Subtle woven silk shimmer inside body only (source-atop preserves clean alpha fringes)
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = 'rgba(255, 244, 220, 0.05)';
  for (let y = 0; y < size; y += 3) {
    ctx.fillRect(0, y, size, 1);
  }
  ctx.globalCompositeOperation = 'source-over';

  return configureTexture(canvas, true, anisotropy);
}

/**
 * Authentic aged Vietnamese terracotta yin-yang clay roof tiles (ngói âm dương đất nung).
 * Replaces glossy plastic turquoise with rich, weathered heritage architecture warmth.
 */
function createTerracottaTileTextures(anisotropy: number): {
  map: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const size = 512;
  const [cCanvas, cCtx] = makeCanvas(size, size);
  const [bCanvas, bCtx] = makeCanvas(size, size);

  cCtx.fillStyle = '#753120';
  cCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#606060';
  bCtx.fillRect(0, 0, size, size);

  const cols = 14;
  const rows = 10;
  const colW = size / cols;
  const rowH = size / rows;

  // Vertical ribbed semi-cylindrical clay tiles with organic kiln-fired shade variations
  for (let c = 0; c < cols; c++) {
    const x = c * colW;
    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      const n = seededNoise(c * 3.1, r * 5.7);
      const redShift = Math.floor((n - 0.5) * 26);

      const tileGrad = cCtx.createLinearGradient(x, y, x + colW, y);
      tileGrad.addColorStop(0, `rgb(${78 + redShift}, ${32 + Math.floor(redShift * 0.4)}, 22)`);
      tileGrad.addColorStop(0.28, `rgb(${132 + redShift}, ${58 + Math.floor(redShift * 0.45)}, 36)`);
      tileGrad.addColorStop(0.55, `rgb(${156 + redShift}, ${72 + Math.floor(redShift * 0.5)}, 44)`);
      tileGrad.addColorStop(0.84, `rgb(${112 + redShift}, ${48 + Math.floor(redShift * 0.4)}, 30)`);
      tileGrad.addColorStop(1, `rgb(${64 + redShift}, ${26 + Math.floor(redShift * 0.35)}, 18)`);
      cCtx.fillStyle = tileGrad;
      cCtx.fillRect(x, y, colW, rowH);

      // Subtle aged moss / weathered soot near overlapping tile lip
      if (n > 0.76) {
        cCtx.fillStyle = 'rgba(72, 92, 54, 0.22)';
        cCtx.fillRect(x + 2, y + rowH - 12, colW - 4, 9);
      } else if (n < 0.24) {
        cCtx.fillStyle = 'rgba(38, 22, 16, 0.18)';
        cCtx.fillRect(x + 2, y + 2, colW - 4, 12);
      }

      const bumpGrad = bCtx.createLinearGradient(x, y, x + colW, y);
      bumpGrad.addColorStop(0, '#202020');
      bumpGrad.addColorStop(0.5, '#f0f0f0');
      bumpGrad.addColorStop(1, '#202020');
      bCtx.fillStyle = bumpGrad;
      bCtx.fillRect(x, y, colW, rowH);
    }
  }

  // Horizontal overlapping tile lip shadows & bright clay edges
  for (let r = 0; r < rows; r++) {
    const y = r * rowH;
    cCtx.fillStyle = 'rgba(28, 12, 8, 0.52)';
    cCtx.fillRect(0, y, size, 5);
    cCtx.fillStyle = 'rgba(218, 134, 92, 0.22)';
    cCtx.fillRect(0, y + 5, size, 2.5);

    bCtx.fillStyle = '#181818';
    bCtx.fillRect(0, y, size, 6);
  }

  // Fine porous baked-clay grain
  for (let i = 0; i < 2400; i++) {
    const gx = seededNoise(i, 4.1) * size;
    const gy = seededNoise(i, 9.2) * size;
    cCtx.fillStyle = i % 2 === 0 ? 'rgba(36, 16, 10, 0.09)' : 'rgba(232, 174, 132, 0.07)';
    cCtx.fillRect(gx, gy, 2, 2);
  }

  return {
    map: configureTexture(cCanvas, true, anisotropy, [3, 2]),
    bump: configureTexture(bCanvas, false, anisotropy, [3, 2]),
  };
}

/**
 * Hand-rubbed Vietnamese cinnabar-lacquer over timber grain (Sơn Son Thếp Vàng).
 * Eliminates flat red-plastic look on pillars, walls, and bridges.
 */
function createLacquerWoodTextures(anisotropy: number): {
  map: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const size = 512;
  const [cCanvas, cCtx] = makeCanvas(size, size);
  const [bCanvas, bCtx] = makeCanvas(size, size);

  const base = cCtx.createLinearGradient(0, 0, size, 0);
  base.addColorStop(0, '#7c1a19');
  base.addColorStop(0.35, '#962320');
  base.addColorStop(0.7, '#841d1b');
  base.addColorStop(1, '#721716');
  cCtx.fillStyle = base;
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Subtle vertical wood grain fibers & hand-brushed lacquer striations
  for (let i = 0; i < 180; i++) {
    const x = (i / 180) * size;
    const n = seededNoise(i, 2.7);
    const w = 1 + n * 4;
    cCtx.fillStyle = n > 0.5 ? 'rgba(182, 56, 42, 0.14)' : 'rgba(46, 8, 8, 0.18)';
    cCtx.fillRect(x, 0, w, size);

    const bVal = Math.floor(110 + n * 44);
    bCtx.fillStyle = `rgb(${bVal},${bVal},${bVal})`;
    bCtx.fillRect(x, 0, w, size);
  }

  // Subtle antique weathering patina
  for (let i = 0; i < 1600; i++) {
    const px = seededNoise(i, 6.3) * size;
    const py = seededNoise(i, 1.9) * size;
    cCtx.fillStyle = i % 3 === 0 ? 'rgba(24, 6, 6, 0.08)' : 'rgba(218, 120, 86, 0.05)';
    cCtx.fillRect(px, py, 2, 8);
  }

  return {
    map: configureTexture(cCanvas, true, anisotropy, [2, 2]),
    bump: configureTexture(bCanvas, false, anisotropy, [2, 2]),
  };
}

/**
 * Aged Vietnamese Ironwood (Gỗ Lim) for rafters, brackets, bridge decks, and sampan hull.
 */
function createDarkWoodTextures(anisotropy: number): {
  map: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const size = 512;
  const [cCanvas, cCtx] = makeCanvas(size, size);
  const [bCanvas, bCtx] = makeCanvas(size, size);

  cCtx.fillStyle = '#47281c';
  cCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#787878';
  bCtx.fillRect(0, 0, size, size);

  for (let i = 0; i < 200; i++) {
    const x = (i / 200) * size;
    const n = seededNoise(i, 8.1);
    cCtx.fillStyle = n > 0.5 ? 'rgba(104, 64, 42, 0.22)' : 'rgba(26, 12, 8, 0.26)';
    cCtx.fillRect(x, 0, 2 + n * 4, size);

    const bVal = Math.floor(92 + n * 76);
    bCtx.fillStyle = `rgb(${bVal},${bVal},${bVal})`;
    bCtx.fillRect(x, 0, 2 + n * 3, size);
  }

  return {
    map: configureTexture(cCanvas, true, anisotropy, [2, 2]),
    bump: configureTexture(bCanvas, false, anisotropy, [2, 2]),
  };
}

/**
 * Historic weathered Hanoi Citadel brick (Cột Cờ Hà Nội).
 */
function createBrickTextures(anisotropy: number): {
  map: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const size = 512;
  const [cCanvas, cCtx] = makeCanvas(size, size);
  const [bCanvas, bCtx] = makeCanvas(size, size);

  // Aged lime-sand mortar
  cCtx.fillStyle = '#8b7762';
  cCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#363636';
  bCtx.fillRect(0, 0, size, size);

  const rows = 16;
  const cols = 8;
  const rh = size / rows;
  const cw = size / cols;

  const shades = ['#a65f3d', '#985334', '#b46d48', '#8c4b2f', '#a15d3e', '#7e432a'];
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (cw * 0.5);
    for (let c = -1; c <= cols; c++) {
      const n = seededNoise(r * 4.3, c * 9.1);
      const idx = Math.floor(n * shades.length) % shades.length;
      const x = c * cw + offset;
      const y = r * rh;
      cCtx.fillStyle = shades[idx];
      cCtx.fillRect(x + 2, y + 2, cw - 4, rh - 4);

      // Weathering & subtle moss patina on old bricks
      if (n > 0.82) {
        cCtx.fillStyle = 'rgba(66, 82, 54, 0.22)';
        cCtx.fillRect(x + 2, y + 2, cw - 4, rh - 4);
      } else if (n < 0.2) {
        cCtx.fillStyle = 'rgba(42, 24, 16, 0.16)';
        cCtx.fillRect(x + 2, y + 2, cw - 4, rh - 4);
      }

      const bVal = 165 + Math.floor(n * 55);
      bCtx.fillStyle = `rgb(${bVal},${bVal},${bVal})`;
      bCtx.fillRect(x + 2, y + 2, cw - 4, rh - 4);
    }
  }

  for (let i = 0; i < 2000; i++) {
    const px = seededNoise(i, 2.4) * size;
    const py = seededNoise(i, 7.6) * size;
    cCtx.fillStyle = i % 2 === 0 ? 'rgba(32, 18, 12, 0.1)' : 'rgba(235, 198, 162, 0.08)';
    cCtx.fillRect(px, py, 2, 2);
  }

  return {
    map: configureTexture(cCanvas, true, anisotropy, [2.5, 2.5]),
    bump: configureTexture(bCanvas, false, anisotropy, [2.5, 2.5]),
  };
}

/**
 * Weathered carved Vietnamese sandstone / Ninh Bình blue-gray stone (Đá Xanh & Đá Ong).
 */
function createStoneTextures(anisotropy: number): {
  map: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const size = 512;
  const [cCanvas, cCtx] = makeCanvas(size, size);
  const [bCanvas, bCtx] = makeCanvas(size, size);

  cCtx.fillStyle = '#9c8f7c';
  cCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#484848';
  bCtx.fillRect(0, 0, size, size);

  const rows = 8;
  const cols = 4;
  const rh = size / rows;
  const cw = size / cols;
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (cw * 0.5);
    for (let c = -1; c <= cols; c++) {
      const n = seededNoise(r * 7.1, c * 3.7);
      const x = c * cw + offset;
      const y = r * rh;
      const v = Math.floor(182 + n * 28);
      cCtx.fillStyle = `rgb(${v}, ${v - 11}, ${v - 25})`;
      cCtx.fillRect(x + 2.5, y + 2.5, cw - 5, rh - 5);

      if (n > 0.78) {
        cCtx.fillStyle = 'rgba(76, 98, 70, 0.16)';
        cCtx.fillRect(x + 2.5, y + 2.5, cw - 5, rh - 5);
      }

      const bVal = Math.floor(172 + n * 48);
      bCtx.fillStyle = `rgb(${bVal},${bVal},${bVal})`;
      bCtx.fillRect(x + 2.5, y + 2.5, cw - 5, rh - 5);
    }
  }

  for (let i = 0; i < 2400; i++) {
    const gx = seededNoise(i, 5.1) * size;
    const gy = seededNoise(i, 8.8) * size;
    cCtx.fillStyle = i % 2 === 0 ? 'rgba(66, 56, 44, 0.11)' : 'rgba(244, 236, 222, 0.1)';
    cCtx.fillRect(gx, gy, 3, 2);
  }

  return {
    map: configureTexture(cCanvas, true, anisotropy, [2, 2]),
    bump: configureTexture(bCanvas, false, anisotropy, [2, 2]),
  };
}

/**
 * Traditional Vietnamese Bát Tràng terracotta-stone courtyard paving (Gạch lát sân đình).
 */
function createCourtyardPavingTextures(anisotropy: number): {
  map: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const size = 512;
  const [cCanvas, cCtx] = makeCanvas(size, size);
  const [bCanvas, bCtx] = makeCanvas(size, size);

  // Dark weathered stone-moss mortar seams
  cCtx.fillStyle = '#5e5346';
  cCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#303030';
  bCtx.fillRect(0, 0, size, size);

  const grid = 8;
  const cell = size / grid;
  const tilePalette = ['#c6a482', '#bd9776', '#cfa986', '#b58d6c', '#c39c7a', '#ab8668'];

  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const n = seededNoise(r * 5.9, c * 8.3);
      const x = c * cell;
      const y = r * cell;
      cCtx.fillStyle = tilePalette[Math.floor(n * tilePalette.length) % tilePalette.length];
      cCtx.fillRect(x + 2.5, y + 2.5, cell - 5, cell - 5);

      // Subtle inner tile highlight & moss edge
      cCtx.strokeStyle = 'rgba(248, 232, 206, 0.18)';
      cCtx.lineWidth = 1.5;
      cCtx.strokeRect(x + 4, y + 4, cell - 8, cell - 8);

      if (n > 0.8) {
        cCtx.fillStyle = 'rgba(72, 98, 66, 0.16)';
        cCtx.fillRect(x + 2.5, y + 2.5, cell - 5, 7);
      }

      const bVal = Math.floor(175 + n * 45);
      bCtx.fillStyle = `rgb(${bVal},${bVal},${bVal})`;
      bCtx.fillRect(x + 2.5, y + 2.5, cell - 5, cell - 5);
    }
  }

  for (let i = 0; i < 2000; i++) {
    const px = seededNoise(i, 3.7) * size;
    const py = seededNoise(i, 6.1) * size;
    cCtx.fillStyle = i % 2 === 0 ? 'rgba(54, 38, 26, 0.08)' : 'rgba(255, 240, 218, 0.08)';
    cCtx.fillRect(px, py, 2.5, 2.5);
  }

  return {
    map: configureTexture(cCanvas, true, anisotropy, [5, 5]),
    bump: configureTexture(bCanvas, false, anisotropy, [5, 5]),
  };
}

/**
 * High-resolution Cultural Stele plaque featuring Cố Tổng Bí thư Nguyễn Phú Trọng's quote.
 */
function createStelePlaqueTexture(anisotropy: number): THREE.CanvasTexture {
  const w = 768;
  const h = 1152;
  const [canvas, ctx] = makeCanvas(w, h);

  // Rich antique imperial crimson-lacquer with subtle wood/silk grain
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#5a1316');
  bg.addColorStop(0.45, '#7a1c1f');
  bg.addColorStop(1, '#491013');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 140; i++) {
    const x = (i / 140) * w;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 210, 140, 0.025)' : 'rgba(20, 4, 4, 0.04)';
    ctx.fillRect(x, 0, 3, h);
  }

  const halo = ctx.createRadialGradient(w / 2, 190, 20, w / 2, 190, 330);
  halo.addColorStop(0, 'rgba(247, 210, 120, 0.24)');
  halo.addColorStop(1, 'rgba(247, 210, 120, 0.0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, w, h);

  // Double gold leaf frame with corner scroll accents
  ctx.strokeStyle = '#e7bb5e';
  ctx.lineWidth = 10;
  ctx.strokeRect(28, 28, w - 56, h - 56);
  ctx.lineWidth = 3.5;
  ctx.strokeRect(48, 48, w - 96, h - 96);

  // Traditional fretwork corner ornaments
  const corners = [
    [54, 54, 1, 1],
    [w - 54, 54, -1, 1],
    [54, h - 54, 1, -1],
    [w - 54, h - 54, -1, -1],
  ];
  ctx.strokeStyle = '#f2ce78';
  ctx.lineWidth = 3;
  corners.forEach(([cx, cy, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * 36);
    ctx.lineTo(cx + dx * 36, cy + dy * 36);
    ctx.lineTo(cx + dx * 36, cy);
    ctx.stroke();
  });

  // Top five-pointed golden star
  ctx.save();
  ctx.translate(w / 2, 134);
  ctx.fillStyle = '#f8d778';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? 42 : 17;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // "24 · 11" headline
  ctx.fillStyle = '#fae090';
  ctx.textAlign = 'center';
  ctx.font = '700 116px Georgia, serif';
  ctx.fillText('24 · 11', w / 2, 304);

  // Subtitle
  ctx.fillStyle = '#fdf4e1';
  ctx.font = '700 40px Georgia, serif';
  ctx.fillText('NGÀY VĂN HÓA VIỆT NAM', w / 2, 382);

  // Ornamental golden divider
  ctx.strokeStyle = '#e5b857';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(148, 428);
  ctx.lineTo(w - 148, 428);
  ctx.stroke();

  // Prominent, ultra-legible quote of Cố Tổng Bí thư Nguyễn Phú Trọng
  ctx.fillStyle = '#fff8ea';
  ctx.font = 'italic 700 52px Georgia, serif';
  ctx.fillText('“Văn hóa còn thì', w / 2, 548);
  ctx.fillText('dân tộc còn,', w / 2, 622);
  ctx.fillStyle = '#fae090';
  ctx.fillText('văn hóa mất thì', w / 2, 712);
  ctx.fillText('dân tộc mất.”', w / 2, 786);

  // Attribution
  ctx.strokeStyle = 'rgba(236, 194, 104, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(230, 868);
  ctx.lineTo(w - 230, 868);
  ctx.stroke();

  ctx.fillStyle = '#f8d886';
  ctx.font = '600 34px Georgia, serif';
  ctx.fillText('Tổng Bí thư Nguyễn Phú Trọng', w / 2, 938);

  ctx.fillStyle = '#edd8b6';
  ctx.font = '500 28px Georgia, serif';
  ctx.fillText('Hội nghị Văn hóa toàn quốc', w / 2, 994);

  return configureTexture(canvas, true, anisotropy);
}

/**
 * Natural blush-pink veined lotus petal texture (ivory-cream base -> deep rose-carmine tip).
 */
function createLotusPetalTexture(anisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 256);
  const grad = ctx.createLinearGradient(0, 256, 0, 0);
  grad.addColorStop(0, '#fcf3df');
  grad.addColorStop(0.28, '#f8d2dc');
  grad.addColorStop(0.68, '#e882a2');
  grad.addColorStop(1, '#c63d68');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Delicate translucent petal veins
  ctx.strokeStyle = 'rgba(255, 245, 240, 0.25)';
  ctx.lineWidth = 1.8;
  for (let i = -5; i <= 5; i++) {
    ctx.beginPath();
    ctx.moveTo(128 + i * 5, 256);
    ctx.quadraticCurveTo(128 + i * 22, 130, 128 + i * 14, 6);
    ctx.stroke();
  }

  return configureTexture(canvas, true, anisotropy);
}

/**
 * Organic radial-veined Vietnamese lotus leaf pad texture.
 */
function createLotusPadTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const half = size / 2;
  const [canvas, ctx] = makeCanvas(size, size);

  const grad = ctx.createRadialGradient(half, half, 8, half, half, half);
  grad.addColorStop(0, '#629054');
  grad.addColorStop(0.32, '#3d7247');
  grad.addColorStop(0.76, '#2a5a3a');
  grad.addColorStop(1, '#1f442c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Radiating botanical leaf veins
  ctx.strokeStyle = 'rgba(154, 198, 126, 0.34)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(half, half);
    ctx.lineTo(half + Math.cos(a) * half, half + Math.sin(a) * half);
    ctx.stroke();
  }

  return configureTexture(canvas, true, anisotropy);
}

/**
 * Botanical Vietnamese Hoa Đào (peach) & Hoa Mai (apricot) blossom sprig texture
 * with slender twigs, layered 5-petal flowers, buds, and tender green leaves on alpha.
 */
function createBlossomSprigTexture(
  variant: 'peach' | 'apricot',
  anisotropy: number,
): THREE.CanvasTexture {
  const size = 512;
  const [canvas, ctx] = makeCanvas(size, size);
  ctx.clearRect(0, 0, size, size);

  const seedOffset = variant === 'peach' ? 1.7 : 4.3;

  // Slender dark-bark branching twigs radiating through the sprig
  ctx.strokeStyle = '#3b241a';
  ctx.lineCap = 'round';
  const twigs: Array<[number, number, number, number, number, number, number]> = [
    [256, 480, 240, 320, 260, 110, 7],
    [248, 360, 165, 290, 82, 195, 5],
    [252, 330, 345, 265, 428, 178, 5],
    [254, 245, 178, 175, 128, 96, 4],
    [256, 220, 336, 162, 392, 92, 4],
    [168, 286, 120, 255, 76, 285, 3],
    [340, 265, 392, 246, 442, 268, 3],
  ];
  twigs.forEach(([x0, y0, cx, cy, x1, y1, lw]) => {
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cx, cy, x1, y1);
    ctx.stroke();
  });

  // Tender young spring leaves (lộc non)
  for (let i = 0; i < 16; i++) {
    const n1 = seededNoise(i + 20, seedOffset);
    const n2 = seededNoise(i + 50, seedOffset + 1.1);
    const lx = 90 + n1 * 332;
    const ly = 90 + n2 * 310;
    const distCenter = Math.hypot(lx - 256, ly - 245);
    if (distCenter > 195) continue;

    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(seededNoise(i, 9.2) * Math.PI * 2);
    ctx.fillStyle = i % 2 === 0 ? '#558042' : '#6c9c4f';
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Draw 44 individual 5-petal Vietnamese blossoms + unopened buds
  const drawFivePetalFlower = (
    fx: number,
    fy: number,
    radius: number,
    rot: number,
    shadeIdx: number,
  ) => {
    const palette =
      variant === 'peach'
        ? ['#e26b92', '#ef8bab', '#f7b2c7', '#d8557f']
        : ['#eab224', '#f6c83c', '#ffe06e', '#df9b1c'];
    const baseColor = palette[shadeIdx % palette.length];
    const centerColor = variant === 'peach' ? '#9c2246' : '#a8530c';
    const stamenColor = variant === 'peach' ? '#ffe58a' : '#fff3b8';

    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(rot);

    for (let p = 0; p < 5; p++) {
      ctx.save();
      ctx.rotate((p * Math.PI * 2) / 5);
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.ellipse(0, -radius * 0.58, radius * 0.44, radius * 0.56, 0, 0, Math.PI * 2);
      ctx.fill();

      // Soft lighter petal rim highlight
      ctx.fillStyle =
        variant === 'peach' ? 'rgba(255, 232, 240, 0.42)' : 'rgba(255, 250, 212, 0.45)';
      ctx.beginPath();
      ctx.ellipse(0, -radius * 0.72, radius * 0.28, radius * 0.24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Calyx center & golden pollen stamens
    ctx.fillStyle = centerColor;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = stamenColor;
    for (let s = 0; s < 6; s++) {
      const sa = (s / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(sa) * radius * 0.22, Math.sin(sa) * radius * 0.22, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  for (let i = 0; i < 52; i++) {
    const angle = seededNoise(i * 1.9, seedOffset) * Math.PI * 2;
    const rad = Math.sqrt(seededNoise(i * 3.1, seedOffset + 2.5)) * 185;
    const fx = 256 + Math.cos(angle) * rad;
    const fy = 238 + Math.sin(angle) * rad * 0.92;
    if (fy > 425 || fy < 52) continue;

    if (i % 5 === 0) {
      // Small delicate flower bud
      ctx.fillStyle = variant === 'peach' ? '#d44572' : '#d68f14';
      ctx.beginPath();
      ctx.arc(fx, fy, 8 + (i % 3) * 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const flowerR = 17 + (i % 5) * 4.5;
      drawFivePetalFlower(fx, fy, flowerR, seededNoise(i, 7.1) * Math.PI * 2, i);
    }
  }

  return configureTexture(canvas, true, anisotropy);
}

/**
 * Soft horizontal rippled warm golden water reflection shimmer map for lantern & pagoda reflections.
 */
function createWaterGlowTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const half = size / 2;
  const [canvas, ctx] = makeCanvas(size, size);
  ctx.clearRect(0, 0, size, size);

  const grad = ctx.createRadialGradient(half, half, 6, half, half, half);
  grad.addColorStop(0, 'rgba(255, 224, 148, 0.92)');
  grad.addColorStop(0.32, 'rgba(255, 168, 72, 0.52)');
  grad.addColorStop(0.7, 'rgba(232, 112, 48, 0.14)');
  grad.addColorStop(1, 'rgba(232, 112, 48, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Break glow with delicate dark horizontal water-wave ripple stripes
  ctx.globalCompositeOperation = 'destination-out';
  for (let y = 0; y < size; y += 9) {
    const waveAlpha = 0.25 + seededNoise(y, 3.2) * 0.35;
    ctx.fillStyle = `rgba(0, 0, 0, ${waveAlpha})`;
    ctx.fillRect(0, y, size, 3);
  }
  ctx.globalCompositeOperation = 'source-over';

  return configureTexture(canvas, true, anisotropy);
}

/**
 * Traditional Vietnamese 54-Ethnic Brocade Silk Ribbon texture (Dải Lụa Thổ Cẩm 54 Dân Tộc)
 * with geometric diamond motifs, 8-pointed ethnic brocade stars, and softly feathered silk ends.
 */
function createBrocadeRibbonTexture(anisotropy: number): THREE.CanvasTexture {
  const w = 1024;
  const h = 256;
  const [canvas, ctx] = makeCanvas(w, h);
  ctx.clearRect(0, 0, w, h);

  // Horizontal woven silk bands representing traditional highland & lowland brocade textiles
  const stripes = [
    { y: 12, h: 16, color: '#eab840' },
    { y: 28, h: 24, color: '#1b517e' },
    { y: 52, h: 14, color: '#f3e5c4' },
    { y: 66, h: 124, color: '#9c1b22' },
    { y: 190, h: 14, color: '#f3e5c4' },
    { y: 204, h: 24, color: '#1e6e50' },
    { y: 228, h: 16, color: '#eab840' },
  ];
  stripes.forEach((s) => {
    ctx.fillStyle = s.color;
    ctx.fillRect(0, s.y, w, s.h);
  });

  // Sawtooth ethnic mountain zigzags along top & bottom indigo/jade borders
  const drawZigZag = (baseY: number, amp: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 24) {
      const y = baseY + ((x / 24) % 2 === 0 ? -amp : amp);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };
  drawZigZag(40, 7, '#f7d574');
  drawZigZag(216, 7, '#f7d574');

  // Repeating authentic Vietnamese Thổ Cẩm nested diamonds & 8-pointed brocade stars along center
  const step = 128;
  for (let x = 64; x < w; x += step) {
    const cy = h / 2;

    // Outer gold diamond
    ctx.strokeStyle = '#f5ce68';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, cy - 50);
    ctx.lineTo(x + 54, cy);
    ctx.lineTo(x, cy + 50);
    ctx.lineTo(x - 54, cy);
    ctx.closePath();
    ctx.stroke();

    // Inner teal-indigo diamond fill
    ctx.fillStyle = (x / step) % 2 === 0 ? '#1b4e7c' : '#1b6d4c';
    ctx.beginPath();
    ctx.moveTo(x, cy - 36);
    ctx.lineTo(x + 38, cy);
    ctx.lineTo(x, cy + 36);
    ctx.lineTo(x - 38, cy);
    ctx.closePath();
    ctx.fill();

    // 8-pointed ethnic brocade star (hoa văn sao tám cánh Tây Nguyên / Tây Bắc)
    ctx.save();
    ctx.translate(x, cy);
    ctx.fillStyle = '#fae08c';
    for (let p = 0; p < 8; p++) {
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(5, -15);
      ctx.lineTo(0, -25);
      ctx.lineTo(-5, -15);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#fff5d4';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Subtle woven silk vertical shimmer so the 360° encircling ribbon catches light seamlessly
  ctx.fillStyle = 'rgba(255, 245, 224, 0.055)';
  for (let y = 14; y < h - 14; y += 4) {
    ctx.fillRect(0, y, w, 1);
  }

  const tex = configureTexture(canvas, true, anisotropy, [8, 1]);
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/**
 * Soft luminous radial spark glow texture for night festival fireworks (Pháo Hoa Lễ Hội).
 */
function createSparkTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 64;
  const half = size / 2;
  const [canvas, ctx] = makeCanvas(size, size);
  ctx.clearRect(0, 0, size, size);
  const grad = ctx.createRadialGradient(half, half, 1, half, half, half);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.25, 'rgba(255, 248, 220, 0.92)');
  grad.addColorStop(0.55, 'rgba(255, 210, 130, 0.42)');
  grad.addColorStop(1.0, 'rgba(255, 180, 90, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return configureTexture(canvas, true, anisotropy);
}

/**
 * Celestial 54-Ethnic Unity Halo (Vầng Hào Quang Lạc Hồng 54 Dân Tộc)
 * Ethereal golden Đông Sơn sun filigree encircled by 54 unity stars & ethnic brocade ring.
 */
function createUnityHaloTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 1024;
  const half = size / 2;
  const [canvas, ctx] = makeCanvas(size, size);
  ctx.clearRect(0, 0, size, size);

  // Soft radiant golden celestial glow aura
  const aura = ctx.createRadialGradient(half, half, 40, half, half, 490);
  aura.addColorStop(0.0, 'rgba(255, 240, 186, 0.42)');
  aura.addColorStop(0.32, 'rgba(255, 208, 114, 0.24)');
  aura.addColorStop(0.68, 'rgba(240, 168, 72, 0.1)');
  aura.addColorStop(1.0, 'rgba(240, 168, 72, 0)');
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, size, size);

  // Delicate golden filigree concentric circles
  const rings = [148, 164, 246, 260, 356, 372, 434];
  rings.forEach((r, idx) => {
    ctx.strokeStyle = idx % 2 === 0 ? 'rgba(255, 224, 134, 0.85)' : 'rgba(246, 192, 92, 0.55)';
    ctx.lineWidth = idx === 4 ? 4 : 2.5;
    ctx.beginPath();
    ctx.arc(half, half, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Inner luminous 14-point Lạc Sun filigree
  ctx.save();
  ctx.translate(half, half);
  ctx.fillStyle = 'rgba(255, 232, 152, 0.72)';
  ctx.beginPath();
  for (let i = 0; i < 28; i++) {
    const a = (i * Math.PI) / 14;
    const r = i % 2 === 0 ? 142 : 52;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Middle ethnic brocade diamond filigree ring (180..240)
  const diamonds = 36;
  ctx.strokeStyle = 'rgba(255, 226, 146, 0.72)';
  ctx.lineWidth = 2.4;
  for (let i = 0; i < diamonds; i++) {
    const a = (i / diamonds) * Math.PI * 2;
    ctx.save();
    ctx.translate(half + Math.cos(a) * 205, half + Math.sin(a) * 205);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.lineTo(0, 14);
    ctx.lineTo(-26, 0);
    ctx.lineTo(0, -14);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  // Outer sacred ring of 54 Luminous Unity Stars & Brocade Petals — representing 54 Dân Tộc Việt Nam!
  const ethnicPalette = ['#ffe68c', '#ff9e7c', '#98e2b8', '#fff4d8', '#9ec6ff', '#f7b4c8'];
  for (let i = 0; i < 54; i++) {
    const a = (i / 54) * Math.PI * 2;
    const rCenter = 310;
    const cx = half + Math.cos(a) * rCenter;
    const cy = half + Math.sin(a) * rCenter;

    // Fine golden ray extending outward from each of the 54 ethnic stars
    ctx.strokeStyle = 'rgba(255, 228, 148, 0.58)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(half + Math.cos(a) * 374, half + Math.sin(a) * 374);
    ctx.lineTo(half + Math.cos(a) * 430, half + Math.sin(a) * 430);
    ctx.stroke();

    // Small 4-point glowing ethnic unity star in subtle brocade harmony
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    ctx.fillStyle = ethnicPalette[i % ethnicPalette.length];
    ctx.beginPath();
    for (let p = 0; p < 8; p++) {
      const pa = (p * Math.PI) / 4;
      const pr = p % 2 === 0 ? 15 : 5;
      if (p === 0) ctx.moveTo(Math.cos(pa) * pr, Math.sin(pa) * pr);
      else ctx.lineTo(Math.cos(pa) * pr, Math.sin(pa) * pr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  return configureTexture(canvas, true, anisotropy);
}

/**
 * Traditional Vietnamese Crescent Flute Kite (Diều Sáo) painted on handmade giấy dó silk.
 */
function createKiteTexture(anisotropy: number): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const [canvas, ctx] = makeCanvas(w, h);
  ctx.clearRect(0, 0, w, h);

  // Classic graceful Vietnamese crescent kite silhouette (cánh diều cong vầng trăng)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(16, 170);
  ctx.bezierCurveTo(120, 26, 392, 26, 496, 170);
  ctx.bezierCurveTo(380, 134, 132, 134, 16, 170);
  ctx.closePath();

  const silkGrad = ctx.createLinearGradient(0, 30, 0, 180);
  silkGrad.addColorStop(0, '#fff4d4');
  silkGrad.addColorStop(0.55, '#f6d28a');
  silkGrad.addColorStop(1, '#d85c42');
  ctx.fillStyle = silkGrad;
  ctx.fill();

  ctx.strokeStyle = '#9c221c';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Traditional painted lotus-sun folk emblem at kite center
  ctx.fillStyle = '#c42420';
  ctx.beginPath();
  ctx.arc(256, 102, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fae084';
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    const r = i % 2 === 0 ? 20 : 9;
    const x = 256 + Math.cos(a) * r;
    const y = 102 + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Delicate bamboo rib arches
  ctx.strokeStyle = 'rgba(92, 54, 24, 0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(256, 52);
  ctx.lineTo(256, 146);
  ctx.stroke();
  ctx.restore();

  return configureTexture(canvas, true, anisotropy);
}

/**
 * Multi-scale organic lake water ripple bump texture.
 */
function createWaterRippleTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const [canvas, ctx] = makeCanvas(size, size);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // Horizontal directional breeze wavelets + soft concentric rings
  for (let y = 0; y < size; y += 6) {
    const wave = Math.sin((y / size) * Math.PI * 16) * 24 + 128;
    ctx.fillStyle = `rgba(${Math.floor(wave)},${Math.floor(wave)},${Math.floor(wave)},0.35)`;
    ctx.fillRect(0, y, size, 4);
  }

  for (let i = 0; i < 64; i++) {
    const cx = seededNoise(i, 1.7) * size;
    const cy = seededNoise(i, 9.4) * size;
    const rx = 20 + (i % 6) * 16;
    const ry = 8 + (i % 4) * 6;
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(232,232,232,0.28)' : 'rgba(32,32,32,0.26)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  return configureTexture(canvas, false, anisotropy, [8, 8]);
}

/**
 * Soft alpha-feathered mountain mist texture for Tràng An / Hạ Long atmospheric haze.
 */
function createMistCloudTexture(anisotropy: number): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const [canvas, ctx] = makeCanvas(w, h);
  ctx.clearRect(0, 0, w, h);

  const puffs = [
    [w * 0.28, h * 0.54, 125, 0.34],
    [w * 0.48, h * 0.48, 155, 0.42],
    [w * 0.68, h * 0.56, 130, 0.34],
    [w * 0.5, h * 0.62, 190, 0.26],
  ];
  for (const [cx, cy, r, alpha] of puffs) {
    const g = ctx.createRadialGradient(cx, cy, 8, cx, cy, r);
    g.addColorStop(0, `rgba(255, 246, 232, ${alpha})`);
    g.addColorStop(0.55, `rgba(248, 232, 214, ${alpha * 0.45})`);
    g.addColorStop(1, 'rgba(248, 232, 214, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return configureTexture(canvas, true, anisotropy);
}

/**
 * Cinematic Golden-Hour Dawn & Harvest-Moon Festival Night sky domes.
 */
function createSkyDomeTexture(
  mode: 'dawn' | 'night',
  anisotropy: number,
): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const [canvas, ctx] = makeCanvas(w, h);

  if (mode === 'dawn') {
    // Rich golden-hour sunlit sky with true warm/cool contrast (never flat pale beige)
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.0, '#4f82a8');
    grad.addColorStop(0.22, '#7da7bf');
    grad.addColorStop(0.38, '#c5c9c4');
    grad.addColorStop(0.49, '#f2cca0');
    grad.addColorStop(0.57, '#f8b97e');
    grad.addColorStop(0.68, '#df9e72');
    grad.addColorStop(1.0, '#8f6956');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Radiant low golden morning sun behind the heritage archipelago
    const sunX = w * 0.54;
    const sunY = h * 0.47;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 260);
    sunGrad.addColorStop(0, 'rgba(255, 250, 224, 0.98)');
    sunGrad.addColorStop(0.18, 'rgba(255, 224, 152, 0.78)');
    sunGrad.addColorStop(0.48, 'rgba(248, 178, 106, 0.34)');
    sunGrad.addColorStop(1, 'rgba(248, 178, 106, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, w, h);

    // Layered sunlit golden-rose clouds with depth shading
    for (let i = 0; i < 24; i++) {
      const cx = (i * 157 + 40) % w;
      const cy = h * 0.2 + (i % 6) * 26;
      const rx = 80 + (i % 4) * 38;
      const ry = 16 + (i % 3) * 9;

      // Soft warm shadow belly
      const shadowGrad = ctx.createRadialGradient(cx, cy + 5, 4, cx, cy + 5, rx);
      shadowGrad.addColorStop(0, 'rgba(176, 128, 118, 0.24)');
      shadowGrad.addColorStop(1, 'rgba(176, 128, 118, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.save();
      ctx.translate(cx, cy + 5);
      ctx.scale(1, ry / rx);
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Sunlit ivory-gold cloud crown
      const cloudGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, rx);
      cloudGrad.addColorStop(0, 'rgba(255, 245, 226, 0.56)');
      cloudGrad.addColorStop(0.58, 'rgba(252, 212, 168, 0.26)');
      cloudGrad.addColorStop(1, 'rgba(252, 212, 168, 0)');
      ctx.fillStyle = cloudGrad;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, ry / rx);
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else {
    // Deep royal velvet twilight indigo -> warm festival lantern crimson-amber horizon
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.0, '#090b1a');
    grad.addColorStop(0.28, '#13162f');
    grad.addColorStop(0.46, '#271a34');
    grad.addColorStop(0.58, '#4a2130');
    grad.addColorStop(0.7, '#341926');
    grad.addColorStop(1.0, '#120c18');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Warm festival lantern horizon glow
    const glow = ctx.createRadialGradient(w * 0.52, h * 0.53, 20, w * 0.52, h * 0.53, 300);
    glow.addColorStop(0, 'rgba(248, 158, 72, 0.36)');
    glow.addColorStop(0.48, 'rgba(196, 68, 72, 0.16)');
    glow.addColorStop(1, 'rgba(196, 68, 72, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // Luminous full harvest moon with soft silver-gold halo
    const moonX = w * 0.39;
    const moonY = h * 0.28;
    const moonHalo = ctx.createRadialGradient(moonX, moonY, 12, moonX, moonY, 110);
    moonHalo.addColorStop(0, 'rgba(255, 244, 212, 0.96)');
    moonHalo.addColorStop(0.22, 'rgba(255, 230, 174, 0.42)');
    moonHalo.addColorStop(1, 'rgba(180, 198, 240, 0)');
    ctx.fillStyle = moonHalo;
    ctx.fillRect(moonX - 120, moonY - 120, 240, 240);

    ctx.fillStyle = '#fff6dc';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 18, 0, Math.PI * 2);
    ctx.fill();

    // Subtle distant star dust (crisp stars are rendered by THREE.Points starfield)
    for (let i = 0; i < 90; i++) {
      const sx = (i * 113 + 29) % w;
      const sy = (i * 67 + 13) % Math.floor(h * 0.44);
      ctx.fillStyle = 'rgba(220, 232, 255, 0.32)';
      ctx.fillRect(sx, sy, 1.2, 1.2);
    }
  }

  const tex = configureTexture(canvas, true, anisotropy);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const [canvas, ctx] = makeCanvas(size, size);
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.08,
    size / 2,
    size / 2,
    size * 0.5,
  );
  grad.addColorStop(0, 'rgba(26, 16, 10, 0.55)');
  grad.addColorStop(0.55, 'rgba(26, 16, 10, 0.22)');
  grad.addColorStop(1, 'rgba(26, 16, 10, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createSceneTextures(maxAnisotropy: number): SceneTextureBundle {
  const anisotropy = Math.max(1, Math.min(maxAnisotropy, 8));
  const dongSon = createDongSonTextures(anisotropy);
  const flagMap = createVietnamFlagTexture(anisotropy);
  const festivalFlagMap = createFestivalFlagTexture(anisotropy);
  const terracotta = createTerracottaTileTextures(anisotropy);
  const lacquer = createLacquerWoodTextures(anisotropy);
  const darkWood = createDarkWoodTextures(anisotropy);
  const brick = createBrickTextures(anisotropy);
  const stone = createStoneTextures(anisotropy);
  const courtyard = createCourtyardPavingTextures(anisotropy);
  const steleMap = createStelePlaqueTexture(anisotropy);
  const lotusPetalMap = createLotusPetalTexture(anisotropy);
  const lotusPadMap = createLotusPadTexture(anisotropy);
  const peachBlossomMap = createBlossomSprigTexture('peach', anisotropy);
  const apricotBlossomMap = createBlossomSprigTexture('apricot', anisotropy);
  const waterRippleMap = createWaterRippleTexture(anisotropy);
  const waterGlowMap = createWaterGlowTexture(anisotropy);
  const brocadeRibbonMap = createBrocadeRibbonTexture(anisotropy);
  const unityHaloMap = createUnityHaloTexture(anisotropy);
  const kiteMap = createKiteTexture(anisotropy);
  const sparkMap = createSparkTexture(anisotropy);
  const mistCloudMap = createMistCloudTexture(anisotropy);
  const skyDawnMap = createSkyDomeTexture('dawn', anisotropy);
  const skyNightMap = createSkyDomeTexture('night', anisotropy);
  const contactShadowMap = createContactShadowTexture();

  const all = [
    dongSon.map,
    dongSon.bump,
    flagMap,
    festivalFlagMap,
    terracotta.map,
    terracotta.bump,
    lacquer.map,
    lacquer.bump,
    darkWood.map,
    darkWood.bump,
    brick.map,
    brick.bump,
    stone.map,
    stone.bump,
    courtyard.map,
    courtyard.bump,
    steleMap,
    lotusPetalMap,
    lotusPadMap,
    peachBlossomMap,
    apricotBlossomMap,
    waterRippleMap,
    waterGlowMap,
    brocadeRibbonMap,
    unityHaloMap,
    kiteMap,
    sparkMap,
    mistCloudMap,
    skyDawnMap,
    skyNightMap,
    contactShadowMap,
  ];

  return {
    dongSonMap: dongSon.map,
    dongSonBump: dongSon.bump,
    flagMap,
    festivalFlagMap,
    terracottaTileMap: terracotta.map,
    terracottaTileBump: terracotta.bump,
    lacquerWoodMap: lacquer.map,
    lacquerWoodBump: lacquer.bump,
    darkWoodMap: darkWood.map,
    darkWoodBump: darkWood.bump,
    brickMap: brick.map,
    brickBump: brick.bump,
    stoneMap: stone.map,
    stoneBump: stone.bump,
    courtyardPavingMap: courtyard.map,
    courtyardPavingBump: courtyard.bump,
    steleMap,
    lotusPetalMap,
    lotusPadMap,
    peachBlossomMap,
    apricotBlossomMap,
    waterRippleMap,
    waterGlowMap,
    brocadeRibbonMap,
    unityHaloMap,
    kiteMap,
    sparkMap,
    mistCloudMap,
    skyDawnMap,
    skyNightMap,
    contactShadowMap,
    dispose: () => {
      all.forEach((t) => t.dispose());
    },
  };
}
