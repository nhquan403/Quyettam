import { describe, expect, it } from 'vitest';
import { newCard, schedule } from './srs';

const today = '2026-10-27';

describe('schedule', () => {
  it('moves a passed new card 1 day, then 6, then by ease', () => {
    let c = schedule(newCard('u', 'p', today), 'good', today);
    expect([c.reps, c.interval, c.due]).toEqual([1, 1, '2026-10-28']);
    c = schedule(c, 'good', '2026-10-28');
    expect([c.reps, c.interval, c.due]).toEqual([2, 6, '2026-11-03']);
    c = schedule(c, 'good', '2026-11-03');
    expect(c.interval).toBe(Math.round(6 * c.ease));
  });

  it('keeps a forgotten card due today and resets repetitions', () => {
    const learned = { ...newCard('u', 'p', today), reps: 3, interval: 15, ease: 2.5 };
    const c = schedule(learned, 'again', today);
    expect([c.reps, c.interval, c.due, c.lapses]).toEqual([0, 0, today, 1]);
    expect(c.ease).toBeLessThan(2.5);
  });

  it('raises ease on easy, lowers on hard, never below 1.3', () => {
    const base = newCard('u', 'p', today);
    expect(schedule(base, 'easy', today).ease).toBeGreaterThan(2.5);
    expect(schedule(base, 'hard', today).ease).toBeLessThan(2.5);
    let c = base;
    for (let i = 0; i < 20; i++) c = schedule(c, 'again', today);
    expect(c.ease).toBe(1.3);
  });
});
