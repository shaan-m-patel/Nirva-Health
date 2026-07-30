import { useSyncExternalStore } from 'react';

const API_KEY_STORAGE = 'nirva_openai_key';
const KEY_CHANGE_EVENT = 'nirva-api-key-change';
const OPENAI_URL = 'https://api.openai.com/v1';

type LlmErrorKind = 'missing_key' | 'unauthorized' | 'rate_limit' | 'network' | 'api';

export class LlmError extends Error {
  readonly kind: LlmErrorKind;
  readonly status?: number;

  constructor(kind: LlmErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'LlmError';
    this.kind = kind;
    this.status = status;
  }
}

function storageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getApiKey(): string | null {
  if (!storageAvailable()) return null;
  const key = window.localStorage.getItem(API_KEY_STORAGE)?.trim();
  return key || null;
}

function notifyKeyChange(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(KEY_CHANGE_EVENT));
}

export function setApiKey(key: string): void {
  if (!storageAvailable()) return;
  const trimmed = key.trim();
  if (!trimmed) {
    clearApiKey();
    return;
  }
  window.localStorage.setItem(API_KEY_STORAGE, trimmed);
  notifyKeyChange();
}

export function clearApiKey(): void {
  if (!storageAvailable()) return;
  window.localStorage.removeItem(API_KEY_STORAGE);
  notifyKeyChange();
}

function subscribeToKey(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener('storage', callback);
  window.addEventListener(KEY_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(KEY_CHANGE_EVENT, callback);
  };
}

export function useApiKey(): string | null {
  return useSyncExternalStore(subscribeToKey, getApiKey, () => null);
}

async function openAiRequest<T>(path: string, body: object): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new LlmError('missing_key', 'Add your OpenAI API key to use this feature.');
  }

  let response: Response;
  try {
    response = await fetch(`${OPENAI_URL}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new LlmError(
      'network',
      'Could not reach OpenAI. Check your internet connection and try again.',
    );
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new LlmError(
        'unauthorized',
        'That OpenAI API key was not accepted. Check it and try again.',
        401,
      );
    }
    if (response.status === 429) {
      throw new LlmError(
        'rate_limit',
        'OpenAI is temporarily rate-limiting requests. Please wait a moment and try again.',
        429,
      );
    }

    let detail = '';
    try {
      const payload = (await response.json()) as { error?: { message?: string } };
      detail = payload.error?.message ? ` ${payload.error.message}` : '';
    } catch {
      // The friendly status message below is enough when the body is not JSON.
    }
    throw new LlmError(
      'api',
      `OpenAI could not complete the request.${detail}`.trim(),
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

export async function chatCompletion(opts: {
  system: string;
  messages: { role: string; content: string }[];
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const result = await openAiRequest<{
    choices?: { message?: { content?: string | null } }[];
  }>('/chat/completions', {
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: opts.system }, ...opts.messages],
    temperature: opts.temperature ?? 0.5,
    max_tokens: opts.maxTokens ?? 700,
  });

  const content = result.choices?.[0]?.message?.content?.trim();
  if (!content) throw new LlmError('api', 'OpenAI returned an empty response. Please try again.');
  return content;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const vectors: number[][] = [];
  for (let offset = 0; offset < texts.length; offset += 100) {
    const batch = texts.slice(offset, offset + 100);
    const result = await openAiRequest<{
      data?: { index: number; embedding: number[] }[];
    }>('/embeddings', {
      model: 'text-embedding-3-small',
      input: batch,
    });
    const ordered = [...(result.data ?? [])].sort((a, b) => a.index - b.index);
    if (ordered.length !== batch.length) {
      throw new LlmError('api', 'OpenAI returned incomplete embeddings. Please try again.');
    }
    vectors.push(...ordered.map((item) => item.embedding));
  }
  return vectors;
}
