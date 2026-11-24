import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DIRECTOR_KEYFRAMES,
  FINALE_TRIBUTE_START_SEC,
  TOTAL_SHOW_DURATION_SEC,
  evaluateDirectorAtTime,
  evaluateDirectorReveals,
  getUnifiedShowTime,
  splitUnifiedShowTime,
} from './cinematicDirector';
import { SPEECH_CUTOFF_SEC } from './greetingLink';

test('getUnifiedShowTime and splitUnifiedShowTime round-trip speech and song clocks cleanly', () => {
  assert.equal(getUnifiedShowTime('speech', 0), 0);
  assert.equal(getUnifiedShowTime('speech', 12.5), 12.5);
  assert.equal(getUnifiedShowTime('speech', 40), SPEECH_CUTOFF_SEC);
  assert.equal(getUnifiedShowTime('song', 0), SPEECH_CUTOFF_SEC);
  assert.equal(getUnifiedShowTime('song', 60), SPEECH_CUTOFF_SEC + 60);
  assert.equal(getUnifiedShowTime('song', 999), TOTAL_SHOW_DURATION_SEC);

  const splitSpeech = splitUnifiedShowTime(10.5);
  assert.equal(splitSpeech.stage, 'speech');
  assert.equal(splitSpeech.seconds, 10.5);

  const splitSong = splitUnifiedShowTime(SPEECH_CUTOFF_SEC + 149.5);
  assert.equal(splitSong.stage, 'song');
  assert.ok(Math.abs(splitSong.seconds - 149.5) < 0.001);
});

test('evaluateDirectorAtTime progresses smoothly across all 4 acts, 3 moods, and 24-11 finale tribute', () => {
  const act1 = evaluateDirectorAtTime(5);
  assert.equal(act1.actNumber, 1);
  assert.equal(act1.mood, 'dawn');
  assert.equal(act1.isClimax, false);
  assert.equal(act1.isFinaleTribute, false);

  const act2Sunset = evaluateDirectorAtTime(85);
  assert.equal(act2Sunset.actNumber, 2);
  assert.equal(act2Sunset.mood, 'sunset');
  assert.equal(act2Sunset.isClimax, true);

  const act3Birds = evaluateDirectorAtTime(174);
  assert.equal(act3Birds.actNumber, 3);
  assert.equal(act3Birds.mood, 'night');

  const act4Finale = evaluateDirectorAtTime(220);
  assert.equal(act4Finale.actNumber, 4);
  assert.equal(act4Finale.mood, 'night');
  assert.equal(act4Finale.isClimax, true);
  assert.equal(act4Finale.isFinaleTribute, false);

  const tribute = evaluateDirectorAtTime(FINALE_TRIBUTE_START_SEC + 1);
  assert.equal(tribute.isFinaleTribute, true);
  assert.match(tribute.actTitle, /24 · 11/);
});

test('evaluateDirectorReveals keeps everything visible in Normal Mode and progressively unveils landmarks on lyrics in Director Mode', () => {
  const normal = evaluateDirectorReveals(0, false);
  for (const val of Object.values(normal)) {
    assert.equal(val, 1);
  }

  // Director start: solemn Bia Rùa opening before landmarks rise
  const start = evaluateDirectorReveals(0, true);
  assert.equal(start.pavilion, 0);
  assert.equal(start.dragon, 0);
  assert.equal(start.lacBirds, 0);
  assert.equal(start.nightCelebration, 0);

  // Right on "Rồng thiêng từ đây vút bay" (show ~160s -> song ~136s): Dragon manifested, Lac birds still waiting
  const dragonCue = evaluateDirectorReveals(160.5, true);
  assert.equal(dragonCue.pavilion, 1);
  assert.equal(dragonCue.unityHalo, 1);
  assert.equal(dragonCue.brocadeRibbon, 1);
  assert.equal(dragonCue.dragon, 1);
  assert.equal(dragonCue.lacBirds, 0);

  // Right on "Thương cánh chim Lạc Hồng" (show ~176s -> song ~152s): Lac birds soaring!
  const birdsCue = evaluateDirectorReveals(176.5, true);
  assert.equal(birdsCue.dragon, 1);
  assert.equal(birdsCue.lacBirds, 1);
  assert.equal(birdsCue.nightCelebration, 0);

  // Grand Finale Night: everything 100% manifested!
  const finale = evaluateDirectorReveals(210, true);
  for (const val of Object.values(finale)) {
    assert.equal(val, 1);
  }
});

test('evaluateDirectorAtTime never produces NaN and respects keyframe monotonicity', () => {
  for (let i = 1; i < DIRECTOR_KEYFRAMES.length; i++) {
    assert.ok(DIRECTOR_KEYFRAMES[i].time > DIRECTOR_KEYFRAMES[i - 1].time);
  }
  for (let t = 0; t <= TOTAL_SHOW_DURATION_SEC; t += 15) {
    const s = evaluateDirectorAtTime(t);
    assert.ok(s.position.every(Number.isFinite));
    assert.ok(s.target.every(Number.isFinite));
    assert.ok(Number.isFinite(s.fov) && s.fov >= 35 && s.fov <= 65);
    assert.ok(s.progress >= 0 && s.progress <= 1);
  }
});
