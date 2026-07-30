import KeyPrompt from '../components/KeyPrompt';
import { useData } from '../DataProvider';
import { useApiKey } from '../llm/client';
import EmotionHeatmap from './month/EmotionHeatmap';
import PatternInsights from './month/PatternInsights';
import ThreadTimeline from './month/ThreadTimeline';
import WeeklyLetterCard from './month/WeeklyLetterCard';

export default function MonthView() {
  const { derived, segments } = useData();
  const apiKey = useApiKey();

  return (
    <div className="space-y-12">
      <header className="text-center">
        <p className="text-xs lowercase tracking-[0.24em] text-slate-400">month</p>
        <h1 className="mt-2 text-3xl font-light text-slate-700 sm:text-4xl">a month, witnessed</h1>
        <p className="mt-3 text-sm text-slate-400">
          may 11 – june 7, 2026 · {segments.length} moments · {derived.threads.length} storylines
        </p>
      </header>

      <section>
        <h2 className="mb-4 text-xs lowercase tracking-[0.24em] text-slate-400">weekly letters</h2>
        {apiKey ? (
          <div className="grid items-start gap-6 md:grid-cols-2">
            {derived.weeks.map((week) => (
              <WeeklyLetterCard key={week.index} week={week} />
            ))}
          </div>
        ) : (
          <KeyPrompt
            title="add your key to read the weekly letters"
            description="nirva writes one letter per week, tracing the month's arc — generated with your own OpenAI key, then remembered."
          />
        )}
      </section>

      <ThreadTimeline />

      <div className="grid items-start gap-6 lg:grid-cols-[5fr_6fr]">
        <EmotionHeatmap />
        <PatternInsights />
      </div>
    </div>
  );
}
