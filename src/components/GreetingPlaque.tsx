import { Play, Share2, X } from 'lucide-react';
import type { GreetingConfig, SceneMood } from '../utils/greetingLink';

interface GreetingPlaqueProps {
  greeting: GreetingConfig;
  mood: SceneMood;
  isMusicPlaying: boolean;
  onEnterSceneWithMusic: () => void;
  onClose: () => void;
  onOpenComposer: () => void;
}

export function GreetingPlaque({
  greeting,
  mood,
  isMusicPlaying,
  onEnterSceneWithMusic,
  onClose,
  onOpenComposer,
}: GreetingPlaqueProps) {
  const isNight = mood === 'night';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="greeting-card-title"
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#180d0b]/60 p-4"
    >
      <div
        className={`relative w-full max-w-lg rounded-2xl border p-6 shadow-2xl sm:p-8 ${
          isNight
            ? 'border-[#7c4d3a] bg-[#211316] text-[#faf1e6]'
            : 'border-[#d6b788] bg-[#fdf8ef] text-[#2b1815]'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng thiệp chúc mừng"
          className={`absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b91c1c] ${
            isNight
              ? 'text-[#d4bfa9] hover:bg-[#331e22] hover:text-white'
              : 'text-[#6c4f41] hover:bg-[#efe0c6] hover:text-[#2b1815]'
          }`}
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <p
          className={`text-xs font-semibold tracking-wide ${
            isNight ? 'text-[#f0c25b]' : 'text-[#b91c1c]'
          }`}
        >
          24 · 11 · Ngày Văn Hóa Việt Nam
        </p>

        <h2
          id="greeting-card-title"
          className="mt-2 font-display text-2xl font-bold leading-snug sm:text-3xl"
          style={{ textWrap: 'balance' }}
        >
          Kính gửi {greeting.to}
        </h2>

        <div
          className={`my-5 h-px w-full ${isNight ? 'bg-[#4f2e2b]' : 'bg-[#e3cfa9]'}`}
          aria-hidden="true"
        />

        <blockquote className="font-display text-lg italic leading-relaxed sm:text-xl">
          “{greeting.message}”
        </blockquote>

        <p
          className={`mt-5 text-right text-sm font-semibold ${
            isNight ? 'text-[#f0c25b]' : 'text-[#7c1d1d]'
          }`}
        >
          — {greeting.from}
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onEnterSceneWithMusic}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#b91c1c] px-5 text-sm font-semibold text-[#fff9f0] transition-colors hover:bg-[#991b1b] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d99b26]"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            <span>
              {isMusicPlaying
                ? 'Chiêm ngưỡng không gian 3D'
                : 'Mở thiệp & Nghe nhạc'}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenComposer}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b91c1c] ${
              isNight
                ? 'border-[#6d4537] bg-[#2e1b1f] text-[#f5e5d0] hover:bg-[#3d252a]'
                : 'border-[#cfb182] bg-[#f5e8d3] text-[#3a221b] hover:bg-[#ebd7b8]'
            }`}
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            <span>Tạo thiệp riêng</span>
          </button>
        </div>
      </div>
    </div>
  );
}
