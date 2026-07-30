import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DayAggregate } from '../../types';

function dayNumber(date: string) {
  return new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(new Date(`${date}T12:00:00`));
}

interface DayPickerProps {
  days: DayAggregate[];
  selectedDate: string;
}

export default function DayPicker({ days, selectedDate }: DayPickerProps) {
  const navigate = useNavigate();
  const activeRef = useRef<HTMLButtonElement>(null);
  const selectedIndex = days.findIndex((day) => day.date === selectedDate);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [selectedDate]);

  const move = (offset: number) => {
    const next = days[selectedIndex + offset];
    if (next) navigate(`/day/${next.date}`);
  };

  return (
    <div className="rounded-3xl border border-white/80 bg-white/70 p-2 shadow-[0_8px_28px_rgba(148,163,184,0.08)] backdrop-blur">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => move(-1)}
          disabled={selectedIndex <= 0}
          aria-label="Previous day"
          className="shrink-0 rounded-full p-3 text-slate-400 transition hover:bg-sky-50 hover:text-slate-600 disabled:opacity-20"
        >
          ←
        </button>
        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto py-1 [scrollbar-width:none]">
          {days.map((day) => {
            const active = day.date === selectedDate;
            return (
              <button
                ref={active ? activeRef : undefined}
                key={day.date}
                type="button"
                onClick={() => navigate(`/day/${day.date}`)}
                aria-current={active ? 'date' : undefined}
                className={`min-w-14 rounded-2xl px-3 py-2 text-center transition ${
                  active ? 'bg-sky-pale/80 text-deep shadow-sm' : 'text-slate-400 hover:bg-mist hover:text-slate-600'
                }`}
              >
                <span className="block text-[10px] font-medium uppercase tracking-[0.16em]">{day.day}</span>
                <span className="mt-0.5 block text-sm">{dayNumber(day.date)}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => move(1)}
          disabled={selectedIndex >= days.length - 1}
          aria-label="Next day"
          className="shrink-0 rounded-full p-3 text-slate-400 transition hover:bg-sky-50 hover:text-slate-600 disabled:opacity-20"
        >
          →
        </button>
      </div>
    </div>
  );
}
