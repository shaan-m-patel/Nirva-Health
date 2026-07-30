interface LetterBodyProps {
  text: string;
  /** "full" for the day view's reading column, "compact" for weekly cards. */
  size?: 'full' | 'compact';
}

/** Renders generated letter text as calm serif paragraphs. */
export default function LetterBody({ text, size = 'full' }: LetterBodyProps) {
  const paragraphs = text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <article
      className={`font-letter text-slate-600 ${
        size === 'full' ? 'space-y-5 text-[17px] leading-8' : 'space-y-4 text-[15px] leading-7'
      }`}
    >
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </article>
  );
}
