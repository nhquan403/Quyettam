import { describe, expect, it } from 'vitest';
import unit01 from '../data/unit-01.json';
import { parseUnitText, validateUnit } from './validate-unit';

describe('validateUnit', () => {
  it('accepts the bundled unit', () => {
    expect(validateUnit(unit01).errors).toEqual([]);
  });

  it('reports missing fields, duplicate ids and unknown sentence references in Vietnamese', () => {
    const bad = {
      ...unit01,
      title: '',
      phrases: [unit01.phrases[0], unit01.phrases[0]],
      sentences: [{ en: 'x', vi: 'y', phraseIds: ['khong-co'] }],
    };
    const { errors } = validateUnit(bad);
    expect(errors.some((e) => e.includes('"title"'))).toBe(true);
    expect(errors.some((e) => e.includes('bị trùng'))).toBe(true);
    expect(errors.some((e) => e.includes('khong-co'))).toBe(true);
  });

  it('explains JSON syntax errors', () => {
    expect(parseUnitText('{ "id": ')).toMatchObject({ errors: [expect.stringContaining('cú pháp')] });
  });
});

describe('unit ids', () => {
  it('rejects ids that would break lesson URLs', () => {
    const { errors } = validateUnit({ ...unit01, id: 'c1/u02' });
    expect(errors.some((e) => e.includes('"id" của bài'))).toBe(true);
  });
});
