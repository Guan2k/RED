# Bounded current-document maintenance audit

Read-only scope: v301 README.md, CURRENT_VERIFICATION_ENTRY.md, QA_STATUS.md, current-verification.json and CURRENT_PLAYER_GUIDE.md. No package edits, product/version changes, browser/storage actions or long gate.

## Useful result
The previously reported README current-runner v297 and current-package v296 remnants are corrected: current text points to run-tests-v301.cjs and calls this v301. Existing relative guide section links match heading anchors.

One additional concrete omission was observed at10:07 UTC: CURRENT_PLAYER_GUIDE.md line393, inside general section “7. 必要限制与验证范围”, said “本指南对应 v0.274”. This was not a clearly historical heading; it conflicted with the current301 title. The next paragraph's unscoped “历史1078项未运行” also carried old verification context into the current limitations section. Reported immediately to parent and implementer, who corrected it while this audit was running. The new text points to current QA/entry and explicitly confines previous counts to historical records. No game defect inferred.

The v0.295 history entry's accidental30/20 path count was already identified independently; this audit did not claim it as a new discovery. Preserve29/19 for that historical entry and30/20 in the current preview section.

## Pending assembly, not new defects
At this pre-freeze observation the active manifest still declares300 and the new BUILDING_TEAM_CUES_V301.md link target is not yet present. Both belong to the ongoing verification/publication integration. They must be checked after final freeze, but are not evidence of an additional shipped defect. QA and entry explicitly say full gate is pending and do not prematurely claim success.

## Reproduction
Run `python red-development/v301-current-docs-audit/check.py [RED-root]` from the workspace. The script only reads the five documents, source identity and linked local targets, prints JSON and does not write into the package or execute any referenced command. `initial-results.json` was collected after the implementer's guide correction during this audit; its name denotes the first scripted scan, not a snapshot of the earlier incorrect wording.

It checks actual local links, Markdown heading-anchor matches, referenced README Node command existence, active source/manifest identity, and explicit “本指南对应” claims. It also inventories current-marked lines for human scope review. Explicit v278/v279/v280 sections and historical v295/v297 route evidence are not treated as current runner claims. This is a bounded check, not a general semantic proof for every historical sentence.

## Maintenance value
There is evidence for a small future release-document consistency check: current explicit version identity, current runner/path target and relative links. Such a check should distinguish historical sections and pre-freeze assembly from final release requirements; it should not replace review or repin historical tests. No new game version is warranted solely for this audit.

## Executable contract prototype

`python red-development/v301-current-docs-audit/contract.py <RED-root> [--strict]` checks the explicit current README testing section against current-verification.json: underlying command and linked runner must agree with manifest; manifest version/source/runner hashes must agree with source; the four current document first headings and general “本指南对应” claim must match source. Explicit historical guide sections are exempt from current-number requirements. All referenced local files must still exist. `--strict` returns nonzero on failures; report-only mode supports pre-freeze inspection without mislabeling expected assembly gaps.

Actual frozen v300 is a sensitivity baseline: it triggers exactly three failures, stale current README command, stale matching link, and general guide identity274. It is read only, not edited. Nine in-memory contract tests pass, including corrected baseline, individual regressions, missing link and two historical negative controls. No game execution or package mutation. This is an experimental external tool with an explicit document-structure contract, not an unreviewed regex added to the product.

Current v301 initial post-correction scan finds no remaining general guide identity issue; v295 history now correctly says29/19. Final manifest/target checks remain pending the implementer's freeze. A final rerun can close those expected assembly items without repeating the game gate.

## Final frozen-input rerun

At10:17 UTC, after the implementer froze current docs/manifest and verification, strict contract passed 34 checks with zero failures. All 28 local Markdown links and all 11 heading anchors passed. Manifest/source/current runner now agree on301 and exact hashes; missing new-specialty target is present. No remaining issue was found in this bounded current-document scope. Final document hashes and all detailed checks are in final-results.json and final-contract.json. The nine mutation/control cases remain passed. No product file was changed or long gate run by this audit.
