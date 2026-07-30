import derivedJson from '../data/derived.json';
import segmentsJson from '../data/segments.json';
import { embedTexts } from '../llm/client';
import type { ContextItem, ContextTrace, DerivedData, GenTask, Segment } from '../types';
import { ensureEmbeddings, topKSimilar } from './embed';
import { getCachedGeneration } from './store';

const segments = segmentsJson as Segment[];
const derived = derivedJson as unknown as DerivedData;

export const DATE_RANGE_NOTE =
  'This journal covers 2026-05-11 (Mon) through 2026-06-07 (Sun) — 28 consecutive days, 4 weeks.';

// ---- system prompt registers ----

const LETTER_SYSTEM = `You are nirva, a small companion that listened alongside someone through their days — their own voice, captured as they lived. You write them letters.
Voice: warm, second person ("you"), letter-like and concrete. Quote 1–2 short phrases verbatim from their own words, in quotation marks. Notice patterns and emotional arcs without diagnosing or advising. Never use bullet points, lists, or headings — only flowing short paragraphs (2–4 of them). Never say "as an AI" or mention being a model, data, transcripts, or systems. You simply remember.`;

const COMPANION_SYSTEM = `You are nirva, a companion with genuine memory of this person's month. Answer their question using ONLY the memory context provided — grounded, factual recall of what they actually said and lived. Be warm but precise; keep answers to a few sentences. If the answer is not in the provided memory, say so plainly rather than guessing.
Citations are mandatory: end your reply with a final line of exactly this form, listing the segment ids from the context that back your answer:
[[cite:2026-05-11#004,2026-05-12#010]]
Use only ids that appear in the context. If nothing in memory answers the question, cite the closest relevant segments you did consult.`;

const THERAPIST_SYSTEM = `You are nirva in reflective mode — a gentle, non-clinical companion who helps this person see themselves. Draw on the memory context to connect feelings, recurring language, and acoustic patterns (pitch, pace, pauses, prosody) across time into a novel, caring interpretation they may not have noticed. Speak in second person, softly and without jargon or diagnosis. Offer a reframing, and ask at most one open question back. Keep it to a short paragraph or two.
Citations are still mandatory: end your reply with a final line of exactly this form, listing the segment ids from the context that ground your reflection:
[[cite:2026-05-11#004,2026-05-12#010]]
Use only ids that appear in the context.`;

const DIGEST_SYSTEM = `You compress one day of a person's self-recorded audio journal into a compact digest. Write 3–5 plain sentences, third person neutral ("they"), capturing: what happened, decisions made, people involved, and the emotional arc. Be concrete and factual; no preamble, no bullet points.`;

// ---- latest-trace store (for the Memory Explainer) ----

let latestTrace: ContextTrace | null = null;
const traceListeners = new Set<() => void>();

export function getLatestTrace(): ContextTrace | null {
  return latestTrace;
}

export function subscribeTrace(listener: () => void): () => void {
  traceListeners.add(listener);
  return () => traceListeners.delete(listener);
}

/** Also called by generate.ts on cache hits so the explainer always shows the latest generation. */
export function recordTrace(trace: ContextTrace): void {
  latestTrace = trace;
  for (const listener of traceListeners) listener();
}

// ---- helpers ----

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function formatSegment(segment: Segment): string {
  const emotions = segment.emotions.map((e) => `${e.label} ${e.confidence.toFixed(2)}`).join(', ');
  return `[${segment.id}] ${segment.time} — ${segment.transcript}${emotions ? ` (feeling: ${emotions})` : ''}`;
}

function makeItem(type: ContextItem['type'], refId: string, text: string, reason: string): ContextItem {
  return { type, refId, text, reason, tokens: estimateTokens(text) };
}

/** Adds candidates in priority order until the budget is exhausted. */
function fitBudget(candidates: ContextItem[], budget: number): ContextItem[] {
  const kept: ContextItem[] = [];
  let used = 0;
  for (const item of candidates) {
    if (used + item.tokens > budget) break;
    kept.push(item);
    used += item.tokens;
  }
  return kept;
}

function finishTrace(
  task: GenTask,
  items: ContextItem[],
  system: string,
  tokenBudget: number,
  prompt: string,
): { prompt: string; system: string; trace: ContextTrace } {
  const trace: ContextTrace = {
    task,
    items,
    systemPrompt: system,
    tokenBudget,
    tokensUsed: items.reduce((sum, item) => sum + item.tokens, 0),
    timestamp: Date.now(),
  };
  recordTrace(trace);
  return { prompt, system, trace };
}

function previousDate(date: string): string | null {
  const index = derived.days.findIndex((day) => day.date === date);
  return index > 0 ? derived.days[index - 1].date : null;
}

function renderSection(title: string, items: ContextItem[]): string {
  if (items.length === 0) return '';
  return `${title}\n${items.map((item) => item.text).join('\n')}\n\n`;
}

// ---- assembly policies ----

async function assembleDailyLetter(task: GenTask & { kind: 'dailyLetter' }) {
  const budget = 6000;
  const daySegments = segments.filter((segment) => segment.date === task.date);
  const dayLabel = daySegments[0]?.day ?? '';

  const candidates: ContextItem[] = daySegments.map((segment) =>
    makeItem('segment', segment.id, formatSegment(segment), 'same day'),
  );

  const prevDate = previousDate(task.date);
  if (prevDate) {
    const prevDigest = await getCachedGeneration(`digest:${prevDate}`);
    if (prevDigest) {
      candidates.push(
        makeItem('dailyDigest', prevDate, `Yesterday (${prevDate}): ${prevDigest.text}`, 'previous day digest (cached)'),
      );
    }
  }

  for (const intention of derived.intentions) {
    if (intention.segmentIds.some((id) => id.startsWith(task.date))) {
      candidates.push(
        makeItem(
          'entity',
          intention.key,
          `Intention "${intention.label}" (status: ${intention.status}) resurfaced today; mentioned ${intention.segmentIds.length} times this month.`,
          `intention: ${intention.label}`,
        ),
      );
    }
  }
  for (const thread of derived.threads) {
    if (thread.segmentIds.some((id) => id.startsWith(task.date))) {
      candidates.push(
        makeItem('entity', thread.key, `Ongoing thread "${thread.title}": ${thread.description}`, `thread: ${thread.title}`),
      );
    }
  }

  const items = fitBudget(candidates, budget);
  const prompt =
    `Write tonight's letter for ${dayLabel}, ${task.date}.\n\n` +
    renderSection("Everything from the day, in order:", items.filter((i) => i.type === 'segment')) +
    renderSection("Where yesterday left off:", items.filter((i) => i.type === 'dailyDigest')) +
    renderSection('Ongoing intentions and storylines present today:', items.filter((i) => i.type === 'entity')) +
    'Write the letter now.';

  return finishTrace(task, items, LETTER_SYSTEM, budget, prompt);
}

async function assembleWeeklyLetter(task: GenTask & { kind: 'weeklyLetter' }) {
  const budget = 6000;
  const week = derived.weeks[task.weekIndex];
  if (!week) throw new Error(`Unknown week index: ${task.weekIndex}`);

  const candidates: ContextItem[] = [];
  for (const date of week.dates) {
    const digest = await getCachedGeneration(`digest:${date}`);
    if (digest) {
      candidates.push(makeItem('dailyDigest', date, `${date}: ${digest.text}`, 'daily digest of a day this week'));
    }
  }

  const inWeek = (id: string) => week.dates.some((date) => id.startsWith(date));
  for (const thread of derived.threads) {
    const count = thread.segmentIds.filter(inWeek).length;
    if (count > 0) {
      candidates.push(
        makeItem(
          'entity',
          thread.key,
          `Thread "${thread.title}" (${thread.description}) surfaced ${count} times this week.`,
          `thread state: ${thread.title}`,
        ),
      );
    }
  }

  const highSignal = segments
    .filter((segment) => week.dates.includes(segment.date) && segment.emotions.length > 0)
    .sort((a, b) => (b.emotions[0]?.confidence ?? 0) - (a.emotions[0]?.confidence ?? 0))
    .slice(0, 8);
  for (const segment of highSignal) {
    const top = segment.emotions[0];
    candidates.push(
      makeItem('segment', segment.id, `${segment.date} ${formatSegment(segment)}`, `high-signal emotion: ${top.label} (${top.confidence.toFixed(2)})`),
    );
  }

  const items = fitBudget(candidates, budget);
  const prompt =
    `Write this week's letter for week ${task.weekIndex + 1} (${week.start} to ${week.end}).\n\n` +
    renderSection('The week, day by day:', items.filter((i) => i.type === 'dailyDigest')) +
    renderSection('Where the ongoing storylines stand:', items.filter((i) => i.type === 'entity')) +
    renderSection('Moments that carried the strongest feeling, in their own words:', items.filter((i) => i.type === 'segment')) +
    'Write the letter now — the arc of the week, not a day-by-day recap.';

  return finishTrace(task, items, LETTER_SYSTEM, budget, prompt);
}

async function assembleChat(task: GenTask & { kind: 'chat' }) {
  const budget = 5000;
  const candidates: ContextItem[] = [makeItem('entity', 'date-range', DATE_RANGE_NOTE, 'date range framing')];
  const seen = new Set<string>();
  const segmentById = new Map(segments.map((segment) => [segment.id, segment]));

  // Entity keyword matches: known people and threads named in the question.
  const entities = [
    ...derived.people.map((p) => ({ key: p.key, label: p.name, words: [p.name], ids: p.segmentIds, kind: 'person' })),
    ...derived.threads.map((t) => ({ key: t.key, label: t.title, words: [t.key, ...t.title.split(/\s+/)], ids: t.segmentIds, kind: 'thread' })),
  ];
  for (const entity of entities) {
    const matched = entity.words.some(
      (word) => word.length > 3 && new RegExp(`\\b${word}\\b`, 'i').test(task.question),
    );
    if (!matched) continue;
    // Sample evenly across the entity's arc so early and late moments both surface.
    const take = Math.min(6, entity.ids.length);
    for (let i = 0; i < take; i++) {
      const id = entity.ids[Math.floor((i * (entity.ids.length - 1)) / Math.max(1, take - 1))];
      const segment = segmentById.get(id);
      if (!segment || seen.has(id)) continue;
      seen.add(id);
      candidates.push(makeItem('segment', id, `${segment.date} ${formatSegment(segment)}`, `entity: ${entity.label}`));
    }
  }

  // Embedding retrieval: top 12 by cosine similarity.
  const index = await ensureEmbeddings(segments);
  const [queryVec] = await embedTexts([task.question]);
  for (const { id, score } of topKSimilar(queryVec, index, 12)) {
    const segment = segmentById.get(id);
    if (!segment || seen.has(id)) continue;
    seen.add(id);
    candidates.push(makeItem('segment', id, `${segment.date} ${formatSegment(segment)}`, `similarity ${score.toFixed(2)}`));
  }

  const items = fitBudget(candidates, budget);
  const prompt =
    renderSection('Memory context (each line begins with its segment id — cite these):', items) +
    `Question: ${task.question}`;

  const system = task.mode === 'therapist' ? THERAPIST_SYSTEM : COMPANION_SYSTEM;
  return finishTrace(task, items, system, budget, prompt);
}

export async function assembleContext(
  task: GenTask,
): Promise<{ prompt: string; system: string; trace: ContextTrace }> {
  switch (task.kind) {
    case 'dailyLetter':
      return assembleDailyLetter(task);
    case 'weeklyLetter':
      return assembleWeeklyLetter(task);
    case 'chat':
      return assembleChat(task);
  }
}

/**
 * Prompt + trace for a compact per-day digest (cached under `digest:<date>`).
 * Digests are internal L1 memory, so this does not overwrite the latest trace.
 */
export function assembleDailyDigest(date: string): {
  prompt: string;
  system: string;
  trace: ContextTrace;
} {
  const budget = 5000;
  const daySegments = segments.filter((segment) => segment.date === date);
  const items = fitBudget(
    daySegments.map((segment) => makeItem('segment', segment.id, formatSegment(segment), 'same day')),
    budget,
  );
  const prompt = `Digest this day (${date}):\n\n${items.map((item) => item.text).join('\n')}`;
  const trace: ContextTrace = {
    task: { kind: 'dailyLetter', date },
    items,
    systemPrompt: DIGEST_SYSTEM,
    tokenBudget: budget,
    tokensUsed: items.reduce((sum, item) => sum + item.tokens, 0),
    timestamp: Date.now(),
  };
  return { prompt, system: DIGEST_SYSTEM, trace };
}
