import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Flame,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Share2,
  SkipForward,
  SlidersHorizontal,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  type AudioStage,
  type CameraPresetId,
  SONG_DURATION_SEC,
  SPEECH_CUTOFF_SEC,
  type SceneMood,
  formatPlaybackTime,
} from '../utils/greetingLink';

interface ControlDockProps {
  mood: SceneMood;
  cameraPreset: CameraPresetId;
  audioStage: AudioStage;
  isMusicPlaying: boolean;
  isMuted: boolean;
  playbackTime: number;
  currentCaption: string;
  lanternCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onTogglePlay: () => void;
  onSkipToSong: () => void;
  onReplayIntro: () => void;
  onToggleMute: () => void;
  onSelectCamera: (preset: CameraPresetId) => void;
  onSelectMood: (mood: SceneMood) => void;
  onReleaseLantern: () => void;
  onOpenShareModal: () => void;
}

const CAMERA_OPTIONS: Array<{ id: CameraPresetId; label: string }> = [
  { id: 'overview', label: 'Toàn cảnh' },
  { id: 'pavilion', label: 'Khuê Văn Các' },
  { id: 'flagtower', label: 'Cột Cờ' },
  { id: 'lotus', label: 'Đài Sen' },
];

export function ControlDock({
  mood,
  cameraPreset,
  audioStage,
  isMusicPlaying,
  isMuted,
  playbackTime,
  currentCaption,
  lanternCount,
  isCollapsed,
  onToggleCollapse,
  onTogglePlay,
  onSkipToSong,
  onReplayIntro,
  onToggleMute,
  onSelectCamera,
  onSelectMood,
  onReleaseLantern,
  onOpenShareModal,
}: ControlDockProps) {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const isNight = mood === 'night';

  const surfaceClass = isNight
    ? 'bg-[#1f131b]/95 border-[#653b46] text-[#fbf2e8]'
    : 'bg-[#fef9f3]/95 border-[#e6ceb4] text-[#2e1a18]';

  const mutedTextClass = isNight ? 'text-[#d8c1b6]' : 'text-[#735449]';
  const dividerClass = isNight ? 'bg-[#56333d]' : 'bg-[#e8d2ba]';
  const groupBgClass = isNight ? 'bg-[#2f1d28]' : 'bg-[#f6e8d8]';
  const inactiveTabClass = isNight
    ? 'text-[#dbc5ba] hover:text-[#fff7ef]'
    : 'text-[#6c4f44] hover:text-[#2e1a18]';
  const activeTabClass = isNight
    ? 'bg-[#c12d2f] text-[#fff8f0] shadow-sm'
    : 'bg-[#fef9f3] text-[#a51f24] shadow-sm';

  const totalDuration = audioStage === 'speech' ? SPEECH_CUTOFF_SEC : SONG_DURATION_SEC;
  const trackLabel =
    audioStage === 'speech'
      ? 'Lời mở đầu · TBT Nguyễn Phú Trọng'
      : 'Thịnh Vượng Việt Nam Sáng Ngời';

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-20 flex flex-col items-center px-3 sm:bottom-4">
      {/* Synchronized speech quote / song lyric bar when playing */}
      {isMusicPlaying && !isCollapsed && (
        <div
          aria-live="polite"
          className={`pointer-events-auto mb-1.5 flex max-w-[min(760px,94vw)] items-center gap-2.5 rounded-lg border px-3.5 py-1.5 text-xs font-medium tracking-wide sm:text-sm ${
            isNight
              ? 'border-[#74454f] bg-[#1e121a]/94 text-[#fae09e]'
              : 'border-[#e4c8a6] bg-[#fef9f1]/95 text-[#7f1e22]'
          }`}
        >
          <span className="truncate">{currentCaption}</span>
          {audioStage === 'speech' ? (
            <button
              type="button"
              onClick={onSkipToSong}
              aria-label="Chuyển thẳng sang bài hát Thịnh Vượng Việt Nam Sáng Ngời"
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                isNight
                  ? 'bg-[#3c2432] text-[#ffdca2] hover:bg-[#4e2f41]'
                  : 'bg-[#f4e2ce] text-[#8d1d22] hover:bg-[#ebd0b3]'
              }`}
            >
              <span>Vào nhạc</span>
              <SkipForward className="h-3 w-3" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onReplayIntro}
              aria-label="Nghe lại lời mở đầu của Tổng Bí thư Nguyễn Phú Trọng"
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                isNight
                  ? 'bg-[#3c2432] text-[#ffdca2] hover:bg-[#4e2f41]'
                  : 'bg-[#f4e2ce] text-[#8d1d22] hover:bg-[#ebd0b3]'
              }`}
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              <span>Lời mở đầu</span>
            </button>
          )}
        </div>
      )}

      {/* Collapse / Expand toggle tab attached to top edge of dock */}
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? 'Hiện bảng điều khiển' : 'Ẩn bảng điều khiển'}
        className={`pointer-events-auto inline-flex items-center gap-1.5 border border-b-0 px-3 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c12d2f] ${
          isCollapsed ? 'border-b rounded-md' : 'rounded-t-md'
        } ${surfaceClass}`}
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Hiện điều khiển</span>
          </>
        ) : (
          <>
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Ẩn điều khiển</span>
          </>
        )}
      </button>

      {/* Unified compact single-row desktop dock / slim expandable mobile dock */}
      {!isCollapsed && (
        <section
          aria-label="Bảng điều khiển không gian 3D và âm nhạc"
          className={`pointer-events-auto w-full max-w-[1180px] rounded-xl border px-2.5 py-2 shadow-lg sm:px-3.5 sm:py-2 ${surfaceClass}`}
        >
          {/* Mobile expandable secondary row (camera + mood) */}
          {mobileExpanded && (
            <div className="mb-2 flex flex-col gap-2 border-b border-current/15 pb-2 lg:hidden">
              <div
                role="group"
                aria-label="Góc nhìn không gian 3D"
                className={`grid grid-cols-4 gap-1 rounded-lg p-1 ${groupBgClass}`}
              >
                {CAMERA_OPTIONS.map((cam) => {
                  const active = cameraPreset === cam.id;
                  return (
                    <button
                      key={cam.id}
                      type="button"
                      onClick={() => onSelectCamera(cam.id)}
                      aria-pressed={active}
                      className={`rounded-md px-1.5 py-1.5 text-[11px] font-medium transition-colors whitespace-nowrap truncate ${
                        active ? activeTabClass : inactiveTabClass
                      }`}
                    >
                      {cam.label}
                    </button>
                  );
                })}
              </div>
              <div
                role="group"
                aria-label="Chế độ ánh sáng"
                className={`grid grid-cols-2 gap-1 rounded-lg p-1 ${groupBgClass}`}
              >
                <button
                  type="button"
                  onClick={() => onSelectMood('dawn')}
                  aria-pressed={mood === 'dawn'}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    mood === 'dawn' ? activeTabClass : inactiveTabClass
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Bình Minh</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectMood('night')}
                  aria-pressed={mood === 'night'}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    mood === 'night' ? activeTabClass : inactiveTabClass
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Đêm Hoa Đăng</span>
                </button>
              </div>
            </div>
          )}

          {/* Primary Single-Row Bar */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            {/* Zone 1: Two-Stage Audio Player */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onTogglePlay}
                aria-pressed={isMusicPlaying}
                aria-label={
                  isMusicPlaying
                    ? 'Tạm dừng chương trình âm thanh'
                    : 'Phát lời mở đầu và nhạc Thịnh Vượng Việt Nam Sáng Ngời'
                }
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#c12d2f] px-2.5 sm:px-3 text-xs font-semibold text-[#fff9f2] transition-colors hover:bg-[#a32225] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e2ab46]"
              >
                {isMusicPlaying ? (
                  <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">
                  {isMusicPlaying ? 'Tạm dừng' : 'Phát nhạc'}
                </span>
                <span className="sm:hidden">{isMusicPlaying ? 'Dừng' : 'Nhạc'}</span>
              </button>

              <button
                type="button"
                onClick={onToggleMute}
                aria-pressed={isMuted}
                aria-label={isMuted ? 'Bật tiếng' : 'Tắt tiếng'}
                className={`hidden h-9 w-9 items-center justify-center rounded-lg border transition-colors shrink-0 sm:inline-flex focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c12d2f] ${
                  isNight
                    ? 'border-[#653b46] bg-[#2e1c27] text-[#f7e9dc] hover:bg-[#3e2635]'
                    : 'border-[#e4cab0] bg-[#f7eadb] text-[#55382e] hover:bg-[#edd9c1]'
                }`}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                )}
              </button>

              <div className="hidden min-w-0 flex-col xl:flex">
                <span className="truncate text-[11px] font-semibold leading-tight max-w-[175px]">
                  {trackLabel}
                </span>
                <span className={`text-[10px] tabular-nums leading-tight ${mutedTextClass}`}>
                  {formatPlaybackTime(playbackTime)} / {formatPlaybackTime(totalDuration)}
                </span>
              </div>
            </div>

            <div className={`hidden h-6 w-px lg:block ${dividerClass}`} aria-hidden="true" />

            {/* Zone 2 (Desktop): Camera Preset Selector */}
            <div
              role="group"
              aria-label="Góc nhìn không gian 3D"
              className={`hidden items-center gap-0.5 rounded-lg p-0.5 lg:flex ${groupBgClass}`}
            >
              {CAMERA_OPTIONS.map((cam) => {
                const active = cameraPreset === cam.id;
                return (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => onSelectCamera(cam.id)}
                    aria-pressed={active}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#c12d2f] ${
                      active ? activeTabClass : inactiveTabClass
                    }`}
                  >
                    {cam.label}
                  </button>
                );
              })}
            </div>

            {/* Zone 3 (Desktop): Mood Switcher */}
            <div
              role="group"
              aria-label="Chế độ ánh sáng"
              className={`hidden items-center gap-0.5 rounded-lg p-0.5 lg:flex ${groupBgClass}`}
            >
              <button
                type="button"
                onClick={() => onSelectMood('dawn')}
                aria-pressed={mood === 'dawn'}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#c12d2f] ${
                  mood === 'dawn' ? activeTabClass : inactiveTabClass
                }`}
              >
                <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Bình Minh</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectMood('night')}
                aria-pressed={mood === 'night'}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#c12d2f] ${
                  mood === 'night' ? activeTabClass : inactiveTabClass
                }`}
              >
                <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Đêm Hoa Đăng</span>
              </button>
            </div>

            {/* Zone 4: Actions (Lantern + Share Link + Mobile View Options Toggle) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setMobileExpanded((prev) => !prev)}
                aria-expanded={mobileExpanded}
                aria-label="Tùy chỉnh góc nhìn và ánh sáng"
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors lg:hidden shrink-0 ${
                  isNight
                    ? 'border-[#653b46] bg-[#2e1c27] text-[#f7e9dc]'
                    : 'border-[#e4cab0] bg-[#f7eadb] text-[#55382e]'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onReleaseLantern}
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e2ab46] ${
                  isNight
                    ? 'border-[#b37b35] bg-[#3a2220] text-[#ffe094] hover:bg-[#4c2d29]'
                    : 'border-[#dfb368] bg-[#fcf2e0] text-[#8f5212] hover:bg-[#f5e3c4]'
                }`}
              >
                <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline tabular-nums">
                  Thả hoa đăng{lanternCount > 0 ? ` (${lanternCount})` : ''}
                </span>
                <span className="sm:hidden tabular-nums">
                  Hoa đăng{lanternCount > 0 ? ` (${lanternCount})` : ''}
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenShareModal}
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 sm:px-3 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e2ab46] ${
                  isNight
                    ? 'bg-[#ebb956] text-[#261414] hover:bg-[#f4ca71]'
                    : 'bg-[#1e7363] text-[#fdfaf5] hover:bg-[#175c4f]'
                }`}
              >
                <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Tạo link chia sẻ</span>
                <span className="sm:hidden">Chia sẻ</span>
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
