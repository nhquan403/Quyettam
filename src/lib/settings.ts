import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';

export type ReviewMode = 'self' | 'type';
export type Settings = { voiceURI: string; rate: number; newPerDay: number; practiceSize: number; reviewMode: ReviewMode };
export const DEFAULT_SETTINGS: Settings = { voiceURI: '', rate: 1, newPerDay: 15, practiceSize: 10, reviewMode: 'self' };
export const SLOW_RATE = 0.7;

export async function getMeta<T>(key: string): Promise<T | undefined> {
  return (await db.meta.get(key))?.value as T | undefined;
}

export function setMeta(key: string, value: unknown) {
  return db.meta.put({ key, value });
}

export async function getSettings(): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...((await getMeta<Partial<Settings>>('settings')) ?? {}) };
}

export async function updateSettings(patch: Partial<Settings>) {
  await setMeta('settings', { ...(await getSettings()), ...patch });
}

export function useSettings(): Settings {
  return useLiveQuery(getSettings, [], DEFAULT_SETTINGS);
}

export function useMeta<T>(key: string): T | undefined {
  return useLiveQuery(() => getMeta<T>(key), [key]);
}
