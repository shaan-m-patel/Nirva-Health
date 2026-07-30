# Nirva Deep-Dive Demo — Product & UX Spec

This document defines WHAT we are building and how it should look and feel. See `02-architecture.md` for the technical design and `03-build-guide.md` for the execution plan.

## Context

Nirva is a jewelry-grade AI wearable that passively captures the wearer's own voice through the day and turns it into a private life journal and companion. The product goal: make someone feel **witnessed** — reflect back what they actually lived, help them notice their own patterns, and support growth over time. The experience should feel *personally witnessed, not algorithmically generated*. Privacy is foundational: capture is self-only, and the data belongs to the user.

This app is a working artifact for Nirva's AI Engineer design deep-dive interview. It must answer both interview tasks:

- **Task 1 — The experience:** turn raw multi-dimensional audio data into something meaningful, at both the daily register and the long-term (weeks/months) register.
- **Task 2 — The memory & context layer:** store, organize, and retrieve everything the system has heard so it can produce the Task 1 experience — today and a year from now. Implemented for real in the browser, with a "glass box" inspector.

## The dataset (real, not mock)

Source: `context/nirva_self_audio_month (1).xlsx`, sheet `audio_notes`.

- **823 audio segments** across **28 consecutive days** (2026-05-11 Mon → 2026-06-07 Sun), ~29 segments/day (range 22–51)
- Columns: `date`, `day`, `time`, `transcript`, `emotion_1`, `emotion_1_conf`, `emotion_2`, `emotion_2_conf`, `emotion_3`, `emotion_3_conf`, `pitch_hz`, `loudness_db`, `speaking_rate_sps`, `prosody`, `pause_freq_min`
- Only **~20% of segments (163/823) carry emotion labels** (labels appear only when model confidence ≥ 0.70). Top emotions: contentment (40), frustration (20), determination (16), anxiety (16), tenderness (14), tiredness (11), excitement (10), hope (8), relief (8), love (8)
- The transcripts are first-person notes from a startup founder building a voice wearable. Recurring people: **Sam** (partner), **Daniel** (co-founder), **Mira** (designer), **Adrian** (dream engineering hire). Recurring storylines: the decision to fundraise, a battery/BLE power bug, prototyping an "orb" companion visual, hiring, and home life with Sam. Recurring self-promises: book the dentist (ignored 4+ times), buy protein, calendar hygiene, walks to reset.

Design implication: because 80% of segments have no emotion tag, the experience must lean on language + acoustics (pitch, loudness, speaking rate, prosody, pause frequency) for most of its emotional read, and treat explicit emotion labels as high-confidence anchor moments.

## Pages & features

### 1. Day view — route `/day/:date` (default view, opens on 2026-05-11)

The daily register. For any of the 28 days:

- **Daily letter** (LLM-generated, cached): a warm second-person recap — "you decided to raise today" — written like a letter, never like a dashboard. The dataset itself contains the design brief: *"what if it read more like a letter than a feed."* 2–4 short paragraphs. Names real moments, quotes a phrase or two verbatim, notices the emotional arc without diagnosing.
- **Segment timeline**: the day's segments in order, each showing time, transcript, and emotion chips when present (muted pastel tints). Segments referenced by the letter or chat citations can be highlighted/scrolled to.
- **Acoustic energy arc**: a small chart of pitch/prosody/loudness across the day's hours — the shape of the day, styled quiet (see UI language).
- **Captured intentions**: todo-like utterances gently surfaced ("you mentioned the dentist again"), never nagging.
- Day picker to move across the 28 days.

### 2. Month view — route `/month`

The long-term register:

- **Weekly letters** (LLM-generated, cached): one per week (4 weeks), summarizing the week's arc.
- **Thread timelines**: the month's storylines rendered as horizontal arcs — fundraise, battery/BLE fix, orb prototype, hiring Adrian, life with Sam — each with its key moments plotted by date, clickable through to the day.
- **Emotional rhythm heatmap**: 28-day grid colored by emotional/acoustic tone; tooltips show the day's dominant signals.
- **Pattern insights**: recurring observations (the dentist avoidance, afternoon-slump walks, morning dread vs. evening satisfaction).

### 3. Companion chat — route `/chat`

- Free-form questions about the month ("when did I decide to raise?", "how have things been with Sam?").
- Answers grounded in retrieval; every answer carries **tap-to-source citations** that link to the underlying segments (and jump to them in Day view).
- **Therapist mode toggle** (from Coming Soon, but lives here): swaps the system prompt from factual recall to reflective reframing — connects ideas, thoughts, and feelings across the month to offer novel interpretations. Same retrieval pipeline, different voice and temperature.

### 4. Memory explainer — route `/memory`

The Task 2 showcase:

- Interactive walkthrough of the memory architecture: L0 raw segments → L1 daily digests → L2 weekly summaries, plus entity/thread memory and the embedding index. What is kept forever, what is compacted, what is dropped.
- **Live context inspector**: for the most recent generation (letter or chat turn), show exactly which segments/digests/entities were retrieved, why (similarity score / recency / entity match), and the token budget breakdown. This is the "glass box."

### 5. Coming Soon — route `/future`

"What's next" page. Four working previews (preview fidelity, real data, clearly labeled as previews):

1. **Relationship manager** — interactive graph (React Flow): people as draggable nodes sized by mention count, edges as conversation/mention links. Clicking a node or edge opens the actual segments mentioning that person.
2. **Habit & affirmation checker** — the promises you made yourself, extracted from real intentions, each with resurfacing count and an arc label: kept / drifting / dropped.
3. **Therapist mode** — teaser card here linking to the toggle in chat (the functional part lives in `/chat`).
4. **Export & hard delete** — fully functional: one button downloads all data (segments, digests, embeddings, generated content) as a JSON file; another wipes IndexedDB + localStorage after confirmation. This literally demonstrates "the data belongs to the user."

## UI design language (matching Nirva's brand)

Reference: the Nirva marketing site (screenshot at `assets/image-70d2f6dd-49f9-4e11-92b5-9bc3ab047d5c.png` in the agent project folder) — silver pendant over still water with ripples. Calm, airy, jewelry-grade. The app should feel like a quiet ritual, not a dashboard.

- **Palette**: white/off-white base (`#fafbfc`), pale sky-blue accents (`#dbeafe` → `#93c5fd`), soft silver-gray text (Tailwind `slate-500`/`slate-700`), one deep blue (`#1d4ed8`-ish) for emphasis only. No dark heavy colors. Emotion chips use muted pastel tints (e.g., anxiety = pale amber, contentment = pale sky, frustration = pale rose — keep saturation low).
- **Typography**: geometric sans for headings with generous letter-spacing, lowercase wordmark styling ("nirva") — use **Sora** or **Manrope** via Google Fonts. Letter bodies (daily/weekly letters) use a comfortable reading face (a soft serif like **Lora**, or the same sans at relaxed leading) so they feel written, not rendered.
- **Layout**: generous whitespace, wide margins. Letters render in a single centered column (~720px max width). Cards: very soft shadows, `rounded-2xl`/`rounded-3xl`, hairline `slate-100` borders.
- **Texture & motion**: subtle water-ripple/radial-gradient hero backgrounds in CSS (no heavy image assets). Gentle fade/slide transitions between views. Loading states use a soft "breathing" pulse (a nod to the orb idea in the dataset). Prefer CSS transitions; Framer Motion only if trivial.
- **Charts**: Recharts styled to match — thin 1.5px lines, pale blue low-opacity gradient fills, no gridline clutter, rounded frosted tooltips.
- **Navigation**: minimal top bar — small lowercase wordmark left, pill-shaped nav links right (Day / Month / Chat / Memory / Future), frosted glass (`backdrop-blur`) once scrolled.

## Non-negotiables

- **No backend.** Static SPA. All LLM calls are direct browser → OpenAI with a user-pasted API key.
- **No mock data.** Every view renders from the real dataset. LLM-generated content is generated from real context, then cached.
- **Graceful no-key state.** Without an API key, all deterministic views (timelines, charts, threads, heatmap, patterns, relationship graph, habits, export/delete) work fully; generated content shows an elegant "add your key" prompt.
- **Privacy story is real**: key in localStorage only, data never leaves the browser except to OpenAI, export + hard delete actually work.
