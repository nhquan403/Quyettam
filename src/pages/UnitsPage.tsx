import { Check, Plus } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { STEPS } from '../components/Stepper';
import { db } from '../lib/db';
import { MAX_LEVEL } from '../lib/mastery';
import { useUnits } from '../lib/units';
import type { Unit } from '../lib/types';

export default function UnitsPage() {
  const units = useUnits();
  const stats = useLiveQuery(async () => {
    const [progress, mastery] = await Promise.all([db.progress.toArray(), db.mastery.toArray()]);
    return { progress: new Map(progress.map((p) => [p.unitId, p])), mastery };
  }, []);

  const chapters = new Map<number, Unit[]>();
  for (const u of units ?? []) chapters.set(u.chapter, [...(chapters.get(u.chapter) ?? []), u]);

  return (
    <>
      <PageHeader
        title="Bài học"
        subtitle={`${units?.length ?? 0} bài · ${units?.reduce((n, u) => n + u.phrases.length, 0) ?? 0} cụm từ`}
        action={
          <Link to="/nhap-bai" className="btn btn-soft h-11 px-3" aria-label="Nhập bài mới">
            <Plus size={20} aria-hidden /> Nhập bài
          </Link>
        }
      />
      {[...chapters.entries()].map(([chapter, list]) => (
        <section key={chapter} className="mb-6">
          <h2 className="mb-3 text-sm font-bold tracking-wide text-muted uppercase">
            Chương {chapter} · {list[0].chapterTitle}
          </h2>
          <ul className="space-y-3">
            {list.map((u) => {
              const p = stats?.progress.get(u.id);
              const ids = new Set(u.phrases.map((p) => p.id));
              const memorised = stats?.mastery.filter((m) => m.unitId === u.id && ids.has(m.phraseId) && m.level >= MAX_LEVEL).length ?? 0;
              const pct = Math.round((memorised / u.phrases.length) * 100);
              return (
                <li key={u.id}>
                  <Link to={`/bai-hoc/${u.id}`} className="card block p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted">Bài {String(u.unit).padStart(2, '0')} · {u.phrases.length} cụm từ</p>
                        <p className="text-lg font-bold">{u.title}</p>
                      </div>
                      <p className="text-right">
                        <span className="block text-xl font-bold text-success tabular-nums">{pct}%</span>
                        <span className="block text-xs text-muted">đã thuộc</span>
                      </p>
                    </div>
                    <ol className="mt-3 flex gap-2" aria-label="Tiến độ các bước">
                      {STEPS.map((s) => {
                        const done = !!p?.done[s.id];
                        return (
                          <li
                            key={s.id}
                            className={`flex flex-1 items-center justify-center gap-1 rounded-full py-1 text-xs font-semibold ${done ? 'bg-success-soft text-success' : 'bg-surface-2 text-muted'}`}
                          >
                            {done && <Check size={12} strokeWidth={3} aria-hidden />}
                            {s.label}
                            <span className="sr-only">{done ? ' (đã xong)' : ' (chưa xong)'}</span>
                          </li>
                        );
                      })}
                    </ol>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}
