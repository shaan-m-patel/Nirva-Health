import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { DerivedData, Segment } from './types';
import segmentsJson from './data/segments.json';
import derivedJson from './data/derived.json';

// Statically imported and bundled — the app never fetches or parses the dataset.
const segments = segmentsJson as Segment[];
const derived = derivedJson as unknown as DerivedData;

interface DataContextValue {
  segments: Segment[];
  derived: DerivedData;
  segmentById: Map<string, Segment>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const value = useMemo<DataContextValue>(
    () => ({ segments, derived, segmentById: new Map(segments.map((s) => [s.id, s])) }),
    [],
  );
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside <DataProvider>');
  return ctx;
}
