import { colors, fonts } from '../lib/theme';

export interface CapturedInput {
  type: 'text';
  content: string;
  label: string;
}

interface ReadyStateProps {
  capturedInput: CapturedInput;
  hasPreviousResult: boolean;
  onExplain: () => void;
  onViewPrevious: () => void;
}

export function ReadyState({ capturedInput, hasPreviousResult, onExplain, onViewPrevious }: ReadyStateProps) {
  const sourceLabel =
    capturedInput.label === 'Clipboard'
      ? 'CLIPBOARD'
      : capturedInput.label === 'None'
        ? ''
        : 'SELECTED TEXT';

  const hasContent = capturedInput.content.trim().length > 0;

  return (
    <div className="min-h-[400px] bg-darker flex flex-col p-4">
      {/* View last explanation link */}
      {hasPreviousResult && (
        <button
          onClick={onViewPrevious}
          className="self-start text-[13px] mb-4 hover:underline transition-colors"
          style={{ fontFamily: fonts.vt323, color: colors.gold }}
        >
          ← View last explanation
        </button>
      )}

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        {hasContent ? (
          <>
            {/* Source label */}
            {sourceLabel && (
              <span
                className="text-[11px] tracking-[0.15em] text-white/40"
                style={{ fontFamily: fonts.vt323 }}
              >
                {sourceLabel}
              </span>
            )}

            {/* Preview card */}
            <div
              className="w-full rounded-[14px] border border-white/5 p-4 max-h-[200px] overflow-hidden"
              style={{ background: 'rgba(28, 26, 25, 0.75)' }}
            >
              <p
                className="text-[13px] text-white/70 leading-relaxed line-clamp-6"
                style={{ fontFamily: fonts.inter }}
              >
                {capturedInput.content.slice(0, 500)}
              </p>
            </div>

            {/* Explain button */}
            <button
              onClick={onExplain}
              className="w-full py-3 rounded-[14px] text-[15px] font-bold transition-all hover:brightness-110 active:scale-[0.98]"
              style={{
                fontFamily: fonts.vt323,
                background: colors.gold,
                color: colors.darker,
              }}
            >
              Explain This
            </button>
          </>
        ) : (
          <p
            className="text-[13px] text-white/40 text-center"
            style={{ fontFamily: fonts.vt323 }}
          >
            Select text on any page to get started
          </p>
        )}
      </div>
    </div>
  );
}
