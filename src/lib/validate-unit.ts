import type { Unit } from './types';

const SAFE_ID = /^[a-z0-9-]+$/i;
const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

/** Validates pasted unit JSON and returns Vietnamese error messages (empty = valid). */
export function validateUnit(input: unknown): { unit?: Unit; errors: string[] } {
  const errors: string[] = [];
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { errors: ['Dữ liệu phải là một đối tượng JSON { ... } mô tả một bài.'] };
  }
  const u = input as Record<string, unknown>;
  if (!isStr(u.id)) errors.push('Thiếu "id" của bài (ví dụ "c1-u02").');
  else if (!SAFE_ID.test(u.id)) errors.push('"id" của bài chỉ được gồm chữ không dấu, số và dấu gạch ngang (ví dụ "c1-u02").');
  if (typeof u.chapter !== 'number') errors.push('"chapter" phải là số (ví dụ 1).');
  if (!isStr(u.chapterTitle)) errors.push('Thiếu "chapterTitle" (tên chương).');
  if (typeof u.unit !== 'number') errors.push('"unit" phải là số (ví dụ 2).');
  if (!isStr(u.title)) errors.push('Thiếu "title" (tên bài).');

  const ids = new Set<string>();
  if (!Array.isArray(u.phrases) || u.phrases.length === 0) {
    errors.push('"phrases" phải là danh sách có ít nhất 1 cụm từ.');
  } else {
    u.phrases.forEach((p, i) => {
      const at = `Cụm từ thứ ${i + 1}`;
      if (typeof p !== 'object' || p === null) return errors.push(`${at} không hợp lệ.`);
      const ph = p as Record<string, unknown>;
      for (const f of ['id', 'en', 'vi', 'emoji', 'situation']) {
        if (!isStr(ph[f])) errors.push(`${at} thiếu trường "${f}".`);
      }
      if (ph.variants !== undefined && (!Array.isArray(ph.variants) || !ph.variants.every(isStr))) {
        errors.push(`${at}: "variants" phải là danh sách chữ.`);
      }
      if (isStr(ph.id)) {
        if (!SAFE_ID.test(ph.id)) errors.push(`${at}: id "${ph.id}" chỉ được gồm chữ không dấu, số và dấu gạch ngang.`);
        if (ids.has(ph.id)) errors.push(`${at}: id "${ph.id}" bị trùng.`);
        ids.add(ph.id);
      }
    });
  }

  if (!Array.isArray(u.sentences)) {
    errors.push('"sentences" phải là danh sách (có thể rỗng []).');
  } else {
    u.sentences.forEach((s, i) => {
      const at = `Câu ví dụ thứ ${i + 1}`;
      if (typeof s !== 'object' || s === null) return errors.push(`${at} không hợp lệ.`);
      const se = s as Record<string, unknown>;
      if (!isStr(se.en)) errors.push(`${at} thiếu "en".`);
      if (!isStr(se.vi)) errors.push(`${at} thiếu "vi".`);
      if (!Array.isArray(se.phraseIds)) errors.push(`${at}: "phraseIds" phải là danh sách.`);
      else se.phraseIds.forEach((pid) => {
        if (!ids.has(pid as string)) errors.push(`${at}: "phraseIds" chứa "${String(pid)}" không có trong danh sách cụm từ.`);
      });
    });
  }

  return errors.length ? { errors } : { unit: input as Unit, errors };
}

/** Parses JSON text, mapping syntax errors to a readable Vietnamese message. */
export function parseUnitText(text: string): { unit?: Unit; errors: string[] } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { errors: [`JSON bị lỗi cú pháp: ${(e as Error).message}. Hãy kiểm tra dấu ngoặc, dấu phẩy và dấu nháy.`] };
  }
  return validateUnit(data);
}
