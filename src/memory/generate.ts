import derivedJson from '../data/derived.json';
import segmentsJson from '../data/segments.json';
import { chatCompletion } from '../llm/client';
import type { ChatMessage, ContextTrace, DerivedData, Segment } from '../types';
import { assembleContext, assembleDailyDigest, recordTrace } from './assemble';
import { getCachedGeneration, putGeneration } from './store';

const derived = derivedJson as unknown as DerivedData;
const validSegmentIds = new Set((segmentsJson as Segment[]).map((segment) => segment.id));

export async function getDailyLetter(date: string): Promise<{ text: string; trace: ContextTrace }> {
  const key = `daily:${date}`;
  const cached = await getCachedGeneration(key);
  if (cached) {
    recordTrace(cached.trace);
    return cached;
  }

  const { prompt, system, trace } = await assembleContext({ kind: 'dailyLetter', date });
  const text = await chatCompletion({
    system,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.6,
    maxTokens: 700,
  });
  const value = { text, trace };
  await putGeneration(key, value);
  return value;
}

/** L1 memory: a compact per-day digest, generated once and cached under `digest:<date>`. */
async function ensureDailyDigest(date: string): Promise<void> {
  const key = `digest:${date}`;
  if (await getCachedGeneration(key)) return;

  const { prompt, system, trace } = assembleDailyDigest(date);
  const text = await chatCompletion({
    system,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    maxTokens: 220,
  });
  await putGeneration(key, { text, trace });
}

export async function getWeeklyLetter(
  weekIndex: number,
): Promise<{ text: string; trace: ContextTrace }> {
  const key = `weekly:${weekIndex}`;
  const cached = await getCachedGeneration(key);
  if (cached) {
    recordTrace(cached.trace);
    return cached;
  }

  const week = derived.weeks[weekIndex];
  if (!week) throw new Error(`Unknown week index: ${weekIndex}`);
  // Sequential on purpose: seven parallel completions invite 429s.
  for (const date of week.dates) {
    await ensureDailyDigest(date);
  }

  const { prompt, system, trace } = await assembleContext({ kind: 'weeklyLetter', weekIndex });
  const text = await chatCompletion({
    system,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.6,
    maxTokens: 700,
  });
  const value = { text, trace };
  await putGeneration(key, value);
  return value;
}

const CITE_LINE = /\s*\[\[cite:([^\]]*)\]\]\s*$/;

function parseCitations(raw: string): { content: string; citations: string[] } {
  const match = raw.match(CITE_LINE);
  if (!match) return { content: raw.trim(), citations: [] };

  const citations = match[1]
    .split(',')
    .map((id) => id.trim())
    .filter((id) => validSegmentIds.has(id));
  return { content: raw.replace(CITE_LINE, '').trim(), citations };
}

export async function askChat(
  question: string,
  mode: 'companion' | 'therapist',
  history: ChatMessage[],
): Promise<ChatMessage> {
  const { prompt, system } = await assembleContext({ kind: 'chat', question, mode, history });
  const messages = [
    ...history.map((message) => ({ role: message.role, content: message.content })),
    { role: 'user', content: prompt },
  ];
  const raw = await chatCompletion({
    system,
    messages,
    temperature: mode === 'therapist' ? 0.7 : 0.3,
    maxTokens: 600,
  });

  const { content, citations } = parseCitations(raw);
  return { role: 'assistant', content, citations };
}
