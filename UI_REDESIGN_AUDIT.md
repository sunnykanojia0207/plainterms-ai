# UI_REDESIGN_AUDIT.md — PlainTerms visual redesign audit (2026-09-14, uncommitted)

Evidence: `git diff HEAD` (39 tracked files), 4 new components, 6 screenshots in `docs/screenshots/redesign-*-*.png`, `app/globals.css`. No invented values; gates marked pending where unrun.

## 1. Current UI problems

- Token names drifted from usage: `bg-bg`, `text-text-primary`, `text-ai`, `bg-*-bg` severity pairs scattered across components; `--surface-elevated` vs shadow-based elevation ambiguous.
- Old palette (`--bg` #FAFAF8, `--accent` #1D4ED8, `--border` #E5E3DD) flatter and cooler than the warm-paper direction; no `--surface-muted`, `--border-subtle`, `--text-tertiary`, `--selection`, `--focus`, `--overlay` tokens.
- AI blocks hand-built per screen (`border-l-ai bg-ai-bg/40`, ad-hoc blockquotes) instead of one primitive; evidence wells hand-built (`border-evidence-border bg-evidence/40`) in 3+ places.
- Shell capped at `max-w-6xl`; Home single-column; capabilities list single-column; no EmptyState actions; Ask composer was a fixed `Input`.

## 2. New visual direction

- Warm paper + ink editorial system ("Phase 2a" header in `globals.css`): paper `--background` #FAF7F2, ink `--text-primary` #1A1C1E, restrained blue `--accent` #2F4BC2, restrained violet `--ai-accent` #6D28D9.
- Border-flat hierarchy (borders, not shadows) via the `Surface` primitive; shadows sm/md reserved for elevated sheets/dialogs; full `.dark` token set (no longer deferred).

## 3. Design system changes

- Token renames: `--bg`→`--background`, `--surface-elevated`→`--surface-raised`, `--ai`/`--ai-bg`→`--ai-accent`/`--ai-muted`, `--*-bg` severity→`--*-muted`; removed `--neutral*`, `--added/removed/changed*` pairs.
- New tokens: `--surface-muted` #F1EEE6, `--border-subtle` #ECE8DD, `--text-tertiary` #6F6A5E, `--accent-muted` #E8EDFB, `--selection` #D9E6FC, `--focus` #2F4BC2, `--overlay` rgba(26,28,30,.5).
- Class migration across ~30 files: `bg-bg`→`bg-background`, `text-text-secondary`→`text-secondary`, `text-ai`→`text-ai-accent`, `bg-ai-bg`→`bg-ai-muted`.
- New primitives: `Surface`, `AIInsight`, `EvidenceReference`, `ReviewSection`; `ComparisonDetail` and Action Pack evidence migrated onto `EvidenceReference`.

## 4. Typography changes

- `Inter` removed from `--font-ui` (now system stack only); `--font-doc` Georgia serif and `--font-evidence` system mono unchanged in family, now referenced consistently (`font-doc` quotes, `font-evidence` locations/refs).
- Scale grown: `--text-display` 1.75rem/2.25rem → 2.125rem/2.5rem; added `--text-page-title` and `--text-section-title` (1.375rem/1.875rem, 1.125rem/1.625rem).
- Detail polish in diff: `tabular-nums` on refs/counts/dates, `text-balance`/`pretty` on headings/body, serif hero heading on Home (`[font-family:var(--font-doc)]`).

## 5. Color changes

- Light: background #FAF7F2, border #E3DED2, text-secondary #5B5750 (was #5B6068), accent #2F4BC2 (was #1D4ED8), accent-hover #243B9E, success #166534/muted #E7F2E9, warning #7C4A0A/muted #FBF0D9, concern #92400E/muted #FBEEDC, critical #B42318/muted #FBE7E4 (was #B91C1C/#FEE2E2), evidence #E2EAFB/border #9AB4E6.
- Dark (new, full set): background #16181D, surface #1E2128, raised #262C36, text #F2EEE6/#B9B4A8/#98938A, accent #9DB4FA, ai-accent #C9B5F5, severity brights (#86D598/#E5B85C/#E8A45C/#F0968E) on deep muted washes.
- Focus: old `box-shadow: var(--focus-ring)` → `outline: 2px solid var(--focus) + 2px offset` (+ forced-colors fallback); `::selection` now `var(--selection)`.

## 6. Layout changes

- Shell `max-w-6xl` → `max-w-[1400px]` (`app/layout.tsx`); light/dark `themeColor` (#FAF7F2/#16181D), OpenGraph/Twitter metadata, favicon added.
- Home: single column → `max-w-6xl` two-column hero grid (copy + example document/insight cards); capabilities list → responsive 1/2/3-col grid; workflow steps → divided rows; example insight moved into hero.
- Review/Compare: `ReviewSection` caption headings (`text-xs uppercase tracking-wider border-b`); change anatomy `dl` → responsive 160px term grid on `sm+`; version panes → `EvidenceReference variant="plain"` grid.

## 7. Component changes

- `Surface` (new): `rounded-lg border border-border bg-surface`, no shadow — base for cards/panels.
- `AIInsight` (new): `rounded-md border border-border border-l-[3px] border-l-ai-accent bg-ai-muted`, uppercase `text-ai-accent` marker header, 15px/24px body.
- `EvidenceReference` (new): quote well + mono location + Verify/Jump action; `evidence` wash (default) vs `plain` surface (version panes); adopted by ComparisonDetail, ActionPack, AnswerCard paths.
- `ReviewSection` (new): caption heading + optional tabular count + slotted body; used across Review/Compare panels.
- Checklist rows: bordered cards → divided border-y rows, 44px+ touch rows, `size-5` checkboxes, strike-through on done; filter chips added; print stylesheet added (chrome hidden, 12pt serif).

## 8. Home redesign

- Two-column hero (`lg:grid-cols-2`): headline + CTAs + disclaimer left; example Independent Contractor agreement card (serif) + violet example-insight card (3px `border-l-ai-accent`) right.
- Reduced-motion-aware smooth scroll to `#home-upload` (focus moved, `tabIndex=-1`); EmptyState gains Upload CTA; Continue-review and recents restyled with new tone classes.

## 9. Documents redesign

- Library rows/tokens migrated (`text-secondary`, `bg-background` wells); upload flow copy/states unchanged; `DocumentsLibrary` diff is token-only (14 lines) — structure preserved.

## 10. Review redesign

- `IntelligencePanel` rebuilt on `AIInsight` + `ReviewSection` + `EvidenceReference` (159-line diff): review header, clause cards, obligations snapshot share one AI voice; counsel items stay in bordered quarantine style.
- `ReviewWorkspace` gains sectioned panel order + `ReviewSection` counts; viewer highlights unchanged (persistent span + gutter mark).

## 11. Ask redesign

- Fixed `Input` → auto-sizing `textarea.composer-input` (`field-sizing: content`, 44px–12rem); pending-question echo (`Q: …` + dashed status well) while retrieving; draft restored on cancel/error instead of cleared; scope bar and section-scope (`bg-ai-muted`) token-migrated; suggested-question chips unchanged in behavior.

## 12. Compare redesign

- `ComparisonDetail` v1/v2 panes migrated from hand-built `bg-bg` boxes to `EvidenceReference variant="plain"` with mono pane labels; anatomy `dl` → `sm:grid-cols-[160px_1fr]`; silence cards use default evidence wash + Jump action; verdict banner + materiality ordering unchanged.

## 13. Action Pack redesign

- Idle/loading wells token-migrated; counsel block `border-ai/40 bg-ai-bg/40` → `border-ai-accent bg-ai-muted`; checklist + item lists → divided rows with 44px touch targets, larger checkboxes, done strike-through; pack evidence blockquotes → `EvidenceReference`.

## 14. Review Guide redesign

- `ReviewGuidePanel` 40-line diff is token migration (`text-secondary`, `bg-background`, `bg-ai-muted`) + `ReviewSection` grouping; discussion topics, neutral questions, and counsel-quarantine structure unchanged.

## 15. Settings redesign

- `SettingsSheet` (34-line diff): token classes migrated, retention choice ("Keep for my review" vs "Session only") and delete controls unchanged; no new settings added.

## 16. Dark mode

- Full `.dark` token set now in `globals.css` (was deferred in spec §20); surfaces #1E2128/#262C36, warm-tinted text, brightened accent/AI/severity on deep washes; one dark screenshot present (`redesign-home-dark.png`).
- Gates: pending full QA run — no contrast-meter or per-screen dark verification claimed here.

## 17. Responsive behavior

- Shell 1400px cap; Home hero stacks below `lg`; capabilities 1/2/3 cols; change anatomy stacks below `sm`; Ask/Review panels follow existing viewer-first breakpoints (spec §18 unchanged).
- Gates: pending full QA run — 1024px / tablet / mobile passes not yet executed against the redesign.

## 18. Accessibility

- Kept: 2px visible focus (now `var(--focus)` + forced-colors fallback), `prefers-reduced-motion` collapse, 44px+ touch rows, severity icon+word pairing, live-region loading states, print stylesheet.
- Changed: `::selection` → `--selection`; composer labeled via `useId`.
- Gates: pending full QA run — keyboard-only, screen-reader, axe, and 200% text passes not yet executed against the redesign.

## 19. Performance

- Token-only + primitive-level changes; no new dependencies, routes, or data flow; `font-display` unchanged (system stacks, offline-safe).
- Gates: pending full QA run — no build/lighthouse/viewer-scroll measurements claimed here.

## 20. Screenshots reviewed

- Present (6, untracked): `redesign-home-light.png`, `redesign-home-dark.png`, `redesign-documents-light.png`, `redesign-review-light.png`, `redesign-ask-light.png`, `redesign-compare-light.png`.
- QA run 2026-09-14 added `qa-home-1440.png` + `qa-review-1440.png` (fresh, post-fix): Home shows the two-column hero (serif contract card + violet insight); Review shows the three-region shell. The older `redesign-home-light.png` predates the hero contract-preview card (single column, no preview) — superseded by `qa-home-1440.png`.
- Mislabeled: `redesign-home-dark.png` is byte-identical to `redesign-home-light.png` (same 137451 bytes, light content) — NOT a dark-mode screenshot. Dark parity rests on token inspection only; a true dark screenshot is still pending.
- Legacy set retained: `01-home.png` … `05-documents.png`. No pixel-level assertions made in this audit — files listed as evidence only.

## 21. Regressions found/fixed

- `FINAL_QUALITY_AUDIT.md` §15 ("class-only … No token changes … spec §§20–25 unchanged") is now false — the redesign changed tokens, radii, durations, and focus; corrected by this audit's companion spec amendment (see report).
- No code regressions asserted: diff preserves normative behavior text, copy, routes, and pipeline internals; verification gates pending full QA run.

## 22. Final visual QA checklist

- [x] Full QA run executed 2026-09-14 (keyless): format ✓, lint ✓, strict typecheck ✓, production build ✓, Vitest 198/199 (1 cold-start timeout flake in `ask.test.tsx`, passes isolated + at 15s timeout — not a regression), Playwright 29/29 Chromium (12 a11y/app + 17 keyless AI-unavailable paths) ✓, axe serious/critical gates ✓ (within those 12).
- [x] Overflow sweep 20/20 (5 routes × 1440/1024/768/375): two redesign regressions found and fixed — Compare picker grid at 768px (Select root lacked `min-w-0`, native select sized to longest option) and Review pager row at 375px (`flex` without `flex-wrap`). Fixes: `Select` root `min-w-0` + `w-full max-w-full`, pager `flex-wrap`. Related component tests (compare/shell/review-guide, 17 tests) pass post-fix.
- [x] Light token spot-check on redesigned Home + Review vs `globals.css` hex (fresh 1440px screenshots) — pass.
- [ ] Dark token spot-check per screen — blocked: `redesign-home-dark.png` is mislabeled light content; no true dark screenshot taken.
- [ ] AI voice vs document voice non-interchangeable on 10 screens (§9 five layers) — pending full QA run.
- [ ] Citation jump + highlight pulse, dual v1/v2 jumps, scope bar, composer echo — pending full QA run.
- [ ] Keyboard-only, screen-reader/live-region, 200% text, reduced-motion passes — pending full QA run (no regressions expected: axe gates green, focus/ARIA markup untouched by the two overflow fixes).
- [ ] README screenshot refresh (legacy 01–05 vs redesign set) decided — pending owner call.

## 23. QA environment note (2026-09-14)

- The 6 keyless e2e failures first observed were environmental, not redesign regressions: a local `.env` containing a `GEMINI_API_KEY` forced live-model retries (→ error state) instead of the expected honest unavailable state (503). With `.env` set aside (keyless, matching CI/release), all 29 e2e pass. No test was weakened; `.env` was restored afterwards.
- The sweep helper (`scripts/qa-sweep.mjs`) was deleted after use; its results are recorded above.
