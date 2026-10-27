import { BookOpen, Home, Layers, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'Trang chủ', icon: Home, end: true },
  { to: '/bai-hoc', label: 'Bài học', icon: BookOpen, end: false },
  { to: '/on-tap', label: 'Ôn tập', icon: Layers, end: true },
  { to: '/cai-dat', label: 'Cài đặt', icon: Settings, end: true },
];

export default function BottomNav() {
  return (
    <nav aria-label="Điều hướng chính" className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur">
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-0.5 pt-1.5 text-xs font-semibold transition-colors ${
                  isActive ? 'text-primary' : 'text-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors ${isActive ? 'bg-primary-soft' : ''}`}>
                    <Icon size={22} strokeWidth={isActive ? 2.4 : 2} aria-hidden />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
