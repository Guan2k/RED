# Optional verification tools: v318 evidence

This directory records the verified tool addendum, not a new game release. The original delivery reports are historical snapshots: their “not published” statement describes delivery time, before this publication.

## Result and limits

The one resumed full run on 2026-10-22, 00:11:05–00:23:19 UTC, exited 0 in 733.437 seconds. It explicitly enabled the SHA-pinned, in-memory DOM test transform, progress observer, and final head-stderr failure capture. This is **not default untransformed-mode acceptance**. Default mode was not rerun this round. The earlier sporadic bounded-UI baseline failure did not recur; its root cause is still unknown and is not claimed fixed.

The canonical aggregate JSON is deeply equal to the published v318 success record, without field exclusions. Raw complete logs differ in timestamps and paths and are not claimed byte-equal. Ten transform audit records and 556 completed process streams were checked. All 345 captured failed-child outputs are expected negative/CLI tests, not an overall gate failure.

The game index SHA-256 is `7eda2c8962fe223b1397f90afdaf8beb47049342c1aa3979ee5ccbef8cee5234`. Game code, historical test files, assertions and timeouts on disk are unchanged. The optional loader changes known test code in memory; it is not the unchanged default execution path. No browser/layout/touch/FPS acceptance or whole-run performance attribution is claimed.

## Navigation

- `evidence/resumed-full-final-capture/`: complete successful logs, before/after input hashes, terminal result, mode, audit, captured output, scoped checks and independent review.
- `evidence/observed-gate-evidence/` and `evidence/optimized-gate-evidence/`: prior unsuccessful full-run evidence, preserved rather than replaced.
- Other evidence folders: focused diagnostics, equivalence checks and tool contract tests.
- `historical-delivery/`: original delivery reports, retained with their original status.
- `DELIVERY-REPORT.json`: validated addendum summary at delivery time.

Usage and opt-in requirements are documented in `../tools/verification-progress/README.md` and `../tools/dom-projection/README.md`. No mode is enabled by default. The observer is a Python stdlib POSIX launcher; use the original standard command on Windows. Failure capture defaults off and may contain diagnostic output; review before sharing.

## Publication integrity

The full run used the 5421-file frozen candidate. This publication adds only this documentation/evidence and regenerates the root SHA256SUMS.txt afterward. It does not claim the added evidence files were inputs to the earlier run. All original 5406 non-manifest baseline files and all 14 candidate tools remain byte-identical; the final root manifest covers the published files except itself. No expensive full gate rerun is required solely for these documentation/evidence additions.
