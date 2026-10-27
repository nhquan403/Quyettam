import { BookMarked, ChevronRight, Puzzle, Target, TriangleAlert, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { isHard, MAX_LEVEL } from '../../lib/mastery';
import { useSettings } from '../../lib/settings';
import { useLearned } from '../../lib/use-learned';

const LEVEL_NAMES = ['Mới', 'Nhận ra', 'Nhớ lơ mơ', 'Ghép được', 'Gõ được', 'Đã thuộc'];

export default function MemorizePage() {
  const items = useLearned();
  const { practiceSize } = useSettings();
  if (!items) return null;

  const total = items.length;
  const memorised = items.filter((i) => i.mastery.level >= MAX_LEVEL).length;
  const counts = Array.from({ length: MAX_LEVEL + 1 }, (_, l) => items.filter((i) => i.mastery.level === l).length);
  const hard = items.filter((i) => isHard(i.mastery)).length;
  const units = [...new Map(items.map((i) => [i.unit.id, i.unit])).values()];

  return (
    <>
      <PageHeader
        title="Học thuộc"
        subtitle="Tự nhớ lại, ghép, gõ và nghe chép từng cụm từ"
        action={
          <Link to="/hoc-thuoc/so-tay" className="btn btn-soft h-11 px-3">
            <BookMarked size={20} aria-hidden /> Sổ tay
          </Link>
        }
      />
      {total === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-muted">Hoàn thành bước Học của một bài để bắt đầu học thuộc các cụm từ của bài đó.</p>
          <Link to="/bai-hoc" className="btn btn-primary mt-4">Đến danh sách bài</Link>
        </div>
      ) : (
        <>
          <section className="card mb-4 p-5" aria-labelledby="mastered-h">
            <h2 id="mastered-h" className="text-sm font-semibold text-muted">Đã thuộc</h2>
            <p className="text-4xl font-bold tabular-nums">
              {memorised} <span className="text-xl text-muted">/ {total} cụm từ</span>
            </p>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-success transition-[width] duration-500" style={{ width: `${(memorised / total) * 100}%` }} />
            </div>
            <ul className="mt-4 space-y-1.5">
              {counts.map((n, level) => (
                <li key={level} className="grid grid-cols-[6.5rem_1fr_2rem] items-center gap-2 text-sm">
                  <span className="text-muted">{level}. {LEVEL_NAMES[level]}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-surface-2">
                    <span className={`block h-full rounded-full ${level === MAX_LEVEL ? 'bg-success' : 'bg-primary'}`} style={{ width: `${(n / total) * 100}%` }} />
                  </span>
                  <span className="text-right font-semibold tabular-nums">{n}</span>
                </li>
              ))}
            </ul>
          </section>

          <Link to="/hoc-thuoc/luyen" className="btn btn-accent mb-3 w-full text-lg">
            <Zap size={22} aria-hidden /> Luyện nhanh {practiceSize} câu
          </Link>
          <div className="mb-6 grid grid-cols-2 gap-3">
            <Link to="/hoc-thuoc/luyen?che-do=kho" className={`card flex flex-col gap-1 p-4 ${hard ? '' : 'pointer-events-none opacity-50'}`} aria-disabled={!hard}>
              <TriangleAlert size={22} className="text-danger" aria-hidden />
              <span className="font-bold">Từ hay sai</span>
              <span className="text-sm text-muted">{hard} cụm từ</span>
            </Link>
            <Link to="/hoc-thuoc/ghep-cap" className={`card flex flex-col gap-1 p-4 ${total >= 2 ? '' : 'pointer-events-none opacity-50'}`}>
              <Puzzle size={22} className="text-primary" aria-hidden />
              <span className="font-bold">Ghép cặp</span>
              <span className="text-sm text-muted">Nối tiếng Anh với nghĩa</span>
            </Link>
          </div>

          <h2 className="mb-3 text-lg font-bold">Luyện theo bài</h2>
          <ul className="space-y-3">
            {units.map((u) => {
              const own = items.filter((i) => i.unit.id === u.id);
              const done = own.filter((i) => i.mastery.level >= MAX_LEVEL).length;
              return (
                <li key={u.id}>
                  <Link to={`/hoc-thuoc/luyen?bai=${u.id}`} className="card flex items-center gap-3 p-4">
                    <Target size={22} className="shrink-0 text-primary" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{u.title}</span>
                      <span className="block text-sm text-muted">Đã thuộc {done}/{own.length}</span>
                    </span>
                    <ChevronRight size={20} className="text-muted" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
