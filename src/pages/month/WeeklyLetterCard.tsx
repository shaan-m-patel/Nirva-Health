import BreathingLoader from '../../components/BreathingLoader';
import Card from '../../components/Card';
import LetterBody from '../../components/LetterBody';
import { formatShortDate } from '../../lib/dates';
import { useLetter } from '../../lib/useLetter';
import { getWeeklyLetter } from '../../memory/generate';
import type { DerivedData } from '../../types';

interface WeeklyLetterCardProps {
  week: DerivedData['weeks'][number];
}

/**
 * One week's letter. Only rendered when a key exists — MonthView shows a
 * single KeyPrompt for the whole section otherwise.
 */
export default function WeeklyLetterCard({ week }: WeeklyLetterCardProps) {
  const { state, retry } = useLetter(() => getWeeklyLetter(week.index), `weekly:${week.index}`);

  return (
    <Card className="flex flex-col">
      <header className="mb-4 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium lowercase tracking-wide text-slate-600">
          week {week.index + 1}
        </h3>
        <p className="text-xs lowercase text-slate-400">
          {formatShortDate(week.start)} – {formatShortDate(week.end)}
        </p>
      </header>

      {state.status === 'loading' && <BreathingLoader label="gathering the week" />}

      {state.status === 'error' && (
        <div className="py-4 text-center">
          <p className="text-sm leading-relaxed text-slate-500">{state.message}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 rounded-full border border-slate-200 px-4 py-1.5 text-sm text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700"
          >
            try again
          </button>
        </div>
      )}

      {state.status === 'ready' && <LetterBody text={state.text} size="compact" />}

      {state.status === 'no-key' && (
        <p className="py-4 text-center text-sm text-slate-400">
          add your key to read this week's letter.
        </p>
      )}
    </Card>
  );
}
