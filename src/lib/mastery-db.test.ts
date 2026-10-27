import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { describe, expect, it } from 'vitest';
import unit01 from '../data/unit-01.json';
import { AppDB } from './db';
import type { Unit } from './types';

const unit = unit01 as Unit;

describe('database upgrade and backups', () => {
  it('keeps v1 data when upgrading to v2 with the mastery table', async () => {
    const name = 'upgrade-test';
    const v1 = new Dexie(name);
    v1.version(1).stores({
      cards: 'key, unitId, due', progress: 'unitId', sentences: '++id, unitId, [unitId+phraseId]',
      recordings: '++id, [kind+ref], createdAt', customUnits: 'id', meta: 'key', studyDays: 'date',
    });
    await v1.table('sentences').add({ unitId: unit.id, phraseId: 'sleep-in', text: 'I sleep in.', createdAt: 1, updatedAt: 1 });
    await v1.table('progress').put({ unitId: unit.id, done: { learn: '2026-10-27' }, readCounts: {} });
    v1.close();

    const v2 = new AppDB(name);
    expect((await v2.sentences.toArray())[0].text).toBe('I sleep in.');
    expect((await v2.progress.get(unit.id))?.done.learn).toBe('2026-10-27');
    await v2.mastery.put({ key: `${unit.id}:sleep-in`, unitId: unit.id, phraseId: 'sleep-in', level: 2, correct: 2, wrong: 0 });
    expect(await v2.mastery.count()).toBe(1);
    v2.close();
  });
});
