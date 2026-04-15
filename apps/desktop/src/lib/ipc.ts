export type CaptureSessionState =
  | 'idle'
  | 'region_offered'
  | 'listening'
  | 'submitting'
  | 'result'
  | 'error';

export type RendererVisualPayload =
  | { kind: 'svg'; svg: string }
  | { kind: 'image'; mimeType: string; base64: string }
  | { kind: 'mermaid'; source: string };

export interface PriorExplanationSummary {
  headline: string;
  body: string;
  analogy?: string;
  mechanics?: string[];
  firstPrinciple?: string;
  suggestedWikiNode?: string;
}

export interface ExplanationResponse {
  headline: string;
  withoutExample: string;
  withExample: string;
  mechanics: Array<{ num: string; text: string }>;
  firstPrinciple: string;
  targetNode: string;
  selection?: string;
  visual: RendererVisualPayload;
  priorExplanation: PriorExplanationSummary;
}

export interface ApiError {
  code: string;
  message: string;
  action?: string;
}

export interface GistConfig {
  setupComplete: boolean;
  wikiPath?: string;
  twitterHandle?: string;
  apiUrl?: string;
  apiToken?: string;
}

export const ERROR_MESSAGES: Record<string, { message: string; action?: string }> = {
  AUTH_FAILED: {
    message: 'Authentication failed. Please check your API credentials.',
    action: 'openPreferences',
  },
  WIKI_NOT_FOUND: {
    message: 'Wiki folder not found. Please reconnect your local wiki.',
    action: 'openPreferences',
  },
  NETWORK_ERROR: {
    message: 'Unable to reach The Gist server. Check your connection.',
    action: undefined,
  },
  CAPTURE_FAILED: {
    message: 'Failed to capture content. Please try again.',
    action: undefined,
  },
  TIMEOUT: {
    message: 'Request timed out. The server may be busy.',
    action: undefined,
  },
  UNKNOWN: {
    message: 'Something went wrong. Please try again.',
    action: undefined,
  },
};

declare global {
  interface Window {
    thegist?: {
      capture: {
        onStateChange: (callback: (event: unknown, state: CaptureSessionState) => void) => void;
        startSession: () => void;
        cancelSession: () => void;
      };
      explanation: {
        onResult: (callback: (event: unknown, result: ExplanationResponse) => void) => void;
        onError: (callback: (event: unknown, error: ApiError) => void) => void;
        onLoading: (callback: (event: unknown) => void) => void;
        addToWiki: (result: ExplanationResponse) => Promise<void>;
        followUp: (payload: {
          priorExplanation: PriorExplanationSummary;
          userQuestion: string;
        }) => Promise<{ ok: boolean; error?: string }>;
      };
      config: {
        get: () => Promise<GistConfig>;
        set: (config: Partial<GistConfig>) => Promise<void>;
        openFilePicker: () => Promise<string | null>;
      };
      window: {
        close: () => void;
        minimize: () => void;
        openPreferences: () => void;
      };
      system: {
        openAccessibilitySettings: () => Promise<void>;
        openScreenRecordingSettings: () => Promise<void>;
      };
      profile: {
        analyze: (twitterHandle: string) => Promise<{
          success: boolean;
          profile?: { handle: string; summary: string; interests: string[] };
          profilePath?: string;
          error?: string;
        }>;
      };
    };
  }
}

export {};
