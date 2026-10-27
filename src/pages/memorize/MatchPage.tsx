import { PartyPopper, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { plainPhrase, shuffle, type Item } from '../../lib/questions';
import { useLearned } from '../../lib/use-learned';

const PAIRS = 5;
type Side = 'en' | 'vi';
type Tile = { key: string; text: string };

/** Recognition mini-game: matches do not change mastery levels. */
function Board({ items, onNew }: { items: Item[]; onNew: () => void }) {
  const [left] = useState<Tile[]>(() => shuffle(items.map((i) => ({ key: i.key, text: plainPhrase(i.phrase.en) }))));
  const [right] = useState<Tile[]>(() => shuffle(items.map((i) => ({ key: i.key, text: i.phrase.vi }))));
  const [selected, setSelected] = useState<{ side: Side; key: string } | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<{ en: string; vi: string } | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const pick = (side: Side, key: string) => {
    if (matched.has(key)) return;
    if (!selected || selected.side === side) return setSelected({ side, key });
    const [en, vi] = side === 'en' ? [key, selected.key] : [selected.key, key];
    setSelected(null);
    if (en === vi) {
      setMatched((m) => new Set(m).add(en));
    } else {
      setMistakes((n) => n + 1);
      setWrongPair({ en, vi });
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setWrongPair(null), 450);
    }
  };

  const allDone = matched.size === items.length;

  const column = (tiles: Tile[], side: Side) => (
    <ul className="space-y-2" lang={side === 'en' ? 'en' : undefined}>
      {tiles.map((t) => {
        const isMatched = matched.has(t.key);
        const isSelected = selected?.side === side && selected.key === t.key;
        const isWrong = wrongPair?.[side] === t.key;
        return (
          <li key={t.key}>
            <button
              type="button"
              aria-pressed={isSelected}
              disabled={isMatched}
              onClick={() => pick(side, t.key)}
              className={`btn min-h-16 w-full border-2 px-2 text-sm leading-snug font-medium transition-colors ${
                isMatched
                  ? 'border-success bg-success-soft text-success opacity-60'
                  : isWrong
                    ? 'animate-shake border-danger bg-danger-soft text-danger'
                    : isSelected
                      ? 'border-primary bg-primary-soft text-primary-strong'
                      : 'border-line bg-surface text-ink'
              }`}
            >
              {t.text}
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      <p className="mb-3 text-sm text-muted" aria-live="polite">
        Đã ghép {matched.size}/{items.length} · Sai {mistakes} lần
      </p>
      <div className="grid grid-cols-2 gap-2">
        {column(left, 'en')}
        {column(right, 'vi')}
      </div>
      {allDone && (
        <div className="card mt-4 flex flex-col items-center gap-2 p-6 text-center" role="status">
          <PartyPopper size={40} className="text-accent" aria-hidden />
          <p className="text-lg font-bold">{mistakes === 0 ? 'Hoàn hảo, không sai lần nào!' : `Hoàn thành! Sai ${mistakes} lần.`}</p>
          <button className="btn btn-primary mt-2" onClick={onNew}>
            <RotateCcw size={18} aria-hidden /> Ván mới
          </button>
        </div>
      )}
    </>
  );
}

export default function MatchPage() {
  const items = useLearned();
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<Item[] | null>(null);

  const draw = (from: Item[]) => setPicked(shuffle(from).slice(0, PAIRS));
  // Draw once when the data loads; later mastery changes must not reshuffle the board.
  useEffect(() => {
    if (items && !picked) draw(items);
  }, [items, picked]);

  return (
    <>
      <PageHeader title="Ghép cặp" subtitle="Chạm một cụm tiếng Anh rồi chạm nghĩa của nó" back="/hoc-thuoc" />
      {!picked ? null : picked.length < 2 ? (
        <p className="card p-6 text-center text-muted">Cần ít nhất 2 cụm từ đã học để chơi ghép cặp.</p>
      ) : (
        <Board
          key={round}
          items={picked}
          onNew={() => {
            if (items) draw(items);
            setRound((r) => r + 1);
          }}
        />
      )}
    </>
  );
}
