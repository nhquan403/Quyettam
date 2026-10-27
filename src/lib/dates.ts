/** Local calendar date as YYYY-MM-DD. */
export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

/** ISO-8601 week key such as 2026-W44 (weeks start on Monday). */
export function weekKey(d: Date = new Date()): string {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (t.getDay() + 6) % 7; // Monday = 0
  t.setDate(t.getDate() - dow + 3); // Thursday of this week decides the year
  const firstThursday = new Date(t.getFullYear(), 0, 4);
  const fdow = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - fdow + 3);
  const week = 1 + Math.round((t.getTime() - firstThursday.getTime()) / (7 * 86400000));
  return `${t.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Monday..Sunday date keys of the week containing `d`. */
export function weekRange(d: Date = new Date()): [string, string] {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  t.setDate(t.getDate() - ((t.getDay() + 6) % 7));
  const start = dateKey(t);
  return [start, addDays(start, 6)];
}

/** Consecutive study days ending today, or yesterday if today has no study yet. */
export function streak(days: string[], today: string = dateKey()): number {
  const set = new Set(days);
  let cursor = set.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (set.has(cursor)) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}
