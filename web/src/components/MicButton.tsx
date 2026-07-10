import { useEffect, useRef, useState } from 'react';

type MicButtonProps = {
  /** Called with recognized Tamil text chunks as dictation proceeds. */
  onTranscript: (text: string) => void;
};

// The Web Speech API is still vendor-prefixed in most browsers.
type SpeechRecognitionCtor = new () => any;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Microphone / speech-to-text button.
 *
 * Speech recognition is future work; where the browser already exposes the Web
 * Speech API this wires up Tamil (ta-IN) dictation for free (frontend only, no
 * backend). Where it doesn't, the button renders disabled with a "coming soon"
 * tooltip so the affordance is present today.
 */
export function MicButton({ onTranscript }: MicButtonProps) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    setSupported(true);
    const recognition = new Ctor();
    recognition.lang = 'ta-IN';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) {
          text += event.results[i][0].transcript;
        }
      }
      if (text) onTranscript(text);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.stop();
      } catch {
        /* noop */
      }
    };
  }, [onTranscript]);

  const toggle = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (listening) {
      recognition.stop();
      setListening(false);
    } else {
      try {
        recognition.start();
        setListening(true);
      } catch {
        setListening(false);
      }
    }
  };

  const title = supported
    ? listening
      ? 'கேட்கிறது... நிறுத்த சொடுக்கவும்'
      : 'குரல் வழி எழுத்து (ta-IN)'
    : 'குரல் வழி எழுத்து — விரைவில் / coming soon';

  return (
    <button
      type="button"
      className={`micButton${listening ? ' listening' : ''}`}
      onClick={supported ? toggle : undefined}
      disabled={!supported}
      aria-pressed={listening}
      aria-label={title}
      title={title}
    >
      <span aria-hidden="true">🎤</span>
    </button>
  );
}
