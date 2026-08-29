import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface VoiceAssistantProps {
  onSpeechResult: (text: string) => void;
  lastAnswer?: string;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onSpeechResult, lastAnswer }) => {
  const [isListening, setIsListening] = useState(false);
  const [autoRead, setAutoRead] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Auto read out latest AI response when provided if speech synthesis is enabled
  useEffect(() => {
    if (autoRead && lastAnswer && 'speechSynthesis' in window) {
      // Clean markdown symbols for clearer audio playback
      const cleanText = lastAnswer.replace(/[*#_`]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }, [lastAnswer, autoRead]);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech-to-text recognition is not supported in this browser version.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        onSpeechResult(transcript);
      }
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const toggleAutoRead = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setAutoRead(!autoRead);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleListening}
        className={`p-2.5 rounded-xl border transition ${
          isListening
            ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
            : 'glass-panel border-purple-500/30 text-purple-300 hover:bg-purple-900/20'
        }`}
        title={isListening ? 'Listening...' : 'Click to Speak (Speech-to-Text)'}
      >
        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </button>

      <button
        type="button"
        onClick={toggleAutoRead}
        className={`p-2.5 rounded-xl border transition ${
          autoRead
            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
            : 'glass-panel border-white/10 text-gray-500 hover:text-gray-300'
        }`}
        title={autoRead ? 'Voice Readout Active' : 'Voice Readout Muted'}
      >
        {autoRead ? <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce' : ''}`} /> : <VolumeX className="w-4 h-4" />}
      </button>
    </div>
  );
};
