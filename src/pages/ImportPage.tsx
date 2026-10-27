import { AlertCircle, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useUi } from '../components/ui';
import { db } from '../lib/db';
import { BUILTIN_UNITS } from '../lib/units';
import { parseUnitText } from '../lib/validate-unit';

export default function ImportPage() {
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const { confirm, toast } = useUi();
  const navigate = useNavigate();
  const custom = useLiveQuery(() => db.customUnits.toArray(), []);

  const submit = async () => {
    const { unit, errors } = parseUnitText(text.trim());
    setErrors(errors);
    if (!unit) return;
    const exists = BUILTIN_UNITS.some((u) => u.id === unit.id) || (await db.customUnits.get(unit.id));
    if (exists) {
      const ok = await confirm({
        title: `Thay thế bài "${unit.id}"?`,
        message: 'Đã có bài với id này. Bài cũ sẽ được thay bằng dữ liệu mới; tiến độ của các cụm từ cùng id vẫn được giữ.',
        confirmText: 'Thay thế',
      });
      if (!ok) return;
    }
    await db.customUnits.put({ id: unit.id, data: unit, importedAt: Date.now() });
    toast(`Đã thêm bài “${unit.title}”`);
    navigate(`/bai-hoc/${unit.id}`);
  };

  return (
    <>
      <PageHeader title="Nhập bài mới" subtitle="Dán dữ liệu JSON của một bài" back="/bai-hoc" />
      <div className="card mb-4 p-5">
        <p className="text-sm text-muted">
          Chụp ảnh các trang sách, gửi cho ChatGPT hoặc Claude kèm câu lệnh chuyển ảnh thành JSON, rồi dán kết quả vào đây.
          Định dạng giống file <code className="rounded bg-surface-2 px-1">unit-01.json</code>.
        </p>
        <label className="label mt-4" htmlFor="unit-json">Dữ liệu bài (JSON)</label>
        <textarea
          id="unit-json"
          className="input min-h-64 font-mono text-sm"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          placeholder='{ "id": "c1-u02", "chapter": 1, ... }'
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-describedby={errors.length ? 'unit-errors' : undefined}
          aria-invalid={errors.length > 0}
        />
        {errors.length > 0 && (
          <div id="unit-errors" role="alert" className="mt-3 rounded-2xl bg-danger-soft p-4 text-sm text-danger">
            <p className="mb-1 flex items-center gap-2 font-bold"><AlertCircle size={18} aria-hidden /> Dữ liệu chưa hợp lệ:</p>
            <ul className="list-disc space-y-0.5 pl-5">
              {errors.slice(0, 12).map((e) => <li key={e}>{e}</li>)}
              {errors.length > 12 && <li>… và {errors.length - 12} lỗi khác</li>}
            </ul>
          </div>
        )}
        <button className="btn btn-primary mt-4 w-full" disabled={!text.trim()} onClick={submit}>Kiểm tra và thêm bài</button>
      </div>

      <section className="card p-5" aria-labelledby="custom-h">
        <h2 id="custom-h" className="mb-3 text-lg font-bold">Bài đã nhập</h2>
        {!custom?.length ? (
          <p className="text-muted">Chưa có bài nào được nhập.</p>
        ) : (
          <ul className="space-y-2">
            {custom.map((c) => (
              <li key={c.id} className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{c.data.title}</p>
                  <p className="text-sm text-muted">{c.id} · {c.data.phrases.length} cụm từ</p>
                </div>
                <button
                  className="btn h-11 w-11 p-0 text-danger"
                  aria-label={`Xóa bài ${c.data.title}`}
                  onClick={async () => {
                    const ok = await confirm({ title: `Xóa bài “${c.data.title}”?`, message: 'Bài và thẻ ôn tập của bài sẽ bị xóa. Câu bạn viết và bản ghi âm vẫn được giữ.', confirmText: 'Xóa', danger: true });
                    if (!ok) return;
                    await db.transaction('rw', db.customUnits, db.cards, async () => {
                      await db.customUnits.delete(c.id);
                      if (!BUILTIN_UNITS.some((u) => u.id === c.id)) await db.cards.where('unitId').equals(c.id).delete();
                    });
                    toast('Đã xóa bài');
                  }}
                >
                  <Trash2 size={18} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
