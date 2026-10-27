import { Flame, RotateCcw, Trophy } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { recordAnswer } from '../lib/mastery';
import { buildQuestion, plainPhrase, type Question } from '../lib/questions';
import { ttsSupported } from '../lib/speech';
import type { Unit } from '../lib/types';
import { Feedback, QuestionView, type Response } from './exercises';
import LevelDots from './LevelDots';

type Summary = { answered: number; correct: number; levels: Map<string, { from: number; to: number; en: string }>; wrong: Map<string, string> };

export default function PracticeSession({ initial, units, onRetry }: { initial: Question[]; units: Unit[]; onRetry: (keys: string[]) => void }) {
  const [queue, setQueue] = useState(initial);
  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState<Response | null>(null);
  const [combo, setCombo] = useState(0);
  const [summary, setSummary] = useState<Summary>({ answered: 0, correct: 0, levels: new Map(), wrong: new Map() });
  const busy = useRef(false);
  const retried = useRef(new Set<string>());

  if (index >= queue.length) {
    const pct = summary.answered ? Math.round((summary.correct / summary.answered) * 100) : 0;
    const up = [...summary.levels.values()].filter((l) => l.to > l.from);
    return (
      <div className="space-y-4">
        <div className="card flex flex-col items-center gap-2 p-6 text-center">
          <Trophy size={48} className="text-accent" aria-hidden />
          <h2 className="text-xl font-bold">Xong phiên luyện!</h2>
          <p className="text-4xl font-bold text-primary tabular-nums">{pct}%</p>
          <p className="text-muted">Đúng {summary.correct} / {summary.answered} câu trả lời</p>
        </div>
        {up.length > 0 && (
          <section className="card p-5">
            <h3 className="mb-3 font-bold">Lên bậc ({up.length})</h3>
            <ul className="space-y-2">
              {up.map((l) => (
                <li key={l.en} className="flex items-center justify-between gap-2">
                  <span lang="en" className="font-medium">{l.en}</span>
                  <LevelDots level={l.to} />
                </li>
              ))}
            </ul>
          </section>
        )}
        {summary.wrong.size > 0 && (
          <section className="card p-5">
            <h3 className="mb-3 font-bold">Câu sai ({summary.wrong.size})</h3>
            <ul className="mb-4 space-y-1">
              {[...summary.wrong.values()].map((en) => <li key={en} lang="en" className="font-medium text-danger">{en}</li>)}
            </ul>
            <button className="btn btn-accent w-full" onClick={() => onRetry([...summary.wrong.keys()])}>
              <RotateCcw size={18} aria-hidden /> Luyện lại câu sai
            </button>
          </section>
        )}
        <Link to="/hoc-thuoc" className="btn btn-ghost w-full">Về trang Học thuộc</Link>
      </div>
    );
  }

  const q = queue[index];

  const respond = async (r: Response) => {
    if (busy.current || response) return; // ignore double taps while saving
    busy.current = true;
    try {
      const { item } = q;
      const next = await recordAnswer(item.unit.id, item.phrase.id, r.check.result);
      setResponse(r);
      setCombo((c) => (r.check.result === 'correct' ? c + 1 : 0));
      setSummary((s) => {
        const levels = new Map(s.levels);
        const prev = levels.get(item.key);
        levels.set(item.key, { from: prev?.from ?? item.mastery.level, to: next.level, en: plainPhrase(item.phrase.en) });
        const wrong = new Map(s.wrong);
        if (r.check.result === 'wrong') wrong.set(item.key, plainPhrase(item.phrase.en));
        return { answered: s.answered + 1, correct: s.correct + (r.check.result === 'correct' ? 1 : 0), levels, wrong };
      });
      // A wrong answer comes back once more at the end of the session, as the same kind of exercise.
      if (r.check.result === 'wrong' && !retried.current.has(item.key)) {
        retried.current.add(item.key);
        setQueue((list) => [...list, buildQuestion({ ...item, mastery: next }, q.type, units, Math.random, ttsSupported)]);
      }
    } finally {
      busy.current = false;
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm font-semibold text-muted">
        <span>Câu {index + 1} / {queue.length}</span>
        <span className={`flex items-center gap-1 ${combo >= 2 ? 'text-accent' : ''}`} aria-live="polite">
          <Flame size={16} aria-hidden /> Chuỗi đúng: {combo}
        </span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${(index / queue.length) * 100}%` }} />
      </div>
      <QuestionView key={`${index}-${q.item.key}`} q={q} response={response} onRespond={respond} onCannotHear={() => setIndex((i) => i + 1)} />
      {response && (
        <Feedback
          key={`fb-${index}`}
          check={response.check}
          speakText={q.item.phrase.en}
          onContinue={() => {
            setResponse(null);
            setIndex((i) => i + 1);
          }}
        />
      )}
    </div>
  );
}
