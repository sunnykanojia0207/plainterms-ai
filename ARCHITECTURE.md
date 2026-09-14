# ARCHITECTURE.md — PlainTerms foundation

## Decisions

**Next.js 16 App Router + strict TypeScript + Tailwind CSS v4.** Rationale:

- Server routes keep future Gemini keys server-side (never in the client bundle).
- Route groups map 1:1 to the five product destinations.
- React Server Components keep client JavaScript minimal; interactivity is
  isolated to small `"use client"` leaves (dialogs, menus, sheets, composers).
- Tailwind v4 CSS-first `@theme` tokens implement the spec's semantic token
  table with zero runtime theming cost; system font stacks honor the
  no-webfont-dependency rule and keep builds offline-safe.

The repository contained no prior code (only the three product/design
specifications), so this is a greenfield foundation implementing them directly.

## Feature-first layout

Code is organized around product capabilities, not technical layers:

- `app/` — routes only. Route files compose shell + UI primitives + empty
  states. No business logic in routes.
- `components/ui/` — design-system primitives. Generic, reusable, no
  feature knowledge (a future `ClauseCard` does NOT belong here).
- `components/shell/` — application chrome (navigation, command menu,
  settings, providers).
- `components/errors/` — render-failure containment.
- `lib/domain/` — the single canonical data model. Imported everywhere,
  duplicated nowhere.
- `lib/services/` — consumer-facing contracts. UI depends on interfaces;
  implementations arrive later and are wired without touching consumers.
- `lib/ai/` — Gemini layer: centralized config, content adapter, versioned
  prompts, zod schemas, evidence validator, server-only provider client,
  analysis orchestrator with cache, and the `ReviewService` implementation.
  UI reaches it only through `POST /api/analysis/[documentId]`.
- `lib/security/`, `lib/privacy/` — trust boundaries with unit coverage.

## AI layer (Gemini 2.5 Flash)

```text
fixture → content → prompts (+versions) → provider → zod validation
  → evidence filter (citation-or-silence) → cache → API route → UI
```

- `config.ts` centralizes model, temperature (0.2), budgets, timeouts,
  retries, prompt versions, and feature flags.
- `content.ts` adapts fixture sections into addressable prompt text; parser
  output plugs in here later without touching prompts or services.
- `prompts.ts` bakes in grounding rules, injection defense (document as
  untrusted data), safety vocabulary, and JSON-only output.
- `schemas.ts` owns zod validation + TS types; `responseJsonSchema`
  companions travel with the request.
- `evidence.ts` drops any finding whose quote is missing, short, or absent
  from the cited section. Dropped counts are logged, never rendered.
- `gemini-client.ts` enforces timeouts, bounded retries, and one
  constrained validation repair; logs metadata only (feature, model,
  latency, status, error category).
- `cache.ts` keys on document + version + prompt versions + model, with
  in-flight dedup so parallel callers share one computation.
- `POST /api/analysis/[documentId]` validates the request, maps provider
  errors to HTTP (400 unknown fixture, 503 unavailable, 504 timeout, 502
  model error), and returns validated domain objects only.

## Dependency direction

```text
routes → shell/ui → domain/vocabulary
routes → services (interfaces only)
services → domain
security/privacy → nothing product-specific
tests → public component/service APIs only
```

Nothing imports from a future implementation. The Gemini provider lives in
`lib/ai/` (server-only) and is exposed to the UI exclusively through the
analysis API route — components never import the SDK.

## Rendering model

- Layout, pages, and static content are Server Components by default.
- `"use client"` is used only where interaction demands it: Dialog, Drawer,
  Tabs, Toast, CommandMenu, SettingsSheet, TopNav, UploadZone, Ask composer,
  Home upload handling.
- Error containment: root `error.tsx` (route) + `not-found.tsx` +
  `FeatureErrorBoundary` (feature sections). All render `ErrorState`; none
  render stack traces or document content.

## State model

The simplest architecture that satisfies the blueprint:

- **Theme + toasts:** React context in `components/shell/providers.tsx`.
- **Local UI state** (menus, sheets, filters, composers): component state.
- **Document selection:** the URL (`/review/[documentId]`). No parallel
  client store, so deep links, Back behavior, and refresh work for free.
- **Future AI/document state:** server-backed via the service interfaces;
  no fake global store is introduced in this milestone.

## Document ingestion

Real uploads flow through a server-only pipeline; fixtures remain for
demos, tests, and offline work:

```text
browser → POST /api/documents → validate → sniff → temp store
  → parse (PDF/DOCX/TXT) → normalize → type-detect → record (TTL)
  → delete temp → metadata + sections to client
```

- `lib/documents/parse/` — `DocumentParser` implementations (unpdf text
  layer, mammoth document.xml text, strict UTF-8). No execution, fetching,
  or rendering of embedded content — output is data.
- `lib/documents/ingest.ts` — pipeline orchestration (also directly
  unit-testable without HTTP): limits, sniffing, timeout, records.
- `lib/documents/storage.ts` — `DocumentStorage` abstraction (local temp
  dir today; cloud tomorrow). Ids are random; filenames never reach disk.
- `lib/documents/records.ts` — parsed-record store with TTL + FIFO cap +
  explicit delete. Raw bytes and temp files never persist.
- `lib/ai/document-content.ts` — the single seam: fixture-backed docs
  resolve from fixtures, uploads from records. All AI features read
  through it, so none know where text came from.
- Client `StoredDocument` carries embedded sections for uploads
  (`sections: null` means fixture-backed). Uploaded bytes travel only to
  the endpoint and are never logged or stored client-side.
- `/api/*` rate limiting lives in `middleware.ts` over
  `lib/security/rate-limit.ts` (fixed window per IP; uploads stricter).

## Production deployment (Vercel)

- Standard Next.js deployment: `npm run build`, Node 20+
  (`engines` pinned), `GEMINI_API_KEY` via project environment settings.
- **Known serverless limitation:** temp files are single-request safe
  (`store → read → delete` happens inside one invocation, and `/tmp`
  supports that), but parsed **records, AI caches, and rate-limit
  counters are in-memory** — serverless instances neither share them nor
  keep them warm. Consequences: AI features on fresh uploads can 404
  (`unknown-document`) when a later request lands on a cold/different
  instance, and rate limits are per-instance approximations.
- **Minimum production-safe architecture (not implemented):** persist
  records to Vercel Blob (normalized sections JSON) + move AI caches to
  Vercel KV (keyed identically), or back records with Postgres. The
  seams are ready: implement the `DocumentStorage` interface against Blob
  and swap the cache maps for KV calls. Fixture/demo flows are unaffected
  (no server state beyond the request).

## What is intentionally deferred

Embeddings/vector search, authentication, database, file storage beyond
temp processing, background jobs, analytics, OCR for scanned PDFs, and
dark-theme refinement beyond the token set.
