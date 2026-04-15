import { colors, fonts, glassPanel, shadows } from '../lib/theme';

interface LoadingStateProps {
  message?: string;
  subtitle?: string;
}

export function LoadingState({
  message = 'Generating Context',
  subtitle = 'Querying mental models...',
}: LoadingStateProps) {
  return (
    <div className="w-[520px] h-[280px] rounded-[14px] flex flex-col relative overflow-hidden z-10 border border-white/5"
      style={{ ...glassPanel, boxShadow: shadows.popup, color: colors.cream }}
    >
      {/* Skeleton Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center bg-white/[0.02]">
        <div className="w-4 h-4 rounded bg-white/10 animate-pulse mr-3" />
        <div className="h-3 w-64 bg-white/10 rounded animate-pulse" />
      </div>

      {/* Orbital Spinner */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className="relative w-24 h-24 mb-6">
          {/* Outer Ring */}
          <svg
            className="absolute inset-0 w-full h-full animate-spin-slow"
            style={{ color: 'rgba(220,168,66,0.2)' }}
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="50" cy="50" r="40" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="50" cy="50" r="48" strokeWidth="0.5" />
          </svg>

          {/* Inner Ring */}
          <svg
            className="absolute inset-0 w-full h-full animate-spin-reverse"
            style={{ color: 'rgba(188,95,64,0.4)' }}
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="50" cy="50" r="30" strokeWidth="1" />
          </svg>

          {/* Center Dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: colors.cream }}
            />
          </div>
        </div>

        {/* Loading Text */}
        <div
          className="text-[13px] uppercase tracking-[0.2em] relative flex items-center"
          style={{ color: colors.gold, fontFamily: fonts.vt323 }}
        >
          {message}
          <span
            className="w-2 h-4 ml-2 animate-blink"
            style={{ background: colors.gold }}
          />
        </div>

        {/* Subtitle */}
        <div
          className="text-[10px] text-white/30 mt-2 tracking-widest"
          style={{ fontFamily: fonts.vt323 }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}
