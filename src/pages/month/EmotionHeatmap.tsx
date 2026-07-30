import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import { useData } from '../../DataProvider';
import { emotionHex } from '../../lib/colors';
import { formatShortDate } from '../../lib/dates';

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/**
 * 28-day grid: each cell tinted by the day's dominant emotion, intensity from
 * mean prosody. Deterministic — no LLM involved.
 */
export default function EmotionHeatmap() {
  const { derived } = useData();

  const { cells, legend } = useMemo(() => {
    const prosodies = derived.days.map((d) => d.meanProsody);
    const min = Math.min(...prosodies);
    const max = Math.max(...prosodies);
    const span = max - min || 1;

    const cells = derived.days.map((day) => ({
      day,
      color: emotionHex(day.dominantEmotion),
      intensity: 0.25 + 0.65 * ((day.meanProsody - min) / span),
    }));

    const seen = new Map<string, string>();
    for (const day of derived.days) {
      if (day.dominantEmotion && !seen.has(day.dominantEmotion)) {
        seen.set(day.dominantEmotion, emotionHex(day.dominantEmotion));
      }
    }
    return { cells, legend: [...seen.entries()] };
  }, [derived]);

  return (
    <Card>
      <h2 className="text-xs lowercase tracking-[0.24em] text-slate-400">the month's rhythm</h2>
      <div className="mt-5 grid grid-cols-7 gap-1.5 text-center">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday} className="pb-1 text-[10px] lowercase tracking-wide text-slate-300">
            {weekday}
          </span>
        ))}
        {cells.map(({ day, color, intensity }) => (
          <Link
            key={day.date}
            to={`/day/${day.date}`}
            className="group relative aspect-square rounded-xl transition-transform duration-200 hover:scale-105"
            style={{ backgroundColor: color }}
            aria-label={`${formatShortDate(day.date)} — ${day.dominantEmotion ?? 'untagged'}`}
          >
            <span
              className="absolute inset-0 rounded-xl bg-white"
              style={{ opacity: 1 - intensity }}
              aria-hidden
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-2xl border border-white/70 bg-white/90 px-3 py-2 text-left shadow-[0_8px_28px_rgba(148,163,184,0.18)] backdrop-blur group-hover:block">
              <span className="block text-xs font-medium lowercase text-slate-600">
                {day.day} · {formatShortDate(day.date)}
              </span>
              <span className="block text-xs lowercase text-slate-400">
                {day.dominantEmotion ? `mostly ${day.dominantEmotion}` : 'no tagged emotions'} ·{' '}
                {day.segmentCount} moments · prosody {day.meanProsody.toFixed(2)}
              </span>
            </span>
          </Link>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5">
        {legend.map(([label, color]) => (
          <span key={label} className="flex items-center gap-1.5 text-xs lowercase text-slate-400">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
            {label}
          </span>
        ))}
      </div>
    </Card>
  );
}
