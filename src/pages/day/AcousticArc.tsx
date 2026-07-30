import { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Card from '../../components/Card';
import { formatHour } from '../../lib/dates';
import type { DayAggregate } from '../../types';

interface ArcPoint {
  label: string;
  count: number;
  pitch: number;
  loudness: number;
  prosody: number;
  nPitch: number;
  nLoudness: number;
  nProsody: number;
}

// Min-max normalize so three very different scales (Hz, dB, 0..1) share one
// quiet chart; the tooltip still reports raw values.
function normalizer(values: number[]): (v: number) => number {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return () => 0.5;
  return (v) => (v - min) / (max - min);
}

const series = [
  { key: 'nProsody', label: 'prosody', color: '#93c5fd' },
  { key: 'nPitch', label: 'pitch', color: '#60a5fa' },
  { key: 'nLoudness', label: 'loudness', color: '#cbd5e1' },
] as const;

function ArcTooltip({ active, payload }: { active?: boolean; payload?: { payload: ArcPoint }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-[0_8px_28px_rgba(148,163,184,0.18)] backdrop-blur">
      <p className="text-xs font-medium lowercase tracking-wide text-slate-500">
        {point.label} · {point.count} moment{point.count === 1 ? '' : 's'}
      </p>
      <div className="mt-1.5 space-y-0.5 text-xs text-slate-500">
        <p>pitch {point.pitch.toFixed(0)} hz</p>
        <p>loudness {point.loudness.toFixed(1)} db</p>
        <p>prosody {point.prosody.toFixed(2)}</p>
      </div>
    </div>
  );
}

export default function AcousticArc({ hourly }: { hourly: DayAggregate['hourly'] }) {
  const nPitch = normalizer(hourly.map((h) => h.pitch));
  const nLoudness = normalizer(hourly.map((h) => h.loudness));
  const nProsody = normalizer(hourly.map((h) => h.prosody));
  const data: ArcPoint[] = hourly.map((h) => ({
    label: formatHour(h.hour),
    count: h.count,
    pitch: h.pitch,
    loudness: h.loudness,
    prosody: h.prosody,
    nPitch: nPitch(h.pitch),
    nLoudness: nLoudness(h.loudness),
    nProsody: nProsody(h.prosody),
  }));

  return (
    <Card>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xs lowercase tracking-[0.24em] text-slate-400">the shape of the day</h2>
        <div className="flex items-center gap-4">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-xs lowercase text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} aria-hidden />
              {s.label}
            </span>
          ))}
        </div>
      </div>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id="prosodyFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#93c5fd" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#93c5fd" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis hide domain={[-0.05, 1.1]} />
            <Tooltip content={<ArcTooltip />} cursor={{ stroke: '#dbeafe', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="nProsody"
              stroke="#93c5fd"
              strokeWidth={1.5}
              fill="url(#prosodyFill)"
              dot={false}
            />
            <Line type="monotone" dataKey="nPitch" stroke="#60a5fa" strokeWidth={1.5} dot={false} />
            <Line
              type="monotone"
              dataKey="nLoudness"
              stroke="#cbd5e1"
              strokeWidth={1.5}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
