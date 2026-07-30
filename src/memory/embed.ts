import { embedTexts } from '../llm/client';
import type { Segment } from '../types';
import { getAllEmbeddings, putEmbeddings } from './store';

const BATCH_SIZE = 100;

/** What actually gets embedded per segment: date/time framing helps temporal questions. */
export function segmentEmbeddingText(segment: Segment): string {
  const emotions = segment.emotions.map((e) => e.label).join(', ');
  return `${segment.date} (${segment.day}) ${segment.time} — ${segment.transcript}${
    emotions ? ` [feeling: ${emotions}]` : ''
  }`;
}

/**
 * Idempotent: loads the index from IndexedDB and embeds only segments that are
 * missing, persisting each batch as it completes so an interrupted run resumes.
 */
export async function ensureEmbeddings(
  segments: Segment[],
  onProgress?: (done: number, total: number) => void,
): Promise<Map<string, number[]>> {
  const index = await getAllEmbeddings();
  const missing = segments.filter((segment) => !index.has(segment.id));
  const total = segments.length;
  const alreadyDone = total - missing.length;
  onProgress?.(alreadyDone, total);

  for (let offset = 0; offset < missing.length; offset += BATCH_SIZE) {
    const batch = missing.slice(offset, offset + BATCH_SIZE);
    const vectors = await embedTexts(batch.map(segmentEmbeddingText));
    const entries: [string, number[]][] = batch.map((segment, i) => [segment.id, vectors[i]]);
    await putEmbeddings(entries);
    for (const [id, vector] of entries) index.set(id, vector);
    onProgress?.(alreadyDone + offset + batch.length, total);
  }

  return index;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dot / denominator;
}

export function topKSimilar(
  queryVec: number[],
  index: Map<string, number[]>,
  k: number,
): { id: string; score: number }[] {
  const scored: { id: string; score: number }[] = [];
  for (const [id, vector] of index) {
    scored.push({ id, score: cosineSimilarity(queryVec, vector) });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}
