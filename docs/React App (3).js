import React, { useState, useEffect } from 'react';

const customStyles = {
  body: {
    backgroundColor: '#0f0e0d',
    backgroundImage: `radial-gradient(circle at 50% 0%, rgba(255,255,255,0.03) 0%, transparent 50%),
                      linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
    backgroundSize: '100% 100%, 40px 40px, 40px 40px',
    fontFamily: "'Inter', sans-serif",
    WebkitFontSmoothing: 'antialiased',
  },
  glassPanel: {
    background: 'rgba(28, 26, 25, 0.75)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
  },
  retroBorder: {
    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.05) 4px, rgba(255,255,255,0.05) 5px)',
  },
  macWindowShadow: {
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 0 rgba(255,255,255,0.1)',
  },
  macPopupShadow: {
    boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 0 rgba(255,255,255,0.05)',
  },
};

const HeroPopupPanel = () => {
  const [addedToWiki, setAddedToWiki] = useState(false);

  return (
    <div className="relative group">
      <div className="absolute -inset-4 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000 pointer-events-none" style={{ background: 'rgba(188,95,64,0.05)' }}></div>

      <div className="w-[520px] rounded-[14px] flex flex-col relative overflow-hidden z-10" style={{ ...customStyles.glassPanel, ...customStyles.macWindowShadow, color: '#FDFBF7' }}>

        <svg className="absolute -top-10 -right-10 w-48 h-48 transform rotate-12" style={{ position: 'absolute', mixBlendMode: 'overlay', opacity: 0.15, pointerEvents: 'none', color: '#BC5F40' }} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="1"></circle>
          <circle cx="100" cy="100" r="86" fill="none" stroke="currentColor" strokeWidth="0.5"></circle>
          <path id="curve" d="M 20, 100 A 80,80 0 1,1 180,100 A 80,80 0 1,1 20,100" fill="transparent"></path>
          <text fill="currentColor" fontFamily="'VT323', monospace" fontSize="14" letterSpacing="4">
            <textPath href="#curve" startOffset="10%">LUMINA KNOWLEDGE SYSTEM</textPath>
          </text>
        </svg>

        <div className="px-4 py-2.5 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-2.5 overflow-hidden pr-4">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="flex-shrink-0" style={{ color: '#DCA842' }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
            </svg>
            <span className="text-[11px] font-mono text-white/50 uppercase tracking-wide flex-shrink-0" style={{ fontFamily: "'VT323', monospace" }}>Selection</span>
            <span className="text-[13px] text-white/80 truncate font-medium">"...implementing a zero-knowledge proof protocol..."</span>
          </div>
          <button className="text-[10px] font-mono border border-white/10 rounded px-1.5 py-0.5 text-white/40 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0" style={{ fontFamily: "'VT323', monospace" }}>ESC</button>
        </div>

        <div className="p-5 space-y-6">
          <div className="font-serif text-2xl leading-snug italic tracking-tight" style={{ fontFamily: "'Newsreader', serif", color: '#FDFBF7' }}>
            "Think of it like a bouncer verifying you're on the guest list <span style={{ color: '#DCA842' }}>without ever seeing your name or ID</span>—they just know you belong."
          </div>

          <div className="w-full h-40 border border-white/5 rounded-lg relative overflow-hidden flex items-center justify-center p-4" style={{ background: 'rgba(18,17,16,0.5)' }}>
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={customStyles.retroBorder}></div>
            <svg viewBox="0 0 400 120" className="w-full h-full relative z-10" fill="none">
              <rect x="40" y="40" width="80" height="40" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)"></rect>
              <text x="80" y="64" fill="white" fontSize="12" fontFamily="'Inter', sans-serif" textAnchor="middle" fontWeight="500">Prover</text>
              <rect x="280" y="40" width="80" height="40" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)"></rect>
              <text x="320" y="64" fill="white" fontSize="12" fontFamily="'Inter', sans-serif" textAnchor="middle" fontWeight="500">Verifier</text>
              <rect x="160" y="30" width="80" height="60" rx="8" fill="#1c1a19" stroke="#DCA842" strokeWidth="2" strokeDasharray="4 4"></rect>
              <text x="200" y="64" fill="#DCA842" fontSize="14" fontFamily="'VT323', monospace" textAnchor="middle">ZKP Math</text>
              <path d="M120 50 L150 50" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round"></path>
              <path d="M145 45 L152 50 L145 55" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
              <path d="M250 50 L270 50" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round"></path>
              <path d="M265 45 L272 50 L265 55" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
              <text x="135" y="40" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="'VT323', monospace" textAnchor="middle">Input</text>
              <text x="260" y="40" fill="#BC5F40" fontSize="10" fontFamily="'VT323', monospace" textAnchor="middle">True/False</text>
              <path d="M120 70 C160 90, 240 90, 280 70" stroke="#BC5F40" strokeWidth="1.5" strokeDasharray="2 2" fill="none"></path>
              <text x="200" y="95" fill="#BC5F40" fontSize="10" fontFamily="'Inter', sans-serif" textAnchor="middle" fontWeight="500">Zero data revealed</text>
            </svg>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-md p-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full" style={{ background: 'rgba(188,95,64,0.5)' }}></div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ color: '#BC5F40' }} strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                <span className="text-[10px] uppercase tracking-widest text-white/50 font-mono" style={{ fontFamily: "'VT323', monospace" }}>Without</span>
              </div>
              <div className="text-[13px] text-white/70 leading-relaxed">Handing over your entire passport just to prove you are over 21.</div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-md p-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full" style={{ background: 'rgba(220,168,66,0.5)' }}></div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ color: '#DCA842' }} strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span className="text-[10px] uppercase tracking-widest text-white/50 font-mono" style={{ fontFamily: "'VT323', monospace" }}>With</span>
              </div>
              <div className="text-[13px] text-white/70 leading-relaxed">Showing a cryptographically verified 'Yes' checkmark.</div>
            </div>
          </div>

          <div className="pt-2">
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-3 border-b border-white/10 pb-1" style={{ fontFamily: "'VT323', monospace" }}>Mechanics</div>
            <ul className="space-y-3">
              {[
                { num: '01', text: 'Prover generates a proof using a secret key and public algorithm.' },
                { num: '02', text: 'Verifier runs mathematical checks on the proof without needing the secret.' },
                { num: '03', text: 'System grants authorization while original data remains completely isolated.' },
              ].map((item) => (
                <li key={item.num} className="flex items-start gap-3 group">
                  <span className="w-5 h-5 rounded border border-white/20 flex items-center justify-center text-[10px] font-mono text-white/50 mt-0.5 group-hover:border-terracotta group-hover:text-terracotta transition-colors flex-shrink-0" style={{ fontFamily: "'VT323', monospace" }}>{item.num}</span>
                  <span className="text-[13.5px] text-white/80 leading-snug pt-0.5">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border rounded-md p-4 relative overflow-hidden" style={{ background: 'rgba(220,168,66,0.05)', borderColor: 'rgba(220,168,66,0.2)' }}>
            <div className="text-[10px] uppercase tracking-widest mb-1 font-mono" style={{ color: '#DCA842', fontFamily: "'VT323', monospace" }}>First Principle</div>
            <div className="text-[14px] font-serif leading-snug" style={{ fontFamily: "'Newsreader', serif", color: '#FDFBF7' }}>Information can be mathematically verified without being revealed.</div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-white/10 bg-black/40 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-white/10 flex items-center justify-center bg-white/5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white/60" strokeWidth="1.5">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                <path d="M8 7h6"></path>
                <path d="M8 11h8"></path>
              </svg>
            </div>
            <div>
              <div className="text-[10px] text-white/40 font-mono uppercase" style={{ fontFamily: "'VT323', monospace" }}>Target Node</div>
              <div className="text-[12px] font-medium text-white/90">Cryptography.md</div>
            </div>
          </div>
          <button
            onClick={() => setAddedToWiki(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[4px] text-[12px] font-medium transition-all duration-200 shadow-sm"
            style={{
              background: addedToWiki ? '#BC5F40' : 'white',
              color: addedToWiki ? 'white' : '#1c1a19',
            }}
          >
            {addedToWiki ? 'Added!' : 'Add to Wiki'}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"></path>
            </svg>
          </button>
        </div>
      </div>

      <div className="absolute -bottom-8 left-0 text-[11px] font-mono text-white/40 uppercase tracking-widest" style={{ fontFamily: "'VT323', monospace" }}>Fig 1. Hero Popup Panel</div>
    </div>
  );
};

const LoadingStatePanel = () => {
  return (
    <div className="relative mt-16 xl:mt-8">
      <div className="w-[520px] h-[280px] rounded-[14px] flex flex-col relative overflow-hidden z-10 border border-white/5" style={{ ...customStyles.glassPanel, ...customStyles.macPopupShadow, color: '#FDFBF7' }}>
        <div className="px-4 py-3 border-b border-white/10 flex items-center bg-white/[0.02]">
          <div className="w-4 h-4 rounded bg-white/10 animate-pulse mr-3"></div>
          <div className="h-3 w-64 bg-white/10 rounded animate-pulse"></div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <div className="relative w-24 h-24 mb-6">
            <svg className="absolute inset-0 w-full h-full" style={{ color: 'rgba(220,168,66,0.2)', animation: 'spin 10s linear infinite' }} viewBox="0 0 100 100" fill="none" stroke="currentColor">
              <circle cx="50" cy="50" r="40" strokeWidth="1" strokeDasharray="4 4"></circle>
              <circle cx="50" cy="50" r="48" strokeWidth="0.5"></circle>
            </svg>
            <svg className="absolute inset-0 w-full h-full" style={{ color: 'rgba(188,95,64,0.4)', animation: 'spin 6s linear infinite reverse' }} viewBox="0 0 100 100" fill="none" stroke="currentColor">
              <circle cx="50" cy="50" r="30" strokeWidth="1"></circle>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#FDFBF7' }}></div>
            </div>
          </div>
          <div className="font-mono text-[13px] uppercase tracking-[0.2em] relative flex items-center" style={{ color: '#DCA842', fontFamily: "'VT323', monospace" }}>
            Generating Context
            <span className="w-2 h-4 ml-2 animate-pulse" style={{ background: '#DCA842' }}></span>
          </div>
          <div className="text-[10px] font-mono text-white/30 mt-2 tracking-widest" style={{ fontFamily: "'VT323', monospace" }}>Querying mental models...</div>
        </div>
      </div>
      <div className="absolute -bottom-8 left-0 text-[11px] font-mono text-white/40 uppercase tracking-widest" style={{ fontFamily: "'VT323', monospace" }}>Fig 2. Loading State</div>
    </div>
  );
};

const MenuBarDropdown = () => {
  const [activeItem, setActiveItem] = useState(null);

  const menuItems = [
    { label: 'Zero-Knowledge Proofs' },
    { label: 'Elliptic Curve Crypto' },
    { label: 'Byzantine Fault Tolerance' },
  ];

  return (
    <div className="relative w-full flex justify-center xl:justify-start">
      <div className="absolute -top-10 left-1/2 xl:left-[140px] transform -translate-x-1/2 flex items-center gap-4 text-[13px] text-white/80 pointer-events-none">
        <span>File</span><span>Edit</span><span>View</span>
        <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-black text-[10px]">L</span>
      </div>

      <div className="w-[280px] rounded-xl flex flex-col relative overflow-hidden z-10 border border-white/10 p-1.5 mt-2" style={{ ...customStyles.glassPanel, ...customStyles.macWindowShadow, color: '#FDFBF7' }}>
        <div className="absolute -top-2 left-1/2 xl:left-1/2 transform -translate-x-1/2 w-4 h-4 border-t border-l border-white/10 rotate-45 z-[-1]" style={{ background: 'rgba(28,26,25,0.75)', backdropFilter: 'blur(24px)' }}></div>

        <div className="px-3 py-2 text-[10px] text-white/40 font-mono tracking-widest uppercase mb-1" style={{ fontFamily: "'VT323', monospace" }}>Recent Contexts</div>

        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => setActiveItem(item.label)}
            className="flex items-center gap-3 w-full text-left px-2 py-1.5 hover:bg-white/10 rounded-md group transition-colors"
            style={{ background: activeItem === item.label ? 'rgba(255,255,255,0.1)' : 'transparent' }}
          >
            <div className="w-5 h-5 rounded border flex items-center justify-center bg-white/5 group-hover:border-terracotta/50" style={{ borderColor: activeItem === item.label ? 'rgba(188,95,64,0.5)' : 'rgba(255,255,255,0.1)' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white/60 group-hover:text-terracotta" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <span className="truncate text-[13px] text-white/90">{item.label}</span>
          </button>
        ))}

        <div className="h-px bg-white/10 my-1.5 mx-1"></div>

        <button className="flex items-center justify-between w-full text-left px-3 py-1.5 hover:bg-white/10 rounded-md text-[13px] text-white/80">
          <span>Preferences...</span>
          <span className="text-[10px] text-white/40 font-mono tracking-wider" style={{ fontFamily: "'VT323', monospace" }}>⌘,</span>
        </button>

        <button className="flex items-center justify-between w-full text-left px-3 py-1.5 hover:bg-white/10 rounded-md text-[13px] text-white/80">
          <span>Quit Lumina</span>
          <span className="text-[10px] text-white/40 font-mono tracking-wider" style={{ fontFamily: "'VT323', monospace" }}>⌘Q</span>
        </button>
      </div>
      <div className="absolute -bottom-8 right-0 xl:left-0 text-[11px] font-mono text-white/40 uppercase tracking-widest text-right xl:text-left" style={{ fontFamily: "'VT323', monospace" }}>Fig 3. Menu Bar Dropdown</div>
    </div>
  );
};

const OnboardingWindow = () => {
  const [activeStep, setActiveStep] = useState(2);

  const steps = [
    { num: 1, label: 'Grant Accessibility Access' },
    { num: 2, label: 'Connect Local Wiki' },
    { num: 3, label: 'Define Global Shortcut' },
  ];

  return (
    <div className="relative w-full flex justify-center xl:justify-start">
      <div className="w-[600px] h-[400px] rounded-xl border border-white/10 flex flex-col overflow-hidden relative" style={{ background: '#1c1a19', ...customStyles.macWindowShadow }}>
        <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2 bg-white/[0.02] absolute top-0 w-full z-20">
          <div className="w-3 h-3 rounded-full border" style={{ background: '#FF5F56', borderColor: '#E0443E' }}></div>
          <div className="w-3 h-3 rounded-full border" style={{ background: '#FFBD2E', borderColor: '#DEA123' }}></div>
          <div className="w-3 h-3 rounded-full border" style={{ background: '#27C93F', borderColor: '#1AAB29' }}></div>
        </div>

        <div className="flex-1 flex mt-10">
          <div className="w-[220px] relative overflow-hidden flex flex-col p-6 border-r" style={{ background: '#BC5F40', color: '#FDFBF7', borderColor: 'rgba(18,17,16,0.5)' }}>
            <svg className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] opacity-20 pointer-events-none" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
              <circle cx="500" cy="500" r="150" fill="none" stroke="currentColor" strokeWidth="2"></circle>
              <circle cx="500" cy="500" r="220" fill="none" stroke="currentColor" strokeWidth="2"></circle>
              <circle cx="500" cy="500" r="290" fill="none" stroke="currentColor" strokeWidth="2"></circle>
              <circle cx="500" cy="500" r="360" fill="none" stroke="currentColor" strokeWidth="2"></circle>
            </svg>
            <div className="relative z-10 flex-1 flex flex-col">
              <div className="w-10 h-10 border-2 rounded-full flex items-center justify-center mb-auto" style={{ borderColor: '#FDFBF7' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 2L2 22h20L12 2z"></path>
                </svg>
              </div>
              <div>
                <h2 className="font-serif italic text-4xl mb-2" style={{ fontFamily: "'Newsreader', serif" }}>Lumina</h2>
                <div className="w-8 h-px mb-3" style={{ background: 'rgba(253,251,247,0.5)' }}></div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-80 leading-relaxed" style={{ fontFamily: "'VT323', monospace" }}>
                  Contextual<br />Learning<br />Terminal
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 p-8 flex flex-col relative" style={{ background: '#1c1a19' }}>
            <div className="absolute inset-0 opacity-[0.02]" style={{ mixBlendMode: 'screen', backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>
            <div className="relative z-10 flex-1 flex flex-col">
              <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-4" style={{ fontFamily: "'VT323', monospace" }}>Setup Wizard v1.0</div>
              <h3 className="font-serif text-3xl mb-3" style={{ fontFamily: "'Newsreader', serif", color: '#FDFBF7' }}>Initialize System</h3>
              <p className="text-[13.5px] text-white/60 mb-8 leading-relaxed max-w-[90%]">
                Configure Lumina to read your selected text and seamlessly weave explanations into your personal knowledge base.
              </p>

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
                      {isActive && <div className="absolute -left-8 w-1 h-1/2 rounded-r" style={{ background: '#DCA842' }}></div>}
                      <div
                        className="w-6 h-6 rounded-full border flex items-center justify-center text-[11px] font-mono font-bold"
                        style={{
                          borderColor: isActive ? '#DCA842' : isDone ? 'rgba(220,168,66,0.4)' : 'rgba(255,255,255,0.2)',
                          background: isActive ? '#DCA842' : isDone ? 'rgba(220,168,66,0.1)' : 'rgba(255,255,255,0.05)',
                          color: isActive ? '#1c1a19' : isDone ? '#DCA842' : 'rgba(255,255,255,0.4)',
                          boxShadow: isActive ? '0 0 10px rgba(220,168,66,0.3)' : 'none',
                          fontFamily: "'VT323', monospace",
                        }}
                      >
                        {step.num}
                      </div>
                      <span
                        className="text-[14px] flex-1"
                        style={{ color: isActive ? '#FDFBF7' : isDone ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.4)', fontWeight: isActive ? 500 : 400 }}
                      >
                        {step.label}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ color: isActive ? '#DCA842' : 'rgba(255,255,255,0.2)' }}>
                        <path d="M5 12h14M12 5l7 7-7 7"></path>
                      </svg>
                    </li>
                  );
                })}
              </ul>

              <div className="flex justify-between items-center mt-6 pt-4">
                <button className="text-[12px] text-white/40 hover:text-white transition-colors underline underline-offset-4 decoration-white/20">Skip for now</button>
                <button
                  className="px-5 py-2.5 rounded-[4px] text-[13px] font-medium transition-all duration-200"
                  style={{
                    background: '#FDFBF7',
                    color: '#1c1a19',
                    boxShadow: '0 2px 10px rgba(253,251,247,0.1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#DCA842';
                    e.currentTarget.style.boxShadow = '0 2px 15px rgba(220,168,66,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#FDFBF7';
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(253,251,247,0.1)';
                  }}
                  onClick={() => setActiveStep(Math.min(activeStep + 1, 3))}
                >
                  Select Folder Directory
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-8 right-0 xl:left-0 text-[11px] font-mono text-white/40 uppercase tracking-widest text-right xl:text-left" style={{ fontFamily: "'VT323', monospace" }}>Fig 4. Onboarding Window (Step 2)</div>
    </div>
  );
};

const App = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=VT323&display=swap');
      body { margin: 0; padding: 0; }
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div
      className="min-h-screen w-full flex items-start justify-center p-12 overflow-y-auto"
      style={customStyles.body}
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-16 max-w-[1200px] w-full relative z-10 pb-20">

        <div className="space-y-12 flex flex-col items-center xl:items-end">
          <HeroPopupPanel />
          <LoadingStatePanel />
        </div>

        <div className="space-y-16 flex flex-col items-center xl:items-start relative z-20">
          <MenuBarDropdown />
          <OnboardingWindow />
        </div>

      </div>
    </div>
  );
};

export default App;