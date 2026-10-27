import { describe, expect, it } from 'vitest';
import { addDays, streak, weekKey, weekRange } from './dates';

describe('dates', () => {
  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('computes ISO week keys and Monday-based ranges', () => {
    expect(weekKey(new Date(2026, 9, 27))).toBe('2026-W44');
    expect(weekKey(new Date(2027, 0, 1))).toBe('2026-W53');
    expect(weekRange(new Date(2026, 10, 1))).toEqual(['2026-10-26', '2026-11-01']);
  });

  it('counts a streak ending today or yesterday', () => {
    expect(streak(['2026-10-25', '2026-10-26', '2026-10-27'], '2026-10-27')).toBe(3);
    expect(streak(['2026-10-25', '2026-10-26'], '2026-10-27')).toBe(2);
    expect(streak(['2026-10-24'], '2026-10-27')).toBe(0);
  });
});
