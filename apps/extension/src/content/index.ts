/**
 * TheGist Content Script
 * Detects text selection, shows floating "Explain" pill, manages overlay iframe.
 * Uses Shadow DOM for style isolation from host page.
 */

import type { ContentScriptMessage } from '../lib/messages';

// --- Shadow host for pill (isolates from page CSS) ---

let shadowHost: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let pill: HTMLElement | null = null;
let pillClickHandler: (() => void) | null = null;

function ensurePill(): HTMLElement {
  if (pill && shadowHost) return pill;

  shadowHost = document.createElement('div');
  shadowHost.id = 'thegist-host';
  shadowHost.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;z-index:2147483646;pointer-events:none;';
  shadowRoot = shadowHost.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = `
    #thegist-pill {
      position: fixed;
      z-index: 2147483646;
      padding: 4px 12px;
      background: #DCA842;
      color: #0f0e0d;
      font-family: monospace;
      font-size: 14px;
      font-weight: bold;
      line-height: 1;
      border-radius: 999px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      user-select: none;
      white-space: nowrap;
      opacity: 0;
      transform: translateY(4px);
      transition: opacity 0.15s ease, transform 0.15s ease;
      pointer-events: none;
    }
    #thegist-pill.visible {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }
    #thegist-pill:hover {
      filter: brightness(1.1);
    }
  `;
  shadowRoot.appendChild(style);

  pill = document.createElement('div');
  pill.id = 'thegist-pill';
  pill.textContent = '\u2726 Explain';
  pill.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    hidePill();
    if (pillClickHandler) {
      pillClickHandler();
    } else {
      const sel = window.getSelection()?.toString().trim();
      if (sel) triggerExplain(sel);
    }
  });
  shadowRoot.appendChild(pill);

  document.documentElement.appendChild(shadowHost);
  return pill;
}

function showPill(x: number, y: number, label?: string) {
  const el = ensurePill();
  el.textContent = label ?? '\u2726 Explain';
  // Clamp to viewport (fixed positioning = viewport coords directly)
  const vw = window.innerWidth;
  const pillWidth = 90;
  const left = Math.min(x, vw - pillWidth - 8);
  const top = Math.max(y, 8);
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
  // Force reflow then add class for animation
  void el.offsetWidth;
  el.classList.add('visible');
}

function hidePill() {
  if (pill) {
    pill.classList.remove('visible');
  }
  pillClickHandler = null;
}

// --- Selection listeners ---

document.addEventListener('mouseup', () => {
  setTimeout(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      hidePill();
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const text = sel.toString().trim();
    const url = getSelectedUrl();

    if (url) {
      pillClickHandler = () => openOverlay(text, url);
      showPill(rect.right + 8, rect.top - 32, '\u2726 Explain URL');
    } else {
      pillClickHandler = null;
      showPill(rect.right + 8, rect.top - 32);
    }
  }, 10);
});

document.addEventListener('mousedown', (e) => {
  // Hide pill if click is outside the shadow host
  if (shadowHost && shadowHost.contains(e.target as Node)) return;
  hidePill();
});

// --- Message listener: background → content script ---

chrome.runtime.onMessage.addListener((msg: ContentScriptMessage) => {
  if (msg.type === 'OPEN_OVERLAY') {
    hidePill();
    openOverlay(msg.text, msg.url);
  }
});

// --- URL / Link detection ---

function getSelectedUrl(): string | undefined {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) return;

  const text = sel.toString().trim();

  if (/^https?:\/\/\S+$/.test(text)) return text;

  const anchor = sel.anchorNode?.parentElement?.closest('a');
  if (anchor?.href) return anchor.href;

  const focus = sel.focusNode?.parentElement?.closest('a');
  if (focus?.href) return focus.href;

  return undefined;
}

// --- Trigger explain ---

function triggerExplain(text: string) {
  const url = getSelectedUrl();
  openOverlay(text, url);
}

// --- Overlay lifecycle ---

function openOverlay(text: string, url?: string) {
  // If overlay already exists, close it first then open new one
  const existing = document.getElementById('thegist-overlay');
  if (existing) {
    existing.remove();
  }

  const container = document.createElement('div');
  container.id = 'thegist-overlay';

  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('src/overlay/index.html');
  iframe.allow = '';
  container.appendChild(iframe);
  document.documentElement.appendChild(container);

  requestAnimationFrame(() => {
    container.classList.add('thegist-open');
  });

  iframe.addEventListener('load', () => {
    if (!text) {
      // No text selected — show guidance in overlay
      iframe.contentWindow?.postMessage({ type: 'EXPLAIN_START' }, '*');
      return;
    }

    iframe.contentWindow?.postMessage({ type: 'EXPLAIN_START', text }, '*');

    chrome.runtime.sendMessage({ type: 'EXPLAIN_REQUEST', text, url }, (response) => {
      if (chrome.runtime.lastError) {
        iframe.contentWindow?.postMessage(
          { type: 'EXPLAIN_ERROR', error: { code: 'runtime_error', message: chrome.runtime.lastError.message, userMessage: 'Could not connect to extension.' } },
          '*',
        );
        return;
      }
      if (response?.success) {
        iframe.contentWindow?.postMessage({ type: 'EXPLAIN_RESULT', result: response.result }, '*');
      } else {
        iframe.contentWindow?.postMessage(
          { type: 'EXPLAIN_ERROR', error: response?.error || { code: 'unknown', message: 'Unknown error', userMessage: 'Something went wrong.' } },
          '*',
        );
      }
    });
  });

  function messageHandler(e: MessageEvent) {
    if (e.data?.type === 'CLOSE_OVERLAY') {
      closeOverlay();
      window.removeEventListener('message', messageHandler);
    }
  }
  window.addEventListener('message', messageHandler);

  function escHandler(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      closeOverlay();
      document.removeEventListener('keydown', escHandler);
    }
  }
  document.addEventListener('keydown', escHandler);
}

function closeOverlay() {
  const el = document.getElementById('thegist-overlay');
  if (!el) return;
  el.classList.remove('thegist-open');
  el.addEventListener('transitionend', () => el.remove(), { once: true });
}
