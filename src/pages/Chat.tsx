import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import KeyPrompt from '../components/KeyPrompt';
import { useApiKey } from '../llm/client';
import { askChat } from '../memory/generate';
import { appendChatMessage, clearChatHistory, getChatHistory } from '../memory/store';
import type { ChatMessage } from '../types';
import MessageBubble from './chat/MessageBubble';
import ModeToggle, { type ChatMode } from './chat/ModeToggle';

const SUGGESTIONS = [
  'when did I decide to raise?',
  'how have things been with Sam?',
  'what happened with the battery bug?',
  'did I ever book the dentist?',
];

export default function Chat() {
  const apiKey = useApiKey();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode: ChatMode = searchParams.get('mode') === 'therapist' ? 'therapist' : 'companion';
  const therapist = mode === 'therapist';

  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getChatHistory().then(setMessages);
  }, []);

  useEffect(() => {
    if ((messages?.length ?? 0) > 0 || thinking) {
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages?.length, thinking]);

  function setMode(next: ChatMode) {
    setSearchParams(next === 'therapist' ? { mode: 'therapist' } : {}, { replace: true });
  }

  async function send(question: string) {
    const trimmed = question.trim();
    if (!trimmed || thinking || messages === null) return;

    // Recent turns only — the retrieved memory context carries the real grounding.
    const history = messages.slice(-12).map(({ role, content }) => ({ role, content }));
    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...(prev ?? []), userMessage]);
    setDraft('');
    setError(null);
    setThinking(true);
    try {
      await appendChatMessage(userMessage);
      const answer = await askChat(trimmed, mode, history);
      await appendChatMessage(answer);
      setMessages((prev) => [...(prev ?? []), answer]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setThinking(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(draft);
  }

  async function handleClear() {
    await clearChatHistory();
    setMessages([]);
    setError(null);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="text-center">
        <p className="text-xs lowercase tracking-[0.24em] text-slate-400">chat</p>
        <h1 className="mt-2 text-3xl font-light text-slate-700">ask your month anything</h1>
        <div className="mt-5">
          <ModeToggle mode={mode} onChange={setMode} />
        </div>
        <p className="mt-3 text-xs text-slate-400">
          {therapist
            ? 'reflective mode — nirva connects feelings and patterns instead of recalling facts.'
            : 'grounded recall — every answer cites the moments it came from.'}
        </p>
      </header>

      {!apiKey ? (
        <KeyPrompt
          title="add your key to talk with nirva"
          description="the companion answers from your real month — retrieved, grounded, and cited — using your own OpenAI key."
        />
      ) : (
        <>
          <div className="space-y-4">
            {messages !== null && messages.length === 0 && !thinking && (
              <div className="rounded-3xl border border-slate-100 bg-white/60 p-6 text-center">
                <p className="text-sm text-slate-400">
                  ask about anything from the month — nirva remembers.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void send(suggestion)}
                      className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-500 transition-colors hover:border-sky-soft hover:text-deep"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages?.map((message, index) => (
              <MessageBubble key={index} message={message} therapist={therapist} />
            ))}

            {thinking && (
              <div className="flex items-center gap-2.5">
                <span
                  className="animate-breathe h-6 w-6 rounded-full"
                  style={{
                    background: therapist
                      ? 'radial-gradient(circle at 40% 35%, #ffe4e6, #fda4af)'
                      : 'radial-gradient(circle at 40% 35%, #dbeafe, #93c5fd)',
                  }}
                  aria-hidden
                />
                <p className="text-sm lowercase text-slate-400">remembering…</p>
              </div>
            )}

            {error && (
              <p className="rounded-2xl bg-rose-50/70 px-4 py-3 text-sm text-rose-600">{error}</p>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={therapist ? 'what would you like to sit with?' : 'ask about your month…'}
              aria-label="your question"
              className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-5 py-3 text-[15px] text-slate-700 placeholder:text-slate-300 focus:border-sky-mid focus:outline-none"
            />
            <button
              type="submit"
              disabled={!draft.trim() || thinking}
              className={`rounded-full px-5 py-3 text-sm text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ${
                therapist ? 'bg-rose-400' : 'bg-deep'
              }`}
            >
              ask
            </button>
          </form>

          {(messages?.length ?? 0) > 0 && (
            <p className="text-center">
              <button
                type="button"
                onClick={() => void handleClear()}
                className="text-xs lowercase text-slate-300 transition-colors hover:text-slate-500"
              >
                clear conversation
              </button>
            </p>
          )}
        </>
      )}
    </div>
  );
}
