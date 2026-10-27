export type Phrase = { id: string; en: string; variants?: string[]; vi: string; emoji: string; situation: string };
export type Sentence = { en: string; vi: string; phraseIds: string[] };
export type Unit = {
  id: string;
  chapter: number;
  chapterTitle: string;
  unit: number;
  title: string;
  phrases: Phrase[];
  sentences: Sentence[];
};

/** Spaced-repetition state of one phrase. `due` is a local date key (YYYY-MM-DD). */
export type Card = {
  key: string; // `${unitId}:${phraseId}`
  unitId: string;
  phraseId: string;
  ease: number;
  interval: number;
  reps: number;
  lapses: number;
  due: string;
  lastReviewed?: string;
};

export type StepId = 'learn' | 'write' | 'speak' | 'review';

export type UnitProgress = {
  unitId: string;
  done: Partial<Record<StepId, string>>; // step -> date key completed
  readCounts: Record<string, number>;
};

export type UserSentence = { id?: number; unitId: string; phraseId: string; text: string; createdAt: number; updatedAt: number };

export type Recording = {
  id?: number;
  kind: 'unit' | 'week';
  ref: string; // unitId or ISO week key
  blob: Blob;
  mime: string;
  seconds: number;
  createdAt: number;
};

export type CustomUnit = { id: string; data: Unit; importedAt: number };
export type MetaRow = { key: string; value: unknown };
export type StudyDay = { date: string };

/** Active-recall progress of one phrase: level 0..5, 5 = memorised ("Đã thuộc"). */
export type Mastery = {
  key: string; // `${unitId}:${phraseId}`
  unitId: string;
  phraseId: string;
  level: number;
  correct: number;
  wrong: number;
  lastPracticed?: number;
  starred?: boolean;
};
