import { useEffect, useState, type MouseEvent } from 'react';
import { WebGLBackground, WebGLBackgroundReduced } from './components/WebGLBackground';
import { UIPanel } from './components/UIPanel';
import { FeatureCard } from './components/FeatureCard';
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion';
import { getChromeStoreUrl } from './lib/env';

function RegistrationMark({ className }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute h-3 w-3 ${className ?? ''}`} aria-hidden>
      <div className="absolute left-0 top-1.5 h-px w-full bg-white/65" />
      <div className="absolute left-1.5 top-0 h-full w-px bg-white/65" />
    </div>
  );
}

export default function App() {
  const reducedMotion = usePrefersReducedMotion();
  const storeUrl = getChromeStoreUrl();
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const onCta = (e: MouseEvent<HTMLAnchorElement>) => {
    if (storeUrl) return;
    e.preventDefault();
    setToast('Chrome Web Store link coming soon — add the extension here when it’s live.');
  };

  const ctaClass =
    'inline-flex w-fit items-center justify-center rounded px-10 py-5 text-[15px] font-medium text-darker transition-all duration-300 bg-gold hover:shadow-[0_0_20px_rgba(220,168,66,0.35)] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-darker';

  return (
    <div className="relative min-h-screen text-white">
      {reducedMotion ? <WebGLBackgroundReduced /> : <WebGLBackground />}

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 top-4 z-[1000] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded px-6 py-3 text-center text-[14px] font-medium text-darker shadow-lg sm:top-8 sm:px-8 sm:text-[15px] bg-gold"
        >
          {toast}
        </div>
      ) : null}

      <div className="relative z-[1] mx-auto flex min-h-screen w-full max-w-[min(1600px,calc(100%-1.5rem))] flex-col border-x border-white/10 sm:max-w-[min(1600px,calc(100%-4vw))]">
        <RegistrationMark className="-left-1.5 -top-1.5" />
        <RegistrationMark className="-right-1.5 -top-1.5 right-0 left-auto" />

        <header className="relative flex flex-col gap-6 border-b border-white/10 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-8 sm:py-8 lg:px-12 xl:px-16">
          <div className="flex min-w-0 flex-col gap-2">
            <span
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-terracotta sm:text-xs"
              aria-hidden
            >
              SYS.GIST.V1
            </span>
            <div className="flex min-w-0 items-center gap-2.5 font-serif text-xl font-medium italic tracking-tight sm:text-2xl">
              <img
                src="/favicon-32.png"
                alt=""
                width={40}
                height={40}
                className="h-9 w-9 shrink-0 rounded-xl border border-white/10 object-cover shadow-[0_0_0_1px_rgba(255,255,255,0.06)] sm:h-10 sm:w-10"
              />
              <span className="truncate">
                The <span className="text-terracotta">Gist</span>
              </span>
            </div>
          </div>

          <div
            className="flex shrink-0 flex-col gap-2 sm:items-end"
            role="status"
            aria-label="Data stream active, engaged online"
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-white/70 sm:justify-end sm:text-xs md:text-sm">
              <span aria-hidden>DATASTREAM ACTIVE</span>
              <span
                className="gist-status-dot inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta shadow-[0_0_10px_#BC5F40]"
                aria-hidden
              />
            </div>
            <div
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-terracotta sm:text-right sm:text-xs"
              aria-hidden
            >
              ENGAGED · ONLINE
            </div>
          </div>
        </header>

        <main>
          <section className="relative grid min-h-[80vh] items-center gap-12 px-4 py-12 sm:px-8 md:grid-cols-2 md:gap-16 md:px-12 md:py-24 lg:px-16">
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[min(800px,90vw)] w-[min(800px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-terracotta/15"
              aria-hidden
            />

            <div className="flex max-w-[600px] flex-col gap-8">
              <div className="flex items-center gap-4 font-mono text-base uppercase tracking-[0.12em] text-terracotta before:h-px before:w-8 before:bg-terracotta before:content-['']">
                // SELECT · CONTEXT · GIST
              </div>
              <h1 className="font-serif text-[clamp(2.25rem,5vw,4.5rem)] font-normal italic leading-[1.05] tracking-tight [text-shadow:0_0_20px_rgba(188,95,64,0.15),0_0_40px_rgba(255,255,255,0.05)]">
                One-click explanations personalized to your knowledge
              </h1>
              <p className="max-w-[480px] text-lg font-light leading-relaxed text-white/65">
                Select text, copy, or just click — The Gist explains it your way using your personal knowledge profile
                and interests. Stop tab-hopping; stay in the flow.
              </p>
              <a href={storeUrl || '#'} onClick={onCta} className={ctaClass}>
                Add the extension
              </a>
            </div>

            <div className="flex justify-center md:justify-end">
              <UIPanel />
            </div>
          </section>

          <section className="grid gap-8 border-t border-white/10 px-4 py-12 sm:px-8 md:grid-cols-3 md:gap-8 md:px-12 md:py-24 lg:px-16">
            <FeatureCard
              mod="[MOD_01]"
              label="PROFILE"
              icon={
                <svg viewBox="0 0 24 24" aria-hidden>
                  <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              }
              title="Your knowledge, first"
              description="Grounds every explanation in what you already know—your wiki and interests—so depth and vocabulary match you, not a generic audience."
            />
            <FeatureCard
              mod="[MOD_02]"
              label="CAPTURE"
              icon={
                <svg viewBox="0 0 24 24" aria-hidden>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              }
              title="Any page, one gesture"
              description="Highlight text, use the clipboard, or click the extension—capture from wherever you read without breaking focus."
            />
            <FeatureCard
              mod="[MOD_03]"
              label="OUTPUT"
              icon={
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                </svg>
              }
              title="Explain, visualize, follow up"
              description="Headlines, diagrams, analogies, and follow-ups in a single panel—so you understand the idea, not just the keywords."
            />
          </section>
        </main>

        <footer className="flex flex-col items-center gap-8 border-t border-white/10 bg-gradient-to-t from-terracotta/[0.05] to-transparent px-4 py-12 text-center sm:px-8 md:px-12 lg:px-16">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-terracotta/90" aria-hidden>
            SEQ. // 01
          </p>
          <p className="max-w-md font-mono text-sm leading-relaxed text-white/65">
            Your knowledge profile stays yours. We don’t monetize your reading list.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
            <a href={storeUrl || '#'} onClick={onCta} className={ctaClass}>
              Add the extension
            </a>
            <a
              href="/privacy"
              className="font-mono text-sm text-gold/90 underline decoration-gold/35 underline-offset-4 transition hover:text-gold"
            >
              Privacy policy
            </a>
          </div>
        </footer>

        <RegistrationMark className="-bottom-1.5 -left-1.5 bottom-0 top-auto" />
        <RegistrationMark className="-bottom-1.5 -right-1.5 bottom-0 left-auto right-0 top-auto" />
      </div>
    </div>
  );
}
