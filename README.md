# OmniBridge

A unified API gateway for multiple LLM providers. OmniBridge gives you a single OpenAI-compatible endpoint that distributes requests across 16+ providers with automatic failover, load balancing, and usage tracking.

## Features

- **Single Endpoint** — One OpenAI-compatible API key to rule them all. Route requests to any provider without changing your code.
- **Auto-Failover** — If a provider hits rate limits, quota exhaustion, or errors, requests automatically switch to the next available provider. You see exactly why in the response.
- **Smart Routing** — General queries are load-balanced across all providers. Task-specific routing sends code to DeepSeek, images to vision-capable models, reasoning to providers with reasoning sub-models.
- **Provider Support** — 16+ providers: OpenAI, Anthropic, Google (Gemini), Groq, Together, OpenRouter, DeepSeek, GitHub, Cerebras, Cloudflare, Cohere, Kilo, Pollinations, ZAI, Nvidia, OpenCode.
- **Dashboard** — Manage API keys, configure provider rotation, view usage logs and statistics.
- **Proxy API** — Use any provider's models through OmniBridge's proxy with automatic key rotation across your configured provider keys.

## Tech Stack

- **Framework:** React Router v7 (React 19, TypeScript)
- **Styling:** CSS Modules + custom design system
- **Database:** Turso (libSQL) or local SQLite
- **Deployment:** Vercel
- **Encryption:** AES-256-GCM for stored API keys

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- (Optional) Turso account for cloud database

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ENCRYPTION_KEY` | Yes | 32-byte hex key for AES-256-GCM key encryption. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `TURSO_DB_URL` | For Vercel | Turso database URL (uses local SQLite by default) |
| `TURSO_AUTH_TOKEN` | For Vercel | Turso authentication token |
| `OMNIBRIDGE_PUBLIC_BASE_URL` | For Vercel | Public base URL for the API (e.g. `https://omnibridge-dev.vercel.app/api/v1`) |

### Development

```bash
npm run dev
```

### Build & Deploy

```bash
# Build
npm run build

# Deploy to Vercel
vercel --prod
```

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Client App │────▶│  OmniBridge │────▶│  Provider A  │
│  (OpenAI    │     │  API Proxy  │     ├──────────────┤
│   SDK)      │     │             │────▶│  Provider B  │
└─────────────┘     │  + Dashboard│     ├──────────────┤
                    │             │────▶│  Provider C  │
                    └─────────────┘     └──────────────┘
```

Requests hit the `/api/v1/chat/completions` endpoint, which selects a provider based on routing rules, calls the provider, and returns OpenAI-compatible responses. If the selected provider fails, it automatically falls through to the next.

## API

OmniBridge exposes an OpenAI-compatible API at `/api/v1`. Use it with any OpenAI SDK:

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://your-app.vercel.app/api/v1",
    api_key="your-omnibridge-key"
)
```

## Project Structure

```
app/
├── blocks/          # UI components organized by feature
├── components/      # Shared UI primitives
├── data/            # Provider models, mock data
├── db/              # Database client & schema
├── dev/             # Dev-only components
├── hooks/           # React hooks
├── routes/          # Application routes & API endpoints
│   ├── dashboard/   # App dashboard pages
│   ├── api.v1.chat.completions.ts  # Core chat API
│   ├── api.v1.models.ts           # Models listing API
│   ├── auth.tsx, landing.tsx      # Public pages
│   └── logout.tsx
├── services/        # Business logic
│   ├── auth.server.ts, chat.server.ts, encryption.server.ts
│   ├── llm.server.ts, proxy.server.ts, routing.server.ts
│   ├── key-picker.server.ts, proxy-auth.server.ts
│   ├── router.server.ts, nvidia.server.ts
│   ├── session.server.ts, settings.server.ts, usage.server.ts
│   └── persona.ts
├── styles/          # Global CSS (reset, theme, global)
├── root.tsx         # Root layout
└── routes.ts        # Route configuration
```
