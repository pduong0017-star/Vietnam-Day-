import type { AudioStage, SceneMood } from './greetingLink';
import { SPEECH_CUTOFF_SEC } from './greetingLink';

export interface DirectorKeyframe {
  /** Timeline seconds on unified show clock (0..23.95 = speech, 23.95..259 = song) */
  time: number;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  mood: SceneMood;
  actNumber: 1 | 2 | 3 | 4;
  actTitle: string;
}

export interface DirectorSample {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  mood: SceneMood;
  actNumber: 1 | 2 | 3 | 4;
  actTitle: string;
  /** True during emotional chorus peaks where extra fireworks & lanterns celebrate */
  isClimax: boolean;
  /** True during the closing tribute outro celebrating 24-11 Ngày Văn Hóa Việt Nam */
  isFinaleTribute: boolean;
  /** Unified show progress 0..1 */
  progress: number;
}

/**
 * Progressive 3D reveal weights (0 = hidden, 1 = fully manifested).
 * In Normal Mode (isDirectorMode === false), every weight is 1 so the entire sanctuary is visible immediately.
 * In Director Mode, layers emerge cinematically on their matching speech & song lyric cues!
 */
export interface DirectorRevealWeights {
  /** Khuê Văn Các + Trống Đồng đôi + Sunbeams ("soi đường cho quốc dân đi") */
  pavilion: number;
  /** Cầu Thê Húc + Đầm Sen + Cá Koi + Thuyền mộc + Đèn lồng ("Văn hóa còn thì dân tộc còn") */
  lakeLife: number;
  /** Chùa Một Cột + Hoa Đào + Hoa Mai + Tre làng + Cánh hoa bay ("Này nắng tre xanh...") */
  floraPagoda: number;
  /** 3 Diều Sáo + Đèn hoa đăng mặt nước ("Việt Nam sáng trong bao lời ca...") */
  kites: number;
  /** Cột Cờ Hà Nội + Quốc Kỳ + 4 Cờ Hội Ngũ Sắc ("Việt Nam vẫn luôn huy hoàng") */
  flags: number;
  /** Vòng Hào Quang Trống Đồng 54 Dân Tộc (Chorus 1: "Lời Nam Quốc Sơn Hà định phận") */
  unityHalo: number;
  /** Dải Lụa Thổ Cẩm 360° ("Trời xanh như áng thiên thư Bình Ngô / Danh nhân họa nước non") */
  brocadeRibbon: number;
  /** Rồng Thời Lý + Ngọc Rồng + Bụi sao vàng ("Ai biết khi xưa Thăng Long Thành / Rồng thiêng từ đây vút bay") */
  dragon: number;
  /** Đàn Chim Hạc / Chim Lạc Hồng ("Thương cánh chim Lạc Hồng / Bay dọc đất nước theo bóng cây Trường Sơn") */
  lacBirds: number;
  /** Đêm Hoa Đăng: Đom đóm + Đèn trời + Pháo hoa lễ hội (Chorus 2 & 3 Climax) */
  nightCelebration: number;
}

export interface DirectorChapter {
  id: string;
  label: string;
  showTime: number;
}

export const TOTAL_SHOW_DURATION_SEC = SPEECH_CUTOFF_SEC + 235;
export const FINALE_TRIBUTE_START_SEC = SPEECH_CUTOFF_SEC + 225.2;

export const DIRECTOR_CHAPTERS: DirectorChapter[] = [
  { id: 'intro', label: 'Mở đầu', showTime: 0 },
  { id: 'heritage', label: 'Non sông', showTime: 40 },
  { id: 'halo', label: 'Nam Quốc Sơn Hà', showTime: 75.2 },
  { id: 'dragon', label: 'Rồng thiêng', showTime: 155.5 },
  { id: 'birds', label: 'Chim Lạc Hồng', showTime: 171.8 },
  { id: 'finale', label: 'Tôn vinh 24-11', showTime: FINALE_TRIBUTE_START_SEC + 0.5 },
];

/**
 * 13-beat, 4-Act Cinematic Director Script synced precisely to:
 * - Act I (0:00–0:24): Opening speech of Cố TBT Nguyễn Phú Trọng (Bia Rùa -> Khuê Văn Các -> Đầm Sen)
 * - Act II (0:24–1:55): Dawn -> Golden Sunset tour (Chùa Một Cột, Hoa Đào/Mai, Diều Sáo, Cột Cờ, Hào Quang 54 Dân Tộc, Dải Lụa 360°)
 * - Act III (1:55–3:02): Sunset -> Night sky sweep precisely framed for "Rồng thiêng từ đây vút bay" (156s) & "Thương cánh chim Lạc Hồng" (173s)
 * - Act IV (3:02–4:19): Grand Festival Night climax with fireworks, lantern ocean & sweeping 24-11 Grand Finale Tribute
 */
export const DIRECTOR_KEYFRAMES: DirectorKeyframe[] = [
  // ACT I — Khai Mở Văn Hiến (Speech 0:00–0:23.95)
  {
    time: 0,
    position: [-7.8, 3.3, 12.2],
    target: [-4.6, 2.3, 4.6],
    fov: 42,
    mood: 'dawn',
    actNumber: 1,
    actTitle: 'Hồi I · Khai Mở Văn Hiến',
  },
  {
    time: 12,
    position: [-4.6, 4.9, 13.0],
    target: [-1.1, 4.0, -0.4],
    fov: 43,
    mood: 'dawn',
    actNumber: 1,
    actTitle: 'Hồi I · Khai Mở Văn Hiến',
  },
  {
    time: 23.95,
    position: [0.0, 8.6, 27.2],
    target: [-0.4, 4.8, -0.8],
    fov: 45,
    mood: 'dawn',
    actNumber: 1,
    actTitle: 'Hồi I · Khai Mở Văn Hiến',
  },

  // ACT II — Non Sông Gấm Vóc (Song 0:00–1:32 -> Show 23.95–116s)
  {
    time: 40,
    position: [-15.8, 6.4, 15.2],
    target: [-8.4, 3.6, -1.6],
    fov: 44,
    mood: 'dawn',
    actNumber: 2,
    actTitle: 'Hồi II · Non Sông Gấm Vóc',
  },
  {
    time: 58,
    position: [14.6, 8.2, 13.8],
    target: [6.2, 7.2, -2.4],
    fov: 44,
    mood: 'sunset',
    actNumber: 2,
    actTitle: 'Hồi II · Non Sông Gấm Vóc',
  },
  {
    time: 76,
    position: [0.4, 8.2, 24.5],
    target: [-0.5, 7.4, -6.5],
    fov: 46,
    mood: 'sunset',
    actNumber: 2,
    actTitle: 'Hồi II · Non Sông Gấm Vóc',
  },
  {
    time: 102,
    position: [13.2, 11.0, 23.2],
    target: [0.0, 6.4, -1.6],
    fov: 46,
    mood: 'sunset',
    actNumber: 2,
    actTitle: 'Hồi II · Non Sông Gấm Vóc',
  },

  // ACT III — Rồng Thiêng & Cánh Chim Lạc Hồng (Song 1:32–2:38 -> Show 116–182s)
  {
    time: 132,
    position: [-11.5, 5.4, 21.0],
    target: [-1.2, 8.8, -7.2],
    fov: 47,
    mood: 'sunset',
    actNumber: 3,
    actTitle: 'Hồi III · Rồng Thiêng Thăng Long',
  },
  // Framed wide-sky upward angle right when "Ai biết khi xưa Thăng Long Thành / Rồng thiêng từ đây vút bay" hits!
  {
    time: 158,
    position: [-12.6, 6.8, 22.8],
    target: [-2.4, 10.6, -7.8],
    fov: 48,
    mood: 'sunset',
    actNumber: 3,
    actTitle: 'Hồi III · Rồng Thiêng Thăng Long',
  },
  // Swooping upward panorama right when "Thương cánh chim Lạc Hồng / Bay dọc đất nước theo bóng cây Trường Sơn" hits!
  {
    time: 174,
    position: [7.8, 6.6, 23.4],
    target: [-0.6, 9.8, -5.2],
    fov: 47,
    mood: 'night',
    actNumber: 3,
    actTitle: 'Hồi III · Cánh Chim Lạc Hồng',
  },

  // ACT IV — Thịnh Vượng Sáng Ngời & Khúc Kết Tôn Vinh 24-11 (Song 2:38–3:55 -> Show 182–259s)
  {
    time: 196,
    position: [15.8, 10.2, 22.4],
    target: [-0.4, 6.2, -1.6],
    fov: 46,
    mood: 'night',
    actNumber: 4,
    actTitle: 'Hồi IV · Thịnh Vượng Sáng Ngời',
  },
  {
    time: 226,
    position: [-14.2, 11.0, 23.6],
    target: [-0.4, 5.8, -1.2],
    fov: 46,
    mood: 'night',
    actNumber: 4,
    actTitle: 'Hồi IV · Thịnh Vượng Sáng Ngời',
  },
  {
    time: FINALE_TRIBUTE_START_SEC,
    position: [0.0, 8.8, 28.4],
    target: [-0.4, 5.4, -1.2],
    fov: 45,
    mood: 'night',
    actNumber: 4,
    actTitle: 'Tôn Vinh Ngày Văn Hóa Việt Nam 24 · 11',
  },
  {
    time: TOTAL_SHOW_DURATION_SEC,
    position: [0.0, 9.4, 30.2],
    target: [-0.4, 5.6, -1.2],
    fov: 45,
    mood: 'night',
    actNumber: 4,
    actTitle: 'Tôn Vinh Ngày Văn Hóa Việt Nam 24 · 11',
  },
];

function smoothstep01(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function revealWindow(t: number, startSec: number, durationSec: number): number {
  return smoothstep01((t - startSec) / Math.max(0.001, durationSec));
}

function lerpNum(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVec3(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [lerpNum(a[0], b[0], t), lerpNum(a[1], b[1], t), lerpNum(a[2], b[2], t)];
}

/**
 * Converts (audioStage, playbackTime) into a unified show timeline clock in seconds.
 */
export function getUnifiedShowTime(stage: AudioStage, playbackTime: number): number {
  const safe = Math.max(0, playbackTime);
  if (stage === 'speech') {
    return Math.min(SPEECH_CUTOFF_SEC, safe);
  }
  return Math.min(TOTAL_SHOW_DURATION_SEC, SPEECH_CUTOFF_SEC + safe);
}

/**
 * Splits a unified show timestamp back into (audioStage, stageSeconds) for accurate chapter seeking.
 */
export function splitUnifiedShowTime(showTimeSec: number): {
  stage: AudioStage;
  seconds: number;
} {
  const clamped = Math.max(0, Math.min(TOTAL_SHOW_DURATION_SEC, showTimeSec));
  if (clamped < SPEECH_CUTOFF_SEC) {
    return { stage: 'speech', seconds: clamped };
  }
  return { stage: 'song', seconds: clamped - SPEECH_CUTOFF_SEC };
}

/**
 * Computes progressive 3D heritage element reveal weights (0..1).
 * Normal Mode: all 1.0 (everything visible immediately).
 * Director Mode: each heritage landmark & mythic creature manifests on its matching lyric cue!
 */
export function evaluateDirectorReveals(
  showTimeSec: number,
  isDirectorMode: boolean,
): DirectorRevealWeights {
  if (!isDirectorMode) {
    return {
      pavilion: 1,
      lakeLife: 1,
      floraPagoda: 1,
      kites: 1,
      flags: 1,
      unityHalo: 1,
      brocadeRibbon: 1,
      dragon: 1,
      lacBirds: 1,
      nightCelebration: 1,
    };
  }

  const t = Math.max(0, showTimeSec);
  return {
    // 0:04.2 (speech: "soi đường cho quốc dân đi") -> Khuê Văn Các & Trống Đồng đôi
    pavilion: revealWindow(t, 4.0, 3.8),
    // 0:13.2 (speech: "Văn hóa còn thì dân tộc còn") -> Cầu Thê Húc, Đầm Sen, Cá Koi, Thuyền
    lakeLife: revealWindow(t, 13.0, 4.0),
    // 0:24.0 (song intro -> "Này nắng tre xanh mưa chân trời") -> Chùa Một Cột, Hoa Đào/Mai, Tre
    floraPagoda: revealWindow(t, 24.0, 4.2),
    // 0:39.5 (song 0:15.6: "Việt Nam sáng trong bao lời ca...") -> Diều Sáo & Hoa đăng mặt nước
    kites: revealWindow(t, 39.5, 4.0),
    // 0:55.5 (song 0:31.5: "Thời gian khắc ghi từ ngàn xưa, Việt Nam vẫn luôn huy hoàng") -> Cột Cờ & Cờ Hội Ngũ Sắc
    flags: revealWindow(t, 55.5, 4.0),
    // 1:14.8 (song 0:51.0 Chorus 1: "Lời Nam Quốc Sơn Hà định phận") -> Vòng Hào Quang 54 Dân Tộc
    unityHalo: revealWindow(t, 74.8, 4.2),
    // 1:32.0 (song 1:08.0: "Trời xanh như áng thiên thư Bình Ngô / Danh nhân họa nước non") -> Dải Lụa Thổ Cẩm 360°
    brocadeRibbon: revealWindow(t, 92.0, 4.5),
    // 2:35.8 (song 2:11.9: "Ai biết khi xưa Thăng Long Thành / Rồng thiêng từ đây vút bay") -> Rồng Thời Lý!
    dragon: revealWindow(t, 155.8, 4.2),
    // 2:52.0 (song 2:28.1: "Thương cánh chim Lạc Hồng / Bay dọc đất nước theo bóng cây Trường Sơn") -> Đàn Chim Lạc Hồng!
    lacBirds: revealWindow(t, 172.0, 3.8),
    // 3:01.5 (song 2:37.6 Chorus 2 & 3 Night Finale) -> Đom đóm, Đèn trời & Pháo hoa lễ hội!
    nightCelebration: revealWindow(t, 181.5, 4.5),
  };
}

/**
 * Evaluates smooth camera choreography, mood progression, climax energy,
 * and Grand Finale 24-11 Tribute activation at any unified show time (in seconds).
 */
export function evaluateDirectorAtTime(showTimeSec: number): DirectorSample {
  const t = Math.max(0, Math.min(TOTAL_SHOW_DURATION_SEC, showTimeSec));

  let prev = DIRECTOR_KEYFRAMES[0];
  let next = DIRECTOR_KEYFRAMES[DIRECTOR_KEYFRAMES.length - 1];

  for (let i = 0; i < DIRECTOR_KEYFRAMES.length - 1; i++) {
    const k0 = DIRECTOR_KEYFRAMES[i];
    const k1 = DIRECTOR_KEYFRAMES[i + 1];
    if (t >= k0.time && t <= k1.time) {
      prev = k0;
      next = k1;
      break;
    }
  }

  const span = Math.max(0.0001, next.time - prev.time);
  const localT = smoothstep01((t - prev.time) / span);

  // Subtle orbital arc lift mid-transition so camera sweeps gracefully around monuments
  const arcLift = Math.sin(localT * Math.PI) * 0.65;
  const pos = lerpVec3(prev.position, next.position, localT);
  pos[1] += arcLift;

  const target = lerpVec3(prev.target, next.target, localT);
  const fov = lerpNum(prev.fov, next.fov, localT);

  // Chorus climax windows: Chorus 1 (song 51..87s -> show 75..111s) & Chorus 2/3 Finale (song 158..235s -> show 182..259s)
  const isClimax = (t >= 75 && t <= 111) || t >= 182;
  const isFinaleTribute = t >= FINALE_TRIBUTE_START_SEC;

  return {
    position: pos,
    target,
    fov,
    mood: localT > 0.55 ? next.mood : prev.mood,
    actNumber: prev.actNumber,
    actTitle: isFinaleTribute ? 'Tôn Vinh Ngày Văn Hóa Việt Nam 24 · 11' : prev.actTitle,
    isClimax,
    isFinaleTribute,
    progress: t / TOTAL_SHOW_DURATION_SEC,
  };
}
