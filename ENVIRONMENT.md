# ENVIRONMENT.md — PlainTerms foundation + AI milestone

## Variables

All server secrets are read exclusively through `lib/security/env.ts`
(`getServerEnv()`), which is guarded by `server-only` — importing it from
client code fails the build.

| Variable         | Required now            | Purpose                                      |
| ---------------- | ----------------------- | -------------------------------------------- |
| `NODE_ENV`       | Set by Next.js          | `development` / `production` / `test`        |
| `APP_URL`        | No (defaults localhost) | Canonical URL for exports/links              |
| `GEMINI_API_KEY` | Yes, for live AI review | Gemini API key, server-only, never committed |

Without `GEMINI_API_KEY`, the review panel shows the honest
"AI review is temporarily unavailable" state — the document stays readable
and nothing is fabricated. Set it in a local `.env.local` (gitignored):

```bash
APP_URL=http://localhost:3000
GEMINI_API_KEY=your-key-here
```

`.env.example` documents the variable name only. Never print the value in
logs or output; `lib/privacy/log.ts` strips key-shaped context automatically.

## Rules

- **Never** put secrets in source code, client components, or logs.
- **Never** log document content, AI responses, prompts, or PII —
  `lib/privacy/log.ts` structurally prevents content-shaped keys.
- Uploads are validated by `lib/security/validate.ts` (PDF/DOCX/TXT, 25 MB
  cap); prompt-injection boundaries live in `lib/security/prompt-guard.ts`.

## Retention and limits

- Parsed upload records live server-side for 60 minutes
  (`recordTtlMs`), max 100 entries (FIFO), deletable anytime via
  `DELETE /api/documents/[id]` (also fired on client delete).
- Raw uploads and temp files are deleted immediately after parsing.
- Client state (metadata + normalized sections) is tab-local
  sessionStorage, cleared when the tab closes.
- Hard limits (`lib/documents/limits.ts`): 25 MB files, 200 PDF pages,
  500k extracted chars, 60s parse budget.
- Full threat model and claim boundaries: `SECURITY.md`.
