import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import ReviewSession from '../components/ReviewSession';
import Stepper, { STEPS } from '../components/Stepper';
import { useUi } from '../components/ui';
import { db } from '../lib/db';
import { completeStep } from '../lib/study';
import type { StepId } from '../lib/types';
import { useUnits } from '../lib/units';
import LearnStep from '../steps/LearnStep';
import SpeakStep from '../steps/SpeakStep';
import WriteStep from '../steps/WriteStep';

export default function LessonPage() {
  const { unitId } = useParams();
  const units = useUnits();
  const [params, setParams] = useSearchParams();
  const progress = useLiveQuery(() => db.progress.get(unitId ?? ''), [unitId]);
  const unit = units?.find((u) => u.id === unitId);
  const { toast } = useUi();

  if (!units) return null;
  if (!unit) {
    return (
      <>
        <PageHeader title="Không tìm thấy bài" back="/bai-hoc" />
        <Link to="/bai-hoc" className="btn btn-primary">Về danh sách bài</Link>
      </>
    );
  }

  const step = (STEPS.find((s) => s.id === params.get('buoc'))?.id ?? 'learn') as StepId;
  const go = (s: StepId) => {
    setParams({ buoc: s });
    window.scrollTo({ top: 0 });
  };
  const nextOf = (s: StepId) => () => {
    const i = STEPS.findIndex((x) => x.id === s);
    go(STEPS[Math.min(i + 1, STEPS.length - 1)].id);
  };

  return (
    <>
      <PageHeader title={unit.title} subtitle={`Chương ${unit.chapter} · Bài ${String(unit.unit).padStart(2, '0')} · ${unit.phrases.length} cụm từ`} back="/bai-hoc" />
      <Stepper current={step} done={progress?.done ?? {}} onSelect={go} />
      {step === 'learn' && <LearnStep unit={unit} onDone={nextOf('learn')} />}
      {step === 'write' && <WriteStep unit={unit} onDone={nextOf('write')} />}
      {step === 'speak' && <SpeakStep unit={unit} onDone={nextOf('speak')} />}
      {step === 'review' &&
        (progress?.done.learn ? (
          <ReviewSession
            key={unit.id}
            units={units}
            unitId={unit.id}
            onFinish={() => completeStep(unit, 'review').catch(() => toast('Không lưu được tiến độ bài học'))}
            emptyText="Các thẻ của bài này chưa đến hạn ôn. Hãy quay lại vào ngày mai!"
          />
        ) : (
          <div className="card p-6 text-center">
            <p className="text-muted">Hoàn thành bước Học trước để các cụm từ được đưa vào ôn tập.</p>
            <button className="btn btn-primary mt-4" onClick={() => go('learn')}>Đến bước Học</button>
          </div>
        ))}
    </>
  );
}
