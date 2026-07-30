import { emotionTint } from '../lib/colors';

interface EmotionChipProps {
  label: string;
  confidence?: number;
}

export default function EmotionChip({ label, confidence }: EmotionChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs lowercase ${emotionTint(label)}`}
      title={confidence !== undefined ? `${label} · ${Math.round(confidence * 100)}%` : label}
    >
      {label}
      {confidence !== undefined && (
        <span className="opacity-50">{Math.round(confidence * 100)}%</span>
      )}
    </span>
  );
}
