import { ArrowRight, BookOpen, Flame, Layers, Mic2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import BackupBanner from '../components/BackupBanner';
import { STEPS } from '../components/Stepper';
import { db } from '../lib/db';
import { streak } from '../lib/dates';
import { reviewQueue } from '../lib/study';
import { useUnits } from '../lib/units';

function greeting() {
  const h = new Date().getHours();
  return h < 11 ? 'Chào buổi sáng!' : h < 14 ? 'Chào buổi trưa!' : h < 18 ? 'Chào buổi chiều!' : 'Chào buổi tối!';
}

export default function HomePage() {
  const units = useUnits();
  const data = useLiveQuery(async () => {
    if (!units) return undefined;
    const [due, days, progress] = await Promise.all([reviewQueue(units), db.studyDays.toCollection().primaryKeys(), db.progress.toArray()]);
    const next = units.find((u) => {
      const p = progress.find((x) => x.unitId === u.id);
      return !p || STEPS.some((s) => !p.done[s.id]);
    });
    return { due: due.length, streak: streak(days as string[]), next, progress };
  }, [units]);

  const next = data?.next;
  const nextDone = next ? STEPS.filter((s) => data?.progress.find((p) => p.unitId === next.id)?.done[s.id]).length : 0;

  return (
    <>
      <BackupBanner />
      <header className="mb-5">
        <p className="font-semibold text-muted">{greeting()}</p>
        <h1 className="text-2xl font-bold">Hôm nay học gì nào?</h1>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="card p-4">
          <Flame size={24} className="text-accent" aria-hidden />
          <p className="mt-2 text-3xl font-bold tabular-nums">{data?.streak ?? 0}</p>
          <p className="text-sm text-muted">ngày học liên tiếp</p>
        </div>
        <div className="card p-4">
          <Layers size={24} className="text-primary" aria-hidden />
          <p className="mt-2 text-3xl font-bold tabular-nums">{data?.due ?? 0}</p>
          <p className="text-sm text-muted">thẻ cần ôn hôm nay</p>
        </div>
      </div>

      <Link to="/on-tap" className={`btn mb-6 w-full ${data?.due ? 'btn-primary' : 'btn-ghost'}`}>
        <Layers size={20} aria-hidden /> {data?.due ? 'Ôn ngay' : 'Không có thẻ cần ôn'}
      </Link>

      <h2 className="mb-3 text-lg font-bold">Học tiếp</h2>
      {next ? (
        <Link to={`/bai-hoc/${next.id}`} className="card mb-6 flex items-center gap-4 p-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <BookOpen size={26} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm text-muted">Chương {next.chapter} · Bài {String(next.unit).padStart(2, '0')}</span>
            <span className="block text-lg font-bold">{next.title}</span>
            <span className="block text-sm text-muted">{nextDone}/4 bước · {next.phrases.length} cụm từ</span>
          </span>
          <ArrowRight size={22} className="text-muted" aria-hidden />
        </Link>
      ) : (
        <div className="card mb-6 p-4 text-muted">
          {units?.length ? 'Bạn đã hoàn thành tất cả bài học. Hãy nhập thêm bài mới!' : 'Chưa có bài học nào.'}{' '}
          <Link to="/nhap-bai" className="font-semibold text-primary underline">Nhập bài mới</Link>
        </div>
      )}

      <Link to="/ke-chuyen" className="card flex items-center gap-4 p-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <Mic2 size={26} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold">Kể chuyện cuối tuần</span>
          <span className="block text-sm text-muted">Ghi âm 2 phút kể lại cả tuần, so sánh tiến bộ</span>
        </span>
        <ArrowRight size={22} className="text-muted" aria-hidden />
      </Link>
    </>
  );
}
