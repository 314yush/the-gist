import { spawn } from 'node:child_process';
import { readFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { clipboard } from 'electron';
import type { CaptureSessionState, CaptureResult } from '@thegist/shared';
import { CLIPBOARD_LISTEN_TIMEOUT_MS } from '@thegist/shared';
import { fetchUrlContent } from './api';

const CLIPBOARD_POLL_INTERVAL = 200;

/** GUI-launched Electron often has a minimal PATH; screencapture lives in /usr/sbin. */
const SCREEN_CAPTURE_CMD =
  process.platform === 'darwin' ? '/usr/sbin/screencapture' : 'screencapture';

/** screencapture can exit before the PNG is visible on disk; avoid false "cancel" → listening. */
async function waitForFileExists(
  filePath: string,
  maxMs = 2000,
  interval = 40
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    if (existsSync(filePath)) return true;
    await new Promise((r) => setTimeout(r, interval));
  }
  return existsSync(filePath);
}

interface ClipboardBaseline {
  text: string;
  imageHash: string;
}

type StateChangeCallback = (state: CaptureSessionState) => void;
type ResultCallback = (result: CaptureResult) => void;
type ErrorCallback = (error: Error) => void;

class CaptureSession {
  private state: CaptureSessionState = 'idle';
  private baseline: ClipboardBaseline | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private timeoutTimer: NodeJS.Timeout | null = null;
  private onStateChange: StateChangeCallback | null = null;
  private onResult: ResultCallback | null = null;
  private onError: ErrorCallback | null = null;

  getState(): CaptureSessionState {
    return this.state;
  }

  setCallbacks(
    onStateChange: StateChangeCallback,
    onResult: ResultCallback,
    onError: ErrorCallback
  ): void {
    this.onStateChange = onStateChange;
    this.onResult = onResult;
    this.onError = onError;
  }

  private setState(newState: CaptureSessionState): void {
    this.state = newState;
    this.onStateChange?.(newState);
  }

  private getImageHash(image: Electron.NativeImage): string {
    if (image.isEmpty()) return '';
    const buffer = image.toPNG();
    let hash = 0;
    for (let i = 0; i < Math.min(buffer.length, 1000); i++) {
      hash = ((hash << 5) - hash) + buffer[i];
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private captureBaseline(): void {
    const text = clipboard.readText();
    const image = clipboard.readImage();
    this.baseline = {
      text,
      imageHash: this.getImageHash(image),
    };
  }

  async start(): Promise<void> {
    if (this.state !== 'idle') {
      this.cancel();
    }

    this.captureBaseline();
    this.setState('region_offered');
    
    try {
      const capturePath = path.join(tmpdir(), `thegist-capture-${Date.now()}.png`);
      const { fileReady, exitCode } = await this.runScreenCapture(capturePath);

      if (fileReady) {
        this.setState('submitting');
        const result = await this.readCapturedImage(capturePath);
        this.onResult?.(result);
        this.setState('result');
      } else {
        // macOS often updates the pasteboard shortly after exit; success (code 0) with no file needs a longer wait.
        const clipboardWaitMs = exitCode === 0 ? 2000 : 300;
        const gotImage = await this.waitForNewClipboardImage(clipboardWaitMs);
        if (gotImage) {
          this.setState('submitting');
          const img = clipboard.readImage();
          const base64 = img.toPNG().toString('base64');
          this.onResult?.({
            type: 'image',
            content: base64,
          });
          this.setState('result');
        } else {
          this.startClipboardListening();
        }
      }
    } catch (err) {
      this.onError?.(err instanceof Error ? err : new Error(String(err)));
      this.setState('error');
    }
  }

  /** Poll for a new clipboard image vs baseline (pasteboard often lags behind screencapture exit). */
  private async waitForNewClipboardImage(maxMs: number): Promise<boolean> {
    if (!this.baseline) return false;
    const start = Date.now();
    const interval = 80;
    while (Date.now() - start < maxMs) {
      const img = clipboard.readImage();
      if (!img.isEmpty() && this.getImageHash(img) !== this.baseline.imageHash) {
        return true;
      }
      await new Promise((r) => setTimeout(r, interval));
    }
    return false;
  }

  private runScreenCapture(
    capturePath: string
  ): Promise<{ fileReady: boolean; exitCode: number | null }> {
    return new Promise((resolve) => {
      if (existsSync(capturePath)) {
        unlink(capturePath).catch(() => {});
      }

      const proc = spawn(SCREEN_CAPTURE_CMD, ['-i', '-x', '-t', 'png', capturePath], {
        env: {
          ...process.env,
          PATH: `/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin:${process.env.PATH ?? ''}`,
        },
      });

      proc.on('close', async (code) => {
        const exitCode = typeof code === 'number' ? code : -1;
        if (exitCode !== 0) {
          resolve({ fileReady: false, exitCode });
          return;
        }
        const onDisk = await waitForFileExists(capturePath);
        resolve({ fileReady: onDisk, exitCode: 0 });
      });

      proc.on('error', (err) => {
        console.error('screencapture failed:', err);
        resolve({ fileReady: false, exitCode: null });
      });
    });
  }

  private async readCapturedImage(capturePath: string): Promise<CaptureResult> {
    const buffer = await readFile(capturePath);
    const base64 = buffer.toString('base64');

    await unlink(capturePath).catch(() => {});
    
    return {
      type: 'image',
      content: base64,
    };
  }

  private startClipboardListening(): void {
    this.setState('listening');
    
    this.pollTimer = setInterval(() => {
      this.checkClipboard();
    }, CLIPBOARD_POLL_INTERVAL);

    this.timeoutTimer = setTimeout(() => {
      this.stopClipboardListening();
      this.setState('idle');
    }, CLIPBOARD_LISTEN_TIMEOUT_MS);
  }

  private stopClipboardListening(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }

  private async checkClipboard(): Promise<void> {
    if (!this.baseline) return;

    const currentText = clipboard.readText();
    const currentImage = clipboard.readImage();
    const currentImageHash = this.getImageHash(currentImage);

    // Check for new image
    if (currentImageHash !== this.baseline.imageHash && !currentImage.isEmpty()) {
      this.stopClipboardListening();
      this.setState('submitting');
      
      const base64 = currentImage.toPNG().toString('base64');
      this.onResult?.({
        type: 'image',
        content: base64,
      });
      this.setState('result');
      return;
    }

    // Check for new text
    if (currentText !== this.baseline.text && currentText.trim()) {
      this.stopClipboardListening();
      this.setState('submitting');

      const result = await this.normalizeTextInput(currentText.trim());
      this.onResult?.(result);
      this.setState('result');
    }
  }

  private async normalizeTextInput(text: string): Promise<CaptureResult> {
    // Check if it's a URL
    const urlPattern = /^https?:\/\/[^\s]+$/i;
    if (urlPattern.test(text)) {
      try {
        const content = await fetchUrlContent(text);
        return {
          type: 'url',
          content,
          url: text,
        };
      } catch {
        // If fetch fails, treat as plain URL text
        return {
          type: 'url',
          content: text,
          url: text,
        };
      }
    }

    return {
      type: 'text',
      content: text,
    };
  }

  cancel(): void {
    this.stopClipboardListening();
    this.baseline = null;
    this.setState('idle');
  }

  async submitManual(result: CaptureResult): Promise<void> {
    this.stopClipboardListening();
    this.setState('submitting');
    this.onResult?.(result);
    this.setState('result');
  }
}

export const captureSession = new CaptureSession();
