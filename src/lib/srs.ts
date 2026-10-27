import type { Card } from './types';
import { addDays } from './dates';

export type Grade = 'again' | 'hard' | 'good' | 'easy';

export const GRADE_QUALITY: Record<Grade, number> = { again: 1, hard: 3, good: 4, easy: 5 };

export function newCard(unitId: string, phraseId: string, today: string): Card {
  return { key: `${unitId}:${phraseId}`, unitId, phraseId, ease: 2.5, interval: 0, reps: 0, lapses: 0, due: today };
}

/**
 * SM-2. A failed card restarts its repetitions and stays due today so it is
 * relearned in the same session; passed cards move 1 day, then 6, then interval × ease.
 */
export function schedule(card: Card, grade: Grade, today: string): Card {
  const q = GRADE_QUALITY[grade];
  const ease = Math.max(1.3, card.ease + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (q < 3) {
    return { ...card, ease, reps: 0, interval: 0, lapses: card.lapses + 1, due: today, lastReviewed: today };
  }
  const reps = card.reps + 1;
  const interval = reps === 1 ? 1 : reps === 2 ? 6 : Math.round(card.interval * ease);
  return { ...card, ease, reps, interval, due: addDays(today, interval), lastReviewed: today };
}

export const isNew = (c: Card) => c.reps === 0 && c.lapses === 0 && !c.lastReviewed;
export const isRemembered = (c: Card) => c.reps >= 2;
