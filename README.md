# oriz-chat

**Live: https://chat.oriz.in**

Free, streaming AI chat that runs entirely in your browser. Multi-turn conversations, a full model picker with automatic multi-provider failover, markdown rendering, on-device history, prompt presets, and export.

> **100% client-side · no upload · no signup.** Your conversations save to IndexedDB on your own device and never touch a server.

## Features

- **Streaming chat** — token-by-token responses via `@chirag127/oz-ai` (g4f multi-provider, no API key).
- **Model picker** — every g4f model, with automatic failover if a provider is down.
- **Prompt presets** — general, code, brainstorm, explain, rewrite, translate (system prompts).
- **Markdown render** — sanitized markdown + fenced code, tables, lists (`marked` + `DOMPurify`, lazy-loaded).
- **Private history** — conversations persisted in IndexedDB (`idb`); browse, reopen, delete.
- **Export** — download any conversation as Markdown or JSON.
- **Drag & drop** — drop a `.txt`/`.md` file into the composer to load it as context.
- **Accessible + responsive** — WCAG-AA contrast, keyboard nav, mobile (390px) → desktop (1440px).

## Design

Aurora / conversational identity — soft night-sky background with a slow animated aurora ribbon, glassy message bubbles, a pulsing glow on the active model, and a warm rounded sans (Nunito) paired with a display serif (Fraunces). Bespoke per this site; shares only mechanism/tokens with other oriz.in tools.

## Stack

Astro (static) · React 19 islands · Tailwind v4 · shared atomic `@chirag127/*` packages (`oz-ai`, `oz-file`, `oz-tokens-base`, `oz-chrome`).

## Develop

```bash
npm install --legacy-peer-deps
npm run dev      # local dev
npm test         # unit tests (vitest)
npm run build    # static build → dist/
```

Windows note: use **npm** (not pnpm — pnpm skips `@esbuild/win32-x64` and the build crashes).

## Deploy

```bash
npm run deploy   # astro build + wrangler pages deploy → oriz-chat (Cloudflare Pages)
```

## Privacy

No backend, no accounts, no telemetry. The only network calls are the AI completion requests you initiate (routed through g4f providers). History and exports stay on your device.

## License

MIT © 2026 Chirag Singhal
