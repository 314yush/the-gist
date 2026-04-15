# The Gist Verification Checklist

Manual QA script to run before shipping.

## Prerequisites

1. [ ] Fresh install (delete `~/Library/Application Support/thegist-config.json` if exists)
2. [ ] Environment variables configured:
   - Backend: `OPENROUTER_API_KEY`, `XAI_API_KEY`, `AUTH_SECRET`
   - Desktop: `VITE_DEFAULT_API_URL` (optional)

## First Run / Onboarding

- [ ] App shows onboarding wizard on first launch
- [ ] Cannot proceed without completing required steps
- [ ] Step 1: Accessibility instructions are clear
- [ ] Step 2: File picker opens and path is saved
- [ ] Step 3: Twitter handle input works (optional)
- [ ] Step 4: API URL and token inputs work
- [ ] "Complete Setup" saves config and closes wizard

## Hotkey Flow

### Region Capture
- [ ] `⌘ + Shift + L` shows floating panel
- [ ] Native crosshair appears for region selection
- [ ] Completing capture → loading state → explanation result
- [ ] Result shows headline, mechanics, first principle
- [ ] "Add to Wiki" appends to wiki file

### Clipboard Listening (press Esc after hotkey)
- [ ] Panel stays visible during listening mode
- [ ] Copy text in another app → auto-detected → explanation
- [ ] Copy URL → fetched and explained with source link
- [ ] Copy image → explained with vision
- [ ] 5s timeout returns to idle state

### Panel Behavior
- [ ] Esc key dismisses panel
- [ ] Panel positions near cursor
- [ ] Panel doesn't hide on blur during listening mode
- [ ] Panel hides on blur when showing results

## Error Handling

- [ ] Invalid API token → "Your token is invalid..." message + link to Preferences
- [ ] Expired token → "Your session has expired..." message
- [ ] Rate limit → "Rate limit reached..." message
- [ ] Network offline → "Can't reach servers..." message
- [ ] Capture failure → "Failed to capture..." message

## Preferences

- [ ] Tray menu → "Preferences..." opens settings
- [ ] Can change API URL and token
- [ ] Can change wiki path
- [ ] Can change Twitter handle
- [ ] Shows current hotkey
- [ ] "Save" persists changes
- [ ] Config survives app restart

## Wiki Integration

- [ ] Wiki file changes are detected (watch)
- [ ] "Add to Wiki" appends content correctly
- [ ] Suggested wiki node appears in footer

## Tray Menu

- [ ] Tray icon visible in menu bar
- [ ] "Show The Gist" triggers hotkey
- [ ] "Recent Contexts" submenu exists (placeholder)
- [ ] "Preferences..." opens settings
- [ ] "Quit The Gist" exits app

## Packaging

### Development
- [ ] `pnpm dev` starts Vite + Electron
- [ ] Hot reload works for renderer changes
- [ ] Accessibility permission: `node_modules/electron/dist/Electron.app`

### Production
- [ ] `pnpm package` creates DMG
- [ ] DMG installs to /Applications
- [ ] App launches from Applications folder
- [ ] Accessibility permission: `/Applications/The Gist.app`
- [ ] Screen Recording permission (if needed)

## Backend

- [ ] `GET /v1/health` returns OK
- [ ] `POST /v1/auth/token` with invite code returns token
- [ ] `POST /v1/explanations` returns structured response
- [ ] Invalid token → 401 with proper error
- [ ] Rate limiting works (if configured)

## Extension

- [ ] Extension loads in Chrome without errors
- [ ] Onboarding flow completes
- [ ] Context menu "Explain with The Gist" works
- [ ] Text selection → explanation
- [ ] Screenshot capture → explanation
- [ ] Follow-up questions work
- [ ] Options page saves settings

## Known Limitations

- macOS only (desktop)
- Unsigned builds require allowing in Security preferences
- Twitter context requires XAI_API_KEY
- Vision requires vision-capable model in OpenRouter
