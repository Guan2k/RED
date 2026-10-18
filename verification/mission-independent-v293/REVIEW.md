# Independent v293 seventh quick mission review

Decision: approve scoped product change and inspected DOM-comparator adaptations. Parent retains package/publication approval.

Source SHA-256: `1fa70b3756630fe26de2c76f89045239a46126c479f1cbb22b42bc9baf3b9eca`.
Independent product suite: 20 passed, 0 failed. Reviewed adapter boundary suite rerun using the independent no-persistence harness: 109 passed, 112 assertions, 0 failed.

## Product
The new button prefills switchback/stronghold/hard/mobile only. Tests establish initial/restart/terminal state and narrative preservation, live/paused/finished-battle-view guards, all four manual overrides, no auto-start, restart cancel preserving the running configuration, exact fresh-start parity with manually selecting this existing configuration, and all six old presets unchanged.

After removing only the new frozen preset entry and its click binding, the entire inline script is byte-identical to v292. Therefore map, AI, economy, schema and objective rules are unchanged. Existing source confirms target nearest center is (600,500), friendly ownership and positive in-circle combat presence accumulates up to 90 seconds, contested presence pauses accumulation, ownership loss or absence resets; `postPresence` excludes harvesters/repair and requires distance strictly below65. HQ destruction resolves before stronghold update. Mobile prohibits new friendly turrets, not enemy turrets.

## Natural playability evidence, reviewed rather than rerun
Read the raw main harness and all nine trace summaries. Main and corrected earlier-strategy harnesses execute actual queued product RAF callbacks at fixed1/60-second timestamps. Commands use normal UI control/map handlers; the sole `g.run` reads selection. No entity, position, health, resources or progress injection found. Preliminary harness instead used simulation steps without normal UI refresh; report accurately identifies its stale-disabled-production flaw.

All three revised runs win at102.4667s, first capture12.4833s, hold90,14 paid completed vehicles,4140 harvest,12 player losses. Final circle has one tank at31.212HP. The three outcomes are identical, not independent balance evidence. No contest or reset occurs in the winning route. Corrected original strategy loses all three at228.7667s with6.9667 contested seconds and23 completed vehicles; preliminary flawed runs lose153.8667s with4 completions. These failures remain documented. The19s repair command follows the scout rather than simply parking at its coordinate, matching the report.

Original evidence harness startup may read empty mocked storage, as its report discloses. I did not execute it. Independent new tests suppress persistence refresh before bootstrap and use throwing persistence APIs; no browser/save/load/import/export/storage operations executed.

## DOM test maintenance
Inspected exact root exclusions (`quickSwitchback`, `quickSwitchbackBrief`) and exact new-to-old introductory count normalization limited to P directly under quickMissionTips. Actual comparator tests prove physical subtree removal equivalence, detached descendants and similarly named siblings retained, existing controls/fields retained, arbitrary paragraph text/attributes retained, and frozen-original program identity. No broad panel/text suppression found.

Packaging note sent to parent: raw copied playability harness retains original workspace-relative paths and reproduction command. Archive labeling is accurate; a standalone package rerun claim needs a separately adapted entrypoint.

Files: `acceptance.cjs`, `candidate-results.json`, `no-persistence-vm.cjs`, `dom-boundary-rerun.cjs`, `dom-boundary-results.json`.
