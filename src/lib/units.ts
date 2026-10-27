import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import type { Unit } from './types';

const modules = import.meta.glob<Unit>('../data/unit-*.json', { eager: true, import: 'default' });
export const BUILTIN_UNITS: Unit[] = Object.values(modules);

export function mergeUnits(builtin: Unit[], custom: Unit[]): Unit[] {
  const byId = new Map(builtin.map((u) => [u.id, u]));
  for (const u of custom) byId.set(u.id, u);
  return [...byId.values()].sort((a, b) => a.chapter - b.chapter || a.unit - b.unit);
}

export function useUnits(): Unit[] | undefined {
  return useLiveQuery(async () => mergeUnits(BUILTIN_UNITS, (await db.customUnits.toArray()).map((c) => c.data)), []);
}

export function phraseKey(unitId: string, phraseId: string) {
  return `${unitId}:${phraseId}`;
}
