import { Link } from 'react-router-dom';
import { useData } from '../../DataProvider';
import { formatShortDate } from '../../lib/dates';
import type { ChatMessage } from '../../types';

interface MessageBubbleProps {
  message: ChatMessage;
  therapist: boolean;
}

/** One chat turn — user right, nirva left, citation chips under answers. */
export default function MessageBubble({ message, therapist }: MessageBubbleProps) {
  const { segmentById } = useData();

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-sky-pale/60 px-5 py-3 text-[15px] leading-relaxed text-slate-700">
          {message.content}
        </div>
      </div>
    );
  }

  const citations = (message.citations ?? []).filter((id) => segmentById.has(id));

  return (
    <div className="flex items-end gap-2.5">
      <span
        className="mb-1 h-6 w-6 shrink-0 rounded-full"
        style={{
          background: therapist
            ? 'radial-gradient(circle at 40% 35%, #ffe4e6, #fda4af)'
            : 'radial-gradient(circle at 40% 35%, #dbeafe, #93c5fd)',
        }}
        aria-hidden
      />
      <div
        className={`max-w-[85%] rounded-3xl rounded-bl-lg border px-5 py-3 ${
          therapist
            ? 'border-rose-100 bg-gradient-to-br from-rose-50/70 to-white'
            : 'border-slate-100 bg-white'
        }`}
      >
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-600">
          {message.content}
        </p>
        {citations.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {citations.map((id) => {
              const segment = segmentById.get(id)!;
              return (
                <Link
                  key={id}
                  to={`/day/${segment.date}?seg=${encodeURIComponent(id)}`}
                  title={segment.transcript}
                  className={`rounded-full border px-2.5 py-1 text-[11px] tabular-nums transition-colors ${
                    therapist
                      ? 'border-rose-200 bg-white/70 text-rose-700 hover:bg-rose-50'
                      : 'border-sky-soft/60 bg-white/70 text-deep hover:bg-sky-pale/50'
                  }`}
                >
                  {formatShortDate(segment.date)} · {segment.time}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
