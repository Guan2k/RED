# v304 keyboard repeat independent review

Verdict: approve the narrow behavior fix for release integration. Release packaging/version/manifests still require their normal integration verification; this review does not certify a finished release archive.

## Verified change

The candidate interface runtime fragment is exactly the baseline with `f`, `i`, and `m` added to the existing global keydown repeat-suppression array. `diff-check.json` records independently checked fragment hashes. No handler ordering, modifier guards, lifecycle guards, button action, selection predicate, or first-press branch changed.

## Actual execution evidence

- Independently authored `review.cjs`: 186/186 cases passed. Uses existing VM DOM harness but independently specified assertions and scenarios.
- 24 baseline/candidate differential cases: F/I/M, running/paused, and pending attack/ordinary/append/construction. Each baseline loses intervening pending input on a held-key repeat; each candidate preserves the full snapshot through seven repeats, and a subsequent fresh press still performs selection and clears pending input.
- 24 fresh-press equivalence cases cover lowercase/uppercase, running/paused, explicit false/undefined repeat values against baseline.
- 60 modifier/composition guard cases, 24 editable-focus cases, 48 unrelated-key parity cases, and six focused-button cases passed.
- Independently reran author's suite: candidate 93/93; baseline 81/93 with exactly 12 held-key/pending-attack failures. Artifacts are `author-candidate-results.json` and `author-baseline-results.json`.
- Snapshot comparisons include entire world state, IDs, groups, selection, placement, attack mode, drag, ordinary/append pending modes and gesture, click selection tracking, and simulation remainder. Unrelated input comparisons include preventDefault behavior.

## Interpretation

This is a real, reproducible input-safety improvement: holding a selection shortcut no longer overrides another selection/pending action performed while that key remains held. Repeat suppression is event.repeat-based and stateless, so the first event and later fresh presses are preserved. Uppercase follows existing case-insensitive dispatch. Existing focus, modifier, lifecycle and focused control behavior remain in their original ordering. Selection buttons remain independently available.

No defects found in the narrow patch. The release is worthwhile as a small quality-of-life fix, not a major gameplay change.

## Limits

All execution occurred in isolated deterministic Node VM environments with registered key events and actual button callbacks. These are not native browser keyboard timing, OS key repeat, real accessibility, visual or user-save tests. World state was naturally initialized; editable focus and modifiers were explicit event/DOM fixtures. The author's extra lifecycle cases use explicit state fixtures. The current release metadata was intentionally not assessed as ready: author confirmed it is awaiting integration and may add a display-version bump. No candidate or frozen baseline files were changed by this review.

## Final source / release-verification integration review

Re-reviewed final index SHA256 `b89d5197c8dcc4ec56b7c5a1bbf81fd0f43cb11710623d6b43520f80dd511baf`. Independent behavior suite rerun: 186/186. Final source differs from frozen v303 by exactly two substitutions: F/I/M suppression and display version. `integration-review.cjs` independently verified 2,000 old verification files byte-for-byte against frozen v303 and the full preservation manifest. Executed all 32 strict restoration steps to v272, with additional host-manifest hash comparisons wherever provided. The v304 DOM adapter resolves to the identical prior adapter object and adds no exclusions. Source-inverse controls rerun: 7/7.

Inspected runner routing: current focused programs execute against the candidate; the inherited 25 programs receive the actual candidate path/hash, allow only 15 named frozen historical-identity rejections with exact failure shapes, and explicitly rerun those identities against restored old source. Restored historical source is not substituted as current behavioral coverage. Parameterized migration retains its current source hash assertion and 18 mutation count. Approval covers this integration structure; full gate run and package verification are separately owned and not claimed as executed here.

Nonblocking documentation observation: some inherited scope prose inside the v304 runner still names v303 (e.g. “actual v303 source”). Suggested correcting only current runner prose before final runner hash freeze. No product defect or test weakening found.

One initial independent integration-script attempt incorrectly assumed every historical version had a dedicated host-manifest file and stopped at missing v281 manifest. The local review script was corrected to retain strict restoration plus compare manifests where present; subsequent complete execution passed. No candidate files were changed.
