import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import RelationshipGraph from './future/RelationshipGraph';
import HabitChecker from './future/HabitChecker';
import ExportDelete from './future/ExportDelete';

function Section({ title, blurb, children }: { title: string; blurb: string; children: ReactNode }) {
  return (
    <section>
      <div className="flex items-baseline gap-3">
        <h2 className="font-display text-xl font-light lowercase text-slate-700">{title}</h2>
        <span className="rounded-full bg-sky-pale/60 px-2.5 py-0.5 text-[11px] lowercase tracking-widest text-deep">
          preview
        </span>
      </div>
      <p className="mt-1 max-w-xl text-sm text-slate-400">{blurb}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function ComingSoon() {
  return (
    <div className="space-y-16">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-sm lowercase tracking-widest text-slate-400">future</p>
        <h1 className="mt-1 text-3xl font-light text-slate-700">what nirva is growing toward</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-400">
          four early looks at where a month of witnessed moments can go next — each one already running on
          your real data.
        </p>
      </header>

      <Section
        title="relationship manager"
        blurb="the people in your days, drawn as a living map. drag them around; click a person or a thread to read the actual moments you mentioned them."
      >
        <RelationshipGraph />
      </Section>

      <Section
        title="habit & affirmation checker"
        blurb="the promises you made yourself out loud, kept in view — each resurfacing marked on the month."
      >
        <HabitChecker />
      </Section>

      <Section
        title="therapist mode"
        blurb="the same memory, a different voice — one that connects feelings and patterns across the month instead of recalling facts."
      >
        <Card className="bg-gradient-to-br from-pink-50/60 via-white to-sky-pale/40">
          <p className="max-w-xl text-sm leading-relaxed text-slate-500">
            companion chat answers what happened. therapist mode sits with why — noticing how your language
            softened around Sam, how the battery bug and the raise pulled at the same worry, and gently
            offering a reframe.
          </p>
          <Link
            to="/chat?mode=therapist"
            className="mt-4 inline-block rounded-full bg-white/80 px-5 py-2 text-sm lowercase text-deep shadow-[0_1px_8px_rgba(148,163,184,0.15)] transition-colors hover:bg-white"
          >
            try it in chat →
          </Link>
        </Card>
      </Section>

      <Section
        title="export & hard delete"
        blurb="not a promise about privacy — a working proof of it."
      >
        <ExportDelete />
      </Section>
    </div>
  );
}
