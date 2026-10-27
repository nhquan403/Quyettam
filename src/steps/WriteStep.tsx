import { ChevronDown, Lightbulb, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import SpeakButtons from '../components/SpeakButtons';
import { useUi } from '../components/ui';
import { db } from '../lib/db';
import { completeStep } from '../lib/study';
import type { Phrase, Unit, UserSentence } from '../lib/types';

const HINTS = [
  { label: 'Quá khứ', text: 'Kể việc đã xảy ra: “… yesterday / this morning / last week.”' },
  { label: 'Phủ định', text: 'Câu phủ định: “I don’t … / I didn’t … / I never …”' },
  { label: 'Câu hỏi', text: 'Đặt câu hỏi: “Do you …? / Did you …? / When do you …?”' },
  { label: 'Thói quen', text: 'Thói quen: “I always / usually / sometimes / never …”' },
];

function SentenceItem({ s }: { s: UserSentence }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(s.text);
  const { confirm, toast } = useUi();
  if (editing) {
    return (
      <li className="rounded-2xl bg-surface-2 p-3">
        <label className="sr-only" htmlFor={`edit-${s.id}`}>Sửa câu</label>
        <textarea id={`edit-${s.id}`} className="input min-h-20" lang="en" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button className="btn btn-ghost" onClick={() => { setText(s.text); setEditing(false); }}>Hủy</button>
          <button
            className="btn btn-primary"
            disabled={!text.trim()}
            onClick={async () => {
              await db.sentences.update(s.id!, { text: text.trim(), updatedAt: Date.now() });
              setEditing(false);
              toast('Đã lưu');
            }}
          >
            Lưu
          </button>
        </div>
      </li>
    );
  }
  return (
    <li className="flex items-start gap-2 rounded-2xl bg-surface-2 p-3">
      <p className="flex-1 pt-2 font-medium" lang="en">{s.text}</p>
      <SpeakButtons text={s.text} compact />
      <button className="btn h-11 w-11 p-0 text-muted" aria-label="Sửa câu" onClick={() => setEditing(true)}>
        <Pencil size={18} aria-hidden />
      </button>
      <button
        className="btn h-11 w-11 p-0 text-danger"
        aria-label="Xóa câu"
        onClick={async () => {
          if (await confirm({ title: 'Xóa câu này?', message: s.text, confirmText: 'Xóa', danger: true })) await db.sentences.delete(s.id!);
        }}
      >
        <Trash2 size={18} aria-hidden />
      </button>
    </li>
  );
}

function PhraseWriter({ unitId, phrase, sentences, open, onToggle }: { unitId: string; phrase: Phrase; sentences: UserSentence[]; open: boolean; onToggle: () => void }) {
  const [hint, setHint] = useState(sentences.length % HINTS.length);
  const [draft, setDraft] = useState('');
  const save = async () => {
    const text = draft.trim();
    if (!text) return;
    const now = Date.now();
    await db.sentences.add({ unitId, phraseId: phrase.id, text, createdAt: now, updatedAt: now });
    setDraft('');
    setHint((h) => (h + 1) % HINTS.length);
  };
  const id = `writer-${phrase.id}`;
  return (
    <li className="card overflow-hidden">
      <button type="button" className="flex w-full items-center gap-3 p-4 text-left" aria-expanded={open} aria-controls={id} onClick={onToggle}>
        <span className="text-3xl" aria-hidden>{phrase.emoji}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold" lang="en">{phrase.en}</span>
          <span className="block text-sm text-muted">{phrase.vi}</span>
        </span>
        {sentences.length > 0 && (
          <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-sm font-semibold text-success">{sentences.length} câu</span>
        )}
        <ChevronDown size={20} className={`shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <div id={id} className="border-t border-line p-4">
          <div className="mb-3 flex items-start gap-2 rounded-2xl bg-accent-soft p-3">
            <Lightbulb size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />
            <p className="flex-1 text-sm">
              <strong>{HINTS[hint].label}.</strong> {HINTS[hint].text}
            </p>
            <button className="btn -m-1 h-10 w-10 p-0 text-accent" aria-label="Gợi ý khác" onClick={() => setHint((h) => (h + 1) % HINTS.length)}>
              <RefreshCw size={16} aria-hidden />
            </button>
          </div>
          <label className="label" htmlFor={`new-${phrase.id}`}>Câu của bạn (về cuộc sống thật của bạn)</label>
          <textarea
            id={`new-${phrase.id}`}
            className="input min-h-20"
            lang="en"
            autoCapitalize="sentences"
            placeholder="I …"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button className="btn btn-primary mt-2 w-full" disabled={!draft.trim()} onClick={save}>Lưu câu</button>
          {sentences.length > 0 && (
            <ul className="mt-4 space-y-2">
              {sentences.map((s) => <SentenceItem key={s.id} s={s} />)}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

export default function WriteStep({ unit, onDone }: { unit: Unit; onDone: () => void }) {
  const [open, setOpen] = useState<string | null>(unit.phrases[0]?.id ?? null);
  const all = useLiveQuery(() => db.sentences.where('unitId').equals(unit.id).sortBy('createdAt'), [unit.id]);
  const total = all?.length ?? 0;

  return (
    <section aria-label="Bước 2: Tự viết câu">
      <div className="card mb-4 p-4">
        <h2 className="font-bold">Viết câu về chính bạn</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>Đổi <span lang="en" className="font-semibold text-ink">one’s</span> thành <span lang="en" className="font-semibold text-ink">my / his / her / their…</span> (make one’s bed → make <strong>my</strong> bed).</li>
          <li>Chia động từ cho đúng thì: <span lang="en">goes off → <strong>went</strong> off</span>, <span lang="en">oversleep → <strong>overslept</strong></span>.</li>
          <li>Mỗi cụm từ viết 1–3 câu, mỗi câu một dạng khác nhau.</li>
        </ul>
      </div>
      <ul className="space-y-3">
        {unit.phrases.map((p) => (
          <PhraseWriter
            key={p.id}
            unitId={unit.id}
            phrase={p}
            sentences={(all ?? []).filter((s) => s.phraseId === p.id)}
            open={open === p.id}
            onToggle={() => setOpen((o) => (o === p.id ? null : p.id))}
          />
        ))}
      </ul>
      <p className="mt-5 text-center text-sm text-muted">Bạn đã viết {total} câu cho bài này.</p>
      <button
        className="btn btn-accent mt-3 w-full"
        onClick={async () => {
          await completeStep(unit, 'write');
          onDone();
        }}
      >
        Hoàn thành bước Viết câu
      </button>
    </section>
  );
}
