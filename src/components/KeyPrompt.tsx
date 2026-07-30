import { useState, type FormEvent } from 'react';
import { clearApiKey, setApiKey, useApiKey } from '../llm/client';
import Card from './Card';

interface KeyPromptProps {
  title?: string;
  description?: string;
}

export default function KeyPrompt({
  title = 'add your OpenAI key',
  description = 'nirva writes letters and answers questions with your own key. everything else already works without one.',
}: KeyPromptProps) {
  const apiKey = useApiKey();
  const [draft, setDraft] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;
    setApiKey(draft);
    setDraft('');
  }

  return (
    <Card className="mx-auto max-w-md text-center">
      <div
        className="mx-auto mb-4 h-8 w-8 rounded-full"
        style={{ background: 'radial-gradient(circle at 40% 35%, #dbeafe, #bfdbfe)' }}
        aria-hidden
      />
      <h3 className="text-base font-medium text-slate-700">{apiKey ? 'OpenAI key saved' : title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        {apiKey ? 'generated features are ready to use on this device.' : description}
      </p>
      {apiKey ? (
        <button
          type="button"
          onClick={clearApiKey}
          className="mt-5 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700"
        >
          clear key
        </button>
      ) : (
        <form className="mt-5 flex gap-2" onSubmit={handleSubmit}>
          <input
            type="password"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="sk-..."
            aria-label="OpenAI API key"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-full border border-slate-200 bg-base px-4 py-2 text-sm text-slate-700 placeholder:text-slate-300 focus:border-sky-mid focus:outline-none"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="rounded-full bg-deep px-4 py-2 text-sm text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            save
          </button>
        </form>
      )}
      <p className="mt-3 text-xs text-slate-400">
        stored only in your browser — sent nowhere except directly to OpenAI.{' '}
        <a
          href="https://platform.openai.com/api-keys"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-slate-300 underline-offset-2 hover:text-slate-600"
        >
          get a key
        </a>
      </p>
    </Card>
  );
}
