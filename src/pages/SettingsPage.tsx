import { Download, FileUp, Trash2, Upload, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useUi } from '../components/ui';
import { checkBackup, exportBackup, importBackup, wipeAll } from '../lib/backup';
import { dateKey } from '../lib/dates';
import { setMeta, updateSettings, useMeta, useSettings } from '../lib/settings';
import { englishVoices, onVoicesChanged, speak, ttsSupported } from '../lib/speech';

export default function SettingsPage() {
  const settings = useSettings();
  const lastBackup = useMeta<number>('lastBackup');
  const { confirm, toast } = useUi();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => englishVoices());
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => onVoicesChanged(() => setVoices(englishVoices())), []);

  const doExport = async () => {
    setBusy(true);
    try {
      const name = `hoc-cum-tu-sao-luu-${dateKey()}.json`;
      const blob = new Blob([JSON.stringify(await exportBackup())], { type: 'application/json' });
      const file = new File([blob], name, { type: 'application/json' });
      // Installed iOS apps ignore download links, so prefer the share sheet ("Lưu vào Tệp").
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: name });
        } catch (e) {
          if ((e as DOMException).name === 'AbortError') return toast('Đã hủy xuất sao lưu');
          throw e;
        }
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      await setMeta('lastBackup', Date.now());
      toast('Đã xuất file sao lưu');
    } catch {
      toast('Xuất sao lưu thất bại, hãy thử lại');
    } finally {
      setBusy(false);
    }
  };

  const doImport = async (file: File) => {
    let data: unknown;
    try {
      data = JSON.parse(await file.text());
    } catch {
      return toast('File không phải sao lưu hợp lệ');
    }
    if (!checkBackup(data)) return toast('File không phải sao lưu của ứng dụng này');
    const ok = await confirm({
      title: 'Khôi phục từ sao lưu?',
      message: `Toàn bộ dữ liệu hiện tại sẽ được thay bằng bản sao lưu ngày ${new Date(data.exportedAt).toLocaleDateString('vi-VN')}.`,
      confirmText: 'Khôi phục',
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await importBackup(data);
      toast('Đã khôi phục dữ liệu');
    } catch {
      toast('Khôi phục thất bại, dữ liệu cũ được giữ nguyên');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Cài đặt" />

      <section className="card mb-4 space-y-4 p-5" aria-labelledby="voice-h">
        <h2 id="voice-h" className="text-lg font-bold">Giọng đọc</h2>
        {!ttsSupported ? (
          <p className="text-muted">Trình duyệt này không hỗ trợ đọc văn bản.</p>
        ) : (
          <>
            <div>
              <label className="label" htmlFor="voice">Giọng tiếng Anh</label>
              <select id="voice" className="input" value={settings.voiceURI} onChange={(e) => updateSettings({ voiceURI: e.target.value })}>
                <option value="">Mặc định (en-US)</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="rate">Tốc độ đọc thường: {settings.rate.toFixed(1)}×</label>
              <input
                id="rate" type="range" min={0.6} max={1.3} step={0.1} value={settings.rate}
                onChange={(e) => updateSettings({ rate: Number(e.target.value) })}
                className="h-11 w-full accent-[var(--color-primary)]"
              />
              <p className="text-sm text-muted">Nút “Nghe chậm” luôn đọc ở 0.7×.</p>
            </div>
            <button className="btn btn-soft w-full" onClick={() => speak('Good morning! I usually wake up at 7 a.m.', settings)}>
              <Volume2 size={18} aria-hidden /> Nghe thử
            </button>
          </>
        )}
      </section>

      <section className="card mb-4 p-5" aria-labelledby="review-h">
        <h2 id="review-h" className="mb-3 text-lg font-bold">Ôn tập</h2>
        <label className="label" htmlFor="newPerDay">Số thẻ mới mỗi ngày</label>
        <input
          id="newPerDay" type="number" inputMode="numeric" min={1} max={100} className="input"
          value={settings.newPerDay}
          onChange={(e) => {
            const n = Math.round(Number(e.target.value));
            if (n >= 1 && n <= 100) updateSettings({ newPerDay: n });
          }}
        />
        <p className="mt-1 text-sm text-muted">Gợi ý 10–15 thẻ. Ôn trong một bài học thì không bị giới hạn.</p>
        <fieldset className="mt-5">
          <legend className="label">Cách ôn tập</legend>
          <div className="grid grid-cols-2 gap-2">
            {([['self', 'Tự chấm', 'Lật thẻ rồi tự chọn Quên/Khó/Nhớ/Dễ'], ['type', 'Gõ đáp án', 'Gõ cụm từ, app tự chấm']] as const).map(([value, label, hint]) => (
              <label key={value} className={`flex cursor-pointer flex-col rounded-2xl border-2 p-3 ${settings.reviewMode === value ? 'border-primary bg-primary-soft' : 'border-line'}`}>
                <span className="flex items-center gap-2 font-semibold">
                  <input type="radio" name="reviewMode" value={value} checked={settings.reviewMode === value} onChange={() => updateSettings({ reviewMode: value })} className="h-4 w-4 accent-[var(--color-primary)]" />
                  {label}
                </span>
                <span className="mt-1 text-xs text-muted">{hint}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="card mb-4 p-5" aria-labelledby="practice-h">
        <h2 id="practice-h" className="mb-3 text-lg font-bold">Học thuộc</h2>
        <label className="label" htmlFor="practiceSize">Số câu mỗi phiên luyện: {settings.practiceSize}</label>
        <input
          id="practiceSize" type="range" min={5} max={30} step={5} value={settings.practiceSize}
          onChange={(e) => updateSettings({ practiceSize: Number(e.target.value) })}
          className="h-11 w-full accent-[var(--color-primary)]"
        />
      </section>

      <section id="sao-luu" className="card mb-4 space-y-3 p-5" aria-labelledby="backup-h">
        <h2 id="backup-h" className="text-lg font-bold">Sao lưu dữ liệu</h2>
        <p className="text-sm text-muted">
          Dữ liệu chỉ lưu trên máy này. Hãy xuất sao lưu thường xuyên (gồm tiến độ, câu bạn viết và bản ghi âm).
          {' '}Lần sao lưu gần nhất: <strong>{lastBackup ? new Date(lastBackup).toLocaleDateString('vi-VN') : 'chưa có'}</strong>.
        </p>
        <button className="btn btn-primary w-full" onClick={doExport} disabled={busy}>
          <Download size={18} aria-hidden /> Xuất sao lưu
        </button>
        <button className="btn btn-ghost w-full" onClick={() => fileRef.current?.click()} disabled={busy}>
          <Upload size={18} aria-hidden /> Nhập sao lưu
        </button>
        <input
          ref={fileRef} type="file" accept="application/json,.json" className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void doImport(f);
          }}
        />
      </section>

      <section className="card mb-4 space-y-3 p-5" aria-labelledby="data-h">
        <h2 id="data-h" className="text-lg font-bold">Bài học</h2>
        <Link to="/nhap-bai" className="btn btn-ghost w-full">
          <FileUp size={18} aria-hidden /> Nhập dữ liệu bài mới
        </Link>
        <button
          className="btn btn-danger w-full"
          disabled={busy}
          onClick={async () => {
            const ok = await confirm({
              title: 'Xóa toàn bộ dữ liệu?',
              message: 'Tiến độ, câu bạn viết, bản ghi âm và bài đã nhập sẽ bị xóa vĩnh viễn. Hãy xuất sao lưu trước nếu cần.',
              confirmText: 'Xóa hết',
              danger: true,
            });
            if (!ok) return;
            await wipeAll();
            await setMeta('firstUseAt', Date.now());
            toast('Đã xóa toàn bộ dữ liệu');
          }}
        >
          <Trash2 size={18} aria-hidden /> Xóa toàn bộ dữ liệu
        </button>
      </section>
    </>
  );
}
