# v305 independent source and verification review

Verdict: approve the narrow held-Space fix and verification integration, subject to the separately owned complete release gate and archive verification.

Reviewed source SHA256: eb77c035a87da9c884789f3908033b0b4f7bbf354ff5dcd39a2fc1df54754e3b.

## Executed evidence

- Independently authored review.cjs: 65/65 cases pass against final candidate.
- Six differential cases prove frozen v304 loses the release activation after 1, 2, or 30 repeats in running/paused battles; candidate releases exactly one all-factories selection and preserves pending world/selection state until release. A fresh press works afterward.
- Twenty short-press parity cases cover Space/Enter, running/paused, and Ctrl/Alt/Meta/Shift modifiers. These preserve the existing callback behavior; they do not establish platform-specific modifier or native default-action behavior.
- Twenty-two invalid-token cases cover element/window blur, pointercancel/lost capture, a disabled repeat, actual restart/new battle, command-blocked repeat, mismatched Enter repeat, released and consumed tokens, and pointer-origin tokens. A subsequent repeat cannot revive a canceled token, and fresh Space recovers.
- Remaining cases cover Enter/pointer repeat invalidation, no-token direct-click compatibility, composition guards, keyup sequencing, duplicate-click suppression after consumed activation, and direct/Enter/pointer click callback equivalence.
- Independently reran author's candidate suite: 62/62; frozen v304: 56/62 with exactly six held-Space failures. Author behavioral mutations: 4/4 detected. Source-inverse negative controls: 7/7.

## Diff and integration

integration-review.cjs verified source differs from v304 by exactly the proposed repeat branch and display-version substitution. The branch preserves only an unreleased, unconsumed, uncanceled same-battle Space key token on an enabled and command-eligible button. It always prevents repeat default actions. It creates no token and does not itself select anything.

All 2,099 prior verification files match the frozen v304 disk copy and full preservation manifest. Executed the 33-step strict restoration chain from v305 through v272, with extra host-manifest comparisons wherever provided. DOM projection is identical to v304; no exclusions added.

Inspected runner diff and actual routing: 75 direct focused programs plus four stable-family results, actual current source supplied to the inherited programs, exact known historical rejection shapes retained, and separately restored sources used for historical identity checks. New factory-Space positive/negative entries are included without dropping the preceding F/I/M tests. No candidate or frozen files were edited.

## Boundaries and caveats

This is deterministic VM registered-handler evidence with synthetic key/click/focus/disabled/lifecycle fixtures. It is not evidence of native browser default-click generation, real held-key timing, accessibility compatibility, hardware behavior, or user persistence.

A tokenless direct click remains allowed after an orphan repeat, exactly as in v304. The repeat event is prevented and does not itself select; the independent direct click is still accepted. Do not describe the patch as blocking every synthetic click. Duplicate clicks after a consumed token are rejected.

Modifiers retain existing handler behavior; the patch does not add modifier guards. The patch also does not change Escape/visibility cancellation or promise that a transient disable with no observed repeat/update always cancels. Those remain outside this narrow change.

An initial review assertion incorrectly expected an orphan repeat to prohibit a subsequent tokenless direct click. Baseline comparison and onclick inspection showed that was never the existing contract. The independent assertion was corrected to explicit baseline parity for that case; all remaining tests retained their original boundaries.

Full release gate and archive verification were not run by this reviewer and must be reported separately.
