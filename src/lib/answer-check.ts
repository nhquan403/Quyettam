export type CheckResult = 'correct' | 'near' | 'wrong';
export type DiffPart = { text: string; wrong: boolean };
export type Check = { result: CheckResult; expected: string; diff: DiffPart[] };

const PRONOUNS = ['my', 'your', 'his', 'her', 'our', 'their', "one's"];

/** Lowercase, unify apostrophes and spacing, treat a.m./p.m. as am/pm, drop trailing . ! ? */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\b([ap])\.\s?m\.?/g, '$1m')
    .replace(/(\d)\s?([ap]m)\b/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!?]+$/, '')
    .trim();
}

/** Every accepted spelling of a target: "(word)" may be omitted, "one's" may be any possessive. */
export function expandTarget(target: string): string[] {
  let forms = [''];
  for (const token of normalize(target).split(' ')) {
    const optional = /^\(.+\)$/.test(token);
    const word = optional ? token.slice(1, -1) : token;
    const choices = word === "one's" ? PRONOUNS : [word];
    const next: string[] = [];
    for (const f of forms) {
      for (const c of choices) next.push(f ? `${f} ${c}` : c);
      if (optional) next.push(f);
    }
    forms = next;
  }
  return [...new Set(forms)];
}

function levenshtein(a: string, b: string): number[][] {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d;
}

/** Marks the characters of `expected` that the learner got wrong or left out. */
function diffAgainst(expected: string, typed: string): DiffPart[] {
  const d = levenshtein(expected, typed);
  const marks: boolean[] = Array(expected.length).fill(false);
  let i = expected.length;
  let j = typed.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (expected[i - 1] === typed[j - 1] ? 0 : 1)) {
      if (expected[i - 1] !== typed[j - 1]) marks[i - 1] = true;
      i--;
      j--;
    } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
      marks[--i] = true; // missing letter
    } else {
      j--; // extra letter typed; mark its neighbour so the spot is visible
      if (i > 0) marks[i - 1] = true;
    }
  }
  const parts: DiffPart[] = [];
  for (let k = 0; k < expected.length; k++) {
    const last = parts[parts.length - 1];
    if (last && last.wrong === marks[k]) last.text += expected[k];
    else parts.push({ text: expected[k], wrong: marks[k] });
  }
  return parts;
}

/**
 * Compares a typed answer with a phrase and its variants. One edit per 8 characters
 * (at least one) counts as "near": the learner knows it but misspelled it.
 */
export function checkAnswer(typed: string, targets: string[]): Check {
  const answer = normalize(typed);
  const display = targets[0];
  const forms = targets.flatMap(expandTarget);
  if (answer && forms.includes(answer)) return { result: 'correct', expected: display, diff: [{ text: display, wrong: false }] };

  let best = { form: forms[0], dist: Infinity };
  for (const form of forms) {
    const dist = levenshtein(form, answer)[form.length][answer.length];
    if (dist < best.dist) best = { form, dist };
  }
  const allowed = Math.max(1, Math.floor(best.form.length / 8));
  if (answer && best.dist <= allowed) return { result: 'near', expected: best.form, diff: diffAgainst(best.form, answer) };
  return { result: 'wrong', expected: display, diff: [{ text: display, wrong: false }] };
}
