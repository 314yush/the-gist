// ============ API Request/Response Types ============

export type InputType = 'text' | 'image' | 'url';

export interface ExplanationInput {
  type: InputType;
  content: string;
  url?: string;
}

export interface ExplanationContext {
  wiki: string;
  twitterHandle?: string;
}

export interface ExplanationRequest {
  input: ExplanationInput;
  context: ExplanationContext;
  followUp?: ExplanationFollowUp;
}

export interface PriorExplanationSummary {
  headline: string;
  body: string;
  analogy?: string;
  mechanics?: string[];
  firstPrinciple?: string;
  suggestedWikiNode?: string;
}

export interface ExplanationFollowUp {
  priorExplanation: PriorExplanationSummary;
  userQuestion: string;
}

export type VisualModality = 'svg' | 'raster' | 'mermaid';

export interface Explanation {
  headline: string;
  body: string;
  analogy?: string;
  mechanics?: string[];
  firstPrinciple?: string;
  suggestedWikiNode?: string;
  visualModality: VisualModality;
  svgMarkup: string;
  mermaidSource: string;
  rasterPrompt: string;
}

export type ExplanationVisual =
  | { kind: 'svg'; svg: string }
  | { kind: 'image'; mimeType: string; base64: string }
  | { kind: 'mermaid'; source: string };

export interface ExplanationResponse {
  explanation: Explanation;
  visual: ExplanationVisual;
}

export interface ApiError {
  code: string;
  message: string;
  userMessage: string;
}

// ============ Auth Types ============

export interface AuthTokenRequest {
  email?: string;
  inviteCode?: string;
}

export interface AuthTokenResponse {
  token: string;
  expiresAt: string;
}

// ============ Profile Types ============

export interface UserProfile {
  handle: string;
  analyzedAt: string;
  summary: string;
  interests: string[];
  expertise: string[];
  communicationStyle: string;
  recentTopics: string[];
  keywords: string[];
  preferredAnalogies: string[];
}

export interface ProfileAnalyzeRequest {
  twitterHandle: string;
}

export interface ProfileAnalyzeResponse {
  profile: UserProfile;
  markdown: string;
}

// ============ Wiki Generation Types ============

export interface GenerateWikiRequest {
  answers: Record<string, string>;
  twitterProfile?: UserProfile;
}

export interface GenerateWikiResponse {
  wiki: string;
}

// ============ Config Types (Desktop) ============

export interface GistConfig {
  apiUrl: string;
  apiToken?: string;
  wikiPath?: string;
  profilePath?: string;
  twitterHandle?: string;
  hotkey: string;
  setupComplete: boolean;
}

/** @deprecated Use GistConfig instead */
export type LuminaConfig = GistConfig;

export const DEFAULT_CONFIG: GistConfig = {
  apiUrl: 'http://localhost:3000',
  hotkey: 'CommandOrControl+Shift+L',
  setupComplete: false,
};

/** Clipboard listening phase after user skips region capture; must match renderer HUD. */
export const CLIPBOARD_LISTEN_TIMEOUT_MS = 15000;

// ============ IPC Channel Types ============

export type CaptureSessionState =
  | 'idle'
  | 'region_offered'
  | 'listening'
  | 'submitting'
  | 'result'
  | 'error';

export interface CaptureResult {
  type: InputType;
  content: string;
  url?: string;
}

export interface IpcChannels {
  // Main -> Renderer
  'capture:state-change': CaptureSessionState;
  'capture:result': CaptureResult;
  'explanation:loading': void;
  'explanation:result': ExplanationResponse;
  'explanation:error': ApiError;
  'config:updated': GistConfig;

  // Renderer -> Main
  'capture:start': void;
  'capture:cancel': void;
  'capture:submit': CaptureResult;
  'config:get': void;
  'config:set': Partial<GistConfig>;
  'wiki:read': void;
  'wiki:append': { content: string; node?: string };
  'preferences:open': void;
  'app:quit': void;
}

// ============ Error Codes ============

export const ERROR_CODES = {
  AUTH_INVALID: 'auth_invalid',
  AUTH_EXPIRED: 'auth_expired',
  RATE_LIMITED: 'rate_limited',
  NETWORK_ERROR: 'network_error',
  SERVER_ERROR: 'server_error',
  INVALID_INPUT: 'invalid_input',
  REQUEST_TIMEOUT: 'request_timeout',
} as const;

export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.AUTH_INVALID]: 'Your token is invalid. Please re-enter it in Preferences.',
  [ERROR_CODES.AUTH_EXPIRED]: 'Your session has expired. Please re-authenticate in Preferences.',
  [ERROR_CODES.RATE_LIMITED]: 'Rate limit reached. Please try again in a moment.',
  [ERROR_CODES.NETWORK_ERROR]: "Can't reach The Gist servers. Check your internet connection.",
  [ERROR_CODES.SERVER_ERROR]: 'Something went wrong on our end. Please try again.',
  [ERROR_CODES.INVALID_INPUT]: 'Invalid input. Please try a different selection.',
  [ERROR_CODES.REQUEST_TIMEOUT]:
    'This took longer than 30 seconds. Try again, or use a shorter selection or a different page.',
};
