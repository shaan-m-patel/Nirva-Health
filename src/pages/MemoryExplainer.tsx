import { useData } from '../DataProvider';
import Card from '../components/Card';

// Placeholder shell — Workstream D builds the memory explainer against this route.
export default function MemoryExplainer() {
  const { segments } = useData();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <p className="text-sm lowercase tracking-widest text-slate-400">memory</p>
        <h1 className="mt-1 text-3xl font-light text-slate-700">how nirva remembers</h1>
      </header>
      <Card>
        <p className="text-slate-500">{segments.length} raw segments at L0, kept forever.</p>
        <p className="mt-3 text-sm text-slate-400">
          the interactive walkthrough and live context inspector arrive with workstream D.
        </p>
      </Card>
    </div>
  );
}
