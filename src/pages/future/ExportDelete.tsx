import { useState } from 'react';
import Card from '../../components/Card';
import { exportAll, hardDelete } from '../../memory/store';

// Fully functional (not preview-fidelity): the privacy promise, demonstrated.
export default function ExportDelete() {
  const [exporting, setExporting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await exportAll();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'nirva-export.json';
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function handleHardDelete() {
    setDeleting(true);
    await hardDelete();
    window.location.reload();
  }

  return (
    <div>
      <p className="text-sm text-slate-500">
        your data belongs to you. everything nirva remembers lives in this browser — take it with you, or
        erase it completely.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card>
          <h3 className="font-display text-base lowercase text-slate-700">export everything</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
            one file with every segment, derived pattern, cached letter, embedding, and chat turn.
          </p>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="mt-4 rounded-full bg-sky-pale/70 px-5 py-2 text-sm lowercase text-deep transition-colors hover:bg-sky-pale disabled:opacity-50"
          >
            {exporting ? 'preparing…' : 'download nirva-export.json'}
          </button>
        </Card>
        <Card>
          <h3 className="font-display text-base lowercase text-slate-700">hard delete</h3>
          {confirming ? (
            <>
              <p className="mt-1.5 text-sm leading-relaxed text-rose-500">
                this erases everything nirva remembers — there is no undo.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleHardDelete}
                  disabled={deleting}
                  className="rounded-full bg-rose-50 px-5 py-2 text-sm lowercase text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-50"
                >
                  {deleting ? 'erasing…' : 'yes, erase everything'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={deleting}
                  className="rounded-full px-4 py-2 text-sm lowercase text-slate-400 transition-colors hover:bg-mist hover:text-slate-600"
                >
                  keep my memories
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                wipes the memory database and every nirva key from this browser, leaving a clean first visit.
              </p>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="mt-4 rounded-full border border-rose-100 px-5 py-2 text-sm lowercase text-rose-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
              >
                delete everything
              </button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
