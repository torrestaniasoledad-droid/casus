"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseSpeechToTextResult {
  isSupported: boolean;
  isRecording: boolean;
  interimText: string;
  error: string | null;
  start: () => void;
  stop: () => void;
}

/**
 * Dictado por voz vía Web Speech API (nativa del navegador — Chrome/Edge la
 * soportan bien, Safari parcialmente, Firefox no). No depende de ningún
 * servicio externo ni consume créditos de la API de Anthropic: la
 * transcripción la hace el navegador, CASUS solo recibe el texto final.
 *
 * onFinalText se llama con cada fragmento ya confirmado (no interino), para
 * que el llamador lo vaya agregando al texto acumulado.
 */
export function useSpeechToText(onFinalText: (text: string) => void): UseSpeechToTextResult {
  const [isSupported, setIsSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onFinalTextRef = useRef(onFinalText);
  onFinalTextRef.current = onFinalText;

  useEffect(() => {
    const SpeechRecognitionCtor =
      typeof window !== "undefined" ? window.SpeechRecognition ?? window.webkitSpeechRecognition : undefined;
    setIsSupported(!!SpeechRecognitionCtor);
  }, []);

  const start = useCallback(() => {
    const SpeechRecognitionCtor =
      typeof window !== "undefined" ? window.SpeechRecognition ?? window.webkitSpeechRecognition : undefined;
    if (!SpeechRecognitionCtor) {
      setError("Tu navegador no soporta el dictado por voz. Probá con Chrome.");
      return;
    }

    setError(null);
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "es-AR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          onFinalTextRef.current(text);
        } else {
          interim += text;
        }
      }
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "permission-denied") {
        setError("Necesitamos permiso para usar el micrófono. Revisá los permisos del navegador.");
      } else if (event.error === "no-speech") {
        // No es un error real, el usuario simplemos no dijo nada todavía.
      } else {
        setError("Hubo un problema con el dictado. Probá de nuevo.");
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimText("");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { isSupported, isRecording, interimText, error, start, stop };
}
