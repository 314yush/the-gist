import { useState, useEffect } from 'react';
import { colors, fonts, glassPanel, shadows } from '../lib/theme';

interface ListeningHUDProps {
  onCancel: () => void;
  /** Countdown length in seconds (must match main process clipboard listen timeout). */
  timeoutSeconds?: number;
}

export function ListeningHUD({ onCancel, timeoutSeconds = 5 }: ListeningHUDProps) {
  const [countdown, setCountdown] = useState(timeoutSeconds);

  useEffect(() => {
    setCountdown(timeoutSeconds);
  }, [timeoutSeconds]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onCancel();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onCancel, timeoutSeconds]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="w-[360px] rounded-xl p-4 relative overflow-hidden border border-white/10"
      style={{ ...glassPanel, boxShadow: shadows.popup, color: colors.cream }}
    >
      <div className="flex items-center gap-4">
        {/* Pulsing Indicator */}
        <div className="relative w-10 h-10 flex items-center justify-center">
          <div
            className="absolute w-10 h-10 rounded-full animate-pulse-glow"
            style={{ background: `${colors.gold}20`, border: `1px solid ${colors.gold}40` }}
          />
          <div
            className="absolute w-6 h-6 rounded-full animate-pulse"
            style={{ background: `${colors.gold}40` }}
          />
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: colors.gold }}
          />
        </div>

        {/* Text Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className="text-[14px] font-medium"
              style={{ color: colors.cream }}
            >
              Listening...
            </span>
            <span
              className="text-[11px] text-white/40"
              style={{ fontFamily: fonts.vt323 }}
            >
              ({countdown}s)
            </span>
          </div>
          <div
            className="text-[11px] text-white/50 mt-0.5"
            style={{ fontFamily: fonts.inter }}
          >
            Switch to another app, select content, then ⌘C — we listen for new clipboard data
          </div>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="text-[10px] border border-white/20 rounded px-2 py-1 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all"
          style={{ fontFamily: fonts.vt323 }}
        >
          ESC
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${(countdown / timeoutSeconds) * 100}%`,
            background: `linear-gradient(90deg, ${colors.gold}, ${colors.terracotta})`,
          }}
        />
      </div>

      {/* Keyboard Hint */}
      <div className="flex items-center justify-center gap-2 mt-3 pt-2 border-t border-white/5">
        <span className="text-[10px] text-white/30" style={{ fontFamily: fonts.vt323 }}>
          Clipboard listening
        </span>
        <span className="text-white/20">•</span>
        <span className="text-[10px] text-white/30" style={{ fontFamily: fonts.vt323 }}>
          Waiting for ⌘C in another app
        </span>
      </div>
    </div>
  );
}
