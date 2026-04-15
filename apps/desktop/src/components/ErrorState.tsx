import { colors, fonts, glassPanel, shadows } from '../lib/theme';
import { ERROR_MESSAGES, type ApiError } from '../lib/ipc';

interface ErrorStateProps {
  error: ApiError;
  onDismiss: () => void;
  onAction?: () => void;
}

export function ErrorState({ error, onDismiss, onAction }: ErrorStateProps) {
  const errorConfig = ERROR_MESSAGES[error.code] || ERROR_MESSAGES.UNKNOWN;
  const displayMessage = error.message || errorConfig.message;
  const actionType = errorConfig.action;

  const handleAction = () => {
    if (actionType === 'openPreferences') {
      window.thegist?.window.openPreferences();
    }
    onAction?.();
  };

  return (
    <div
      className="w-[400px] rounded-[14px] p-6 relative overflow-hidden border border-white/10"
      style={{ ...glassPanel, boxShadow: shadows.popup, color: colors.cream }}
    >
      {/* Error Icon */}
      <div className="flex flex-col items-center text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'rgba(188,95,64,0.1)', border: `1px solid ${colors.terracotta}40` }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            style={{ color: colors.terracotta }}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        {/* Error Code */}
        <div
          className="text-[10px] uppercase tracking-widest text-white/40 mb-2"
          style={{ fontFamily: fonts.vt323 }}
        >
          Error: {error.code}
        </div>

        {/* Error Message */}
        <h3
          className="text-[16px] font-medium mb-2"
          style={{ color: colors.cream }}
        >
          Something went wrong
        </h3>
        <p className="text-[13px] text-white/60 leading-relaxed mb-6 max-w-[90%]">
          {displayMessage}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onDismiss}
            className="px-4 py-2 rounded text-[12px] text-white/60 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
          >
            Dismiss
          </button>
          {actionType && (
            <button
              onClick={handleAction}
              className="px-4 py-2 rounded text-[12px] font-medium transition-all"
              style={{
                background: colors.terracotta,
                color: 'white',
              }}
            >
              {actionType === 'openPreferences' ? 'Open Preferences' : 'Try Again'}
            </button>
          )}
        </div>
      </div>

      {/* Decorative Corner */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-10"
        style={{ background: colors.terracotta }}
      />
    </div>
  );
}
