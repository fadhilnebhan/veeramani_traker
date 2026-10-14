'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Sparkles, X } from 'lucide-react';

interface IntroAnimationProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

const STORAGE_KEY = 'veeramani_tracker_intro_seen';

export function IntroAnimation({ onComplete, forceShow = false }: IntroAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [phase, setPhase] = useState<'dot' | 'pin_title' | 'scene_subtext' | 'exit'>('dot');

  const handleComplete = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore storage error
    }
    setIsVisible(false);
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion && !forceShow) {
        onComplete?.();
        return;
      }

      const alreadySeen = sessionStorage.getItem(STORAGE_KEY);
      if (alreadySeen && !forceShow) {
        onComplete?.();
        return;
      }

      setIsVisible(true);
    }
  }, [forceShow, onComplete]);

  useEffect(() => {
    if (!isVisible) return;

    // Phase schedule (Total 2.4s)
    const t1 = setTimeout(() => {
      setPhase('pin_title');
    }, 500);

    const t2 = setTimeout(() => {
      setPhase('scene_subtext');
    }, 1300);

    const t3 = setTimeout(() => {
      setPhase('exit');
    }, 1900);

    const t4 = setTimeout(() => {
      handleComplete();
    }, 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isVisible, handleComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        key="intro-overlay"
        role="dialog"
        aria-label="Welcome Intro Animation"
        initial={{ opacity: 1 }}
        animate={phase === 'exit' ? { opacity: 0, y: -40, scale: 1.02 } : { opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -60 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#19182B] text-[#FFF8E8] select-none overflow-hidden"
      >
        {/* Skip Button */}
        <button
          onClick={handleComplete}
          className="absolute top-6 right-6 z-20 flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#A5A2AD] hover:text-[#F5C542] border border-[#32304F] hover:border-[#F5C542] rounded-full transition-colors bg-[#222038]/80 backdrop-blur-sm cursor-pointer"
          aria-label="Skip introduction"
        >
          <span>Skip Intro</span>
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Subtle Decorative Background Kolam Ring */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-[600px] h-[600px] rounded-full border border-[#F5C542]/30 animate-pulse" />
          <div className="absolute w-[400px] h-[400px] rounded-full border border-dashed border-[#F5C542]/20" />
        </div>

        {/* Center Stage Animation */}
        <div className="relative flex flex-col items-center justify-center text-center px-4 max-w-lg z-10">
          {/* Radar Ring and Pin */}
          <div className="relative w-24 h-24 flex items-center justify-center mb-6">
            {/* Expanding Radar Rings */}
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.5, 2.2], opacity: [0.8, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
              className="absolute w-20 h-20 rounded-full border-2 border-[#F5C542] pointer-events-none"
            />
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.5, 1.6], opacity: [0.6, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, delay: 0.4, ease: 'easeOut' }}
              className="absolute w-20 h-20 rounded-full bg-[#F5C542]/10 pointer-events-none"
            />

            {/* Central Dot morphing to Geometric Pin Symbol */}
            {phase === 'dot' ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-5 h-5 rounded-full bg-[#F5C542] shadow-[0_0_20px_#F5C542]"
              />
            ) : (
              <motion.div
                initial={{ scale: 0.2, rotate: -25, y: 15 }}
                animate={{ scale: 1, rotate: 0, y: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 220 }}
                className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F5C542] to-[#D4A325] text-[#19182B] shadow-[0_8px_32px_rgba(245,197,66,0.35)]"
              >
                <MapPin className="w-9 h-9 fill-[#19182B] stroke-[#19182B]" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#F16F59] border-2 border-[#19182B]"
                />
              </motion.div>
            )}
          </div>

          {/* Wordmark: VEERAMANI TRACKER */}
          <AnimatePresence>
            {phase !== 'dot' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col items-center"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block px-2 py-0.5 text-[10px] tracking-widest font-bold uppercase rounded bg-[#7D263D] text-[#FFF8E8] border border-[#9B334E]">
                    TAMIL NADU
                  </span>
                  <span className="text-[11px] font-mono tracking-widest text-[#F5C542]">
                    PARODY RADAR
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#FFF8E8] font-display">
                  VEERAMANI <span className="text-[#F5C542]">TRACKER</span>
                </h1>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tanglish Hook & Subtext */}
          <AnimatePresence>
            {(phase === 'scene_subtext' || phase === 'exit') && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-4 flex flex-col items-center"
              >
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#222038] border border-[#32304F] text-[#F5C542] text-sm font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-[#F16F59]" />
                  <span>Map-la enna scene?</span>
                  <span className="text-[#A5A2AD] text-xs font-tamil">நையாண்டி ரேடார்</span>
                </div>
                <p className="text-xs text-[#A5A2AD] mt-2 font-mono">
                  Simulated Parody Signals • Zero Personal Tracking • 100% Fictional Lore
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom subtle progress indicator */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center">
          <div className="w-24 h-1 bg-[#32304F] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.2, ease: 'linear' }}
              className="h-full bg-[#F5C542]"
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
