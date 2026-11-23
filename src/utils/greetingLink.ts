export type SceneMood = 'dawn' | 'night';

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

// Synchronized captions for the opening speech of Tổng Bí thư Nguyễn Phú Trọng (0:00 – 0:23.95)
export const SPEECH_CAPTIONS: LyricLine[] = [
  {
    startSec: 0,
    endSec: 4.6,
    text: '“Văn hóa Bác Hồ nói là soi đường cho quốc dân đi...”',
  },
  {
    startSec: 4.6,
    endSec: 13.8,
    text: '“...Văn hóa là nói lên bản sắc của một dân tộc.”',
  },
  {
    startSec: 13.8,
    endSec: 19.9,
    text: '“Văn hóa còn thì dân tộc còn, văn hóa mất thì dân tộc mất.”',
  },
  {
    startSec: 19.9,
    endSec: 24.5,
    text: '“Vì bản sắc văn hóa không còn thì cái đó không nói lên dân tộc nữa.” — Tổng Bí thư Nguyễn Phú Trọng',
  },
];

// Synchronized verses for the full studio track "Thịnh Vượng Việt Nam Sáng Ngời" — Bùi Trường Linh
export const SONG_LYRICS: LyricLine[] = [
  {
    startSec: 0,
    endSec: 16.5,
    text: 'Thịnh Vượng Việt Nam Sáng Ngời · Bùi Trường Linh',
  },
  {
    startSec: 16.5,
    endSec: 25.0,
    text: '“Việt Nam sáng trong bao lời ca, à ơi í a ru hời...”',
  },
  {
    startSec: 25.0,
    endSec: 33.0,
    text: '“Ngày nắng che xanh mưa chân trời rừng sâu, biển rộng núi cao...”',
  },
  {
    startSec: 33.0,
    endSec: 41.5,
    text: '“Thời gian khắc ghi từ ngàn xưa, Việt Nam vẫn luôn huy hoàng...”',
  },
  {
    startSec: 41.5,
    endSec: 51.0,
    text: '“Bao chiến công anh hùng muôn đời nhớ ơn mãi luôn rền vang...”',
  },
  {
    startSec: 51.0,
    endSec: 59.5,
    text: '“Lời Nam quốc sơn hà định phận, lòng như nhật nguyệt sáng soi...”',
  },
  {
    startSec: 59.5,
    endSec: 68.0,
    text: '“Mực in dấu quân dân nhà Trần, lời hịch còn vang sấm truyền...”',
  },
  {
    startSec: 68.0,
    endSec: 76.0,
    text: '“Trời xanh như áng thiên thư Bình Ngô, danh nhân họa nước non...”',
  },
  {
    startSec: 76.0,
    endSec: 89.0,
    text: '“Ngàn thu vững tuyên ngôn độc lập, thịnh vượng Việt Nam sáng ngời, đời đời ngàn muôn ấm no...”',
  },
  {
    startSec: 89.0,
    endSec: 123.0,
    text: 'Hòa tấu đàn tranh · sáo trúc · hào khí Việt Nam',
  },
  {
    startSec: 123.0,
    endSec: 132.0,
    text: '“Cọc chông cắm nơi Bạch Đằng Giang, nhiều phen phá tan quân thù...”',
  },
  {
    startSec: 132.0,
    endSec: 140.0,
    text: '“Ai biết khi xưa Thăng Long thành rồng thiêng từ đây vút bay...”',
  },
  {
    startSec: 140.0,
    endSec: 148.5,
    text: '“Bàn tay đã đi vạn dặm xa, bình minh chiếu trên quê nhà...”',
  },
  {
    startSec: 148.5,
    endSec: 156.5,
    text: '“Thương cánh chim Lạc Hồng bay dọc đất nước theo bóng cây Trường Sơn...”',
  },
  {
    startSec: 156.5,
    endSec: 173.0,
    text: '“Lời Nam quốc sơn hà định phận, lòng như nhật nguyệt sáng soi...”',
  },
  {
    startSec: 173.0,
    endSec: 189.0,
    text: '“Ngàn thu vững tuyên ngôn độc lập, thịnh vượng Việt Nam sáng ngời...”',
  },
  {
    startSec: 189.0,
    endSec: 214.0,
    text: '“Trời xanh như áng thiên thư Bình Ngô, danh nhân họa nước non...”',
  },
  {
    startSec: 214.0,
    endSec: 240.0,
    text: '“Thịnh vượng Việt Nam sáng ngời, đời đời ngàn muôn ấm no...”',
  },
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

  const mood: SceneMood = rawMood === 'night' ? 'night' : 'dawn';
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

export function getCaptionForStage(stage: AudioStage, seconds: number): string {
  const list = stage === 'speech' ? SPEECH_CAPTIONS : SONG_LYRICS;
  const safeSec = Math.max(0, seconds);
  const match = list.find(
    (line) => safeSec >= line.startSec && safeSec < line.endSec,
  );
  return match ? match.text : list[list.length - 1].text;
}

export function formatPlaybackTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
