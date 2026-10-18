# Integrated v297 independent review

Source SHA `ad451d7dd2b7b29e7006e7a5a9747694fb09e49455b2a76054b7dc29b91a571d`.

1145 independent checks pass:1089 integrated health-placement checks plus56 expected-paint adapter boundary checks. Source and current-test adaptation approved for parent release gate. No aggregate duplication or publication.

Source-build --check passes, inputs hash4ceac4d1d41fb3531dc3f89c2acdca24b26125af1eaab6791dafe4925beaf6ec. Reversing only the shared healthY change and v0.297→v0.296 exactly restores frozen v296. All1191 old files were compared; no historical verification/tools files changed. Current source/generated inputs and documentation are the only existing changes at review time; final seal is outside this review.

The1089 cases retain the independently tested threshold/predicate/team/radius/HP matrix, exact source scope, OFF/direct/cache whole-frame expected-only negative Y change, world/RNG/track parity, and five negative controls. See ../health-edge-independent-review/REVIEW.md for detailed matrix and evidence limits.

Reviewed new render-preview-v297 and building-preview-v297 changes: historical health fixtures are explicitly required to be interior (or have no bars), so no health-coordinate adaptation is applied there. Existing narrow progress-rail adapter remains unchanged. The focused health-edge-v297 expected adapter derives exact x/y/width/HP-ratio/team-color pairs from historical entities, requires unique adjacent background/fill and no clip, copies only expected arrays, and translates both shapes only when old Y is negative. Candidate paints and all unrelated styles/order remain under exact deep equality. Independent extracted-block cases cover negative/threshold/positive Y, both teams, immutable originals, malformed colors/widths/clips/adjacency/duplicates and preservation of unrelated alpha differences. Rerun after the suite’s final change still passes56.

Reviewed, but did not independently execute, the new10-case behavioral negative suite. Each mutation passes an explicit unchanged baseline and disables only the identity assertion; acceptance requires a named behavior assertion (or the named RNG error), rather than arbitrary setup failure. Cases cover removed/wrong clamp, one rectangle, width/predicate/inset, world/RNG, order and ratio changes. The final natural-world comparison occurs after candidate rendering, correctly detecting render-time world mutation.

Natural pointer/contextmenu evidence remains partial clipping only: selected initial tanks arrive y24.8/r13, yielding old3.8px and corrected4px. Fully hidden synthetic positions are not natural-route proof. No native raster/FPS or RAF timing inference.

Evidence: review.cjs/results.json (1089 candidate-bound), adapters.cjs/adapter-results.json (56), preservation.json. Shared read-only no-persistence recorder dependency remains ../building-art-independent-review/recorder.cjs.
