import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import { useData } from '../../DataProvider';
import type { Intention } from '../../types';

const ordinalSuffixes: Partial<Record<Intl.LDMLPluralRule, string>> = {
  one: 'st',
  two: 'nd',
  few: 'rd',
};

function ordinal(n: number): string {
  const rule = new Intl.PluralRules('en-US', { type: 'ordinal' }).select(n);
  return `${n}${ordinalSuffixes[rule] ?? 'th'}`;
}

function statusNote(status: Intention['status']): string {
  if (status === 'kept') return 'a promise you keep';
  if (status === 'drifting') return 'still drifting';
  return 'quietly dropped';
}

const statusDot: Record<Intention['status'], string> = {
  kept: 'bg-emerald-300',
  drifting: 'bg-amber-300',
  dropped: 'bg-slate-300',
};

/** Todo-like utterances gently surfaced — noticed, never nagging. */
export default function IntentionsCard({ date }: { date: string }) {
  const { derived, segmentById } = useData();

  const todays = derived.intentions
    .map((intention) => ({
      intention,
      ids: intention.segmentIds.filter((id) => id.startsWith(date)),
    }))
    .filter(({ ids }) => ids.length > 0);

  return (
    <Card>
      <h2 className="text-xs lowercase tracking-[0.24em] text-slate-400">things you mentioned</h2>
      {todays.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          no promises surfaced today — the quiet kind of day.
        </p>
      ) : (
        <ul className="mt-4 space-y-5">
          {todays.map(({ intention, ids }) => {
            const nthThisMonth = intention.segmentIds.indexOf(ids[0]) + 1;
            return (
              <li key={intention.key}>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot[intention.status]}`}
                    title={intention.status}
                    aria-hidden
                  />
                  <p className="text-sm text-slate-600">{intention.label}</p>
                </div>
                <p className="mt-1 pl-3.5 text-xs leading-relaxed text-slate-400">
                  came up for the {ordinal(nthThisMonth)} time this month ·{' '}
                  {statusNote(intention.status)}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5 pl-3.5">
                  {ids.map((id) => (
                    <Link
                      key={id}
                      to={{ search: `seg=${encodeURIComponent(id)}` }}
                      className="rounded-full bg-mist px-2.5 py-0.5 text-xs tabular-nums text-slate-500 transition-colors hover:bg-sky-pale/70 hover:text-deep"
                    >
                      {segmentById.get(id)?.time ?? id}
                    </Link>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
