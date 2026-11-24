import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import { OPENING_SCROLL_NARRATION_TEXT } from './src/utils/scrollContent.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const TTS_MODEL = 'gemini-3.8-flash-lite-tts';
const TTS_VOICE = 'Kore';
const TTS_STYLE =
  'Read aloud in fluent, warm, dignified, emotionally resonant Vietnamese like a refined cultural documentary narrator opening a national heritage ceremony. Slow poetic pacing, gentle pauses between stanzas, clear northern Vietnamese articulation, heartfelt pride and serenity.';

const wavCache = new Map<string, Buffer>();
const inFlightRequests = new Map<string, Promise<Buffer>>();

function getCacheKey(text: string): string {
  return crypto
    .createHash('sha256')
    .update(`${TTS_MODEL}|${TTS_VOICE}|${TTS_STYLE}|${text}`)
    .digest('hex');
}

async function generateNarrationWav(text: string): Promise<Buffer> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY chưa được cấu hình trên máy chủ.');
    (err as Error & { statusCode?: number }).statusCode = 503;
    throw err;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      apiVersion: 'v1beta',
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const response = await ai.models.generateContent({
    model: TTS_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text,
            speechMetadata: {
              style: TTS_STYLE,
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: TTS_VOICE,
          },
        },
      },
    },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const audioPart = parts.find(
    (part) => typeof part.inlineData?.data === 'string' && part.inlineData.data.length > 0,
  );
  const base64Audio = audioPart?.inlineData?.data;

  if (!base64Audio) {
    const err = new Error('Không nhận được dữ liệu âm thanh thuyết minh từ dịch vụ.');
    (err as Error & { statusCode?: number }).statusCode = 502;
    throw err;
  }

  // Unary Gemini 3.8 TTS returns a complete 24kHz mono 16-bit WAV file directly
  return Buffer.from(base64Audio, 'base64');
}

async function createApp() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/api/tts/scroll-narration', async (req: Request, res: Response) => {
    try {
      const customText =
        typeof req.body?.text === 'string' && req.body.text.trim().length > 0
          ? req.body.text.trim().slice(0, 1200)
          : OPENING_SCROLL_NARRATION_TEXT;

      const cacheKey = getCacheKey(customText);
      const cached = wavCache.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('X-TTS-Cache', 'HIT');
        res.send(cached);
        return;
      }

      let pending = inFlightRequests.get(cacheKey);
      if (!pending) {
        pending = generateNarrationWav(customText)
          .then((buf) => {
            if (wavCache.size > 24) {
              const oldestKey = wavCache.keys().next().value;
              if (oldestKey) wavCache.delete(oldestKey);
            }
            wavCache.set(cacheKey, buf);
            return buf;
          })
          .finally(() => {
            inFlightRequests.delete(cacheKey);
          });
        inFlightRequests.set(cacheKey, pending);
      }

      const wavBuffer = await pending;
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('X-TTS-Cache', 'MISS');
      res.send(wavBuffer);
    } catch (error) {
      const status =
        typeof (error as { statusCode?: unknown })?.statusCode === 'number'
          ? (error as { statusCode: number }).statusCode
          : 502;
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Không thể khởi tạo giọng đọc chiếu thư vào lúc này.';
      console.error('[TTS /api/tts/scroll-narration]', message);
      res.status(status).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server listening on http://${HOST}:${PORT}`);

    // Non-blocking background pre-warm so the expressive Vietnamese scroll voiceover plays with 0ms latency
    if (process.env.GEMINI_API_KEY?.trim()) {
      setTimeout(() => {
        const key = getCacheKey(OPENING_SCROLL_NARRATION_TEXT);
        if (!wavCache.has(key) && !inFlightRequests.has(key)) {
          const p = generateNarrationWav(OPENING_SCROLL_NARRATION_TEXT)
            .then((buf) => {
              wavCache.set(key, buf);
              console.log(`[TTS] Pre-warmed opening scroll narration (${buf.length} bytes)`);
              return buf;
            })
            .finally(() => {
              inFlightRequests.delete(key);
            });
          inFlightRequests.set(key, p);
          p.catch((err) => {
            console.warn('[TTS] Pre-warm skipped:', err instanceof Error ? err.message : err);
          });
        }
      }, 600);
    }
  });
}

createApp().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
