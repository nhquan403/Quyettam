import { SLOW_RATE } from './settings';

export const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

let cachedVoices: SpeechSynthesisVoice[] = [];

export function englishVoices(): SpeechSynthesisVoice[] {
  if (!ttsSupported) return [];
  cachedVoices = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en'));
  return cachedVoices;
}

export function onVoicesChanged(cb: () => void): () => void {
  if (!ttsSupported) return () => {};
  speechSynthesis.addEventListener('voiceschanged', cb);
  return () => speechSynthesis.removeEventListener('voiceschanged', cb);
}

export function speak(text: string, opts: { voiceURI?: string; rate?: number; slow?: boolean } = {}) {
  if (!ttsSupported) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = opts.slow ? SLOW_RATE : opts.rate ?? 1;
  const voices = cachedVoices.length ? cachedVoices : englishVoices();
  const voice = voices.find((v) => v.voiceURI === opts.voiceURI) ?? voices.find((v) => v.lang === 'en-US');
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}

type RecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};

function recognitionCtor(): RecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export const recognitionSupported = !!recognitionCtor();

/** Listens once and resolves with what the browser heard (empty string when nothing was recognised). */
export function listenOnce(): Promise<string> {
  const Ctor = recognitionCtor();
  if (!Ctor) return Promise.reject(new Error('unsupported'));
  return new Promise((resolve, reject) => {
    const r = new Ctor();
    r.lang = 'en-US';
    r.interimResults = false;
    r.maxAlternatives = 1;
    let heard = '';
    r.onresult = (e) => {
      heard = e.results[0]?.[0]?.transcript ?? '';
    };
    r.onerror = (e) => (e.error === 'no-speech' ? resolve('') : reject(new Error(e.error)));
    r.onend = () => resolve(heard);
    r.start();
  });
}

const normalize = (s: string) =>
  s.toLowerCase().replace(/one's/g, '').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

/** Share of the target's words that the learner said, 0..1. */
export function matchScore(target: string, heard: string): number {
  const want = normalize(target);
  const got = new Set(normalize(heard));
  if (!want.length) return 0;
  return want.filter((w) => got.has(w)).length / want.length;
}
