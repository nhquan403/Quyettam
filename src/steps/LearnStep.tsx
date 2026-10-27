import { ChevronLeft, ChevronRight, Mic } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRef, useState } from 'react';
import SpeakButtons from '../components/SpeakButtons';
import { useUi } from '../components/ui';
import { db } from '../lib/db';
import { listenOnce, matchScore, recognitionSupported } from '../lib/speech';
import { completeStep, setReadCount } from '../lib/study';
import type { Phrase, Unit } from '../lib/types';

const READ_TARGET = 3;

function PronunciationCheck({ target }: { target: string }) {
  const [state, setState] = useState<'idle' | 'listening'>('idle');
  const [result, setResult] = useState<{ heard: string; score: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!recognitionSupported) return null;
  const run = async () => {
    setError(null);
    setResult(null);
    setState('listening');
    try {
      const heard = await listenOnce();
      setResult({ heard, score: matchScore(target, heard) });
    } catch {
      setError('Không nghe được. Hãy cho phép micro và thử lại.');
    }
    setState('idle');
  };
  const verdict = !result ? null : result.score >= 0.8 ? ['Rất tốt!', 'text-success'] : result.score >= 0.5 ? ['Gần đúng, thử lại nhé', 'text-warn-ink'] : ['Chưa khớp, nghe mẫu rồi thử lại', 'text-danger'];
  return (
    <div className="mt-3">
      <button type="button" className="btn btn-ghost w-full" onClick={run} disabled={state === 'listening'}>
        <Mic size={18} aria-hidden /> {state === 'listening' ? 'Đang nghe… hãy nói' : 'Nói thử để kiểm tra'}
      </button>
      <div aria-live="polite">
        {result && (
          <p className="mt-2 text-sm">
            Máy nghe được: <span lang="en" className="font-semibold">“{result.heard || '…'}”</span>{' '}
            <span className={`font-semibold ${verdict![1]}`}>{verdict![0]}</span>
          </p>
        )}
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </div>
    </div>
  );
}

function Flashcard({ phrase, unitId, reads }: { phrase: Phrase; unitId: string; reads: number }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div>
      <div className="flip">
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className={`flip-inner grid w-full ${flipped ? 'is-flipped' : ''}`}
        >
          <div aria-hidden={flipped} className="flip-face card col-start-1 row-start-1 flex min-h-72 flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="text-7xl" aria-hidden>{phrase.emoji}</span>
            <p className="text-lg font-medium">{phrase.situation}</p>
            <p className="rounded-full bg-surface-2 px-3 py-1 text-muted">{phrase.vi}</p>
            <p className="text-sm text-muted">Đoán và nói to tiếng Anh, rồi chạm để lật</p>
          </div>
          <div aria-hidden={!flipped} className="flip-face flip-back card col-start-1 row-start-1 flex min-h-72 flex-col items-center justify-center gap-2 p-6 text-center">
            <span className="text-5xl" aria-hidden>{phrase.emoji}</span>
            <p className="text-2xl leading-snug font-bold text-primary" lang="en">{phrase.en}</p>
            {phrase.variants?.length ? <p className="text-muted" lang="en">cũng nói: {phrase.variants.join(' · ')}</p> : null}
            <p className="text-muted">{phrase.vi}</p>
            <span className="sr-only">Chạm để lật lại mặt trước</span>
          </div>
        </button>
      </div>
      {!flipped ? (
        <button className="btn btn-primary mt-4 w-full" onClick={() => setFlipped(true)}>Lật thẻ</button>
      ) : (
        <div className="mt-4 space-y-3">
          <SpeakButtons text={phrase.en} />
          <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
            <div className="flex-1">
              <p className="font-semibold">Đọc to {READ_TARGET} lần</p>
              <div className="mt-1 flex gap-1.5" aria-hidden>
                {Array.from({ length: READ_TARGET }, (_, i) => (
                  <span key={i} className={`h-2 w-8 rounded-full ${i < reads ? 'bg-success' : 'bg-line'}`} />
                ))}
              </div>
            </div>
            <button
              className={`btn ${reads >= READ_TARGET ? 'bg-success-soft text-success' : 'btn-soft'}`}
              onClick={() => setReadCount(unitId, phrase.id, reads >= READ_TARGET ? 0 : reads + 1)}
              aria-label={`Đã đọc ${reads} trên ${READ_TARGET} lần. Bấm sau mỗi lần đọc.`}
            >
              {reads >= READ_TARGET ? 'Xong ✓' : `Đã đọc ${reads}/${READ_TARGET}`}
            </button>
          </div>
          <PronunciationCheck target={phrase.en} />
        </div>
      )}
    </div>
  );
}

export default function LearnStep({ unit, onDone }: { unit: Unit; onDone: () => void }) {
  const [i, setI] = useState(0);
  const { toast } = useUi();
  const progress = useLiveQuery(() => db.progress.get(unit.id), [unit.id]);
  const touch = useRef<number | null>(null);
  const total = unit.phrases.length;
  const phrase = unit.phrases[Math.min(i, total - 1)];
  const reads = progress?.readCounts[phrase.id] ?? 0;
  const go = (d: number) => setI((x) => Math.max(0, Math.min(total - 1, x + d)));

  return (
    <section aria-label="Bước 1: Học">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold text-muted">Thẻ {i + 1} / {total}</p>
        <div className="flex gap-2">
          <button className="btn btn-ghost h-11 w-11 p-0" onClick={() => go(-1)} disabled={i === 0} aria-label="Thẻ trước">
            <ChevronLeft size={22} aria-hidden />
          </button>
          <button className="btn btn-ghost h-11 w-11 p-0" onClick={() => go(1)} disabled={i === total - 1} aria-label="Thẻ sau">
            <ChevronRight size={22} aria-hidden />
          </button>
        </div>
      </div>
      <div
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current === null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
      >
        <Flashcard key={phrase.id} phrase={phrase} unitId={unit.id} reads={reads} />
      </div>
      {i < total - 1 && (
        <button className="btn btn-ghost mt-3 w-full" onClick={() => go(1)}>
          Thẻ tiếp theo <ChevronRight size={18} aria-hidden />
        </button>
      )}

      <h2 className="mt-8 mb-3 text-lg font-bold">Câu ví dụ trong sách</h2>
      <ul className="space-y-3">
        {unit.sentences.map((s) => (
          <li key={s.en} className="card flex items-start gap-3 p-4">
            <div className="flex-1">
              <p className="font-semibold" lang="en">{s.en}</p>
              <p className="mt-1 text-sm text-muted">{s.vi}</p>
            </div>
            <SpeakButtons text={s.en} compact />
          </li>
        ))}
      </ul>

      <button
        className="btn btn-accent mt-6 w-full"
        onClick={async () => {
          await completeStep(unit, 'learn');
          toast('Đã thêm các cụm từ vào ôn tập');
          onDone();
        }}
      >
        {progress?.done.learn ? 'Sang bước Viết câu' : 'Hoàn thành bước Học'}
      </button>
    </section>
  );
}
