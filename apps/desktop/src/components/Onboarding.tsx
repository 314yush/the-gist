import { useState } from 'react';
import { colors, fonts } from '../lib/theme';

interface OnboardingProps {
  onComplete: () => void;
}

interface StepConfig {
  num: number;
  label: string;
  description: string;
  buttonText: string;
}

const steps: StepConfig[] = [
  {
    num: 1,
    label: 'Grant Accessibility Access',
    description: 'The Gist needs accessibility permissions to capture text selections across apps.',
    buttonText: 'Open System Preferences',
  },
  {
    num: 2,
    label: 'Connect Local Wiki',
    description: 'Select your wiki markdown file (e.g., wiki.md) where explanations will be saved.',
    buttonText: 'Select Wiki File',
  },
  {
    num: 3,
    label: 'Twitter Handle (Optional)',
    description: 'Add your Twitter handle to personalize explanations with your interests.',
    buttonText: 'Continue',
  },
  {
    num: 4,
    label: 'Connect to The Gist',
    description: 'Enter your The Gist API URL and token, or use your own provider keys.',
    buttonText: 'Complete Setup',
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [activeStep, setActiveStep] = useState(1);
  const [wikiPath, setWikiPath] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [isAnalyzingProfile, setIsAnalyzingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleNext = async () => {
    if (activeStep === 1) {
      // Open System Preferences for Accessibility
      await window.thegist?.system?.openAccessibilitySettings();
      setActiveStep(2);
      return;
    } else if (activeStep === 2) {
      const path = await window.thegist?.config.openFilePicker();
      if (path) {
        setWikiPath(path);
        setActiveStep(3);
      }
      return;
    } else if (activeStep === 3) {
      // Analyze Twitter profile if handle is provided
      const handle = twitterHandle.replace('@', '').trim();
      if (handle && window.thegist?.profile) {
        setIsAnalyzingProfile(true);
        setProfileStatus('idle');
        try {
          const result = await window.thegist.profile.analyze(handle);
          if (result.success) {
            setProfileStatus('success');
            // Wait a moment to show success before advancing
            await new Promise(resolve => setTimeout(resolve, 1500));
          } else {
            setProfileStatus('error');
            console.error('Profile analysis failed:', result.error);
          }
        } catch (err) {
          setProfileStatus('error');
          console.error('Profile analysis error:', err);
        }
        setIsAnalyzingProfile(false);
      }
      setActiveStep(4);
      return;
    } else if (activeStep === 4) {
      await window.thegist?.config.set({
        setupComplete: true,
        wikiPath,
        twitterHandle: twitterHandle.replace('@', '').trim() || undefined,
        apiUrl: apiUrl || undefined,
        apiToken: apiToken || undefined,
      });
      onComplete();
    }
  };

  const handleSkip = () => {
    if (activeStep < 4) {
      setActiveStep(activeStep + 1);
    }
  };

  const currentStep = steps[activeStep - 1];

  return (
    <div className="w-full h-full flex">
      {/* Drag region for window movement */}
      <div className="absolute top-0 left-0 right-0 h-8 drag-region z-50" />
      
      {/* Terracotta Sidebar */}
      <div
        className="w-[220px] relative overflow-hidden flex flex-col p-6 pt-10"
        style={{ background: colors.terracotta, color: colors.cream }}
      >
        {/* Decorative Circles */}
        <svg
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] opacity-20 pointer-events-none"
          viewBox="0 0 1000 1000"
        >
          <circle cx="500" cy="500" r="150" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="500" cy="500" r="220" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="500" cy="500" r="290" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="500" cy="500" r="360" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>

        <div className="relative z-10 flex-1 flex flex-col">
          {/* Logo */}
          <div
            className="w-10 h-10 border-2 rounded-full flex items-center justify-center mb-auto"
            style={{ borderColor: colors.cream }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 2L2 22h20L12 2z" />
            </svg>
          </div>

          {/* Branding */}
          <div>
            <h2
              className="text-4xl mb-2 italic"
              style={{ fontFamily: fonts.newsreader }}
            >
              The Gist
            </h2>
            <div className="w-8 h-px mb-3" style={{ background: 'rgba(253,251,247,0.5)' }} />
            <div
              className="text-[10px] uppercase tracking-[0.2em] opacity-80 leading-relaxed"
              style={{ fontFamily: fonts.vt323 }}
            >
              Contextual<br />Learning<br />Terminal
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 pt-10 flex flex-col relative overflow-hidden" style={{ background: colors.dark }}>
        {/* Noise Overlay */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            mixBlendMode: 'screen',
            backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')",
          }}
        />

        <div className="relative z-10 flex-1 flex flex-col overflow-y-auto">
          {/* Header */}
          <div
            className="text-[10px] text-white/40 uppercase tracking-widest mb-4"
            style={{ fontFamily: fonts.vt323 }}
          >
            Setup Wizard v1.0
          </div>
          <h3
            className="text-3xl mb-3"
            style={{ fontFamily: fonts.newsreader, color: colors.cream }}
          >
            Initialize System
          </h3>
          <p className="text-[13.5px] text-white/60 mb-8 leading-relaxed max-w-[90%]">
            Configure The Gist to read your selected text and seamlessly weave explanations into your personal knowledge base.
          </p>

          {/* Steps List */}
          <ul className="space-y-1 mb-auto border-t border-white/5">
            {steps.map((step) => {
              const isActive = step.num === activeStep;
              const isDone = step.num < activeStep;
              const isDisabled = step.num > activeStep;

              return (
                <li
                  key={step.num}
                  className="flex items-center gap-4 py-3 border-b border-white/5 group cursor-pointer relative"
                  style={{ opacity: isDisabled ? 0.5 : 1 }}
                  onClick={() => !isDisabled && setActiveStep(step.num)}
                >
                  {isActive && (
                    <div
                      className="absolute -left-8 w-1 h-1/2 rounded-r"
                      style={{ background: colors.gold }}
                    />
                  )}
                  <div
                    className="w-6 h-6 rounded-full border flex items-center justify-center text-[11px] font-bold"
                    style={{
                      fontFamily: fonts.vt323,
                      borderColor: isActive ? colors.gold : isDone ? 'rgba(220,168,66,0.4)' : 'rgba(255,255,255,0.2)',
                      background: isActive ? colors.gold : isDone ? 'rgba(220,168,66,0.1)' : 'rgba(255,255,255,0.05)',
                      color: isActive ? colors.dark : isDone ? colors.gold : 'rgba(255,255,255,0.4)',
                      boxShadow: isActive ? '0 0 10px rgba(220,168,66,0.3)' : 'none',
                    }}
                  >
                    {isDone ? '✓' : step.num}
                  </div>
                  <span
                    className="text-[14px] flex-1"
                    style={{
                      color: isActive ? colors.cream : isDone ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.4)',
                      fontWeight: isActive ? 500 : 400,
                    }}
                  >
                    {step.label}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    style={{ color: isActive ? colors.gold : 'rgba(255,255,255,0.2)' }}
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </li>
              );
            })}
          </ul>

          {/* Step Content */}
          <div className="mt-6 p-4 rounded-lg border border-white/10 bg-white/[0.02]">
            <p className="text-[13px] text-white/70 mb-4">{currentStep.description}</p>

            {activeStep === 2 && wikiPath && (
              <div className="mb-4 p-2 rounded bg-white/5 border border-white/10">
                <span className="text-[11px] text-white/40 font-mono" style={{ fontFamily: fonts.vt323 }}>
                  Selected:
                </span>
                <span className="text-[12px] text-white/80 ml-2 truncate block">{wikiPath}</span>
              </div>
            )}

            {activeStep === 3 && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="@username"
                  value={twitterHandle}
                  onChange={(e) => setTwitterHandle(e.target.value)}
                  disabled={isAnalyzingProfile}
                  className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-[13px] text-white/90 placeholder-white/30 focus:outline-none focus:border-gold/50 disabled:opacity-50"
                  style={{ fontFamily: fonts.inter }}
                />
                {isAnalyzingProfile && (
                  <div className="flex items-center gap-2 text-[12px] text-gold">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Analyzing your Twitter profile for personalized explanations...</span>
                  </div>
                )}
                {profileStatus === 'success' && !isAnalyzingProfile && (
                  <div className="flex items-center gap-2 text-[12px] text-green-400">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span>Profile analyzed! Your explanations will be personalized.</span>
                  </div>
                )}
                {profileStatus === 'error' && !isAnalyzingProfile && (
                  <div className="flex items-center gap-2 text-[12px] text-white/50">
                    <span>Could not analyze profile. Continuing without personalization.</span>
                  </div>
                )}
                <p className="text-[11px] text-white/40 mt-2">
                  We'll analyze your recent tweets to understand your interests and create better analogies.
                </p>
              </div>
            )}

            {activeStep === 4 && (
              <div className="space-y-3">
                <input
                  type="url"
                  placeholder="API URL (e.g., https://api.whatsthegist.xyz)"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-[13px] text-white/90 placeholder-white/30 focus:outline-none focus:border-gold/50"
                />
                <input
                  type="password"
                  placeholder="API Token"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-[13px] text-white/90 placeholder-white/30 focus:outline-none focus:border-gold/50"
                />
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-between items-center mt-6 pt-4">
            <button
              onClick={handleSkip}
              className="text-[12px] text-white/40 hover:text-white transition-colors underline underline-offset-4 decoration-white/20"
            >
              Skip for now
            </button>
            <button
              onClick={handleNext}
              disabled={isAnalyzingProfile}
              className="px-5 py-2.5 rounded text-[13px] font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: colors.cream,
                color: colors.dark,
                boxShadow: '0 2px 10px rgba(253,251,247,0.1)',
              }}
              onMouseEnter={(e) => {
                if (!isAnalyzingProfile) {
                  e.currentTarget.style.background = colors.gold;
                  e.currentTarget.style.boxShadow = '0 2px 15px rgba(220,168,66,0.2)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = colors.cream;
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(253,251,247,0.1)';
              }}
            >
              {isAnalyzingProfile ? 'Analyzing...' : currentStep.buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
