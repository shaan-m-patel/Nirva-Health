import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import { useData } from '../../DataProvider';
import { formatShortDate } from '../../lib/dates';

/**
 * The month's storylines as horizontal arcs — one dot per active day, sized by
 * how much the thread came up. Clicking a dot opens that day.
 */
export default function ThreadTimeline() {
  const { derived } = useData();
  const navigate = useNavigate();
  const dates = useMemo(() => derived.days.map((d) => d.date), [derived]);

  const rows = useMemo(
    () =>
      derived.threads.map((thread) => {
        const countByDate = new Map<string, number>();
        for (const id of thread.segmentIds) {
          const date = id.slice(0, 10);
          countByDate.set(date, (countByDate.get(date) ?? 0) + 1);
        }
        const activeDates = dates.filter((d) => countByDate.has(d));
        return {
          thread,
          countByDate,
          firstIndex: dates.indexOf(activeDates[0] ?? dates[0]),
          lastIndex: dates.indexOf(activeDates[activeDates.length - 1] ?? dates[0]),
        };
      }),
    [derived, dates],
  );

  return (
    <Card>
      <h2 className="text-xs lowercase tracking-[0.24em] text-slate-400">
        the month's storylines
      </h2>
      <div className="mt-6 space-y-5">
        {rows.map(({ thread, countByDate, firstIndex, lastIndex }) => (
          <div
            key={thread.key}
            className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[10rem_1fr] sm:gap-4"
          >
            <div title={thread.description}>
              <p className="text-sm text-slate-600">{thread.title}</p>
              <p className="text-xs text-slate-400">{thread.segmentIds.length} moments</p>
            </div>
            <div className="relative h-8">
              {/* Arc span: a soft line from the thread's first to last day */}
              <div
                className="absolute top-1/2 h-px -translate-y-1/2 rounded-full bg-gradient-to-r from-sky-pale via-sky-soft to-sky-pale"
                style={{
                  left: `${((firstIndex + 0.5) / dates.length) * 100}%`,
                  right: `${((dates.length - lastIndex - 0.5) / dates.length) * 100}%`,
                }}
                aria-hidden
              />
              <div
                className="absolute inset-0 grid"
                style={{ gridTemplateColumns: `repeat(${dates.length}, minmax(0, 1fr))` }}
              >
                {dates.map((date) => {
                  const count = countByDate.get(date);
                  if (!count) return <span key={date} />;
                  const size = Math.min(6 + count * 2, 16);
                  return (
                    <span key={date} className="relative">
                      <button
                        type="button"
                        onClick={() => navigate(`/day/${date}`)}
                        title={`${formatShortDate(date)} · ${count} moment${count === 1 ? '' : 's'}`}
                        aria-label={`${thread.title} on ${formatShortDate(date)}`}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-mid/60 transition-all duration-200 hover:scale-125 hover:bg-deep"
                        style={{ width: size, height: size }}
                      />
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 hidden grid-cols-[10rem_1fr] gap-4 sm:grid">
        <span />
        <div className="flex justify-between text-[10px] lowercase tracking-wide text-slate-300">
          {derived.weeks.map((week) => (
            <span key={week.index}>{formatShortDate(week.start)}</span>
          ))}
          <span>{formatShortDate(dates[dates.length - 1])}</span>
        </div>
      </div>
    </Card>
  );
}
