import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import unit01 from '../data/unit-01.json';
import { db } from './db';
import { exportBackup, importBackup, wipeAll } from './backup';
import { updateSettings } from './settings';
import { completeStep, gradeCard, reviewQueue } from './study';
import type { Unit } from './types';

const unit = unit01 as Unit;
const today = '2026-10-27';

beforeEach(wipeAll);

describe('study flow', () => {
  it('enrolls phrases after the learn step and caps new cards per day', async () => {
    await completeStep(unit, 'learn', today);
    expect(await db.cards.count()).toBe(26);
    await updateSettings({ newPerDay: 5 });
    const queue = await reviewQueue([unit], { today });
    expect(queue).toHaveLength(5);
    await gradeCard(queue[0], 'good', today);
    expect(await reviewQueue([unit], { today })).toHaveLength(4);
    // A lesson-scoped queue is not capped.
    expect(await reviewQueue([unit], { unitId: unit.id, today })).toHaveLength(25);
  });

  it('round-trips progress, sentences and recordings through a backup', async () => {
    await completeStep(unit, 'learn', today);
    await db.sentences.add({ unitId: unit.id, phraseId: 'sleep-in', text: 'I sleep in on Sundays.', createdAt: 1, updatedAt: 1 });
    await db.recordings.add({ kind: 'unit', ref: unit.id, blob: new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/webm' }), mime: 'audio/webm', seconds: 3, createdAt: 1 });
    const backup = JSON.parse(JSON.stringify(await exportBackup()));
    await wipeAll();
    await importBackup(backup);
    expect(await db.cards.count()).toBe(26);
    expect((await db.sentences.toArray())[0].text).toBe('I sleep in on Sundays.');
    const rec = (await db.recordings.toArray())[0];
    expect(Array.from(new Uint8Array(await rec.blob.arrayBuffer()))).toEqual([1, 2, 3]);
    expect((await db.progress.get(unit.id))?.done.learn).toBe(today);
  });
});
