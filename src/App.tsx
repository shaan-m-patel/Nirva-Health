import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { DataProvider } from './DataProvider';
import NavBar from './components/NavBar';
import BreathingLoader from './components/BreathingLoader';
import PageTransition from './components/PageTransition';
import { DEFAULT_DATE } from './lib/dates';

const DayView = lazy(() => import('./pages/DayView'));
const MonthView = lazy(() => import('./pages/MonthView'));
const Chat = lazy(() => import('./pages/Chat'));
const MemoryExplainer = lazy(() => import('./pages/MemoryExplainer'));
const ComingSoon = lazy(() => import('./pages/ComingSoon'));

function AppRoutes() {
  const location = useLocation();
  return (
    <PageTransition transitionKey={location.pathname}>
      <Suspense fallback={<BreathingLoader label="loading" />}>
        <Routes location={location}>
          <Route path="/" element={<Navigate to={`/day/${DEFAULT_DATE}`} replace />} />
          <Route path="/day/:date" element={<DayView />} />
          <Route path="/month" element={<MonthView />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/memory" element={<MemoryExplainer />} />
          <Route path="/future" element={<ComingSoon />} />
          <Route path="*" element={<Navigate to={`/day/${DEFAULT_DATE}`} replace />} />
        </Routes>
      </Suspense>
    </PageTransition>
  );
}

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <NavBar />
        <main className="mx-auto w-full max-w-5xl px-6 pt-28 pb-20">
          <AppRoutes />
        </main>
      </BrowserRouter>
    </DataProvider>
  );
}
