import type { CheckResult } from './answer-check';
import { db } from './db';
import type { Item } from './questions';
import type { Mastery, Unit } from './types';

export const MAX_LEVEL = 5;

export const emptyMastery = (unitId: string, phraseId: string): Mastery => ({
  key: `${unitId}:${phraseId}`, unitId, phraseId, level: 0, correct: 0, wrong: 0,
});

/** Correct climbs one level, wrong drops one, a near miss (typo) keeps the level. */
export function applyResult(m: Mastery, result: CheckResult, now = Date.now()): Mastery {
  if (result === 'correct') return { ...m, level: Math.min(MAX_LEVEL, m.level + 1), correct: m.correct + 1, lastPracticed: now };
  if (result === 'wrong') return { ...m, level: Math.max(0, m.level - 1), wrong: m.wrong + 1, lastPracticed: now };
  return { ...m, lastPracticed: now };
}

export async function recordAnswer(unitId: string, phraseId: string, result: CheckResult): Promise<Mastery> {
  return db.transaction('rw', db.mastery, async () => {
    const current = (await db.mastery.get(`${unitId}:${phraseId}`)) ?? emptyMastery(unitId, phraseId);
    const next = applyResult(current, result);
    await db.mastery.put(next);
    return next;
  });
}

export async function toggleStar(unitId: string, phraseId: string) {
  await db.transaction('rw', db.mastery, async () => {
    const current = (await db.mastery.get(`${unitId}:${phraseId}`)) ?? emptyMastery(unitId, phraseId);
    await db.mastery.put({ ...current, starred: !current.starred });
  });
}

/** Phrases of every unit whose "Học" step is done, each with its mastery (level 0 if never practised). */
export async function learnedItems(units: Unit[]): Promise<Item[]> {
  const [progress, rows] = await Promise.all([db.progress.toArray(), db.mastery.toArray()]);
  const learned = new Set(progress.filter((p) => p.done.learn).map((p) => p.unitId));
  const byKey = new Map(rows.map((r) => [r.key, r]));
  return units
    .filter((u) => learned.has(u.id))
    .flatMap((unit) =>
      unit.phrases.map((phrase) => {
        const key = `${unit.id}:${phrase.id}`;
        return { key, unit, phrase, mastery: byKey.get(key) ?? emptyMastery(unit.id, phrase.id) };
      }),
    );
}

export const isHard = (m: Mastery) => m.wrong >= 2 || !!m.starred;
