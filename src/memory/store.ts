import { deleteDB, openDB, type DBSchema, type IDBPDatabase } from 'idb';
import derivedJson from '../data/derived.json';
import segmentsJson from '../data/segments.json';
import type { ChatMessage, ContextTrace, DerivedData, Segment } from '../types';

const DB_NAME = 'nirva-memory';
const DB_VERSION = 1;

interface CachedGeneration {
  text: string;
  trace: ContextTrace;
}

interface NirvaMemoryDb extends DBSchema {
  embeddings: {
    key: string;
    value: number[];
  };
  generations: {
    key: string;
    value: CachedGeneration;
  };
  chatHistory: {
    key: number;
    value: ChatMessage;
  };
}

let databasePromise: Promise<IDBPDatabase<NirvaMemoryDb>> | null = null;

function getDatabase(): Promise<IDBPDatabase<NirvaMemoryDb>> {
  if (!databasePromise) {
    databasePromise = openDB<NirvaMemoryDb>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains('embeddings')) {
          database.createObjectStore('embeddings');
        }
        if (!database.objectStoreNames.contains('generations')) {
          database.createObjectStore('generations');
        }
        if (!database.objectStoreNames.contains('chatHistory')) {
          database.createObjectStore('chatHistory', { autoIncrement: true });
        }
      },
      terminated() {
        databasePromise = null;
      },
    });
  }
  return databasePromise;
}

export async function getCachedGeneration(key: string): Promise<CachedGeneration | null> {
  const value = await (await getDatabase()).get('generations', key);
  return value ?? null;
}

export async function putGeneration(key: string, value: CachedGeneration): Promise<void> {
  await (await getDatabase()).put('generations', value, key);
}

export async function getAllEmbeddings(): Promise<Map<string, number[]>> {
  const database = await getDatabase();
  const [keys, values] = await Promise.all([
    database.getAllKeys('embeddings'),
    database.getAll('embeddings'),
  ]);
  return new Map(keys.map((key, index) => [key, values[index]]));
}

export async function putEmbeddings(entries: [string, number[]][]): Promise<void> {
  if (entries.length === 0) return;
  const transaction = (await getDatabase()).transaction('embeddings', 'readwrite');
  await Promise.all([
    ...entries.map(([key, vector]) => transaction.store.put(vector, key)),
    transaction.done,
  ]);
}

export async function appendChatMessage(message: ChatMessage): Promise<void> {
  await (await getDatabase()).add('chatHistory', message);
}

export async function getChatHistory(): Promise<ChatMessage[]> {
  return (await getDatabase()).getAll('chatHistory');
}

export async function clearChatHistory(): Promise<void> {
  await (await getDatabase()).clear('chatHistory');
}

export interface MemoryStats {
  embeddings: number;
  digests: number;
  dailyLetters: number;
  weeklyLetters: number;
  chatMessages: number;
}

/** Keys-only counts of what memory holds right now — used by the Memory Explainer. */
export async function getMemoryStats(): Promise<MemoryStats> {
  const database = await getDatabase();
  const [embeddings, generationKeys, chatMessages] = await Promise.all([
    database.count('embeddings'),
    database.getAllKeys('generations'),
    database.count('chatHistory'),
  ]);
  return {
    embeddings,
    digests: generationKeys.filter((key) => key.startsWith('digest:')).length,
    dailyLetters: generationKeys.filter((key) => key.startsWith('daily:')).length,
    weeklyLetters: generationKeys.filter((key) => key.startsWith('weekly:')).length,
    chatMessages,
  };
}

export async function exportAll(): Promise<Blob> {
  const database = await getDatabase();
  const [embeddingKeys, embeddingValues, generationKeys, generationValues, chatHistory] =
    await Promise.all([
      database.getAllKeys('embeddings'),
      database.getAll('embeddings'),
      database.getAllKeys('generations'),
      database.getAll('generations'),
      database.getAll('chatHistory'),
    ]);

  const embeddings = Object.fromEntries(
    embeddingKeys.map((key, index) => [key, embeddingValues[index]]),
  );
  const generations = Object.fromEntries(
    generationKeys.map((key, index) => [key, generationValues[index]]),
  );
  const payload = {
    exportedAt: new Date().toISOString(),
    segments: segmentsJson as Segment[],
    derived: derivedJson as unknown as DerivedData,
    indexedDb: { embeddings, generations, chatHistory },
  };

  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
}

export async function hardDelete(): Promise<void> {
  if (databasePromise) {
    const database = await databasePromise;
    database.close();
    databasePromise = null;
  }
  await deleteDB(DB_NAME);

  if (typeof window !== 'undefined') {
    const keys = Array.from({ length: window.localStorage.length }, (_, index) =>
      window.localStorage.key(index),
    );
    for (const key of keys) {
      if (key?.startsWith('nirva_')) window.localStorage.removeItem(key);
    }
    window.dispatchEvent(new Event('nirva-api-key-change'));
  }
}
