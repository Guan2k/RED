# Low-ore label prototype independent review

No blocker found; suitable for a separately approved narrow integration. No product/version/GitHub change or publication was performed.

Candidate `ore-label-study/prototype/index.html` SHA256 `66ded10bca768cc9a27c1ca4f3729490a2724148ddf6ce33919155a2d6c0aeed`. Baseline frozen v302 `30a960f10a359ac13fb04b3f758529376956227bb3dce079c8be0028476594f4`.

## Independent results
- `review.cjs` / `results.json`:68 scenarios,398 assertions pass.
- `negative.cjs` / `negative-results.json`:4 behavioral mutations reject, bypassing exact-source guard: inclusive1000 cutoff, floor instead of ceil, manually nudged x candidate, ignored left glyph extent.
- `assembly.txt`: actual source-builder --check passes.

Reversing just the new label expression recovers entire baseline HTML. Thus original8/4/1 density, retained ore geometry/color, hover, clicks, mining/economy, world fields and all other runtime code remain exact. amount<=0 skip is unchanged. Positive amounts below1000 use ceil integer units, including999.5→`矿 1000`;1000 stays`矿 1k`,1001 stays`矿 2k`. This is not decimal precision.

For66 quantity/position fixtures, the layout oracle is independent of candidate code: run the unchanged baseline layout, remapping only measureText of its old ore label to synthetic metrics of the proposed string, then replace the expected returned string. Candidate actual layout must equal this expected result. Positions cover all four canvas corners and meridian/stronghold contexts; synthetic metrics include wide digits/CJK, positive left/right extents and tall ascent/descent.10 cases legitimately change x/y. All resulting checked boxes remain inside canvas under these supplied metrics, world snapshots remain unchanged, next RNG values agree. The candidate stream is never removed/filtered. No manual coordinate patch is accepted.

Two additional complete-frame comparisons (previewOFF/ON) retain every paint and method; only the six ore fillText arguments are updated to the separately validated label/layout values. Existing density and other layer paint counts remain identical. The fixture1/180/999/999.5/1000/1001 increases distinct measured label strings: measureText calls4→8 per render, while other observed Canvas method calls and paint count remain unchanged. This is a real bounded extra measurement cost, not performance-neutral or a native timing/FPS measurement. The per-invocation metrics cache still reuses repeated strings; actual cost depends on distinct labels and captions.

## Author-side evidence inspected
Read `ore-label-study/evidence/independent-ore-label-review.cjs`:48 author-side groups/11504 assertions/345 frames,11 negative mutations. It separately covers8maps, legacy/direct/cached, normal progression, synthetic fonts, all candidate/fallback collision boundaries, hover/assigned-miner/targeting parity and mining. Its oracle and whole-frame comparisons retain candidate output; they do not ignore arbitrary current label errors. These counts are not counted as our independent execution.

## Limits and fixture correction
Synthetic metrics are not measured native fonts. Root has separately viewed comparison imagery; this review does not promise0.5x legibility, accessibility or raster/browser acceptance. The positive low branch may widen text and change the old candidate choice/fallback. Preserve existing layout rules and assess any readability limitations honestly.

Initial reviewer cost check accidentally counted an additional diagnostic oreLabelLayout invocation after render, doubling candidate measures and adding save/restore events. Captured method counts/events immediately after render before diagnostics; final4→8 and event parity pass. This was a fixture observation-window error, not a product defect.
