export type SceneMood = 'dawn' | 'sunset' | 'night';

export type CameraPresetId = 'overview' | 'pavilion' | 'flagtower' | 'lotus';

export type AudioStage = 'speech' | 'song';

export interface GreetingConfig {
  to: string;
  from: string;
  message: string;
  mood: SceneMood;
  isPersonalized: boolean;
}

export interface GreetingPreset {
  id: string;
  label: string;
  to: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: {
    to?: string;
    from?: string;
    message?: string;
  };
}

export interface LyricLine {
  startSec: number;
  endSec: number;
  text: string;
  isInstrumental?: boolean;
}

export interface ActiveLyricCue {
  id: string;
  text: string;
  /** 0..1 progress through the current line */
  progress: number;
  /** True in the final 0.32s so the active line gently fades out before the next line appears */
  isExiting: boolean;
  isInstrumental: boolean;
}

// Intro speech: Cố Tổng Bí thư Nguyễn Phú Trọng (cut precisely at 23.95s inside the 23.46s–25.12s silence gap)
export const SPEECH_AUDIO_URL =
  '/assets/aistudio/snaptik.vn_7540817685551074567_c75e5960.mp3';
export const SPEECH_FADE_START_SEC = 23.45;
export const SPEECH_CUTOFF_SEC = 23.95;

// Full studio track: "Thịnh Vượng Việt Nam Sáng Ngời" — Bùi Trường Linh (3:55)
export const SONG_AUDIO_URL =
  '/assets/aistudio/YTSave.to_YouTube_Media_qaVjA4a9O7w_Th_nh-V__ng-Vi_t-Nam-S_ng-Ng_i-buitruonglinh_011_vbr_f7efa3b7.mp3';
export const SONG_DURATION_SEC = 235;

export const DEFAULT_GREETING: GreetingConfig = {
  to: 'Những người con đất Việt',
  from: 'Chào mừng 24-11',
  message:
    'Văn hóa còn thì dân tộc còn, văn hóa mất thì dân tộc mất. Chúc mừng Ngày Văn Hóa Việt Nam 24-11 rực rỡ bản sắc, gìn giữ hồn thiêng sông núi và vươn tầm thịnh vượng sáng ngời.',
  mood: 'dawn',
  isPersonalized: false,
};

export const GREETING_PRESETS: GreetingPreset[] = [
  {
    id: 'heritage',
    label: 'Hồn cốt dân tộc',
    to: 'Quý thầy cô và bạn bè',
    message:
      'Văn hóa còn thì dân tộc còn, văn hóa mất thì dân tộc mất. Kính chúc Ngày Văn Hóa Việt Nam 24-11 tràn đầy tự hào và lan tỏa vẻ đẹp ngàn năm văn hiến.',
  },
  {
    id: 'prosperity',
    label: 'Thịnh vượng sáng ngời',
    to: 'Đồng nghiệp và những người thân yêu',
    message:
      'Chào mừng Ngày Văn Hóa Việt Nam 24-11! Chúc mỗi chúng ta luôn giữ lửa đam mê, sáng tạo và chung tay xây dựng một Việt Nam thịnh vượng, sáng ngời.',
  },
  {
    id: 'youth',
    label: 'Thế hệ tiếp bước',
    to: 'Tuổi trẻ Việt Nam',
    message:
      'Tự hào trang sử hào hùng, vững bước tương lai rạng rỡ. Chúc mừng Ngày Văn Hóa Việt Nam 24-11 thật nhiều cảm hứng và dấu ấn văn hóa đẹp.',
  },
];

// Synchronized verbatim captions for the opening speech of Cố Tổng Bí thư Nguyễn Phú Trọng (0:00 – 0:23.95)
export const SPEECH_CAPTIONS: LyricLine[] = [
  {
    startSec: 0.0,
    endSec: 5.1,
    text: '“Văn hóa, Bác Hồ nói là soi đường cho quốc dân đi.”',
  },
  {
    startSec: 5.3,
    endSec: 10.6,
    text: '“Nhưng mà tôi nhớ trước đây, có một vị tiền bối đã nói là...”',
  },
  {
    startSec: 10.7,
    endSec: 14.3,
    text: '“...văn hóa là nói lên bản sắc của một dân tộc.”',
  },
  {
    startSec: 14.4,
    endSec: 19.6,
    text: '“Văn hóa còn thì dân tộc còn, văn hóa mất thì dân tộc mất.”',
  },
  {
    startSec: 19.7,
    endSec: 23.95,
    text: '“Vì bản sắc văn hóa không còn thì cái đó không nói lên dân tộc nữa.”',
  },
];

// Verbatim, line-by-line synced lyrics verified directly against the 3:55 studio audio
// "Thịnh Vượng Việt Nam Sáng Ngời" — Bùi Trường Linh
export const SONG_LYRICS: LyricLine[] = [
  // Intro (0:00 – 0:15.5)
  {
    startSec: 0.4,
    endSec: 14.8,
    text: 'Thịnh Vượng Việt Nam Sáng Ngời · Bùi Trường Linh',
    isInstrumental: true,
  },

  // Verse 1 (0:15.6 – 0:51.2)
  { startSec: 15.6, endSec: 20.1, text: 'Việt Nam sáng trong bao lời ca' },
  { startSec: 20.1, endSec: 24.6, text: 'À ơi ới a ru hời' },
  { startSec: 24.6, endSec: 29.1, text: 'Này nắng tre xanh mưa chân trời' },
  { startSec: 29.1, endSec: 33.5, text: 'Rừng sâu, biển rộng, núi cao' },
  { startSec: 33.5, endSec: 37.9, text: 'Thời gian khắc ghi từ ngàn xưa' },
  { startSec: 37.9, endSec: 42.3, text: 'Việt Nam vẫn luôn huy hoàng' },
  { startSec: 42.3, endSec: 46.6, text: 'Bao chiến công anh hùng' },
  { startSec: 46.6, endSec: 51.0, text: 'Muôn đời nhớ ơn, mãi luôn rền vang' },

  // Chorus 1 (0:51.2 – 1:27.2)
  { startSec: 51.2, endSec: 55.6, text: 'Lời Nam Quốc Sơn Hà định phận' },
  { startSec: 55.6, endSec: 60.0, text: 'Sông Như Nguyệt sáng soi' },
  { startSec: 60.0, endSec: 64.4, text: 'Mực in dấu quân dân nhà Trần' },
  { startSec: 64.4, endSec: 68.8, text: 'Lời Hịch còn vang sấm truyền' },
  { startSec: 68.8, endSec: 73.2, text: 'Trời xanh như áng thiên thư Bình Ngô' },
  { startSec: 73.2, endSec: 77.6, text: 'Danh nhân họa nước non' },
  { startSec: 77.6, endSec: 81.9, text: 'Ngàn thu vững Tuyên Ngôn Độc Lập' },
  { startSec: 81.9, endSec: 84.5, text: 'Thịnh vượng Việt Nam sáng ngời' },
  { startSec: 84.5, endSec: 87.3, text: 'Đời đời ngàn muôn ấm no' },

  // Instrumental Interlude (1:29 – 2:01)
  {
    startSec: 89.0,
    endSec: 121.4,
    text: 'Hòa tấu đàn tranh · sáo trúc · hào khí Việt Nam',
    isInstrumental: true,
  },

  // Verse 2 (2:03.3 – 2:37.7)
  { startSec: 123.3, endSec: 127.6, text: 'Cọc chông cắm nơi Bạch Đằng Giang' },
  { startSec: 127.6, endSec: 131.9, text: 'Nhiều phen phá tan quân thù' },
  { startSec: 131.9, endSec: 136.2, text: 'Ai biết khi xưa Thăng Long Thành' },
  { startSec: 136.2, endSec: 140.5, text: 'Rồng thiêng từ đây vút bay' },
  { startSec: 140.5, endSec: 144.8, text: 'Bàn tay đã đi vạn dặm xa' },
  { startSec: 144.8, endSec: 149.1, text: 'Bình minh chiếu trên quê nhà' },
  { startSec: 149.1, endSec: 153.4, text: 'Thương cánh chim Lạc Hồng' },
  { startSec: 153.4, endSec: 157.6, text: 'Bay dọc đất nước theo bóng cây Trường Sơn' },

  // Chorus 2 (2:37.8 – 3:09.3)
  { startSec: 157.8, endSec: 162.1, text: 'Lời Nam Quốc Sơn Hà định phận' },
  { startSec: 162.1, endSec: 166.4, text: 'Sông Như Nguyệt sáng soi' },
  { startSec: 166.4, endSec: 170.7, text: 'Mực in dấu quân dân nhà Trần' },
  { startSec: 170.7, endSec: 175.0, text: 'Lời Hịch còn vang sấm truyền' },
  { startSec: 175.0, endSec: 179.3, text: 'Trời xanh như áng thiên thư Bình Ngô' },
  { startSec: 179.3, endSec: 183.5, text: 'Danh nhân họa nước non' },
  { startSec: 183.5, endSec: 186.5, text: 'Ngàn thu vững Tuyên Ngôn Độc Lập' },
  { startSec: 186.5, endSec: 189.3, text: 'Thịnh vượng Việt Nam sáng ngời' },

  // Chorus 3 — Grand Key-Lift Climax (3:09.4 – 3:46.2)
  { startSec: 189.4, endSec: 193.8, text: 'Lời Nam Quốc Sơn Hà định phận' },
  { startSec: 193.8, endSec: 198.2, text: 'Sông Như Nguyệt sáng soi' },
  { startSec: 198.2, endSec: 202.6, text: 'Mực in dấu quân dân nhà Trần' },
  { startSec: 202.6, endSec: 207.0, text: 'Lời Hịch còn vang sấm truyền' },
  { startSec: 207.0, endSec: 211.4, text: 'Trời xanh như áng thiên thư Bình Ngô' },
  { startSec: 211.4, endSec: 215.7, text: 'Danh nhân họa nước non' },
  { startSec: 215.7, endSec: 219.5, text: 'Ngàn thu vững Tuyên Ngôn Độc Lập' },
  { startSec: 219.5, endSec: 222.4, text: 'Thịnh vượng Việt Nam sáng ngời' },
  { startSec: 222.4, endSec: 226.4, text: 'Đời đời ngàn muôn ấm no' },
];

const MAX_NAME_LEN = 60;
const MAX_MESSAGE_LEN = 260;

export function sanitizeField(value: string, maxLen: number): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLen);
}

export function validateGreetingInput(input: {
  to: string;
  from: string;
  message: string;
}): ValidationResult {
  const errors: ValidationResult['errors'] = {};
  const to = sanitizeField(input.to, MAX_NAME_LEN);
  const from = sanitizeField(input.from, MAX_NAME_LEN);
  const message = sanitizeField(input.message, MAX_MESSAGE_LEN);

  if (to.length < 2) {
    errors.to = 'Vui lòng nhập tên người nhận (ít nhất 2 ký tự).';
  }
  if (from.length < 2) {
    errors.from = 'Vui lòng nhập tên người gửi (ít nhất 2 ký tự).';
  }
  if (message.length < 10) {
    errors.message = 'Vui lòng nhập lời chúc ý nghĩa (ít nhất 10 ký tự).';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function parseGreetingFromSearch(search: string): {
  greeting: GreetingConfig;
  autostart: boolean;
} {
  const params = new URLSearchParams(search);
  const rawTo = params.get('to');
  const rawFrom = params.get('from');
  const rawMsg = params.get('msg');
  const rawMood = params.get('mood');
  const autostart = params.get('autostart') === '1';

  const mood: SceneMood =
    rawMood === 'night' ? 'night' : rawMood === 'sunset' ? 'sunset' : 'dawn';
  const to = rawTo ? sanitizeField(rawTo, MAX_NAME_LEN) : '';
  const from = rawFrom ? sanitizeField(rawFrom, MAX_NAME_LEN) : '';
  const message = rawMsg ? sanitizeField(rawMsg, MAX_MESSAGE_LEN) : '';

  const isPersonalized = Boolean(to || from || message);

  return {
    autostart,
    greeting: {
      to: to || DEFAULT_GREETING.to,
      from: from || DEFAULT_GREETING.from,
      message: message || DEFAULT_GREETING.message,
      mood,
      isPersonalized,
    },
  };
}

export function buildShareableUrl(
  baseUrl: string,
  config: Pick<GreetingConfig, 'to' | 'from' | 'message' | 'mood'>,
): string {
  const url = new URL(baseUrl);
  url.search = '';
  const params = new URLSearchParams();
  params.set('to', sanitizeField(config.to, MAX_NAME_LEN));
  params.set('from', sanitizeField(config.from, MAX_NAME_LEN));
  params.set('msg', sanitizeField(config.message, MAX_MESSAGE_LEN));
  params.set('mood', config.mood);
  url.search = params.toString();
  return url.toString();
}

export function getSpeechVolumeForTime(seconds: number): number {
  if (seconds < SPEECH_FADE_START_SEC) return 1;
  if (seconds >= SPEECH_CUTOFF_SEC) return 0;
  const progress =
    (seconds - SPEECH_FADE_START_SEC) /
    (SPEECH_CUTOFF_SEC - SPEECH_FADE_START_SEC);
  return Math.max(0, Math.min(1, 1 - progress));
}

/**
 * Resolves the exact active line-by-line music/speech lyric cue at `seconds`.
 * Returns `null` during intentional silent breath gaps or the closing outro
 * so finished lines vanish cleanly before the next line glides in.
 */
export function getLyricCueForStage(
  stage: AudioStage,
  seconds: number,
): ActiveLyricCue | null {
  const list = stage === 'speech' ? SPEECH_CAPTIONS : SONG_LYRICS;
  const safeSec = Math.max(0, seconds);
  const idx = list.findIndex(
    (line) => safeSec >= line.startSec && safeSec < line.endSec,
  );
  if (idx === -1) return null;

  const line = list[idx];
  const duration = Math.max(0.1, line.endSec - line.startSec);
  const progress = Math.max(0, Math.min(1, (safeSec - line.startSec) / duration));
  const remaining = line.endSec - safeSec;
  const isExiting = remaining <= 0.34;

  return {
    id: `${stage}-${idx}`,
    text: line.text,
    progress,
    isExiting,
    isInstrumental: Boolean(line.isInstrumental),
  };
}

export function getCaptionForStage(stage: AudioStage, seconds: number): string {
  const cue = getLyricCueForStage(stage, seconds);
  if (cue) return cue.text;
  const list = stage === 'speech' ? SPEECH_CAPTIONS : SONG_LYRICS;
  return list[list.length - 1].text;
}

export function formatPlaybackTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
