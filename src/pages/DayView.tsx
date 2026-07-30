import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import Card from '../components/Card';
import EmotionChip from '../components/EmotionChip';
import { useData } from '../DataProvider';
import { DEFAULT_DATE, formatLongDate } from '../lib/dates';
import AcousticArc from './day/AcousticArc';
import DailyLetterCard from './day/DailyLetterCard';
import DayPicker from './day/DayPicker';
import IntentionsCard from './day/IntentionsCard';
import SegmentTimeline from './day/SegmentTimeline';

export default function DayView() {
  const { date } = useParams();
  const { derived, segments } = useData();
  const day = derived.days.find((d) => d.date === date);
  const daySegments = useMemo(
    () => segments.filter((segment) => segment.date === date),
    [segments, date],
  );

  if (!date || !day) {
    return (
      <Card className="mx-auto max-w-xl text-center">
        <p className="text-slate-500">
          no memories for {date} — the month runs 2026-05-11 to 2026-06-07.
        </p>
        <Link
          to={`/day/${DEFAULT_DATE}`}
          className="mt-4 inline-block rounded-full bg-sky-pale/70 px-4 py-2 text-sm text-deep transition-opacity hover:opacity-80"
        >
          back to the first day
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-10">
      <header className="text-center">
        <p className="text-xs lowercase tracking-[0.24em] text-slate-400">day</p>
        <h1 className="mt-2 text-3xl font-light text-slate-700 sm:text-4xl">
          {formatLongDate(day.date)}
        </h1>
        <p className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-400">
          {day.segmentCount} moments captured
          {day.dominantEmotion && (
            <>
              <span aria-hidden>·</span>
              <span className="flex items-center gap-1.5">
                mostly <EmotionChip label={day.dominantEmotion} />
              </span>
            </>
          )}
        </p>
      </header>

      <DayPicker days={derived.days} selectedDate={day.date} />

      <DailyLetterCard date={day.date} />

      <AcousticArc hourly={day.hourly} />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_310px]">
        <SegmentTimeline segments={daySegments} />
        <div className="lg:sticky lg:top-24">
          <IntentionsCard date={day.date} />
        </div>
      </div>
    </div>
  );
}
