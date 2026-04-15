/**
 * Decorative mock of the extension panel — selected passage → explanation card.
 */
export function UIPanel() {
  return (
    <div
      className="relative w-full max-w-[480px] overflow-hidden rounded-[14px] border border-white/10 bg-dark/95 shadow-[0_24px_64px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-[20px] transition-transform duration-500 [transform:perspective(1000px)_rotateY(-5deg)_rotateX(2deg)] hover:[transform:perspective(1000px)_rotateY(0)_rotateX(0)] max-md:[transform:none] max-md:hover:[transform:none]"
      style={{ backgroundColor: 'rgba(28, 26, 25, 0.92)' }}
    >
      <div
        className="pointer-events-none absolute -inset-1/2 z-[-1] opacity-50"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(188, 95, 64, 0.45) 0%, transparent 55%)',
        }}
        aria-hidden
      />

      <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-4 py-3">
        <div className="flex items-center gap-2 font-mono text-sm text-white/65">
          <img
            src="/favicon-32.png"
            alt=""
            width={16}
            height={16}
            className="h-4 w-4 shrink-0 rounded object-cover"
          />
          THE GIST
        </div>
        <div className="flex gap-1.5" aria-hidden>
          <span className="inline-block h-2 w-2 rounded-full bg-white/10" />
          <span className="inline-block h-2 w-2 rounded-full bg-white/10" />
          <span className="inline-block h-2 w-2 rounded-full bg-white/65" />
        </div>
      </div>

      <div
        className="flex flex-col gap-6 bg-[length:20px_20px] bg-[position:center_top] p-6"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
        }}
      >
        <div className="flex flex-col gap-2">
          <div className="font-mono text-xs tracking-wide text-terracotta">// INPUT · SELECTED TEXT</div>
          <div className="rounded-md border border-white/10 border-l-2 border-l-terracotta bg-white/[0.03] p-4 text-[0.9rem] text-white/65">
            “…recent work on <span className="text-white">context-aware explanations</span> means the model can
            ground answers in what you already know…”
          </div>
        </div>

        <div className="relative mt-1">
          <div className="mb-2 font-mono text-xs tracking-wide text-terracotta">// OUTPUT · YOUR GIST</div>
          <h3 className="mb-3 font-serif text-2xl font-normal italic leading-snug tracking-tight text-[#EAE6DF]">
            Context-aware explanations
          </h3>
          <p className="text-[0.85rem] leading-relaxed text-white/65">
            Answers are tuned to your personal knowledge profile—not generic web summaries—so jargon and depth match
            how you actually think.
          </p>

          <div className="relative mt-6 flex h-[100px] items-center justify-center overflow-hidden rounded-md border border-dashed border-white/20">
            <div
              className="absolute h-px w-full bg-gradient-to-r from-transparent via-terracotta to-transparent"
              aria-hidden
            />
            <div
              className="gist-diagram-shape h-10 w-10 rotate-45 border border-terracotta shadow-[0_0_15px_rgba(188,95,64,0.5),inset_0_0_10px_rgba(188,95,64,0.5)]"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </div>
  );
}
