# PLAINTERMS_UI_UX_SPECIFICATION.md

> **Status:** Visual + interaction design output — Prompt 2 of the PromptWars legal GenAI challenge.
> Source of truth: `LEGAL_GENAI_PRODUCT_BLUEPRINT.md` (Prompt 1). This spec changes nothing about the
> product concept, persona, document scope, or MVP — it defines how PlainTerms looks, behaves, and speaks.
> No application code was written, modified, or installed to produce this document.

**Product:** PlainTerms — *"Know what you're signing."*
**User:** Independent freelancer reviewing a client contract (Service Agreement, NDA, Statement of Work).
**Workflow:** Upload → Understand → Clause Intelligence → Ask with Evidence → Compare → Action Pack.

---

## 1. Design Philosophy

1. **The document is the product; Gemini is the lens.** The contract occupies the visual center at all times. AI output is always presented as *a reading of* the document, never as a replacement for it.
2. **Meaning first, evidence second, raw text third.** Every screen answers "what does this mean for me?" before showing how the AI knows, before showing the source text.
3. **Calm over clever.** Legal review is anxious work. The interface lowers heart rate: quiet surfaces, generous whitespace, restrained color, no performative AI theatrics.
4. **Verification is a feature, not a fallback.** The design assumes a healthy skepticism and makes checking the AI faster than trusting it — one tap from any claim to its highlighted source.
5. **Uncertainty is content.** "The document is silent on…" and confidence labels are designed with the same care as answers, because for legal assistance, a labeled gap is more valuable than a fluent guess.
6. **Human in control, professional at the boundary.** The AI proposes; the user disposes; a qualified lawyer resolves. The interface makes each handoff explicit.

---

## 2. Product Personality

PlainTerms feels like **a careful friend who reads contracts for a living** — precise but never cold, plain-spoken but never sloppy.

| We are | We are not |
|---|---|
| Trustworthy (evidence for everything) | Authoritative (never a verdict on legality) |
| Calm (restrained color, quiet motion) | Alarming (no red-alert theatrics) |
| Intelligent (sees what you missed) | Magical (no "AI knows best" glow) |
| Approachable (plain words, human tone) | Casual (no jokes about your liability) |
| Precise (clause IDs, locations, quotes) | Pedantic (no legalese in our own voice) |
| Editorial (reads like a good explainer) | Corporate (no enterprise dashboard) |

**Voice examples:**
- Instead of "Risk detected: unlimited indemnification exposure" → **"Potential concern — this indemnity clause has no cap. Here's what that appears to mean…"**
- Instead of "Analysis complete" → **"PlainTerms reviewed this agreement. Here's what matters most."**
- Instead of "No issues found" → **"No potential concerns were identified from the available document."**

---

## 3. Visual Direction

**Principles extracted from the reference set (Google Docs, Gemini, Notion, Linear, Stripe, Arc, Readwise) — not their visuals:**

- *Docs/Drive:* the document canvas is sacred; chrome recedes; text is king.
- *Gemini:* AI output is conversational yet structured; a small, consistent AI marker (not a spectacle).
- *Notion:* blocks, progressive disclosure, everything editable-feeling without clutter.
- *Linear:* speed, keyboard-first, dense-but-calm information, exquisite restraint with color.
- *Stripe:* documentation-grade clarity; complex topics made legible through hierarchy and examples.
- *Arc/Readwise:* reading is a designed experience — typography, focus states, and annotation are first-class.

**Resulting direction:** an *editorial document reader* — paper-like reading surface, magazine-grade type hierarchy, one restrained accent, and a visually distinct but quiet AI layer that never impersonates the document.

---

## 4. Information Hierarchy

On every screen, the eye must land in this order — enforced by size, position, and weight, never by color alone:

1. **Document identity** — name, type badge (Service Agreement / NDA / SOW), version label, parties, date.
2. **Overall understanding** — the AI review header: one-line verdict + top findings in plain language.
3. **Important clauses** — clause cards ordered by importance, not document order.
4. **Potential concerns** — flagged inline within the clause list with severity vocabulary (§Risk Language), never a separate scare-screen.
5. **Evidence** — citation chips and source quotes attached to each claim.
6. **Comparison** — only in Compare workspace; change cards ordered by materiality.
7. **Recommended next steps** — Action Pack teasers ("3 obligations, 2 dates, 4 questions ready") that deep-link into the full pack.

AI supports the hierarchy; it never outranks the document identity or the source text.

---

## 5. Navigation Architecture

**Decision:** adopt the blueprint's five destinations with one rename for clarity. Final structure (maximum 5, no more):

1. **Home** — start, upload, resume.
2. **Documents** — library with type badges, status, key-date badges.
3. **Review** — the core three-region workspace (§7).
4. **Compare** — version comparison workspace (§11).
5. **Ask** — document-grounded Q&A (§14). Named "Ask" (not "Ask PlainTerms") to keep labels short; the AI identity is carried by the intelligence layer, not the nav label.

Settings is **not** navigation — it is a single minimal sheet (retention, delete-my-data, export, text size). The Action Pack lives inside Review as its final section, not as a sixth destination. No admin, no analytics, no billing screens in MVP.

---

## 6. Home UX

Home is a **starting line, not a dashboard.** One screen, one job: get the user to "Review a document."

- **Hero zone (top, generous whitespace):** product mark + tagline, then the primary CTA button **"Review a document"** opening the upload flow. Secondary link: "See how it works" (30-second annotated example, static — no fake live demo).
- **Upload dropzone** directly beneath the CTA (drag-and-drop + Browse), accepting PDF / DOCX / TXT, with the privacy reassurance line beside it: *"Private to you. Used only for your review. Delete anytime."*
- **Continue review** — horizontal list of up to 3 recent documents with status chips (Ready / Needs Attention) and "key finding" one-liners.
- **Start comparison** — compact entry: two slots (v1, v2) with document pickers; disabled-state hint until two documents exist.
- **"What PlainTerms can help with"** — five plain rows mapped to the MVP (Understand, Clauses, Ask, Compare, Action Pack), each one line, no cards-within-cards.
- **Small Gemini example** — a static, clearly-labeled sample ("Example insight") showing a clause card miniature, so first-time users learn the visual language before uploading.

---

## 7. Document Review UX

The most important screen. **Three regions, document dominant:**

```
┌──────────────────────────────────────────────────────────────┐
│ Document toolbar: name · type badge · version · search · view │
├──────────┬────────────────────────────────┬──────────────────┤
│ LEFT     │ CENTER                         │ RIGHT            │
│ Sections │ Document viewer (dominant,     │ Intelligence     │
│ nav      │ ~55-60% width)                 │ panel            │
│ (~15%)   │                                │ (~25-30%)        │
└──────────┴────────────────────────────────┴──────────────────┘
```

- **LEFT — Section nav:** document outline (sections/clauses) with status dots (reviewed, flagged, unread); click scrolls the viewer; flagged items carry severity icon + label (never color alone).
- **CENTER — Document viewer** (§8): the visual anchor; largest type on screen; clause highlights selectable; clicking a highlight loads its explanation in the right panel.
- **RIGHT — Intelligence panel:** tabbed or stacked sections in fixed order — (a) AI review header (§Review Header), (b) key clauses, (c) obligations snapshot, (d) Action Pack teaser. Selecting anything in the center filters/highlights the corresponding panel item and vice versa (bidirectional linking).

**Document toolbar:** document name + type badge + version + status chip; search-within-document; view toggle (page / continuous); zoom; metadata popover (parties, dates, pages, uploaded-at); overflow menu (rename, export, delete).

---

## 8. Document Viewer UX

Legal text must remain **readable and authoritative:**

- **Two views:** continuous scroll (default — best for reading flow) and paged (best for citation parity with the original). Page numbers always visible; view toggle preserves scroll position by clause anchor.
- **Typography:** serif-optional body at ≥17px equivalent, 65–75ch line length, 1.6+ line height; original numbering/headings preserved exactly — never reformat legal text into our UI voice.
- **Interactions:** text selection (with "Ask about this selection" contextual action), in-document search with match count and jump, section nav sync, zoom (text-size, not layout-breaking), clause highlighting in three intensities (neutral read / flagged / active-focus), inline annotation markers that expand the linked AI explanation.
- **Source references:** every AI-cited span gets a persistent highlight + clause-ID gutter mark; clicking a citation chip anywhere in the product scrolls here and pulses the span once (motion-respecting).
- **Metadata bar:** parties, effective date, term, page count, document type — collapsible, never competing with text.

---

## 9. Gemini Intelligence Layer

A **distinct but restrained** AI visual language, applied identically everywhere AI output appears:

- **AI marker:** a small, consistent "Gemini" spark-glyph + label at the top of every AI block. Same size, same place, every time. No gradients, no glow, no animation beyond streaming text.
- **Anatomy of every AI block:** (1) finding/answer in plain language → (2) "Why it matters" one-liner → (3) source citation chips → (4) confidence + ambiguity line → (5) suggested next action link.
- **Five information layers, visually non-interchangeable** (maps to blueprint §17):
  - **DOCUMENT FACT** — blockquote styling, quotation marks, document-type serif. ("The document states…")
  - **AI INTERPRETATION** — standard AI block with the Gemini marker + "Interpretation" tag. ("This clause appears to mean…")
  - **GENERAL INFORMATION** — tinted "Background" note style with book icon. (What an indemnity cap *is*, not what yours *does*.)
  - **POTENTIAL OPTION** — action-row styling with arrow affordance. ("You could consider asking…")
  - **QUESTION FOR LAWYER** — distinct bordered "counsel" style with person icon, visually quarantined. Never mixed into other layers.
- **Rule:** AI output must never use document-fact styling, and document quotes must never use AI-block styling. Impersonation is impossible by construction.

---

## 10. Clause Intelligence UX

*(Blueprint §7-capability-2; also the "AI REVIEW HEADER" concept, folded here as its entry point.)*

**AI review header (top of intelligence panel, compact):**
"PlainTerms reviewed this agreement" → key finding line ("Two terms changed from the previous version" when a prior version exists; otherwise "9 key clauses found, 3 worth reviewing") → top potential concern ("Payment window increased from 15 to 30 days") → one action ("Review the payment clause before signing" — deep-links to the clause card).

**Clause card anatomy (fixed order, progressive disclosure):**

1. Clause name + importance rank (e.g., "Payment terms · Key clause 2 of 9")
2. Severity tag in standard vocabulary (Potential concern / Worth reviewing / Important obligation / …)
3. Plain-language explanation (2–3 sentences, our voice)
4. "Why it matters" (one line, freelancer-framed)
5. Who it affects (You / Client / Both — icon + label)
6. Collapsed-by-default: original clause (verbatim, quote-styled) → evidence reference chip (§/page, jumps to viewer) → questions to consider (2–3) → confidence + ambiguity note

**Interaction:** "View in document" jumps + highlights source; cards filterable by All / Obligations / Concerns / Financial; expanding one card never expands others.

---

## 11. Comparison UX

**"V2 Ambush" workspace** — selection first, verdict second, evidence always:

1. **Picker strip:** v1 slot + v2 slot (document pickers with type/version labels, swap control). Empty states guide ("Choose the earlier version to begin").
2. **Verdict banner:** one plain sentence — *"Version 2 shifts payment timing and future-work risk to you."* — plus top-3 drivers as chips. Framed as information, never instruction.
3. **Change list ordered by materiality:** each change card shows old → new values as structured facts (not raw diffs), e.g. payment card: "NET 15 → NET 30"; non-compete card: "6 months → 12 months".
4. **Filters:** All / Material only / Added / Removed / Changed / Unchanged (collapsed by default — unchanged clauses are counted, not displayed).
5. **Dual evidence:** every change card carries *two* jump links — "View in v1 §7.1" and "View in v2 §7.3" — opening a split mini-viewer or jumping the main viewer with version toggle.

**Never only color-code text.** Every visual difference is paired with Gemini's practical-meaning explanation ("You'd wait twice as long to get paid, with no late fee added").

---

## 12. Semantic Redline UX

The change card (unit of comparison), fixed anatomy:

1. **Original** — verbatim v1 text, quote-styled, labeled "Version 1 · §7.1".
2. **New version** — verbatim v2 text, quote-styled, labeled "Version 2 · §7.3".
3. **What changed** — one plain sentence ("Payment window extended from 15 to 30 days").
4. **Why it matters** — freelancer-framed impact ("On a $4,500 invoice, that's up to $4,500 of your cash held an extra 15 days").
5. **Potential implication** — scenario trigger ("If the client pays on day 30 with no penalty, you absorb the delay cost").
6. **Question to consider** — ("Is there a late-payment fee? The document doesn't mention one.")
7. **Recommended next step** — option-styled action ("Consider asking for net-15 or a 1.5%/month late fee" + "Add to negotiation checklist" button).

Materiality and direction ("favors client") shown as labeled tags with icons, never color alone.

---

## 13. Silence Detection UX

A first-class section in Compare (and in Review as "Gaps"), visually distinct from removals:

- **Card style:** dashed border + "missing piece" icon + the headline pattern: *"Termination notice language found in Version 1 is not present in Version 2."*
- **Three-state vocabulary, always labeled:**
  - **Removed** — high-confidence: matched surrounding context exists in v2 but the clause does not.
  - **Not found** — the concept has no match in v2; may be restructured rather than removed.
  - **Uncertain** — document structure (scans, broken numbering) makes certainty impossible; shown with the reason.
- **Body:** what the missing language used to do (quoted from v1), why its absence could matter, and the recommended clarification question.
- **Rule:** never imply certainty beyond the evidence; the "Uncertain" state must be as easy to design around as the confident ones.

---

## 14. Ask With Evidence UX

Not a chatbot page — a **scoped evidence console:**

- **Scope bar (top):** document pills (which document(s) the answers draw from) + the mantra *"Don't just trust the AI. Verify it against the document."*
- **Answer block anatomy:** answer (plain language) → source clause chips (§7.2, §9.1 — tap to jump + highlight) → relevant quoted text (collapsible) → explanation ("why these clauses answer your question") → uncertainty row (confidence + ambiguities + "the document is silent on…" when applicable) → follow-ups ("Related: …") → "Questions for counsel" link when the answer touches a concern.
- **Input:** bottom-docked composer with selection-aware placeholder ("Ask about this agreement…"); selecting viewer text offers "Ask about this selection."
- **Example:** "Can the client terminate this agreement immediately?" → answer citing termination clause + notice clause, quoting both, flagging any silence on immediate termination, confidence labeled.
- **Guardrails visible:** empty state lists 3 suggested questions (derived from the document, not generic); answers that hit safety boundaries say what they *can* answer and route to the lawyer-question list instead of refusing bluntly.

---

## 15. Action Pack UX

The final Review section — **understanding converted into a before-signing workflow,** exportable as a one-page brief (PDF/markdown):

1. **Key obligations** — checklist with owner tags (You/Client) and clause links ("Invoice by the 5th of each month · §7.1").
2. **Important dates** — timeline rows (effective date, milestones, termination-notice deadline, renewal), each computed deterministically and source-linked.
3. **Negotiation points** — ranked cards with ask + fallback + one-line leverage note; "copy ask" button drafts email-ready wording.
4. **Questions for the other party** — plain, sendable questions.
5. **Information still needed** — gaps the user must fill (jurisdiction, missing exhibits, unsigned SOW).
6. **Before-signing checklist** — the close: review flagged clauses → resolve gaps → send asks → consult counsel on red items → sign. Progress is user-checked, never auto-completed.
7. **Lawyer brief** — the quarantined counsel-styled section: prioritized questions each with concern + ambiguous text + what resolution unlocks (sign / negotiate / walk away).

---

## 16. Upload UX

- **Entry:** drag-and-drop zone + Browse + "use recent" — PDF, DOCX, TXT; max size stated upfront.
- **Progress in human terms:** Uploading → Reading document → Identifying clauses (no technical jargon like "chunking" or "embedding").
- **Privacy reassurance inline:** lock icon + "Private to you · Used only for your review · Delete anytime" beside every upload control.
- **States:** success → auto-routes to Review; failure (corrupt/unreadable) with retry + "try a different file" guidance; unsupported file (type named + accepted list); large file (size + compression suggestion); scanned-PDF note when OCR fallback engages ("This looks like a scan — results may be less precise about locations").
- **Never** expose pipeline internals unless they affect the user's trust in locations/citations.

---

## 17. Privacy/Trust UX

Trust is shown through **controls and restraint, not claims:**

- Persistent "Private document" indicator in the toolbar with a popover: what is stored, for how long (per retention choice), and the one-tap delete.
- Retention choice at upload: "Keep for my review" vs "Session only (deleted when I leave)" — plain words, default to session-only for sensitive docs.
- "Used only for your review" and "No document content in analytics" stated where analytics could be feared (export, sharing) — and only because the architecture guarantees it (blueprint §18).
- **No unsupported claims:** no "military-grade," no "bank-level," no padlock theater beyond what TLS + AES-256 + per-user isolation deliver. Security words match the security model exactly.

---

## 18. Responsive UX

- **Desktop (≥1280px):** full three-region Review (§7). Compare uses split viewer + change list.
- **Laptop (1024–1280px):** three regions compress — left nav collapses to icons/section dropdown; viewer + panel remain. Minimum usable Review target: 1024px.
- **Tablet:** two-region (viewer + panel as toggle tabs); section nav becomes a top dropdown; compare stacks change cards above a single viewer with version toggle.
- **Mobile:** **document-first, not shrunken desktop.** Viewer is the primary screen; intelligence becomes a bottom sheet/drawer with snap points; Ask is full-screen with scope bar; Compare is fully stacked (verdict → change cards → split viewer via toggle); evidence opens inline or in a sheet, never a new page. Touch targets ≥44px; citation chips tappable without zoom.

---

## 19. Typography

**System (no webfont dependency for MVP; platform-native stacks):**

- **UI sans:** `-apple-system, "Segoe UI", Inter, Roboto…` — interface, AI output, metadata.
- **Document serif (reading):** `Georgia, "Times New Roman", serif` for the viewer body — signals "this is the original text," distinct from our voice at a glance. Sans option in accessibility settings.
- **Mono (evidence):** `ui-monospace, "SF Mono", Consolas…` — clause IDs, section refs, dates.

**Scale (desktop, 16px base):** Display 28/36 · H1 22/30 · H2 18/26 · Body 16/26 · AI body 15/24 · Clause/quote 17/28 (never smaller than body) · Metadata 13/20 · Micro-labels 12/16 uppercase-tracked (sparingly).

**Rules:** body line-length 60–75ch (viewer), 55–65ch (AI panels); weights 400/500/600/700 only; letter-spacing only on micro-labels (+0.04em); AI voice and document voice must never share the same type treatment.

---

## 20. Color System

Quiet, editorial, light-first. One accent. Severity always paired with icon + label.

| Token | Value (light) | Usage |
|---|---|---|
| `--bg` | #FAFAF8 (warm paper white) | App background |
| `--surface` | #FFFFFF | Cards, panels |
| `--surface-elevated` | #FFFFFF + shadow sm | Drawers, dialogs, sheets |
| `--text-primary` | #1A1C1E | Headings, body |
| `--text-secondary` | #5B6068 | Metadata, hints |
| `--border` | #E5E3DD (warm gray) | Dividers, card borders |
| `--accent` | #1D4ED8-ish restrained blue (tuned for AA on white) | Primary actions, active states, links |
| `--ai` | #6D28D9-ish restrained violet (AA) + spark glyph | AI marker ONLY — never for actions or document text |
| `--success` | #166534 (deep green) | Completed checks, healthy states |
| `--warning` | #92400E (deep amber) | Worth reviewing |
| `--concern` | #B45309 → paired with ⚠ + label | Potential concern (amber family, not alarm) |
| `--critical` | #B91C1C → paired with ⛔/● + label | Highest severity, used sparingly |
| `--neutral` | #6B7280 | Unchanged, inactive, silent states |
| `--added` | deep green bg tint + "+" + label | Comparison additions |
| `--removed` | deep red bg tint + "−" + label | Removals |
| `--changed` | deep amber bg tint + "≠/●" + label | Modifications |
| `--evidence` | accent-tinted highlight (#DBEAFE-ish) + gutter mark | Source spans, citation targets |

Dark theme: deferred past MVP except `prefers-color-scheme` fallback for the viewer; tokens are theme-able by construction (all color via tokens, no hex in components).

---

## 21. Component System

Single visual language; every component ships with default / hover / focus-visible / active / disabled / loading / error states and a text-label equivalent for any color meaning.

- **Button:** primary (accent, white text), secondary (bordered), tertiary (text-only), destructive (critical, used almost only for Delete document). 44px min height on touch.
- **Input / Search / Dropdown:** 1px border, radius md, visible focus ring (2px accent offset); in-document search shows match count + prev/next.
- **Tabs:** underline style for panel tabs (Review panel, Ask scope); segmented control for view toggles (page/continuous, v1/v2).
- **Badge:** type badges (Service Agreement/NDA/SOW), version pills, severity tags (icon + word), confidence tags (High/Medium/Low + reason on tap).
- **Card (base):** surface, 1px border, radius lg, no heavy shadow; generous padding.
- **AI Card:** base card + violet left rule (3px) + Gemini marker header + structured anatomy (§9).
- **Clause Card:** base card + importance rank + severity tag + progressive disclosure (§10).
- **Evidence Card:** quote-styled body + clause-ID mono ref + dual jump buttons (viewer location).
- **Comparison Card:** the semantic redline anatomy (§12) + dual v1/v2 jump links + materiality/direction tags.
- **Document Toolbar / Annotation:** toolbar per §7; annotations are gutter marks + inline highlight, expanding to the linked card.
- **Drawer / Dialog / Toast / Tooltip:** drawer (right panel on tablet, bottom sheet on mobile); dialogs only for destructive/irreversible actions (delete) and export; toasts for confirmations ("Brief exported", "Document deleted") with undo where applicable; tooltips for icon-only controls, never for essential meaning.
- **Upload Area / Empty / Loading / Error States:** per §16 and §24 — loading uses skeleton blocks shaped like the coming content (clause-card skeletons), never spinners alone; errors name the problem + the next action.

---

## 22. Motion System

Subtle, purposeful, respectful of `prefers-reduced-motion` (all motion collapses to opacity/none under the flag):

- **Allowed:** viewer scroll-to-citation (smooth, 300ms, single highlight pulse); clause focus transitions; panel/drawer slide (200–250ms ease-out); compare version toggle crossfade; AI streaming (text only, no shimmer); upload progress (determinate bar); skeleton shimmer (low-contrast, disabled under reduced motion).
- **Forbidden:** bouncing, glowing/pulsing AI effects, particles, decorative hero animation, auto-playing motion, layout-shifting entrances.
- **Durations:** micro 120ms · standard 200–250ms · reading-scroll 300ms. Easing: ease-out for entrances, linear for progress.

---

## 23. Accessibility

WCAG 2.2 AA target, designed in (not audited after):

- **Keyboard:** full operability with visible focus (2px accent ring, never removed); roving tabindex in section nav and change lists; shortcuts for search (`/`), citation jump (`]`/`[`), panel toggle; focus trapped in dialogs, restored on close; focus moved deliberately on viewer jumps with screen-reader announcement of the new location.
- **Screen readers:** landmarked regions; viewer exposes tagged reading order and text alternatives for highlights ("Flagged: potential concern, non-compete, section 11"); AI streaming announced via polite live regions (final text, not every token); comparison changes exposed as a list with semantic added/removed/changed roles; confidence and severity always text, never icon-only.
- **Vision:** AA contrast everywhere (accent and AI violet tuned for white); severity never color-alone; text resizing to 200% without loss; dyslexia-friendly reading options (§19 + spacing controls).
- **Motion/touch:** reduced-motion support (§22); touch targets ≥44×44px; no hover-dependent meaning.

---

## 24. Empty/Loading/Error States

- **No documents:** illustration-free, one-line orientation + "Review a document" CTA + example-insight miniature.
- **No comparison:** picker guidance ("Upload a second version to see what changed").
- **No concerns found:** *"No potential concerns were identified from the available document."* — styled as a neutral note with a "Review all clauses" link. Never a clean-bill-of-health banner, never a checkmark seal.
- **No important clauses / no evidence:** explain scope ("Only Service Agreements, NDAs, and SOWs are reviewed in this version") + next action.
- **AI unavailable / network unavailable:** partial-state honesty — show what was computed deterministically, label what needs AI, retry control; queued question preserved.
- **Processing:** skeleton clause cards + human-status lines (§16).
- **Unsupported / failed upload / deleted:** name the cause, offer the fix, keep the user's other work intact.

---

## 25. Design Tokens

```text
COLOR      §20 table (bg, surface, elevated, text-1/2, border, accent, ai,
           success, warning, concern, critical, neutral, added, removed,
           changed, evidence) — all theme-able, AA-verified pairs documented.

TYPE       font-ui / font-doc / font-mono stacks · scale 12→28 (§19) ·
           weights 400/500/600/700 · line-heights 16→36 · tracking +0.04em micro only.

SPACE      4pt base: xs 4 · sm 8 · md 16 · lg 24 · xl 32 · 2xl 48 · 3xl 64.
           Panel gutters lg; viewer measure capped 75ch; card padding md–lg.

RADII      sm 6 · md 10 · lg 14 · pill 999. Cards lg; chips pill; inputs md.

BORDERS    1px var(--border) default · 2px for counsel-quarantine and silence
           cards (dashed for silence) · 3px left-rule for AI cards.

SHADOWS    sm (elevated sheets) · md (dialogs) only. Cards are border-flat.

MOTION     durations 120/250/300ms · ease-out entrances (§22) · reduced-motion
           collapse map.

Z-INDEX    viewer-highlights 1 · sticky toolbar 10 · drawer/sheet 40 ·
           dialog 50 · toast 60 · tooltip 70.

FOCUS      2px accent ring + 2px offset, always visible, never suppressed.

STATES     Every interactive token defines default/hover/focus/active/disabled/
           loading/error. Severity and evidence states always pair color with
           icon + text.
```

---

## 26. Hackathon Demo Flow

Staged for the 2–3 minute "v2 ambush" (blueprint §21) — each beat has a visual anchor:

1. **Upload** → Home dropzone; progress in human words; auto-route to Review.
2. **Understands** → AI review header assembles top-down (verdict → findings), skeleton-to-content.
3. **Obligations** → clause cards filter to "Obligations"; key-facts row visible.
4. **Concern** → non-compete card pulses once on presenter's tap; expands to source + explanation.
5. **Ask** → Ask view, pre-typed question submitted live; answer streams with citation chips; presenter taps a chip → viewer jumps + highlights (the "verify it" moment — pause here for judges).
6. **Upload v2** → Compare picker; verdict banner resolves.
7. **Changes detected** → change cards, material-first; NET 15→30 front and center.
8. **"V2 ambush" explained** → redline card anatomy on screen; verdict read aloud.
9. **Action Pack** → one-page brief exported; negotiation ask copied; lawyer questions shown in counsel styling.
10. **Close line:** *"Maya walks into a 30-minute consult with a one-page brief — instead of paying for two hours of reading."*

Presenter notes: keep the viewer visible throughout (document dominance is itself a differentiator); tap, don't hover (touch-friendly judging); the citation-jump is the applause beat — rehearse it.

---

## 27. Design Do's and Don'ts

**Do:** lead with plain meaning · cite everything · label uncertainty · quarantine counsel content · keep the document dominant · use severity words, not alarm visuals · design empty/error states as trust moments · keep motion invisible · make export one tap away · test every flow keyboard-only.

**Don't:** chatbot-as-product · dashboard clutter · color-only meaning · "no issues found" seals · legal conclusions as fact · AI styling on document quotes (or vice versa) · fake AI shimmer/glow · 15-page nav · decorative analytics · exposing pipeline jargon · dark patterns around retention/deletion.

---

## 28. Final UI Quality Checklist

- [ ] Document is visually dominant on every Review/Compare screen at 1024px+.
- [ ] Every AI claim has a one-tap path to its highlighted source span.
- [ ] Five information layers (§9) are visually non-interchangeable; spot-check 10 screens.
- [ ] Severity is always icon + word, never color alone; contrast passes AA.
- [ ] "No concerns" states use the mandated neutral wording — no seals, no checkmarks-as-verdict.
- [ ] All interactive elements keyboard-reachable with visible focus; dialogs trap/restore focus.
- [ ] Screen-reader pass: landmarks, live regions, comparison semantics, citation announcements.
- [ ] Reduced-motion pass: all §22 motion collapses correctly.
- [ ] Mobile pass: viewer-first, bottom-sheet AI, stacked compare, ≥44px targets.
- [ ] Upload → summary → clause → ask → compare → action-pack completable in the demo order without dead ends.
- [ ] Export produces a clean one-page brief; delete removes all user data with confirmation.
- [ ] No law-firm clichés, no gavels, no neon, no glassmorphism anywhere.
- [ ] Copy audit: zero instances of "you should definitely," zero legal conclusions stated as fact.
- [ ] Performance sanity: viewer scrolls smoothly on a 30-page PDF; skeletons prevent layout shift.

---

*End of PLAINTERMS_UI_UX_SPECIFICATION.md — Prompt 2 complete. No code written. No dependencies installed. No application modified. Single source of truth for all future PlainTerms UI implementation prompts.*
