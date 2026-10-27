import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import { UiProvider } from './components/ui';
import HomePage from './pages/HomePage';
import ImportPage from './pages/ImportPage';
import LessonPage from './pages/LessonPage';
import ReviewPage from './pages/ReviewPage';
import SettingsPage from './pages/SettingsPage';
import UnitsPage from './pages/UnitsPage';
import WeeklyPage from './pages/WeeklyPage';

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <UiProvider>
      <main className="mx-auto min-h-dvh w-full max-w-lg px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-32">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/bai-hoc" element={<UnitsPage />} />
          <Route path="/bai-hoc/:unitId" element={<LessonPage />} />
          <Route path="/on-tap" element={<ReviewPage />} />
          <Route path="/ke-chuyen" element={<WeeklyPage />} />
          <Route path="/cai-dat" element={<SettingsPage />} />
          <Route path="/nhap-bai" element={<ImportPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      <BottomNav />
    </UiProvider>
  );
}
