import BreathingLoader from '../../components/BreathingLoader';
import Card from '../../components/Card';
import KeyPrompt from '../../components/KeyPrompt';
import LetterBody from '../../components/LetterBody';
import { useLetter } from '../../lib/useLetter';
import { getDailyLetter } from '../../memory/generate';

export default function DailyLetterCard({ date }: { date: string }) {
  const { state, retry } = useLetter(() => getDailyLetter(date), `daily:${date}`);

  return (
    <section className="mx-auto w-full max-w-[720px]">
      <p className="mb-4 text-center text-xs lowercase tracking-[0.24em] text-slate-400">
        today's letter
      </p>

      {state.status === 'no-key' && (
        <KeyPrompt
          title="add your key to read today's letter"
          description="nirva writes each day back to you as a letter — generated with your own OpenAI key, then remembered."
        />
      )}

      {state.status === 'loading' && (
        <Card className="rounded-3xl px-8 py-4 sm:px-12">
          <BreathingLoader label="writing your letter" />
        </Card>
      )}

      {state.status === 'error' && (
        <Card className="text-center">
          <p className="text-sm leading-relaxed text-slate-500">{state.message}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-4 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700"
          >
            try again
          </button>
        </Card>
      )}

      {state.status === 'ready' && (
        <Card className="px-8 py-10 sm:px-12">
          <LetterBody text={state.text} />
          <p className="mt-8 font-letter text-[15px] italic text-slate-400">— nirva</p>
        </Card>
      )}
    </section>
  );
}
