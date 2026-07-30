import { useParams } from 'react-router-dom';
import { useData } from '../DataProvider';
import Card from '../components/Card';
import EmotionChip from '../components/EmotionChip';

// Placeholder shell — Workstream B builds the full day view against this route.
export default function DayView() {
  const { date } = useParams();
  const { derived } = useData();
  const day = derived.days.find((d) => d.date === date);

  if (!day) {
    return (
      <Card className="mx-auto max-w-xl text-center">
        <p className="text-slate-500">no memories for {date} — the month runs 2026-05-11 to 2026-06-07.</p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <p className="text-sm lowercase tracking-widest text-slate-400">day</p>
        <h1 className="mt-1 text-3xl font-light text-slate-700">
          {day.day} · {day.date}
        </h1>
      </header>
      <Card>
        <p className="text-slate-500">
          {day.segmentCount} moments captured
          {day.dominantEmotion ? ' — mostly ' : ''}
          {day.dominantEmotion && <EmotionChip label={day.dominantEmotion} />}
        </p>
        <p className="mt-3 text-sm text-slate-400">
          the full day view — letter, timeline, energy arc, intentions — arrives with workstream B.
        </p>
      </Card>
    </div>
  );
}
