import { describe, expect, it } from 'vitest';
import { checkAnswer, expandTarget, normalize } from './answer-check';

describe('normalize', () => {
  it('unifies case, spacing, apostrophes, a.m. and trailing punctuation', () => {
    expect(normalize('  Wake UP   at 6 A.M.! ')).toBe('wake up at 6 am');
    expect(normalize('make one’s bed.')).toBe("make one's bed");
    expect(checkAnswer('wake up at 6am', ['wake up at 6 a.m.']).result).toBe('correct');
  });
});

describe('checkAnswer', () => {
  it("accepts any possessive for one's", () => {
    expect(checkAnswer('make my bed', ["make one's bed"]).result).toBe('correct');
    expect(checkAnswer("Make their bed.", ["make one's bed"]).result).toBe('correct');
    expect(expandTarget("put one's glasses on")).toContain('put her glasses on');
  });

  it('lets optional (the) words be left out', () => {
    expect(checkAnswer('get up late on weekends', ['get up late on (the) weekends']).result).toBe('correct');
    expect(checkAnswer('get up late on the weekends', ['get up late on (the) weekends']).result).toBe('correct');
  });

  it('accepts variants', () => {
    expect(checkAnswer('pull an all-nighter', ['stay up all night', 'pull an all-nighter']).result).toBe('correct');
  });

  it('treats a small typo as near and marks the wrong letters', () => {
    const c = checkAnswer('hit the snoze button', ['hit the snooze button']);
    expect(c.result).toBe('near');
    expect(c.diff.filter((p) => p.wrong).map((p) => p.text).join('')).toMatch(/o/);
    expect(c.diff.map((p) => p.text).join('')).toBe('hit the snooze button');
  });

  it('allows one edit for short words and rejects bigger mistakes', () => {
    expect(checkAnswer('snoze', ['snooze']).result).toBe('near');
    expect(checkAnswer('alarm', ['snooze']).result).toBe('wrong');
    expect(checkAnswer('', ['snooze']).result).toBe('wrong');
    expect(checkAnswer('turn on the light', ['turn off the alarm clock']).result).toBe('wrong');
  });
});
