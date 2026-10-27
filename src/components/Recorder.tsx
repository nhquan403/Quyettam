import { Mic, Square } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

function pickMime(): string {
  const options = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  return options.find((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) ?? '';
}

export const recordingSupported = typeof window !== 'undefined' && 'MediaRecorder' in window && !!navigator.mediaDevices?.getUserMedia;

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function Recorder({ maxSeconds, onSave }: { maxSeconds: number; onSave: (blob: Blob, mime: string, seconds: number) => Promise<void> }) {
  const [state, setState] = useState<'idle' | 'starting' | 'recording' | 'saving'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const startedAt = useRef(0);
  const mounted = useRef(true);

  const cleanup = () => {
    window.clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // Leaving the page mid-recording still saves what was recorded (onstop runs onSave).
      if (recRef.current?.state === 'recording') recRef.current.stop();
      else cleanup();
    };
  }, []);

  const stop = () => {
    if (recRef.current?.state === 'recording') recRef.current.stop();
  };

  const start = async () => {
    if (state !== 'idle') return;
    setError(null);
    setState('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      const mime = pickMime();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = async () => {
        const seconds = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
        cleanup();
        setState('saving');
        const type = rec.mimeType || mime || 'audio/webm';
        try {
          await onSave(new Blob(chunks, { type }), type, Math.min(seconds, maxSeconds));
        } catch {
          setError('Không lưu được bản ghi. Bộ nhớ máy có thể đã đầy.');
        }
        setState('idle');
        setElapsed(0);
      };
      recRef.current = rec;
      startedAt.current = Date.now();
      rec.start();
      setState('recording');
      timerRef.current = window.setInterval(() => {
        const s = Math.floor((Date.now() - startedAt.current) / 1000);
        setElapsed(s);
        if (s >= maxSeconds) rec.stop();
      }, 250);
    } catch (e) {
      cleanup();
      setState('idle');
      const name = (e as DOMException).name;
      setError(
        name === 'NotAllowedError'
          ? 'Bạn chưa cho phép dùng micro. Hãy bật quyền micro cho trang này trong cài đặt trình duyệt.'
          : 'Không mở được micro trên thiết bị này.',
      );
    }
  };

  if (!recordingSupported) {
    return <p className="rounded-2xl bg-warn-soft p-4 text-warn-ink">Trình duyệt này không hỗ trợ ghi âm. Hãy thử Chrome hoặc Safari bản mới.</p>;
  }

  const remaining = Math.max(0, maxSeconds - elapsed);
  const pct = Math.min(100, (elapsed / maxSeconds) * 100);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex h-36 w-36 items-center justify-center">
        <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r="45" fill="none" strokeWidth="6" className="stroke-surface-2" />
          <circle
            cx="50" cy="50" r="45" fill="none" strokeWidth="6" strokeLinecap="round"
            className="stroke-accent transition-[stroke-dashoffset] duration-300"
            strokeDasharray={2 * Math.PI * 45}
            strokeDashoffset={2 * Math.PI * 45 * (1 - pct / 100)}
          />
        </svg>
        <button
          type="button"
          onClick={state === 'recording' ? stop : start}
          disabled={state === 'saving' || state === 'starting'}
          aria-label={state === 'recording' ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
          className={`btn h-24 w-24 rounded-full p-0 shadow-lg ${state === 'recording' ? 'bg-danger text-white dark:text-[#1f0a0a]' : 'btn-accent'}`}
        >
          {state === 'recording' ? <Square size={30} fill="currentColor" aria-hidden /> : <Mic size={36} aria-hidden />}
        </button>
      </div>
      <p className="text-center font-semibold tabular-nums" aria-live="polite">
        {state === 'recording' ? `Đang ghi… còn ${fmt(remaining)}` : state === 'saving' ? 'Đang lưu…' : state === 'starting' ? 'Đang mở micro…' : `Bấm để ghi âm (tối đa ${fmt(maxSeconds)})`}
      </p>
      {error && <p role="alert" className="rounded-2xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}
    </div>
  );
}
