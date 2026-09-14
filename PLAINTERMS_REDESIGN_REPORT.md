# PLAINTERMS_REDESIGN_REPORT.md — “Editorial Intelligence” (2026-09-14)

> Second redesign pass. The first pass (UI_REDESIGN_AUDIT.md) established the
> token system; this pass fixes spatial composition, information architecture,
> and workspace structure. No business logic, prompts, evidence rules, API
> contracts, or security behavior changed. No test was weakened.

## 1. Before-state problems

1. **Empty viewport.** Narrow centered columns (max-w-3xl/6xl) left large blank
   gutters; pages read as unfinished marketing sites, not tools.
2. **Weak identity.** Interchangeable SaaS starter look; nav active state was a
   flat tint with no indicator; footer competed with the app.
3. **Oversized page titles.** Every route rendered 2.125rem display headings
   (“Documents”, “Ask”, “Compare versions”, document titles in the toolbar).
4. **Form-builder feeling.** Outlined select + outlined button stacks on Ask
   and Compare; centered single-column flows everywhere.
5. **Card soup.** Every document row was an individual bordered card;
   suggestions/answers/scopes were visually interchangeable boxes.
6. **Sidebar AI.** Intelligence lived in lookalike stacked cards beside the
   document instead of an integrated reading environment.
7. **Mislabeled dark evidence.** `redesign-home-dark.png` was byte-identical
   to the light screenshot — dark parity was unverified.

## 2. New design direction — “Editorial Intelligence”

Editorial reading + modern productivity software + document intelligence +
subtle AI assistance. Quiet, premium, confident, precise, human. Document =
source (serif, authoritative), AI = interpretation (restrained violet marker,
never decoration), user actions = obvious and minimal. 21st.dev / Taste Skill
used for principles only (craft, spacing discipline, motion restraint,
dark-mode parity); nothing copied.

## 3. New design tokens

No new colors — the existing semantic system already covers the brief
(background/surface/raised/muted, border/subtle, 3 text tones, accent,
AI-accent, 4 severities, evidence, selection, focus, overlay, radii
6/12/22, durations 120/220/300ms). Changes: `Heading` gained a
`page`/`display` variant so only the Home hero uses display size;
`Button` gained `align="start"` for rail lists (no conflicting overrides —
`cn` is a plain joiner, so props replace classes structurally instead).

## 4. Shell redesign

- Canvas widened to 1440px with `lg:px-8` gutters; per-page caps (Home 7xl,
  Documents 5xl, Ask/Compare 6xl) instead of one narrow measure.
- TopNav: 56px (h-14) bar, 1440px container; active link keeps the subtle
  tint but adds semibold text + inset 2px accent indicator
  (`shadow-[inset_0_-2px_0_var(--accent)]`, no layout shift).
- Footer reduced to a subtle tertiary strip (`border-subtle`, py-3); legal
  disclaimer text unchanged.

## 5. Home redesign

- Eyebrow (`PLAINTERMS · CONTRACT INTELLIGENCE`), display hero kept,
  supporting copy tightened to the brief’s sentence; formats + doc types in
  one restrained metadata line.
- Capabilities: 5 editorial blocks with small accent markers (no colorful
  tiles), 2/3-col grid.
- Recents/Continue: compact table rows (see §6) instead of giant cards;
  container widened to 7xl so the hero split breathes.

## 6. Documents redesign

- Header: `LIBRARY` eyebrow, compact title, one-line subtitle, primary
  Upload button, divided header rule.
- `DocumentRow` is now a table row: § glyph (sm+), title + mono metadata
  line (`v1 · 6 pages · Updated Sep 14, 2026`), type/status/sample badges,
  Open/Compare/Delete on hover-tinted rows (`hover:bg-surface-muted`).
- Lists render as one divided bordered panel (`divide-y`), not card stacks.
- Deferred (no new features per constraints): text search + sort; tabs
  remain the filter bar.

## 7. Review redesign

- Toolbar: document title truncates at compact page-title size with inline
  type/page badges + mono version tag; pager row wraps (fixes the 375px
  overflow found last session).
- Grid unchanged in structure (15rem / 1fr / 23.75rem) — it already matched
  the brief’s rail widths; viewer gained `shadow-sm` paper elevation.
- Panel header is now “PlainTerms review” + “AI-assisted understanding —
  every claim cites its source.” Loading copy dropped the repeated
  “Gemini ·” prefix (✦ mark retains attribution); all asserted copy
  (“PlainTerms reviewed this document”, unavailable/error states) untouched.

## 8. Ask redesign

- Two-region workspace (`17rem` rail + conversation, `max-w-6xl`): rail
  holds scope card, document/compare selects, section chip, vertical
  “Try asking” list, recent questions; main holds thread + composer.
- Composer is now an elevated panel (surface, border, `shadow-sm`) with
  keyboard hint (`Enter to send · Shift + Enter`) and larger textarea.
- Empty state introduces the agreement + evidence promise instead of a bare
  form; evidence stays inline per answer (contextual jumps beat a detached
  third column — documented decision, not a missing panel).

## 9. Compare redesign

- Setup is now a connected instrument panel: V1 select · VS badge + Swap ·
  V2 select, on a raised surface card. All labels/values preserved.
- Verdict renders at section-title size; navigator/detail/silence structure
  unchanged (already the strongest redline treatment).

## 10. Action Pack redesign

- Ready state opens with a mono provenance line (`Prepared from {title} ·
v{version}`); tabbed deliverable structure, checklist, copy/print kept.
  Reads as a prepared report, not a web page section.

## 11. Review Guide redesign

- Same provenance line; tabs (Discuss/Questions/Clarify/Checklist family),
  same-tab/new-tab jump discipline, and quarantine styling unchanged.

## 12. Settings redesign

- Sheet already had section hierarchy, dividers, and separated danger
  action — verified, no changes needed. Command palette likewise verified
  (grouped pages/documents/sections/commands + shortcuts); untouched.

## 13. Responsive redesign

- Sweep: 5 routes × 5 viewports (1440×900, 1280×800, 1024×768, 768×1024,
  390×844) — **25/25 zero horizontal overflow**.
- Ask rail stacks below conversation on mobile (composer first);
  Compare panel stacks; Review collapses to document-first per existing
  breakpoints; pager/selects wrap (prior overflow fixes verified still
  green: `Select min-w-0`, pager `flex-wrap`).
- Known cosmetic item (no overflow, actions reachable): 390px document rows
  are dense (truncated titles + wrapped badges). Deferred, not a gate.

## 14. Dark mode

- True dark capture added (`v2-home-dark-1440x900.png`, via the app’s own
  `plainterms-theme` key): same product, warm graphite surfaces, brightened
  accent/AI/severity on deep washes, no neon. This retires the mislabeled
  `redesign-home-dark.png` (kept on disk, superseded).

## 15. Accessibility

- Preserved: skip link, arrow-key tabs, Esc handling, native
  selects/checkboxes, visible 2px focus, focus restore, live regions
  (thread `aria-live`, status roles), severity icon+word pairing, 44px
  targets, reduced-motion collapse, print stylesheet.
- Axe serious/critical gates green on /, /documents, /review, /compare,
  /ask, /ready (Playwright `a11y.spec.ts`).
- Manual screen-reader pass still pending (unchanged limitation).

## 16. Performance

- No new dependencies; no new routes; no data-flow changes. Edits are
  layout/class-level plus two small props. Build output identical in shape
  (12 static/dynamic routes as before).

## 17. Screenshots reviewed

- New (`docs/screenshots/v2-*`, prod build, keyless): home, documents,
  review, ask, compare @ 1440×900 and 390×844, plus true dark home @
  1440×900 — 11 files. Home/ask/compare/review/dark + mobile-documents
  inspected pixel-level: no clipping, overlap, or broken type; nav
  indicator, hero split, rail workspace, VS panel, and dark parity all
  confirmed visually.

## 18. Regressions found/fixed

1. **Hydration crash (mine, fixed).** The new row metadata used
   `toLocaleDateString` during SSR while the client store rehydrates from
   sessionStorage → text mismatch → hydration failure → dead navigation
   (“Open review” click did nothing, upload flows stalled). Fix: one
   `suppressHydrationWarning` on that element (the React-endorsed hatch for
   timestamps). Lesson recorded: never render store-derived dates as SSR
   text without the guard.
2. **DOCX prod timeout (flaky, not a bug).** One 90s timeout under 4-worker
   cold-prod parallel load; passes in isolation on prod in 1.3s and
   everywhere on dev. In-memory store + cold mammoth under parallel load;
   no code path implicated (ingest untouched by this pass).
3. C2/C3 check: `Button align` and `Heading variant` add props instead of
   class overrides because `cn` has no tailwind-merge — verified default
   Button output is class-identical to before.

## 19. Final visual QA

- [x] format ✓ · lint ✓ · strict typecheck ✓ · production build ✓
- [x] Vitest **199/199** (15s timeout; no files modified)
- [x] Playwright **29/29 Chromium keyless dev** (incl. axe gates + real
      PDF/DOCX/TXT uploads) — after the hydration fix
- [x] Prod-build spot e2e: 8/9 subset + DOCX 1/1 isolated (see §18.2)
- [x] Overflow 25/25 · screenshots 11 reviewed · dark truly captured
- [ ] Manual screen-reader pass · live-model verification (need key;
      unchanged, tracked in LIVE_GEMINI_VERIFICATION.md)
- [ ] Mobile row density polish (cosmetic, §13)
- [ ] README screenshot refresh + push/deploy URLs (owner actions in
      SUBMISSION_READY.md)

_Success criteria (§12 of the brief): no template look, no card soup, no
purple excess, compact titles, document-dominant Review, signature Compare,
evidence-workspace Ask, product Home, professional Documents, deliverable
Action Pack, one design system — all met except the cosmetic row-density
item, which is recorded above._
