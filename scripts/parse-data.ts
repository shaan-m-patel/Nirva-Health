/**
 * One-off data pipeline: context/nirva_self_audio_month (1).xlsx -> src/data/*.json
 * Run: npx tsx scripts/parse-data.ts
 * Outputs are checked in; the app never parses xlsx (see docs/02-architecture.md).
 */
import * as XLSX from 'xlsx';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { DayAggregate, DerivedData, EmotionLabel, Intention, Person, Segment, Thread } from '../src/types';

const XLSX_PATH = 'context/nirva_self_audio_month (1).xlsx';
const OUT_DIR = 'src/data';

interface Row {
  date: string; day: string; time: string; transcript: string;
  emotion_1?: string; emotion_1_conf?: string;
  emotion_2?: string; emotion_2_conf?: string;
  emotion_3?: string; emotion_3_conf?: string;
  pitch_hz: string; loudness_db: string; speaking_rate_sps: string;
  prosody: string; pause_freq_min: string;
}

// ---- 1. read xlsx -> segments ----

function readSegments(): Segment[] {
  const wb = XLSX.read(fs.readFileSync(XLSX_PATH));
  const rows = XLSX.utils.sheet_to_json<Row>(wb.Sheets['audio_notes'], { raw: false });
  const perDayIndex = new Map<string, number>();
  return rows.map((r) => {
    const idx = (perDayIndex.get(r.date) ?? 0) + 1;
    perDayIndex.set(r.date, idx);
    const emotions: EmotionLabel[] = [];
    for (const n of [1, 2, 3] as const) {
      const label = r[`emotion_${n}`];
      const conf = r[`emotion_${n}_conf`];
      if (label && conf) emotions.push({ label, confidence: Number(conf) });
    }
    return {
      id: `${r.date}#${String(idx).padStart(3, '0')}`,
      date: r.date,
      day: r.day,
      time: r.time,
      transcript: r.transcript,
      emotions,
      pitchHz: Number(r.pitch_hz),
      loudnessDb: Number(r.loudness_db),
      speakingRateSps: Number(r.speaking_rate_sps),
      prosody: Number(r.prosody),
      pauseFreqMin: Number(r.pause_freq_min),
    };
  });
}

// ---- 2. day aggregates ----

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const round = (x: number, dp = 2) => Number(x.toFixed(dp));

function buildDays(segments: Segment[]): DayAggregate[] {
  const byDate = new Map<string, Segment[]>();
  for (const s of segments) {
    if (!byDate.has(s.date)) byDate.set(s.date, []);
    byDate.get(s.date)!.push(s);
  }
  return [...byDate.entries()].map(([date, segs]) => {
    const emotionCounts: Record<string, number> = {};
    for (const s of segs) for (const e of s.emotions) emotionCounts[e.label] = (emotionCounts[e.label] ?? 0) + 1;
    const dominantEmotion =
      Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const byHour = new Map<number, Segment[]>();
    for (const s of segs) {
      const hour = Number(s.time.split(':')[0]);
      if (!byHour.has(hour)) byHour.set(hour, []);
      byHour.get(hour)!.push(s);
    }
    const hourly = [...byHour.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([hour, hs]) => ({
        hour,
        pitch: round(mean(hs.map((s) => s.pitchHz)), 1),
        loudness: round(mean(hs.map((s) => s.loudnessDb)), 1),
        prosody: round(mean(hs.map((s) => s.prosody))),
        speakingRate: round(mean(hs.map((s) => s.speakingRateSps))),
        count: hs.length,
      }));
    return {
      date,
      day: segs[0].day,
      segmentCount: segs.length,
      emotionCounts,
      dominantEmotion,
      hourly,
      meanProsody: round(mean(segs.map((s) => s.prosody))),
      meanPitch: round(mean(segs.map((s) => s.pitchHz)), 1),
    };
  });
}

// ---- 3. people / threads / intentions (keywords tuned against the real transcripts) ----

const matchIds = (segments: Segment[], re: RegExp) =>
  segments.filter((s) => re.test(s.transcript)).map((s) => s.id);

function buildPeople(segments: Segment[]): Person[] {
  const defs: [string, string, string, RegExp][] = [
    ['sam', 'Sam', 'partner', /\bSam\b/],
    ['daniel', 'Daniel', 'co-founder', /\bDaniel\b/],
    ['mira', 'Mira', 'designer', /\bMira\b/],
    ['adrian', 'Adrian', 'prospective hire', /\bAdrian\b/],
    ['theo', 'Theo', 'close friend', /\bTheo\b/],
  ];
  return defs.map(([key, name, relation, re]) => ({ key, name, relation, segmentIds: matchIds(segments, re) }));
}

function buildThreads(segments: Segment[]): Thread[] {
  const defs: [string, string, string, RegExp][] = [
    ['fundraise', 'The raise', 'Deciding to fundraise: warm intros, the deck, investor meetings.',
      /\brais(e|ing)\b|investor|pitch|\bdeck\b|term sheet|fundrais|\bVC\b|warm intro/i],
    ['battery', 'The battery fix', 'Four-hour battery life to a fixed BLE sleep cycle in one week.',
      /battery|\bBLE\b|power draw|\bradio\b|firmware|packet/i],
    ['orb', 'The orb', 'Prototyping the breathing orb — the companion made visible.',
      /\borb\b|shader/i],
    ['hiring', 'Hiring Adrian', 'Courting the dream engineering hire, from outreach to the yes.',
      /\bAdrian\b|\bhire\b|hiring|candidate|recruit/i],
    ['demo', 'The June 4 demo', 'Nine days of ruthless focus, a cracked seam, and demo day itself.',
      /\bdemo\b|\bseam\b/i],
    ['sam', 'Life with Sam', 'Dinners, walks, a week apart — the home that holds the rest together.',
      /\bSam\b/],
    ['theo', 'Being there for Theo', "A friend's breakup, and learning that showing up is the product.",
      /\bTheo\b/],
  ];
  return defs.map(([key, title, description, re]) => ({ key, title, description, segmentIds: matchIds(segments, re) }));
}

interface IntentionDef {
  key: string; label: string; pattern: RegExp;
  completion: RegExp | null; // matched inside the intention's own segments => 'kept'
}

function buildIntentions(segments: Segment[]): Intention[] {
  const defs: IntentionDef[] = [
    { key: 'dentist', label: 'Book the dentist', pattern: /dentist/i, completion: /booked|the haunting ends/i },
    { key: 'protein', label: 'Buy the protein stuff', pattern: /protein/i, completion: null },
    { key: 'accountant', label: 'Reschedule the accountant', pattern: /accountant/i, completion: null },
    {
      key: 'walks', label: 'Walks to reset',
      pattern: /walk(ed)? (around the block|the neighborhood|the long way|home the long way|the farmers market)|aimless walk|sunset walk|walk .{0,30}reset/i,
      completion: /walked|no phones|aimless/i,
    },
    { key: 'groceries', label: 'Groceries for the week', pattern: /grocer/i, completion: /grocery run|got|getting/i },
    { key: 'earlyNights', label: 'Earlier nights', pattern: /decent hour|normal hour|nights running/i, completion: /nights running|decent hour/i },
  ];
  return defs
    .map(({ key, label, pattern, completion }) => {
      const matched = segments.filter((s) => pattern.test(s.transcript));
      const kept = completion !== null && matched.some((s) => completion.test(s.transcript));
      const status: Intention['status'] = kept ? 'kept' : matched.length >= 3 ? 'drifting' : 'dropped';
      return { key, label, segmentIds: matched.map((s) => s.id), status };
    })
    .filter((i) => i.segmentIds.length > 0);
}

// ---- 4. weeks ----

function buildWeeks(days: DayAggregate[]): DerivedData['weeks'] {
  const dates = days.map((d) => d.date);
  return [0, 1, 2, 3].map((index) => {
    const weekDates = dates.slice(index * 7, index * 7 + 7);
    return { index, start: weekDates[0], end: weekDates[weekDates.length - 1], dates: weekDates };
  });
}

// ---- run + sanity checks ----

const segments = readSegments();
const days = buildDays(segments);
const people = buildPeople(segments);
const threads = buildThreads(segments);
const intentions = buildIntentions(segments);
const weeks = buildWeeks(days);
const derived: DerivedData = { days, intentions, people, threads, weeks };

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`sanity check failed: ${msg}`);
}
assert(segments.length === 823, `expected 823 segments, got ${segments.length}`);
assert(days.length === 28, `expected 28 days, got ${days.length}`);
assert(weeks.length === 4 && weeks.every((w) => w.dates.length === 7), 'expected 4 weeks of 7 days');
assert(days[0].date === '2026-05-11' && days[27].date === '2026-06-07', 'unexpected date range');
const dentist = intentions.find((i) => i.key === 'dentist');
assert((dentist?.segmentIds.length ?? 0) >= 4, `dentist should resurface >= 4 times, got ${dentist?.segmentIds.length}`);
const mostMentioned = [...people].sort((a, b) => b.segmentIds.length - a.segmentIds.length)[0];
assert(mostMentioned.key === 'sam', `Sam should be most-mentioned, got ${mostMentioned.key}`);
assert(people.length >= 4 && threads.length >= 4 && intentions.length >= 4, 'need >= 4 people/threads/intentions');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'segments.json'), JSON.stringify(segments, null, 1));
fs.writeFileSync(path.join(OUT_DIR, 'derived.json'), JSON.stringify(derived, null, 1));

const withEmotions = segments.filter((s) => s.emotions.length > 0).length;
console.log(`segments: ${segments.length} (${withEmotions} with emotion labels)`);
console.log(`days: ${days.length}, weeks: ${weeks.length}`);
console.log('people:', people.map((p) => `${p.name}=${p.segmentIds.length}`).join(', '));
console.log('threads:', threads.map((t) => `${t.key}=${t.segmentIds.length}`).join(', '));
console.log('intentions:', intentions.map((i) => `${i.key}=${i.segmentIds.length} (${i.status})`).join(', '));
