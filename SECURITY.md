# SECURITY.md — PlainTerms ingestion and AI safety

Uploaded legal documents are **untrusted input**. This document records the
threat model and the controls in place. Anything here marked as a
limitation is a known gap, not an oversight.

## Threat model

| Threat                                   | Control                                                                                                                                     | Location                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Malicious filename (traversal, spoofing) | Allowlisted extensions; random UUID temp ids; id regex on delete; filenames never reach disk or logs                                        | `ingest.ts`, `storage.ts`, `api/documents/*`   |
| MIME/extension spoofing (exe as PDF)     | Magic-byte sniffing (`%PDF-`, ZIP, text heuristics); mismatch rejects before parsing                                                        | `parse/index.ts`                               |
| Macro / script / embedded execution      | Parsers extract text only (unpdf text layer, mammoth document.xml); HTML tokenized as strings with script/style stripping; nothing executes | `parse/pdf.ts`, `parse/docx.ts`                |
| External URL fetching                    | No parser or pipeline code performs network requests                                                                                        | — (by construction)                            |
| Oversized / pathological files           | 25 MB cap, 200-page cap, 500k-char cap, 500-section cap, 60s parse timeout, temp-file cleanup in `finally`                                  | `limits.ts`, `ingest.ts`                       |
| Encrypted PDFs                           | Refused with guidance, never unlocked or brute-forced                                                                                       | `parse/pdf.ts`                                 |
| Prompt injection in content              | Delimiters + instruction-ignoring rules in every prompt; schema validation; evidence filtering                                              | `prompts.ts` files, `evidence.ts`              |
| Secret leakage                           | Keys server-only (`server-only` imports fail client builds); logs strip content-shaped keys; audit log records actions, not content         | `env.ts`, `gemini-client.ts`, `privacy/log.ts` |
| Stale sensitive data                     | Temp files deleted in `finally`; records TTL-expire (60 min) with FIFO cap; explicit DELETE endpoint; client delete fires server cleanup    | `ingest.ts`, `records.ts`, `store.ts`          |
| Privacy over-claims                      | UI copy matches implementation: “Private to you” = tab-local + server TTL + delete-anytime; no unsupported claims (verified by copy review) | `UploadZone.tsx`, `SettingsSheet.tsx`          |

## What the UI may and may not claim

- MAY: private to you, used only for your review, delete anytime, no
  document content in analytics or logs.
- MUST NOT: military/bank-grade encryption language, “fully secure”,
  permanent deletion from all systems (backups out of scope), or any
  claim not implemented above.

## Known limitations

- Records live in server memory: a restart drops them (clients then show
  the honest unknown-document state). No cross-device sync.
- No antivirus scanning of uploads beyond format validation.
- Rate limiting on upload/AI endpoints is not yet implemented.
- No OCR: scanned PDFs are refused, not read.
