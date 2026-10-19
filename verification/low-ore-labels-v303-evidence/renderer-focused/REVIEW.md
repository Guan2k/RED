# Final v303 rendering and low-ore label verification

The current v303 product passes all 12 focused owned suites. This is Node VM / Canvas-command verification, not native browser, font rasterization, narrow-screen usability, GPU or FPS acceptance. No product, old suite/helper, aggregate, publication or GitHub edits were made by this work unit.

## Frozen source and results

- Current product: `8816d1df04b6bdb470a2ba64e790116c6f56eca12e3d98e5920c0cf226d51b36`
- Strict restored final v302: `30a960f10a359ac13fb04b3f758529376956227bb3dce079c8be0028476594f4`
- `FROZEN_RENDERER_INPUTS_AND_RESULTS.json` inventories the 15 new owned scripts/helpers, 12 passing reports and 17 byte-preserved historical inputs.
- `../low-ore-label-v303-details.json` is current v303 evidence, newly executed against those source hashes. The earlier prototype's 48/11,505/345 figures are not reused as current acceptance.
- Two final low-label runs produced byte-identical summary and detailed JSON.

## Results

- New low-label suite: 52 cases, 10,457 assertions, 360 complete paired frames, 50 negative controls
- Retained layout: 5,528 cases; 19 narrowly diagnosed behavioral negatives
- Whole render preview: 78 cases; 27 narrowly diagnosed behavioral negatives
- Health edges: 2,312 cases; 10 negatives
- Progress rails: 202 cases; 9 negatives
- Ore density: 134 cases
- Building preview: 450 fixtures, 5,607 assertions
- Building team cues: 450 fixtures, 10,617 assertions

## Expected-side oracle

The historical layout body is hash-locked. Only its formatting slot receives independently specified new strings, before its original `measureText`, per-frame string cache, five candidate choices, extents, clamps and fallback execute. The unmodified current candidate is checked against complete expected paints and complete Canvas methods, with no low-label paint/measurement filtering. Immutable historical source hashes remain checked before replay.

The dedicated label suite also uses an independent declarative geometry oracle. It covers integer/fractional thresholds including 999.5 → 矿 1000, 1000 → 矿 1k, 1001 → 矿 2k; nonpositive omission; all eight maps; OFF/direct/cached previews; corner/edge origins; proportional and positive CJK/digit extents; all five candidates; exhausted fallback; exact post/control/meridian-marker adjacency and circle tangencies. Higher-band text/layout remains exact. World, durable/input state and future RNG remain equal.

Cloned historical unit-track values are restored and compared to their serialized pre-render state before every expected replay. A nested sentinel verifies actual deep cloning; alias and shallow-copy variants are rejected. A movement-between-frames witness checks consecutive rendering. The new recorder accepts only methods it explicitly records, and rejects inherited gradient/getLineDash stubs by exact diagnostic.

Fifty negative controls comprise 15 layout/threshold/extent/clamp/candidate/fallback controls, 30 complete-stream controls across OFF/direct/cached modes, 3 unrecorded-method controls, and 2 track-snapshot controls. Complete-stream controls cover nontext paint geometry/color/density, label style and clips, extra nonpaint methods, extra measurement and metric-cache regressions.

## Legitimate change and retained limitations

A mixed classic OFF fixture has total Canvas methods 827 → 831, measureText calls 11 → 15, and unchanged 266 paints / 185 fillRects. Distinct new low-band strings legitimately add cached measurement entries. Wider or narrower text can legitimately change the selected candidate or edge clamp; 36 layout-change samples are recorded. No old-coordinate invariant is imposed.

All-conflict fallback still chooses candidate 0 and can overlap. Existing geometry does not solve all entity or ore-label overlaps. Metrics are explicit synthetic models, not native font measurements. No accessibility, screen-reader, GPU, FPS or native visual-approval claim is made.

## Development diagnostics

`preliminary-diagnostics/README.json` explains and hashes preserved exact earlier stdout. Harness-only corrections addressed replaying from the wrong pre-frame styles, multiline injection into a one-line extractor, and a missing top-clamp mutation witness. No product patch or relaxed invariant resulted. Review-driven track deep-copy and fail-closed method-coverage corrections are documented there as well.
