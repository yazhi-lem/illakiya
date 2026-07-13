import { useEffect, useState } from 'react';

type SpeakButtonProps = {
  /** Returns the text to read aloud at click time. */
  getText: () => string;
};

const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;

/**
 * Text-to-speech: reads the current chapter aloud with the browser's
 * SpeechSynthesis API, preferring a Tamil (ta-IN) voice. Toggles between
 * speak and stop. Disabled with a tooltip where the API is unavailable.
 */
export function SpeakButton({ getText }: SpeakButtonProps) {
  const [speaking, setSpeaking] = useState(false);
  const supported = Boolean(synth);

  // Stop any in-flight speech if the component unmounts.
  useEffect(() => () => synth?.cancel(), []);

  const pickTamilVoice = () => {
    const voices = synth?.getVoices() ?? [];
    return (
      voices.find((v) => v.lang?.toLowerCase() === 'ta-in') ??
      voices.find((v) => v.lang?.toLowerCase().startsWith('ta')) ??
      null
    );
  };

  const toggle = () => {
    if (!synth) return;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const text = getText().replace(/[#*_>`~]/g, ' ').trim();
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ta-IN';
    const voice = pickTamilVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    synth.cancel();
    setSpeaking(true);
    synth.speak(utterance);
  };

  const title = supported
    ? speaking
      ? 'நிறுத்து'
      : 'எழுதியதைப் படித்துக் காட்டு'
    : 'குரல் வாசிப்பு ஆதரவு இல்லை';

  return (
    <button
      type="button"
      className={`speakButton${speaking ? ' speaking' : ''}`}
      onClick={supported ? toggle : undefined}
      disabled={!supported}
      aria-pressed={speaking}
      aria-label={title}
      title={title}
    >
      <span aria-hidden="true">{speaking ? '⏹' : '🔊'}</span>
    </button>
  );
}
