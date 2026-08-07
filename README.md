# oriz-chat

**Live app: https://chat.oriz.in** · **About / info: https://chirag127.github.io/oriz-chat/** · **llms.txt: https://chat.oriz.in/llms.txt**

Free, streaming AI chat that runs entirely in your browser. Multi-turn conversations, a full model picker with automatic multi-provider failover, markdown rendering, on-device history, prompt presets, and export.

> **100% client-side · no upload · no signup · free.** Conversations save to IndexedDB on your own device and never touch a server. The only network calls are the AI completion requests you initiate.

## Features

- **Streaming chat** — token-by-token responses via `@chirag127/oz-ai` (g4f multi-provider, no API key).
- **Model picker** — every g4f model, with automatic failover if a provider is down.
- **Prompt presets** — general, code, brainstorm, explain, rewrite, translate (system prompts).
- **Markdown render** — sanitized markdown + fenced code, tables, lists (`marked` + `DOMPurify`, lazy-loaded).
- **Private history** — conversations persisted in IndexedDB (`idb`); browse, reopen, delete.
- **Export** — download any conversation as Markdown or JSON.
- **Drag & drop** — drop a `.txt`/`.md` file into the composer to load it as context.
- **Accessible + responsive** — WCAG-AA contrast, keyboard nav, mobile (390px) → desktop (1440px).
- **PWA-installable** — offline app shell.

## Tech

Astro (static) · React 19 islands · Tailwind v4 · g4f AI via `@chirag127/oz-ai` · shared atomic `@chirag127/*` packages (`oz-ai`, `oz-file`, `oz-tokens-base`, `oz-chrome`) for mechanism only — the visual theme is bespoke to this site.

## Develop

```bash
npm install --legacy-peer-deps
npm run dev      # local dev
npm test         # unit tests (vitest)
npm run build    # static build → dist/
npm run deploy   # astro build + wrangler pages deploy → oriz-chat (Cloudflare Pages)
```

Windows note: use **npm** (not pnpm — pnpm skips `@esbuild/win32-x64` and the build crashes).

## Two surfaces

- **Cloudflare Pages** — the live app at [chat.oriz.in](https://chat.oriz.in).
- **GitHub Pages** — a separate project info page at [chirag127.github.io/oriz-chat](https://chirag127.github.io/oriz-chat/) (built from `gh-info/` via `.github/workflows/gh-pages-info.yml`).

## License

MIT © 2026 Chirag Singhal
