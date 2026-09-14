# PLAINTERMS_SCREEN_UX_BLUEPRINT.md

> **Status:** Screen-level UX output — Prompt 3 of the PromptWars legal GenAI challenge.
> Sources of truth: `LEGAL_GENAI_PRODUCT_BLUEPRINT.md` (Prompt 1) and
> `PLAINTERMS_UI_UX_SPECIFICATION.md` (Prompt 2). Nothing about the product concept, persona
> (freelancer reviewing client contracts), document scope (Service Agreements, NDAs, SOWs), or the
> five MVP capabilities (Understand, Clause Intelligence, Ask With Evidence, Compare, Action Pack)
> is changed or expanded here.
> No application code was written, modified, or installed to produce this document.

**Product:** PlainTerms — *"Know what you're signing."* **Demo:** "v2 ambush."

---

## 1. Screen Inventory

Exactly 15 screens/sheets — no more, no fewer. Each maps to one journey stage:

| # | Screen | Journey stage | Primary capability |
|---|---|---|---|
| 1 | Home | Landing | Entry |
| 2 | Upload | Upload Document | Understand (intake) |
| 3 | Processing | Processing | Understand (pipeline) |
| 4 | Document Ready | Document Ready | Understand (overview) |
| 5 | Review | Understand → Clause Intelligence | Understand + Clauses |
| 6 | Clause Detail | Clause Intelligence (focused) | Clauses |
| 7 | Ask With Evidence | Ask With Evidence | Q&A |
| 8 | Compare Setup | Compare Version 2 | Compare (setup) |
| 9 | Comparison | Semantic Changes | Compare |
| 10 | Change Detail | Semantic Changes (focused) | Compare |
| 11 | Silence Detection | Silence Detection | Compare (gaps) |
| 12 | Action Pack | Action Pack → Questions for Lawyer | Actions |
| 13 | Documents Library | Return / manage | Library |
| 14 | Ask Workspace | Broad Q&A | Q&A |
| 15 | Settings Sheet | Preferences | System |

---

## 2. Primary Navigation

Five destinations, persistent left rail (desktop, icon + label, ≤5 items, no flyouts): **Home · Documents · Review · Compare · Ask.** Settings opens as a sheet from the avatar/menu button — never a nav item. Badges allowed only for document status counts (e.g., "2 need attention"); no red-dot noise. Active state: accent underline + label weight, never color alone.

---

## 3. Home UX

- **Purpose:** answer "What can PlainTerms do for me?" in under 5 seconds and route to Upload or Compare.
- **Layout (single column, max 720px, generous whitespace):** product mark + tagline → primary CTA **"Review a document"** → inline dropzone → secondary CTA "Compare two versions" (text-button) → Continue review (≤3 recent docs w/ status chips + key-finding one-liners) → "What PlainTerms can help with" (5 plain rows) → static labeled example-insight miniature → trust line (*"Private to you. Used only for your review. Delete anytime."*).
- **States:** empty (first run — example row emphasized) / returning (recents populated) / error (failed-processing doc shows retry inline). Loading: skeleton recent-rows only.
- **A11y/responsive:** full keyboard path CTA-first; mobile stacks identically (this screen is already single-column).
- **Back/keyboard:** Home is a nav root — Back exits to Home, never into dead ends. `/` focuses nothing here (no search); `u` opens Upload.

---

## 4. Upload UX

- **Purpose:** get a PDF/DOCX/TXT into the pipeline with zero anxiety.
- **Layout:** centered card: large dropzone (drag-over state: accent dashed border + "Drop to review"), Browse button, "use a recent file" shortcut row. Below: file-type pills (PDF · DOCX · TXT), size limit note, privacy reassurance with lock icon.
- **After file pick:** file row appears — name, type icon, size, remove control; primary CTA becomes "Upload document"; validation errors inline (unsupported type names the type + lists accepted; oversize states the limit + suggests compression).
- **Failure:** named cause + retry + "choose a different file"; user's other documents untouched.
- **A11y:** dropzone is a real button (keyboard + screen-reader operable); drag is enhancement-only. Success auto-advances to Processing with announcement.

---

## 5. Processing UX

- **Purpose:** make a 10–30 second wait feel intentional and trustworthy.
- **Five meaningful stages, no fake percentages, no technical jargon:** Uploading → Reading document → Understanding sections → Identifying clauses → Preparing review → Ready. Determinate bar only for upload (bytes known); pipeline stages use a step list with current-step emphasis.
- **Expectation copy:** "This usually takes about 20 seconds for a 15-page agreement. You can wait here — your review opens automatically."
- **States:** success auto-routes to Document Ready; failure names the cause (unreadable/scan-quality/unsupported) with retry + alternate-file actions; user may navigate away — processing continues, Home shows a quiet "Preparing…" row.
- **Motion:** low-contrast skeleton of the coming Review header behind the steps (shape-tease, not spinner-alone); fully static under reduced motion.

---

## 6. Document Ready UX

- **Purpose:** a 10-second confidence checkpoint before deep review: "we understood your document correctly."
- **Layout (single card, read top-down):** title + type badge + version → meta row (pages, parties if safely extracted, key dates if confidently extracted — each labeled with extraction confidence) → ~150-word plain summary → "Areas worth reviewing" (3–5 chips linking into Review) → primary CTA **"Review document"** + secondary "Compare another version."
- **Correction path:** "Something look wrong?" link opens document-type picker (Service Agreement/NDA/SOW) and party-name correction — human-in-control from the first screen.
- **Error/uncertain states:** low-confidence fields show "Couldn't confirm — verify in Review" rather than guessing; unclassified documents get an explicit scope notice, not a forced fit.

---

## 7. Review UX

**Core screen. Three regions, 15 / 55–60 / 25–30. Document dominates.**

- **Top toolbar (sticky, uncrowded):** doc name + type badge + status chip · search-in-document · page nav (current/total + jump) · zoom · Compare button · Ask button · overflow (rename/export/delete). Two-button AI entry max — no toolbar sprawl.
- **LEFT — section nav:** outline tree (sections → clauses) with per-item status dots (unread / reviewed / flagged + severity icon-label); click scrolls viewer; `]`/`[` moves between flagged items; collapsible to icon rail on narrow widths.
- **CENTER — viewer:** continuous scroll default; clause spans highlighted (neutral/flagged/active); click highlight → loads clause in panel; text selection offers "Ask about this selection"; search matches counted with prev/next; metadata bar collapsible.
- **RIGHT — intelligence panel (fixed section order):** (1) Gemini review header, (2) important findings, (3) potential concerns, (4) key obligations snapshot, (5) important dates, (6) recommended review areas. Every item = What → Why it matters → Evidence chip → Confidence → Action link. Panel scrolls locally; toolbar + header stay fixed.
- **States:** loading = skeleton clause cards; streaming = text-only AI assembly with "Reviewing…" label; error = partial deterministic content shown + labeled retry for AI parts; empty (no flags) uses mandated neutral wording.
- **Back:** Back from Review → Document Ready (context preserved), then Home. Clause selection, page, and scroll persist across workspace switches.

---

## 8. Clause Detail UX

- **Purpose:** focused inspection of one clause without losing the document.
- **Presentation:** opens as an expanded panel state (desktop: right panel takes focus mode; tablet/mobile: sheet) — never a new page, so context is never lost.
- **Five quarantined layers, stacked in fixed order, visually non-mergeable:** (1) ORIGINAL LEGAL TEXT — serif quote block, clause ID + location header, authoritative styling; (2) AI INTERPRETATION — violet-ruled AI card; (3) GENERAL INFORMATION — "Background" note; (4) POTENTIAL OPTION — action rows; (5) QUESTION FOR COUNSEL — bordered counsel block. Each layer labeled in words, not just styling.
- **Actions:** "View in document" (jump + pulse), "Ask about this clause" (prefills Ask scoped to clause), "Add to negotiation checklist," copy-quote, dismiss-interpretation (user control; dismissal logged, source untouched).
- **A11y:** layer headings are real headings; quote exposed as blockquote; focus moves to the layer title on open and returns on close.

---

## 9. Ask With Evidence UX

- **Purpose:** answer document questions with verifiable evidence — the anti-chatbot screen.
- **Layout:** scope bar (document pills + mantra *"Don't just trust the AI. Verify it against the document."*) → answer thread (one question → one evidence-rich answer block, newest last, no endless chat log aesthetic) → bottom-docked composer ("Ask about this agreement…").
- **Answer anatomy:** answer → source chips (§7.2 · §9.1) → collapsible quoted text → "why these clauses" explanation → uncertainty row (confidence + ambiguities + silence notes) → follow-up suggestions → counsel link when relevant.
- **Suggested prompts** (document-derived, shown in empty state): "What are my termination obligations?" / "When do I get paid?" / "Can the client end the agreement early?" / "Is there a non-compete?" / "What changed from the previous version?" (last only when a v1 exists).
- **Behavior:** chips jump the viewer (split or linked mode) and pulse the span; unsupported questions get a boundary-respecting redirect ("I can answer from the document — here's what it does say about X — plus a question for counsel"); history is per-document, clearable, never cross-document.

---

## 10. Compare Setup UX

- **Purpose:** make "which two versions?" effortless and unambiguous.
- **Layout:** two large slots — **Version 1 (earlier)** and **Version 2 (later)** — each accepts upload-new or pick-existing (type/version labels shown); swap control between slots; "comparison readiness" checklist (two docs selected → same-type check → ready).
- **Guards:** mismatched types trigger an explicit confirm ("Service Agreement vs NDA — compare anyway?"); identical files trigger "These look like the same document"; missing v1 offers "Review v2 alone first."
- **Primary CTA "Compare versions"** enabled only when ready; secondary "Back to Review" preserves all context.

---

## 11. Comparison UX

**Demo centerpiece. Verdict-first, materiality-ordered, evidence-always.**

- **Layout:** verdict banner (one plain sentence + top-3 driver chips) → filter row (All / Material only / Added / Removed / Changed; Unchanged collapsed to a count) → change cards in materiality order → viewer zone (split v1|v2 mini-viewers on desktop; single viewer + version toggle on smaller screens).
- **Each change card:** structured old → new facts (never raw diff blobs), e.g. "NET 15 → NET 30," with materiality + direction tags (icon + word) and dual jump links ("View in v1 §7.1" / "View in v2 §7.3").
- **Every visual difference carries Gemini's practical-meaning line** ("You'd wait twice as long to get paid, with no late fee added") — color never stands alone.
- **States:** no-material-changes → "No material differences found between these versions" + cosmetic list collapsed; alignment-uncertain pairs labeled as such; loading streams cards as classified.

---

## 12. Change Detail UX

- **Purpose:** full understanding of one material change (expanded card / focused sheet, same anatomy everywhere).
- **Fixed order:** Original (v1 quote + location) → New version (v2 quote + location) → What changed (one sentence) → Why it matters (freelancer-framed, quantified where possible) → Potential implication (trigger scenario) → Question to consider → Recommended next step (option-styled + "Add to negotiation checklist").
- **Primary action "Jump to clause"** offers v1 / v2 picker; jumps highlight both spans in split view.
- **A11y:** quotes as blockquotes with version labels as headings; direction/materiality announced as text.

---

## 13. Silence Detection UX

- **Purpose:** make absence visible without manufacturing certainty.
- **Dedicated section** (in Compare, mirrored as "Gaps" in Review) with dashed-border cards + missing-piece icon. Headline pattern: *"Termination notice language found in Version 1 was not found in Version 2."*
- **Three states, never conflated:** **Removed** (confident — context matched, clause gone) / **Not found** (no match; may be restructured) / **Uncertain** (structure too broken to judge — reason stated).
- **Body per card:** what the language used to do (v1 quote) → why absence could matter → what to verify (concrete check + question for the other party).
- **Safety:** no legal conclusions; "Uncertain" cards are visually equal citizens, not footnotes.

---

## 14. Action Pack UX

- **Purpose:** convert understanding into a before-signing workflow and a one-page exportable brief.
- **Sections in order:** Key obligations (owner-tagged checklist w/ clause links) → Important dates (timeline rows, deterministically computed, source-linked) → Items worth reviewing (residual flags) → Negotiation points (ask + fallback + leverage note + copy-ask email wording) → Questions for the other party → Information still needed (gaps user must fill) → Before-signing checklist (user-checked progress, never auto-completed) → Lawyer brief (counsel-quarantined: prioritized questions + concern + ambiguous text + what resolution unlocks).
- **Export:** one-tap PDF/markdown one-page brief; per-item copy; export preserves citation references.
- **Empty/partial:** if nothing flagged, obligations + dates still render (there is always *something* owed); missing inputs listed honestly under "Information still needed."

---

## 15. Documents UX

- **Purpose:** return to work in progress — a shelf, not a management suite.
- **Groups:** Recent · In Review · Compared · Archived (archived collapsed by default).
- **Row anatomy:** title + type badge + version tag → last-reviewed + status chip → key-finding one-liner → key-date badge if any → actions (Open / Compare / Delete) as icon-buttons with labels on hover/focus.
- **Rules:** no folders, no tags, no search-across-content in MVP (title filter only); delete confirms once, then toasts with undo window; opening restores full context (doc, page, clause, compare state).

---

## 16. Ask Workspace UX

- **Purpose:** the broader Q&A surface for cross-cutting questions (clause + comparison + action-pack follow-ups) while staying document-grounded.
- **Same answer anatomy as Screen 7**, plus: multi-document scope pills (answers label which document each citation comes from), conversation history (per-scope, clearable), and "Generate Action Pack section" shortcut that routes a verified answer into the pack.
- **Grounding guardrails:** scope bar always visible; switching scope announces the change; questions outside all scoped documents get the boundary redirect, never a general-knowledge answer dressed as document fact.

---

## 17. Settings Sheet UX

- **Lightweight sheet (not a page), grouped, ~7 rows:** Appearance/text size (incl. dyslexia-friendly reading options) · Language (UI language; MVP: English + note on document language support) · Accessibility shortcuts · Privacy (retention choice, "delete my documents," what's stored) · AI preferences (answer verbosity, streaming on/off) · About (version, safety notice, "not legal advice" statement).
- **Rules:** every row explains itself in one line; destructive actions (delete-all) confirm + toast-undo; sheet dismisses to the exact prior context.

---

## 18. Navigation Rules

- Five-rail order fixed: Home → Documents → Review → Compare → Ask. Review and Compare show a document-required empty state (with upload shortcut) when no document is loaded — never a blank workspace.
- Review preserves: selected document, selected clause, current page, scroll position, comparison state, panel tab/filter. Switching workspaces never discards; only explicit delete or scope-change clears.
- Back behavior is hierarchical and predictable: Detail → parent screen (same scroll) → Home. Sheets/dialogs dismiss to invoker with focus restored.
- Deep-linkable states: clause ID, change ID, and answer ID are addressable (for citations, exports, and demo scripting).

---

## 19. Context Persistence

Persisted across screens, sessions (for saved docs), and workspace switches: current document · current version pair · selected clause · current page + scroll anchor · comparison target + filters · current question + conversation context (per scope) · panel expansions/filters. Session-only documents persist context in-memory until leave/delete. **Never reset context on navigation** — only on explicit user action (document switch confirmed, delete, clear-history), each announced.

---

## 20. Responsive Rules

- **Desktop ≥1280:** full 3-region Review; split compare viewers.
- **Laptop 1024–1280:** left nav → icon rail/section dropdown; viewer + panel intact (1024px = minimum full-Review target).
- **Tablet:** viewer + panel become toggle tabs; section nav → top dropdown; compare = change cards over single viewer with v1/v2 toggle.
- **Mobile:** document-first single column; AI as bottom sheet (peek/half/full snaps); Ask full-screen; compare fully stacked (verdict → cards → toggle viewer); clause detail as sheet; evidence opens inline/sheet. Touch ≥44px; no hover-dependent meaning anywhere.

---

## 21. Interaction States

Exact specifications per state (all include keyboard + screen-reader equivalents):

- **Hover:** subtle surface lift/border-darken only; never the sole affordance.
- **Focus:** 2px accent ring + offset, always visible, never suppressed.
- **Selected:** filled-persistent marker (nav underline, nav-item background, viewer span stays highlighted while its card is open).
- **Expanded/Collapsed:** chevron + `aria-expanded`; one-open-per-group in panels, independent in clause lists; state persists per session.
- **Loading:** skeleton shapes of coming content; pipeline step list (§5); no bare spinners.
- **Streaming:** text-only assembly with "Reviewing…" label; polite live-region announcement of completion, not tokens.
- **Error:** named cause + next action + retry; partial deterministic content retained and labeled.
- **Disabled:** reduced opacity + `aria-disabled` + reason on tooltip/focus (e.g., "Select two versions to compare").
- **Copied:** toast "Copied" + transient check on the button (1.5s).
- **Jumped-to-source:** smooth scroll (300ms) + single highlight pulse + focus moved + location announced.
- **Comparison match:** linked-pair affordance (shared match ID, "view pair" control).
- **Difference found:** change card + severity tag + explanation (never bare highlight).
- **No difference:** count line ("12 clauses unchanged") collapsed by default.
- **Uncertain:** dashed-border + "Uncertain" tag + reason + verification action — a complete state, not a degraded one.

---

## 22. Legal Safety UX

- The five layers (§8 anatomy) are enforced on every AI-bearing screen (5, 6, 7, 9, 10, 12, 14) — same order, same styling, same labels.
- **Banned anywhere in UI copy or AI output:** "You should definitely sign," "This contract is illegal," "You're guaranteed to lose," enforceability verdicts, jurisdiction-specific conclusions without a user-provided jurisdiction.
- **Required:** persistent "general information, not legal advice" notice in Review/Ask/Compare footers; counsel-quarantine styling for lawyer questions; confidence + ambiguity on every consequential answer; disclaimer appended to risk-flagged outputs.
- AI is never framed as a lawyer: no "my legal opinion," no scales/gavel iconography, no authoritative voice. The product's posture is *"here's what I found — verify it here — ask a professional about this."*

---

## 23. AI UX

- Gemini is **embedded, not environed**: it appears exactly where it adds meaning — review header, clause interpretation, evidence answers, change explanations, action-pack synthesis — each with the same small marker, same anatomy, same humility.
- No "AI universe": no separate assistant home, no open-ended agent playground, no model picker, no prompt gallery in MVP.
- Streaming is text-only; completion states are explicit ("Reviewed," "Compared — 6 changes"); failures degrade to labeled partial states with deterministic content intact.
- AI preferences (verbosity, streaming) live in the Settings sheet — one place, plain words.

---

## 24. Demo Flow

Exact 14-beat visual sequence (presenter script; wow moment starred):

1. **Home** — CTA + trust line visible; dropzone primed.
2. **Upload** — v2 PDF dropped; human progress words.
3. **Processing** — step list resolves; auto-advance.
4. **Review** — header assembles; 9 clauses; amber/red tags restrained.
5. **Important clause detected** — non-compete card flagged (red, icon + word).
6. **User clicks clause** — viewer jumps + pulses; card expands.
7. **Gemini explains it** — layered anatomy visible; source quote beside interpretation.
8. **User asks question** — Ask view; answer streams; citation chips appear.
9. **★ WOW: source jump** — presenter taps chip; viewer flies to highlighted span. *"Don't just trust the AI. Verify it."* (pause for judges.)
10. **User uploads Version 2** — Compare setup; readiness checklist ticks.
11. **Comparison detects NET-15 → NET-30** — change card, practical-meaning line read aloud.
12. **Comparison detects 6 → 12 month restriction** — second card; verdict banner resolves.
13. **Silence detection finds removed language** — dashed card: termination notice present in v1, absent in v2.
14. **Action Pack generated** — brief exported; negotiation ask copied; lawyer questions in counsel styling. Close line: *"30-minute consult with a one-page brief — instead of paying for two hours of reading."*

---

## 25. Screen Density Strategy

- No screen scrolls endlessly: panel-local scrolling, tabbed panel sections, accordions for clause/change lists, sheets for detail, sticky toolbars/headers everywhere.
- Progressive disclosure budgets: Review shows ≤5 findings before "show all"; clause cards show explanation-first with source/questions one expansion away; compare shows material changes before cosmetic; Action Pack sections collapse independently.
- Density rule of thumb: if a screen needs more than two viewport scrolls on laptop, it needs tabs, filters, or a sheet — redesign, don't extend.

---

## 26. Accessibility

- WCAG 2.2 AA on all 15 screens: semantic landmarks per region (nav/main/complementary), real headings in layer order, lists for cards/changes/answers.
- Keyboard: CTA-first tab order on Home; `u` upload, `/` in-document search, `]`/`[` flagged-item traversal, `Esc` closes sheets/dialogs with focus restore; every jump, filter, copy, and export operable and announced.
- Screen readers: viewer exposes reading order + highlight alternatives ("Flagged: potential concern…"); streaming via polite live regions (final text); compare exposed as semantic added/removed/changed lists; severity/confidence always text.
- Color-independence, 200% text scaling, dyslexia-friendly options, reduced-motion collapse, ≥44px touch targets — per Spec §23, applied screen by screen, verified in the checklist (§27).

---

## 27. Final Screen-by-Screen Quality Checklist

- [ ] Screens 1–15 exist and only these 15; no extra primary destinations.
- [ ] Each screen answers its primary user question above the fold on laptop.
- [ ] "What do I do next?" is answerable on every screen (primary action always visible).
- [ ] Document dominates Review/Compare at ≥1024px; viewer type ≥17px, measure ≤75ch.
- [ ] Five AI layers visually distinct on every AI-bearing screen; 10-screen impersonation spot-check passes.
- [ ] Citation chips on all 15 AI claim sites jump + pulse + announce; tested keyboard-only.
- [ ] Silence states show all three labels correctly; no certainty inflation.
- [ ] "No concerns" uses mandated neutral wording everywhere it can appear.
- [ ] Copy audit: zero banned phrases (§22) in UI copy and prompt templates.
- [ ] Empty/loading/error/success states designed per screen (§§3–17); skeletons match content shapes.
- [ ] Context persistence verified across 6 cross-screen transitions (§19); no silent resets.
- [ ] Responsive: laptop/tablet/mobile behaviors per screen (§20); mobile is document-first, not shrunk desktop.
- [ ] Accessibility: focus order, landmarks, live regions, contrast, motion, touch — signed off per screen.
- [ ] Demo flow rehearsable end-to-end in ≤3 minutes with the wow moment (beat 9) landing.
- [ ] No dashboards, no KPIs, no enterprise chrome, no chatbot-clone patterns, no legal-enterprise aesthetics.

---

*End of PLAINTERMS_SCREEN_UX_BLUEPRINT.md — Prompt 3 complete. No code written. No dependencies installed. No application modified.*
