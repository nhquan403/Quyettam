import { Check } from 'lucide-react';
import type { StepId } from '../lib/types';

export const STEPS: { id: StepId; label: string }[] = [
  { id: 'learn', label: 'Học' },
  { id: 'write', label: 'Viết câu' },
  { id: 'speak', label: 'Nói' },
  { id: 'review', label: 'Ôn tập' },
];

export default function Stepper({ current, done, onSelect }: { current: StepId; done: Partial<Record<StepId, string>>; onSelect: (s: StepId) => void }) {
  return (
    <nav aria-label="Các bước của bài học" className="mb-5">
      <ol className="grid grid-cols-4 gap-1.5 rounded-3xl bg-surface-2 p-1.5">
        {STEPS.map((s, i) => {
          const active = s.id === current;
          const complete = !!done[s.id];
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                aria-current={active ? 'step' : undefined}
                className={`flex min-h-14 w-full flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-semibold transition-colors ${
                  active ? 'bg-surface text-primary shadow-sm' : 'text-muted'
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                    complete ? 'bg-success text-white dark:text-[#0b1f12]' : active ? 'bg-primary text-primary-ink' : 'bg-line text-muted'
                  }`}
                >
                  {complete ? <Check size={14} strokeWidth={3} aria-label="đã xong" /> : i + 1}
                </span>
                {s.label}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
