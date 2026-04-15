import { useState } from 'react';
import { colors, fonts, glassPanel, shadows, retroBorder } from '../lib/theme';
import type { ExplanationResponse } from '../lib/ipc';
import { ExplanationVisual } from './ExplanationVisual';

interface FloatingPanelProps {
  result: ExplanationResponse;
  onClose: () => void;
  onAddToWiki: () => Promise<void>;
}

export function FloatingPanel({ result, onClose, onAddToWiki }: FloatingPanelProps) {
  const [addedToWiki, setAddedToWiki] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [followUpText, setFollowUpText] = useState('');
  const [followUpLoading, setFollowUpLoading] = useState(false);

  const handleAddToWiki = async () => {
    if (isAdding || addedToWiki) return;
    setIsAdding(true);
    try {
      await onAddToWiki();
      setAddedToWiki(true);
    } finally {
      setIsAdding(false);
    }
  };

  const sendFollowUp = async () => {
    const q = followUpText.trim();
    if (!q || !window.thegist?.explanation.followUp || followUpLoading) return;
    setFollowUpLoading(true);
    try {
      const res = await window.thegist.explanation.followUp({
        priorExplanation: result.priorExplanation,
        userQuestion: q,
      });
      if (res.ok) {
        setFollowUpText('');
      }
    } finally {
      setFollowUpLoading(false);
    }
  };

  return (
    <div className="relative group">
      {/* Hover Glow */}
      <div
        className="absolute -inset-4 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000 pointer-events-none"
        style={{ background: 'rgba(188,95,64,0.05)' }}
      />

      <div
        className="w-[520px] rounded-[14px] flex flex-col relative overflow-hidden z-10"
        style={{ ...glassPanel, boxShadow: shadows.window, color: colors.cream }}
      >
        {/* Decorative SVG */}
        <svg
          className="absolute -top-10 -right-10 w-48 h-48 transform rotate-12"
          style={{ mixBlendMode: 'overlay', opacity: 0.15, pointerEvents: 'none', color: colors.terracotta }}
          viewBox="0 0 200 200"
        >
          <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="100" cy="100" r="86" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <path id="curve" d="M 20, 100 A 80,80 0 1,1 180,100 A 80,80 0 1,1 20,100" fill="transparent" />
          <text fill="currentColor" fontFamily="'VT323', monospace" fontSize="14" letterSpacing="4">
            <textPath href="#curve" startOffset="10%">THE GIST KNOWLEDGE SYSTEM</textPath>
          </text>
        </svg>

        {/* Header */}
        <div className="px-4 py-2.5 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-2.5 overflow-hidden pr-4">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="flex-shrink-0"
              style={{ color: colors.gold }}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
            <span
              className="text-[11px] text-white/50 uppercase tracking-wide flex-shrink-0"
              style={{ fontFamily: fonts.vt323 }}
            >
              Selection
            </span>
            <span className="text-[13px] text-white/80 truncate font-medium">
              "{result.selection || '...'}"
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[10px] border border-white/10 rounded px-1.5 py-0.5 text-white/40 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            style={{ fontFamily: fonts.vt323 }}
          >
            ESC
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Headline */}
          <div
            role="button"
            tabIndex={0}
            title="Double-click to ask for a deeper take on the headline"
            onDoubleClick={() =>
              setFollowUpText('Go deeper on the headline: implications, edge cases, and how it connects to what I already know.')
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setFollowUpText(
                  'Go deeper on the headline: implications, edge cases, and how it connects to what I already know.'
                );
              }
            }}
            className="text-2xl leading-snug italic tracking-tight cursor-default select-none rounded-md outline-none focus-visible:ring-1 focus-visible:ring-gold/40"
            style={{ fontFamily: fonts.newsreader, color: colors.cream }}
            dangerouslySetInnerHTML={{
              __html: result.headline.replace(
                /\*\*(.*?)\*\*/g,
                `<span style="color: ${colors.gold}">$1</span>`
              ),
            }}
          />

          {/* Visual (SVG / image / Mermaid) */}
          <div
            className="w-full min-h-[10rem] border border-white/5 rounded-lg relative overflow-hidden flex items-center justify-center p-3"
            style={{ background: 'rgba(18,17,16,0.5)' }}
          >
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={retroBorder} />
            <div className="w-full relative z-10">
              <ExplanationVisual visual={result.visual} />
            </div>
          </div>

          {/* With/Without Comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-md p-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full" style={{ background: 'rgba(188,95,64,0.5)' }} />
              <div className="flex items-center gap-1.5 mb-1.5">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  style={{ color: colors.terracotta }}
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <span
                  className="text-[10px] uppercase tracking-widest text-white/50"
                  style={{ fontFamily: fonts.vt323 }}
                >
                  Without
                </span>
              </div>
              <div className="text-[13px] text-white/70 leading-relaxed">{result.withoutExample}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-md p-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full" style={{ background: 'rgba(220,168,66,0.5)' }} />
              <div className="flex items-center gap-1.5 mb-1.5">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  style={{ color: colors.gold }}
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span
                  className="text-[10px] uppercase tracking-widest text-white/50"
                  style={{ fontFamily: fonts.vt323 }}
                >
                  With
                </span>
              </div>
              <div className="text-[13px] text-white/70 leading-relaxed">{result.withExample}</div>
            </div>
          </div>

          {/* Mechanics */}
          <div className="pt-2">
            <div
              className="text-[10px] uppercase tracking-widest text-white/40 mb-3 border-b border-white/10 pb-1"
              style={{ fontFamily: fonts.vt323 }}
            >
              Mechanics
            </div>
            <ul className="space-y-3">
              {result.mechanics.map((item) => (
                <li
                  key={item.num}
                  className="flex items-start gap-3 group cursor-default rounded-md"
                  title="Double-click to ask for more detail on this step"
                  onDoubleClick={() =>
                    setFollowUpText(`Explain step ${item.num} in more detail and give a concrete example.`)
                  }
                >
                  <span
                    className="w-5 h-5 rounded border border-white/20 flex items-center justify-center text-[10px] text-white/50 mt-0.5 group-hover:border-terracotta group-hover:text-terracotta transition-colors flex-shrink-0"
                    style={{ fontFamily: fonts.vt323 }}
                  >
                    {item.num}
                  </span>
                  <span className="text-[13.5px] text-white/80 leading-snug pt-0.5">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* First Principle */}
          <div
            role="button"
            tabIndex={0}
            title="Double-click to dig into the first principle"
            onDoubleClick={() =>
              setFollowUpText(
                'Unpack the first principle further: why it matters, common misconceptions, and a counterexample.'
              )
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setFollowUpText(
                  'Unpack the first principle further: why it matters, common misconceptions, and a counterexample.'
                );
              }
            }}
            className="border rounded-md p-4 relative overflow-hidden outline-none focus-visible:ring-1 focus-visible:ring-gold/40"
            style={{ background: 'rgba(220,168,66,0.05)', borderColor: 'rgba(220,168,66,0.2)' }}
          >
            <div
              className="text-[10px] uppercase tracking-widest mb-1"
              style={{ color: colors.gold, fontFamily: fonts.vt323 }}
            >
              First Principle
            </div>
            <div
              className="text-[14px] leading-snug"
              style={{ fontFamily: fonts.newsreader, color: colors.cream }}
            >
              {result.firstPrinciple}
            </div>
          </div>

          {/* Follow-up */}
          <div className="border border-white/10 rounded-lg p-3 bg-white/[0.02] space-y-2">
            <div
              className="text-[10px] uppercase tracking-widest text-white/40"
              style={{ fontFamily: fonts.vt323 }}
            >
              Ask a follow-up
            </div>
            <textarea
              value={followUpText}
              onChange={(e) => setFollowUpText(e.target.value)}
              disabled={followUpLoading}
              placeholder="e.g. What if my data is messy? (or double-click headline / a step / first principle)"
              rows={2}
              className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-[12px] text-white/90 placeholder-white/30 focus:outline-none focus:border-gold/40 resize-none disabled:opacity-50"
              style={{ fontFamily: fonts.inter }}
            />
            <button
              type="button"
              onClick={() => void sendFollowUp()}
              disabled={followUpLoading || !followUpText.trim()}
              className="text-[11px] px-3 py-1.5 rounded border border-white/15 text-white/80 hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              style={{ fontFamily: fonts.vt323 }}
            >
              {followUpLoading ? 'Thinking…' : 'Send follow-up'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-black/40 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-white/10 flex items-center justify-center bg-white/5">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="text-white/60"
                strokeWidth="1.5"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                <path d="M8 7h6" />
                <path d="M8 11h8" />
              </svg>
            </div>
            <div>
              <div
                className="text-[10px] text-white/40 uppercase"
                style={{ fontFamily: fonts.vt323 }}
              >
                Target Node
              </div>
              <div className="text-[12px] font-medium text-white/90">{result.targetNode}</div>
            </div>
          </div>
          <button
            onClick={handleAddToWiki}
            disabled={isAdding}
            className="flex items-center gap-2 px-3 py-1.5 rounded text-[12px] font-medium transition-all duration-200 shadow-sm disabled:opacity-50"
            style={{
              background: addedToWiki ? colors.terracotta : 'white',
              color: addedToWiki ? 'white' : colors.dark,
            }}
          >
            {isAdding ? 'Adding...' : addedToWiki ? 'Added!' : 'Add to Wiki'}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
