import { describe, expect, it } from 'vitest';
import unit01 from '../data/unit-01.json';
import { applyResult, emptyMastery } from './mastery';
import { bandOf, buildQuestion, keyWord, pickItems, planSession, type Item } from './questions';
import type { Unit } from './types';

const unit = unit01 as Unit;
const item = (phraseId: string, m: Partial<Item['mastery']> = {}): Item => {
  const phrase = unit.phrases.find((p) => p.id === phraseId)!;
  return { key: `${unit.id}:${phraseId}`, unit, phrase, mastery: { ...emptyMastery(unit.id, phraseId), ...m } };
};
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe('mastery ladder', () => {
  it('climbs on correct, drops on wrong, holds on near, stays within 0..5', () => {
    let m = emptyMastery('u', 'p');
    m = applyResult(m, 'wrong');
    expect(m.level).toBe(0);
    for (let i = 0; i < 7; i++) m = applyResult(m, 'correct');
    expect([m.level, m.correct, m.wrong]).toEqual([5, 7, 1]);
    expect(applyResult(m, 'near').level).toBe(5);
    expect(applyResult(m, 'wrong').level).toBe(4);
  });
});

describe('question picker', () => {
  it('orders by level, then mistakes, then oldest practice', () => {
    const picked = pickItems(
      [item('oversleep', { level: 2 }), item('sleep-in', { level: 0, wrong: 1, lastPracticed: 50 }), item('hit-snooze', { level: 0, wrong: 3 }), item('make-bed', { level: 0, wrong: 1, lastPracticed: 10 })],
      3,
    );
    expect(picked.map((p) => p.phrase.id)).toEqual(['hit-snooze', 'make-bed', 'sleep-in']);
  });

  it('gives each phrase an exercise from its level band', () => {
    const items = [item('oversleep', { level: 0 }), item('sleep-in', { level: 3 }), item('make-bed', { level: 5 })];
    for (const q of planSession(items, 3, [unit])) {
      const allowed = [['choice-en', 'listen-vi'], ['scramble', 'blank'], ['type', 'dictation']][bandOf(q.item.mastery.level)];
      expect(allowed).toContain(q.type);
    }
  });

  it('builds 4 distinct options containing the answer', () => {
    const q = buildQuestion(item('hit-snooze'), 'choice-en', [unit]);
    if (q.type !== 'choice-en') throw new Error();
    expect(q.options).toHaveLength(4);
    expect(new Set(q.options).size).toBe(4);
    expect(q.options).toContain('hit the snooze button');
  });

  it('blanks the key word in a book sentence when it appears there, else in the phrase', () => {
    expect(keyWord('hit the snooze button')).toBe('snooze');
    expect(keyWord("put one's glasses on")).toBe('glasses');
    const fromSentence = buildQuestion(item('half-asleep'), 'blank', [unit]);
    expect(fromSentence).toMatchObject({ before: 'She was half ', answer: 'asleep', after: ' throughout the whole class.' });
    const fromPhrase = buildQuestion(item('hit-snooze'), 'blank', [unit]);
    expect(fromPhrase).toMatchObject({ before: 'hit the ', answer: 'snooze', after: ' button' });
  });

  it('replaces listening exercises when speech is unavailable and short scrambles with a blank', () => {
    expect(buildQuestion(item('oversleep'), 'listen-vi', [unit], Math.random, false).type).toBe('choice-en');
    expect(buildQuestion(item('oversleep'), 'dictation', [unit], Math.random, false).type).toBe('type');
    expect(buildQuestion(item('sleep-in'), 'scramble', [unit]).type).toBe('blank');
  });

  it('never returns the scramble tiles already in order', () => {
    const q = buildQuestion(item('make-bed'), 'scramble', [unit], seq(0.99, 0.99, 0.99, 0.5, 0.1));
    if (q.type !== 'scramble') throw new Error();
    expect(q.tiles.join(' ')).not.toBe("make one's bed");
    expect([...q.tiles].sort()).toEqual(["bed", "make", "one's"]);
  });
});
