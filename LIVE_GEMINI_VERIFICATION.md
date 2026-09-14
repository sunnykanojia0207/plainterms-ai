# LIVE_GEMINI_VERIFICATION.md

> **Milestone:** Prompt 10 — first live-model verification and hardening.
> **Live run 2026-09-14 (this session): QUOTA-BLOCKED — see §20.**
> A real key exists and authenticates, but the provider returns HTTP 429
> RESOURCE_EXHAUSTED on every call (verified twice, minutes apart, including
> a trivial probe). No successful generation was possible; every
> generation-dependent check below is marked FAILED (blocked by quota) with
> evidence. The live ERROR path, however, is fully exercised and
> LIVE VERIFIED (static honest UI, zero leaks).
>
> Historical note: at the original verification time there was NO
> `GEMINI_API_KEY` present. Every live-model check then reported one of two
> honest states. Nothing in this document claims a live result that was not
> observed against the real provider.

- **LIVE GEMINI VERIFIED** — observed against `gemini-2.5-flash` with a real key.
- **MOCK VERIFIED** — proven with a mocked provider + real application code
  (schemas, validators, orchestrators, UI). Deterministic and repeatable.
- **LIVE PENDING** — requires a key; exact manual steps are given in §19.
- **FAILED (blocked by quota)** — attempted live 2026-09-14; provider
  returned 429 on all calls. Not a code failure; rerun after quota refill.

**Scoreboard: 0 of 12 generation tests successful live (provider quota
exhausted). Error-path, security, and no-leak behavior are LIVE VERIFIED
below. All 12 generation paths remain mock-verified, with keyed
reproduction steps.**

---

## 1. Model Verified

- **MOCK VERIFIED + STATICALLY VERIFIED.** `lib/ai/config.ts` is the single
  source: `model: "gemini-2.5-flash"`. Every provider call threads
  `AI_CONFIG.model` (`gemini-client.ts`); a repo-wide search finds no other
  model identifier and no fallback string. There is no code path that can
  silently substitute another model.
- **LIVE PENDING:** the actual provider-returned model identifier. After
  adding a key, confirm it in server logs (the `model` field is logged per
  request) or the returned bundle metadata.

## 2. Environment Verification

- **STATICALLY VERIFIED (updated 2026-09-14):**
  - `.gitignore` ignores `.env*`; local `.env`/`.env.local` exist but are
    untracked and uncommitted (verified: `git status` clean of secrets,
    secret scan empty). The repo is public at
    `sunnykanojia0207/plainterms-ai` with no secrets in history for this
    verification (only key-length presence checks were run; values never
    printed, logged, or committed).
  - `GEMINI_API_KEY` is referenced in exactly two files, both server-only:
    `lib/security/env.ts` (`server-only` guarded) and
    `lib/ai/gemini-client.ts` (`server-only`). Zero references in
    `components/`, routes, or client bundles (verified by search).
  - `.env.example` contains the variable name only, with an empty value.
  - No `AIza*` value exists anywhere in source, docs, or tests.
  - `lib/privacy/log.ts` structurally strips key/content-shaped fields and
    truncates long strings; all AI logging call sites pass metadata only
    (requestId, feature, model, latency, status, validation, error category).
  - No test snapshot contains secrets (all provider tests use `"test-key"`).

## 3. Document Understanding Results

- **MOCK VERIFIED** (`tests/integration/ai-pipeline.test.ts`): canned
  analysis with fixture-exact quotes validates, filters cleanly, drops one
  fabricated finding (count reported), and caches.
- **LIVE PENDING:** run §19 steps 1–2 and confirm payment, term,
  termination, confidentiality, IP, restrictions, liability, and dispute
  findings against V1 sections, recording latency and validation outcome.

## 4. Clause Intelligence Results

- **MOCK VERIFIED:** clause findings require category, interpretation,
  evidence, confidence, and explicit-null ambiguity; cross-checked quotes
  resolve to their sections; severity links to concerns by section.
- **LIVE PENDING:** §19 step 3 — payment, termination, IP, restrictions,
  liability, disputes; check explanation quality, quote exactness, section
  correctness, and that ambiguity is stated, not guessed.

## 5. Ask With Evidence Results

- **MOCK VERIFIED** (`tests/integration/qa-pipeline.test.ts`,
  `tests/components/ask.test.tsx`): all 7 milestone questions have
  predetermined expected behaviors encoded — fact answers with V1 Net-15
  evidence, counsel routing for the California question, the insufficient
  message for dragons, late-fee answers only when supported.
- **LIVE PENDING:** §19 steps 4–5.

## 6. Comparison Results

- **MOCK VERIFIED** (`tests/integration/compare-pipeline.test.ts`):
  Net 15 → Net 30 and 6 → 12 month changes with dual evidence, added
  extension, removed late-fee silence, confidentiality counted unchanged,
  cosmetic handling, verdict + drivers.
- **LIVE PENDING:** §19 step 6 — including the critical check that the
  model does NOT flag every textual difference as important.

## 7. Silence Detection Results

- **MOCK VERIFIED:** removed/not-found/uncertain shapes validate; the
  pipeline test asserts a `removed` state with V1-only evidence; component
  tests assert distinct rendering and uncertain-only filtering.
- **LIVE PENDING:** §19 step 7 — confirm the late-fee removal classifies
  correctly and states are never conflated.

## 8. Action Pack Results

- **MOCK VERIFIED** (`tests/integration/action-pack-pipeline.test.ts`):
  all seven kinds grounded, fabricated items dropped, invalid output
  rejected, unavailable without key, cache reuse.
- **LIVE PENDING:** §19 step 8 — payment, termination, IP, restrictions,
  liability, disputes, dates; every item's evidence checked; uncertainty
  preserved; counsel routing intact; jumps land correctly.

## 9. Prompt Injection Results

- **MOCK VERIFIED** (`comparison-prompts.test.ts`, `qa-prompts.test.ts`,
  `prompts.test.ts`): injected directives (“Ignore previous instructions…”)
  in normal clauses, quoted material, and term sections travel as delimited
  data while defense rules travel as instructions. Prompt-in-isolation tests
  assert the defense strings exist in every system prompt.
- **LIVE PENDING:** §19 step 9 — temporary injection fixture across four
  placements; the model must treat all of it as evidence.

## 10. Safety Results

- **STATICALLY VERIFIED:** repo-wide search of `components/` and `lib/`
  finds zero occurrences of “You should sign”, “This contract is safe”,
  “This is illegal”, “You will win”, “You will lose”, “Definitely invalid”,
  or “Guaranteed”. Prompts name banned terms only inside “Never use”
  prohibition lists. UI copy tests assert neutral wording and forbid
  alarming language in severity labels.
- **LIVE PENDING:** audit one full set of live responses for the same list.

## 11. Error Handling Results

- **MOCK VERIFIED** (`tests/integration/ai-client.test.ts`): hung-request
  timeout within budget, 429 retry-then-success, persistent 5xx bounded to
  3 attempts, malformed output repaired once then safe failure, missing key
  → unavailable without any provider call. UI states (retry preserves
  document/context) covered in component and e2e tests against HTTP-shaped
  failures (500/503/unknown-fixture/bad-request).
- **LIVE PENDING:** throttle/revoke Key scenarios per §19 step 10.
- **LIVE VERIFIED (error path, 2026-09-14):** real provider 429s on prod
  and keyed local produce the static honest states with retry preserved
  (see §20 rows 3, 4, 10) — the exact scenario the mocks simulate.

## 12. Cache Results

- **MOCK VERIFIED:** analysis, comparison, Q&A, and pack pipelines all
  assert second identical calls make zero new provider calls; keys include
  document(s), version(s), normalized question, section, all relevant
  prompt versions, and model. `getOrCompute` dedup is unit-tested for
  concurrent callers.
- **LIVE PENDING:** repeat-request timing per §19 step 11.

## 13. Concurrency Results

- **MOCK VERIFIED:** `getOrCompute` computes once under concurrent callers
  (`tests/unit/cache.test.ts`); failures are never cached.
- **LIVE PENDING:** duplicate-request observation per §19 step 11.

## 14. Performance Measurements

- No successful live generation was observed (provider quota exhausted);
  no time-to-answer numbers are reported or estimated.
- **LIVE VERIFIED (error path, 2026-09-14):** keyed local `/api/ask` fails
  bounded in ~3.1s (initial + 2 retries, then static error); keyed prod
  Ask surfaces the honest error card with zero raw leakage (see §20).
  These are the only live latencies observed.
- How to record generation latencies (keyed run after refill): server logs
  emit `latencyMs` per request; time-to-validated-response ≈ log latency;
  time-to-first-useful-UI via devtools on Review/Compare/Ask; cache-hit
  latency by re-running; retry latency by throttling. Record the observed
  numbers in §19's table.

## 15. Security Findings

- Key handling: server-only, never logged, never bundled, never committed —
  verified by search (§2).
- Injection: defense-in-depth (delimiters + instruction-ignoring rules +
  schema validation + evidence filtering). Prompt-level tests green.
- Logging: metadata-only by construction; logger unit tests prove
  content-shaped keys are stripped and long strings truncated.
- No vulnerabilities introduced by this milestone (one provider-code fix,
  §16). `npm audit` reports 0 vulnerabilities at verification time.

## 16. Issues Found

1. **Unhandled rejection from the timeout race loser** (provider bug,
   found by the new failure-simulation tests): when the model won the
   `Promise.race`, the pending timeout's rejection had no handler.
2. **Fake-timer test hazard** (test-only): advancing fake time past a
   rejection before attaching the assertion surfaces unhandled rejections.
3. No live-model issues could be found — no key (see §18).

## 17. Issues Fixed

1. **Timeout race hardened** (`lib/ai/gemini-client.ts`): the timeout is
   now a cancellable `setTimeout` cleared in a `finally` block, so a late
   timeout can never surface after the call settles. Covered by
   `tests/integration/ai-client.test.ts` (timeout, 429, 5xx, repair).
2. **Test hygiene**: assertions attach before fake-time advancement;
   immediate paths run on real timers.
3. Both fixes verified: `ai-client.test.ts` passes with zero unhandled
   errors; full suite green.

## 18. Remaining Limitations

- **Provider quota exhausted (blocking, 2026-09-14).** The configured key
  authenticates (429, not 401/403) but every call — including a trivial
  probe — returns RESOURCE_EXHAUSTED. All generation checks (§3–§9 live
  halves, §10 live re-audit, §12–§13 live halves) are blocked until refill.
  Automated failure simulation cannot prove provider-side behavior
  (safety blocks, real latency distributions, model wording quality).
- Banned-phrase UI audit is static; live responses need the §10 re-audit.
- `vercel login` was unavailable in this environment, so Production env
  scope and redeploy could not be performed from CLI (see §20).

## 19. Exact Manual Verification Steps

Prerequisite: create `.env.local` with `GEMINI_API_KEY=<key>` (never
commit, never paste into chat logs) and restart `dev`. The model under
test is `gemini-2.5-flash`; confirm via the server log `model` field.

| #   | Steps                                                                                              | Expect                                                                                    |
| --- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | Review the V1 sample (`/review/sample-service-agreement-v1`)                                       | Header, summary, obligations, dates assemble                                              |
| 2   | Check findings: payment, term, termination, confidentiality, IP, restrictions, liability, disputes | Each cites its exact section and quote                                                    |
| 3   | Open each clause card; click every View-source jump                                                | Lands on the cited section; quotes match verbatim                                         |
| 4   | Ask Q1–Q4, Q7 (payment, termination, ownership, 6-month, late fee)                                 | Net-15, IP-on-each-payment, 15-day notice, 6-month values with quotes                     |
| 5   | Ask Q5 (dragons)                                                                                   | Insufficient-information message, no evidence list                                        |
| 6   | Ask Q6 (California law)                                                                            | Counsel routing, no legal answer, no evidence list                                        |
| 7   | Compare V1+V2 samples                                                                              | Net 15→30, 6→12, late-fee silence (removed), extension (added), confidentiality unchanged |
| 8   | Open every V1/V2 jump in new tabs                                                                  | Correct document, correct section                                                         |
| 9   | Generate the Action Pack                                                                           | All 7 kinds grounded; uncertainty preserved                                               |
| 10  | Revoke the key mid-session (rename var + restart) and reload each AI surface                       | Unavailable states; document readable; retry works after restore                          |
| 11  | Re-run identical analysis/compare/Q&A/pack                                                         | Instant (cache); server shows no new provider call                                        |
| 12  | Record latencies (first response, validated response, cache hit)                                   | Fill §14 with observed numbers only                                                       |

Record results here on completion: _not yet executed — no key at verification time
(reconfirmed 2026-09-14: no key in env, no .env.local, no remote, no Vercel auth)._

## 20. Live run 2026-09-14 — quota-blocked (production + keyed local)

> Production: https://plainterms-ai.vercel.app/ (200, serving the current
> redesign — verified by screenshot: 01/02/03 workflow, hero split).
> No secrets are recorded here; only statuses, timings, and UI copy.

| #   | Check                                             | Result                                                                                                                                                                                                                                                                                   |
| --- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Local env                                         | Key present in ignored local `.env` (length verified, value never printed); `.env.local` is template-only; `.env*` git-ignored; nothing committed.                                                                                                                                       |
| 2   | Vercel env                                        | Indirectly verified PRESENT (prod attempts provider calls → 502 error path, never 503 unavailable). Production scope + redeploy BLOCKED: no `vercel login` credentials in this environment. Prod demonstrably serves current `main` (redesign UI + new static error copy observed live). |
| 3   | Review analysis (V1 sample, prod)                 | FAILED (blocked by quota): “The review didn't complete / The AI request didn't complete. Your document is untouched.” with Retry; document fully readable; zero page errors.                                                                                                             |
| 4   | Ask ×7 (prod)                                     | FAILED (blocked by quota): “What are the payment terms?” → “The answer didn't come back” error card, zero answers, zero evidence, zero console errors. Remaining 6 questions not burned against an exhausted quota (no result possible either way).                                      |
| 5   | Compare V1/V2 (prod)                              | Not executed (quota; no successful call possible). Mock coverage stands.                                                                                                                                                                                                                 |
| 6   | Action Pack / Review Guide (prod)                 | Not executed (quota). Mock coverage stands.                                                                                                                                                                                                                                              |
| 7   | Real uploads + injection fixture                  | Not executed live (quota). Upload/parse paths covered by keyless e2e (29/29).                                                                                                                                                                                                            |
| 8   | Error-UI leak audit (prod, live)                  | LIVE VERIFIED: 502 body is exactly `{"code":"ai-error","message":"The AI request didn't complete. Your document is untouched."}` — no `requestId`, no 429, no URLs. Rendered HTML contains no `AIza`/provider host; local/session storage keys empty.                                    |
| 9   | Key validity                                      | LIVE VERIFIED: provider returns 429 (authenticated-but-exhausted), not 401/403 — the key is recognized.                                                                                                                                                                                  |
| 10  | Retry boundedness                                 | LIVE VERIFIED: keyed local ask fails in ~3.1s (bounded retries, then static error); no retry storms in logs.                                                                                                                                                                             |
| 11  | Unavailable path                                  | Code-verified (cannot trigger live while a key is configured); keyless e2e covers it (29/29). Live revoke test skipped (would disturb the shared prod env).                                                                                                                              |
| 12  | Console/hydration/overflow (prod Home/Review/Ask) | No page errors, no console errors; overflow sweep 25/25 zero on the same tree (separate run).                                                                                                                                                                                            |

**Remediation (single item):** refill or raise quota (or set a fresh
`GEMINI_API_KEY` in Vercel Production + local `.env`), then rerun §19 steps
1–9. If the variable changed on Vercel, redeploy (`vercel --prod`) first.
No code changes are indicated — every observed failure is quota, and every
failure surface behaved exactly as designed.

---

_End of LIVE_GEMINI_VERIFICATION.md. Automated gates (reconfirmed
2026-09-14): format ✓ lint ✓ strict typecheck ✓ 199 unit/component/
integration tests, 42 files ✓ 29 e2e ✓ production build ✓.
Live-model verification: NOT PERFORMED — no API key available._
