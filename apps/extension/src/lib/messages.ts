import type { ExplanationResponse, ApiError } from '@thegist/shared';

/** Content script → Background (via chrome.runtime.sendMessage) */
export type BackgroundMessage = {
  type: 'EXPLAIN_REQUEST';
  text: string;
  url?: string;
};

/** Content script → Overlay iframe (via postMessage) */
export type OverlayInbound =
  | { type: 'EXPLAIN_START'; text?: string }
  | { type: 'EXPLAIN_RESULT'; result: ExplanationResponse }
  | { type: 'EXPLAIN_ERROR'; error: ApiError };

/** Overlay iframe → Content script (via postMessage) */
export type OverlayOutbound = { type: 'CLOSE_OVERLAY' };

/** Background → Content script (via chrome.tabs.sendMessage) */
export type ContentScriptMessage = { type: 'OPEN_OVERLAY'; text: string; url?: string };
