import { Link } from 'react-router-dom';
import { useData } from '../../DataProvider';
import type { Person } from '../../types';

interface PersonPanelProps {
  person: Person;
  onClose: () => void;
}

// Side panel: the actual segments mentioning the selected person, as time-stamped quotes.
export default function PersonPanel({ person, onClose }: PersonPanelProps) {
  const { segmentById } = useData();
  const segments = person.segmentIds
    .map((id) => segmentById.get(id))
    .filter((segment) => segment !== undefined);

  return (
    <aside className="flex h-[460px] w-full flex-col rounded-2xl border border-slate-100 bg-white shadow-[0_1px_12px_rgba(148,163,184,0.08)] lg:w-80">
      <header className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="font-display text-lg lowercase text-slate-700">{person.name}</h3>
          <p className="text-xs lowercase text-slate-400">
            {person.relation} · {segments.length} mentions
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="close panel"
          className="rounded-full px-2 py-0.5 text-slate-300 transition-colors hover:bg-mist hover:text-slate-500"
        >
          ×
        </button>
      </header>
      <ul className="flex-1 space-y-1 overflow-y-auto p-3">
        {segments.map((segment) => (
          <li key={segment.id}>
            <Link
              to={`/day/${segment.date}?seg=${encodeURIComponent(segment.id)}`}
              className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-mist"
            >
              <p className="text-[11px] tracking-wide text-slate-400">
                {segment.date} · {segment.time}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">“{segment.transcript}”</p>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
