import { useLiveQuery } from 'dexie-react-hooks';
import PageHeader from '../components/PageHeader';
import Recorder from '../components/Recorder';
import RecordingList from '../components/RecordingList';
import { useUi } from '../components/ui';
import { db } from '../lib/db';
import { parseDateKey, weekKey, weekRange } from '../lib/dates';
import { useUnits } from '../lib/units';
import type { Recording } from '../lib/types';
import { PhraseChips } from '../steps/SpeakStep';

const short = (key: string) => parseDateKey(key).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

function weekLabel(key: string) {
  const [y, w] = key.split('-W').map(Number);
  // ISO week 1 contains 4 January, so week w starts (w - 1) weeks after that week's Monday.
  const jan4 = new Date(y, 0, 4);
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (w - 1) * 7);
  const [start, end] = weekRange(monday);
  return `Tuần ${w}/${y} (${short(start)} – ${short(end)})`;
}

export default function WeeklyPage() {
  const { toast } = useUi();
  const units = useUnits();
  const thisWeek = weekKey();
  const [start, end] = weekRange();
  const progress = useLiveQuery(() => db.progress.toArray(), []);
  const recordings = useLiveQuery(
    () => db.recordings.filter((r) => r.kind === 'week').toArray(),
    [],
  );

  const learnedIds = new Set(
    (progress ?? []).filter((p) => p.done.learn && p.done.learn >= start && p.done.learn <= end).map((p) => p.unitId),
  );
  const weekUnits = (units ?? []).filter((u) => learnedIds.has(u.id));
  const groups = new Map<string, Recording[]>();
  for (const r of [...(recordings ?? [])].sort((a, b) => b.createdAt - a.createdAt)) {
    groups.set(r.ref, [...(groups.get(r.ref) ?? []), r]);
  }

  return (
    <>
      <PageHeader title="Kể chuyện cuối tuần" subtitle={weekLabel(thisWeek)} back="/" />
      <div className="card p-5">
        <h2 className="text-lg font-bold">Kể chuyện 2 phút</h2>
        <p className="mt-1 text-muted">
          Ghép các chủ đề đã học trong tuần thành một câu chuyện về một ngày của bạn. Giữ lại bản ghi để vài tuần sau nghe lại và thấy mình tiến bộ.
        </p>
        <div className="my-5">
          <Recorder
            maxSeconds={120}
            onSave={async (blob, mime, seconds) => {
              await db.recordings.add({ kind: 'week', ref: thisWeek, blob, mime, seconds, createdAt: Date.now() });
              toast('Đã lưu câu chuyện của tuần');
            }}
          />
        </div>
        {weekUnits.length ? (
          <>
            <p className="mb-2 text-sm font-semibold">Bài đã học tuần này: {weekUnits.map((u) => u.title).join(', ')}</p>
            <PhraseChips phrases={weekUnits.flatMap((u) => u.phrases.map((p) => ({ key: `${u.id}:${p.id}`, en: p.en })))} />
          </>
        ) : (
          <p className="rounded-2xl bg-surface-2 p-3 text-sm text-muted">
            Tuần này bạn chưa hoàn thành bước Học của bài nào. Bạn vẫn có thể ghi âm kể về một ngày của mình.
          </p>
        )}
      </div>

      <h2 className="mt-6 mb-3 text-lg font-bold">Các tuần trước</h2>
      {groups.size === 0 && <p className="text-muted">Chưa có câu chuyện nào được ghi.</p>}
      <div className="space-y-4">
        {[...groups.entries()].map(([week, items]) => (
          <section key={week} className="card p-4">
            <h3 className="mb-3 font-bold">{weekLabel(week)}{week === thisWeek ? ' · tuần này' : ''}</h3>
            <RecordingList items={items} empty="" />
          </section>
        ))}
      </div>
    </>
  );
}
