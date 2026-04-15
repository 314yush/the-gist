import {
  authenticate,
  explanationRequestAbortSignal,
  explanationTimeoutError,
  requestExplanation,
} from '../lib/api';
import { getLocal, setLocal, setSession } from '../lib/storage';
import type { ContentScriptMessage } from '../lib/messages';

// --- Auth ---

async function ensureAuth(): Promise<void> {
  let installId = await getLocal('installId');
  if (!installId) {
    installId = crypto.randomUUID();
    await setLocal('installId', installId);
  }
  try {
    const { token } = await authenticate(installId);
    await setSession('authToken', token);
    console.log('[TheGist] Auth succeeded');
  } catch (e) {
    console.warn('[TheGist] Auth failed:', e);
  }
}

// --- Lifecycle ---

chrome.runtime.onInstalled.addListener(() => {
  console.log('[TheGist] Extension installed');

  chrome.contextMenus.create({
    id: 'thegist-explain',
    title: 'Explain with The Gist',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: 'thegist-explain-link',
    title: 'Explain this link',
    contexts: ['link'],
  });

  void ensureAuth();
});

chrome.runtime.onStartup.addListener(() => {
  void ensureAuth();
});

// --- Helper: send OPEN_OVERLAY to content script ---

async function sendOverlayMessage(tabId: number, msg: ContentScriptMessage) {
  try {
    await chrome.tabs.sendMessage(tabId, msg);
  } catch {
    console.warn('[TheGist] Could not send message to tab', tabId);
  }
}

// --- Context menu click ---

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  if (info.menuItemId === 'thegist-explain' && info.selectionText) {
    await sendOverlayMessage(tab.id, {
      type: 'OPEN_OVERLAY',
      text: info.selectionText,
    });
  } else if (info.menuItemId === 'thegist-explain-link' && info.linkUrl) {
    await sendOverlayMessage(tab.id, {
      type: 'OPEN_OVERLAY',
      text: info.linkUrl,
      url: info.linkUrl,
    });
  }
});

// --- Toolbar icon click / keyboard shortcut ---

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  let selection = '';
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString().trim() ?? '',
    });
    selection = results?.[0]?.result ?? '';
  } catch {
    // chrome:// pages or restricted tabs — fail silently
  }

  await sendOverlayMessage(tab.id, {
    type: 'OPEN_OVERLAY',
    text: selection,
  });
});

// --- Content script EXPLAIN_REQUEST handler ---

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'EXPLAIN_REQUEST') {
    handleExplainRequest(msg).then(sendResponse);
    return true; // async response
  }
});

/** SPAs / social feeds: `fetch()` returns a JS shell or “enable JavaScript”, not visible page text. */
const FETCH_HTML_BLOCKLIST = ['twitter.com', 'x.com', 'mobile.twitter.com', 't.co'];

function isFetchHtmlBlockedHost(hostname: string): boolean {
  const h = hostname.replace(/^www\./, '');
  return FETCH_HTML_BLOCKLIST.some((b) => h === b || h.endsWith(`.${b}`));
}

/**
 * When the user uses "Explain URL" (selection inside <a> or context menu on a link), we fetch
 * the destination page for static sites. SPAs/social (blocklist) still use selected text only —
 * fetch returns a JS shell, not visible content.
 */
function shouldFetchPageHtml(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    if (isFetchHtmlBlockedHost(u.hostname)) return false;
  } catch {
    return false;
  }
  return true;
}

async function handleExplainRequest(msg: { text: string; url?: string }) {
  const wiki = (await getLocal('wiki')) || '';
  const signal = explanationRequestAbortSignal();
  let content = msg.text;

  // If URL provided, optionally fetch page HTML (hyperlinked selection / "Explain this link").
  if (msg.url && shouldFetchPageHtml(msg.url)) {
    try {
      const res = await fetch(msg.url, { signal });
      const html = await res.text();
      content = extractTextFromHtml(html);
    } catch {
      if (signal.aborted) {
        return { success: false, error: explanationTimeoutError() };
      }
      content = msg.text;
    }
  }

  try {
    const result = await requestExplanation({ type: 'text', content }, wiki, undefined, signal);
    return { success: true, result };
  } catch (e) {
    return { success: false, error: e };
  }
}

/**
 * Extract readable text from HTML. No DOMParser in service worker,
 * so we use simple regex-based stripping.
 */
function extractTextFromHtml(html: string): string {
  let text = html;
  // Remove script, style, nav, header, footer blocks
  text = text.replace(/<(script|style|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Decode common HTML entities
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();
  // Truncate to ~5000 chars
  return text.slice(0, 5000);
}
