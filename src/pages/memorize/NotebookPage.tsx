import { ChevronDown, Search, Star } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import LevelDots from '../../components/LevelDots';
import PageHeader from '../../components/PageHeader';
import SpeakButtons from '../../components/SpeakButtons';
import { db } from '../../lib/db';
import { emptyMastery, MAX_LEVEL, toggleStar } from '../../lib/mastery';
import { useUnits } from '../../lib/units';

type Filter = 'all' | 'todo' | 'done' | 'star';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'todo', label: 'Chưa thuộc' },
  { id: 'done', label: 'Đã thuộc' },
  { id: 'star', label: 'Đánh dấu ⭐' },
];

/** Lowercase without Vietnamese diacritics, so "bao thuc" finds "báo thức". */
export const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();

export default function NotebookPage() {
  const units = useUnits();
  const mastery = useLiveQuery(() => db.mastery.toArray(), []);
  const sentences = useLiveQuery(() => db.sentences.toArray(), []);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<string | null>(null);

  const rows = useMemo(() => {
    const byKey = new Map((mastery ?? []).map((m) => [m.key, m]));
    return (units ?? []).flatMap((unit) =>
      unit.phrases.map((phrase) => {
        const key = `${unit.id}:${phrase.id}`;
        return { key, unit, phrase, m: byKey.get(key) ?? emptyMastery(unit.id, phrase.id) };
      }),
    );
  }, [units, mastery]);

  const q = fold(query.trim());
  const shown = rows.filter((r) => {
    if (filter === 'todo' && r.m.level >= MAX_LEVEL) return false;
    if (filter === 'done' && r.m.level < MAX_LEVEL) return false;
    if (filter === 'star' && !r.m.starred) return false;
    if (!q) return true;
    return [r.phrase.en, ...(r.phrase.variants ?? []), r.phrase.vi].some((t) => fold(t).includes(q));
  });

  return (
    <>
      <PageHeader title="Sổ tay từ vựng" subtitle={`${rows.length} cụm từ`} back="/hoc-thuoc" />
      <div className="relative mb-3">
        <Search size={20} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" aria-hidden />
        <label htmlFor="search" className="sr-only">Tìm cụm từ</label>
        <input id="search" type="search" className="input pl-12" placeholder="Tìm tiếng Anh hoặc tiếng Việt" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Lọc">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)} className={`chip ${filter === f.id ? 'border-primary bg-primary text-primary-ink' : ''}`}>
            {f.label}
          </button>
        ))}
      </div>
      <p className="mb-2 text-sm text-muted" aria-live="polite">{shown.length} kết quả</p>
      <ul className="space-y-2">
        {shown.map(({ key, unit, phrase, m }) => {
          const expanded = open === key;
          const book = unit.sentences.filter((s) => s.phraseIds.includes(phrase.id));
          const mine = (sentences ?? []).filter((s) => s.unitId === unit.id && s.phraseId === phrase.id);
          return (
            <li key={key} className="card overflow-hidden">
              <div className="flex items-center gap-1 p-2 pl-3">
                <button type="button" className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={expanded} aria-controls={`nb-${key}`} onClick={() => setOpen(expanded ? null : key)}>
                  <span className="text-2xl" aria-hidden>{phrase.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold" lang="en">{phrase.en}</span>
                    <span className="block text-sm text-muted">{phrase.vi}</span>
                    <span className="mt-1 block"><LevelDots level={m.level} /></span>
                  </span>
                  <ChevronDown size={18} className={`shrink-0 text-muted transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden />
                </button>
                <SpeakButtons text={phrase.en} compact />
                <button
                  type="button"
                  className={`btn h-11 w-11 p-0 ${m.starred ? 'text-accent' : 'text-muted'}`}
                  aria-pressed={!!m.starred}
                  aria-label={m.starred ? `Bỏ đánh dấu ${phrase.en}` : `Đánh dấu ${phrase.en}`}
                  onClick={() => toggleStar(unit.id, phrase.id)}
                >
                  <Star size={20} fill={m.starred ? 'currentColor' : 'none'} aria-hidden />
                </button>
              </div>
              {expanded && (
                <div id={`nb-${key}`} className="space-y-3 border-t border-line p-4 text-sm">
                  {phrase.variants?.length ? <p className="text-muted">Cũng nói: <span lang="en">{phrase.variants.join(' · ')}</span></p> : null}
                  <div>
                    <p className="mb-1 font-semibold">Câu trong sách</p>
                    {book.length ? (
                      <ul className="space-y-1.5">
                        {book.map((s) => (
                          <li key={s.en}>
                            <span lang="en" className="font-medium">{s.en}</span>
                            <span className="block text-muted">{s.vi}</span>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-muted">Không có câu ví dụ.</p>}
                  </div>
                  <div>
                    <p className="mb-1 font-semibold">Câu bạn viết</p>
                    {mine.length ? (
                      <ul className="list-disc space-y-1 pl-5">{mine.map((s) => <li key={s.id} lang="en">{s.text}</li>)}</ul>
                    ) : <p className="text-muted">Chưa có. Viết câu ở bước 2 của bài “{unit.title}”.</p>}
                  </div>
                  <p className="text-muted">Đúng {m.correct} lần · Sai {m.wrong} lần</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
