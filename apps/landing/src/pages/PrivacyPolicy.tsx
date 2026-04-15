const SITE_ORIGIN = 'https://whatsthegist.xyz';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-darker text-white">
      <header className="border-b border-white/10 px-4 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <a href="/" className="flex items-center gap-2.5 font-serif text-lg font-medium italic tracking-tight">
            <img
              src="/favicon-32.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-xl border border-white/10 object-cover"
            />
            <span>
              The <span className="text-terracotta">Gist</span>
            </span>
          </a>
          <a
            href="/"
            className="font-mono text-sm text-gold/90 underline decoration-gold/40 underline-offset-4 transition hover:text-gold"
          >
            ← Back to home
          </a>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-4 py-12 sm:px-8 lg:px-12 lg:py-16">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-terracotta">Legal</p>
        <h1 className="mt-2 font-serif text-3xl font-medium italic tracking-tight sm:text-4xl">Privacy Policy</h1>
        <p className="mt-4 text-sm text-white/55">Last updated: April 15, 2026</p>

        <div className="mt-12 space-y-10 text-[15px] leading-relaxed text-white/80">
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-medium text-cream">Overview</h2>
            <p>
              This Privacy Policy describes how The Gist (“we,” “us”) handles information when you use our browser
              extension, this website ({SITE_ORIGIN}), and our backend APIs that power explanations. We built The Gist
              to explain text you choose on the web in a way that matches your background—not to track your browsing.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-medium text-cream">Information we process</h2>
            <ul className="list-disc space-y-2 pl-5 marker:text-terracotta/80">
              <li>
                <strong className="font-medium text-white/90">Content you send for explanations.</strong> When you
                select text, paste content, submit a link, or otherwise ask for an explanation, that content is sent to
                our servers (and, as described below, to our AI provider) so we can return an explanation. If you
                include images in a request, image data may be processed the same way.
              </li>
              <li>
                <strong className="font-medium text-white/90">Personalization (“wiki”) and onboarding.</strong> If you
                provide a knowledge profile, onboarding answers, an optional social handle for profile enrichment, or
                similar inputs, we process that information to personalize explanations and generate or update your wiki.
              </li>
              <li>
                <strong className="font-medium text-white/90">Technical identifiers.</strong> We may assign a random
                install identifier to your extension installation and issue session tokens so our API can authenticate
                requests. Standard server logs may include timestamps, request metadata, and IP addresses.
              </li>
              <li>
                <strong className="font-medium text-white/90">Locally on your device.</strong> The extension may store
                items such as your wiki text, API endpoint preference, onboarding state, and session data in Chrome
                storage. This stays on your device except when you choose to send content to our API.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-medium text-cream">How we use information</h2>
            <p>We use the information above to:</p>
            <ul className="list-disc space-y-2 pl-5 marker:text-terracotta/80">
              <li>Provide, operate, and improve explanations and personalization;</li>
              <li>Authenticate and secure our services;</li>
              <li>Diagnose errors and abuse, and enforce our terms and policies.</li>
            </ul>
            <p>
              We do not sell your personal information. We do not use your data to determine creditworthiness or for
              lending purposes. We do not use or transfer your data for purposes unrelated to providing The Gist.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-medium text-cream">AI processing and subprocessors</h2>
            <p>
              Explanations are generated using AI models accessed through{' '}
              <a
                href="https://openrouter.ai/"
                className="text-gold underline decoration-gold/35 underline-offset-2 hover:decoration-gold"
                target="_blank"
                rel="noopener noreferrer"
              >
                OpenRouter
              </a>
              . When we send a request, OpenRouter and the underlying model provider may process the prompt (including
              your selected text and personalization context) under their terms and privacy policies. We configure
              requests for explanation only—not for unrelated advertising profiling through these vendors.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-medium text-cream">Retention</h2>
            <p>
              We retain information only as long as needed to operate the service, comply with law, resolve disputes,
              and enforce our agreements. Server log retention follows our infrastructure defaults unless a longer period
              is required. You may remove locally stored data by clearing the extension’s storage or uninstalling the
              extension.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-medium text-cream">Security</h2>
            <p>
              We use industry-standard measures appropriate to the nature of the service. No method of transmission or
              storage is completely secure; we cannot guarantee absolute security.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-medium text-cream">Children</h2>
            <p>
              The Gist is not directed at children under 13 (or the age required in your jurisdiction). We do not
              knowingly collect personal information from children.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-medium text-cream">International users</h2>
            <p>
              If you access the service from outside the United States, your information may be processed in the United
              States or other countries where we or our vendors operate.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-medium text-cream">Changes</h2>
            <p>
              We may update this policy from time to time. We will post the updated version on this page and update the
              “Last updated” date above. Continued use after changes means you accept the revised policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-medium text-cream">Contact</h2>
            <p>
              Questions about this policy:{' '}
              <a
                href="mailto:privacy@whatsthegist.xyz"
                className="text-gold underline decoration-gold/35 underline-offset-2 hover:decoration-gold"
              >
                privacy@whatsthegist.xyz
              </a>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/10 px-4 py-8 text-center sm:px-8">
        <p className="font-mono text-xs text-white/45">© {new Date().getFullYear()} The Gist</p>
      </footer>
    </div>
  );
}
