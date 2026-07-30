import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { DEFAULT_DATE } from '../lib/dates';

const links = [
  { label: 'day', to: `/day/${DEFAULT_DATE}`, match: '/day' },
  { label: 'month', to: '/month', match: '/month' },
  { label: 'chat', to: '/chat', match: '/chat' },
  { label: 'memory', to: '/memory', match: '/memory' },
  { label: 'future', to: '/future', match: '/future' },
];

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b border-slate-100 bg-white/70 backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-3 py-4 sm:px-6">
        <NavLink
          to="/"
          className="flex items-center gap-2 font-display text-base font-medium lowercase tracking-[0.14em] text-slate-700 sm:text-lg sm:tracking-[0.2em]"
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: 'radial-gradient(circle at 40% 35%, #dbeafe, #93c5fd)' }}
            aria-hidden
          />
          nirva
        </NavLink>
        <div className="flex items-center gap-0.5 sm:gap-2">
          {links.map(({ label, to, match }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) => {
                const active = isActive || pathname.startsWith(match);
                return `rounded-full px-2 py-1.5 text-[13px] lowercase transition-colors duration-200 sm:px-4 sm:text-sm ${
                  active
                    ? 'bg-sky-pale/70 text-deep'
                    : 'text-slate-500 hover:bg-mist hover:text-slate-700'
                }`;
              }}
            >
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}
