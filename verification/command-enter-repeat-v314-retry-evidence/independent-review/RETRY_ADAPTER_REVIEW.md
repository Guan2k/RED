# v314 retry inherited-case adapter review

Decision: PASS for the retry adapter and permission to proceed with a new full-gate attempt. Attempt 1 remains a failure; this review does not retroactively change it or claim the retry full gate has passed.

Product source remains SHA-256 d0fa1baa9faed8be2a05f050b2289ea5a419654b4d95f48cef0ff2742e52091d.

## Static inspection

The retry copy changes no prior product bytes or historical v313 verification files. Relative to attempt 1, the only changed existing file is run-tests-v314.cjs: it selects the new adapter, adds its negative control entry, and updates reporting/count. New files implement the explicit inherited-case adapter.

inherit-dom-v314 wraps the prior adapter and pins the original repair-button-repeat.cjs hash, the exact prior projected program hash, and the resulting adapted program hash. It replaces precisely one unique source case and verifies its reversal. No new DOM projection, field exclusions, or snapshot reduction is added; all non-repair adapters remain byte-identical.

The altered case retains its historical branch for the frozen SOURCE_HASH and its original pause branch. On current source, attack receives a first Enter, three repeat keydowns, and a released/fresh Enter. It asserts true/true/false, prevented default/no click for every repeat, complete modeled snapshot stability after each repeat, full parity with the old single intended activation, and next-simulation parity. This is the intended contract change rather than suppression of a failing test. Because the branch is selected by nonhistorical hash, supplied mutants still exercise the current contract; the surrounding suite verifies the supplied source hash and the full runner pins its actual candidate identity.

## Independent execution

- New adapter negative-control program: 12/12. This includes full current and frozen historical repair suites, rejection of altered original programs and unknown adapters, unchanged other adapter outputs, and five source mutants (removed guard, blocked first press, missing preventDefault, cash mutation, placement mutation).
- Independent current-input review on retry source: 57/57.
- All tests ran read-only against retry RED; evidence is retained beside this report in retry-inherited-negative.json, retry-independent.json, and retry-static.json.

VM/default-click model limitations are unchanged. No native browser or accessibility delivery validation is claimed. A fresh full gate is required before release acceptance; attempt-1 evidence and historical goldens remain untouched by this review.
