// Muted pastel tints per emotion — keep saturation low (see docs/01-product-spec.md).
const tints: Record<string, string> = {
  contentment: 'bg-sky-50 text-sky-700',
  calm: 'bg-sky-50 text-sky-700',
  relief: 'bg-teal-50 text-teal-700',
  hope: 'bg-emerald-50 text-emerald-700',
  gratitude: 'bg-emerald-50 text-emerald-700',
  excitement: 'bg-orange-50 text-orange-600',
  joy: 'bg-amber-50 text-amber-600',
  determination: 'bg-indigo-50 text-indigo-600',
  pride: 'bg-violet-50 text-violet-600',
  curiosity: 'bg-cyan-50 text-cyan-700',
  tenderness: 'bg-pink-50 text-pink-600',
  love: 'bg-pink-50 text-pink-600',
  anxiety: 'bg-amber-50 text-amber-700',
  distress: 'bg-amber-50 text-amber-700',
  worry: 'bg-amber-50 text-amber-700',
  frustration: 'bg-rose-50 text-rose-600',
  annoyance: 'bg-rose-50 text-rose-600',
  anger: 'bg-rose-50 text-rose-600',
  sadness: 'bg-blue-50 text-blue-600',
  grief: 'bg-blue-50 text-blue-600',
  tiredness: 'bg-slate-100 text-slate-500',
  exhaustion: 'bg-slate-100 text-slate-500',
};

export function emotionTint(label: string): string {
  return tints[label.toLowerCase()] ?? 'bg-slate-50 text-slate-500';
}

// Actual CSS colors for the same palette — used where opacity/intensity is
// controlled programmatically (e.g. the month heatmap).
const hexes: Record<string, string> = {
  contentment: '#7dd3fc',
  calm: '#7dd3fc',
  relief: '#5eead4',
  hope: '#6ee7b7',
  gratitude: '#6ee7b7',
  excitement: '#fdba74',
  joy: '#fcd34d',
  determination: '#a5b4fc',
  pride: '#c4b5fd',
  curiosity: '#67e8f9',
  concentration: '#a5f3fc',
  tenderness: '#f9a8d4',
  love: '#f9a8d4',
  anxiety: '#fde68a',
  distress: '#fde68a',
  worry: '#fde68a',
  frustration: '#fda4af',
  annoyance: '#fda4af',
  anger: '#fda4af',
  sadness: '#93c5fd',
  grief: '#93c5fd',
  tiredness: '#cbd5e1',
  exhaustion: '#cbd5e1',
};

export function emotionHex(label: string | null): string {
  if (!label) return '#cbd5e1';
  return hexes[label.toLowerCase()] ?? '#cbd5e1';
}
