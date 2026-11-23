import * as THREE from 'three';

export interface SceneTextureBundle {
  dongSonMap: THREE.CanvasTexture;
  dongSonBump: THREE.CanvasTexture;
  flagMap: THREE.CanvasTexture;
  jadeTileMap: THREE.CanvasTexture;
  jadeTileBump: THREE.CanvasTexture;
  brickMap: THREE.CanvasTexture;
  brickBump: THREE.CanvasTexture;
  stoneMap: THREE.CanvasTexture;
  stoneBump: THREE.CanvasTexture;
  steleMap: THREE.CanvasTexture;
  lotusPetalMap: THREE.CanvasTexture;
  waterRippleMap: THREE.CanvasTexture;
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

  // Warm burnished antique bronze with soft sage-gold patina
  const grad = cCtx.createRadialGradient(half, half, 24, half, half, half);
  grad.addColorStop(0, '#d2a24c');
  grad.addColorStop(0.28, '#aa7e36');
  grad.addColorStop(0.64, '#7a5a2b');
  grad.addColorStop(0.88, '#58482d');
  grad.addColorStop(1, '#433826');
  cCtx.fillStyle = grad;
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#555555';
  bCtx.fillRect(0, 0, size, size);

  for (let i = 0; i < 64; i++) {
    const r = 28 + (i / 64) * (half - 34);
    cCtx.strokeStyle = i % 2 === 0 ? 'rgba(245, 212, 134, 0.09)' : 'rgba(35, 22, 10, 0.08)';
    cCtx.lineWidth = 2;
    cCtx.beginPath();
    cCtx.arc(half, half, r, 0, Math.PI * 2);
    cCtx.stroke();
  }

  const ringRadii = [112, 132, 184, 204, 276, 300, 392, 418, 466, 492];
  for (const r of ringRadii) {
    cCtx.strokeStyle = '#e7be6a';
    cCtx.lineWidth = 5;
    cCtx.beginPath();
    cCtx.arc(half, half, r, 0, Math.PI * 2);
    cCtx.stroke();

    bCtx.strokeStyle = '#e8e8e8';
    bCtx.lineWidth = 6;
    bCtx.beginPath();
    bCtx.arc(half, half, r, 0, Math.PI * 2);
    bCtx.stroke();
  }

  // Center 14-point Lạc sun star
  const rays = 14;
  const innerR = 46;
  const outerR = 108;
  const drawSun = (ctx: CanvasRenderingContext2D, fill: string) => {
    ctx.save();
    ctx.translate(half, half);
    ctx.fillStyle = fill;
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
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  drawSun(cCtx, '#f0cb77');
  drawSun(bCtx, '#ffffff');

  const teeth = 48;
  for (let i = 0; i < teeth; i++) {
    const a1 = (i / teeth) * Math.PI * 2;
    const a2 = ((i + 0.5) / teeth) * Math.PI * 2;
    const a3 = ((i + 1) / teeth) * Math.PI * 2;
    const drawTooth = (ctx: CanvasRenderingContext2D, color: string) => {
      ctx.beginPath();
      ctx.moveTo(half + Math.cos(a1) * 138, half + Math.sin(a1) * 138);
      ctx.lineTo(half + Math.cos(a2) * 176, half + Math.sin(a2) * 176);
      ctx.lineTo(half + Math.cos(a3) * 138, half + Math.sin(a3) * 138);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };
    drawTooth(cCtx, '#dfb25b');
    drawTooth(bCtx, '#dcdcdc');
  }

  const dotCount = 36;
  for (let i = 0; i < dotCount; i++) {
    const a = (i / dotCount) * Math.PI * 2;
    const cx = half + Math.cos(a) * 240;
    const cy = half + Math.sin(a) * 240;
    cCtx.strokeStyle = '#e7be6a';
    cCtx.lineWidth = 3;
    cCtx.beginPath();
    cCtx.arc(cx, cy, 13, 0, Math.PI * 2);
    cCtx.stroke();
    cCtx.fillStyle = '#f5d68d';
    cCtx.beginPath();
    cCtx.arc(cx, cy, 4, 0, Math.PI * 2);
    cCtx.fill();

    bCtx.strokeStyle = '#ececec';
    bCtx.lineWidth = 4;
    bCtx.beginPath();
    bCtx.arc(cx, cy, 13, 0, Math.PI * 2);
    bCtx.stroke();
  }

  // Stylized Chim Lạc birds
  const birds = 16;
  for (let i = 0; i < birds; i++) {
    const a = (i / birds) * Math.PI * 2;
    const drawBird = (ctx: CanvasRenderingContext2D, color: string) => {
      ctx.save();
      ctx.translate(half, half);
      ctx.rotate(a);
      ctx.translate(346, 0);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -34);
      ctx.lineTo(6, -10);
      ctx.lineTo(28, 2);
      ctx.lineTo(9, 10);
      ctx.lineTo(14, 30);
      ctx.lineTo(0, 20);
      ctx.lineTo(-14, 30);
      ctx.lineTo(-9, 10);
      ctx.lineTo(-28, 2);
      ctx.lineTo(-6, -10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    drawBird(cCtx, '#edd082');
    drawBird(bCtx, '#f4f4f4');
  }

  const ticks = 120;
  for (let i = 0; i < ticks; i++) {
    const a = (i / ticks) * Math.PI * 2;
    cCtx.strokeStyle = '#dbb05c';
    cCtx.lineWidth = 2.5;
    cCtx.beginPath();
    cCtx.moveTo(half + Math.cos(a) * 424, half + Math.sin(a) * 424);
    cCtx.lineTo(half + Math.cos(a) * 460, half + Math.sin(a) * 460);
    cCtx.stroke();

    bCtx.strokeStyle = '#d8d8d8';
    bCtx.lineWidth = 3;
    bCtx.beginPath();
    bCtx.moveTo(half + Math.cos(a) * 424, half + Math.sin(a) * 424);
    bCtx.lineTo(half + Math.cos(a) * 460, half + Math.sin(a) * 460);
    bCtx.stroke();
  }

  return {
    map: configureTexture(cCanvas, true, anisotropy),
    bump: configureTexture(bCanvas, false, anisotropy),
  };
}

function createVietnamFlagTexture(anisotropy: number): THREE.CanvasTexture {
  const w = 768;
  const h = 512;
  const [canvas, ctx] = makeCanvas(w, h);

  // Soft velvet ceremonial crimson gradient
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#d82924');
  grad.addColorStop(0.5, '#c91f1b');
  grad.addColorStop(1, '#ba1b18');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Delicate silk weave
  ctx.fillStyle = 'rgba(255, 240, 220, 0.035)';
  for (let y = 0; y < h; y += 3) {
    ctx.fillRect(0, y, w, 1);
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
  starGrad.addColorStop(0, '#ffe46b');
  starGrad.addColorStop(1, '#f7c51e');
  ctx.fillStyle = starGrad;
  ctx.fill();
  ctx.restore();

  return configureTexture(canvas, true, anisotropy);
}

function createJadeTileTextures(anisotropy: number): {
  map: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const size = 512;
  const [cCanvas, cCtx] = makeCanvas(size, size);
  const [bCanvas, bCtx] = makeCanvas(size, size);

  // Soft celadon-jade Vietnamese glazed ceramic tiles
  cCtx.fillStyle = '#25796a';
  cCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#707070';
  bCtx.fillRect(0, 0, size, size);

  const cols = 16;
  const rows = 8;
  const colW = size / cols;
  const rowH = size / rows;

  for (let c = 0; c < cols; c++) {
    const x = c * colW;
    const tileGrad = cCtx.createLinearGradient(x, 0, x + colW, 0);
    tileGrad.addColorStop(0, '#1b5f53');
    tileGrad.addColorStop(0.32, '#349382');
    tileGrad.addColorStop(0.58, '#4bb3a0');
    tileGrad.addColorStop(0.86, '#26786a');
    tileGrad.addColorStop(1, '#164d43');
    cCtx.fillStyle = tileGrad;
    cCtx.fillRect(x, 0, colW, size);

    const bumpGrad = bCtx.createLinearGradient(x, 0, x + colW, 0);
    bumpGrad.addColorStop(0, '#2a2a2a');
    bumpGrad.addColorStop(0.5, '#eaeaea');
    bumpGrad.addColorStop(1, '#2a2a2a');
    bCtx.fillStyle = bumpGrad;
    bCtx.fillRect(x, 0, colW, size);
  }

  for (let r = 0; r < rows; r++) {
    const y = r * rowH;
    cCtx.fillStyle = 'rgba(14, 46, 39, 0.32)';
    cCtx.fillRect(0, y, size, 4);
    cCtx.fillStyle = 'rgba(210, 245, 232, 0.2)';
    cCtx.fillRect(0, y + 4, size, 3);
    bCtx.fillStyle = '#242424';
    bCtx.fillRect(0, y, size, 5);
  }

  return {
    map: configureTexture(cCanvas, true, anisotropy, [3, 2]),
    bump: configureTexture(bCanvas, false, anisotropy, [3, 2]),
  };
}

function createBrickTextures(anisotropy: number): {
  map: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const size = 512;
  const [cCanvas, cCtx] = makeCanvas(size, size);
  const [bCanvas, bCtx] = makeCanvas(size, size);

  // Soft warm ochre-sandstone mortar & rose-terracotta heritage bricks
  cCtx.fillStyle = '#b49477';
  cCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#404040';
  bCtx.fillRect(0, 0, size, size);

  const rows = 16;
  const cols = 8;
  const rh = size / rows;
  const cw = size / cols;

  const shades = ['#c98b5b', '#d29768', '#be7f52', '#cc9062', '#d8a174', '#c38558'];
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (cw * 0.5);
    for (let c = -1; c <= cols; c++) {
      const idx = Math.abs(r * 13 + c * 7) % shades.length;
      const x = c * cw + offset;
      const y = r * rh;
      cCtx.fillStyle = shades[idx];
      cCtx.fillRect(x + 2, y + 2, cw - 4, rh - 4);

      const bVal = 175 + ((r * 19 + c * 11) % 38);
      bCtx.fillStyle = `rgb(${bVal},${bVal},${bVal})`;
      bCtx.fillRect(x + 2, y + 2, cw - 4, rh - 4);
    }
  }

  return {
    map: configureTexture(cCanvas, true, anisotropy, [2, 2]),
    bump: configureTexture(bCanvas, false, anisotropy, [2, 2]),
  };
}

function createStoneTextures(anisotropy: number): {
  map: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const size = 512;
  const [cCanvas, cCtx] = makeCanvas(size, size);
  const [bCanvas, bCtx] = makeCanvas(size, size);

  // Soft warm parchment-sandstone (never harsh chalk white)
  cCtx.fillStyle = '#e2d0b4';
  cCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#9a9a9a';
  bCtx.fillRect(0, 0, size, size);

  const rows = 8;
  const cols = 4;
  const rh = size / rows;
  const cw = size / cols;
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (cw * 0.5);
    for (let c = -1; c <= cols; c++) {
      const x = c * cw + offset;
      const y = r * rh;
      const v = 224 + ((r * 7 + c * 13) % 14);
      cCtx.fillStyle = `rgb(${v}, ${v - 18}, ${v - 42})`;
      cCtx.fillRect(x + 2, y + 2, cw - 4, rh - 4);

      bCtx.fillStyle = '#c4c4c4';
      bCtx.fillRect(x + 2, y + 2, cw - 4, rh - 4);
    }
  }

  for (let i = 0; i < 1400; i++) {
    const gx = (i * 97) % size;
    const gy = (i * 53 + Math.floor(i / 7) * 19) % size;
    cCtx.fillStyle = i % 2 === 0 ? 'rgba(122, 92, 62, 0.06)' : 'rgba(255, 248, 234, 0.09)';
    cCtx.fillRect(gx, gy, 3, 2);
  }

  return {
    map: configureTexture(cCanvas, true, anisotropy, [2, 2]),
    bump: configureTexture(bCanvas, false, anisotropy, [2, 2]),
  };
}

/**
 * High-resolution Cultural Stele plaque featuring Cố Tổng Bí thư Nguyễn Phú Trọng's quote.
 */
function createStelePlaqueTexture(anisotropy: number): THREE.CanvasTexture {
  const w = 768;
  const h = 1152;
  const [canvas, ctx] = makeCanvas(w, h);

  // Soft velvet imperial crimson-lacquer background
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#6a191c');
  bg.addColorStop(0.5, '#8a2325');
  bg.addColorStop(1, '#581417');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Subtle golden radial halo behind top emblem
  const halo = ctx.createRadialGradient(w / 2, 190, 20, w / 2, 190, 320);
  halo.addColorStop(0, 'rgba(247, 212, 124, 0.22)');
  halo.addColorStop(1, 'rgba(247, 212, 124, 0.0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, w, h);

  // Double gold leaf frame with decorative inner corners
  ctx.strokeStyle = '#ecc268';
  ctx.lineWidth = 10;
  ctx.strokeRect(28, 28, w - 56, h - 56);
  ctx.lineWidth = 3.5;
  ctx.strokeRect(48, 48, w - 96, h - 96);

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
 * Soft blush-pink lotus petal gradient texture (ivory-cream base -> sakura rose tip).
 */
function createLotusPetalTexture(anisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 256);
  const grad = ctx.createLinearGradient(0, 256, 0, 0);
  grad.addColorStop(0, '#fff7ec');
  grad.addColorStop(0.35, '#fbd0dc');
  grad.addColorStop(0.75, '#f28eaa');
  grad.addColorStop(1, '#dd557c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Delicate translucent petal veins
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 2;
  for (let i = -4; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(128 + i * 6, 256);
    ctx.quadraticCurveTo(128 + i * 24, 130, 128 + i * 16, 10);
    ctx.stroke();
  }

  return configureTexture(canvas, true, anisotropy);
}

/**
 * Subtle organic silk-water ripple bump texture.
 */
function createWaterRippleTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const [canvas, ctx] = makeCanvas(size, size);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 42; i++) {
    const cx = ((i * 113) % size);
    const cy = ((i * 79) % size);
    const r = 18 + (i % 6) * 14;
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(230,230,230,0.22)' : 'rgba(40,40,40,0.22)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  return configureTexture(canvas, false, anisotropy, [6, 6]);
}

/**
 * Painterly Vietnamese silk-watercolor sky dome textures (Dawn & Lantern Night).
 */
function createSkyDomeTexture(
  mode: 'dawn' | 'night',
  anisotropy: number,
): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const [canvas, ctx] = makeCanvas(w, h);

  if (mode === 'dawn') {
    // Dreamy sunlit lotus-peach horizon -> warm silk cream -> soft porcelain azure zenith
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.0, '#9ec4d6');
    grad.addColorStop(0.28, '#cfe0e4');
    grad.addColorStop(0.46, '#f6e4cf');
    grad.addColorStop(0.56, '#fbd6b8');
    grad.addColorStop(0.66, '#f7cda9');
    grad.addColorStop(1.0, '#d8b798');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Warm golden morning sun halo behind Khuê Văn Các / Cột Cờ
    const sunGrad = ctx.createRadialGradient(w * 0.52, h * 0.48, 12, w * 0.52, h * 0.48, 220);
    sunGrad.addColorStop(0, 'rgba(255, 248, 220, 0.92)');
    sunGrad.addColorStop(0.32, 'rgba(255, 224, 168, 0.52)');
    sunGrad.addColorStop(0.7, 'rgba(251, 198, 152, 0.18)');
    sunGrad.addColorStop(1, 'rgba(251, 198, 152, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, w, h);

    // Soft painterly peach-ivory clouds
    for (let i = 0; i < 18; i++) {
      const cx = ((i * 173 + 60) % w);
      const cy = h * 0.24 + (i % 5) * 28;
      const rx = 90 + (i % 4) * 35;
      const ry = 18 + (i % 3) * 8;
      const cloudGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, rx);
      cloudGrad.addColorStop(0, 'rgba(255, 249, 238, 0.48)');
      cloudGrad.addColorStop(0.6, 'rgba(253, 232, 208, 0.22)');
      cloudGrad.addColorStop(1, 'rgba(253, 232, 208, 0)');
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
    // Velvet twilight indigo-plum zenith -> warm rose-amber lantern horizon
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.0, '#100b1d');
    grad.addColorStop(0.32, '#1d142c');
    grad.addColorStop(0.5, '#3b1d2e');
    grad.addColorStop(0.62, '#5a2832');
    grad.addColorStop(1.0, '#20111a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Warm festival lantern horizon glow
    const glow = ctx.createRadialGradient(w * 0.52, h * 0.52, 20, w * 0.52, h * 0.52, 280);
    glow.addColorStop(0, 'rgba(248, 166, 86, 0.34)');
    glow.addColorStop(0.5, 'rgba(196, 76, 84, 0.16)');
    glow.addColorStop(1, 'rgba(196, 76, 84, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // Delicate twilight stars
    for (let i = 0; i < 150; i++) {
      const sx = (i * 97 + 19) % w;
      const sy = ((i * 53 + 11) % Math.floor(h * 0.45));
      const r = i % 7 === 0 ? 2.1 : 1.1;
      ctx.fillStyle =
        i % 5 === 0 ? 'rgba(255, 232, 178, 0.85)' : 'rgba(232, 236, 255, 0.65)';
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
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
  grad.addColorStop(0, 'rgba(38, 22, 16, 0.42)');
  grad.addColorStop(0.55, 'rgba(38, 22, 16, 0.16)');
  grad.addColorStop(1, 'rgba(38, 22, 16, 0.0)');
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
  const jade = createJadeTileTextures(anisotropy);
  const brick = createBrickTextures(anisotropy);
  const stone = createStoneTextures(anisotropy);
  const steleMap = createStelePlaqueTexture(anisotropy);
  const lotusPetalMap = createLotusPetalTexture(anisotropy);
  const waterRippleMap = createWaterRippleTexture(anisotropy);
  const skyDawnMap = createSkyDomeTexture('dawn', anisotropy);
  const skyNightMap = createSkyDomeTexture('night', anisotropy);
  const contactShadowMap = createContactShadowTexture();

  const all = [
    dongSon.map,
    dongSon.bump,
    flagMap,
    jade.map,
    jade.bump,
    brick.map,
    brick.bump,
    stone.map,
    stone.bump,
    steleMap,
    lotusPetalMap,
    waterRippleMap,
    skyDawnMap,
    skyNightMap,
    contactShadowMap,
  ];

  return {
    dongSonMap: dongSon.map,
    dongSonBump: dongSon.bump,
    flagMap,
    jadeTileMap: jade.map,
    jadeTileBump: jade.bump,
    brickMap: brick.map,
    brickBump: brick.bump,
    stoneMap: stone.map,
    stoneBump: stone.bump,
    steleMap,
    lotusPetalMap,
    waterRippleMap,
    skyDawnMap,
    skyNightMap,
    contactShadowMap,
    dispose: () => {
      all.forEach((t) => t.dispose());
    },
  };
}
