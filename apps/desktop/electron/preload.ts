import { contextBridge, ipcRenderer } from 'electron';
import type { CaptureSessionState } from '@thegist/shared';

type RendererVisualPayload =
  | { kind: 'svg'; svg: string }
  | { kind: 'image'; mimeType: string; base64: string }
  | { kind: 'mermaid'; source: string };

interface PriorExplanationSummary {
  headline: string;
  body: string;
  analogy?: string;
  mechanics?: string[];
  firstPrinciple?: string;
  suggestedWikiNode?: string;
}

// Match the existing renderer's expected ExplanationResponse shape
interface RendererExplanationResponse {
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

interface RendererApiError {
  code: string;
  message: string;
  action?: string;
}

interface RendererConfig {
  setupComplete: boolean;
  wikiPath?: string;
  twitterHandle?: string;
  apiUrl?: string;
  apiToken?: string;
}

// API shape expected by existing renderer (src/lib/ipc.ts)
const thegistAPI = {
  capture: {
    onStateChange: (callback: (event: unknown, state: CaptureSessionState) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, state: CaptureSessionState) => {
        callback(_event, state);
      };
      ipcRenderer.on('capture:state-change', handler);
    },
    startSession: () => ipcRenderer.invoke('capture:start'),
    cancelSession: () => ipcRenderer.invoke('capture:cancel'),
  },
  explanation: {
    onResult: (callback: (event: unknown, result: RendererExplanationResponse) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, result: RendererExplanationResponse) => {
        callback(_event, result);
      };
      ipcRenderer.on('explanation:result', handler);
    },
    onError: (callback: (event: unknown, error: RendererApiError) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, error: RendererApiError) => {
        callback(_event, error);
      };
      ipcRenderer.on('explanation:error', handler);
    },
    onLoading: (callback: (event: unknown) => void) => {
      const handler = () => {
        callback(null);
      };
      ipcRenderer.on('explanation:loading', handler);
    },
    addToWiki: (result: RendererExplanationResponse) => 
      ipcRenderer.invoke('wiki:append', { 
        content: `## ${result.headline}\n\n${result.firstPrinciple}`, 
        node: result.targetNode 
      }),
    followUp: (payload: {
      priorExplanation: PriorExplanationSummary;
      userQuestion: string;
    }): Promise<{ ok: boolean; error?: string }> =>
      ipcRenderer.invoke('explanation:follow-up', payload),
  },
  config: {
    get: (): Promise<RendererConfig> => ipcRenderer.invoke('config:get'),
    set: (config: Partial<RendererConfig>) => ipcRenderer.invoke('config:set', config),
    openFilePicker: (): Promise<string | null> => ipcRenderer.invoke('config:file-picker'),
  },
  profile: {
    analyze: (twitterHandle: string): Promise<{
      success: boolean;
      profile?: { handle: string; summary: string; interests: string[] };
      profilePath?: string;
      error?: string;
    }> => ipcRenderer.invoke('profile:analyze', twitterHandle),
  },
  window: {
    close: () => ipcRenderer.invoke('app:hide'),
    minimize: () => ipcRenderer.invoke('app:hide'),
    openPreferences: () => ipcRenderer.invoke('preferences:open'),
  },
  system: {
    openAccessibilitySettings: () => ipcRenderer.invoke('system:open-accessibility'),
    openScreenRecordingSettings: () => ipcRenderer.invoke('system:open-screen-recording'),
  },
};

contextBridge.exposeInMainWorld('thegist', thegistAPI);

export type TheGistAPI = typeof thegistAPI;
