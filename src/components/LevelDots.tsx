import { MAX_LEVEL } from '../lib/mastery';

export default function LevelDots({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={level >= MAX_LEVEL ? 'Đã thuộc' : `Bậc ${level} trên ${MAX_LEVEL}`}>
      {Array.from({ length: MAX_LEVEL }, (_, i) => (
        <span key={i} className={`h-2 w-2 rounded-full ${i < level ? (level >= MAX_LEVEL ? 'bg-success' : 'bg-primary') : 'bg-line'}`} />
      ))}
    </span>
  );
}
