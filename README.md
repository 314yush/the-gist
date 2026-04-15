# The Gist

**One-click explanations personalized to your knowledge** — A Chrome extension and API that explains concepts based on what you already know.

Select text, copy, or just click — The Gist explains it your way using your personal knowledge profile and interests.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  CHROME EXTENSION                                │
│  Select text / Copy / Click → Capture → Show explanation        │
└─────────────────────────────────────────────────────────────────┘
                              │
                        POST /v1/explanations
                              │
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND (Hono on Railway/Render)                │
│  Auth → xAI x_search (Twitter) → OpenRouter (AI) → Response    │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+

### Development

```bash
# Install dependencies
pnpm install

# Build shared types
pnpm -F @thegist/shared build

# Run the extension dev server
pnpm dev:ext

# In a separate terminal, run the API
pnpm dev:api
```

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
# Backend (apps/api)
OPENROUTER_API_KEY=sk-or-v1-...      # Required for AI
XAI_API_KEY=xai-...                   # Optional for Twitter context
AUTH_SECRET=your-secret-key           # For token validation

# Extension (apps/extension)
# API URL defaults to http://localhost:3000 in dev, configurable in options page
```

## Project Structure

```
eli5/
├── apps/
│   ├── extension/       # Chrome extension (React + Vite)
│   │   └── src/         # Background, sidepanel, options, components
│   └── api/             # Backend (Hono)
├── packages/
│   └── shared/          # Shared TypeScript types
└── docs/                # Product spec and design mockups
```

## How It Works

1. **Select text** or click the extension icon
2. **Capture**: Text selection, clipboard, or visible tab screenshot
3. **Explain**: Backend uses:
   - Your **personal wiki** (what you already know)
   - Your **Twitter** activity (via Grok x_search)
   - **OpenRouter** (vision-capable AI models)
4. **Result**: Personalized explanation with analogies from your domains

## API Reference

### POST /v1/explanations

```typescript
// Request
{
  input: {
    type: "text" | "image" | "url",
    content: string,  // text content or base64 image
    url?: string      // for URL type
  },
  context: {
    wiki: string,           // markdown content
    twitterHandle?: string  // @username for personalization
  }
}

// Response
{
  explanation: {
    headline: string,       // ELI5 one-liner
    body: string,           // Detailed markdown
    analogy?: string,       // Relatable comparison
    mechanics?: string[],   // Step-by-step breakdown
    firstPrinciple?: string,// Core insight
    suggestedWikiNode?: string
  }
}
```

## Tech Stack

- **Extension**: React, Vite, Tailwind CSS, CRXJS
- **Backend**: Hono, Vercel AI SDK, OpenRouter
- **AI**: OpenRouter (GPT-4o), xAI Grok (x_search)

## Design

The UI follows the design system:
- Colors: Terracotta (#BC5F40), Gold (#DCA842), Cream (#FDFBF7)
- Fonts: Inter, Newsreader, VT323
- Glass panel effects with backdrop blur

## License

MIT
