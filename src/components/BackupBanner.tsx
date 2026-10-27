import { ShieldAlert } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../lib/db';
import { getMeta } from '../lib/settings';

const WEEK = 7 * 86400000;

export default function BackupBanner() {
  const show = useLiveQuery(async () => {
    if ((await db.cards.count()) === 0) return false;
    const ref = (await getMeta<number>('lastBackup')) ?? (await getMeta<number>('firstUseAt')) ?? Date.now();
    return Date.now() - ref > WEEK;
  }, []);
  if (!show) return null;
  return (
    <Link to="/cai-dat#sao-luu" className="mb-4 flex items-center gap-3 rounded-2xl bg-warn-soft p-4 text-warn-ink">
      <ShieldAlert size={22} className="shrink-0" aria-hidden />
      <span className="text-sm">
        Đã hơn 7 ngày bạn chưa sao lưu. <strong className="underline">Xuất sao lưu ngay</strong> để không mất tiến độ.
      </span>
    </Link>
  );
}
