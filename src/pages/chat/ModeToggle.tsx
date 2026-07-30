export type ChatMode = 'companion' | 'therapist';

interface ModeToggleProps {
  mode: ChatMode;
  onChange: (mode: ChatMode) => void;
}

/** Companion / Therapist pill switch — therapist gets a warmer accent tint. */
export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div
      className="inline-flex rounded-full border border-slate-200 bg-white p-1"
      role="group"
      aria-label="chat mode"
    >
      <button
        type="button"
        aria-pressed={mode === 'companion'}
        onClick={() => onChange('companion')}
        className={`rounded-full px-4 py-1.5 text-sm lowercase transition-colors ${
          mode === 'companion'
            ? 'bg-sky-pale/70 text-deep'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        companion
      </button>
      <button
        type="button"
        aria-pressed={mode === 'therapist'}
        onClick={() => onChange('therapist')}
        className={`rounded-full px-4 py-1.5 text-sm lowercase transition-colors ${
          mode === 'therapist'
            ? 'bg-rose-100/80 text-rose-700'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        therapist
      </button>
    </div>
  );
}
