import Dexie, { type Table } from 'dexie';
import type { Card, CustomUnit, MetaRow, Recording, StudyDay, UnitProgress, UserSentence } from './types';

export class AppDB extends Dexie {
  cards!: Table<Card, string>;
  progress!: Table<UnitProgress, string>;
  sentences!: Table<UserSentence, number>;
  recordings!: Table<Recording, number>;
  customUnits!: Table<CustomUnit, string>;
  meta!: Table<MetaRow, string>;
  studyDays!: Table<StudyDay, string>;

  constructor(name = 'hoc-cum-tu') {
    super(name);
    this.version(1).stores({
      cards: 'key, unitId, due',
      progress: 'unitId',
      sentences: '++id, unitId, [unitId+phraseId]',
      recordings: '++id, [kind+ref], createdAt',
      customUnits: 'id',
      meta: 'key',
      studyDays: 'date',
    });
  }
}

export const db = new AppDB();

export const TABLES = ['cards', 'progress', 'sentences', 'recordings', 'customUnits', 'meta', 'studyDays'] as const;
export type TableName = (typeof TABLES)[number];
