import { watch, readFile, appendFile, writeFile, access, constants } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { getConfig } from './store';

type WikiEventType = 'change' | 'error';

class WikiWatcher extends EventEmitter {
  private watcher: AsyncIterable<{ eventType: string; filename: string | null }> | null = null;
  private watchPath: string | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly debounceMs = 500;
  private abortController: AbortController | null = null;

  async start(): Promise<void> {
    const config = getConfig();
    if (!config.wikiPath) {
      return;
    }

    const wikiPath = config.wikiPath;
    if (!existsSync(wikiPath)) {
      this.emit('error', new Error(`Wiki file not found: ${wikiPath}`));
      return;
    }

    this.watchPath = wikiPath;
    this.abortController = new AbortController();

    try {
      this.watcher = watch(path.dirname(wikiPath), { signal: this.abortController.signal });
      this.watchLoop(path.basename(wikiPath));
    } catch (err) {
      this.emit('error', err);
    }
  }

  private async watchLoop(filename: string): Promise<void> {
    if (!this.watcher) return;

    try {
      for await (const event of this.watcher) {
        if (event.filename === filename) {
          this.debouncedEmit();
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      this.emit('error', err);
    }
  }

  private debouncedEmit(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.emit('change');
    }, this.debounceMs);
  }

  stop(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.watcher = null;
    this.watchPath = null;
  }

  restart(): Promise<void> {
    this.stop();
    return this.start();
  }
}

export const wikiWatcher = new WikiWatcher();

export async function readWiki(): Promise<string> {
  const config = getConfig();
  if (!config.wikiPath) {
    return '';
  }

  try {
    await access(config.wikiPath, constants.R_OK);
    const content = await readFile(config.wikiPath, 'utf-8');
    return content;
  } catch (err) {
    console.error('Failed to read wiki file:', err);
    return '';
  }
}

export async function appendToWiki(content: string, node?: string): Promise<boolean> {
  const config = getConfig();
  if (!config.wikiPath) {
    return false;
  }

  try {
    const formattedContent = node
      ? `\n\n## ${node}\n\n${content}`
      : `\n\n${content}`;
    
    await appendFile(config.wikiPath, formattedContent, 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to append to wiki:', err);
    return false;
  }
}

export async function readProfile(): Promise<string> {
  const config = getConfig();
  if (!config.profilePath) {
    return '';
  }

  try {
    await access(config.profilePath, constants.R_OK);
    const content = await readFile(config.profilePath, 'utf-8');
    return content;
  } catch (err) {
    console.error('Failed to read profile file:', err);
    return '';
  }
}

export async function saveProfile(markdown: string): Promise<string | null> {
  const config = getConfig();
  if (!config.wikiPath) {
    return null;
  }

  try {
    const wikiDir = path.dirname(config.wikiPath);
    const profilePath = path.join(wikiDir, 'thegist-profile.md');
    
    await writeFile(profilePath, markdown, 'utf-8');
    return profilePath;
  } catch (err) {
    console.error('Failed to save profile:', err);
    return null;
  }
}
