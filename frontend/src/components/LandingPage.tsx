import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Bot, Cpu, Zap, ShieldCheck } from 'lucide-react';

export const AIOrb: React.FC = () => {
  return (
    <div className="relative flex items-center justify-center w-[340px] h-[340px] md:w-[460px] md:h-[460px] mx-auto">
      {/* Outer Glow Ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-600/30 via-purple-600/30 to-cyan-400/20 blur-3xl animate-pulse-slow" />

      {/* Orbit Ring 1 */}
      <div className="absolute w-full h-full rounded-full border border-purple-500/20 animate-orbit" style={{ animationDuration: '22s' }}>
        <div className="absolute top-0 left-1/2 w-3 h-3 bg-purple-400 rounded-full shadow-[0_0_12px_#a855f7]" />
      </div>

      {/* Orbit Ring 2 (reverse spin) */}
      <div className="absolute w-[80%] h-[80%] rounded-full border border-cyan-400/20 animate-orbit" style={{ animationDirection: 'reverse', animationDuration: '16s' }}>
        <div className="absolute bottom-0 right-1/4 w-2.5 h-2.5 bg-cyan-300 rounded-full shadow-[0_0_10px_#06b6d4]" />
      </div>

      {/* Core Glowing Orb */}
      <motion.div
        animate={{ scale: [1, 1.05, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        className="relative w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-tr from-blue-600 via-purple-600 to-cyan-400 p-[2px] shadow-[0_0_60px_rgba(168,85,247,0.6)]"
      >
        <div className="w-full h-full rounded-full bg-[#050816] flex items-center justify-center overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/40 via-blue-600/20 to-transparent blur-md" />
          <Bot className="w-20 h-20 md:w-28 md:h-28 text-cyan-300 relative z-10 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]" />
        </div>
      </motion.div>

      {/* Realistic 3D Hand Vector Base Silhouette holding the Orb */}
      <div className="absolute -bottom-12 md:-bottom-16 w-64 md:w-80 h-32 opacity-85 pointer-events-none">
        <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_25px_rgba(168,85,247,0.4)]">
          <path d="M120 180 C150 140, 170 120, 200 115 C230 120, 250 140, 280 180 C320 190, 360 200, 400 200 L0 200 C40 200, 80 190, 120 180 Z" fill="url(#handGlow)" />
          <path d="M140 160 C170 110, 230 110, 260 160 C240 180, 160 180, 140 160 Z" fill="url(#handPalm)" opacity="0.8" />
          <defs>
            <linearGradient id="handGlow" x1="200" y1="100" x2="200" y2="200" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="0.5" stopColor="#a855f7" stopOpacity="0.5" />
              <stop offset="1" stopColor="#050816" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="handPalm" x1="200" y1="110" x2="200" y2="180" gradientUnits="userSpaceOnUse">
              <stop stopColor="#06b6d4" stopOpacity="0.9" />
              <stop offset="1" stopColor="#3b82f6" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Floating Notification Card 1 (Top Left) */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-4 -left-6 md:-left-12 glass-panel p-3 rounded-xl flex items-center gap-3 border border-purple-500/30 shadow-glass z-20"
      >
        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-400/40">
          <Sparkles className="w-4 h-4 text-purple-300" />
        </div>
        <div>
          <p className="text-xs text-gray-400">RAG Chunk Vectorized</p>
          <p className="text-xs font-semibold text-purple-200">768 Dim Embeddings</p>
        </div>
      </motion.div>

      {/* Floating Notification Card 2 (Bottom Right) */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-6 -right-6 md:-right-10 glass-panel p-3 rounded-xl flex items-center gap-3 border border-cyan-500/30 shadow-glass z-20"
      >
        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-400/40">
          <Zap className="w-4 h-4 text-cyan-300" />
        </div>
        <div>
          <p className="text-xs text-gray-400">Gemini 1.5 Flash</p>
          <p className="text-xs font-semibold text-cyan-200">Instant Streaming</p>
        </div>
      </motion.div>
    </div>
  );
};

interface LandingPageProps {
  onGetStarted: () => void;
  onAdminUpload: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onAdminUpload }) => {
  return (
    <div className="relative min-h-screen bg-[#050816] text-white overflow-hidden flex flex-col justify-between">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-30 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onGetStarted}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 p-[1px]">
            <div className="w-full h-full bg-[#050816] rounded-[11px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-gray-200 to-purple-300 bg-clip-text text-transparent">
            CampusAI<span className="text-purple-400 font-extrabold ml-1">RAG</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onAdminUpload}
            className="px-4 py-2 rounded-xl text-sm font-medium glass-panel border border-purple-500/30 text-purple-200 hover:bg-purple-900/30 hover:border-purple-400 transition duration-200 flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            Admin Upload
          </button>
          <button
            onClick={onGetStarted}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-glowPurple hover:opacity-90 transition duration-200"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Main Hero Content */}
      <main className="relative z-20 max-w-7xl mx-auto px-6 py-8 md:py-16 grid grid-cols-1 lg:grid-cols-2 items-center gap-12 my-auto">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6 text-center lg:text-left"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-cyan-500/30 text-xs font-medium text-cyan-300">
            <Cpu className="w-3.5 h-3.5" />
            <span>NxtWave AI Workshop Submission</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Your AI <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">Student Assistant</span>
          </h1>

          <p className="text-gray-300 text-lg md:text-xl max-w-xl font-normal leading-relaxed">
            Ask questions from uploaded documents with intelligent RAG-powered search. Instant answers backed by Google Gemini and page citations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 text-white shadow-glowPurple hover:scale-[1.02] active:scale-[0.98] transition duration-200 flex items-center justify-center gap-2 text-base"
            >
              <Sparkles className="w-5 h-5" />
              Get Started
            </button>
            <button
              onClick={onAdminUpload}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold glass-panel border border-purple-500/40 text-purple-200 hover:bg-purple-900/20 hover:border-purple-300 transition duration-200 text-base"
            >
              Admin Upload
            </button>
          </div>
        </motion.div>

        {/* 3D Orb Graphic */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <AIOrb />
        </motion.div>
      </main>

      {/* Footer info */}
      <footer className="relative z-20 py-6 text-center text-xs text-gray-500 border-t border-white/5">
        Production RAG Engine | Gemini 1.5 Flash + Supabase pgvector (768d)
      </footer>
    </div>
  );
};
