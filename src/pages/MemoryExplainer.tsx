import ArchitectureDiagram from './memory/ArchitectureDiagram';
import ContextInspector from './memory/ContextInspector';

export default function MemoryExplainer() {
  return (
    <div className="mx-auto max-w-3xl space-y-14">
      <header className="text-center">
        <p className="text-xs lowercase tracking-[0.24em] text-slate-400">memory</p>
        <h1 className="mt-2 text-3xl font-light text-slate-700">how nirva remembers</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
          a month today, a year from now — the same shape. raw moments are kept forever, compacted
          into digests and summaries as horizons grow, and indexed so any of them can be found again.
          hover the layers to see what is kept and why.
        </p>
      </header>

      <section>
        <ArchitectureDiagram />
      </section>

      <section>
        <div className="mb-5 text-center">
          <h2 className="text-xl font-light lowercase text-slate-700">the glass box</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
            whenever nirva writes a letter or answers a question, it assembles context and records a
            trace — every item it chose, the reason, and the token cost. this is the most recent one,
            live.
          </p>
        </div>
        <ContextInspector />
      </section>
    </div>
  );
}
