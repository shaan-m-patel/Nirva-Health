import { useEffect, useState } from 'react';
import { useData } from '../../DataProvider';
import { subscribeTrace } from '../../memory/assemble';
import { getMemoryStats, type MemoryStats } from '../../memory/store';

type NodeKey = 'l0' | 'l1' | 'l2' | 'entities' | 'embeddings' | 'assembler';

interface NodeInfo {
  title: string;
  policy: string;
  policyTint: string;
  detail: string;
}

const NODES: Record<NodeKey, NodeInfo> = {
  l0: {
    title: 'L0 — raw segments',
    policy: 'kept forever',
    policyTint: 'bg-emerald-50 text-emerald-700',
    detail:
      'every raw moment is stored verbatim and never deleted. letters, summaries, and chat answers all trace back to these originals — compaction happens in the layers above, never here. the only thing that removes them is your own hard delete.',
  },
  l1: {
    title: 'L1 — daily digests',
    policy: 'compact, cached',
    policyTint: 'bg-sky-50 text-sky-700',
    detail:
      'each day is compressed into a 3–5 sentence digest the first time it is needed, then cached. digests keep the story cheap enough to carry forward for months — but they are summaries on top of the raw day, not replacements for it.',
  },
  l2: {
    title: 'L2 — weekly summaries',
    policy: 'compact, cached',
    policyTint: 'bg-sky-50 text-sky-700',
    detail:
      'weekly letters read the seven digests beneath them, plus a few high-signal moments, to hold the arc of the month. as time horizons grow, nirva reads summaries of summaries — while the originals stay untouched at L0.',
  },
  entities: {
    title: 'entity & thread memory',
    policy: 'derived, rebuildable',
    policyTint: 'bg-violet-50 text-violet-600',
    detail:
      'people, storylines, and self-promises — Sam, the raise, the dentist — are extracted deterministically from the raw transcripts. because they are derived, they can always be recomputed from L0; dropping them loses nothing.',
  },
  embeddings: {
    title: 'embedding index',
    policy: 'enables recall, rebuildable',
    policyTint: 'bg-violet-50 text-violet-600',
    detail:
      'each segment is embedded once into a vector so questions can find moments by meaning, not keywords. the index is what lets recall scale to a year of memories — and it can be rebuilt from L0 at any time.',
  },
  assembler: {
    title: 'context assembler',
    policy: 'per-generation',
    policyTint: 'bg-slate-100 text-slate-500',
    detail:
      'for every letter or answer, the assembler picks the right mix — raw segments, digests, entities, similar moments — under a token budget, and records exactly what it chose and why. that record is the trace in the inspector below. nothing is ever silently deleted: what is not chosen simply waits.',
  },
};

function Node({
  nodeKey,
  caption,
  active,
  onSelect,
}: {
  nodeKey: NodeKey;
  caption: string;
  active: boolean;
  onSelect: (key: NodeKey) => void;
}) {
  const node = NODES[nodeKey];
  return (
    <button
      type="button"
      onMouseEnter={() => onSelect(nodeKey)}
      onFocus={() => onSelect(nodeKey)}
      onClick={() => onSelect(nodeKey)}
      className={`w-full rounded-2xl border p-4 text-left transition-colors ${
        active ? 'border-sky-mid bg-sky-pale/30' : 'border-slate-100 bg-white hover:border-sky-soft'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium lowercase text-slate-700">{node.title}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] lowercase tracking-wide ${node.policyTint}`}>
          {node.policy}
        </span>
      </div>
      <p className="mt-1.5 text-xs tabular-nums text-slate-400">{caption}</p>
    </button>
  );
}

function Arrow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-1 pl-5 text-slate-300" aria-hidden>
      <span className="text-base leading-none">↓</span>
      <span className="text-[10px] lowercase tracking-widest">{label}</span>
    </div>
  );
}

/** Interactive walkthrough of the memory hierarchy with keep-vs-drop explanations. */
export default function ArchitectureDiagram() {
  const { segments, derived } = useData();
  const [active, setActive] = useState<NodeKey>('l0');
  const [stats, setStats] = useState<MemoryStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = () =>
      getMemoryStats().then((next) => {
        if (!cancelled) setStats(next);
      });
    void refresh();
    // New generations change what's cached — keep the live counts honest.
    const unsubscribe = subscribeTrace(() => void refresh());
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const dayCount = derived.days.length;
  const node = NODES[active];

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-[10px] lowercase tracking-[0.2em] text-slate-400">
            the hierarchy — compaction, not deletion
          </p>
          <Node
            nodeKey="l0"
            caption={`${segments.length} segments · ${dayCount} days · verbatim`}
            active={active === 'l0'}
            onSelect={setActive}
          />
          <Arrow label="compact each day" />
          <Node
            nodeKey="l1"
            caption={`${stats ? stats.digests : '—'} of ${dayCount} digests cached`}
            active={active === 'l1'}
            onSelect={setActive}
          />
          <Arrow label="summarize each week" />
          <Node
            nodeKey="l2"
            caption={`${stats ? stats.weeklyLetters : '—'} of ${derived.weeks.length} weekly letters written`}
            active={active === 'l2'}
            onSelect={setActive}
          />
        </div>
        <div>
          <p className="mb-2 text-[10px] lowercase tracking-[0.2em] text-slate-400">
            derived from L0 — always rebuildable
          </p>
          <Node
            nodeKey="entities"
            caption={`${derived.people.length} people · ${derived.threads.length} threads · ${derived.intentions.length} intentions`}
            active={active === 'entities'}
            onSelect={setActive}
          />
          <div className="py-2" />
          <Node
            nodeKey="embeddings"
            caption={`${stats ? stats.embeddings : '—'} of ${segments.length} vectors indexed`}
            active={active === 'embeddings'}
            onSelect={setActive}
          />
        </div>
      </div>

      <div className="flex justify-center py-1 text-slate-300" aria-hidden>
        <span className="text-base leading-none">↓ &nbsp;↓ &nbsp;↓</span>
      </div>
      <Node
        nodeKey="assembler"
        caption="every layer feeds one budgeted prompt per generation"
        active={active === 'assembler'}
        onSelect={setActive}
      />

      <div className="mt-4 rounded-2xl bg-mist/70 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium lowercase text-slate-700">{node.title}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] lowercase tracking-wide ${node.policyTint}`}>
            {node.policy}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{node.detail}</p>
      </div>
    </div>
  );
}
