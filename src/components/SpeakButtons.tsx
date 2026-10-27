import { Snail, Volume2 } from 'lucide-react';
import { speak, ttsSupported } from '../lib/speech';
import { useSettings } from '../lib/settings';

export default function SpeakButtons({ text, compact }: { text: string; compact?: boolean }) {
  const { voiceURI, rate } = useSettings();
  if (!ttsSupported) return null;
  if (compact) {
    return (
      <button
        type="button"
        className="btn btn-soft h-11 w-11 shrink-0 p-0"
        aria-label={`Nghe: ${text}`}
        onClick={(e) => {
          e.stopPropagation();
          speak(text, { voiceURI, rate });
        }}
      >
        <Volume2 size={20} aria-hidden />
      </button>
    );
  }
  return (
    <div className="flex gap-2">
      <button type="button" className="btn btn-soft flex-1" onClick={(e) => { e.stopPropagation(); speak(text, { voiceURI, rate }); }}>
        <Volume2 size={20} aria-hidden /> Nghe
      </button>
      <button type="button" className="btn btn-ghost flex-1" onClick={(e) => { e.stopPropagation(); speak(text, { voiceURI, slow: true }); }}>
        <Snail size={20} aria-hidden /> Nghe chậm
      </button>
    </div>
  );
}
