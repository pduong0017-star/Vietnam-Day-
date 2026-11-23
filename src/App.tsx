import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MailOpen } from 'lucide-react';
import { HeritageScene } from './scene/HeritageScene';
import { ControlDock } from './components/ControlDock';
import { GreetingPlaque } from './components/GreetingPlaque';
import { ShareCardModal } from './components/ShareCardModal';
import {
  type AudioStage,
  type CameraPresetId,
  type GreetingConfig,
  SONG_AUDIO_URL,
  SPEECH_AUDIO_URL,
  SPEECH_CUTOFF_SEC,
  type SceneMood,
  getCaptionForStage,
  getSpeechVolumeForTime,
  parseGreetingFromSearch,
} from './utils/greetingLink';

export default function App() {
  const initialState = useMemo(() => parseGreetingFromSearch(window.location.search), []);

  const [greeting, setGreeting] = useState<GreetingConfig>(initialState.greeting);
  const [mood, setMood] = useState<SceneMood>(initialState.greeting.mood);
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

  const [showGreetingPlaque, setShowGreetingPlaque] = useState(
    initialState.greeting.isPersonalized && !initialState.autostart,
  );
  const [showShareModal, setShowShareModal] = useState(false);

  const speechAudioRef = useRef<HTMLAudioElement | null>(null);
  const songAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioStageRef = useRef<AudioStage>('speech');
  const isMutedRef = useRef<boolean>(false);

  useEffect(() => {
    audioStageRef.current = audioStage;
  }, [audioStage]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const handleReleaseLantern = useCallback(() => {
    setLanternCount((c) => c + 1);
    setReleaseLanternNonce((n) => n + 1);
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
    // Launch a celebratory lantern as "Thịnh Vượng Việt Nam Sáng Ngời" swells in
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

  // Monitor speech track with high precision so it cuts cleanly at 23.95s (right before narrator at 25.12s)
  useEffect(() => {
    const speech = speechAudioRef.current;
    const song = songAudioRef.current;
    if (!speech || !song) return;

    const checkSpeechCutoff = () => {
      if (audioStageRef.current !== 'speech' || speech.paused) return;
      const t = speech.currentTime;
      speech.volume = getSpeechVolumeForTime(t);
      setPlaybackTime(t);
      if (t >= SPEECH_CUTOFF_SEC) {
        startSongFromBeginning();
      }
    };

    const intervalId = window.setInterval(checkSpeechCutoff, 80);

    const onSpeechTimeUpdate = () => checkSpeechCutoff();
    const onSpeechEnded = () => {
      if (audioStageRef.current === 'speech') {
        startSongFromBeginning();
      }
    };

    let lastSongReported = -1;
    const onSongTimeUpdate = () => {
      if (audioStageRef.current !== 'song') return;
      const rounded = Math.floor(song.currentTime * 2) / 2;
      if (rounded !== lastSongReported) {
        lastSongReported = rounded;
        setPlaybackTime(song.currentTime);
      }
    };

    const onSongEnded = () => {
      song.currentTime = 0;
      song.play().catch(() => {
        setIsMusicPlaying(false);
      });
    };

    speech.addEventListener('timeupdate', onSpeechTimeUpdate);
    speech.addEventListener('ended', onSpeechEnded);
    song.addEventListener('timeupdate', onSongTimeUpdate);
    song.addEventListener('ended', onSongEnded);

    return () => {
      clearInterval(intervalId);
      speech.removeEventListener('timeupdate', onSpeechTimeUpdate);
      speech.removeEventListener('ended', onSpeechEnded);
      song.removeEventListener('timeupdate', onSongTimeUpdate);
      song.removeEventListener('ended', onSongEnded);
    };
  }, [startSongFromBeginning]);

  // Keyboard shortcut 'H' to toggle HUD dock cleanly
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
      if (e.key === 'h' || e.key === 'H') {
        setIsDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleTogglePlay = useCallback(() => {
    const activeAudio =
      audioStageRef.current === 'speech' ? speechAudioRef.current : songAudioRef.current;
    if (!activeAudio) return;

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
  }, [startSongFromBeginning]);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (speechAudioRef.current) speechAudioRef.current.muted = next;
      if (songAudioRef.current) songAudioRef.current.muted = next;
      return next;
    });
  }, []);

  const handleSelectCamera = useCallback((preset: CameraPresetId) => {
    setCameraPreset(preset);
    setCameraPresetNonce((n) => n + 1);
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

  const currentCaption = getCaptionForStage(audioStage, playbackTime);
  const isNight = mood === 'night';

  return (
    <main className="relative h-full w-full overflow-hidden">
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
        preload="metadata"
        aria-label="Ca khúc Thịnh Vượng Việt Nam Sáng Ngời trọn vẹn"
      />

      {/* Full-bleed Three.js 3D Vietnamese Cultural Heritage Scene */}
      <HeritageScene
        mood={mood}
        cameraPreset={cameraPreset}
        cameraPresetNonce={cameraPresetNonce}
        releaseLanternNonce={releaseLanternNonce}
        isMusicPlaying={isMusicPlaying}
        lanternCount={lanternCount}
      />

      {/* Minimal Top-Left Editorial Title Lockup */}
      <header className="pointer-events-none fixed left-4 top-4 z-20 max-w-[min(410px,calc(100vw-32px))] sm:left-6 sm:top-5">
        <div
          className={`pointer-events-auto inline-flex flex-col rounded-xl border px-4 py-3 shadow-sm ${
            isNight
              ? 'border-[#653b46] bg-[#1f131b]/92 text-[#fbf2e8]'
              : 'border-[#e6ceb4] bg-[#fef9f3]/92 text-[#2e1a18]'
          }`}
        >
          <div className="flex items-baseline gap-2.5">
            <span
              className={`font-display text-2xl font-extrabold leading-none sm:text-3xl ${
                isNight ? 'text-[#f4c968]' : 'text-[#c12d2f]'
              }`}
            >
              24 · 11
            </span>
            <h1 className="font-display text-base font-bold leading-tight sm:text-lg">
              Ngày Văn Hóa Việt Nam
            </h1>
          </div>

          <div
            className={`mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs ${
              isNight ? 'text-[#d8c1b6]' : 'text-[#6e5045]'
            }`}
          >
            <span>Văn hóa còn thì dân tộc còn</span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setShowGreetingPlaque(true)}
              className={`inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c12d2f] ${
                isNight ? 'text-[#f4c968]' : 'text-[#c12d2f]'
              }`}
            >
              <MailOpen className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Xem lời chúc</span>
            </button>
          </div>
        </div>
      </header>

      {/* Unified Collapsible Bottom Control Dock */}
      <ControlDock
        mood={mood}
        cameraPreset={cameraPreset}
        audioStage={audioStage}
        isMusicPlaying={isMusicPlaying}
        isMuted={isMuted}
        playbackTime={playbackTime}
        currentCaption={currentCaption}
        lanternCount={lanternCount}
        isCollapsed={isDockCollapsed}
        onToggleCollapse={() => setIsDockCollapsed((c) => !c)}
        onTogglePlay={handleTogglePlay}
        onSkipToSong={startSongFromBeginning}
        onReplayIntro={startSpeechFromBeginning}
        onToggleMute={handleToggleMute}
        onSelectCamera={handleSelectCamera}
        onSelectMood={setMood}
        onReleaseLantern={handleReleaseLantern}
        onOpenShareModal={() => {
          setShowGreetingPlaque(false);
          setShowShareModal(true);
        }}
      />

      {/* Ceremonial Greeting Card Dialog */}
      {showGreetingPlaque && (
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

      {/* Shareable Link & Personalized E-Card Composer Modal */}
      {showShareModal && (
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
