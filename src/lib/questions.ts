import type { Mastery, Phrase, Unit } from './types';

export type ExerciseType = 'choice-en' | 'listen-vi' | 'scramble' | 'blank' | 'type' | 'dictation';
export type Rng = () => number;

/** Exercise types per level band: recognise (0–1), partial recall (2–3), full recall (4–5). */
export const BANDS: ExerciseType[][] = [
  ['choice-en', 'listen-vi'],
  ['scramble', 'blank'],
  ['type', 'dictation'],
];
export const bandOf = (level: number) => (level <= 1 ? 0 : level <= 3 ? 1 : 2);

export type Item = { key: string; unit: Unit; phrase: Phrase; mastery: Mastery };

export type Question =
  | { type: 'choice-en'; item: Item; options: string[]; answer: string }
  | { type: 'listen-vi'; item: Item; options: string[]; answer: string }
  | { type: 'scramble'; item: Item; tiles: string[] }
  | { type: 'blank'; item: Item; before: string; after: string; answer: string }
  | { type: 'type'; item: Item }
  | { type: 'dictation'; item: Item };

export function shuffle<T>(arr: T[], rng: Rng = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Weakest first: lowest level, then most mistakes, then least recently practised. */
export function pickItems(items: Item[], n: number): Item[] {
  return [...items]
    .sort(
      (a, b) =>
        a.mastery.level - b.mastery.level ||
        b.mastery.wrong - a.mastery.wrong ||
        (a.mastery.lastPracticed ?? 0) - (b.mastery.lastPracticed ?? 0),
    )
    .slice(0, n);
}

/** Phrase text as shown to learners: "(the)" becomes "the". */
export const plainPhrase = (en: string) => en.replace(/[()]/g, '');

const STOP = new Set(['a', 'an', 'the', 'on', 'in', 'at', 'of', 'to', "one's"]);
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Longest meaningful word of the phrase, used for fill-in-the-blank. */
export function keyWord(en: string): string {
  const words = plainPhrase(en).split(/\s+/).filter((w) => !STOP.has(w.toLowerCase()));
  return words.reduce((best, w) => (w.length > best.length ? w : best), words[0] ?? plainPhrase(en));
}

function blankQuestion(item: Item): Extract<Question, { type: 'blank' }> {
  const word = keyWord(item.phrase.en);
  const re = new RegExp(`(^|[^A-Za-z'])(${escapeRe(word)})(?=$|[^A-Za-z'])`, 'i');
  const sentences = [...item.unit.sentences].sort(
    (a, b) => Number(b.phraseIds.includes(item.phrase.id)) - Number(a.phraseIds.includes(item.phrase.id)),
  );
  for (const s of sentences) {
    const m = re.exec(s.en);
    if (m) {
      const start = m.index + m[1].length;
      return { type: 'blank', item, before: s.en.slice(0, start), after: s.en.slice(start + m[2].length), answer: m[2] };
    }
  }
  const text = plainPhrase(item.phrase.en);
  const m = re.exec(text)!;
  const start = m.index + m[1].length;
  return { type: 'blank', item, before: text.slice(0, start), after: text.slice(start + m[2].length), answer: m[2] };
}

function options(answer: string, sameUnit: string[], others: string[], rng: Rng): string[] {
  const seen = new Set([answer]);
  const picked: string[] = [];
  for (const pool of [shuffle(sameUnit, rng), shuffle(others, rng)]) {
    for (const o of pool) {
      if (picked.length === 3) break;
      if (!seen.has(o)) {
        seen.add(o);
        picked.push(o);
      }
    }
  }
  return shuffle([answer, ...picked], rng);
}

/** Without speech output, listening exercises become their reading equivalents. */
const NO_AUDIO: Partial<Record<ExerciseType, ExerciseType>> = { 'listen-vi': 'choice-en', dictation: 'type' };

export function buildQuestion(item: Item, type: ExerciseType, units: Unit[], rng: Rng = Math.random, canListen = true): Question {
  if (!canListen) type = NO_AUDIO[type] ?? type;
  // Ordering one or two words is a giveaway, so short phrases get a fill-in-the-blank instead.
  if (type === 'scramble' && plainPhrase(item.phrase.en).split(/\s+/).length < 3) type = 'blank';
  const others = units.filter((u) => u.id !== item.unit.id).flatMap((u) => u.phrases);
  switch (type) {
    case 'choice-en': {
      const answer = plainPhrase(item.phrase.en);
      return { type, item, answer, options: options(answer, item.unit.phrases.map((p) => plainPhrase(p.en)), others.map((p) => plainPhrase(p.en)), rng) };
    }
    case 'listen-vi':
      return { type, item, answer: item.phrase.vi, options: options(item.phrase.vi, item.unit.phrases.map((p) => p.vi), others.map((p) => p.vi), rng) };
    case 'scramble': {
      const words = plainPhrase(item.phrase.en).split(/\s+/);
      let tiles = shuffle(words, rng);
      for (let i = 0; i < 5 && words.length > 1 && tiles.join(' ') === words.join(' '); i++) tiles = shuffle(words, rng);
      return { type, item, tiles };
    }
    case 'blank':
      return blankQuestion(item);
    default:
      return { type, item };
  }
}

/** Picks the weakest phrases and gives each an exercise from its level band, alternating types. */
export function planSession(items: Item[], n: number, units: Unit[], rng: Rng = Math.random, canListen = true): Question[] {
  const offset = Math.floor(rng() * 2);
  return shuffle(pickItems(items, n), rng).map((item, i) => {
    const band = BANDS[bandOf(item.mastery.level)];
    return buildQuestion(item, band[(i + offset) % band.length], units, rng, canListen);
  });
}
