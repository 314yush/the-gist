# The Gist Desktop

macOS menu bar app for contextual learning.

## Development

```bash
# Install dependencies (from repo root)
pnpm install

# Run in development mode
pnpm --filter @thegist/desktop dev
```

### API auth (avoid `401` / `AUTH_INVALID`)

The Electron **main** process loads the repo **root** `.env` on startup (`electron/load-env.ts`). `getConfig()` fills **`apiToken`** from `AUTH_SECRET` (and **`apiUrl`** from `VITE_DEFAULT_API_URL` / `THEGIST_API_URL`) when nothing is saved in Preferences, so requests use `Authorization: Bearer …` without pasting secrets by hand.

Run the API in another terminal: `pnpm dev:api` (it reads the same `.env`).

**Vite-only browser** (`http://localhost:5173` without Electron): set `VITE_THEGIST_DEV_TOKEN` in `.env` to the **same value** as `AUTH_SECRET` so the dev browser shim (`src/dev-browser-thegist.ts`) can call the API.

## Permissions

### Development

Electron needs to be granted permissions in System Preferences:

- **Screen Recording**: Required for region capture
  - Path: `node_modules/electron/dist/Electron.app`

### Packaged App

After installing the DMG:

- **Screen Recording**: Required for region capture
  - Path: `/Applications/The Gist.app`

## Architecture

```
electron/
├── main.ts      # App lifecycle, windows, tray, hotkey
├── preload.ts   # Context bridge for IPC
├── capture.ts   # screencapture CLI, clipboard handling
├── wiki.ts      # Watch + read wiki file
├── api.ts       # Backend client
└── store.ts     # electron-store for config
```

### Capture Flow State Machine

```
idle → region_offered → listening → submitting → result
                     ↘             ↗
                       → error →
```

1. **Hotkey pressed** (window stays hidden): Snapshot clipboard baseline, then macOS region capture (`/usr/sbin/screencapture -i` — absolute path so it works when the app is launched from the Dock with a minimal `PATH`). Output is a unique file under the system temp directory; if the file is slow to appear, we wait; if there is no file but exit code is success, we poll the clipboard for a new image (macOS often updates the pasteboard after the tool exits).
2. **User draws region**: `screencapture -i -x` writes PNG to temp file → **submitting** → API explains the capture → **result** panel.
3. **User cancels region capture**: Enters **listening** — small panel appears **under the menu bar tray**; copy text/URL/image within the clipboard timeout (see `CLIPBOARD_LISTEN_TIMEOUT_MS` in `@thegist/shared`, default 15s). The window does **not** dismiss when you focus another app during listening, submitting, or while viewing a result (blur only hides the idle "ready" state).
4. **Clipboard changes**: Detect type (text/URL/image), normalize, submit
5. **URL detected**: Optionally fetch + strip HTML before sending to API

### Global hotkey behavior

- **Window hidden**: Start a capture session (region offer first). While the system screenshot UI runs, the hotkey does nothing (no re-entrancy).
- **Window visible**: Hide and cancel the session (same as Escape for listening / dismiss).
- **Window hidden but explanation is loading** (`submitting`): Hotkey brings the panel back near the tray so you can see progress.

### Window Behavior

- Frameless; after onboarding, **skipTaskbar** so the panel reads as a menu-bar utility (Dock hidden on macOS).
- **Tray popover**: When shown for capture/listening/result, the window is **positioned under the tray icon** (not centered on the cursor).
- Always on top when visible (except during native region capture, where the window is hidden).
- Hides on Escape (listening cancels; other states dismiss).
- Does NOT hide on blur during **listening** mode (so you can switch apps to copy).
- DevTools: set `THEGIST_DEVTOOLS=0` to skip opening DevTools in dev. During region capture, DevTools close automatically so they do not cover the screen.

## Building

```bash
# Build for distribution
pnpm --filter @thegist/desktop build

# Package as DMG
pnpm --filter @thegist/desktop package
```

Output goes to `release/` directory.
