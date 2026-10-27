import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import PracticeSession from '../../components/PracticeSession';
import { isHard, learnedItems } from '../../lib/mastery';
import { planSession, type Question } from '../../lib/questions';
import { getSettings } from '../../lib/settings';
import { ttsSupported } from '../../lib/speech';
import { useUnits } from '../../lib/units';

export default function PracticePage() {
  const units = useUnits();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const unitId = params.get('bai');
  const hardOnly = params.get('che-do') === 'kho';
  const keys = params.get('cau')?.split(',').filter(Boolean);
  // A new navigation (even to the same URL, e.g. retrying the same wrong phrase) starts a fresh session.
  const scope = `${params.toString()}#${useLocation().key}`;

  // Plan the session once per scope so answering does not reshuffle it.
  useEffect(() => {
    if (!units) return;
    let alive = true;
    setQuestions(null);
    (async () => {
      let items = await learnedItems(units);
      if (unitId) items = items.filter((i) => i.unit.id === unitId);
      if (hardOnly) items = items.filter((i) => isHard(i.mastery));
      if (keys) items = items.filter((i) => keys.includes(i.key));
      const { practiceSize } = await getSettings();
      const plan = planSession(items, keys ? keys.length : practiceSize, units, Math.random, ttsSupported);
      if (alive) setQuestions(plan);
    })();
    return () => {
      alive = false;
    };
    // `scope` captures every search param used above plus the navigation key.
  }, [units, scope]);

  const title = keys ? 'Luyện lại câu sai' : hardOnly ? 'Từ hay sai' : unitId ? units?.find((u) => u.id === unitId)?.title ?? 'Luyện tập' : 'Luyện nhanh';

  return (
    <>
      <PageHeader title={title} back="/hoc-thuoc" />
      {!questions || !units ? (
        <div className="card h-80 animate-pulse" aria-busy="true" />
      ) : questions.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-muted">Không có cụm từ nào để luyện trong mục này.</p>
          <Link to="/hoc-thuoc" className="btn btn-primary mt-4">Về trang Học thuộc</Link>
        </div>
      ) : (
        <PracticeSession key={scope} initial={questions} units={units} onRetry={(k) => navigate(`/hoc-thuoc/luyen?cau=${encodeURIComponent(k.join(','))}`)} />
      )}
    </>
  );
}
