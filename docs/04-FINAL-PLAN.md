# FINAL PLAN

Execution plan for the Nirva deep-dive demo app. Source of truth: `docs/01-product-spec.md` (what/UX), `docs/02-architecture.md` (contracts), `docs/03-build-guide.md` (acceptance criteria). Every prompt below is self-contained and can be pasted directly into a Cursor agent.

Rules:

- Phases run **sequentially**. Prompts within a phase run **in parallel** (separate agents).
- A phase starts only when the previous phase's acceptance criteria pass and its work is merged/committed.
- Do not push to `main` until Phase 4 — every push auto-deploys to Vercel.

---

## Phase 1 — Foundation (1 prompt, blocks everything, ~1h)

### Prompt 1A — Scaffold + data pipeline

```
Read docs/01-product-spec.md, docs/02-architecture.md, and docs/03-build-guide.md (Workstream A) in this repo. Execute Workstream A exactly:

1. Scaffold a Vite + React + TypeScript app in the repo root. Configure Tailwind with the design tokens from the product spec (off-white #fafbfc base, pale sky-blue accents, slate grays; Sora or Manrope for headings and a letter-body font like Lora, loaded via Google Fonts in index.html).
2. Install deps: react-router-dom, recharts, idb, @xyflow/react. Dev deps: xlsx, tsx.
3. Create src/types.ts copied EXACTLY from the "Shared types" section of docs/02-architecture.md.
4. Write scripts/parse-data.ts per the "Data pipeline" section of docs/02-architecture.md. It reads "context/nirva_self_audio_month (1).xlsx" (sheet audio_notes, 823 rows) and emits src/data/segments.json and src/data/derived.json (days, people, threads, intentions, weeks). Tune the keyword lists against the real transcripts. Run it with npx tsx and check the outputs in.
5. Build the router shell: App.tsx with a NavBar (lowercase "nirva" wordmark left; pill nav links day / month / chat / memory / future; frosted backdrop-blur on scroll) and lazy-loaded placeholder pages for /day/:date, /month, /chat, /memory, /future. "/" redirects to /day/2026-05-11. Add a DataProvider context that statically imports both JSON files and exposes a useData() hook.
6. Create shared components: Card, EmotionChip (muted pastel tints per emotion), BreathingLoader (soft pulse), KeyPrompt (visual shell only), and a page-transition wrapper (CSS fade/slide).
7. Add vercel.json ({"framework":"vite","rewrites":[{"source":"/(.*)","destination":"/index.html"}]}), .gitignore, and update README.md (what this is, how to run, how the bring-your-own-key works).

Acceptance (verify all before finishing): npm run dev shows the nav shell on all 5 routes; segments.json has 823 records; derived.json has 28 days, 4 weeks, >=4 people, >=4 threads, >=4 intentions with sane counts (dentist intention >=4 segments; Sam is the most-mentioned person); npm run build passes with zero TS errors. Commit when green.
```

---

## Phase 2 — Parallel build (3 prompts, run concurrently, ~2.5h wall-clock)

### Prompt 2A — Day view + Month view

```
Read docs/01-product-spec.md, docs/02-architecture.md, and docs/03-build-guide.md (Workstream B) in this repo. Phase 1 is done: types, data JSON, router shell, and shared components exist. Execute Workstream B:

1. pages/DayView.tsx with subcomponents SegmentTimeline, AcousticArc, IntentionsCard, DailyLetterCard: day picker across the 28 days (2026-05-11 to 2026-06-07), letter in a ~720px centered reading column using the letter-body font, timeline of the day's segments with EmotionChips, hourly acoustic Recharts chart (thin lines, pale blue gradient fills, no gridline clutter), intentions surfaced gently. SegmentTimeline must support a ?seg=<segmentId> query param that scrolls to and highlights that segment.
2. pages/MonthView.tsx with subcomponents WeeklyLetterCard, ThreadTimeline, EmotionHeatmap, PatternInsights: 4 weekly letter cards, clickable thread arcs (fundraise, battery, orb, hiring, Sam) navigating to /day/:date, a 28-day heatmap colored by dominant emotion tint with intensity from mean prosody, and deterministic pattern-insight cards computed from derived.json.
3. Letter cards call getDailyLetter(date) / getWeeklyLetter(weekIndex) from src/memory/generate.ts and useApiKey() from src/llm/client.ts per the contracts in docs/02-architecture.md. Those modules are being built in parallel: import against the exact contract signatures. If they don't exist yet in your branch, create minimal contract-matching stubs locally to keep typecheck green but DO NOT commit the stubs — the real modules land in the same phase. Show KeyPrompt when no key, BreathingLoader while generating.
4. Match the design language strictly: calm, airy, whitespace-heavy, rounded-2xl cards, soft shadows, no dark colors.

Acceptance: without an API key both pages are complete and beautiful except the key-gated letter cards; all charts use real data; /day/2026-05-23 deep-links correctly; navigation between day and month works; build passes.
```

### Prompt 2B — LLM client + memory layer

```
Read docs/01-product-spec.md, docs/02-architecture.md, and docs/03-build-guide.md (Workstream C) in this repo. Phase 1 is done: src/types.ts and the data JSON exist. Execute Workstream C, implementing EXACTLY the module contracts in docs/02-architecture.md:

1. src/llm/client.ts: getApiKey/setApiKey/clearApiKey (localStorage key nirva_openai_key), chatCompletion (gpt-4o-mini via direct fetch), embedTexts (text-embedding-3-small, batched <=100/request), a reactive useApiKey() hook, full KeyPrompt logic (save/clear, "stored only in your browser" note, link to OpenAI key page), and a typed LlmError with friendly messages for 401/429/network.
2. src/memory/store.ts: IndexedDB db nirva-memory v1 via idb, stores embeddings/generations/chatHistory, plus exportAll() (full JSON blob: segments + derived + all IDB contents) and hardDelete() (delete DB + clear nirva_* localStorage keys). Cache keys: daily:<date>, weekly:<index>, digest:<date>.
3. src/memory/embed.ts: idempotent ensureEmbeddings(segments, onProgress) that loads from IDB and embeds only missing segments; topKSimilar by cosine.
4. src/memory/assemble.ts: assembleContext(task) implementing the three assembly policies (dailyLetter: full day verbatim + prev digest + intentions/threads, ~6k tokens; weeklyLetter: 7 daily digests generated on demand + thread states + high-signal segments, ~6k; chat: top-12 embedding retrieval merged with entity keyword matches, ~5k). Every call returns a full ContextTrace (items with type/refId/text/reason/tokens). Include the three system-prompt registers (letter voice, companion recall with mandatory citations, therapist reframing) and expose getLatestTrace() plus a subscription for the explainer page.
5. src/memory/generate.ts: cache-first getDailyLetter/getWeeklyLetter (weekly first fills missing daily digests), askChat(question, mode, history) that parses the trailing [[cite:id1,id2]] line into ChatMessage.citations and strips it from display text.

Acceptance: with a real key, a daily letter generates in <10s and is instant on second call (cache); its trace lists that day's segments with reasons and token estimates; embeddings build once with progress and skip on reload; a chat call returns citations mapping to real segment ids; a bad key surfaces a friendly LlmError. Build passes. Do not modify any page components except a small dev harness if needed (do not commit the harness).
```

### Prompt 2C — Coming Soon previews

```
Read docs/01-product-spec.md, docs/02-architecture.md, and docs/03-build-guide.md (Workstream E) in this repo. Phase 1 is done: types, data JSON, router shell, shared components. Execute Workstream E — pages/ComingSoon.tsx at route /future with a short hero ("what nirva is growing toward") and four sections, each labeled "preview":

1. RelationshipGraph.tsx using @xyflow/react: a center "you" node with person nodes from derived.json people (draggable, circular, sized by segmentIds.length, soft pastel styling), edges labeled with mention counts. Clicking a node or edge opens a side panel listing that person's real segments as time-stamped quotes linking to /day/:date.
2. HabitChecker.tsx: one card per intention from derived.json — label, resurfacing count, a 28-day dot strip marking each resurfacing date, and a status pill (kept / drifting / dropped).
3. A therapist-mode teaser card linking to /chat?mode=therapist (the chat page is built in a later phase; just link).
4. ExportDelete.tsx: fully functional. Export calls exportAll() from src/memory/store.ts and downloads nirva-export.json; Hard delete shows a confirm ("this erases everything nirva remembers — there is no undo"), calls hardDelete(), and reloads. store.ts is being built in parallel against the contract in docs/02-architecture.md — import the contract signatures; if the module isn't in your branch yet, stub locally to typecheck but DO NOT commit stubs.

Match the design language (calm, airy, pastel, rounded-2xl). Acceptance: nodes drag smoothly; clicking Sam shows Sam's actual segments; the dentist habit shows its 4+ resurfacings on correct dates; export downloads valid JSON; hard delete leaves a clean first-visit state; build passes.
```

**Phase 2 merge gate:** merge 2B first, then 2A and 2C (their contract imports must resolve against 2B's real modules). Full build green, no leftover stubs.

---

## Phase 3 — Chat + memory explainer (1 prompt, needs Phase 2, ~1.5h)

### Prompt 3A — Chat + glass-box explainer

```
Read docs/01-product-spec.md, docs/02-architecture.md, and docs/03-build-guide.md (Workstream D) in this repo. Phases 1–2 are done: all pages except /chat and /memory are real, and the memory layer (src/memory/*, src/llm/client.ts) is fully implemented. Execute Workstream D:

1. pages/Chat.tsx: calm message-thread UI (user right, nirva left), input box, history persisted via chatHistory in src/memory/store.ts, answers from askChat() in src/memory/generate.ts. Render each answer's citations as chips below it linking to /day/:date?seg=<encoded segment id> (DayView already supports ?seg= highlighting). Add a Companion / Therapist pill toggle passing mode through to askChat; read ?mode=therapist from the URL to preset it (the /future page links here). Therapist mode gets a slightly warmer accent tint. Show KeyPrompt when no key.
2. pages/MemoryExplainer.tsx with ArchitectureDiagram and ContextInspector subcomponents: a visual interactive walkthrough of the memory architecture (L0 raw segments -> L1 daily digests -> L2 weekly summaries, plus entity/thread memory and the embedding index) with hoverable keep-vs-drop explanations (raw kept, digests compact, embeddings enable recall, nothing silently deleted). The ContextInspector subscribes to getLatestTrace() from src/memory/assemble.ts and renders the latest generation's trace live: items grouped by type, reason badges, and a token bar of budget vs used. Empty state invites the user to generate a letter first.

Acceptance: a chat question about the raise returns a grounded answer whose citation chips jump to the correct highlighted segments; toggling therapist mode changes the voice; after generating any letter the inspector shows its real trace with correct token breakdown; build passes.
```

---

## Phase 4 — Integration, QA, deploy (1 prompt, needs Phase 3, ~1h)

### Prompt 4A — Final polish + ship

```
Read docs/03-build-guide.md (Final integration + deploy) in this repo. All five pages and the memory layer are complete. Finish and ship:

1. Cross-wire loose ends: verify ?seg= highlighting from chat citations, ?mode=therapist preset from /future, nav active states, page transitions on all routes, favicon, <title> "nirva — a month, witnessed", Google Fonts preconnect.
2. Visual QA at 1440px and ~390px on all five pages: nav collapses gracefully on mobile, letters stay readable, charts don't overflow. Fix issues in the spirit of the design language in docs/01-product-spec.md (calmer, quieter, more whitespace).
3. npm run build clean with zero TS errors; sanity-check with npx vite preview (all routes render; client-side nav to every page works).
4. Verify vercel.json has framework "vite" and the SPA rewrite to /index.html. Commit everything and push to main on shaan-m-patel/Nirva-Health — Vercel auto-deploys. If the Vercel build uses the wrong preset (project was imported as Create React App), switch the project framework preset to Vite via the Vercel MCP or dashboard and redeploy.
5. Smoke-test the production URL: every route loads on hard refresh (deep links included), API key entry works, a daily letter generates end to end, export downloads, hard delete resets cleanly.

Report the production URL and any deviations when done.
```

---

## Timeline summary


| Phase | Prompts                                 | Parallel?      | Est. wall-clock |
| ----- | --------------------------------------- | -------------- | --------------- |
| 1     | 1A scaffold + data                      | no             | ~1h             |
| 2     | 2A views, 2B memory/LLM, 2C coming soon | yes (3 agents) | ~2.5h           |
| 3     | 3A chat + explainer                     | no             | ~1.5h           |
| 4     | 4A polish + deploy                      | no             | ~1h             |


Total: ~6h wall-clock.