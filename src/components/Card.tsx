import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_1px_12px_rgba(148,163,184,0.08)] ${className}`}
    >
      {children}
    </div>
  );
}
