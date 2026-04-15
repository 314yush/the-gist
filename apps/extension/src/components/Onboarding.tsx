import { useState, useRef } from 'react';
import { setLocal } from '../lib/storage';
import { analyzeTwitterProfile, generateWiki } from '../lib/api';
import { gistIconUrl } from '../lib/extensionIcon';
import { colors, fonts } from '../lib/theme';
import type { UserProfile } from '@thegist/shared';

interface OnboardingProps {
  onComplete: () => void;
}

type Step = 'welcome' | 'qna' | 'xhandle' | 'generating' | 'review';

const QUESTIONS = [
  { key: 'profession', question: "What's your profession/field?" },
  { key: 'learning', question: 'What topics are you currently learning about?' },
  { key: 'level', question: "What's your technical comfort level?", options: ['Beginner', 'Intermediate', 'Advanced'] },
  { key: 'hobbies', question: 'What are your hobbies/interests outside work?' },
  { key: 'explanationStyle', question: 'How do you prefer explanations?', options: ['Analogies', 'Step-by-step', 'Visual', 'Concise'] },
  { key: 'analogyDomains', question: 'What domains make good analogies for you?', options: ['Gaming', 'Cooking', 'Sports', 'Music', 'Movies', 'Science'] },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>('welcome');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [xHandle, setXHandle] = useState('');
  const [twitterProfile, setTwitterProfile] = useState<UserProfile | undefined>();
  const [wiki, setWiki] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Step handlers ---

  function handleUpload() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setWiki(text);
    setStep('xhandle');
  }

  function handleFromScratch() {
    setStep('qna');
  }

  function handleAnswerSubmit() {
    const q = QUESTIONS[currentQ];
    if (!inputValue.trim()) return;
    const newAnswers = { ...answers, [q.key]: inputValue.trim() };
    setAnswers(newAnswers);
    setInputValue('');

    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setStep('xhandle');
    }
  }

  function handleOptionSelect(option: string) {
    const q = QUESTIONS[currentQ];
    // For multi-select style questions (analogyDomains), allow toggling
    if (q.key === 'analogyDomains') {
      const current = inputValue ? inputValue.split(', ') : [];
      const updated = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      setInputValue(updated.join(', '));
      return;
    }
    // Single select: set and advance
    const newAnswers = { ...answers, [q.key]: option };
    setAnswers(newAnswers);
    setInputValue('');
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setStep('xhandle');
    }
  }

  async function handleAnalyzeX() {
    if (!xHandle.trim()) return;
    const handle = xHandle.replace('@', '');

    // If user already has a wiki (uploaded), save it and complete immediately.
    // Run X analysis in background to enrich the wiki later.
    if (wiki) {
      await setLocal('wiki', wiki);
      await setLocal('onboardingComplete', true);
      // Fire and forget: analyze + regenerate wiki in background
      runBackgroundProfileAnalysis(handle, wiki);
      onComplete();
      return;
    }

    // No wiki yet: we need to generate one. Move to generating step but
    // don't block: if analysis takes too long, user can skip from generating screen.
    setStep('generating');
    setLoading(true);
    setError('');

    try {
      const result = await analyzeTwitterProfile(handle);
      setTwitterProfile(result.profile);
      await doGenerateWiki(result.profile);
    } catch (err) {
      // Analysis failed: generate wiki from Q&A answers only
      console.warn('[Onboarding] X analysis failed, generating wiki from answers only:', err);
      await doGenerateWiki();
    }
  }

  /**
   * Fire-and-forget: analyze X profile, regenerate wiki with profile data,
   * and silently update storage. User is already using the app.
   */
  function runBackgroundProfileAnalysis(handle: string, existingWiki: string) {
    (async () => {
      try {
        console.log('[TheGist] Background: analyzing X profile...');
        const result = await analyzeTwitterProfile(handle);
        console.log('[TheGist] Background: X analysis complete, regenerating wiki...');
        const wikiResult = await generateWiki(answers, result.profile);
        // Merge: keep existing wiki, append generated profile section
        const merged = existingWiki.trim() + '\n\n' + wikiResult.wiki.trim();
        await setLocal('wiki', merged);
        console.log('[TheGist] Background: wiki updated with X profile data');
      } catch (err) {
        console.warn('[TheGist] Background X analysis failed (non-blocking):', err);
      }
    })();
  }

  async function handleSkipX() {
    if (wiki) {
      setStep('review');
    } else {
      setStep('generating');
      await doGenerateWiki();
    }
  }

  async function doGenerateWiki(profile?: UserProfile) {
    setLoading(true);
    setError('');
    try {
      const result = await generateWiki(answers, profile || twitterProfile);
      setWiki(result.wiki);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate wiki');
      setStep('review');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    await setLocal('wiki', wiki);
    await setLocal('onboardingComplete', true);
    setSaving(false);
    onComplete();
  }

  async function handleSkipAll() {
    await setLocal('onboardingComplete', true);
    onComplete();
  }

  // --- Header (shared across steps) ---

  const header = (
    <div className="flex items-center gap-3 mb-5">
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
        <img src={gistIconUrl(128)} alt="" className="h-full w-full object-cover" width={40} height={40} />
      </div>
      <div>
        <h1 className="text-lg leading-tight" style={{ fontFamily: fonts.newsreader }}>
          Welcome to The Gist
        </h1>
        <p className="text-[10px] text-white/30" style={{ fontFamily: fonts.vt323 }}>
          CONTEXTUAL LEARNING
        </p>
      </div>
    </div>
  );

  // --- Step: Welcome ---

  if (step === 'welcome') {
    return (
      <div className="min-h-[400px] bg-darker flex flex-col p-5" style={{ color: colors.cream }}>
        {header}
        <p className="text-[13px] text-white/60 mb-2 leading-relaxed" style={{ fontFamily: fonts.inter }}>
          The Gist explains things based on <span style={{ color: colors.gold }}>what you already know</span>. Upload your wiki to get explanations that actually click.
        </p>
        <p className="text-[11px] text-white/30 mb-5" style={{ fontFamily: fonts.vt323 }}>
          YOUR WIKI = BETTER ANALOGIES, RELEVANT CONTEXT, ZERO FLUFF
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.txt,.markdown"
          className="hidden"
          onChange={(e) => void handleFileChange(e)}
        />

        <button
          onClick={handleUpload}
          className="w-full py-3 rounded-lg text-[13px] font-medium transition-all hover:brightness-110 active:scale-[0.98] mb-3"
          style={{ background: colors.gold, color: colors.dark, fontFamily: fonts.inter }}
        >
          Upload wiki.md
        </button>

        <button
          onClick={handleFromScratch}
          className="w-full py-3 rounded-lg text-[13px] font-medium transition-all hover:opacity-90 border border-white/10 hover:border-gold/40 text-white/70 hover:text-white/90 mb-6"
          style={{ fontFamily: fonts.inter }}
        >
          Build from scratch instead
        </button>

        <button
          onClick={() => void handleSkipAll()}
          className="text-[10px] text-white/20 hover:text-white/40 transition-colors self-center"
          style={{ fontFamily: fonts.vt323 }}
        >
          skip
        </button>
      </div>
    );
  }

  // --- Step: QnA ---

  if (step === 'qna') {
    const q = QUESTIONS[currentQ];
    return (
      <div className="min-h-[400px] bg-darker flex flex-col p-5" style={{ color: colors.cream }}>
        {header}

        {/* Progress */}
        <div className="flex gap-1 mb-4">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-colors"
              style={{ background: i <= currentQ ? colors.gold : 'rgba(255,255,255,0.1)' }}
            />
          ))}
        </div>

        <p className="text-[11px] text-white/30 mb-1" style={{ fontFamily: fonts.vt323 }}>
          QUESTION {currentQ + 1} OF {QUESTIONS.length}
        </p>
        <p className="text-[14px] text-white/80 mb-4 leading-relaxed" style={{ fontFamily: fonts.inter }}>
          {q.question}
        </p>

        {q.options ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {q.options.map((opt) => {
              const selected = q.key === 'analogyDomains'
                ? (inputValue || '').split(', ').includes(opt)
                : false;
              return (
                <button
                  key={opt}
                  onClick={() => handleOptionSelect(opt)}
                  className="px-3 py-1.5 rounded-full text-[12px] transition-all border"
                  style={{
                    fontFamily: fonts.inter,
                    borderColor: selected ? colors.gold : 'rgba(255,255,255,0.15)',
                    background: selected ? `${colors.gold}20` : 'transparent',
                    color: selected ? colors.gold : 'rgba(255,255,255,0.6)',
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        ) : (
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnswerSubmit()}
            placeholder="Type your answer..."
            className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-[13px] text-white/90 placeholder-white/30 focus:outline-none focus:border-gold/40 mb-4"
            style={{ fontFamily: fonts.inter }}
            autoFocus
          />
        )}

        {/* For multi-select (analogyDomains), show a confirm button */}
        {q.key === 'analogyDomains' && inputValue && (
          <button
            onClick={handleAnswerSubmit}
            className="w-full py-2.5 rounded-lg text-[13px] font-medium transition-all hover:opacity-90 mb-2"
            style={{ background: colors.gold, color: colors.dark, fontFamily: fonts.inter }}
          >
            Continue
          </button>
        )}

        {!q.options && (
          <button
            onClick={handleAnswerSubmit}
            disabled={!inputValue.trim()}
            className="w-full py-2.5 rounded-lg text-[13px] font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90"
            style={{ background: colors.gold, color: colors.dark, fontFamily: fonts.inter }}
          >
            {currentQ < QUESTIONS.length - 1 ? 'Next' : 'Continue'}
          </button>
        )}
      </div>
    );
  }

  // --- Step: X Handle ---

  if (step === 'xhandle') {
    return (
      <div className="min-h-[400px] bg-darker flex flex-col p-5" style={{ color: colors.cream }}>
        {header}

        <p className="text-[13px] text-white/60 mb-1 leading-relaxed" style={{ fontFamily: fonts.inter }}>
          Link your X account so The Gist can use <span style={{ color: colors.gold }}>your interests and expertise</span> to tailor every explanation.
        </p>
        <p className="text-[11px] text-white/30 mb-4" style={{ fontFamily: fonts.vt323 }}>
          WE SCAN YOUR RECENT POSTS TO BUILD YOUR PROFILE. NOTHING IS STORED EXTERNALLY.
        </p>

        <div className="flex gap-2 mb-3">
          <input
            value={xHandle}
            onChange={(e) => setXHandle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleAnalyzeX()}
            placeholder="@yourhandle"
            className="flex-1 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-[13px] text-white/90 placeholder-white/30 focus:outline-none focus:border-gold/40"
            style={{ fontFamily: fonts.inter }}
            disabled={loading}
            autoFocus
          />
          <button
            onClick={() => void handleAnalyzeX()}
            disabled={!xHandle.trim() || loading}
            className="px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110"
            style={{ background: colors.gold, color: colors.dark, fontFamily: fonts.inter }}
          >
            {loading ? 'Analyzing...' : 'Connect'}
          </button>
        </div>

        {loading && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: colors.gold }} />
            <p className="text-[11px] text-white/40" style={{ fontFamily: fonts.vt323 }}>
              SCANNING RECENT POSTS. THIS CAN TAKE UP TO A MINUTE.
            </p>
          </div>
        )}

        {error && (
          <p className="text-[12px] text-red-400 mb-3" style={{ fontFamily: fonts.inter }}>
            {error}
          </p>
        )}

        <button
          onClick={() => void handleSkipX()}
          disabled={loading}
          className="text-[10px] text-white/20 hover:text-white/40 transition-colors self-center mt-2"
          style={{ fontFamily: fonts.vt323 }}
        >
          skip
        </button>
      </div>
    );
  }

  // --- Step: Generating ---

  if (step === 'generating') {
    return (
      <div className="min-h-[400px] bg-darker flex flex-col items-center justify-center p-5" style={{ color: colors.cream }}>
        <div className="relative w-16 h-16 mb-4">
          <svg
            className="w-full h-full animate-spin"
            style={{ color: colors.gold, animationDuration: '3s' }}
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="50" cy="50" r="40" strokeWidth="2" strokeDasharray="20 10" />
            <circle cx="50" cy="50" r="30" strokeWidth="1" strokeDasharray="8 8" opacity="0.5" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: colors.gold }} />
          </div>
        </div>
        <p className="text-[14px] text-white/70 mb-1" style={{ fontFamily: fonts.inter }}>
          Building your knowledge profile...
        </p>
        <p className="text-[11px] text-white/30 mb-6" style={{ fontFamily: fonts.vt323 }}>
          ANALYZING YOUR X POSTS + GENERATING WIKI. UP TO A MINUTE.
        </p>
        <button
          onClick={async () => {
            // Let the user bail: save what we have and complete
            await setLocal('onboardingComplete', true);
            if (wiki) await setLocal('wiki', wiki);
            onComplete();
          }}
          className="text-[11px] text-white/30 hover:text-white/50 transition-colors"
          style={{ fontFamily: fonts.vt323 }}
        >
          Continue in background. I'll start using the app
        </button>
      </div>
    );
  }

  // --- Step: Review ---

  return (
    <div className="min-h-[400px] bg-darker flex flex-col p-5" style={{ color: colors.cream }}>
      {header}

      <p className="text-[13px] text-white/60 mb-3 leading-relaxed" style={{ fontFamily: fonts.inter }}>
        Review and edit your knowledge profile. This helps The Gist tailor explanations to you.
      </p>

      {error && (
        <p className="text-[12px] text-red-400 mb-2" style={{ fontFamily: fonts.inter }}>
          {error}. You can write your wiki manually below.
        </p>
      )}

      <textarea
        value={wiki}
        onChange={(e) => setWiki(e.target.value)}
        placeholder="Your wiki / knowledge profile..."
        rows={10}
        className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-[13px] text-white/90 placeholder-white/30 focus:outline-none focus:border-gold/40 resize-none mb-4 flex-1"
        style={{ fontFamily: fonts.inter }}
      />

      <div className="flex gap-3">
        <button
          onClick={() => void handleSkipAll()}
          className="flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-all hover:opacity-90 border border-white/10 hover:border-white/20 text-white/40 hover:text-white/70"
          style={{ fontFamily: fonts.vt323 }}
        >
          Skip
        </button>
        <button
          onClick={() => void handleSave()}
          disabled={!wiki.trim() || saving}
          className="flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90"
          style={{ background: colors.gold, color: colors.dark }}
        >
          {saving ? 'Saving...' : 'Save & Continue'}
        </button>
      </div>
    </div>
  );
}
