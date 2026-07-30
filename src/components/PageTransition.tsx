import type { ReactNode } from 'react';

interface PageTransitionProps {
  transitionKey: string;
  children: ReactNode;
}

/** Gentle fade + rise on route change (animation defined in index.css). */
export default function PageTransition({ transitionKey, children }: PageTransitionProps) {
  return (
    <div key={transitionKey} className="page-enter">
      {children}
    </div>
  );
}
