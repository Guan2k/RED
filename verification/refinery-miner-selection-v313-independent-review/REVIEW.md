# v313 refinery miner selection independent review

Verdict: PASS within focused source/VM scope. No blocking finding.

Initial reviewed index SHA-256: `6262429e828e3bb107ac5fc58e94e3bb712e7cf04be0af5564a278e084bd2f07`.

## Evidence

- `review.cjs` and `candidate.json`: 71/71 independently authored checks pass. Forty synthetic baseline differential fixtures preserve v312 refineryEconomyInfo exactly while comparing selected membership against a separately implemented straight-line oracle. Other cases cover entity-order ties, stale anchor/membership changes between render and activation, dead/enemy/unfinished/mixed selections, zero-cohort preservation, blocked lifecycle, ordinary pause, pending gesture cancellation, order/economy/world invariance, stable native button identity, and modeled repeated Enter handling.
- `negative-mutant.json`: deliberately inverted nearest-refinery membership in an isolated test-only copy is rejected by 54/71 checks (17 unaffected checks still pass). Mutant is outside product.
- `natural-replay.json`: independent execution and inspection of builder's natural witness passes. Legitimate paid refinery construction, paid miner production, simulated completion and registered map-command handlers lead to two extant own refineries and two miners. Both refinery selections use a separately computed distance oracle and preserve whole world/navigation/delivery snapshots. It is a legal VM gameplay witness, not an independently authored scenario and not a real-browser test. The witness samples shortly after issuing movement orders; its observed current-nearest cohorts need not match future order destinations. This is correct for the feature.
- `source-delta.json`: only template/runtime, generated index/build receipt and two new verification scripts differ from frozen v312 at review time. No gameplay-rule, assignment, economy or order-execution module changed.

## Contract observations

The helper preserves historical ownHarvesters membership, including a synthetically unfinished own harvester. It does not silently substitute the other work-stage panel's completed-miner filter. Anchor must be exactly one live completed own refinery. Current straight-line distance and existing array-order tie resolution are shared with the displayed count, not persistent delivery assignments or reachable routes. A successful selection cancels pending point-selection modes while preserving existing unit orders. Zero matches leave selection and modes untouched. Click handler rechecks current state; UI's count is a snapshot. Ordinary pause permits selection; prestart, restart confirmation and terminal result block it.

## Limits

No product edits, source rebuild, version/seal changes, gate, publication or persistence write was performed by reviewer. Existing VM harness does not establish trusted browser events, physical key/pointer cancellation timing, focus/layout, touch or assistive-technology acceptance. Modeled keyboard checks are not native browser acceptance. No access restriction workaround was attempted. Parent must handle any later identity/gate/package work and recheck hash if source changes.

## Final wording recheck

Builder clarified help text to explicitly say all own miners for which the selected refinery is nearest. No JavaScript logic changed. Final source hash `49967ea573423c6d003f9a0a91a74a1cc9ca77978e9c66f9e1a94d5e627cac94`. `final-candidate.json`: 71/71 pass. `final-natural-replay.json`: legal witness passes again. Final hash is the review target.

## Integrated v313 recheck

Integrated source hash `1fa18e30606cecd2d237c74fe2056036adcb408c643fe601004de63b202d91fb`. Exact generated-source comparison against reviewed final candidate has one character change: visible version v0.312 to v0.313. No runtime logic or help text changed. `integrated-source.diff` records the source delta. `integrated-candidate.json`: 71/71 independent checks pass. `integrated-natural-replay.json`: legitimate VM witness passes again.

`integrated-inverse-review.json`: 11 independent inverse checks pass. The five uniquely anchored changes restore frozen v312 source byte-for-byte; every duplicated and missing reviewed boundary is rejected. Source negative controls additionally retain unrelated executable/markup mutations and extra bytes, and the strict restore rejects them rather than hiding them.

Final adapter review: PASS. Stable adapter code inspected and bounded negative suites independently replayed: `integrated-dom-negative-replay.json` 196/196; `integrated-source-negative-replay.json` 10/10. The DOM projection removes only valid unique BUTTON#selectRefineryMiners and P#refineryMinerSelectionHelp subtrees directly attached under the valid unique DETAILS#harvesterFleetOverview. Parent/old mining controls remain observable. Physical removal equivalence against four previous comparators, malformed/duplicate/detached roots and descendants, old controls, and previous gallery exclusions are tested. The unprojected beginner comparator remains unchanged. Adaptation checks exact frozen comparator file identities and reversibility; no broad overview exclusion or weakened gameplay oracle was found. Full gate intentionally not duplicated.
