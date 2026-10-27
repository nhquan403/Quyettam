import { Bot, Check, Copy } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import Recorder from '../components/Recorder';
import RecordingList from '../components/RecordingList';
import { useUi } from '../components/ui';
import { db } from '../lib/db';
import { completeStep } from '../lib/study';
import type { Unit } from '../lib/types';

export function aiPrompt(phrases: string[], topic: string) {
  return `You are my friendly English conversation partner. I am a Vietnamese learner. Ask me simple questions about ${topic} so I can use these phrases: ${phrases.join('; ')}. Use easy English, one question at a time. After each of my answers, correct my mistakes briefly, then ask the next question.`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

export function PhraseChips({ phrases }: { phrases: { key: string; en: string }[] }) {
  const [used, setUsed] = useState<Set<string>>(new Set());
  return (
    <div>
      <p className="mb-2 text-sm text-muted">Chạm vào cụm từ khi bạn đã dùng nó ({used.size}/{phrases.length}):</p>
      <ul className="flex flex-wrap gap-2">
        {phrases.map((p) => {
          const on = used.has(p.key);
          return (
            <li key={p.key}>
              <button
                type="button"
                aria-pressed={on}
                className={`chip transition-colors ${on ? 'border-success bg-success-soft text-success' : ''}`}
                onClick={() => setUsed((s) => { const n = new Set(s); if (on) n.delete(p.key); else n.add(p.key); return n; })}
                lang="en"
              >
                {on && <Check size={14} strokeWidth={3} aria-hidden />}
                {p.en}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function SpeakStep({ unit, onDone }: { unit: Unit; onDone: () => void }) {
  const { toast } = useUi();
  const recordings = useLiveQuery(
    () => db.recordings.where('[kind+ref]').equals(['unit', unit.id]).reverse().sortBy('createdAt'),
    [unit.id],
  );

  return (
    <section aria-label="Bước 3: Nói">
      <div className="card p-5">
        <h2 className="text-lg font-bold">Nói 1 phút</h2>
        <p className="mt-1 text-muted">Kể về buổi sáng hoặc một ngày của bạn theo chủ đề “{unit.title}”, dùng các cụm từ của bài này. Nói chậm cũng được, quan trọng là nói liền mạch.</p>
        <div className="my-5"><Recorder
          maxSeconds={60}
          onSave={async (blob, mime, seconds) => {
            await db.recordings.add({ kind: 'unit', ref: unit.id, blob, mime, seconds, createdAt: Date.now() });
            toast('Đã lưu bản ghi');
          }}
        /></div>
        <PhraseChips phrases={unit.phrases.map((p) => ({ key: p.id, en: p.en }))} />
      </div>

      <div className="card mt-4 p-5">
        <h2 className="mb-3 text-lg font-bold">Bản ghi của bạn</h2>
        <RecordingList items={recordings ?? []} empty="Chưa có bản ghi nào. Hãy thử nói 1 phút!" />
      </div>

      <div className="card mt-4 p-5">
        <div className="flex items-start gap-3">
          <Bot size={28} className="shrink-0 text-primary" aria-hidden />
          <div>
            <h2 className="font-bold">Luyện nói với AI</h2>
            <p className="mt-1 text-sm text-muted">Sao chép câu lệnh rồi dán vào ChatGPT hoặc Claude (bật chế độ giọng nói) để được hỏi chuyện và sửa lỗi.</p>
          </div>
        </div>
        <button
          className="btn btn-soft mt-3 w-full"
          onClick={async () => {
            const ok = await copyText(aiPrompt(unit.phrases.map((p) => p.en), `my daily life (topic: ${unit.chapterTitle})`));
            toast(ok ? 'Đã sao chép câu lệnh' : 'Không sao chép được');
          }}
        >
          <Copy size={18} aria-hidden /> Sao chép câu lệnh luyện với AI
        </button>
      </div>

      <button
        className="btn btn-accent mt-6 w-full"
        onClick={async () => {
          await completeStep(unit, 'speak');
          onDone();
        }}
      >
        Hoàn thành bước Nói
      </button>
    </section>
  );
}
