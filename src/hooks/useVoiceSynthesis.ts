import { useState, useEffect, useRef, useCallback } from 'react';
import { SupportedLanguage } from './useVoiceRecognition';

interface VoiceSynthesisOptions {
  language?: SupportedLanguage;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export function useVoiceSynthesis(options: VoiceSynthesisOptions = {}) {
  const { language = 'en-US', rate = 1.0, pitch = 1.0, volume = 1.0 } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const utteranceQueueRef = useRef<string[]>([]);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check browser support and load voices
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const synth = window.speechSynthesis;
    setIsSupported(!!synth);

    const loadVoices = () => {
      const voices = synth.getVoices();
      setAvailableVoices(voices);
    };

    loadVoices();
    
    // Chrome loads voices asynchronously
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }

    return () => {
      synth.cancel();
    };
  }, []);

  // Select best voice for language
  const selectVoice = useCallback(
    (targetLang: SupportedLanguage): SpeechSynthesisVoice | null => {
      if (availableVoices.length === 0) return null;

      // Extract base language (e.g., 'en' from 'en-US')
      const baseLang = targetLang.split('-')[0];

      // Priority 1: Exact match (e.g., 'en-US')
      let voice = availableVoices.find((v) => v.lang === targetLang);

      // Priority 2: Same base language (e.g., 'en-GB' for 'en-US')
      if (!voice) {
        voice = availableVoices.find((v) => v.lang.startsWith(baseLang));
      }

      // Priority 3: Default voice
      if (!voice) {
        voice = availableVoices.find((v) => v.default);
      }

      // Priority 4: Any voice
      if (!voice) {
        voice = availableVoices[0];
      }

      return voice || null;
    },
    [availableVoices]
  );

  const speak = useCallback(
    (text: string, targetLanguage?: SupportedLanguage) => {
      if (!isSupported || !text.trim()) return;

      const synth = window.speechSynthesis;
      const lang = targetLanguage || language;

      // Add to queue
      utteranceQueueRef.current.push(text);

      // If already speaking, let the queue handle it
      if (isSpeaking) return;

      const processQueue = () => {
        if (utteranceQueueRef.current.length === 0) {
          setIsSpeaking(false);
          return;
        }

        const nextText = utteranceQueueRef.current.shift();
        if (!nextText) {
          setIsSpeaking(false);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(nextText);
        currentUtteranceRef.current = utterance;

        utterance.lang = lang;
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        const voice = selectVoice(lang);
        if (voice) {
          utterance.voice = voice;
        }

        utterance.onstart = () => {
          setIsSpeaking(true);
        };

        utterance.onend = () => {
          currentUtteranceRef.current = null;
          processQueue(); // Process next in queue
        };

        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          currentUtteranceRef.current = null;
          processQueue(); // Continue with next despite error
        };

        synth.speak(utterance);
      };

      processQueue();
    },
    [isSupported, language, rate, pitch, volume, isSpeaking, selectVoice]
  );

  const cancel = useCallback(() => {
    if (!isSupported) return;

    window.speechSynthesis.cancel();
    utteranceQueueRef.current = [];
    currentUtteranceRef.current = null;
    setIsSpeaking(false);
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.pause();
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.resume();
  }, [isSupported]);

  return {
    isSpeaking,
    isSupported,
    availableVoices,
    speak,
    cancel,
    pause,
    resume,
  };
}
