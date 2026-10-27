import { db } from './db';
import { dateKey } from './dates';
import { isNew, newCard, schedule, type Grade } from './srs';
import { getMeta, getSettings, setMeta } from './settings';
import type { Card, StepId, Unit, UnitProgress } from './types';

export const emptyProgress = (unitId: string): UnitProgress => ({ unitId, done: {}, readCounts: {} });

export async function getProgress(unitId: string): Promise<UnitProgress> {
  return (await db.progress.get(unitId)) ?? emptyProgress(unitId);
}

export async function markStudyDay(today = dateKey()) {
  await db.studyDays.put({ date: today });
}

/** Completing "Học" also puts the unit's phrases into spaced repetition. */
export async function completeStep(unit: Unit, step: StepId, today = dateKey()) {
  await db.transaction('rw', db.progress, db.cards, db.studyDays, async () => {
    const p = await getProgress(unit.id);
    await db.progress.put({ ...p, done: { ...p.done, [step]: p.done[step] ?? today } });
    if (step === 'learn') await enrollUnit(unit, today);
    await markStudyDay(today);
  });
}

export async function enrollUnit(unit: Unit, today = dateKey()) {
  const existing = new Set(await db.cards.where('unitId').equals(unit.id).primaryKeys());
  const fresh = unit.phrases.filter((p) => !existing.has(`${unit.id}:${p.id}`)).map((p) => newCard(unit.id, p.id, today));
  if (fresh.length) await db.cards.bulkAdd(fresh);
}

export async function setReadCount(unitId: string, phraseId: string, count: number) {
  await db.transaction('rw', db.progress, async () => {
    const p = await getProgress(unitId);
    await db.progress.put({ ...p, readCounts: { ...p.readCounts, [phraseId]: count } });
  });
}

const newCountKey = (today: string) => `newCount:${today}`;

/**
 * Cards to review today. Review-due cards come first; never-seen cards are capped
 * by the daily new-card limit unless the queue is scoped to one unit (a lesson).
 * Cards whose unit no longer exists are skipped.
 */
export async function reviewQueue(units: Unit[], opts: { unitId?: string; today?: string } = {}): Promise<Card[]> {
  const today = opts.today ?? dateKey();
  const known = new Set(units.flatMap((u) => u.phrases.map((p) => `${u.id}:${p.id}`)));
  let due = await db.cards.where('due').belowOrEqual(today).toArray();
  due = due.filter((c) => known.has(c.key) && (!opts.unitId || c.unitId === opts.unitId));
  const reviews = due.filter((c) => !isNew(c)).sort((a, b) => a.due.localeCompare(b.due));
  let fresh = due.filter(isNew);
  if (!opts.unitId) {
    const { newPerDay } = await getSettings();
    const used = (await getMeta<number>(newCountKey(today))) ?? 0;
    fresh = fresh.slice(0, Math.max(0, newPerDay - used));
  }
  return [...reviews, ...fresh];
}

export async function gradeCard(card: Card, grade: Grade, today = dateKey()): Promise<Card> {
  const next = schedule(card, grade, today);
  await db.transaction('rw', db.cards, db.meta, db.studyDays, async () => {
    await db.cards.put(next);
    if (isNew(card)) await setMeta(newCountKey(today), ((await getMeta<number>(newCountKey(today))) ?? 0) + 1);
    await markStudyDay(today);
  });
  return next;
}
