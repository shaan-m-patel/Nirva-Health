import { useCallback, useEffect, useState } from 'react';
import { useApiKey } from '../llm/client';

export type LetterState =
  | { status: 'no-key' }
  | { status: 'loading' }
  | { status: 'ready'; text: string }
  | { status: 'error'; message: string };

/**
 * Key-gated, cache-first letter loading shared by the daily and weekly letter
 * cards. `taskKey` identifies the generation task (e.g. "daily:2026-05-11") so
 * the effect re-runs on navigation without depending on `load`'s identity.
 */
export function useLetter(
  load: () => Promise<{ text: string }>,
  taskKey: string,
): { state: LetterState; retry: () => void } {
  const apiKey = useApiKey();
  const [state, setState] = useState<LetterState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (!apiKey) {
      setState({ status: 'no-key' });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });
    load().then(
      ({ text }) => {
        if (!cancelled) setState({ status: 'ready', text });
      },
      (error: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message:
              error instanceof Error ? error.message : 'Something went wrong writing this letter.',
          });
        }
      },
    );
    return () => {
      cancelled = true;
    };
    // `load` is intentionally omitted: `taskKey` fully identifies the task.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, taskKey, attempt]);

  return { state, retry };
}
