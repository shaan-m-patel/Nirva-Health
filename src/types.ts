export interface EmotionLabel { label: string; confidence: number }

export interface Segment {
  id: string;              // "2026-05-11#001" — date + zero-padded index within day
  date: string;            // "2026-05-11"
  day: string;             // "Mon"
  time: string;            // "06:55"
  transcript: string;
  emotions: EmotionLabel[]; // [] when no clear signal (~80% of rows)
  pitchHz: number;
  loudnessDb: number;
  speakingRateSps: number;
  prosody: number;         // 0..1 expressiveness
  pauseFreqMin: number;    // pauses per minute
}

export interface DayAggregate {
  date: string;
  day: string;
  segmentCount: number;
  emotionCounts: Record<string, number>;   // label -> count
  dominantEmotion: string | null;
  // hour-bucketed acoustic means for the energy arc chart
  hourly: { hour: number; pitch: number; loudness: number; prosody: number; speakingRate: number; count: number }[];
  meanProsody: number;
  meanPitch: number;
}

export interface Intention {
  key: string;             // canonical id, e.g. "dentist"
  label: string;           // "Book the dentist"
  segmentIds: string[];    // every resurfacing, chronological
  status: 'kept' | 'drifting' | 'dropped';  // determined in parse script
}

export interface Person {
  key: string;             // "sam"
  name: string;            // "Sam"
  relation: string;        // "partner" | "co-founder" | "designer" | "prospective hire" | ...
  segmentIds: string[];    // segments mentioning them
}

export interface Thread {
  key: string;             // "fundraise"
  title: string;           // "The raise"
  description: string;
  segmentIds: string[];    // key moments, chronological
}

export interface DerivedData {
  days: DayAggregate[];
  intentions: Intention[];
  people: Person[];
  threads: Thread[];
  weeks: { index: number; start: string; end: string; dates: string[] }[]; // 4 weeks
}

// ---- memory / generation ----

export type GenTask =
  | { kind: 'dailyLetter'; date: string }
  | { kind: 'weeklyLetter'; weekIndex: number }
  | { kind: 'chat'; question: string; mode: 'companion' | 'therapist'; history: ChatMessage[] };

export interface ContextItem {
  type: 'segment' | 'dailyDigest' | 'weeklySummary' | 'entity';
  refId: string;                // segment id, date, week index, or entity key
  text: string;                 // exactly what went into the prompt
  reason: string;               // human-readable: "similarity 0.83" | "same day" | "entity: Sam"
  tokens: number;               // estimate (chars/4 is fine)
}

export interface ContextTrace {
  task: GenTask;
  items: ContextItem[];
  systemPrompt: string;
  tokenBudget: number;
  tokensUsed: number;
  timestamp: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: string[];         // segment ids backing the answer
}
