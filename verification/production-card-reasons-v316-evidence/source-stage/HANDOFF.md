# v316 production card reasons: source-stage handoff

Baseline: published v315 commit d321ddd7d28070d068c916e89cfe5f09a86e849b. Original package preserved at ../../v315-recovery-integration/RED. Candidate is ../RED. No publication performed.

Implementation adds five text nodes in the production buttons, styles them as wrapping secondary text, and writes the existing productionPurchaseReason result alongside the existing title update. Empty availability reasons explicitly clear stale text. No gameplay or input-handler change. Source delta records all changed hashes: three editable inputs, generated index, receipt; two focused tests added, no deletions.

Passed: production-card-reasons 78; purchase-funding regression 192; factory-requirement regression 164; construction-reasons regression 47. Source-build --check passes. Two mutation controls reject missing updating (61 failing cases) and stale-after-recovery (26 failing cases). Running the positive suite against v315 produces 77 failures/1 pass, confirming it exercises new behavior.

Current source builder suite: 100 pass, 1 fail. The only failure is current-verification.json.sourceSha256 still binding the v315 artifact (3956a8...) rather than candidate artifact (5086ac...). Release identity, documentation, manifest and checksums intentionally await the parent's integration phase; do not treat this as a release-ready sealed package or claim the full suite passed.

An initial mistaken run of the historical source-build-vehicle-art.test.mjs also has 100 pass/1 fail: historical renderer exact-restoration expectation. The same historical test fails identically against untouched v315 (source-builder-historical-baseline.txt). No historical fixture or expectation was changed.

No real browser, native layout, touch, keyboard timing, screen reader, storage or FPS acceptance was attempted. CSS wrapping assertions establish source properties only, not narrow-screen visual acceptance. Independent review and one unified release gate are still pending.
