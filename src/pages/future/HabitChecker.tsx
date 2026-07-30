import { useData } from '../../DataProvider';
import Card from '../../components/Card';
import type { Intention } from '../../types';

const statusTint: Record<Intention['status'], string> = {
  kept: 'bg-emerald-50 text-emerald-600',
  drifting: 'bg-amber-50 text-amber-600',
  dropped: 'bg-rose-50 text-rose-500',
};

const dotTint: Record<Intention['status'], string> = {
  kept: 'bg-emerald-300',
  drifting: 'bg-amber-300',
  dropped: 'bg-rose-300',
};

function HabitCard({ intention, dates }: { intention: Intention; dates: string[] }) {
  const resurfacedDates = new Set(intention.segmentIds.map((id) => id.split('#')[0]));
  const count = intention.segmentIds.length;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base lowercase text-slate-700">{intention.label}</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            resurfaced {count} {count === 1 ? 'time' : 'times'} this month
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs lowercase ${statusTint[intention.status]}`}>
          {intention.status}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-[3px]">
        {dates.map((date) =>
          resurfacedDates.has(date) ? (
            <span key={date} title={date} className={`h-2.5 w-2.5 rounded-full ${dotTint[intention.status]}`} />
          ) : (
            <span key={date} title={date} className="h-1.5 w-1.5 rounded-full bg-slate-200" />
          ),
        )}
      </div>
      <p className="mt-2 text-[10px] tracking-wide text-slate-300">
        {dates[0]} — {dates[dates.length - 1]}
      </p>
    </Card>
  );
}

// One card per self-promise from the real intentions in derived.json.
export default function HabitChecker() {
  const { derived } = useData();
  const dates = derived.days.map((day) => day.date);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {derived.intentions.map((intention) => (
        <HabitCard key={intention.key} intention={intention} dates={dates} />
      ))}
    </div>
  );
}
