import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_GREETING,
  SPEECH_CUTOFF_SEC,
  SPEECH_FADE_START_SEC,
  buildShareableUrl,
  formatPlaybackTime,
  getCaptionForStage,
  getSpeechVolumeForTime,
  parseGreetingFromSearch,
  validateGreetingInput,
} from './greetingLink';

test('parseGreetingFromSearch returns defaults with Nguyen Phu Trong quote when query is empty', () => {
  const parsed = parseGreetingFromSearch('');
  assert.equal(parsed.autostart, false);
  assert.equal(parsed.greeting.isPersonalized, false);
  assert.equal(parsed.greeting.mood, 'dawn');
  assert.equal(parsed.greeting.to, DEFAULT_GREETING.to);
  assert.match(parsed.greeting.message, /Văn hóa còn thì dân tộc còn/);
});

test('buildShareableUrl and parseGreetingFromSearch round-trip Vietnamese diacritics cleanly', () => {
  const url = buildShareableUrl('https://example.com/24-11', {
    to: 'Thầy cô & Bạn bè thân mến',
    from: 'Minh Dương',
    message: 'Chúc mừng Ngày Văn Hóa Việt Nam 24-11 thịnh vượng sáng ngời!',
    mood: 'night',
  });

  const parsedUrl = new URL(url);
  const parsed = parseGreetingFromSearch(parsedUrl.search);

  assert.equal(parsed.greeting.isPersonalized, true);
  assert.equal(parsed.greeting.to, 'Thầy cô & Bạn bè thân mến');
  assert.equal(parsed.greeting.from, 'Minh Dương');
  assert.equal(
    parsed.greeting.message,
    'Chúc mừng Ngày Văn Hóa Việt Nam 24-11 thịnh vượng sáng ngời!',
  );
  assert.equal(parsed.greeting.mood, 'night');
});

test('validateGreetingInput rejects empty or too-short fields', () => {
  const bad = validateGreetingInput({ to: ' ', from: 'A', message: 'Ngắn' });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.to);
  assert.ok(bad.errors.from);
  assert.ok(bad.errors.message);

  const ok = validateGreetingInput({
    to: 'Gia đình',
    from: 'Dương',
    message: 'Chúc mừng Ngày Văn Hóa Việt Nam 24-11 rực rỡ sắc màu!',
  });
  assert.equal(ok.valid, true);
  assert.deepEqual(ok.errors, {});
});

test('getSpeechVolumeForTime smoothly fades out strictly before narrator starts', () => {
  assert.equal(getSpeechVolumeForTime(10), 1);
  assert.equal(getSpeechVolumeForTime(SPEECH_FADE_START_SEC), 1);
  const mid = (SPEECH_FADE_START_SEC + SPEECH_CUTOFF_SEC) / 2;
  assert.ok(getSpeechVolumeForTime(mid) > 0.4 && getSpeechVolumeForTime(mid) < 0.6);
  assert.equal(getSpeechVolumeForTime(SPEECH_CUTOFF_SEC), 0);
  assert.equal(getSpeechVolumeForTime(25), 0);
});

test('getCaptionForStage resolves speech intro captions and full song lyrics accurately', () => {
  assert.match(getCaptionForStage('speech', 2.0), /soi đường cho quốc dân đi/);
  assert.match(getCaptionForStage('speech', 16.0), /Văn hóa còn thì dân tộc còn/);
  assert.match(getCaptionForStage('speech', 22.0), /Nguyễn Phú Trọng/);

  assert.match(getCaptionForStage('song', 5.0), /Bùi Trường Linh/);
  assert.match(getCaptionForStage('song', 20.0), /Việt Nam sáng trong bao lời ca/);
  assert.match(getCaptionForStage('song', 55.0), /Nam quốc sơn hà định phận/);
  assert.match(getCaptionForStage('song', 128.0), /Bạch Đằng Giang/);
  assert.match(getCaptionForStage('song', 220.0), /ngàn muôn ấm no/);
});

test('formatPlaybackTime formats mm:ss accurately across full song length', () => {
  assert.equal(formatPlaybackTime(0), '0:00');
  assert.equal(formatPlaybackTime(23.95), '0:23');
  assert.equal(formatPlaybackTime(235), '3:55');
});
