import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Compass, MailOpen, ScrollText, Volume2, VolumeX } from 'lucide-react';
import { HeritageScene } from './scene/HeritageScene';
import { ControlDock } from './components/ControlDock';
import { GreetingPlaque } from './components/GreetingPlaque';
import { ShareCardModal } from './components/ShareCardModal';
import { ImperialScrollOverlay } from './components/ImperialScrollOverlay';
import {
  ScrollFireworkTransition,
  type ShatterOriginRect,
} from './components/ScrollFireworkTransition';
import {
  type AudioStage,
  type CameraPresetId,
  type GreetingConfig,
  SONG_AUDIO_URL,
  SPEECH_AUDIO_URL,
  SPEECH_CUTOFF_SEC,
  type SceneMood,
  getLyricCueForStage,
  getSpeechVolumeForTime,
  parseGreetingFromSearch,
} from './utils/greetingLink';
import {
  FINALE_TRIBUTE_START_SEC,
  TOTAL_SHOW_DURATION_SEC,
  evaluateDirectorAtTime,
  getUnifiedShowTime,
  splitUnifiedShowTime,
} from './utils/cinematicDirector';

type ExperiencePhase =
  | 'sealed_scroll'
  | 'reading_scroll'
  | 'shattering'
  | 'cinema_show'
  | 'finale_scroll'
  | 'free_explore';

export default function App() {
  const initialState = useMemo(() => parseGreetingFromSearch(window.location.search), []);
  const startInExplore = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('explore') === '1';
  }, []);

  const [phase, setPhase] = useState<ExperiencePhase>(
    startInExplore ? 'free_explore' : 'sealed_scroll',
  );
  const [fireworkActive, setFireworkActive] = useState(false);
  const [shatterOriginRect, setShatterOriginRect] = useState<ShatterOriginRect | null>(null);
  const [introBurstNonce, setIntroBurstNonce] = useState(0);

  const [greeting, setGreeting] = useState<GreetingConfig>(initialState.greeting);
  const [mood, setMood] = useState<SceneMood>(startInExplore ? initialState.greeting.mood : 'dawn');
  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>('overview');
  const [cameraPresetNonce, setCameraPresetNonce] = useState(0);

  // Two-stage audio state: 'speech' (0:00-0:23.95 TBT Nguyễn Phú Trọng) -> 'song' (full 3:55 Thịnh Vượng Việt Nam Sáng Ngời)
  const [audioStage, setAudioStage] = useState<AudioStage>('speech');
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [lanternCount, setLanternCount] = useState(0);
  const [releaseLanternNonce, setReleaseLanternNonce] = useState(0);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  // 4-Act Cinematic Director Mode & TikTok 9:16 Studio Frame
  const [isDirectorMode, setIsDirectorMode] = useState(false);
  const [directorShowTime, setDirectorShowTime] = useState(0);
  const [directorFinished, setDirectorFinished] = useState(false);
  const [isVerticalFrame, setIsVerticalFrame] = useState(false);

  const [showGreetingPlaque, setShowGreetingPlaque] = useState(
    startInExplore && initialState.greeting.isPersonalized && !initialState.autostart,
  );
  const [showShareModal, setShowShareModal] = useState(false);

  const speechAudioRef = useRef<HTMLAudioElement | null>(null);
  const songAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioStageRef = useRef<AudioStage>('speech');
  const isMutedRef = useRef<boolean>(false);
  const isMusicPlayingRef = useRef<boolean>(false);
  const isDirectorModeRef = useRef<boolean>(false);
  const phaseRef = useRef<ExperiencePhase>(phase);

  useEffect(() => {
    audioStageRef.current = audioStage;
  }, [audioStage]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isMusicPlayingRef.current = isMusicPlaying;
  }, [isMusicPlaying]);

  useEffect(() => {
    isDirectorModeRef.current = isDirectorMode;
  }, [isDirectorMode]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const handleReleaseLantern = useCallback(() => {
    setLanternCount((c) => c + 1);
    setReleaseLanternNonce((n) => n + 1);
  }, []);

  const stopAllShowAudio = useCallback(() => {
    const speech = speechAudioRef.current;
    const song = songAudioRef.current;
    if (speech) {
      speech.pause();
      speech.currentTime = 0;
      speech.volume = 1;
    }
    if (song) {
      song.pause();
      song.currentTime = 0;
      song.volume = 1;
    }
    setIsMusicPlaying(false);
  }, []);

  const startSongFromBeginning = useCallback(() => {
    const speech = speechAudioRef.current;
    const song = songAudioRef.current;
    if (speech) {
      speech.pause();
      speech.currentTime = 0;
      speech.volume = 1;
    }
    audioStageRef.current = 'song';
    setAudioStage('song');
    setPlaybackTime(0);
    setDirectorFinished(false);

    if (song) {
      song.currentTime = 0;
      song.volume = 1;
      song.muted = isMutedRef.current;
      song
        .play()
        .then(() => {
          setIsMusicPlaying(true);
        })
        .catch(() => {
          setIsMusicPlaying(false);
        });
    }
    handleReleaseLantern();
  }, [handleReleaseLantern]);

  const startSpeechFromBeginning = useCallback(() => {
    const speech = speechAudioRef.current;
    const song = songAudioRef.current;
    if (song) {
      song.pause();
      song.currentTime = 0;
    }
    audioStageRef.current = 'speech';
    setAudioStage('speech');
    setPlaybackTime(0);
    setDirectorFinished(false);

    if (speech) {
      speech.currentTime = 0;
      speech.volume = 1;
      speech.muted = isMutedRef.current;
      speech
        .play()
        .then(() => {
          setIsMusicPlaying(true);
        })
        .catch(() => {
          setIsMusicPlaying(false);
        });
    }
  }, []);

  // High-precision 10Hz audio sync for both speech cutoff (23.95s) and line-by-line music lyrics
  useEffect(() => {
    const speech = speechAudioRef.current;
    const song = songAudioRef.current;
    if (!speech || !song) return;

    const syncAudioClock = () => {
      if (audioStageRef.current === 'speech') {
        if (speech.paused) return;
        const t = speech.currentTime;
        speech.volume = getSpeechVolumeForTime(t);
        setPlaybackTime(t);
        if (t >= SPEECH_CUTOFF_SEC) {
          startSongFromBeginning();
        }
      } else {
        if (song.paused) return;
        setPlaybackTime(song.currentTime);
      }
    };

    const intervalId = window.setInterval(syncAudioClock, 90);

    const onSpeechEnded = () => {
      if (audioStageRef.current === 'speech') {
        startSongFromBeginning();
      }
    };

    const onSongEnded = () => {
      if (phaseRef.current === 'cinema_show' || isDirectorModeRef.current) {
        setIsMusicPlaying(false);
        setDirectorFinished(true);
        setDirectorShowTime(TOTAL_SHOW_DURATION_SEC);
        setPlaybackTime(TOTAL_SHOW_DURATION_SEC - SPEECH_CUTOFF_SEC);
        setMood('night');
        if (phaseRef.current === 'cinema_show') {
          setPhase('finale_scroll');
        }
        return;
      }
      song.currentTime = 0;
      song.play().catch(() => {
        setIsMusicPlaying(false);
      });
    };

    speech.addEventListener('ended', onSpeechEnded);
    song.addEventListener('ended', onSongEnded);

    return () => {
      clearInterval(intervalId);
      speech.removeEventListener('ended', onSpeechEnded);
      song.removeEventListener('ended', onSongEnded);
    };
  }, [startSongFromBeginning]);

  // 4-Act Cinematic Director Show Clock (synced to audio when playing, or gentle virtual preview when muted/blocked)
  useEffect(() => {
    if (!isDirectorMode || directorFinished) return;
    let lastTick = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.25, (now - lastTick) / 1000);
      lastTick = now;

      let nextShowTime: number;
      if (isMusicPlayingRef.current) {
        const activeEl =
          audioStageRef.current === 'speech' ? speechAudioRef.current : songAudioRef.current;
        const liveAudioSec = activeEl ? activeEl.currentTime : 0;
        nextShowTime = getUnifiedShowTime(audioStageRef.current, liveAudioSec);
      } else {
        nextShowTime = -1;
      }

      setDirectorShowTime((prev) => {
        const resolved =
          nextShowTime >= 0
            ? nextShowTime
            : Math.min(TOTAL_SHOW_DURATION_SEC, prev + dt * 1.1);
        const sample = evaluateDirectorAtTime(resolved);
        setMood((currMood) => (currMood === sample.mood ? currMood : sample.mood));

        if (phaseRef.current === 'cinema_show' && resolved >= FINALE_TRIBUTE_START_SEC) {
          setPhase('finale_scroll');
        }

        if (nextShowTime < 0 && resolved >= TOTAL_SHOW_DURATION_SEC) {
          setDirectorFinished(true);
          if (phaseRef.current === 'cinema_show') {
            setPhase('finale_scroll');
          }
        }
        return resolved;
      });
    }, 90);

    return () => clearInterval(timer);
  }, [isDirectorMode, directorFinished]);

  // Keyboard shortcuts: 'H' toggles clean recording dock in free_explore; 'Escape' exits cinema_show to free_explore
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if ((e.key === 'h' || e.key === 'H') && phaseRef.current === 'free_explore') {
        setIsDockCollapsed((prev) => !prev);
      }
      if (e.key === 'Escape' && phaseRef.current === 'cinema_show') {
        setIsDirectorMode(false);
        setDirectorFinished(false);
        setPhase('free_explore');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // =========================================================================
  // Imperial Scroll -> Firework Shatter -> Zero-UI Cinema -> Closing Scroll Handlers
  // =========================================================================
  const handleUnrollOpeningScroll = useCallback(() => {
    setPhase('reading_scroll');
  }, []);

  const handleIgniteFireworks = useCallback(
    (originRect: ShatterOriginRect | null) => {
      setShatterOriginRect(originRect);
      setFireworkActive(true);
      setPhase('shattering');
      setIntroBurstNonce((n) => n + 1);
      setMood('dawn');
      setDirectorShowTime(0);
      setDirectorFinished(false);
      setIsDirectorMode(true);
      startSpeechFromBeginning();
    },
    [startSpeechFromBeginning],
  );

  const handleFireworkStageReveal = useCallback(() => {
    setPhase((curr) => (curr === 'shattering' ? 'cinema_show' : curr));
  }, []);

  const handleFireworkComplete = useCallback(() => {
    setFireworkActive(false);
  }, []);

  const handleEnterFreeExplore = useCallback(() => {
    setFireworkActive(false);
    setIsDirectorMode(false);
    setDirectorFinished(false);
    setPhase('free_explore');
  }, []);

  const handleReplayFromOpeningScroll = useCallback(() => {
    stopAllShowAudio();
    setFireworkActive(false);
    setIsDirectorMode(false);
    setDirectorFinished(false);
    setDirectorShowTime(0);
    setPlaybackTime(0);
    setMood('dawn');
    setPhase('sealed_scroll');
  }, [stopAllShowAudio]);

  const handleTogglePlay = useCallback(() => {
    const activeAudio =
      audioStageRef.current === 'speech' ? speechAudioRef.current : songAudioRef.current;
    if (!activeAudio) return;

    if (directorFinished) {
      startSpeechFromBeginning();
      setDirectorShowTime(0);
      return;
    }

    if (activeAudio.paused) {
      if (audioStageRef.current === 'speech' && activeAudio.currentTime >= SPEECH_CUTOFF_SEC) {
        startSongFromBeginning();
        return;
      }
      activeAudio.muted = isMutedRef.current;
      activeAudio
        .play()
        .then(() => setIsMusicPlaying(true))
        .catch(() => setIsMusicPlaying(false));
    } else {
      activeAudio.pause();
      setIsMusicPlaying(false);
    }
  }, [directorFinished, startSongFromBeginning, startSpeechFromBeginning]);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (speechAudioRef.current) speechAudioRef.current.muted = next;
      if (songAudioRef.current) songAudioRef.current.muted = next;
      return next;
    });
  }, []);

  const handleSelectCamera = useCallback((preset: CameraPresetId) => {
    setIsDirectorMode(false);
    setDirectorFinished(false);
    setCameraPreset(preset);
    setCameraPresetNonce((n) => n + 1);
  }, []);

  const handleSelectMood = useCallback((nextMood: SceneMood) => {
    setMood(nextMood);
  }, []);

  const handleSeekShowTime = useCallback((targetShowSec: number) => {
    const clamped = Math.max(0, Math.min(TOTAL_SHOW_DURATION_SEC, targetShowSec));
    const { stage, seconds } = splitUnifiedShowTime(clamped);
    const speech = speechAudioRef.current;
    const song = songAudioRef.current;

    setDirectorShowTime(clamped);
    setDirectorFinished(clamped >= TOTAL_SHOW_DURATION_SEC);
    setAudioStage(stage);
    audioStageRef.current = stage;
    setPlaybackTime(seconds);

    const sample = evaluateDirectorAtTime(clamped);
    setMood(sample.mood);

    if (stage === 'speech') {
      if (song) {
        song.pause();
        song.currentTime = 0;
      }
      if (speech) {
        try {
          speech.currentTime = seconds;
        } catch {
          // Ignore seek error before metadata loads
        }
        speech.volume = getSpeechVolumeForTime(seconds);
        speech.muted = isMutedRef.current;
        if (isMusicPlayingRef.current || isDirectorModeRef.current) {
          speech
            .play()
            .then(() => setIsMusicPlaying(true))
            .catch(() => setIsMusicPlaying(false));
        }
      }
    } else {
      if (speech) {
        speech.pause();
        speech.currentTime = 0;
        speech.volume = 1;
      }
      if (song) {
        try {
          song.currentTime = seconds;
        } catch {
          // Ignore seek error before metadata loads
        }
        song.volume = 1;
        song.muted = isMutedRef.current;
        if (isMusicPlayingRef.current || isDirectorModeRef.current) {
          song
            .play()
            .then(() => setIsMusicPlaying(true))
            .catch(() => setIsMusicPlaying(false));
        }
      }
    }
  }, []);

  const handleToggleDirectorMode = useCallback(() => {
    setIsDirectorMode((prev) => {
      const next = !prev;
      if (next) {
        setDirectorFinished(false);
        startSpeechFromBeginning();
        setDirectorShowTime(0);
        setMood('dawn');
      } else {
        setDirectorFinished(false);
      }
      return next;
    });
  }, [startSpeechFromBeginning]);

  const handleUserInteractCamera = useCallback(() => {
    // Only let manual orbit interrupt Director Mode during free_explore; protect uninterrupted cinema_show
    if (phaseRef.current === 'free_explore') {
      setIsDirectorMode(false);
      setDirectorFinished(false);
    }
  }, []);

  const handleEnterSceneWithMusic = useCallback(() => {
    setShowGreetingPlaque(false);
    startSpeechFromBeginning();
    handleReleaseLantern();
  }, [startSpeechFromBeginning, handleReleaseLantern]);

  const handleApplyGreeting = useCallback((next: GreetingConfig, shareUrl: string) => {
    setGreeting(next);
    setMood(next.mood);
    try {
      window.history.replaceState(null, '', shareUrl);
    } catch {
      // Ignore history restriction in sandboxed frames
    }
  }, []);

  const directorSample = evaluateDirectorAtTime(directorShowTime);
  const effectiveLyricClock = useMemo(() => {
    if (isDirectorMode && !isMusicPlaying) {
      return splitUnifiedShowTime(directorShowTime);
    }
    return { stage: audioStage, seconds: playbackTime };
  }, [isDirectorMode, isMusicPlaying, directorShowTime, audioStage, playbackTime]);

  const activeLyricCue = getLyricCueForStage(
    effectiveLyricClock.stage,
    effectiveLyricClock.seconds,
  );

  const isScrollIntroPhase = phase === 'sealed_scroll' || phase === 'reading_scroll';
  const isCinemaZeroUi = phase === 'shattering' || phase === 'cinema_show';
  const isFreeExplore = phase === 'free_explore';

  const showFreeExploreFinaleScroll =
    isFreeExplore &&
    ((isDirectorMode && (directorSample.isFinaleTribute || directorFinished)) ||
      (!isDirectorMode &&
        isMusicPlaying &&
        audioStage === 'song' &&
        playbackTime >= FINALE_TRIBUTE_START_SEC - SPEECH_CUTOFF_SEC));

  const showClosingScroll = phase === 'finale_scroll' || showFreeExploreFinaleScroll;

  const showSubtitles =
    !isScrollIntroPhase &&
    !showClosingScroll &&
    (phase === 'cinema_show' || (isFreeExplore && (isDirectorMode || isMusicPlaying))) &&
    Boolean(activeLyricCue);

  const isDarkSurface = mood === 'night' || mood === 'sunset';

  return (
    <main
      data-phase={phase}
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${
        isVerticalFrame && isFreeExplore ? 'bg-[#0e090d]' : ''
      }`}
    >
      {/* Stage 1 Audio: Opening speech of Cố Tổng Bí thư Nguyễn Phú Trọng (cut precisely at 23.95s) */}
      <audio
        ref={speechAudioRef}
        src={SPEECH_AUDIO_URL}
        preload="auto"
        aria-label="Lời phát biểu mở đầu của Tổng Bí thư Nguyễn Phú Trọng về văn hóa"
      />

      {/* Stage 2 Audio: Full 3:55 studio version of "Thịnh Vượng Việt Nam Sáng Ngời" */}
      <audio
        ref={songAudioRef}
        src={SONG_AUDIO_URL}
        preload="auto"
        aria-label="Ca khúc Thịnh Vượng Việt Nam Sáng Ngời trọn vẹn"
      />

      {/* Main 3D Stage Container — full-bleed desktop OR centered 9:16 TikTok Studio Frame */}
      <div
        data-testid="cinema-stage-frame"
        className={
          isVerticalFrame && isFreeExplore
            ? 'relative aspect-[9/16] h-[min(100vh,900px)] max-w-full overflow-hidden border-x border-[#59363d]/70 shadow-2xl'
            : 'relative h-full w-full overflow-hidden'
        }
      >
        {/* Full-bleed Photorealistic Sơn Thủy Three.js 3D Vietnamese Cultural Heritage Scene */}
        <HeritageScene
          mood={mood}
          cameraPreset={cameraPreset}
          cameraPresetNonce={cameraPresetNonce}
          releaseLanternNonce={releaseLanternNonce}
          introBurstNonce={introBurstNonce}
          isScrollIntro={isScrollIntroPhase}
          isMusicPlaying={isMusicPlaying}
          lanternCount={lanternCount}
          isDirectorMode={isDirectorMode}
          directorShowTime={directorShowTime}
          isVerticalFrame={isVerticalFrame && isFreeExplore}
          onUserInteractCamera={handleUserInteractCamera}
        />

        {/* Compact Top-Left Editorial Title Lockup — shown ONLY in Free Explore mode (100% Zero-UI in Cinema Show!) */}
        {isFreeExplore && (
          <header className="pointer-events-none absolute left-3 top-3 z-20 max-w-[min(330px,calc(100%-24px))] sm:left-4 sm:top-4">
            <div
              className={`pointer-events-auto inline-flex flex-col rounded-lg border px-3 py-1.5 shadow-sm ${
                mood === 'night'
                  ? 'border-[#653b46] bg-[#1f131b]/90 text-[#fbf2e8]'
                  : mood === 'sunset'
                    ? 'border-[#9a5741] bg-[#2c1718]/90 text-[#fff3e4]'
                    : 'border-[#e6ceb4] bg-[#fef9f3]/90 text-[#2e1a18]'
              }`}
            >
              <div className="flex items-baseline gap-2">
                <span
                  className={`font-display text-base font-extrabold leading-none sm:text-lg ${
                    isDarkSurface ? 'text-[#f4c968]' : 'text-[#c12d2f]'
                  }`}
                >
                  24 · 11
                </span>
                <h1 className="font-display text-xs font-bold leading-tight sm:text-sm">
                  Ngày Văn Hóa Việt Nam
                </h1>
              </div>

              <div
                className={`mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] leading-tight ${
                  isDarkSurface ? 'text-[#e2c6b4]' : 'text-[#6e5045]'
                }`}
              >
                <button
                  type="button"
                  onClick={handleReplayFromOpeningScroll}
                  className={`inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c12d2f] ${
                    isDarkSurface ? 'text-[#f4c968]' : 'text-[#c12d2f]'
                  }`}
                >
                  <ScrollText className="h-3 w-3" aria-hidden="true" />
                  <span>Xem chiếu thư</span>
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => setShowGreetingPlaque(true)}
                  className={`inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c12d2f] ${
                    isDarkSurface ? 'text-[#f4c968]' : 'text-[#c12d2f]'
                  }`}
                >
                  <MailOpen className="h-3 w-3" aria-hidden="true" />
                  <span>Lời chúc</span>
                </button>
              </div>
            </div>
          </header>
        )}

        {/* Whisper-Discreet Hover-Only Escape Hatch in Extreme Top-Right during Zero-UI Cinema Show */}
        {phase === 'cinema_show' && (
          <div
            data-testid="cinema-hover-utility"
            className="group fixed right-3 top-3 z-20 flex items-center gap-1.5 opacity-0 transition-opacity duration-300 hover:opacity-100 focus-within:opacity-100"
          >
            <button
              type="button"
              onClick={handleToggleMute}
              aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-[#f2c86b]/45 bg-[#1b0e15]/80 text-[#fff6e5] transition-colors hover:bg-[#2f1722]"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Volume2 className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={handleEnterFreeExplore}
              data-testid="cinema-exit-to-explore-btn"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[#f2c86b]/45 bg-[#1b0e15]/80 px-2.5 py-1.5 text-[11px] font-semibold text-[#fff6e5] transition-colors hover:bg-[#2f1722]"
            >
              <Compass className="h-3.5 w-3.5 text-[#f4cf73]" aria-hidden="true" />
              <span>Khám phá 3D</span>
            </button>
          </div>
        )}

        {/* Line-by-Line Animated Music-Video Lyrics Overlay */}
        {showSubtitles && activeLyricCue && (
          <div
            aria-live="polite"
            data-testid="cinema-subtitle-overlay"
            className={`pointer-events-none absolute inset-x-0 z-10 flex flex-col items-center px-5 text-center transition-all duration-300 ${
              isCinemaZeroUi
                ? 'bottom-9'
                : isDockCollapsed
                  ? 'bottom-12'
                  : isDirectorMode
                    ? 'bottom-[138px]'
                    : 'bottom-28'
            }`}
          >
            <div className="max-w-[min(680px,92%)] rounded-xl bg-gradient-to-t from-[#130a10]/86 via-[#1a0e15]/76 to-[#1a0e15]/58 px-5 py-2.5 shadow-lg">
              {isDirectorMode && (
                <p className="text-[11px] font-semibold tracking-wider text-[#f3ca6e]">
                  {directorSample.actTitle}
                </p>
              )}

              <div
                key={activeLyricCue.id}
                className={`animate-lyric-in transition-all duration-300 ${
                  activeLyricCue.isExiting
                    ? 'opacity-0 -translate-y-1.5'
                    : 'opacity-100 translate-y-0'
                }`}
              >
                <p
                  className={`mt-1 font-display leading-snug ${
                    activeLyricCue.isInstrumental
                      ? 'text-xs font-medium italic tracking-wide text-[#f6d99c] sm:text-sm'
                      : 'text-sm font-semibold text-[#fff9f0] sm:text-lg'
                  }`}
                  style={{ textWrap: 'balance' }}
                >
                  {activeLyricCue.text}
                </p>

                {!activeLyricCue.isInstrumental && (
                  <div className="mx-auto mt-2 h-[2px] w-32 overflow-hidden rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#f3c45d] via-[#ffe6a3] to-[#f3c45d] transition-[width] duration-100 ease-linear"
                      style={{ width: `${Math.round(activeLyricCue.progress * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Opening Imperial Brocade Vertical Scroll (Sealed -> Unrolled with Gemini TTS Voiceover) */}
      {isScrollIntroPhase && (
        <ImperialScrollOverlay
          variant="opening"
          stage={phase}
          onUnroll={handleUnrollOpeningScroll}
          onIgniteFireworks={handleIgniteFireworks}
          onSkipToExplore={handleEnterFreeExplore}
        />
      )}

      {/* Closing Imperial Brocade Tribute Scroll (Auto-Unrolls over Night Festival Fireworks) */}
      {showClosingScroll && (
        <ImperialScrollOverlay
          variant="closing"
          greeting={greeting}
          onReplayAll={handleReplayFromOpeningScroll}
          onExplore3D={handleEnterFreeExplore}
        />
      )}

      {/* Full-Screen 2D Canvas Firework Shatter Transition */}
      <ScrollFireworkTransition
        active={fireworkActive}
        originRect={shatterOriginRect}
        onStageReveal={handleFireworkStageReveal}
        onComplete={handleFireworkComplete}
      />

      {/* Unified Collapsible Bottom Control Dock — Shown ONLY in Free Explore Mode */}
      {isFreeExplore && (
        <ControlDock
          mood={mood}
          cameraPreset={cameraPreset}
          audioStage={audioStage}
          isMusicPlaying={isMusicPlaying}
          isMuted={isMuted}
          playbackTime={playbackTime}
          directorShowTime={directorShowTime}
          lanternCount={lanternCount}
          isDirectorMode={isDirectorMode}
          isVerticalFrame={isVerticalFrame}
          isCollapsed={isDockCollapsed}
          onToggleCollapse={() => setIsDockCollapsed((c) => !c)}
          onTogglePlay={handleTogglePlay}
          onSkipToSong={startSongFromBeginning}
          onReplayIntro={startSpeechFromBeginning}
          onSeekShowTime={handleSeekShowTime}
          onToggleMute={handleToggleMute}
          onSelectCamera={handleSelectCamera}
          onSelectMood={handleSelectMood}
          onToggleDirectorMode={handleToggleDirectorMode}
          onToggleVerticalFrame={() => setIsVerticalFrame((v) => !v)}
          onReleaseLantern={handleReleaseLantern}
          onOpenShareModal={() => {
            setShowGreetingPlaque(false);
            setShowShareModal(true);
          }}
        />
      )}

      {/* Ceremonial Greeting Card Dialog (Free Explore) */}
      {isFreeExplore && showGreetingPlaque && (
        <GreetingPlaque
          greeting={greeting}
          mood={mood}
          isMusicPlaying={isMusicPlaying}
          onEnterSceneWithMusic={handleEnterSceneWithMusic}
          onClose={() => setShowGreetingPlaque(false)}
          onOpenComposer={() => {
            setShowGreetingPlaque(false);
            setShowShareModal(true);
          }}
        />
      )}

      {/* Shareable Link & Personalized E-Card Composer Modal (Free Explore) */}
      {isFreeExplore && showShareModal && (
        <ShareCardModal
          initialGreeting={greeting}
          mood={mood}
          onClose={() => setShowShareModal(false)}
          onApplyGreeting={handleApplyGreeting}
        />
      )}
    </main>
  );
}
