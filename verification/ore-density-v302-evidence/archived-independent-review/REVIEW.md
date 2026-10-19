# Ore density prototype independent review

No blocking issue found. Eligible for a narrow integration test, subject to root approval; this is not publication approval or native visual acceptance.

Candidate `ore-density-study/prototype/index.html` SHA256 `a254ae1b82185e9ca661d2c1af417a30c9bd806b72f4dd598942f580739f40d1`; baseline final vehicle-data v301 SHA256 `75c75c7a25af246d366770809853f2fab440cd734c11d9fbe6acfe840a0efd39`.

Own evidence: `review.cjs` / `results.json`: 50 scenarios, 458 assertions. `negative.cjs` / `negative-results.json`: five behavioral mutants rejected, with whole-source identity guard explicitly bypassed so rejection demonstrates threshold/paint oracle sensitivity. `assembly.txt`: builder --check passes. Prototype and original product were not edited.

## Exact scope
Actual file comparison finds only authoritative `src/script/03-renderer.jsfrag`, generated index, and receipt differ in the compact prototype. All other copied source/tool files match final baseline. Renderer line155 changes just the ore loop limit from8 to the absolute amount buckets:
- 0 < amount <=1500: first1 original block
- 1500 < amount <=4500: first4 original blocks
- amount >4500: all8 original blocks

`oreLabelLayout` line153 still skips amount<=0. These are absolute remaining-resource bands. No per-ore capacity denominator exists in this patch; no percentage or exact-amount meaning should be attached to block count. Text label retains existing rounded-up thousands, not newly exact quantity.

Retained block angular position, dimensions, alternating colors and order are unchanged. The circular base, ore text, label layout, hover/click handling, mining and all gameplay code are byte-identical. No new flags, caches, world fields or random calls.

## Independent checks
- Entire generated HTML reverses to baseline by exactly one known substitution.
- Sixteen amounts including0, negative synthetic skip, positive fractions, exact1500/4500, just-above boundaries, integers and high quantity; preview OFF/ON.
- Eight maps with mixed quantities and hover/selection: complete paints, labels and Canvas method sequence equal after deleting only the expected old trailing ore fillRect commands.
- Explicit post/building overlap and three consecutive frames carrying recorder context/path state.
- World snapshots unchanged across render; paired next RNG outputs equal.
- Five negative controls: strict rather than inclusive lower/upper threshold, wrong middle count, angular coordinate mutation and retained-block color mutation. Each fails actual behavioral assertions.

Own tests use recording Canvas/Path2D, synthetic quantity and overlap states. They do not claim native raster output, guaranteed visibility at a scale, measured frame rate or timing improvement. Each omitted ore block removes one fillRect method call plus one fillStyle assignment: middle band saves4 each, low positive band saves7 each; high band and zero skip save0. All other observed Canvas methods, including measureText, are unchanged. Property assignments are not included in method-call totals.

## Author evidence reviewed
Read `ore-density-study/evidence/independent-ore-density-review.cjs` after it was finalized: its published42 groups/7449 assertions/144 render calls additionally include direct-preview fallback, stronghold/construction/paused/terminal overlays, normal15s progression, pure payload validation and fractional harvesting. Its full-method wrapper derives method names from actual source, counts measureText, and verifies exact surviving paints plus final context state. It does not execute storage or claim native FPS. These are author-side results, separate from the independent50/458 and5 negative results above.

## Minimum integration boundary
Keep the single authoritative renderer substitution and generated output/receipt; version/docs only as required by the release process. Preserve old tests and use narrow expected-paint projection only for those exact absent ore rectangles, with fixed thresholds/geometry and negative controls. If documentation describes the art, say approximate remaining-resource bands with existing labels retained; do not promise exact count, percentages, universal legibility or FPS gains. No additional UI setting or gameplay change is needed by this prototype.
