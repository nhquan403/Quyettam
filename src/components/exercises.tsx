import { Check as CheckIcon, Headphones, Snail, Volume2, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { checkAnswer, normalize, type Check } from '../lib/answer-check';
import { plainPhrase, type Question } from '../lib/questions';
import { useSettings } from '../lib/settings';
import { speak, ttsSupported } from '../lib/speech';
import SpeakButtons from './SpeakButtons';

export type Response = { check: Check; chosen?: string };

const TITLES: Record<Question['type'], string> = {
  'choice-en': 'Chọn cụm từ tiếng Anh',
  'listen-vi': 'Nghe và chọn nghĩa',
  scramble: 'Sắp xếp các từ',
  blank: 'Điền từ còn thiếu',
  type: 'Gõ cả cụm từ',
  dictation: 'Nghe và chép lại',
};

const done = (result: Check['result'], expected: string): Check => ({ result, expected, diff: [{ text: expected, wrong: false }] });

function Prompt({ emoji, children }: { emoji: string; children: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col items-center gap-2 text-center">
      <span className="text-6xl" aria-hidden>{emoji}</span>
      {children}
    </div>
  );
}

function ListenButtons({ text, auto, onCannotHear }: { text: string; auto?: boolean; onCannotHear?: () => void }) {
  const { voiceURI, rate } = useSettings();
  useEffect(() => {
    if (auto) speak(text, { voiceURI, rate });
    // Speak once when the question appears, not on every settings change.
  }, [text]);
  const skip = onCannotHear && (
    <button type="button" className="btn btn-ghost min-h-9 py-1 text-sm" onClick={onCannotHear}>
      Không nghe được, bỏ qua câu này
    </button>
  );
  if (!ttsSupported) return <>{skip}</>;
  return (
    <>
    <div className="flex justify-center gap-3">
      <button type="button" className="btn btn-primary h-16 w-16 rounded-full p-0" aria-label="Nghe lại" onClick={() => speak(text, { voiceURI, rate })}>
        <Volume2 size={28} aria-hidden />
      </button>
      <button type="button" className="btn btn-ghost h-16 w-16 rounded-full p-0" aria-label="Nghe chậm" onClick={() => speak(text, { voiceURI, slow: true })}>
        <Snail size={26} aria-hidden />
      </button>
    </div>
    {skip}
    </>
  );
}

function Options({ options, answer, response, onRespond, lang }: { options: string[]; answer: string; response: Response | null; onRespond: (r: Response) => void; lang?: string }) {
  return (
    <ul className="grid gap-2">
      {options.map((o) => {
        const isAnswer = o === answer;
        const chosen = response?.chosen === o;
        const style = !response ? 'bg-surface border-line' : isAnswer ? 'bg-success-soft border-success text-success' : chosen ? 'bg-danger-soft border-danger text-danger' : 'bg-surface border-line opacity-60';
        return (
          <li key={o}>
            <button
              type="button"
              lang={lang}
              disabled={!!response}
              onClick={() => onRespond({ check: done(isAnswer ? 'correct' : 'wrong', answer), chosen: o })}
              className={`btn w-full justify-start border-2 text-left font-medium disabled:pointer-events-none disabled:opacity-100 ${style}`}
            >
              <span className="flex-1">{o}</span>
              {response && isAnswer && <CheckIcon size={18} aria-label="đáp án đúng" />}
              {response && chosen && !isAnswer && <X size={18} aria-label="bạn đã chọn" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function AnswerInput({ label, onSubmit, disabled, onSkip }: { label: string; onSubmit: (text: string) => void; disabled: boolean; onSkip: () => void }) {
  const [text, setText] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim()) onSubmit(text);
  };
  return (
    <form onSubmit={submit}>
      <label className="label" htmlFor="answer">{label}</label>
      <input
        ref={ref}
        id="answer"
        className="input text-lg"
        lang="en"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
      />
      {!disabled && (
        <div className="mt-3 grid grid-cols-[auto_1fr] gap-2">
          <button type="button" className="btn btn-ghost" onClick={onSkip}>Không biết</button>
          <button type="submit" className="btn btn-primary" disabled={!text.trim()}>Kiểm tra</button>
        </div>
      )}
    </form>
  );
}

function Scramble({ q, response, onRespond }: { q: Extract<Question, { type: 'scramble' }>; response: Response | null; onRespond: (r: Response) => void }) {
  const [placed, setPlaced] = useState<number[]>([]);
  const expected = plainPhrase(q.item.phrase.en);
  const check = () => {
    const built = placed.map((i) => q.tiles[i]).join(' ');
    onRespond({ check: done(normalize(built) === normalize(expected) ? 'correct' : 'wrong', expected) });
  };
  return (
    <div>
      <div className="mb-3 flex min-h-16 flex-wrap content-start gap-2 rounded-2xl border-2 border-dashed border-line p-2" aria-label="Câu bạn đang ghép" lang="en">
        {placed.length === 0 && <span className="p-2 text-sm text-muted">Chạm vào các từ bên dưới theo đúng thứ tự</span>}
        {placed.map((i, pos) => (
          <button key={i} type="button" disabled={!!response} className="chip min-h-11 border-primary bg-primary-soft px-4 text-base text-primary-strong" onClick={() => setPlaced((p) => p.filter((_, k) => k !== pos))} aria-label={`Bỏ từ ${q.tiles[i]}`}>
            {q.tiles[i]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" lang="en">
        {q.tiles.map((t, i) => (
          <button key={i} type="button" disabled={!!response || placed.includes(i)} className="chip min-h-11 px-4 text-base disabled:opacity-30" onClick={() => setPlaced((p) => [...p, i])}>
            {t}
          </button>
        ))}
      </div>
      {!response && (
        <button className="btn btn-primary mt-4 w-full" disabled={placed.length !== q.tiles.length} onClick={check}>Kiểm tra</button>
      )}
    </div>
  );
}

/** Renders one exercise. Calls onRespond once with the checked answer; inputs lock afterwards. */
export function QuestionView({ q, response, onRespond, onCannotHear }: { q: Question; response: Response | null; onRespond: (r: Response) => void; onCannotHear?: () => void }) {
  const { phrase } = q.item;
  const targets = [phrase.en, ...(phrase.variants ?? [])];
  const skip = (expected: string) => onRespond({ check: done('wrong', expected) });

  let body: ReactNode;
  switch (q.type) {
    case 'choice-en':
      body = (
        <>
          <Prompt emoji={phrase.emoji}><p className="text-xl font-semibold">{phrase.vi}</p></Prompt>
          <Options options={q.options} answer={q.answer} response={response} onRespond={onRespond} lang="en" />
        </>
      );
      break;
    case 'listen-vi':
      body = (
        <>
          <div className="mb-5 flex flex-col items-center gap-3">
            <Headphones size={40} className="text-primary" aria-hidden />
            <ListenButtons text={phrase.en} auto onCannotHear={response ? undefined : onCannotHear} />
          </div>
          <Options options={q.options} answer={q.answer} response={response} onRespond={onRespond} />
        </>
      );
      break;
    case 'scramble':
      body = (
        <>
          <Prompt emoji={phrase.emoji}><p className="text-lg font-semibold">{phrase.vi}</p></Prompt>
          <Scramble q={q} response={response} onRespond={onRespond} />
        </>
      );
      break;
    case 'blank':
      body = (
        <>
          <p className="mb-2 text-sm text-muted">Gợi ý: {phrase.vi}</p>
          <p className="card mb-4 p-4 text-lg font-medium" lang="en">
            {q.before}
            <span className="mx-1 inline-block min-w-16 border-b-2 border-primary text-center text-primary">
              {response ? q.answer : ' '}
            </span>
            {q.after}
          </p>
          <AnswerInput label="Từ còn thiếu" disabled={!!response} onSkip={() => skip(q.answer)} onSubmit={(t) => onRespond({ check: checkAnswer(t, [q.answer]) })} />
        </>
      );
      break;
    case 'type':
      body = (
        <>
          <Prompt emoji={phrase.emoji}>
            <p className="text-lg font-semibold">{phrase.situation}</p>
            <p className="rounded-full bg-surface-2 px-3 py-1 text-sm text-muted">{phrase.vi}</p>
          </Prompt>
          <AnswerInput label="Cụm từ tiếng Anh" disabled={!!response} onSkip={() => skip(plainPhrase(phrase.en))} onSubmit={(t) => onRespond({ check: checkAnswer(t, targets) })} />
        </>
      );
      break;
    case 'dictation':
      body = (
        <>
          <div className="mb-5 flex flex-col items-center gap-3">
            <Headphones size={40} className="text-primary" aria-hidden />
            <ListenButtons text={phrase.en} auto onCannotHear={response ? undefined : onCannotHear} />
          </div>
          <AnswerInput label="Bạn nghe được gì?" disabled={!!response} onSkip={() => skip(plainPhrase(phrase.en))} onSubmit={(t) => onRespond({ check: checkAnswer(t, targets) })} />
        </>
      );
      break;
  }

  return (
    <div className={`card p-5 ${response?.check.result === 'wrong' ? 'animate-shake' : ''}`}>
      <h2 className="mb-4 text-sm font-bold tracking-wide text-muted uppercase">{TITLES[q.type]}</h2>
      {body}
    </div>
  );
}

/** Result banner shown after an answer: correct, near (with misspelled letters marked) or wrong. */
export function Feedback({ check, speakText, onContinue }: { check: Check; speakText: string; onContinue: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const tone = check.result === 'correct' ? 'bg-success-soft text-success' : check.result === 'near' ? 'bg-warn-soft text-warn-ink' : 'bg-danger-soft text-danger';
  const title = check.result === 'correct' ? 'Chính xác!' : check.result === 'near' ? 'Gần đúng, chú ý chính tả:' : 'Chưa đúng. Đáp án là:';
  return (
    <div className={`mt-4 rounded-3xl p-4 ${tone}`}>
      <div role="status" aria-live="polite" className="flex items-start gap-3">
        <div id="feedback-result" className="flex-1">
          <p className="font-bold">{title}</p>
          {check.result !== 'correct' && (
            <p className="mt-1 text-lg font-semibold text-ink" lang="en">
              {check.diff.map((part, i) =>
                part.wrong ? <mark key={i} className="rounded bg-warn-soft px-0.5 text-danger underline decoration-2">{part.text}</mark> : <span key={i}>{part.text}</span>,
              )}
            </p>
          )}
        </div>
        <SpeakButtons text={speakText} compact />
      </div>
      <button ref={ref} className="btn btn-primary mt-3 w-full" aria-describedby="feedback-result" onClick={onContinue}>Tiếp tục</button>
    </div>
  );
}
