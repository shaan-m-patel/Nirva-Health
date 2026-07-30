# nirva — a month, witnessed

A working demo for Nirva's AI engineer design deep-dive: one real month of a founder's
self-captured audio (823 segments across 28 days, May 11 – June 7, 2026) turned into a
private life journal and companion. Daily and weekly letters, storyline arcs, a grounded
chat with citations, and a "glass box" view of the memory layer that powers it all.

Everything runs in the browser — a static SPA with no backend. See `docs/01-product-spec.md`
(what and why), `docs/02-architecture.md` (how), and `docs/03-build-guide.md` (execution plan).

## Run it

```sh
npm install
npm run dev      # dev server
npm run build    # type-check + production build
```

The dataset is already parsed and checked in (`src/data/segments.json`, `src/data/derived.json`).
To regenerate from the source spreadsheet:

```sh
npm run parse-data   # reads context/nirva_self_audio_month (1).xlsx
```

## Bring your own key

All deterministic views — timelines, charts, threads, the heatmap, the relationship graph,
export and delete — work with no setup. Generated content (daily/weekly letters, chat) uses
the OpenAI API directly from your browser with a key you paste in:

- The key is stored in `localStorage` only, never on any server.
- Your data never leaves the browser except in requests you trigger to OpenAI.
- Generated letters are cached locally (IndexedDB) so each is written once.
- Export downloads everything nirva knows as JSON; hard delete wipes it all.

## Deploy

Static Vite output on Vercel; `vercel.json` sets the framework and the SPA rewrite.
Every push to `main` auto-deploys.
