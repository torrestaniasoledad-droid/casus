// Tipos mínimos para la Web Speech API (no vienen en las librerías estándar de TS).
// Solo cubre lo que usa /app/dashboard/create/page.tsx para el dictado por voz.

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResult {
  0: SpeechRecognitionResultItem;
  isFinal: boolean;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResult[];
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}
