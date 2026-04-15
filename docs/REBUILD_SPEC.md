# Rebuild spec: The Gist-style contextual learning terminal

This document captures product vision, platform constraints, pitfalls encountered during development, and phased sessions for rebuilding or extending the app with clear goals and acceptance criteria.

## Product vision

Ship a **macOS-first** menu-bar Electron app. After **one-time setup** (wiki path, AI path, permissions), the user presses a **global hotkey**. From that moment, **whatever they do next** to express intent should feed a **single explanation pipeline**: region screenshot, copied text, copied URL, copied image — without making them hunt through buttons unless they choose “advanced.”

**Ideal UX (target):** Hotkey → **implicit capture session** → user performs **one** natural action (draw region, ⌘C text/URL/image in any app) → that payload is **normalized** and sent to the model → floating panel shows result (and wiki actions). **Advanced** is optional: manual URL fetch, front-app selection via automation, typed notes.

**Non-goals for v1:** Windows parity; server-side wiki hosting; requiring accounts unless you explicitly ship a managed backend.

## Hard constraints (platform reality)

Plan for these up front — they are not implementation bugs.

1. **“Selecting text” without Copy** requires **Accessibility** + synthetic ⌘C (or similar). You cannot read arbitrary selections in other apps from Electron alone. **Copy-based** capture is the reliable default; automation is optional and fragile.
2. **System crosshair** for region capture comes from **`screencapture`** (or ScreenCaptureKit later), not from CSS cursor in your panel. Your UI cannot paint a global crosshair over other apps without a separate native/overlay story.
3. **Screen Recording** (and sometimes related TCC) affects interactive capture; **Accessibility** affects automation paths. **Dev** runs as **Electron**; **packaged** runs as **The Gist** — permissions are **per binary path**.
4. **Managed HTTP API** and **provider keys** are different trust domains: managed may be **text-only**; **vision** needs local keys or a backend that accepts multimodal.
5. **Clipboard** is the **lingua franca** for “user just did something” — but you must snapshot **baseline at session start**, debounce, and avoid treating stale clipboard as input.
6. **`screencapture -i -c` + clipboard read** can be flaky; **writing to a temp PNG file** is more reliable than relying on clipboard alone.

## Pitfalls we hit (design to avoid repeating)

| Area | Pitfall | Mitigation in spec |
|------|---------|---------------------|
| Auth | `401` / “User not found” from managed backend — users think the app is broken | Separate **managed** vs **BYO** in onboarding; validate URL/token; friendly errors that say **exactly** what to fix; optional auto-fallback to BYO keys when managed fails |
| Vision | Screenshots + managed-only mode | Gate in UI: vision → local keys or explicit backend support; one clear sentence in Preferences |
| Capture | Clipboard empty after region capture | File-based `screencapture -i` output; don’t rely on `-c` alone |
| UX | Panel hides on blur while user switches apps to copy | **Listening mode** disables blur-hide or uses a dedicated HUD |
| Dev | “Where is Electron in Accessibility?” | Docs: `node_modules/electron/dist/Electron.app` path; packaged = `The Gist.app` |
| Dev | `dev:electron` waits on Vite | Document `npm run dev` = full stack; main process changes need restart unless you add watch |
| Errors | Raw API strings confuse users | Map 401 / auth failures to actionable copy pointing to Preferences |

## Architecture goals

1. **Main process:** global shortcut, tray, wiki watcher, IPC, permission helpers, **capture session state machine** (idle → screenshot-offered → clipboard-listening → submitting → result/error).
2. **Renderer:** thin floating panel; states: listening HUD, loading, result, error, optional advanced capture.
3. **LLM layer:** multimodal where supported; **no streaming with image** until explicitly implemented; routing that respects vision vs text-only models.
4. **Config:** `apiMode` (managed \| BYO), managed URL/token, provider keys, models — single source of truth with env override documented.

## Phased sessions (milestones)

Use as **independent milestones**; order matters where noted.

### Session A — Bootstrap & invariants

**Goal:** Repo runs with `npm run dev`; renderer + main compile; no secrets in repo.

**Done when:** README lists one command to run dev; `.env.example` documents `THEGIST_*` and provider keys; typecheck passes.

### Session B — First-run / setup wizard

**Goal:** User picks wiki path, chooses **managed vs BYO**, and understands what each implies.

**Done when:** Without a wiki path or any AI path, hotkey cannot silently fail — user gets a blocking dialog or wizard step. Copy explains: managed needs URL + token from **your** backend; BYO needs at least one provider key.

### Session C — Global hotkey + floating panel shell

**Goal:** Tray icon, register shortcut, frameless panel loads React, blur/hide behavior defined.

**Done when:** Hotkey shows panel; Esc hides; panel position near cursor documented.

### Session D — Core explanation pipeline (text-only)

**Goal:** `selected` text + wiki + optional social profile → structured JSON explanation via **one** provider path (BYO first is fine).

**Done when:** End-to-end explain works with **no** image, no managed complexity, from a **manual** text submit.

### Session E — Managed backend (optional product)

**Goal:** `POST /v1/explanations` with bearer token; errors mapped to human messages; **fallback** to BYO keys if managed fails **and** keys exist.

**Done when:** 401 never surfaces as raw “User not found” without explanation; Preferences copy tells users how to fix auth.

### Session F — Capture session UX (the “ideal” hotkey flow)

**Goal:** Hotkey starts a **session**: (1) offer **native** region capture first **or** (2) skip to clipboard listening; baseline clipboard; debounced submit on change; **listening** doesn’t lose panel when switching apps.

**Done when:**

- macOS: `screencapture` → file-based PNG path works.
- Esc from capture → clipboard listen for bounded time.
- ⌘C text / URL / image → picked up without pressing Explain.
- Single URL in clipboard can be expanded (fetch + strip) before LLM.
- “Advanced” panel still available for power users.

### Session G — Vision (screenshots)

**Goal:** PNG attached to multimodal messages for OpenRouter / Gemini / Anthropic; batch-only for image; routing avoids text-only models when image present.

**Done when:** Region or clipboard image → explanation with BYO vision-capable model; managed users see explicit behavior (skip or require local keys — **one** policy, documented).

### Session H — Polish & packaging

**Goal:** DMG/README for `/Applications`, translocation, permission names (Electron vs The Gist), Screen Recording vs Accessibility.

**Done when:** Unsigned install path documented; dev vs packaged permission instructions differ explicitly.

### Session I — Verification matrix (manual QA script)

**Goal:** Repeatable checklist.

**Minimum checklist:**

- Hotkey → region → explain (vision key).
- Hotkey → Esc → copy text → auto-submit.
- Hotkey → Esc → copy URL → fetch + explain.
- Hotkey → Esc → copy image → explain.
- Managed URL wrong → clear error + optional BYO fallback.
- BYO only → no managed call.

## North star (one paragraph)

After setup, **one hotkey** starts a **capture session** where the next meaningful user action — **region screenshot** or **anything new on the clipboard** (text, URL, image) — is normalized and sent to the user’s AI path, with **native** screenshot for crosshair, **clipboard baseline + debounce** for copy/paste flows, **explicit** managed-vs-BYO and **vision** rules, and **permission** and **auth** messaging that never blame the user for server 401s.
