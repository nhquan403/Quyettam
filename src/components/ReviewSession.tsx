import { CheckCircle2, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Grade } from '../lib/srs';
import { gradeCard, reviewQueue } from '../lib/study';
import type { Card, Phrase, Unit } from '../lib/types';
import SpeakButtons from './SpeakButtons';

const GRADES: { grade: Grade; label: string; hint: string; cls: string }[] = [
  { grade: 'again', label: 'Quên', hint: 'ôn lại ngay', cls: 'bg-danger-soft text-danger' },
  { grade: 'hard', label: 'Khó', hint: 'nhớ lơ mơ', cls: 'bg-warn-soft text-warn-ink' },
  { grade: 'good', label: 'Nhớ', hint: 'nói được', cls: 'bg-primary-soft text-primary-strong' },
  { grade: 'easy', label: 'Dễ', hint: 'nói ngay', cls: 'bg-success-soft text-success' },
];

export default function ReviewSession({ units, unitId, onFinish, emptyText }: { units: Unit[]; unitId?: string; onFinish?: () => void; emptyText: string }) {
  const [queue, setQueue] = useState<Card[] | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState({ done: 0, again: 0 });
  const [round, setRound] = useState(0);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const cardRef = useRef<HTMLButtonElement>(null);

  const lookup = useMemo(() => {
    const m = new Map<string, Phrase>();
    for (const u of units) for (const p of u.phrases) m.set(`${u.id}:${p.id}`, p);
    return m;
  }, [units]);

  // Snapshot the queue when a session starts so grading does not reshuffle it mid-way.
  useEffect(() => {
    let alive = true;
    reviewQueue(units, { unitId }).then((q) => alive && setQueue(q));
    return () => {
      alive = false;
    };
  }, [unitId, round]);

  if (!queue) return <div className="card h-80 animate-pulse" aria-busy="true" />;

  const finished = index >= queue.length;

  if (queue.length === 0 || finished) {
    const didSome = stats.done > 0;
    return (
      <div className="card flex flex-col items-center gap-3 p-8 text-center">
        <CheckCircle2 size={56} className="text-success" aria-hidden />
        <h2 className="text-xl font-bold">{didSome ? 'Xong phiên ôn tập!' : 'Không có thẻ nào cần ôn'}</h2>
        <p className="text-muted">
          {didSome ? `Bạn đã ôn ${stats.done} lượt, quên ${stats.again} lần. Thẻ quên đã được ôn lại ngay trong phiên.` : emptyText}
        </p>
        {didSome && (
          <button
            className="btn btn-ghost"
            onClick={() => {
              setIndex(0);
              setStats({ done: 0, again: 0 });
              setRevealed(false);
              setQueue(null);
              setRound((r) => r + 1);
            }}
          >
            <RotateCcw size={18} aria-hidden /> Kiểm tra thẻ còn hạn
          </button>
        )}
      </div>
    );
  }

  const card = queue[index];
  const phrase = lookup.get(card.key);
  if (!phrase) {
    // The phrase was removed by re-importing its unit during this session.
    return (
      <div className="card flex flex-col items-center gap-3 p-8 text-center">
        <p className="text-muted">Cụm từ này không còn trong bài.</p>
        <button className="btn btn-primary" onClick={() => setIndex((i) => i + 1)}>Bỏ qua</button>
      </div>
    );
  }

  const grade = async (g: Grade) => {
    if (busy.current) return; // ignore double taps while the grade is saving
    busy.current = true;
    setSaving(true);
    try {
      const next = await gradeCard(card, g);
      if (g === 'again') setQueue((q) => [...q!, next]);
      setStats((s) => ({ done: s.done + 1, again: s.again + (g === 'again' ? 1 : 0) }));
      setRevealed(false);
      const last = index + 1 >= queue.length && g !== 'again';
      setIndex((i) => i + 1);
      if (last) onFinish?.();
      requestAnimationFrame(() => cardRef.current?.focus());
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm font-semibold text-muted">
        <span>Thẻ {index + 1} / {queue.length}</span>
        <span>{stats.done} đã ôn</span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${(index / queue.length) * 100}%` }} />
      </div>
      <button
        ref={cardRef}
        type="button"
        onClick={() => setRevealed(true)}
        className="card flex min-h-80 w-full flex-col items-center justify-center gap-3 p-6 text-center"
      >
        <span className="text-6xl" aria-hidden>{phrase.emoji}</span>
        <p className="text-lg font-medium">{phrase.situation}</p>
        {revealed ? (
          <div className="mt-2 w-full border-t border-line pt-4">
            <p className="text-2xl font-bold text-primary" lang="en">{phrase.en}</p>
            {phrase.variants?.length ? <p className="mt-1 text-muted" lang="en">cũng nói: {phrase.variants.join(' · ')}</p> : null}
            <p className="mt-1 text-muted">{phrase.vi}</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">Nói to câu tiếng Anh, rồi chạm để lật thẻ</p>
        )}
      </button>
      {revealed ? (
        <>
          <div className="mt-4"><SpeakButtons text={phrase.en} /></div>
          <p className="mt-5 mb-2 text-center text-sm font-semibold text-muted">Bạn nhớ cụm từ này thế nào?</p>
          <div className="grid grid-cols-4 gap-2">
            {GRADES.map((g) => (
              <button key={g.grade} className={`btn flex-col gap-0 px-1 py-2 ${g.cls}`} disabled={saving} onClick={() => grade(g.grade)}>
                <span>{g.label}</span>
                <span className="text-[11px] font-medium opacity-80">{g.hint}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <button className="btn btn-primary mt-4 w-full" onClick={() => setRevealed(true)}>Lật thẻ</button>
      )}
    </div>
  );
}
