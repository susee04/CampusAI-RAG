import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Sparkles, FileText, ArrowLeft, LogOut, ShieldCheck, BookOpen } from 'lucide-react';
import { UserSession } from '../lib/supabase';
import { VoiceAssistant } from './VoiceAssistant';

export interface Citation {
  documentName: string;
  pageNumber: number;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citations?: Citation[];
  timestamp: string;
}

interface ChatInterfaceProps {
  session: UserSession | null;
  onBackToLanding: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ session, onBackToLanding, onOpenAdmin, onLogout }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: "Hello! 👋 I am your **CampusAI Assistant**.\n\nAsk me any questions about your uploaded course materials, campus guidelines, or syllabus PDFs!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || inputPrompt).trim();
    if (!promptToSend || isGenerating) return;

    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      text: promptToSend,
      timestamp: timeStr
    };

    const initialAssistantMsg: ChatMessage = {
      id: assistantMessageId,
      sender: 'assistant',
      text: '',
      citations: [],
      timestamp: timeStr
    };

    setMessages(prev => [...prev, userMessage, initialAssistantMsg]);
    setInputPrompt('');
    setIsGenerating(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptToSend, stream: true })
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to connect to AI server stream.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));

              if (parsed.text) {
                accumulatedText += parsed.text;
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, text: accumulatedText }
                      : msg
                  )
                );
              }

              if (parsed.done && parsed.citations) {
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, citations: parsed.citations }
                      : msg
                  )
                );
              }
            } catch (e) {
              // Ignore partial JSON chunks
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, text: "I couldn't find this information in the uploaded documents." }
            : msg
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const latestAssistantMsg = [...messages].reverse().find(m => m.sender === 'assistant' && m.text.length > 0)?.text;

  return (
    <div className="flex flex-col h-screen bg-[#050816] text-white overflow-hidden">

      {/* Top Header */}
      <header className="glass-panel border-b border-white/10 px-6 py-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToLanding}
            className="p-2 rounded-xl glass-panel text-gray-400 hover:text-white hover:border-purple-400 transition"
            title="Back to Landing Page"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 p-[1px]">
              <div className="w-full h-full bg-[#050816] rounded-[7px] flex items-center justify-center">
                <Bot className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">CampusAI RAG Chat</h1>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Gemini 1.5 Flash Active
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {session?.role === 'admin' && (
            <button
              onClick={onOpenAdmin}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium glass-panel border border-purple-500/40 text-purple-200 hover:bg-purple-900/30 transition flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              Admin Panel
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel text-xs text-gray-300">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>{session?.email || 'Student User'}</span>
          </div>

          <button
            onClick={onLogout}
            className="p-2 rounded-xl glass-panel text-gray-400 hover:text-red-400 hover:border-red-500/30 transition"
            title="Logout"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-4xl w-full mx-auto">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 md:gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-purple-600 to-cyan-400 p-[1px] shrink-0 mt-1">
                  <div className="w-full h-full bg-[#050816] rounded-[11px] flex items-center justify-center">
                    <Bot className="w-4 h-4 text-cyan-300" />
                  </div>
                </div>
              )}

              <div className={`max-w-[85%] sm:max-w-[75%] space-y-3 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>

                {/* Bubble Container */}
                <div className={`rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-glowPurple rounded-tr-none'
                    : 'glass-panel border border-purple-500/20 text-gray-100 rounded-tl-none shadow-glass'
                }`}>
                  {msg.text ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    /* Typing Animation */
                    <div className="flex items-center gap-1.5 py-1">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}

                  <div className={`text-[10px] mt-2 text-right ${msg.sender === 'user' ? 'text-purple-200/70' : 'text-gray-500'}`}>
                    {msg.timestamp}
                  </div>
                </div>

                {/* Page Citation Cards */}
                {msg.citations && msg.citations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2 pt-1"
                  >
                    <p className="text-[11px] font-semibold text-cyan-300 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      Document Citations ({msg.citations.length})
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.citations.map((cite, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-xs hover:border-cyan-400 transition"
                        >
                          <div className="flex items-center justify-between font-medium text-purple-200 mb-1">
                            <span className="truncate flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                              {cite.documentName}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px]">
                              Page {cite.pageNumber}
                            </span>
                          </div>
                          <p className="text-gray-400 text-[11px] line-clamp-2 italic">
                            "{cite.snippet}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4 text-purple-200" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <div ref={chatBottomRef} />
      </main>

      {/* Input Form Dock */}
      <footer className="glass-panel border-t border-white/10 p-4 shrink-0 z-20">
        <div className="max-w-4xl mx-auto flex items-end gap-3">
          <VoiceAssistant
            onSpeechResult={(transcript) => {
              setInputPrompt(transcript);
              handleSendMessage(transcript);
            }}
            lastAnswer={latestAssistantMsg}
          />

          <div className="relative flex-1 bg-slate-900/90 border border-purple-500/30 rounded-2xl focus-within:border-purple-400 transition">
            <textarea
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question from uploaded documents..."
              rows={1}
              className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none resize-none max-h-32 min-h-[44px]"
            />
          </div>

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputPrompt.trim() || isGenerating}
            className="p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-glowPurple hover:opacity-90 disabled:opacity-40 transition shrink-0"
            title="Send Message"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </div>
      </footer>

    </div>
  );
};
