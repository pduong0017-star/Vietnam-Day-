import { useState } from 'react';
import { Check, Copy, ExternalLink, Moon, Sun, X } from 'lucide-react';
import {
  GREETING_PRESETS,
  type GreetingConfig,
  type SceneMood,
  buildShareableUrl,
  validateGreetingInput,
} from '../utils/greetingLink';

interface ShareCardModalProps {
  initialGreeting: GreetingConfig;
  mood: SceneMood;
  onClose: () => void;
  onApplyGreeting: (next: GreetingConfig, shareUrl: string) => void;
}

export function ShareCardModal({
  initialGreeting,
  mood,
  onClose,
  onApplyGreeting,
}: ShareCardModalProps) {
  const [to, setTo] = useState(
    initialGreeting.isPersonalized ? initialGreeting.to : '',
  );
  const [from, setFrom] = useState(
    initialGreeting.isPersonalized ? initialGreeting.from : '',
  );
  const [message, setMessage] = useState(initialGreeting.message);
  const [selectedMood, setSelectedMood] = useState<SceneMood>(mood);
  const [errors, setErrors] = useState<{
    to?: string;
    from?: string;
    message?: string;
  }>({});
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isNight = mood === 'night';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateGreetingInput({ to, from, message });
    if (!validation.valid) {
      setErrors(validation.errors);
      setGeneratedUrl(null);
      return;
    }

    setErrors({});
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const url = buildShareableUrl(baseUrl, {
      to,
      from,
      message,
      mood: selectedMood,
    });
    setGeneratedUrl(url);
    setCopied(false);

    onApplyGreeting(
      {
        to: to.trim(),
        from: from.trim(),
        message: message.trim(),
        mood: selectedMood,
        isPersonalized: true,
      },
      url,
    );
  };

  const handleCopy = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
    } catch {
      // Fallback copy via temporary input for restricted iframe contexts
      const input = document.createElement('input');
      input.value = generatedUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
    }
  };

  const inputClass = isNight
    ? 'w-full rounded-lg border border-[#5e3731] bg-[#160d0f] px-3.5 py-2.5 text-sm text-[#faf1e6] placeholder:text-[#9c8276] focus:border-[#e5b84b] focus:outline-none'
    : 'w-full rounded-lg border border-[#d6bc93] bg-white px-3.5 py-2.5 text-sm text-[#2b1815] placeholder:text-[#9a7f6c] focus:border-[#b91c1c] focus:outline-none';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#180d0b]/65 p-4"
    >
      <div
        className={`relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border p-6 shadow-2xl sm:p-7 ${
          isNight
            ? 'border-[#744537] bg-[#211316] text-[#faf1e6]'
            : 'border-[#d6b788] bg-[#fdf8ef] text-[#2b1815]'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng hộp tạo link chia sẻ"
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
          Thiệp điện tử · 24-11
        </p>
        <h2
          id="share-modal-title"
          className="mt-1 font-display text-2xl font-bold leading-snug"
          style={{ textWrap: 'balance' }}
        >
          Tạo thiệp &amp; đường dẫn chúc mừng 24-11
        </h2>
        <p
          className={`mt-1.5 text-sm leading-relaxed ${
            isNight ? 'text-[#d1bba5]' : 'text-[#63483b]'
          }`}
        >
          Điền lời chúc của bạn để tạo link gửi tặng bạn bè, thầy cô hoặc đăng lên mạng xã hội
          cùng không gian 3D và nhạc Thịnh Vượng Việt Nam Sáng Ngời.
        </p>

        {/* Quick-fill wish presets */}
        <div className="mt-4">
          <span
            className={`block text-xs font-medium ${
              isNight ? 'text-[#c9b09a]' : 'text-[#6c4f41]'
            }`}
          >
            Gợi ý lời chúc nhanh
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {GREETING_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setTo(preset.to);
                  setMessage(preset.message);
                  setErrors({});
                }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  isNight
                    ? 'border-[#5a352f] bg-[#2c1a1e] text-[#f5e3cd] hover:bg-[#3d2429]'
                    : 'border-[#d6bc93] bg-[#f5e9d4] text-[#45281f] hover:bg-[#ebd9ba]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="share-to-input" className="mb-1.5 block text-xs font-semibold">
                Người nhận
              </label>
              <input
                id="share-to-input"
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Ví dụ: Quý thầy cô & Bạn bè"
                maxLength={60}
                className={inputClass}
              />
              {errors.to && (
                <p role="alert" className="mt-1 text-xs font-medium text-[#dc2626]">
                  {errors.to}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="share-from-input" className="mb-1.5 block text-xs font-semibold">
                Người gửi
              </label>
              <input
                id="share-from-input"
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="Ví dụ: Minh Dương"
                maxLength={60}
                className={inputClass}
              />
              {errors.from && (
                <p role="alert" className="mt-1 text-xs font-medium text-[#dc2626]">
                  {errors.from}
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="share-message-input" className="text-xs font-semibold">
                Lời chúc Ngày Văn Hóa Việt Nam 24-11
              </label>
              <span
                className={`text-xs tabular-nums ${
                  isNight ? 'text-[#bca490]' : 'text-[#7c5d4c]'
                }`}
              >
                {message.length}/260
              </span>
            </div>
            <textarea
              id="share-message-input"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={260}
              placeholder="Viết lời chúc tự hào văn hóa Việt Nam..."
              className={inputClass}
            />
            {errors.message && (
              <p role="alert" className="mt-1 text-xs font-medium text-[#dc2626]">
                {errors.message}
              </p>
            )}
          </div>

          {/* Mood selector for recipients */}
          <div>
            <span className="mb-1.5 block text-xs font-semibold">
              Bối cảnh ánh sáng khi mở link
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedMood('dawn')}
                aria-pressed={selectedMood === 'dawn'}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border text-xs font-semibold transition-colors ${
                  selectedMood === 'dawn'
                    ? 'border-[#b91c1c] bg-[#b91c1c] text-white'
                    : isNight
                      ? 'border-[#5a352f] bg-[#2a181c] text-[#e6d3be]'
                      : 'border-[#d6bc93] bg-[#f5e9d4] text-[#45281f]'
                }`}
              >
                <Sun className="h-4 w-4" aria-hidden="true" />
                <span>Bình Minh Di Sản</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMood('night')}
                aria-pressed={selectedMood === 'night'}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border text-xs font-semibold transition-colors ${
                  selectedMood === 'night'
                    ? 'border-[#b91c1c] bg-[#b91c1c] text-white'
                    : isNight
                      ? 'border-[#5a352f] bg-[#2a181c] text-[#e6d3be]'
                      : 'border-[#d6bc93] bg-[#f5e9d4] text-[#45281f]'
                }`}
              >
                <Moon className="h-4 w-4" aria-hidden="true" />
                <span>Đêm Hoa Đăng</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#b91c1c] px-5 text-sm font-semibold text-[#fff9f0] transition-colors hover:bg-[#991b1b] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d99b26]"
            >
              <span>Áp dụng & Tạo link chia sẻ</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex h-11 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors whitespace-nowrap ${
                isNight
                  ? 'border-[#5e3731] text-[#e6d3be] hover:bg-[#311d21]'
                  : 'border-[#d6bc93] text-[#4e3328] hover:bg-[#efe0c6]'
              }`}
            >
              Đóng
            </button>
          </div>
        </form>

        {/* Ready-to-share generated URL panel */}
        {generatedUrl && (
          <div
            data-testid="generated-share-url-box"
            className={`mt-5 rounded-xl border p-4 ${
              isNight
                ? 'border-[#6d4537] bg-[#180d10]'
                : 'border-[#d4b684] bg-[#f7ecda]'
            }`}
          >
            <p
              className={`text-xs font-semibold ${
                isNight ? 'text-[#6ee7b7]' : 'text-[#14594b]'
              }`}
            >
              Đã tạo đường dẫn thiệp 24-11 thành công
            </p>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                readOnly
                aria-label="Đường dẫn thiệp chia sẻ"
                value={generatedUrl}
                className={`min-w-0 flex-1 rounded-lg border px-3 py-2 text-xs tabular-nums ${
                  isNight
                    ? 'border-[#5a352f] bg-[#241418] text-[#f5e5d0]'
                    : 'border-[#d6bc93] bg-white text-[#2b1815]'
                }`}
              />
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#1a6657] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#134e43] whitespace-nowrap shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Sao chép link</span>
                  </>
                )}
              </button>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs">
              <span className={isNight ? 'text-[#c9b09a]' : 'text-[#6c4f41]'}>
                Đường dẫn trên thanh địa chỉ cũng đã được cập nhật.
              </span>
              <a
                href={generatedUrl}
                className={`inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline whitespace-nowrap ${
                  isNight ? 'text-[#f0c25b]' : 'text-[#b91c1c]'
                }`}
              >
                <span>Mở thử link</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
