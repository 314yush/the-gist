import { useState, useEffect } from 'react';
import { getLocal, setLocal } from '../lib/storage';
import { colors, fonts } from '../lib/theme';
import { Onboarding } from '../components/Onboarding';

export default function App() {
  const [apiUrl, setApiUrl] = useState('http://localhost:3000');
  const [wiki, setWiki] = useState('');
  const [saved, setSaved] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setWiki(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function loadSettings() {
    const url = await getLocal('apiUrl');
    const w = await getLocal('wiki');
    if (url) setApiUrl(url);
    if (w) setWiki(w);
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  const handleSave = async () => {
    await setLocal('apiUrl', apiUrl);
    await setLocal('wiki', wiki);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  function handleOnboardingComplete() {
    setShowOnboarding(false);
    // Reload wiki from storage since onboarding saved it
    void loadSettings();
  }

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-darker flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Onboarding onComplete={handleOnboardingComplete} />
        </div>
      </div>
    );
  }

  const hasWiki = wiki.trim().length > 0;

  return (
    <div className="min-h-screen bg-darker p-8" style={{ color: colors.cream }}>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1
            className="text-3xl mb-1"
            style={{ fontFamily: fonts.newsreader }}
          >
            The Gist Settings
          </h1>
          <p
            className="text-[11px] uppercase tracking-widest text-white/40"
            style={{ fontFamily: fonts.vt323 }}
          >
            Extension Configuration
          </p>
        </div>

        {/* Personalization Setup */}
        <div
          className="rounded-xl border p-5 space-y-3"
          style={{
            borderColor: hasWiki ? 'rgba(255,255,255,0.05)' : `${colors.gold}40`,
            background: hasWiki ? 'rgba(255,255,255,0.02)' : `${colors.gold}08`,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="text-[13px] uppercase tracking-widest text-white/50"
                style={{ fontFamily: fonts.vt323 }}
              >
                Personalization
              </h2>
              <p className="text-[12px] text-white/40 mt-1" style={{ fontFamily: fonts.inter }}>
                {hasWiki
                  ? 'Your knowledge profile is set up. Re-run to update.'
                  : 'No knowledge profile yet. Set one up for personalized explanations.'}
              </p>
            </div>
            {hasWiki && (
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: '#4ade80' }}
                title="Profile active"
              />
            )}
          </div>
          <button
            onClick={() => setShowOnboarding(true)}
            className="px-4 py-2 rounded-lg text-[12px] font-medium transition-all hover:brightness-110 active:scale-[0.98]"
            style={{
              background: hasWiki ? 'rgba(255,255,255,0.08)' : colors.gold,
              color: hasWiki ? 'rgba(255,255,255,0.7)' : colors.dark,
              fontFamily: fonts.vt323,
            }}
          >
            {hasWiki ? 'Re-run Setup' : 'Set Up Now'}
          </button>
        </div>

        {/* API URL */}
        <div className="space-y-2">
          <label
            className="text-[11px] uppercase tracking-widest text-white/50 block"
            style={{ fontFamily: fonts.vt323 }}
          >
            API URL
          </label>
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-[13px] text-white/90 placeholder-white/30 focus:outline-none focus:border-gold/40 transition-colors"
            style={{ fontFamily: fonts.inter }}
            placeholder="http://localhost:3000"
          />
          <p className="text-[10px] text-white/30" style={{ fontFamily: fonts.vt323 }}>
            The URL of your The Gist API server
          </p>
        </div>

        {/* Wiki */}
        <div className="space-y-2">
          <label
            className="text-[11px] uppercase tracking-widest text-white/50 block"
            style={{ fontFamily: fonts.vt323 }}
          >
            Wiki / Knowledge Base
          </label>
          <div className="flex items-center gap-3 mb-2">
            <label
              className="px-3 py-1.5 rounded-lg text-[11px] cursor-pointer border border-white/10 text-white/60 hover:text-white/80 hover:border-white/20 transition-colors"
              style={{ fontFamily: fonts.vt323 }}
            >
              Upload .md / .txt
              <input
                type="file"
                accept=".md,.txt,.markdown,text/plain,text/markdown"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <span className="text-[10px] text-white/30" style={{ fontFamily: fonts.vt323 }}>
              or paste below
            </span>
          </div>
          <textarea
            value={wiki}
            onChange={(e) => setWiki(e.target.value)}
            rows={16}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-[13px] text-white/90 placeholder-white/30 focus:outline-none focus:border-gold/40 resize-y transition-colors"
            style={{ fontFamily: fonts.inter }}
            placeholder="Paste your knowledge base / wiki content here, or upload a file above."
          />
          <p className="text-[10px] text-white/30" style={{ fontFamily: fonts.vt323 }}>
            Your wiki content is sent to The Gist API (via OpenRouter) with each request to personalize explanations
          </p>
        </div>

        {/* Save */}
        <button
          onClick={() => void handleSave()}
          className="px-6 py-2.5 rounded-lg text-[12px] font-medium transition-all duration-200 shadow-sm"
          style={{
            background: saved ? colors.terracotta : colors.gold,
            color: colors.dark,
          }}
        >
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
