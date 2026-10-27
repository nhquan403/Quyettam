import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PageHeader({ title, subtitle, back, action }: { title: string; subtitle?: ReactNode; back?: string; action?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <header className="mb-5 flex items-start gap-2">
      {back && (
        <button className="btn btn-ghost -ml-1 h-11 w-11 shrink-0 p-0" aria-label="Quay lại" onClick={() => navigate(back)}>
          <ChevronLeft size={24} aria-hidden />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl leading-tight font-bold">{title}</h1>
        {subtitle && <p className="mt-0.5 text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
