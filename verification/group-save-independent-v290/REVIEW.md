# Independent v290 group-save acceptance

Reviewed source: `red-development/v290-group-protection/RED/index.html`
SHA-256: `85c7c33f0ae8022294c6392df37b52525cd97367dd9aaad82475c4825a3ac8e3`

Decision: approved for the scoped empty-group save protection, subject to the parent completing package/release checks.

The independently written acceptance suite passed 189/189 cases. The same suite on v289 passed 69 and failed 120, establishing sensitivity to empty/invalid saves and dead entries in otherwise-valid saves.

Coverage: all three groups via central function, Ctrl digits, Meta digits, Ctrl-click group buttons, visible save buttons and direct visible callbacks; empty, building-only, enemy-only, missing and dead-only selections; preservation of pending construction, attack, ordinary/append modes and drag; mixed live/dead replacement including harvesters and repair vehicles; paused operation; unopened, restart and terminal rejection; stale eligibility; unchanged recall.

Source diff contains the version label, a clarifying comment, and the save branch of `controlGroup` at line 775. It computes eligible live friendly vehicles once, returns with feedback if none, and otherwise assigns that exact list. Recall is unchanged. No new defect or required product change identified.

Harness limitations: synthetic whole-source VM/DOM, not native browser input. Explicit lifecycle/health fixtures are used. Persistence-facing refreshes are disabled in the scratch harness before bootstrap and persistence APIs throw; no save/load/import/export/storage operation invoked. Source package remained unmodified by this review.

Files: `acceptance.cjs`, `no-persistence-vm.cjs`, `baseline-results.json`, `candidate-results.json`.
