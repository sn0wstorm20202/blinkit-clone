"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, X, Volume2, Eye, EyeOff } from 'lucide-react';
import { useVoiceRecognition, SupportedLanguage } from '@/hooks/useVoiceRecognition';
import { useVoiceSynthesis } from '@/hooks/useVoiceSynthesis';
import { ActionDispatcher } from '@/lib/voice/actionDispatcher';
import { VoiceAgentResponse, ConversationEntry, ConversationState } from '@/lib/voice/types';
import { toast } from 'sonner';

const LANGUAGE_OPTIONS: { code: SupportedLanguage; label: string; flag: string }[] = [
  { code: 'en-US', label: 'English', flag: '🇬🇧' },
  { code: 'hi-IN', label: 'हिन्दी', flag: '🇮🇳' },
];

export default function VoiceAssistant() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState<SupportedLanguage>('en-US');
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
  const [convState, setConvState] = useState<ConversationState>('idle');
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  
  const dispatcherRef = useRef<ActionDispatcher | null>(null);
  const pendingTranscriptRef = useRef<string>('');
  const transcriptTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize dispatcher
  useEffect(() => {
    dispatcherRef.current = new ActionDispatcher(router);
  }, [router]);

  // Voice recognition
  const handleVoiceResult = useCallback(async (transcript: string, isFinal: boolean) => {
    if (isFinal) {
      pendingTranscriptRef.current = transcript;
      setCurrentTranscript(transcript);
      
      // Wait 800ms for more speech, then process
      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current);
      }
      
      transcriptTimeoutRef.current = setTimeout(() => {
        if (pendingTranscriptRef.current) {
          processVoiceCommand(pendingTranscriptRef.current);
          pendingTranscriptRef.current = '';
        }
      }, 800);
    } else {
      setCurrentTranscript(transcript);
    }
  }, []);

  const {
    isListening,
    isSupported: isRecognitionSupported,
    error: recognitionError,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition({
    language,
    continuous: true,
    interimResults: true,
    onResult: handleVoiceResult,
  });

  // Voice synthesis
  const { speak, cancel: cancelSpeech, isSpeaking } = useVoiceSynthesis({ language });

  // Process voice command
  const processVoiceCommand = useCallback(async (text: string) => {
    if (!text.trim() || isProcessing) return;

    setIsProcessing(true);

    try {
      const token = localStorage.getItem('bearer_token');
      if (!token) {
        toast.error('Please login to use voice assistant');
        speak('Please login to use voice assistant', language);
        return;
      }

      // Call voice agent API
      const response = await fetch('/api/voice-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          text,
          language,
          conversationState: {
            state: convState,
            context: {
              history: conversationHistory.slice(-3),
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process command');
      }

      const aiResponse: VoiceAgentResponse = await response.json();
      
      // Speak the response
      speak(aiResponse.response, language);
      setLastResponse(aiResponse.response);

      // Execute the action
      if (dispatcherRef.current) {
        const actionResult = await dispatcherRef.current.dispatch(aiResponse);
        
        // Update conversation history
        const entry: ConversationEntry = {
          timestamp: new Date(),
          userInput: text,
          agentResponse: aiResponse.response,
          action: aiResponse.action,
          success: actionResult.success,
        };

        setConversationHistory(prev => [...prev.slice(-4), entry]);
        if (aiResponse.conversationState?.state) {
          setConvState(aiResponse.conversationState.state);
        }

        // Show toast for action result
        if (actionResult.success) {
          if (aiResponse.action !== 'ask' && aiResponse.action !== 'fallback') {
            toast.success(actionResult.message);
          }
        } else {
          toast.error(actionResult.message || 'Action failed');
          speak(actionResult.message, language);
        }
      }

      setCurrentTranscript('');
      resetTranscript();

    } catch (error) {
      console.error('Voice command error:', error);
      const errorMessage = 'Sorry, I encountered an error. Please try again.';
      toast.error(errorMessage);
      speak(errorMessage, language);
    } finally {
      setIsProcessing(false);
    }
  }, [language, conversationHistory, isProcessing, speak, resetTranscript]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
      cancelSpeech();
    } else {
      startListening();
      const greeting = language === 'hi-IN' 
        ? 'आप कैसे मदद कर सकते हैं?' 
        : 'How can I help you?';
      speak(greeting, language);
    }
  }, [isListening, startListening, stopListening, speak, cancelSpeech, language]);

  // Open/close modal
  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    stopListening();
    cancelSpeech();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
      if (e.key === ' ' && e.ctrlKey) {
        e.preventDefault();
        if (isOpen) {
          toggleListening();
        } else {
          handleOpen();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, toggleListening]);

  if (!isRecognitionSupported) {
    return null; // Don't render if not supported
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 left-6 z-50 w-16 h-16 bg-primary hover:bg-primary-hover text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 focus:outline-none focus:ring-4 focus:ring-primary/30"
          aria-label="Open voice assistant"
        >
          <Mic size={28} />
        </button>
      )}

      {isListening && (
        <div className="fixed bottom-28 left-6 z-50 bg-white border rounded-full px-3 py-1 shadow flex items-center gap-2 text-sm">
          <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
          <span>Voice agent active</span>
        </div>
      )}

      {isOpen && (
        <div className="fixed bottom-24 left-6 z-50 w-80 max-w-[90vw] bg-white rounded-xl shadow-2xl border">
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleListening}
                disabled={isProcessing}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary-hover'
                } text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                className="p-1.5 border rounded-lg text-xs focus:outline-none"
              >
                {LANGUAGE_OPTIONS.map(({ code, label }) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
              <button
                onClick={() => setAccessibilityMode(!accessibilityMode)}
                className="p-2 hover:bg-gray-100 rounded-full"
                aria-label="Toggle accessibility mode"
                title="Accessibility Mode"
              >
                {accessibilityMode ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full" aria-label="Close">
              <X size={16} />
            </button>
          </div>

          <div className="p-3 space-y-3 max-h-72 overflow-y-auto">
            <div className="text-xs">
              {isListening && (
                <p className="text-green-600 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                  Listening...
                </p>
              )}
              {isProcessing && <p className="text-blue-600 font-medium">Processing...</p>}
              {isSpeaking && (
                <p className="text-purple-600 font-medium flex items-center gap-2">
                  <Volume2 size={14} className="animate-pulse" />
                  Speaking...
                </p>
              )}
              {!isListening && !isProcessing && !isSpeaking && (
                <p className="text-gray-500">Tap mic to speak</p>
              )}
            </div>

            {currentTranscript && (
              <div className="p-2 bg-blue-50 rounded text-sm">
                <p className="font-semibold text-blue-900 mb-0.5">You said</p>
                <p className="text-blue-700">{currentTranscript}</p>
              </div>
            )}

            {lastResponse && (
              <div className="p-2 bg-green-50 rounded text-sm">
                <p className="font-semibold text-green-900 mb-0.5">Assistant</p>
                <p className="text-green-700">{lastResponse}</p>
              </div>
            )}

            {recognitionError && (
              <div className="p-2 bg-red-50 text-red-700 rounded text-xs">Error: {recognitionError}</div>
            )}
          </div>

          <div className="p-2 border-t text-[10px] text-gray-500 text-center">
            Ctrl+Space to toggle • Esc to close
          </div>
        </div>
      )}
    </>
  );
}
