import Card from '../components/Card';
import KeyPrompt from '../components/KeyPrompt';

// Placeholder shell — Workstream D builds the companion chat against this route.
export default function Chat() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <p className="text-sm lowercase tracking-widest text-slate-400">chat</p>
        <h1 className="mt-1 text-3xl font-light text-slate-700">ask your month anything</h1>
      </header>
      <Card>
        <p className="text-sm text-slate-400">
          the companion — grounded answers with tap-to-source citations — arrives with workstream D.
        </p>
      </Card>
      <KeyPrompt />
    </div>
  );
}
