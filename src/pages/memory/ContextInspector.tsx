import { useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import { getLatestTrace, subscribeTrace } from '../../memory/assemble';
import { DEFAULT_DATE, formatShortDate } from '../../lib/dates';
import type { ContextItem, GenTask } from '../../types';

const TYPE_ORDER: ContextItem['type'][] = ['segment', 'dailyDigest', 'weeklySummary', 'entity'];

const TYPE_META: Record<ContextItem['type'], { label: string; bar: string; badge: string }> = {
  segment: { label: 'raw segments (L0)', bar: 'bg-sky-mid', badge: 'bg-sky-50 text-sky-700' },
  dailyDigest: { label: 'daily digests (L1)', bar: 'bg-indigo-300', badge: 'bg-indigo-50 text-indigo-600' },
  weeklySummary: { label: 'weekly summaries (L2)', bar: 'bg-violet-300', badge: 'bg-violet-50 text-violet-600' },
  entity: { label: 'entity & thread memory', bar: 'bg-emerald-300', badge: 'bg-emerald-50 text-emerald-700' },
};

function taskLabel(task: GenTask): string {
  switch (task.kind) {
    case 'dailyLetter':
      return `daily letter · ${formatShortDate(task.date)}`;
    case 'weeklyLetter':
      return `weekly letter · week ${task.weekIndex + 1}`;
    case 'chat':
      return `chat (${task.mode}) · “${task.question}”`;
  }
}

function ItemRow({ item }: { item: ContextItem }) {
  const meta = TYPE_META[item.type];
  const body = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] lowercase ${meta.badge}`}>
          {item.reason}
        </span>
        <span className="text-[11px] tabular-nums text-slate-400">{item.refId}</span>
        <span className="ml-auto text-[11px] tabular-nums text-slate-300">~{item.tokens} tok</span>
      </div>
      <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-slate-500">{item.text}</p>
    </>
  );

  if (item.type === 'segment') {
    const date = item.refId.slice(0, 10);
    return (
      <Link
        to={`/day/${date}?seg=${encodeURIComponent(item.refId)}`}
        className="block rounded-xl px-3 py-2 transition-colors hover:bg-mist/70"
      >
        {body}
      </Link>
    );
  }
  return <div className="rounded-xl px-3 py-2">{body}</div>;
}

/** The glass box — renders the latest generation's ContextTrace live. */
export default function ContextInspector() {
  const trace = useSyncExternalStore(subscribeTrace, getLatestTrace, () => null);

  if (!trace) {
    return (
      <Card className="text-center">
        <div
          className="animate-breathe mx-auto mb-4 h-8 w-8 rounded-full"
          style={{ background: 'radial-gradient(circle at 40% 35%, #dbeafe, #93c5fd)' }}
          aria-hidden
        />
        <p className="text-sm leading-relaxed text-slate-500">
          nothing to inspect yet this session — generate something first, and the exact context nirva
          assembled for it will appear here.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link
            to={`/day/${DEFAULT_DATE}`}
            className="rounded-full bg-sky-pale/70 px-4 py-2 text-sm lowercase text-deep transition-opacity hover:opacity-80"
          >
            open a day's letter
          </Link>
          <Link
            to="/chat"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm lowercase text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700"
          >
            ask the chat
          </Link>
        </div>
      </Card>
    );
  }

  const groups = TYPE_ORDER.map((type) => ({
    type,
    items: trace.items.filter((item) => item.type === type),
  })).filter((group) => group.items.length > 0);

  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium lowercase text-slate-700">{taskLabel(trace.task)}</h3>
        <span className="text-xs tabular-nums text-slate-400">
          {new Date(trace.timestamp).toLocaleTimeString()}
        </span>
      </div>

      <div className="mt-5">
        <div className="flex items-baseline justify-between text-xs text-slate-400">
          <span className="lowercase tracking-wide">token budget</span>
          <span className="tabular-nums">
            ~{trace.tokensUsed.toLocaleString()} of {trace.tokenBudget.toLocaleString()} used
          </span>
        </div>
        <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
          {groups.map((group) => {
            const tokens = group.items.reduce((sum, item) => sum + item.tokens, 0);
            return (
              <div
                key={group.type}
                className={TYPE_META[group.type].bar}
                style={{ width: `${(tokens / trace.tokenBudget) * 100}%` }}
                title={`${TYPE_META[group.type].label}: ~${tokens} tokens`}
              />
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {groups.map((group) => (
            <span key={group.type} className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className={`h-2 w-2 rounded-full ${TYPE_META[group.type].bar}`} aria-hidden />
              {TYPE_META[group.type].label} · {group.items.length} items · ~
              {group.items.reduce((sum, item) => sum + item.tokens, 0)} tok
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {groups.map((group) => (
          <section key={group.type}>
            <h4 className="mb-1 px-3 text-[10px] lowercase tracking-[0.2em] text-slate-400">
              {TYPE_META[group.type].label}
            </h4>
            <div className="space-y-0.5">
              {group.items.map((item, index) => (
                <ItemRow key={`${item.refId}-${index}`} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <details className="mt-6 rounded-2xl bg-mist/60 px-4 py-3">
        <summary className="cursor-pointer text-xs lowercase tracking-wide text-slate-400 transition-colors hover:text-slate-600">
          the voice — system prompt used
        </summary>
        <p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-slate-500">
          {trace.systemPrompt}
        </p>
      </details>
    </Card>
  );
}
