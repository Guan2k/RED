# RED v311 independent product review

Decision: PASS for frozen product source; no blocking finding. Integration/history compatibility/full release gate remain pending.

Source SHA256: 60bf7eaa9493f1e0fbec3467fb81a8ff25d5ea89f7143fb362adc76a15fe8fc0.
Baseline: v310-work/RED/index.html. Review evidence stays outside the product tree.

## Independently verified
149 assertions passed using unchanged v310 VM harness and a self-written Canvas state/call recorder. No author's assertion or capture module is imported.

The three source changes reverse exactly to baseline: version, helper and one ground-layer call. No hover, mining, movement, building placement, ore collision, economy or save logic changed.

Zero and negative finite values draw one subdued fill, a dashed ring and three diagonal lines. Positive values, including Number.MIN_VALUE, 0.00001 and 0.1, produce zero calls from the new helper. Recorded radii are 32 and 31.5. World objects remain unmodified, including when frozen. A nondefault incoming alpha, fill/stroke colors, linewidth, line cap/join/miter and line dash are preserved; save/restore balances.

Across all eight maps, with controlled depleted ore entries, complete serialized old rendering call streams are identical after excluding only the new helper's traced segment. Final recorded Canvas styles agree. The new call is after terrain/grid and before rocks, stronghold/ore labels, buildings and units. Existing layering and other drawn content are otherwise unchanged. This checks recorded calls/state, not actual browser pixels.

A controlled fixture starts with 0.1 ore, a positioned miner and ready mining timer. Full advanceSimulation consumes that remaining ore and increases miner load by 0.1; the next tick and complete state agree with v310. Moving the miner aside for inspection preserves exhausted-ore hover and inspection lines. Construction placement rejection, construction preview and movement obstacles remain equal. This is a genuine mining transition from an explicitly injected starting fixture, NOT proof of an untouched natural match depleting a full deposit.

Separately, an unmodified ten-game-second start/play pair stays identical while the candidate renders repeatedly. This verifies short natural progression only, not natural depletion or long-game outcomes.

## Limitations and corrections
No native-browser screenshot, pixel/raster, contrast/readability or frame-rate acceptance is claimed. The design comparison board is offline drawing evidence. No gameplay source files were modified, committed or published.

The first complete-call comparison used deepStrictEqual across two VM realms and failed on equal-structure realm-specific objects. The test was corrected to compare serialized recorded call values, preserving order, arguments and styles. The first failure is saved; no product change was needed.

Artifacts: review.cjs, result.json, first-cross-realm-assertion.log.

## Integration supplement, 2026-10-19 09:59 UTC

Integration PASS to start full isolated release gate. This does not claim that full gate or final package has already completed.

- All 2,834 frozen historical verification files independently match pinned hashes and v310 baseline bytes. Complete v311→v272 restore chain was actually executed and final hash verified. Current runner has 87 unique direct entries plus four pilot results; current files exist and source/manifest identities agree. DOM adapter simply forwards v310; no new exclusions.
- Frozen expected-side draw adapter reviewed: five approved historical render hashes and a pinned drawRocks identity, one protected grid→rocks insertion, rejection before mutation for unsafe inputs, and byte-preserving inverse of the insertion. Seven current draw-suite routes apply it only to historical expected VMs; candidate paint/call streams are neither changed nor filtered. Building-reference's old-script assertion first performs exact v311 inverse.
- Independently wrote and ran ten adapter checks, including current renderer, double adaptation, wrong/repeated layer and unrelated change rejection. Independent expected-insertion versus actual helper traces agree at fractional coordinates, preserving arithmetic order.
- Independently reran current depletion 69/69, its 23/23 targeted mutants, ore-density 135/135 including adapter boundaries, and low-ore-label 52/52.
- Inspected author's completed JSON reports: render-preview 78/78 and 27/27 mutants, building-preview 450/450, team-cue 1/1, progress 202/202 plus 9 mutants, health-edge 2312/2312 plus 10 mutants, building-reference 21/21 plus 13 mutants. These latter numbers are reviewed author-run evidence, not an additional independent rerun.
- Adapter file reviewed hash: 2555b64b8aac2c83d7e5b21c09ef75c0d0c8752e4edd5e83260b9828c5eb48a3. Product source hash unchanged.

Artifacts added: expected-boundary.cjs/json, author-rerun.json, negative-rerun.json, ore-density-rerun.json and low-label-rerun.json. Original native-browser and natural-depletion evidence limits remain in force.
