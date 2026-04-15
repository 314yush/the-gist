import { useState, useEffect } from 'react';
import { colors, fonts } from '../lib/theme';
import { useConfig } from '../hooks/useCapture';

interface PreferencesProps {
  onClose: () => void;
}

export function Preferences({ onClose }: PreferencesProps) {
  const { config, updateConfig, openFilePicker } = useConfig();
  
  const [apiUrl, setApiUrl] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [wikiPath, setWikiPath] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (config) {
      setApiUrl(config.apiUrl || '');
      setApiToken(config.apiToken || '');
      setWikiPath(config.wikiPath || '');
      setTwitterHandle(config.twitterHandle || '');
    }
  }, [config]);

  const handleSave = async () => {
    await updateConfig({
      apiUrl: apiUrl || undefined,
      apiToken: apiToken || undefined,
      wikiPath: wikiPath || undefined,
      twitterHandle: twitterHandle || undefined,
    });
    setHasChanges(false);
    onClose();
  };

  const handleBrowse = async () => {
    const path = await openFilePicker();
    if (path) {
      setWikiPath(path);
      setHasChanges(true);
    }
  };

  const handleChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setHasChanges(true);
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: colors.dark }}>
      {/* Window Controls */}
      <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2 bg-white/[0.02] flex-shrink-0">
        <button
          onClick={onClose}
          className="w-3 h-3 rounded-full border hover:brightness-90 transition-all"
          style={{ background: '#FF5F56', borderColor: '#E0443E' }}
        />
        <div className="w-3 h-3 rounded-full border opacity-50" style={{ background: '#FFBD2E', borderColor: '#DEA123' }} />
        <div className="w-3 h-3 rounded-full border opacity-50" style={{ background: '#27C93F', borderColor: '#1AAB29' }} />
        <span className="ml-4 text-[13px] text-white/60 font-medium">Preferences</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* API Configuration */}
        <section className="mb-8">
          <h3
            className="text-[10px] uppercase tracking-widest text-white/40 mb-4 pb-2 border-b border-white/10"
            style={{ fontFamily: fonts.vt323 }}
          >
            API Configuration
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] text-white/60 mb-1.5">API URL</label>
              <input
                type="url"
                value={apiUrl}
                onChange={handleChange(setApiUrl)}
                placeholder="https://api.whatsthegist.xyz"
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-[13px] text-white/90 placeholder-white/30 focus:outline-none focus:border-gold/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[12px] text-white/60 mb-1.5">API Token</label>
              <input
                type="password"
                value={apiToken}
                onChange={handleChange(setApiToken)}
                placeholder="Enter your API token"
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-[13px] text-white/90 placeholder-white/30 focus:outline-none focus:border-gold/50 transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Wiki Configuration */}
        <section className="mb-8">
          <h3
            className="text-[10px] uppercase tracking-widest text-white/40 mb-4 pb-2 border-b border-white/10"
            style={{ fontFamily: fonts.vt323 }}
          >
            Local Wiki
          </h3>
          
          <div>
            <label className="block text-[12px] text-white/60 mb-1.5">Wiki Path</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={wikiPath}
                onChange={handleChange(setWikiPath)}
                placeholder="/path/to/your/wiki"
                className="flex-1 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-[13px] text-white/90 placeholder-white/30 focus:outline-none focus:border-gold/50 transition-colors"
                readOnly
              />
              <button
                onClick={handleBrowse}
                className="px-4 py-2.5 rounded-lg border border-white/10 text-[12px] text-white/70 hover:bg-white/5 hover:border-white/20 transition-all"
              >
                Browse...
              </button>
            </div>
            {wikiPath && (
              <p className="text-[11px] text-white/40 mt-1.5 truncate" style={{ fontFamily: fonts.vt323 }}>
                {wikiPath}
              </p>
            )}
          </div>
        </section>

        {/* Social Configuration */}
        <section className="mb-8">
          <h3
            className="text-[10px] uppercase tracking-widest text-white/40 mb-4 pb-2 border-b border-white/10"
            style={{ fontFamily: fonts.vt323 }}
          >
            Personalization
          </h3>
          
          <div>
            <label className="block text-[12px] text-white/60 mb-1.5">Twitter Handle</label>
            <input
              type="text"
              value={twitterHandle}
              onChange={handleChange(setTwitterHandle)}
              placeholder="@username"
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-[13px] text-white/90 placeholder-white/30 focus:outline-none focus:border-gold/50 transition-colors"
            />
            <p className="text-[11px] text-white/40 mt-1.5">
              Used to personalize explanations based on your interests
            </p>
          </div>
        </section>

        {/* Hotkey Display */}
        <section className="mb-8">
          <h3
            className="text-[10px] uppercase tracking-widest text-white/40 mb-4 pb-2 border-b border-white/10"
            style={{ fontFamily: fonts.vt323 }}
          >
            Keyboard Shortcut
          </h3>
          
          <div className="flex items-center gap-3">
            <div
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[13px] text-white/80"
              style={{ fontFamily: fonts.vt323 }}
            >
              ⌘ + Shift + L
            </div>
            <span className="text-[12px] text-white/40">Global hotkey to activate The Gist</span>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-white/10 bg-black/20 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded text-[12px] text-white/60 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className="px-4 py-2 rounded text-[12px] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: hasChanges ? colors.gold : 'rgba(220,168,66,0.3)',
            color: hasChanges ? colors.dark : 'rgba(28,26,25,0.5)',
          }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
