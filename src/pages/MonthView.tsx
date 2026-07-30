import { useData } from '../DataProvider';
import Card from '../components/Card';

// Placeholder shell — Workstream B builds the full month view against this route.
export default function MonthView() {
  const { derived } = useData();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <p className="text-sm lowercase tracking-widest text-slate-400">month</p>
        <h1 className="mt-1 text-3xl font-light text-slate-700">a month, witnessed</h1>
      </header>
      <Card>
        <p className="text-slate-500">
          {derived.days.length} days · {derived.weeks.length} weeks · {derived.threads.length} storylines ·{' '}
          {derived.people.length} people
        </p>
        <p className="mt-3 text-sm text-slate-400">
          weekly letters, thread arcs, the rhythm heatmap, and pattern insights arrive with workstream B.
        </p>
      </Card>
    </div>
  );
}
