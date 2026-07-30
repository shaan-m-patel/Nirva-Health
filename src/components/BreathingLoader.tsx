interface BreathingLoaderProps {
  label?: string;
}

/** Soft breathing pulse — a nod to the orb in the dataset. */
export default function BreathingLoader({ label }: BreathingLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div
        className="animate-breathe h-10 w-10 rounded-full"
        style={{ background: 'radial-gradient(circle at 40% 35%, #dbeafe, #93c5fd)' }}
        aria-hidden
      />
      {label && <p className="text-sm lowercase tracking-wide text-slate-400">{label}</p>}
    </div>
  );
}
