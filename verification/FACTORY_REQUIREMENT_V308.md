# v308 new-purchase factory requirement feedback

Exactly four reviewed substitutions: display version; pure productionFactoryRequirementReason helper; tooltip missing-completed-factory branch; buy() same branch. Original predicates and their precedence remain exact. No new markup, DOM projection or game-rule changes.

Natural reproduction: salvage initial factory, rebuild legally, request a tank during construction. Existing v307 says only a completed factory is needed. Current feedback distinguishes running construction from paused construction, while preserving original no-living-factory wording. Existing paid orders and their waiting explanations are unchanged; no ETA or automatic order promise.

Run `node verification/factory-requirement-v308.cjs`:164/164 current vs100/164 frozen baseline. `factory-requirement-negative-v308.cjs`:four exact semantic feedback mutations. Prior purchase funding192/192 and coordinate construction80/80 pass against current source. Inverse9 and inherited projection134 checks pass. Independent boundary/natural state-parity review is archived with final gate evidence.

The v307 baseline is restored from authorized GitHub commit b6eb93c76695f75c6e65b62195e935d0bd9dcd04 with3,110 Git blob hashes and3,109 file checksums verified. All historical verification files are preserved. Current source tests are distinct from strict historical identity checks.

VM/mock-DOM and explicit controlled fixtures do not establish native browser, keyboard timing, assistive-technology, real-storage or frame-rate acceptance. Full current release status: QA_STATUS.md.
