import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import EmotionChip from '../../components/EmotionChip';
import type { Segment } from '../../types';

interface SegmentTimelineProps {
  segments: Segment[];
}

/**
 * The day's segments in order. Supports `?seg=<segmentId>` — scrolls to and
 * highlights that segment (used by intentions, threads, and chat citations).
 */
export default function SegmentTimeline({ segments }: SegmentTimelineProps) {
  const [searchParams] = useSearchParams();
  const highlightedId = searchParams.get('seg');
  const itemRefs = useRef(new Map<string, HTMLLIElement>());

  useEffect(() => {
    if (!highlightedId) return;
    let fallback: number | undefined;
    // Let the page transition settle before scrolling.
    const timer = window.setTimeout(() => {
      const el = itemRefs.current.get(highlightedId);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Smooth scrolling stalls in throttled/background tabs — snap instead.
      fallback = window.setTimeout(() => {
        const rect = el.getBoundingClientRect();
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          el.scrollIntoView({ block: 'center' });
        }
      }, 900);
    }, 150);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(fallback);
    };
  }, [highlightedId, segments]);

  return (
    <section>
      <h2 className="mb-4 text-xs lowercase tracking-[0.24em] text-slate-400">
        the day, moment by moment
      </h2>
      <ol className="space-y-1">
        {segments.map((segment) => {
          const highlighted = segment.id === highlightedId;
          return (
            <li
              key={segment.id}
              ref={(el) => {
                if (el) itemRefs.current.set(segment.id, el);
                else itemRefs.current.delete(segment.id);
              }}
              className={`grid grid-cols-[3.5rem_1fr] gap-4 rounded-2xl px-4 py-3 transition-colors duration-500 ${
                highlighted ? 'bg-sky-pale/50 ring-1 ring-sky-soft' : 'hover:bg-mist/70'
              }`}
            >
              <div className="relative pt-0.5">
                <span className="text-xs tabular-nums text-slate-400">{segment.time}</span>
                <span
                  className={`absolute -right-2 top-2 h-1.5 w-1.5 rounded-full ${
                    segment.emotions.length > 0 ? 'bg-sky-mid' : 'bg-slate-200'
                  }`}
                  aria-hidden
                />
              </div>
              <div className="min-w-0">
                <p className="text-[15px] leading-relaxed text-slate-600">{segment.transcript}</p>
                {segment.emotions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {segment.emotions.map((emotion) => (
                      <EmotionChip
                        key={emotion.label}
                        label={emotion.label}
                        confidence={emotion.confidence}
                      />
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
