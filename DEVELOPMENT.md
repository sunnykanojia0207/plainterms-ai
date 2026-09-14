# DEVELOPMENT.md — PlainTerms foundation

## Prerequisites

- Node.js 20+ (developed on Node 24), npm 10+
- Playwright Chromium downloads automatically on first e2e run
  (`npx playwright install chromium`)

## Daily workflow

```bash
npm run dev          # develop at http://localhost:3000
npm run validate     # format:check + lint + typecheck + unit/component/integration tests
npm run test:e2e     # Playwright (starts its own dev server on :3110)
```

Run `npm run validate` before every commit. Run `npm run test:e2e` before
every milestone handoff.

## Working with live AI review

1. Add `GEMINI_API_KEY` to `.env.local` (see `ENVIRONMENT.md`) and restart `dev`.
2. Upload any valid file on Home → Processing → Ready → Review.
3. The intelligence panel should assemble: header, summary, findings,
   obligations, dates. Every finding needs a working "View in document" jump.
4. Manual checks per milestone: successful analysis; invalid response (break
   a quote in a proxy or use `?outcome` harnesses where available); timeout
   (throttle network); revoked key (expect the unavailable state, never a
   crash); prompt-injection text in a document (model must ignore it — see
   `tests/unit/prompts.test.ts` for the automated counterpart); retry after
   failure; cache reuse on second load (no new model call).
5. Manual comparison checks (needs a key): open Compare with the seeded V1 +
   V2 samples and verify Net 15 → Net 30, 6 → 12 month restriction, the
   removed late-fee silence finding, the added extension sentence, and that
   confidentiality is counted unchanged; open every V1/V2 jump in a new tab
   and confirm the landing section; confirm uncertain findings are not
   overstated; re-run to confirm the cache serves instantly.

## Working with Ask With Evidence

- **Setup:** same `GEMINI_API_KEY` as above. Q&A prompt version is
  `legal-document-qa-v1` (see `lib/ai/config.ts`); temperature 0.2.
- **Sample questions (V1 sample):** "What are my payment terms?" (fact),
  "Who owns the work after payment?" (fact), "When can the agreement be
  terminated?" (fact), "How long is the restrictive clause?" (fact, expect
  the V1 6-month value), "Does this contract violate California law?"
  (out-of-scope shape), "What does the agreement say about dragons?"
  (insufficient-information shape), "What happens if payment is late?"
  (answer only if supported).
- **Safety behavior:** substantive answers always carry quotes; anything
  else renders the safe insufficient / out-of-scope / unrelated shapes with
  no evidence list. Banned language lives in `tests/unit/qa-schemas.test.ts`
  only as model-facing prohibitions, never in UI copy.
- **Manual verification checklist (needs a key):** run all 7 sample
  questions above; verify every quote against the source viewer; confirm
  the 6-month (not 12-month) value on the V1 doc; confirm the California
  question yields counsel guidance, not an answer; confirm the dragons
  question yields the insufficient message; ask a follow-up with a pronoun
  ("What happens if they pay late?") and confirm scope holds; open a V1+V2
  compare scope and ask "What changed about payment?" expecting both
  evidences; revoke the key mid-session and confirm the unavailable state.
- **Known limitations:** retrieval is keyword-based (no embeddings yet);
  conversation memory is the last 3 turns with trimmed summaries; answers
  are not persisted (history stores questions + status only); multi-doc
  scope attributes quotes by text matching, so identical quotes across
  versions attribute to the first containing document.

## Working with the Action Pack

- **Setup:** same `GEMINI_API_KEY` as above. Prompt version is
  `action-pack-v1` (`lib/ai/config.ts`); the pack reuses the cached
  document analysis, so generating twice costs one analysis + one pack call.
- **Sample outputs (V2 sample):** an obligation ("Client must pay invoices
  within 30 days"), a date ("Agreement end — December 31, 2026"), a review
  item (unlimited indemnity), a clarify question ("Can you confirm whether
  the 30-day payment term is negotiable?"), a lawyer question (practical
  effect of the 12-month restriction), checklist items (payment terms,
  termination notice, IP transfer, party details, dates), and info-needed
  entries ("Not stated in the document").
- **Grounding rules:** every obligation/date/review/clarify/lawyer item
  requires quoted evidence validated against the section text; checklist
  items may frame confirmations; info-needed items report absence. Invalid
  items are dropped with counts logged, never displayed.
- **Safety behavior:** priorities communicate importance, never alarm;
  lawyer items render under a "for discussion with a qualified legal
  professional" banner; the pack never directs signing or states legal
  conclusions.
- **Manual verification checklist (needs a key):** generate the pack on the
  V2 sample and confirm grounded items for payment, termination, IP,
  restrictions, liability, disputes, and dates; open every View-source jump
  and confirm the landing section; confirm uncertain items carry
  uncertainty wording; confirm Copy produces the Markdown brief and Print
  opens the print dialog while Export PDF stays disabled; regenerate and
  confirm instant cache reuse; revoke the key and confirm the unavailable
  state preserves the document.
- **Gemini configuration:** temperature 0.2, 45s timeout, 2 transient
  retries + 1 validation repair, cache keyed on document + version +
  action-pack/analysis/clause prompt versions + model.
- **Limitations:** no comparison-findings input yet (document-only packs);
  checklist checks live in component state (not persisted); Markdown copy
  and print are real, PDF export awaits the export backend.

## Working with the Review Guide

- **Setup:** same `GEMINI_API_KEY` as above. Prompt version is
  `review-guide-v1` (`lib/ai/config.ts`); the guide reuses the cached
  analysis and, when a second document is chosen, the existing comparison
  engine — nothing is recomputed in parallel.
- **Example outputs (V2 sample + V1 compare):** a topic (payment timing),
  a party question ("Can you confirm whether the 30-day payment term is
  intentional?"), a lawyer question (practical effect of the restriction,
  quarantined for counsel discussion), a clarification ("Could you clarify
  when ownership transfers?"), a confirm item (governing jurisdiction, no
  evidence), and checklist items (payment timing, termination notice, IP
  transfer, dates).
- **Safety behavior:** questions stay neutral with no demanded outcomes;
  lawyer items render under a professional-discussion banner; priorities
  communicate importance, never alarm; uncertainty wording is preserved.
- **Evidence rules:** every topic/party/lawyer/clarification/checklist
  item requires quoted evidence validated against its owning document
  (primary or compared); confirm items report absence. Invalid items drop
  with counts logged.
- **Comparison integration:** the optional second document flows through
  `compareDocuments` (cached); its changes and silence findings enter the
  prompt with priority, and compared-document evidence jumps open the
  other document in a new tab to preserve context.
- **Manual verification checklist (needs a key):** generate document-only
  and V1+V2 guides on the samples; confirm Net 15 → Net 30 and 6 → 12
  appear as topics; confirm removed language is represented cautiously;
  confirm questions are neutral and counsel items quarantined; open every
  source jump (same-tab and new-tab); confirm copy-all/section copy,
  print, and disabled PDF export; regenerate for cache reuse; revoke the
  key for the unavailable state.
- **Known limitations:** no negotiation automation; checklist/confirm
  states are not persisted; Markdown copy and print are real, PDF export
  awaits the export backend.

## Code quality contract

- Strict TypeScript: `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`,
  `noUnusedParameters`. No `any`. No unnecessary assertions.
- `console.log` is banned by lint. Use `lib/privacy/log.ts`, which strips
  content-like keys and truncates long strings.
- No dead code, no unused imports, no duplicated domain models, no giant
  files. Keep modules small and dependency direction per `ARCHITECTURE.md`.
- Prettier (2-space, double quotes, 100 cols) is enforced by
  `format:check` in `validate`.

## Design system usage

- All color comes from tokens in `app/globals.css` (`bg-bg`, `text-text-primary`,
  `border-border`, `bg-accent`, `text-ai`, severity `bg-*-bg`/`text-*` pairs…).
  Never add hex values in components.
- Typography roles: default UI sans; `.font-doc` (serif) for original legal
  text only; `.font-evidence` (mono) for clause IDs and references.
- Severity and confidence always render icon + word via `Badge`/`SeverityTag`
  and `lib/domain/vocabulary.ts` — never color alone, never inline strings.
- New reusable visuals go in `components/ui/`; feature-specific components
  wait for their feature milestone.

## Testing

- `tests/unit` — pure logic (Vitest, Node): validation, guards, vocab, logging,
  plus AI prompt/evidence/schema/content/cache units.
- `tests/integration` — AI pipeline with a mocked Gemini SDK: validation,
  evidence filtering, repair, retries, unavailable, caching.
- `tests/components` — behavior (Testing Library + user-event, jsdom):
  rendering, keyboard interaction, dialogs, toasts, theme persistence.
  `next/link` and `next/navigation` are mocked in `tests/setup.ts`.
- `tests/e2e` — Playwright Chromium: boot, all routes, keyboard flow,
  settings dialog, fixture + real-file upload journeys
  (`documents.spec.ts` uses committed `tests/fixtures/` files), plus axe
  scans (`a11y.spec.ts`) gating serious/critical violations on every route.
- Do not write business-logic tests for unimplemented features. Test
  structure, contracts, and honesty of empty states instead.

## Working with real document ingestion

- **Supported types:** PDF (text layer via unpdf), DOCX (mammoth
  document.xml text), TXT (strict UTF-8). Limits live in
  `lib/documents/limits.ts`: 25 MB, 200 pages, 500k chars, 60s parse
  budget, 60-minute server record TTL.
- **Test fixtures:** `tests/fixtures/sample-agreement.{pdf,docx,txt}` are
  generated by `scripts/generate-test-fixtures.mjs` (devDeps `pdf-lib` +
  `docx`) and committed. Regenerate with `node scripts/generate-test-fixtures.mjs`.
- **Manual verification (no key needed for parsing):** upload each fixture
  via Home and confirm Ready shows real titles/sections; open Review and
  confirm the marker text renders with section navigation; upload a
  scanned/image-only PDF and confirm the honest no-text state; upload an
  `.exe` renamed to `.pdf` and confirm rejection; upload a 26 MB file and
  confirm the size error; delete a document and confirm it disappears; ask
  and compare against an uploaded doc once a key is available.
- **Known parser limitations:** no OCR (scanned PDFs report no-text);
  PDF paragraphing is geometry-heuristic; DOCX complex tables flatten to
  `cell | cell` rows; footnotes/headers may merge into body text;
  password-protected PDFs are refused, not unlocked; records are
  in-memory (lost on server restart) with tab-local client state.

## Adding a feature milestone (example: document upload)

1. Define/extend domain types in `lib/domain/types.ts` (nowhere else).
2. Implement the matching `lib/services/*` interface (`lib/ai/*` for
   Gemini-backed capabilities, always server-side).
3. Build feature components in `components/<feature>/` consuming only
   `components/ui` primitives + domain types.
4. Wire routes to the service interface, keep keys server-side.
5. Add unit + component + e2e coverage, including empty/error states and
   keyboard paths. Keep `npm run validate` green.
