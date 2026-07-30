import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
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

  // Land at the top of each page; in-page anchors (?seg=) handle their own scroll.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

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
        <main className="mx-auto w-full max-w-5xl px-6 pt-28 pb-16">
          <AppRoutes />
        </main>
        <footer className="mx-auto w-full max-w-5xl px-6 pb-10">
          <div className="border-t border-slate-100 pt-6 text-center text-xs leading-relaxed text-slate-400">
            <p>a month, witnessed — every word here comes from your own voice.</p>
            <p className="mt-1">
              your data stays in this browser ·{' '}
              <Link
                to="/future"
                className="underline decoration-slate-200 underline-offset-2 transition-colors hover:text-slate-600"
              >
                export or erase it anytime
              </Link>
            </p>
          </div>
        </footer>
      </BrowserRouter>
    </DataProvider>
  );
}
