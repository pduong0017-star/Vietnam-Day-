import { useEffect, useRef } from 'react';

export interface ShatterOriginRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ScrollFireworkTransitionProps {
  active: boolean;
  originRect: ShatterOriginRect | null;
  onStageReveal: () => void;
  onComplete: () => void;
}

interface SilkShard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vRot: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface FireworkSpark {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  delay: number;
}

interface ShockRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  delay: number;
  age: number;
  duration: number;
}

const SHARD_COLORS = [
  '#f8eccb',
  '#f0cf7b',
  '#e6b44c',
  '#c8322e',
  '#9e1f24',
  '#fff6dc',
];

const BURST_PALETTES = [
  ['#ffe38a', '#ff5947', '#fff8df'],
  ['#ffb3cc', '#ffe38d', '#ffffff'],
  ['#ffd15c', '#ff8c38', '#fff4cc'],
  ['#8bf0c8', '#ffe078', '#e2fff4'],
  ['#ffd86e', '#ff6454', '#ffe9a8'],
];

export function ScrollFireworkTransition({
  active,
  originRect,
  onStageReveal,
  onComplete,
}: ScrollFireworkTransitionProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onStageRevealRef = useRef(onStageReveal);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onStageRevealRef.current = onStageReveal;
  }, [onStageReveal]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!active) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      const revealTimer = window.setTimeout(() => onStageRevealRef.current(), 120);
      const doneTimer = window.setTimeout(() => onCompleteRef.current(), 280);
      return () => {
        clearTimeout(revealTimer);
        clearTimeout(doneTimer);
      };
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      onStageRevealRef.current();
      onCompleteRef.current();
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const rect: ShatterOriginRect = originRect ?? {
      x: width * 0.3,
      y: height * 0.14,
      width: width * 0.4,
      height: height * 0.7,
    };
    const centerX = rect.x + rect.width * 0.5;
    const centerY = rect.y + rect.height * 0.5;

    // 1. Shatter silk-paper & gold-leaf fragments directly out of the unrolled scroll bounds
    const shards: SilkShard[] = [];
    const shardCount = 160;
    for (let i = 0; i < shardCount; i++) {
      const sx = rect.x + Math.random() * rect.width;
      const sy = rect.y + Math.random() * rect.height;
      const dx = sx - centerX;
      const dy = sy - centerY;
      const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.7;
      const speed = 170 + Math.random() * 480;
      shards.push({
        x: sx + Math.cos(angle) * 14,
        y: sy + Math.sin(angle) * 14,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 130 - Math.random() * 140,
        w: 6 + Math.random() * 14,
        h: 5 + Math.random() * 11,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 12,
        color: SHARD_COLORS[i % SHARD_COLORS.length],
        alpha: 1,
        life: 0,
        maxLife: 0.85 + Math.random() * 0.65,
      });
    }

    // 2. Five Grand Chrysanthemum Firework Bursts blooming across the screen
    const sparks: FireworkSpark[] = [];
    const rings: ShockRing[] = [];
    const burstCenters = [
      { x: centerX, y: centerY - rect.height * 0.1, delay: 0.0, count: 96, radius: 245 },
      { x: width * 0.27, y: height * 0.31, delay: 0.08, count: 78, radius: 205 },
      { x: width * 0.73, y: height * 0.29, delay: 0.14, count: 78, radius: 210 },
      { x: width * 0.41, y: height * 0.21, delay: 0.24, count: 72, radius: 185 },
      { x: width * 0.61, y: height * 0.25, delay: 0.32, count: 72, radius: 190 },
    ];

    burstCenters.forEach((b, bIdx) => {
      const palette = BURST_PALETTES[bIdx % BURST_PALETTES.length];
      rings.push({
        x: b.x,
        y: b.y,
        radius: 18,
        maxRadius: b.radius,
        color: palette[0],
        delay: b.delay,
        age: 0,
        duration: 0.68,
      });

      for (let p = 0; p < b.count; p++) {
        const theta = (p / b.count) * Math.PI * 2 + (Math.random() - 0.5) * 0.1;
        const ringTier = p % 3 === 0 ? 1.0 : p % 3 === 1 ? 0.72 : 0.44;
        const speed = (250 + Math.random() * 220) * ringTier;
        const seedStep = b.delay === 0 ? 0.065 : 0;
        const vx = Math.cos(theta) * speed;
        const vy = Math.sin(theta) * speed - 35;
        sparks.push({
          x: b.x + vx * seedStep,
          y: b.y + vy * seedStep,
          px: b.x,
          py: b.y,
          vx,
          vy,
          color: palette[p % palette.length],
          size: p % 4 === 0 ? 3.8 : 2.5,
          life: seedStep,
          maxLife: 0.92 + Math.random() * 0.58,
          delay: b.delay,
        });
      }
    });

    let rafId = 0;
    let startTime = performance.now();
    let lastTime = startTime;
    let revealed = false;

    const render = (now: number) => {
      const totalElapsed = (now - startTime) / 1000;
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (!revealed && totalElapsed >= 0.42) {
        revealed = true;
        onStageRevealRef.current();
      }

      ctx.clearRect(0, 0, width, height);

      // Warm golden radial ignition flash during the initial 0.35s shatter
      if (totalElapsed < 0.45) {
        const flashAlpha = Math.max(0, 1 - totalElapsed / 0.45) * 0.52;
        const grad = ctx.createRadialGradient(
          centerX,
          centerY,
          12,
          centerX,
          centerY,
          Math.max(width, height) * 0.58,
        );
        grad.addColorStop(0, `rgba(255, 238, 178, ${flashAlpha})`);
        grad.addColorStop(0.45, `rgba(224, 92, 54, ${flashAlpha * 0.45})`);
        grad.addColorStop(1, 'rgba(224, 92, 54, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw expanding golden shockwave rings
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < rings.length; i++) {
        const r = rings[i];
        if (totalElapsed < r.delay) continue;
        r.age += dt;
        const t = Math.min(1, r.age / r.duration);
        if (t >= 1) continue;
        const easeOut = 1 - Math.pow(1 - t, 3);
        r.radius = 8 + easeOut * r.maxRadius;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = (1 - t) * 0.52;
        ctx.lineWidth = Math.max(1, (1 - t) * 4.5);
        ctx.stroke();
      }
      ctx.restore();

      // Draw fluttering silk & gold-leaf scroll fragments
      for (let i = 0; i < shards.length; i++) {
        const s = shards[i];
        s.life += dt;
        if (s.life >= s.maxLife) continue;
        const progress = s.life / s.maxLife;
        const drag = Math.exp(-1.9 * dt);
        s.vx *= drag;
        s.vy = s.vy * drag + 260 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.rot += s.vRot * dt;
        s.alpha = Math.max(0, 1 - Math.pow(progress, 1.5));

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color;
        ctx.fillRect(-s.w * 0.5, -s.h * 0.5, s.w, s.h);
        ctx.restore();
      }

      // Draw additive chrysanthemum firework streaks & glowing star heads
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < sparks.length; i++) {
        const sp = sparks[i];
        if (totalElapsed < sp.delay) continue;
        sp.life += dt;
        if (sp.life >= sp.maxLife) continue;
        const progress = sp.life / sp.maxLife;
        const drag = Math.exp(-2.2 * dt);
        sp.px = sp.x;
        sp.py = sp.y;
        sp.vx *= drag;
        sp.vy = sp.vy * drag + 185 * dt;
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;

        const fade = Math.max(0, 1 - Math.pow(progress, 1.4));
        const twinkle = 0.72 + Math.sin(totalElapsed * 28 + i * 1.9) * 0.28;
        ctx.globalAlpha = fade * twinkle;

        ctx.beginPath();
        ctx.moveTo(sp.px, sp.py);
        ctx.lineTo(sp.x, sp.y);
        ctx.strokeStyle = sp.color;
        ctx.lineWidth = sp.size * 0.9;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fillStyle = sp.color;
        ctx.fill();
      }
      ctx.restore();

      if (totalElapsed < 1.65) {
        rafId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
        onCompleteRef.current();
      }
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [active, originRect]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      data-testid="scroll-firework-canvas"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
    />
  );
}
