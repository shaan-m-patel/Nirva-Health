import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import { useData } from '../../DataProvider';
import { formatShortDate } from '../../lib/dates';
import type { DerivedData } from '../../types';

interface Insight {
  key: string;
  title: string;
  body: string;
  link?: { to: string; label: string };
}

// All insights are deterministic reads of derived.json — no LLM involved.
function computeInsights(derived: DerivedData): Insight[] {
  const insights: Insight[] = [];

  // 1. The most-resurfaced promise.
  const topIntention = [...derived.intentions].sort(
    (a, b) => b.segmentIds.length - a.segmentIds.length,
  )[0];
  if (topIntention) {
    const ending = {
      kept: 'and you kept it.',
      drifting: "it's still drifting.",
      dropped: 'it quietly slipped away.',
    }[topIntention.status];
    insights.push({
      key: 'promise',
      title: 'the promise that kept returning',
      body: `"${topIntention.label.toLowerCase()}" came up ${topIntention.segmentIds.length} times this month — ${ending}`,
    });
  }

  // 2. Mornings vs evenings, weighted by segment count across all days.
  let morningSum = 0;
  let morningCount = 0;
  let eveningSum = 0;
  let eveningCount = 0;
  for (const day of derived.days) {
    for (const hour of day.hourly) {
      if (hour.hour < 12) {
        morningSum += hour.prosody * hour.count;
        morningCount += hour.count;
      } else if (hour.hour >= 17) {
        eveningSum += hour.prosody * hour.count;
        eveningCount += hour.count;
      }
    }
  }
  if (morningCount > 0 && eveningCount > 0) {
    const morning = morningSum / morningCount;
    const evening = eveningSum / eveningCount;
    const diff = Math.round(Math.abs((evening - morning) / morning) * 100);
    insights.push({
      key: 'rhythm',
      title: 'mornings and evenings',
      body:
        diff < 3
          ? 'your voice holds a steady energy from morning to evening — an even keel of a month.'
          : evening > morning
            ? `your evenings run about ${diff}% more expressive than your mornings — the day tends to warm up as it goes.`
            : `your mornings run about ${diff}% more expressive than your evenings — the day tends to soften as it goes.`,
    });
  }

  // 3. The month's constant presence.
  const topPerson = [...derived.people].sort((a, b) => b.segmentIds.length - a.segmentIds.length)[0];
  if (topPerson) {
    const dayCount = new Set(topPerson.segmentIds.map((id) => id.slice(0, 10))).size;
    insights.push({
      key: 'presence',
      title: 'the constant presence',
      body: `${topPerson.name} shows up in ${topPerson.segmentIds.length} moments across ${dayCount} of the 28 days — the month's most constant company.`,
    });
  }

  // 4. The most expressive day.
  const peakDay = [...derived.days].sort((a, b) => b.meanProsody - a.meanProsody)[0];
  if (peakDay) {
    insights.push({
      key: 'peak',
      title: 'the most expressive day',
      body: `${formatShortDate(peakDay.date)} carried the most animated voice of the month${
        peakDay.dominantEmotion ? ` — mostly ${peakDay.dominantEmotion}` : ''
      }, across ${peakDay.segmentCount} moments.`,
      link: { to: `/day/${peakDay.date}`, label: 'revisit that day' },
    });
  }

  // 5. The month's prevailing mood.
  const totals = new Map<string, number>();
  for (const day of derived.days) {
    for (const [label, count] of Object.entries(day.emotionCounts)) {
      totals.set(label, (totals.get(label) ?? 0) + count);
    }
  }
  const topMood = [...totals.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topMood) {
    insights.push({
      key: 'mood',
      title: 'the prevailing mood',
      body: `of the moments that carried a clear emotion, ${topMood[0]} led the month with ${topMood[1]} — the undertone beneath the busy days.`,
    });
  }

  return insights;
}

export default function PatternInsights() {
  const { derived } = useData();
  const insights = useMemo(() => computeInsights(derived), [derived]);

  return (
    <section>
      <h2 className="mb-4 text-xs lowercase tracking-[0.24em] text-slate-400">
        patterns nirva noticed
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {insights.map((insight) => (
          <Card key={insight.key} className="p-5">
            <h3 className="text-sm font-medium lowercase text-slate-600">{insight.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{insight.body}</p>
            {insight.link && (
              <Link
                to={insight.link.to}
                className="mt-3 inline-block text-xs lowercase text-deep/80 underline decoration-sky-soft underline-offset-4 transition-colors hover:text-deep"
              >
                {insight.link.label}
              </Link>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}
