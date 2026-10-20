# Independent v312 Escape repeat review

Approved for release integration, not a release-gate or browser acceptance claim.

Candidate reviewed: v312-work/RED/index.html SHA-256 2b575e880181373fc40d72294c0be828144941d9917d60ae1a7c21125cc3e603. Identity/document integration was still pending at review time; this approval covers the product guard at this hash.

Independent review.cjs passed 47/47 candidate tests. The exact same suite on frozen v311 passed 31 and failed 16 expected regression cases. Source/artifact bytes were read-only. baseline.json and candidate.json retain individual findings; source-delta.json records editable input hashes and proves exactly one guard addition in interface runtime, with every other src file unchanged. The candidate source assembler --check also passed.

The defect reproduced through registered key handlers and real registered button callbacks: holding Escape, arming attack/build/ordinary/append actions, then dispatching repeat Escape cancels the newer action on v311. Reopened restart prompts, drag begun by registered pointerdown, fresh held-Space cancellation tokens, focus transitions from an input and return after blur were also affected. All survive repeated Escape in candidate. A fresh Escape still cancels, including repeated presses without a keyup tracking dependency. Restart cancellation restores running or paused state and map focus.

Preserved boundaries cover INPUT/SELECT/TEXTAREA/contenteditable focus; Ctrl/Meta/Alt and composition/229 isolation; first Escape with false or absent repeat field; result inspection return via fresh Escape with result-button focus; inert repeated result/prestart Escape. New repeat guard intentionally leaves defaultPrevented false, matching the existing non-Space repeat path, and does not move other input guards or introduce held-key state.

Implementation is narrow: add e.key==='Escape' to the existing repeat-only early return, after the existing focus/result/lifecycle/modifier guards and before cancellation side effects. No gameplay, storage, renderer or source-template edits were required.

Evidence limitations: tests execute the full generated script in the existing VM with mock DOM, deterministic seed and synthetic lifecycle/focus fixtures. They do not establish physical key timing, native default activation, browser layout/raster, keyboard reachability, screen-reader behavior or real storage acceptance. No browser was opened and no restricted route was attempted. No full aggregate gate or publication was run. Root/builder remain responsible for identity/document/manifest integration and the single isolated release gate.

## Final identity recheck

Final candidate SHA-256 0f469ecb007cc489df4c012736366a393fa97403b94d5b18679c22b8a9830945 passed the same independent 47/47 tests. Since the initial review, all nine source inputs match their reviewed hashes except the template, proven to contain only v0.311 → v0.312 identity replacement. The runtime fragment is unchanged. Strict v312 inverse was checked against frozen v311; depleted-ore support now removes the v312 delta before its original v311-to-v310 inversion, retaining the v310 hash assertion. These bounded adapter checks do not replace the full gate.
