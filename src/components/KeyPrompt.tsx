import Card from './Card';

interface KeyPromptProps {
  title?: string;
  description?: string;
}

/**
 * Visual shell for the bring-your-own-key prompt.
 * Workstream C wires save/clear logic via the useApiKey() hook.
 */
export default function KeyPrompt({
  title = 'add your OpenAI key',
  description = 'nirva writes letters and answers questions with your own key. everything else already works without one.',
}: KeyPromptProps) {
  return (
    <Card className="mx-auto max-w-md text-center">
      <div
        className="mx-auto mb-4 h-8 w-8 rounded-full"
        style={{ background: 'radial-gradient(circle at 40% 35%, #dbeafe, #bfdbfe)' }}
        aria-hidden
      />
      <h3 className="text-base font-medium text-slate-700">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
      <form className="mt-5 flex gap-2" onSubmit={(e) => e.preventDefault()}>
        <input
          type="password"
          placeholder="sk-..."
          autoComplete="off"
          className="min-w-0 flex-1 rounded-full border border-slate-200 bg-base px-4 py-2 text-sm text-slate-700 placeholder:text-slate-300 focus:border-sky-mid focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-full bg-deep px-4 py-2 text-sm text-white transition-opacity hover:opacity-90"
        >
          save
        </button>
      </form>
      <p className="mt-3 text-xs text-slate-400">
        stored only in your browser — sent nowhere except directly to OpenAI.
      </p>
    </Card>
  );
}
