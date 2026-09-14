# PLAINTERMS_FINAL_DESIGN_AUDIT.md — Editorial Intelligence final (2026-09-14)

> Round-3 final pass. Consolidates `UI_REDESIGN_AUDIT.md` (token system) and
> `PLAINTERMS_REDESIGN_REPORT.md` (composition). No business logic, prompts,
> evidence rules, API contracts, or security behavior changed — except the P0
> error-leak fix below. No test weakened; two failures caused by new UI were
> fixed in code (see Regression results).

## Before state

- Narrow centered columns (shell `max-w-6xl`, pages `max-w-3xl/5xl/6xl`) left
  blank gutters; routes read as marketing sites, not tools.
- Pre-round-1 token drift (`bg-bg`, `text-ai`, `bg-*-bg` pairs) and hand-built
  AI/evidence blocks per screen (resolved in earlier passes).
- Ask/Compare were outlined-select + button stacks; Documents rows were card
  stacks; Intelligence was sidebar lookalike cards; composer a fixed Input.
- `redesign-home-dark.png` was byte-identical to light — dark unverified.
- P0: live provider errors (e.g. 429 quota) rendered raw SDK text —
  codes, googleapis URLs, request IDs, Zod schema paths — straight into UI
  cards (see Error states).

## Major issues

1. Empty viewport + card soup (every row/suggestion/notice a box).
2. Weak identity: flat-tint nav, competing footer, display titles on all routes.
3. Form-builder Ask/Compare; document never dominant; sidebar AI.
4. No shared notice primitive; native selects looked browser-default.
5. P0 provider-data leak into error UI (chain documented + fixed below).

## Design direction

“Editorial Intelligence”: document = source (serif `font-doc`, authoritative),
AI = interpretation (restrained violet marker only), actions obvious/minimal.
Warm paper + ink tokens unchanged (`--background #FAF7F2`,
`--text-primary #1A1C1E`, `--accent #2F4BC2`); border-flat hierarchy, shadows
reserved for sheets/dialogs. 21st.dev / Taste Skill used for principles only.

## Shell refinements

- Canvas `max-w-[1440px]` + `lg:px-8`; Home capped at 7xl editorial;
  Documents/Ask/Compare now full canvas width (centered narrow columns
  removed per workspace-density finding).
- TopNav 56px: active keeps tint + semibold + inset 2px accent indicator
  (`shadow-[inset_0_-2px_0_var(--accent)]`, no layout shift).
- Footer reduced to a tertiary `border-subtle` strip; disclaimer unchanged.

## Home refinements

- Workflow converted to a horizontal 01/02/03 numbered grid
  (Upload/Understand/Verify) with serif numerals; full-bleed hairline rows
  removed. Copy changed (no test depended on it).
- Eyebrow + display hero (responsive: 1.75rem mobile → display at sm+),
  tightened subheading, formats + doc types in one metadata line.
- Capabilities: 5 editorial blocks with small accent markers; recents as
  compact table rows.

## Documents refinements

- Full-width library: `LIBRARY` eyebrow, compact title, primary Upload
  button, divided header rule. (Text search/sort deferred — new
  functionality, not refinement.)
- `DocumentRow` table row: § glyph (sm+), title (wraps on mobile,
  truncates at sm+), mono metadata line (`v1 · 6 pages · Updated …` with
  `suppressHydrationWarning` against store SSR mismatch), type/status/sample
  badges, Open/Compare/Delete on `hover:bg-surface-muted` rows in one
  divided panel. Sample badge KEPT — demo data must stay labeled.

## Review refinements

- Toolbar title truncates at page-title size (token now 1.5rem/2rem) with
  inline type/page badges + mono version tag; pager row wraps.
- Viewer `shadow-sm` paper elevation; rail/viewer/panel grid unchanged
  (already matched the brief’s widths); left rail quiet with active tint.
- Panel header “PlainTerms review” + understanding subline; loading copy
  de-duplicated (✦ mark keeps attribution). Asserted copy untouched.

## Ask refinements

- Workspace grid: 17rem rail + conversation, plus a 20rem evidence rail at
  xl showing the latest answer’s citations (serif quote, mono location,
  source link) with an honest empty state. Evidence stays inline in answers
  on smaller screens (nothing lost).
- Duplicate empty-state headers merged into one composer panel (label text
  unchanged: “Ask about this document”); keyboard hint;
  auto-sizing textarea.
- Rail suggestions converted from outlined pills to quiet text rows with →
  hover (still native `<button>`s — e2e selectors preserved).

## Compare refinements

- Connected V1 · VS · V2 selector panel on a raised surface; native selects
  with custom chevron styling (appearance-none, token-only, keyboard/a11y
  preserved); labels/values unchanged.
- Verdict at section-title size; clickable category filter chips
  (`aria-pressed`) driving the existing filter; counts line kept.
- H1 stays “Compare versions” (e2e depends on it) under a
  `DOCUMENT COMPARISON` eyebrow.

## Action Pack refinements

- Ready state opens with a mono provenance line (`Prepared from {title} ·
v{version}`); tabbed deliverable, checklist (44px rows, strike-through),
  copy/print kept.
- System notices converted from `Card` to the shared marker primitive.

## Review Guide refinements

- Same provenance line; tabs, same-tab/new-tab jump discipline, counsel
  quarantine unchanged; notices converted to the marker primitive.
- Settings sheet + command palette verified (hierarchy, dividers, danger
  separation, grouping) — no changes needed.

## Dark mode

- True dark capture `docs/screenshots/v2-home-dark-1440x900.png` (via the
  app’s `plainterms-theme` key): warm graphite background `#16181D`,
  brightened accent/AI/severity on deep washes, no neon. Retires the
  mislabeled `redesign-home-dark.png` (kept on disk, superseded).

## Responsive

- Sweep 25/25 zero horizontal overflow (5 routes × 1440×900, 1280×800,
  1024×768, 768×1024, 390×844) on the final tree.
- Ask rail stacks below conversation (composer first); Compare stacks;
  Review document-first; selects/pager wrap (prior 768px/375px fixes green).
- Known cosmetic: dense 390px rows (recorded, reachable, not a gate).

## Accessibility

- Preserved: skip link, arrow-key tabs, Esc, native selects/checkboxes,
  2px `var(--focus)` + forced-colors fallback, `::selection`, live regions
  and status roles, icon+word severity, 44px targets, reduced-motion
  collapse, print stylesheet.
- Axe serious/critical gates green on /, /documents, /review, /compare,
  /ask, /ready. Manual screen-reader pass still pending.

## Error states

- P0 fix (verified clean by independent review): `AITransientError` /
  `AIValidationError` now take only `requestId` with static messages;
  `gemini-client` no longer embeds SDK text (validation paths stay in
  server logs); `route-errors` dropped `requestId` from JSON bodies;
  hooks/renderers unchanged and now receive safe strings by construction.
  Server debuggability retained (requestId + issue excerpts in logs).
  Residual note: `app/api/documents` `processing-failed` body still carries
  a local UUID (unrendered, ignored by client) — out of scope, recorded.
- Six boxed notice Cards replaced by `components/ui/Notice.tsx` (title +
  detail + recovery action on a quiet marker). All asserted titles
  (“temporarily unavailable”, “didn’t complete/come back”) preserved.
- Severity discipline kept: neutral markers for system states (amber-error
  suggestion explicitly rejected); icon+word pairing retained.

## Visual QA

- format ✓ · lint ✓ · strict typecheck ✓ · production build ✓ (all green
  on the final tree, including the regression fix below).
- Vitest 199/199 (42 files, 15s timeout; no test file modified).
- Playwright 29/29 Chromium keyless dev (incl. axe gates + real
  PDF/DOCX/TXT uploads). Prod-build spot check: 8/9 subset + DOCX 1/1
  isolated (cold parallel-load flake, see below).
- 11 `docs/screenshots/v2-*` reviewed (5 routes × 1440×900 + 390×844, plus
  true dark): nav indicator, hero split, rail workspace, evidence rail, VS
  panel, dark parity confirmed; no clipping/overlap/broken type.
- No new dependencies, routes, or data flow; build shape identical.

## Regression results

1. **Evidence-rail link collision (mine, fixed in code).** The new rail
   rendered a second “Verify in document” link, so
   `getByRole(link, /Verify in document/)` matched 2× (ask.test:58). Fix:
   rail links read “Open source ↗” (AnswerCard keeps the asserted label).
2. **History-window cascade (same root cause, no extra fix).** With test 1
   aborting before its follow-up submit, the shared history window shifted
   and the recent-questions count read 3 instead of 2. Fix 1 restored the
   submit order; 5/5 green with zero test changes.
3. **DOCX prod timeout (load flake, not a bug).** One 90s timeout under cold
   4-worker parallel prod load; passes isolated on prod (1.3s) and always on
   dev. Ingest untouched by this pass.

## Remaining issues

- Manual screen-reader pass; live-model verification (needs key).
- Library text search/sort (new functionality — needs a plan, not a drive-by).
- Mobile row density polish (cosmetic).
- `processing-failed` local UUID in response body (unrendered; tidy later).
- README screenshot refresh + push/deploy URLs (owner actions).
- Explicitly rejected with rationale: 32px serif app H1s (compact titles per
  original brief); Sample-pill removal (demo labeling required); removing
  Compare/Ask from the review toolbar (wayfinding + tests); amber error
  cards (severity discipline); footer removal (legal disclaimer required).
