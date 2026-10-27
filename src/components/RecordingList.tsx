import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '../lib/db';
import type { Recording } from '../lib/types';
import { useUi } from './ui';

function AudioPlayer({ blob }: { blob: Blob }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url ? <audio controls src={url} className="h-10 w-full" preload="metadata" /> : null;
}

const fmtDate = (ms: number) =>
  new Date(ms).toLocaleString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function RecordingList({ items, empty }: { items: Recording[]; empty: string }) {
  const { confirm, toast } = useUi();
  if (!items.length) return <p className="text-muted">{empty}</p>;
  return (
    <ul className="space-y-3">
      {items.map((r) => (
        <li key={r.id} className="rounded-2xl bg-surface-2 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{fmtDate(r.createdAt)} · {r.seconds} giây</span>
            <button
              className="btn h-10 w-10 p-0 text-danger"
              aria-label="Xóa bản ghi"
              onClick={async () => {
                if (await confirm({ title: 'Xóa bản ghi này?', message: 'Bản ghi sẽ bị xóa vĩnh viễn.', confirmText: 'Xóa', danger: true })) {
                  await db.recordings.delete(r.id!);
                  toast('Đã xóa bản ghi');
                }
              }}
            >
              <Trash2 size={18} aria-hidden />
            </button>
          </div>
          <AudioPlayer blob={r.blob} />
        </li>
      ))}
    </ul>
  );
}
