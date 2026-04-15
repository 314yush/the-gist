import './load-env';
import {
  app,
  BrowserWindow,
  globalShortcut,
  Tray,
  Menu,
  ipcMain,
  screen,
  nativeImage,
  dialog,
  shell,
} from 'electron';
import path from 'node:path';
import type {
  CaptureResult,
  GistConfig,
  CaptureSessionState,
  ExplanationResponse,
  PriorExplanationSummary,
} from '@thegist/shared';
import { getConfig, setConfig } from './store';
import { captureSession } from './capture';
import { readWiki, readProfile, appendToWiki, saveProfile, wikiWatcher } from './wiki';
import { explain, analyzeTwitterProfile } from './api';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

type WindowLayout = 'compact' | 'panel' | 'onboarding';

function getLiveMainWindow(): BrowserWindow | null {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow;
  }
  return null;
}

/** Recreate the window if the user closed it (traffic lights / Cmd+W) but the app still runs. */
function ensureMainWindow(): BrowserWindow {
  const live = getLiveMainWindow();
  if (live) {
    return live;
  }
  mainWindow = createWindow();
  return mainWindow;
}

/** Last capture + wiki context for explanation follow-ups */
interface LastExplanationContext {
  result: CaptureResult;
  combinedWiki: string;
  twitter?: string;
  selection?: string;
}

let lastExplanationContext: LastExplanationContext | null = null;

const isDev = !app.isPackaged;

// Parse dev server URL from command line args
function getDevServerUrl(): string {
  const args = process.argv;
  const urlIndex = args.indexOf('--dev-server-url');
  if (urlIndex !== -1 && args[urlIndex + 1]) {
    return args[urlIndex + 1];
  }
  return 'http://localhost:5173';
}

function getIconPath(): string {
  if (isDev) {
    return path.join(__dirname, '../assets/tray-icon.png');
  }
  return path.join(process.resourcesPath, 'assets/tray-icon.png');
}

function applyWindowLayout(win: BrowserWindow, layout: WindowLayout): void {
  switch (layout) {
    case 'onboarding':
      win.setMinimumSize(600, 400);
      win.setSize(750, 580);
      break;
    case 'compact':
      win.setMinimumSize(360, 200);
      win.setSize(400, 240);
      break;
    case 'panel':
      win.setMinimumSize(380, 400);
      win.setSize(540, 620);
      break;
    default:
      break;
  }
}

/** After first-run setup: menu-bar style chrome (smaller mins, hide from Dock/taskbar). */
function applyTrayWindowChrome(win: BrowserWindow): void {
  win.setAlwaysOnTop(true);
  if (process.platform === 'darwin' || process.platform === 'win32') {
    win.setSkipTaskbar(true);
  }
  applyWindowLayout(win, 'panel');
}

function positionWindowNearTray(win: BrowserWindow): void {
  const trayBounds = tray?.getBounds() ?? { x: 0, y: 0, width: 48, height: 22 };
  const display = screen.getDisplayNearestPoint({
    x: trayBounds.x + trayBounds.width / 2,
    y: trayBounds.y + trayBounds.height / 2,
  });
  const { x: wx, y: wy, width: dw, height: dh } = display.workArea;
  const bounds = win.getBounds();
  let x = Math.round(trayBounds.x + trayBounds.width / 2 - bounds.width / 2);
  let y = Math.round(trayBounds.y + trayBounds.height + 6);
  if (y + bounds.height > wy + dh) {
    y = Math.round(trayBounds.y - bounds.height - 6);
  }
  x = Math.max(wx, Math.min(x, wx + dw - bounds.width));
  y = Math.max(wy, Math.min(y, wy + dh - bounds.height));
  win.setPosition(x, y);
}

function showWindowCentered(): void {
  const win = ensureMainWindow();
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;
  const { x: wx, y: wy } = display.workArea;
  const bounds = win.getBounds();
  const x = wx + Math.max(0, (width - bounds.width) / 2);
  const y = wy + Math.max(0, (height - bounds.height) / 2);
  win.setPosition(Math.round(x), Math.round(y));
  win.show();
  win.focus();
}

/** Tray popover positioning (not cursor-centered). */
function showWindowNearTray(layout: WindowLayout = 'panel'): void {
  const win = ensureMainWindow();
  applyWindowLayout(win, layout);
  positionWindowNearTray(win);
  win.show();
  win.focus();
}

function hideMainWindowOnly(): void {
  const win = getLiveMainWindow();
  if (win && win.isVisible()) {
    win.hide();
  }
}

function createWindow(): BrowserWindow {
  const config = getConfig();
  const isOnboarding = !config.setupComplete;

  const win = new BrowserWindow({
    width: isOnboarding ? 750 : 540,
    height: isOnboarding ? 580 : 600,
    minWidth: isOnboarding ? 600 : 380,
    minHeight: isOnboarding ? 400 : 280,
    frame: false,
    transparent: false,
    alwaysOnTop: !isOnboarding,
    skipTaskbar: !isOnboarding && (process.platform === 'darwin' || process.platform === 'win32'),
    resizable: true,
    movable: true,
    show: false,
    hasShadow: true,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 12, y: 12 },
    ...(process.platform === 'darwin' ? { type: 'panel' as const } : {}),
    vibrancy: 'popover',
    visualEffectState: 'active',
    backgroundColor: '#1c1a19',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  if (!isOnboarding) {
    applyWindowLayout(win, 'panel');
  }

  if (isDev) {
    const devServerUrl = getDevServerUrl();
    console.log('Loading dev server:', devServerUrl);
    win.loadURL(devServerUrl);
    if (process.env.THEGIST_DEVTOOLS !== '0') {
      win.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  win.on('blur', () => {
    if (!getConfig().setupComplete) return;
    // Only auto-hide on idle "ready" — never while capture/explain flow is active or user reads a result.
    const s = captureSession.getState();
    if (s === 'listening' || s === 'submitting' || s === 'result' || s === 'error') {
      return;
    }
    hideWindow();
  });

  win.on('closed', () => {
    if (mainWindow === win) {
      mainWindow = null;
    }
  });

  win.webContents.on('before-input-event', (_event, input) => {
    if (input.key === 'Escape' && input.type === 'keyDown') {
      if (captureSession.getState() === 'listening') {
        hideWindow();
      } else if (captureSession.getState() === 'region_offered') {
        captureSession.cancel();
      } else {
        hideWindow();
      }
    }
  });

  return win;
}

function hideWindow(): void {
  const win = getLiveMainWindow();
  if (win && win.isVisible()) {
    win.hide();
    captureSession.cancel();
  }
}

function createTray(): Tray {
  const iconPath = getIconPath();
  let icon: Electron.NativeImage;
  
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      icon = nativeImage.createEmpty();
    }
  } catch {
    icon = nativeImage.createEmpty();
  }

  const trayInstance = new Tray(icon);
  trayInstance.setToolTip('The Gist');
  
  updateTrayMenu(trayInstance);
  
  return trayInstance;
}

function updateTrayMenu(trayInstance: Tray): void {
  const config = getConfig();
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Capture / explain',
      accelerator: config.hotkey,
      click: () => triggerHotkey(),
    },
    { type: 'separator' },
    {
      label: 'Recent Contexts',
      submenu: [
        { label: 'No recent contexts', enabled: false },
      ],
    },
    { type: 'separator' },
    {
      label: 'Preferences...',
      accelerator: 'CommandOrControl+,',
      click: () => openPreferences(),
    },
    { type: 'separator' },
    {
      label: 'Quit The Gist',
      accelerator: 'CommandOrControl+Q',
      click: () => app.quit(),
    },
  ]);

  trayInstance.setContextMenu(contextMenu);
}

function registerHotkey(): void {
  const config = getConfig();
  
  // Unregister all shortcuts first
  globalShortcut.unregisterAll();
  
  const registered = globalShortcut.register(config.hotkey, () => {
    triggerHotkey();
  });

  if (!registered) {
    console.error(`Failed to register hotkey: ${config.hotkey}`);
  }
}

function triggerHotkey(): void {
  const win = getLiveMainWindow();
  const captureState = captureSession.getState();
  const visible = win?.isVisible() ?? false;

  if (visible) {
    hideWindow();
    return;
  }

  if (captureState === 'region_offered') {
    return;
  }

  if (captureState === 'submitting') {
    showWindowNearTray('panel');
    return;
  }

  captureSession.start();
}

function openPreferences(): void {
  const win = ensureMainWindow();
  win.webContents.send('preferences:open');
  if (!getConfig().setupComplete) {
    showWindowCentered();
  } else {
    showWindowNearTray('panel');
  }
}

// Transform API response to renderer-expected format
type RendererVisualPayload =
  | { kind: 'svg'; svg: string }
  | { kind: 'image'; mimeType: string; base64: string }
  | { kind: 'mermaid'; source: string };

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

function transformToRendererFormat(
  apiResponse: ExplanationResponse,
  selection?: string
): RendererExplanationResponse {
  const exp = apiResponse.explanation;
  return {
    headline: exp.headline,
    withoutExample: exp.analogy || '',
    withExample: exp.body,
    mechanics: (exp.mechanics || []).map((text, i) => ({ num: String(i + 1), text })),
    firstPrinciple: exp.firstPrinciple || '',
    targetNode: exp.suggestedWikiNode || 'General',
    selection,
    visual: apiResponse.visual,
    priorExplanation: {
      headline: exp.headline,
      body: exp.body,
      analogy: exp.analogy,
      mechanics: exp.mechanics,
      firstPrinciple: exp.firstPrinciple,
      suggestedWikiNode: exp.suggestedWikiNode,
    },
  };
}

function setupCaptureSession(): void {
  captureSession.setCallbacks(
    (state: CaptureSessionState) => {
      const win = ensureMainWindow();
      win.webContents.send('capture:state-change', state);

      switch (state) {
        case 'region_offered':
          if (isDev) {
            win.webContents.closeDevTools();
          }
          win.setAlwaysOnTop(false);
          hideMainWindowOnly();
          break;
        case 'listening':
          win.setAlwaysOnTop(true);
          applyWindowLayout(win, 'compact');
          positionWindowNearTray(win);
          win.show();
          win.focus();
          break;
        case 'submitting':
          win.setAlwaysOnTop(true);
          applyWindowLayout(win, 'panel');
          positionWindowNearTray(win);
          win.show();
          win.focus();
          break;
        case 'result':
        case 'error':
          win.setAlwaysOnTop(true);
          applyWindowLayout(win, 'panel');
          positionWindowNearTray(win);
          win.show();
          win.focus();
          break;
        case 'idle':
          hideMainWindowOnly();
          break;
        default:
          break;
      }
    },
    async (result: CaptureResult) => {
      const win = ensureMainWindow();
      win.webContents.send('capture:result', result);
      win.webContents.send('explanation:loading');

      try {
        const wikiContent = await readWiki();
        const profileContent = await readProfile();
        const config = getConfig();
        
        // Combine wiki and profile content for better context
        const combinedContext = profileContent 
          ? `${wikiContent}\n\n---\n\n${profileContent}`
          : wikiContent;

        const selection =
          result.type === 'text' ? result.content.slice(0, 100) : undefined;

        lastExplanationContext = {
          result,
          combinedWiki: combinedContext,
          twitter: config.twitterHandle,
          selection,
        };
        
        const response = await explain(result, combinedContext, config.twitterHandle);
        const rendererResponse = transformToRendererFormat(response, selection);
        const w = getLiveMainWindow() ?? ensureMainWindow();
        w.webContents.send('explanation:result', rendererResponse);
      } catch (err) {
        const error = err as { code?: string; message?: string; userMessage?: string };
        const w = getLiveMainWindow() ?? ensureMainWindow();
        w.webContents.send('explanation:error', {
          code: error.code || 'UNKNOWN',
          message: error.userMessage || error.message || 'An error occurred',
          action: error.code === 'auth_invalid' ? 'openPreferences' : undefined,
        });
      }
    },
    (_error: Error) => {
      const w = getLiveMainWindow() ?? ensureMainWindow();
      w.webContents.send('explanation:error', {
        code: 'CAPTURE_FAILED',
        message: 'Failed to capture content. Please try again.',
        action: undefined,
      });
    }
  );
}

function setupIpcHandlers(): void {
  // Capture handlers
  ipcMain.handle('capture:start', () => captureSession.start());
  ipcMain.handle('capture:cancel', () => captureSession.cancel());
  ipcMain.handle('capture:submit', (_event, result: CaptureResult) => 
    captureSession.submitManual(result)
  );

  ipcMain.handle(
    'explanation:follow-up',
    async (
      _event,
      payload: { priorExplanation: PriorExplanationSummary; userQuestion: string }
    ) => {
      if (!lastExplanationContext) {
        return { ok: false as const, error: 'No prior capture context. Start a new explanation.' };
      }
      ensureMainWindow().webContents.send('explanation:loading');
      try {
        const { result, combinedWiki, twitter, selection } = lastExplanationContext;
        const response = await explain(result, combinedWiki, twitter, {
          priorExplanation: payload.priorExplanation,
          userQuestion: payload.userQuestion,
        });
        const rendererResponse = transformToRendererFormat(response, selection);
        const w = getLiveMainWindow() ?? ensureMainWindow();
        w.webContents.send('explanation:result', rendererResponse);
        return { ok: true as const };
      } catch (err) {
        const error = err as { code?: string; message?: string; userMessage?: string };
        const w = getLiveMainWindow() ?? ensureMainWindow();
        w.webContents.send('explanation:error', {
          code: error.code || 'UNKNOWN',
          message: error.userMessage || error.message || 'An error occurred',
          action: error.code === 'auth_invalid' ? 'openPreferences' : undefined,
        });
        return { ok: false as const, error: error.userMessage || error.message };
      }
    }
  );

  // Config handlers
  ipcMain.handle('config:get', () => getConfig());
  ipcMain.handle('config:set', (_event, config: Partial<GistConfig>) => {
    const updated = setConfig(config);
    const live = getLiveMainWindow();
    if (live) {
      live.webContents.send('config:updated', updated);
    }

    if (updated.setupComplete && live && !live.isDestroyed()) {
      applyTrayWindowChrome(live);
      positionWindowNearTray(live);
    }

    // Re-register hotkey if it changed
    if (config.hotkey) {
      registerHotkey();
    }

    // Restart wiki watcher if path changed
    if (config.wikiPath !== undefined) {
      wikiWatcher.restart();
    }

    // Update tray menu
    if (tray) {
      updateTrayMenu(tray);
    }

    return updated;
  });
  
  // File picker for wiki file
  ipcMain.handle('config:file-picker', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      title: 'Select Wiki File',
      message: 'Choose your wiki markdown file',
      filters: [
        { name: 'Markdown', extensions: ['md', 'markdown'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    
    return result.filePaths[0];
  });

  // Wiki handlers
  ipcMain.handle('wiki:read', () => readWiki());
  ipcMain.handle('wiki:append', (_event, { content, node }: { content: string; node?: string }) => 
    appendToWiki(content, node)
  );

  // Profile handlers
  ipcMain.handle('profile:analyze', async (_event, twitterHandle: string) => {
    try {
      const result = await analyzeTwitterProfile(twitterHandle);
      const profilePath = await saveProfile(result.markdown);
      
      if (profilePath) {
        // Update config with profile path
        const config = getConfig();
        setConfig({ ...config, profilePath });
      }
      
      return { success: true, profile: result.profile, profilePath };
    } catch (err) {
      const error = err as { message?: string };
      return { success: false, error: error.message || 'Failed to analyze profile' };
    }
  });

  // App handlers
  ipcMain.handle('preferences:open', () => openPreferences());
  ipcMain.handle('app:quit', () => app.quit());
  ipcMain.handle('app:hide', () => hideWindow());

  // System settings handlers (macOS)
  ipcMain.handle('system:open-accessibility', () => {
    // Open System Preferences > Privacy & Security > Accessibility
    shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility');
  });
  
  ipcMain.handle('system:open-screen-recording', () => {
    // Open System Preferences > Privacy & Security > Screen Recording
    shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
  });
}

// ============ App Lifecycle ============

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!getConfig().setupComplete) {
      showWindowCentered();
    } else {
      showWindowNearTray('panel');
    }
  });

  app.whenReady().then(() => {
    // Hide dock icon (menu bar app)
    if (process.platform === 'darwin') {
      app.dock.hide();
    }

    setupIpcHandlers();
    setupCaptureSession();
    
    mainWindow = createWindow();
    tray = createTray();
    
    registerHotkey();
    wikiWatcher.start();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    } else if (!getConfig().setupComplete) {
      showWindowCentered();
    } else {
      showWindowNearTray('panel');
    }
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    wikiWatcher.stop();
  });

  app.on('window-all-closed', () => {
    // Don't quit on window close - it's a menu bar app
  });
}
