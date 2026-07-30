import { useData } from '../DataProvider';
import Card from '../components/Card';

// Placeholder shell — Workstream E builds the four previews against this route.
export default function ComingSoon() {
  const { derived } = useData();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <p className="text-sm lowercase tracking-widest text-slate-400">future</p>
        <h1 className="mt-1 text-3xl font-light text-slate-700">what nirva is growing toward</h1>
      </header>
      <Card>
        <p className="text-slate-500">
          {derived.people.length} relationships mapped · {derived.intentions.length} self-promises tracked
        </p>
        <p className="mt-3 text-sm text-slate-400">
          the relationship graph, habit checker, therapist mode, and export &amp; delete previews arrive with
          workstream E.
        </p>
      </Card>
    </div>
  );
}
