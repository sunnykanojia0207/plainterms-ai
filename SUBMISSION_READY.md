# SUBMISSION_READY.md

> PlainTerms release status. Live-model items stay PENDING until a
> `GEMINI_API_KEY` is configured — nothing here claims otherwise.

## Links

- Repository URL: PENDING (local release commit ready; push needs a remote)
- Vercel URL: PENDING (not deployed; assessment in ARCHITECTURE.md)
- Branch: `main` (only branch)

## Facts

- Repository size: ~0.71 MB git objects (215 files) — far under 10 MB
- Framework: Next.js 16 App Router + strict TypeScript + Tailwind v4
- Gemini model: `gemini-2.5-flash` (single source in `lib/ai/config.ts`)
- Supported files: PDF (text layer), DOCX, TXT
- Legal types: Service Agreements, NDAs, Statements of Work
- Capabilities: Understand, Clause Intelligence, Ask With Evidence,
  Compare (semantic + silence), Action Pack, Review Guide

## AI safety approach

Five visually distinct information layers; citation-or-silence on every
surface; strict zod validation; per-version evidence checks; confidence
and ambiguity as UI; banned conclusive language (verified by search);
counsel content quarantined; prompts treat documents as untrusted data.

## Security status

No secrets committed (scanned); key server-only; magic-byte upload
validation; no macro/HTML/URL execution paths; temp cleanup in `finally`;
metadata-only logs; fixed-window API rate limiting (`proxy.ts`).
Pending for scale: external rate-limit store, antivirus, persistent
record storage (documented with migration seams).

## Testing summary

- 199 unit/component/integration tests (Vitest), 29 e2e incl. axe scans
  gating serious/critical (Playwright, Chromium) — all passing
- format, lint, strict typecheck, production build — all passing
- Real-file coverage: committed PDF/DOCX/TXT fixtures parsed and
  asserted; live browser uploads verified end to end

## Accessibility status

WCAG AA engineering: keyboard-complete flows, visible focus + restore,
live regions, semantic structures, reduced-motion support, token-paired
statuses. Axe gates green. Manual screen-reader pass: PENDING.

## Known limitations

- Live Gemini verification pending (no key in CI); mocked coverage +
  keyless-path e2e throughout; manual checklist in DEVELOPMENT.md.
- No OCR; in-memory server records (60-min TTL); tab-local client state.
- No antivirus beyond format validation; per-instance rate limiting.

## Live Gemini status

PENDING — LIVE GEMINI VERIFICATION (see LIVE_GEMINI_VERIFICATION.md).
To complete: set `GEMINI_API_KEY` in `.env.local`, restart dev, work
§19's table, record results + latencies in §14.

## Rate limiting status

Implemented (fixed window per IP; uploads stricter; 429 + Retry-After).
Per-instance memory: correct on long-lived servers, approximate on
serverless — documented.

## AV scanning status

PENDING — format validation only; documented in SECURITY.md.

## One-branch compliance

Single branch `main`, one root release commit, working tree clean.

## README status

Submission README complete: problem, solution, user, GenAI role,
features, demo flow, safety, architecture, documents, setup, testing,
limitations, live-demo/GitHub placeholders, 5 screenshots.

## Final submission checklist

- [x] Complete project code on one branch, working tree clean
- [x] Repository ~0.71 MB (< 10 MB), no junk tracked
- [x] README submission-complete with screenshots
- [x] Setup, architecture, security, accessibility, testing documented
- [x] No secrets committed (scanned)
- [x] All quality gates green at release commit
- [x] Demo path works keyless (seeded V1/V2); AI live with key
- [ ] Push to public GitHub remote (needs remote URL — see below)
- [ ] Vercel production deploy + smoke test (needs Vercel auth)
- [ ] Live-model verification (needs key)

## To finish submission (owner actions)

```bash
# 1. Create the public repo on GitHub, then:
git remote add origin <PASTE-REMOTE-URL>
git push -u origin main

# 2. Deploy (Vercel CLI, logged in):
vercel --prod
# set GEMINI_API_KEY in the project environment settings first

# 3. Fill in the two PENDING URLs at the top of this file.
```
