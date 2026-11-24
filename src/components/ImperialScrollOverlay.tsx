import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Compass,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { GreetingConfig } from '../utils/greetingLink';
import {
  CLOSING_SCROLL_CLOSING_LINE,
  CLOSING_SCROLL_QUOTE,
  CLOSING_SCROLL_QUOTE_AUTHOR,
  OPENING_SCROLL_NARRATION_TEXT,
  OPENING_SCROLL_STANZAS,
  OPENING_SCROLL_SUBTITLE,
  OPENING_SCROLL_TITLE,
  formatClosingPersonalDedication,
  getActiveScrollStanzaIndex,
} from '../utils/scrollContent';
import type { ShatterOriginRect } from './ScrollFireworkTransition';

interface OpeningScrollProps {
  variant: 'opening';
  stage: 'sealed_scroll' | 'reading_scroll';
  onUnroll: () => void;
  onIgniteFireworks: (originRect: ShatterOriginRect | null) => void;
  onSkipToExplore: () => void;
}

interface ClosingScrollProps {
  variant: 'closing';
  greeting: GreetingConfig;
  onReplayAll: () => void;
  onExplore3D: () => void;
}

type ImperialScrollOverlayProps = OpeningScrollProps | ClosingScrollProps;

type NarrationState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

/**
 * Ornate Dark Ebony & Antique Gold Cylindrical Wooden Roller (Trục gỗ mun đầu nạm đồng vàng)
 * capping the top and bottom of the vertical Vietnamese Imperial Brocade Scroll.
 */
function ScrollWoodenRoller({ position }: { position: 'top' | 'bottom' }) {
  return (
    <div
      aria-hidden="true"
      className={`relative z-20 flex w-[calc(100%+28px)] -ml-[14px] items-center select-none ${
        position === 'top' ? '-mb-1.5' : '-mt-1.5'
      }`}
    >
      {/* Left antique gold finial */}
      <div className="h-5 w-4 shrink-0 rounded-l-full border border-[#f5d57d]/70 bg-gradient-to-b from-[#f6d984] via-[#b88228] to-[#5e3d11] shadow-md sm:h-6 sm:w-5" />
      <div className="h-6 w-1.5 shrink-0 bg-gradient-to-b from-[#ffe79c] via-[#9c6919] to-[#4f320d] sm:h-7" />
      {/* Ebony lacquered wooden roller rod */}
      <div className="relative h-6 flex-1 bg-gradient-to-b from-[#4c2824] via-[#261111] to-[#120708] shadow-[0_6px_18px_rgba(12,4,6,0.65)] sm:h-7">
        <div className="absolute inset-x-0 top-1 h-[2px] bg-gradient-to-r from-transparent via-[#d49e47]/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-1 h-px bg-[#8a4d34]/40" />
      </div>
      {/* Right antique gold finial */}
      <div className="h-6 w-1.5 shrink-0 bg-gradient-to-b from-[#ffe79c] via-[#9c6919] to-[#4f320d] sm:h-7" />
      <div className="h-5 w-4 shrink-0 rounded-r-full border border-[#f5d57d]/70 bg-gradient-to-b from-[#f6d984] via-[#b88228] to-[#5e3d11] shadow-md sm:h-6 sm:w-5" />
    </div>
  );
}

/**
 * Embossed Vietnamese Crimson Lacquer Seal (Ấn son 24 · 11)
 */
function ImperialWaxSeal({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim =
    size === 'lg'
      ? 'h-16 w-16 text-base'
      : size === 'sm'
        ? 'h-10 w-10 text-[11px]'
        : 'h-12 w-12 text-xs';
  return (
    <div
      className={`relative flex shrink-0 flex-col items-center justify-center rounded-full border-2 border-[#f4cf73] bg-gradient-to-br from-[#c92929] via-[#9e191c] to-[#680e12] font-display font-extrabold tracking-tight text-[#fff5df] shadow-[0_6px_20px_rgba(148,22,26,0.55)] ${dim}`}
    >
      <div className="pointer-events-none absolute inset-1 rounded-full border border-[#f4cf73]/45" />
      <span className="leading-none">24·11</span>
    </div>
  );
}

export function ImperialScrollOverlay(props: ImperialScrollOverlayProps) {
  const scrollFrameRef = useRef<HTMLDivElement | null>(null);
  const narrationAudioRef = useRef<HTMLAudioElement | null>(null);
  const narrationBlobUrlRef = useRef<string | null>(null);

  const [narrationState, setNarrationState] = useState<NarrationState>('idle');
  const [narrationError, setNarrationError] = useState<string | null>(null);
  const [isNarrationMuted, setIsNarrationMuted] = useState(false);
  const [narrationProgress, setNarrationProgress] = useState(0);

  const isReadingOpening = props.variant === 'opening' && props.stage === 'reading_scroll';

  const stopNarration = useCallback(() => {
    const audio = narrationAudioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  const loadAndPlayNarration = useCallback(async (signal?: AbortSignal) => {
    const audio = narrationAudioRef.current;
    if (!audio) return;

    // Reuse already-fetched Blob URL on instant replay
    if (narrationBlobUrlRef.current) {
      audio.src = narrationBlobUrlRef.current;
      audio.currentTime = 0;
      audio.muted = isNarrationMuted;
      setNarrationError(null);
      try {
        await audio.play();
        setNarrationState('playing');
      } catch {
        setNarrationState('paused');
      }
      return;
    }

    setNarrationState('loading');
    setNarrationError(null);

    try {
      const response = await fetch('/api/tts/scroll-narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: OPENING_SCROLL_NARRATION_TEXT }),
        signal,
      });

      if (!response.ok) {
        let serverErr = 'Không thể phát giọng đọc chiếu thư vào lúc này.';
        try {
          const errJson = (await response.json()) as { error?: string };
          if (errJson?.error) serverErr = errJson.error;
        } catch {
          // Keep default error copy
        }
        throw new Error(serverErr);
      }

      const audioBlob = await response.blob();
      if (signal?.aborted) return;

      const objectUrl = URL.createObjectURL(audioBlob);
      narrationBlobUrlRef.current = objectUrl;
      audio.src = objectUrl;
      audio.muted = isNarrationMuted;
      audio.currentTime = 0;

      try {
        await audio.play();
        setNarrationState('playing');
      } catch {
        // Browser autoplay policy fallback — user can click Play cleanly
        setNarrationState('paused');
      }
    } catch (err) {
      if (signal?.aborted) return;
      const msg =
        err instanceof Error && err.message
          ? err.message
          : 'Không thể kết nối giọng đọc chiếu thư.';
      setNarrationError(msg);
      setNarrationState('error');
    }
  }, [isNarrationMuted]);

  // Automatically fetch & play expressive Vietnamese TTS voiceover as soon as the user unrolls the opening scroll
  useEffect(() => {
    if (!isReadingOpening) return;
    const controller = new AbortController();
    void loadAndPlayNarration(controller.signal);
    return () => {
      controller.abort();
    };
  }, [isReadingOpening, loadAndPlayNarration]);

  // Track audio progress for gentle stanza highlight while listening
  useEffect(() => {
    const audio = narrationAudioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration && Number.isFinite(audio.duration) && audio.duration > 0) {
        setNarrationProgress(Math.min(1, audio.currentTime / audio.duration));
      }
    };
    const handleEnded = () => {
      setNarrationProgress(1);
      setNarrationState('ended');
    };
    const handlePause = () => {
      setNarrationState((curr) => (curr === 'playing' ? 'paused' : curr));
    };
    const handlePlay = () => {
      setNarrationState('playing');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
    };
  }, []);

  // Clean up object URL and pause audio on unmount
  useEffect(() => {
    return () => {
      stopNarration();
      if (narrationBlobUrlRef.current) {
        URL.revokeObjectURL(narrationBlobUrlRef.current);
        narrationBlobUrlRef.current = null;
      }
    };
  }, [stopNarration]);

  const handleToggleNarrationPlay = () => {
    const audio = narrationAudioRef.current;
    if (!audio) return;
    if (narrationState === 'error' || !narrationBlobUrlRef.current) {
      void loadAndPlayNarration();
      return;
    }
    if (audio.paused) {
      if (narrationState === 'ended') {
        audio.currentTime = 0;
        setNarrationProgress(0);
      }
      audio.muted = isNarrationMuted;
      audio
        .play()
        .then(() => setNarrationState('playing'))
        .catch(() => setNarrationState('paused'));
    } else {
      audio.pause();
      setNarrationState('paused');
    }
  };

  const handleToggleNarrationMute = () => {
    setIsNarrationMuted((prev) => {
      const next = !prev;
      if (narrationAudioRef.current) {
        narrationAudioRef.current.muted = next;
      }
      return next;
    });
  };

  const handleTriggerFireworks = () => {
    if (props.variant !== 'opening') return;
    stopNarration();
    const el = scrollFrameRef.current;
    const domRect = el ? el.getBoundingClientRect() : null;
    const originRect: ShatterOriginRect | null = domRect
      ? {
          x: domRect.left,
          y: domRect.top,
          width: domRect.width,
          height: domRect.height,
        }
      : null;
    props.onIgniteFireworks(originRect);
  };

  // =========================================================================
  // 1. OPENING SEALED IMPERIAL BROCADE SCROLL (Closed state on arrival)
  // =========================================================================
  if (props.variant === 'opening' && props.stage === 'sealed_scroll') {
    return (
      <div
        data-testid="imperial-scroll-sealed"
        className="fixed inset-0 z-30 flex flex-col items-center justify-center px-4 py-6"
        style={{
          background:
            'radial-gradient(circle at 50% 48%, rgba(28, 12, 14, 0.24) 0%, rgba(18, 9, 12, 0.58) 100%)',
        }}
      >
        <div className="relative flex w-full max-w-[492px] flex-col items-center">
          {/* Silk hanging cord knot above top roller */}
          <div aria-hidden="true" className="mb-1 flex flex-col items-center">
            <div className="h-3 w-3 rounded-full border border-[#f5d276] bg-[#b51f24] shadow" />
            <div className="h-5 w-[2px] bg-gradient-to-b from-[#d99d3b] to-[#8a1a1f]" />
          </div>

          <button
            type="button"
            onClick={props.onUnroll}
            data-testid="open-scroll-btn"
            className="group relative flex w-full cursor-pointer flex-col items-center text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f4cf73]"
          >
            <ScrollWoodenRoller position="top" />

            {/* Rolled Vermilion Silk Brocade Case */}
            <div className="imperial-brocade-surface relative w-full border-x-[6px] border-[#8b181d] px-6 py-7 text-[#fff6e3] shadow-[0_24px_60px_rgba(12,4,7,0.72)] transition-transform duration-300 group-hover:scale-[1.012] sm:px-8 sm:py-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-2 border border-[#e9bd62]/55"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-3.5 border border-[#e9bd62]/25"
              />

              <div className="relative flex flex-col items-center">
                <p className="text-[11px] font-semibold tracking-[0.26em] text-[#f5d380] uppercase">
                  Chiếu Thư Kỷ Niệm
                </p>

                <div className="my-4 rounded-full animate-seal-pulse">
                  <ImperialWaxSeal size="lg" />
                </div>

                <h1 className="font-display text-xl font-extrabold tracking-wide text-[#fff8eb] sm:text-[26px] sm:whitespace-nowrap">
                  {OPENING_SCROLL_TITLE}
                </h1>

                <p className="mt-1.5 text-xs font-medium tracking-wide text-[#f7ddb2] sm:text-[13px]">
                  24 · 11 · 1946 — Văn hóa soi đường cho quốc dân đi
                </p>

                <div
                  aria-hidden="true"
                  className="my-4 h-px w-24 bg-gradient-to-r from-transparent via-[#f0c566]/80 to-transparent"
                />

                <span className="inline-flex items-center gap-2 rounded-md border border-[#f5d47d]/80 bg-[#f6cf73] px-5 py-2 text-xs font-bold tracking-wide text-[#331312] shadow-md transition-colors group-hover:bg-[#ffe196] sm:text-sm">
                  <Sparkles className="h-4 w-4 text-[#a31b20]" aria-hidden="true" />
                  <span>Mở Cuộn Chiếu Thư</span>
                </span>

                <p className="mt-2.5 text-[11px] text-[#f0d3b6]/90">
                  Có giọng đọc lời văn truyền cảm · Trải nghiệm điện ảnh 3D
                </p>
              </div>
            </div>

            <ScrollWoodenRoller position="bottom" />
          </button>

          <button
            type="button"
            onClick={props.onSkipToExplore}
            data-testid="skip-to-explore-btn"
            className="mt-5 text-xs font-medium tracking-wide text-[#fcecd4]/90 underline decoration-[#f0c566]/55 underline-offset-4 transition-colors hover:text-[#ffe49e]"
          >
            Bỏ qua chiếu thư · Tự khám phá không gian 3D
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. OPENING UNROLLED READING SCROLL (With Gemini TTS Expressive Voiceover)
  // =========================================================================
  if (props.variant === 'opening' && props.stage === 'reading_scroll') {
    const activeStanzaIdx =
      narrationState === 'playing' || narrationState === 'paused' || narrationState === 'ended'
        ? getActiveScrollStanzaIndex(narrationProgress)
        : -1;

    return (
      <div
        data-testid="imperial-scroll-reading"
        className="fixed inset-0 z-30 flex items-center justify-center px-3 py-4 sm:px-6 sm:py-6"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(24, 11, 14, 0.28) 0%, rgba(16, 8, 12, 0.64) 100%)',
        }}
      >
        <audio ref={narrationAudioRef} preload="none" aria-label="Giọng đọc chiếu thư Ngày Văn Hóa Việt Nam" />

        <div
          ref={scrollFrameRef}
          className="animate-scroll-unroll relative flex max-h-[92vh] w-full max-w-[600px] flex-col"
        >
          <ScrollWoodenRoller position="top" />

          {/* Unrolled Crimson Brocade Framing + Warm Antique Ivory Silk Parchment */}
          <div className="imperial-brocade-surface relative flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-3 shadow-[0_28px_72px_rgba(10,3,6,0.78)] sm:px-4 sm:py-3.5">
            <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto border border-[#d6a94f]/80 bg-[#fbf3e2] px-5 py-5 text-[#2d1714] shadow-inner sm:px-8 sm:py-6">
              {/* Inner antique vermilion double-rule hairline */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-2 border border-[#b92e2e]/25"
              />

              {/* Scroll Header with Wax Seal */}
              <div className="relative flex flex-col items-center text-center">
                <div className="flex items-center gap-3">
                  <span className="h-px w-8 bg-[#b8322e]/45 sm:w-12" aria-hidden="true" />
                  <ImperialWaxSeal size="sm" />
                  <span className="h-px w-8 bg-[#b8322e]/45 sm:w-12" aria-hidden="true" />
                </div>

                <h2 className="mt-2.5 font-display text-xl font-extrabold tracking-wide text-[#9e1b1f] sm:text-2xl">
                  {OPENING_SCROLL_TITLE}
                </h2>
                <p className="mt-0.5 text-[11px] font-semibold tracking-wider text-[#754f3c] uppercase sm:text-xs">
                  {OPENING_SCROLL_SUBTITLE}
                </p>
              </div>

              {/* Expressive Vietnamese AI Voiceover Ribbon */}
              <div
                data-testid="scroll-narration-bar"
                className="relative mt-4 flex flex-col gap-1.5 rounded-lg border border-[#dcc39a] bg-[#f4e7cd] px-3.5 py-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#5b2a1e]">
                    {narrationState === 'loading' ? (
                      <>
                        <span
                          aria-hidden="true"
                          className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-[#b92828]"
                        />
                        <span>Đang cất giọng đọc truyền cảm...</span>
                      </>
                    ) : narrationState === 'playing' ? (
                      <>
                        <Volume2 className="h-4 w-4 text-[#a81f24]" aria-hidden="true" />
                        <span>Đang đọc lời chiếu thư</span>
                      </>
                    ) : narrationState === 'ended' ? (
                      <>
                        <Sparkles className="h-4 w-4 text-[#a81f24]" aria-hidden="true" />
                        <span>Đã đọc trọn vẹn lời chiếu thư</span>
                      </>
                    ) : narrationState === 'error' ? (
                      <>
                        <AlertCircle className="h-4 w-4 text-[#9e2a1f]" aria-hidden="true" />
                        <span>Giọng đọc tạm gián đoạn — mời bạn đọc trực tiếp</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-4 w-4 text-[#7c4d36]" aria-hidden="true" />
                        <span>Giọng đọc chiếu thư sẵn sàng</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleToggleNarrationPlay}
                      disabled={narrationState === 'loading'}
                      className="inline-flex items-center gap-1 rounded border border-[#cba670] bg-[#fffaf0] px-2.5 py-1 text-[11px] font-semibold text-[#471f18] transition-colors hover:bg-[#f7ebd4] disabled:opacity-50"
                    >
                      {narrationState === 'playing' ? (
                        <>
                          <Pause className="h-3 w-3" aria-hidden="true" />
                          <span>Tạm dừng</span>
                        </>
                      ) : narrationState === 'ended' ? (
                        <>
                          <RotateCcw className="h-3 w-3" aria-hidden="true" />
                          <span>Nghe lại</span>
                        </>
                      ) : narrationState === 'error' ? (
                        <>
                          <RotateCcw className="h-3 w-3" aria-hidden="true" />
                          <span>Thử lại</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3" aria-hidden="true" />
                          <span>Nghe đọc</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleNarrationMute}
                      aria-label={isNarrationMuted ? 'Bật tiếng giọng đọc' : 'Tắt tiếng giọng đọc'}
                      className="inline-flex h-6 w-6 items-center justify-center rounded border border-[#cba670] bg-[#fffaf0] text-[#471f18] transition-colors hover:bg-[#f7ebd4]"
                    >
                      {isNarrationMuted ? (
                        <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Progress thread */}
                {narrationState !== 'error' && (
                  <div className="h-1 w-full overflow-hidden rounded-full bg-[#dfd0b4]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#b82628] via-[#d9932e] to-[#b82628] transition-[width] duration-150 ease-linear"
                      style={{
                        width:
                          narrationState === 'loading'
                            ? '28%'
                            : `${Math.round(narrationProgress * 100)}%`,
                      }}
                    />
                  </div>
                )}

                {narrationError && (
                  <p className="text-[11px] leading-snug text-[#7e3b2e]">{narrationError}</p>
                )}
              </div>

              {/* Four Poetic Ceremonial Stanzas */}
              <div className="relative mt-4 space-y-3 text-left font-display text-[13.5px] leading-[1.68] text-[#351b16] sm:text-[15px]">
                {OPENING_SCROLL_STANZAS.map((stanza, index) => {
                  const isActive = activeStanzaIdx === index;
                  return (
                    <p
                      key={stanza.id}
                      className={`rounded-md px-2.5 py-1.5 transition-colors duration-300 ${
                        isActive
                          ? 'border-l-2 border-[#b92729] bg-[#f4e4c2]/80 text-[#220e0c]'
                          : 'border-l-2 border-transparent text-[#462720]'
                      }`}
                    >
                      {stanza.text}
                    </p>
                  );
                })}
              </div>

              {/* Ceremonial Red-Lacquer Seal CTA to Shatter Scroll into Fireworks & Launch Zero-UI Cinema */}
              <div className="relative mt-5 flex flex-col items-center border-t border-[#d8bd91] pt-4 text-center">
                <button
                  type="button"
                  onClick={handleTriggerFireworks}
                  data-testid="ignite-fireworks-btn"
                  className="group inline-flex cursor-pointer items-center gap-2.5 rounded-lg border-2 border-[#f2c86b] bg-gradient-to-r from-[#a81a1f] via-[#c7282b] to-[#a81a1f] px-6 py-2.5 text-sm font-bold tracking-wide text-[#fff7e8] shadow-[0_10px_28px_rgba(168,26,31,0.42)] transition-[filter,box-shadow] duration-200 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a81a1f] sm:px-7 sm:py-3 sm:text-[15px]"
                >
                  <Sparkles
                    className="h-4 w-4 text-[#ffe08a] transition-transform duration-300 group-hover:rotate-12"
                    aria-hidden="true"
                  />
                  <span>Khai Mở Di Sản · Bắn Pháo Hoa</span>
                </button>
                <p className="mt-2 text-[11px] text-[#735141]">
                  Cuộn chiếu thư sẽ bung pháo hoa rực rỡ và bắt đầu trọn vẹn 4 hồi điện ảnh không nút bấm
                </p>
              </div>
            </div>
          </div>

          <ScrollWoodenRoller position="bottom" />
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. CLOSING TRIBUTE IMPERIAL SCROLL (Auto-unrolls at end of the 4-Act Film)
  // =========================================================================
  if (props.variant !== 'closing') {
    return null;
  }

  const dedication = props.greeting.isPersonalized
    ? formatClosingPersonalDedication(
        props.greeting.to,
        props.greeting.from,
        props.greeting.message,
      )
    : null;

  return (
    <div
      data-testid="imperial-scroll-closing"
      className="fixed inset-0 z-30 flex items-center justify-center px-3 py-5 sm:px-6"
      style={{
        background:
          'radial-gradient(circle at 50% 50%, rgba(16, 8, 22, 0.22) 0%, rgba(10, 5, 16, 0.56) 100%)',
      }}
    >
      <div className="animate-scroll-unroll relative flex max-h-[90vh] w-full max-w-[540px] flex-col">
        <ScrollWoodenRoller position="top" />

        <div className="imperial-brocade-surface relative flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-3 shadow-[0_28px_72px_rgba(6,2,12,0.82)] sm:px-4 sm:py-3.5">
          <div className="relative flex min-h-0 flex-1 flex-col items-center overflow-y-auto border border-[#d6a94f]/85 bg-[#fbf3e2] px-6 py-6 text-center text-[#2d1714] shadow-inner sm:px-9 sm:py-7">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-2 border border-[#b92e2e]/25"
            />

            <div className="relative flex flex-col items-center">
              <div className="flex items-center gap-2.5 text-[10px] font-bold tracking-[0.24em] text-[#9e1d20] uppercase sm:text-[11px]">
                <span className="h-px w-7 bg-[#b93430]/55" aria-hidden="true" />
                <span>Chào Mừng &amp; Tôn Vinh</span>
                <span className="h-px w-7 bg-[#b93430]/55" aria-hidden="true" />
              </div>

              <div className="mt-3">
                <ImperialWaxSeal size="md" />
              </div>

              <h2 className="mt-3 font-display text-2xl font-extrabold tracking-wide text-[#9e1b1f] sm:text-[28px]">
                {OPENING_SCROLL_TITLE}
              </h2>

              <div
                aria-hidden="true"
                className="my-3.5 h-px w-28 bg-gradient-to-r from-transparent via-[#c79335]/85 to-transparent"
              />

              <p
                className="font-display text-base font-semibold italic leading-relaxed text-[#3a1914] sm:text-lg"
                style={{ textWrap: 'balance' }}
              >
                {CLOSING_SCROLL_QUOTE}
              </p>
              <p className="mt-1 text-xs font-medium tracking-wide text-[#7a503c]">
                — {CLOSING_SCROLL_QUOTE_AUTHOR} —
              </p>

              {dedication ? (
                <div className="mt-4 w-full rounded-lg border border-[#d9bc8c] bg-[#f4e7cd] px-4 py-3 text-center">
                  <p className="text-xs font-bold tracking-wide text-[#9e1c20]">
                    {dedication.heading}
                  </p>
                  <p
                    className="mt-1 font-display text-sm leading-relaxed text-[#381d18]"
                    style={{ textWrap: 'balance' }}
                  >
                    {dedication.body}
                  </p>
                </div>
              ) : (
                <p
                  className="mt-4 text-xs leading-relaxed text-[#543228] sm:text-[13.5px]"
                  style={{ textWrap: 'balance' }}
                >
                  {CLOSING_SCROLL_CLOSING_LINE}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={props.onReplayAll}
                  data-testid="closing-replay-btn"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#f2c86b] bg-[#b52226] px-4 py-2 text-xs font-bold text-[#fff8ee] shadow-sm transition-colors hover:bg-[#961a1e] sm:text-sm"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Xem lại từ đầu</span>
                </button>

                <button
                  type="button"
                  onClick={props.onExplore3D}
                  data-testid="closing-explore-btn"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#b88b45] bg-[#f5e7ca] px-4 py-2 text-xs font-bold text-[#3f1f18] transition-colors hover:bg-[#ebd7b0] sm:text-sm"
                >
                  <Compass className="h-3.5 w-3.5 text-[#a32024]" aria-hidden="true" />
                  <span>Tự khám phá 3D</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <ScrollWoodenRoller position="bottom" />
      </div>
    </div>
  );
}
