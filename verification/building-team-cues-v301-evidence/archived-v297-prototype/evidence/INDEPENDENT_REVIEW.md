# Independent building-stencil prototype verification

Result: **PASS within isolated prototype scope.** No release, publication, version bump, baseline edit, or historical-verification edit was performed.

- Candidate: `../RED/index.html`
- Candidate SHA-256: `362a8749b3d9fcecc881844290328200f4c6a62a423f82de1745461b66c83c89`
- Baseline: `../../v297-beginner-guide/RED/index.html`
- Reproduce: `node independent-stencil-verification.cjs`
- Detailed evidence: `independent-stencil-results.json`
- Console record: `independent-stencil-run.log`

## Coverage and result

10,278 assertions passed. Coverage includes 450 type/team/angle/construction/HP combinations; four marker-bearing types plus unchanged turret; 10 failure modes; all five production statuses; unknown type and noncanonical radius fallback; 16 full-frame scenarios each rendered twice; 8 additional final-building path scenarios each rendered twice; and 90-second simulation/RNG parity on each of the eight maps.

Only the intended four files differ from baseline: art data, renderer source, generated index, and build receipt. Existing geometry entries and all static recipes remain identical. Original building drawing, unit preview, whole-frame rendering, production/construction helpers and rally rendering are source-identical. The preview function differs only by the single helper call after the static body. Recursive before/after file hashes verify this test left both product trees and their historical verification files untouched.

Default OFF has no Path2D allocation and is exactly baseline-equivalent for every recorded Canvas method and paint in completed, construction, production, and effects frames. ON differs only by the expected cue paints and methods. Selection outlines, critical-health rings, HP bars, construction veils/countdowns/rails, production labels/rails/clips, dynamic HQ flags, turret rotation, vehicle drawing, effects, and next-frame painting remain unchanged.

## All Canvas method calls, not just paints

The recorder checks that every ctx method called by the source is instrumented, including `measureText`. These counts include save/restore, transforms, path construction, clipping, failed fills, and paints. JavaScript helper calls/property assignments are not Canvas methods. Constructor/path-building costs are reported separately below.

Completed building, no queue, canonical radius:

| Type | Baseline cached | Friendly cached | Enemy cached | Baseline direct | Friendly direct | Enemy direct |
|---|---:|---:|---:|---:|---:|---:|
| HQ | 19 | 25 | 24 | 33 | 39 | 43 |
| Power | 14 | 20 | 19 | 41 | 47 | 51 |
| Refinery | 14 | 20 | 19 | 46 | 52 | 56 |
| Factory | 14 | 20 | 19 | 36 | 42 | 46 |
| Turret | 15 | 15 | 15 | 39 | 39 | 39 |

Per cue: friendly +6 methods on either backend; enemy +5 cached or +10 direct. Friendly paints increase by 3, enemy by 2. Turret increases by zero methods/paints.

A frame containing both teams of all five building types adds exactly **44 cached methods or 64 direct methods**, plus 20 paints. The completed fixture increases 676→720 cached or 914→978 direct calls. These full-frame totals include three measureText calls.

Initialization: 19→20 Path2D constructors and 100→104 path-tracing calls. Added cost is one constructor plus four methods, once per successful initialization. The 20-path cache is at the existing path-count budget; drawing does not grow it.

## Failure/latch behavior and costs

Passes: missing Path2D; non-function Path2D; first, partial, and marker-index constructor failure; trace failure; arc failure; first and second cached-fill failure; and the first marker-specific cached-fill failure after all static-body cached fills succeed.

Every failure produces successful-paint parity with direct drawing, preserves world/durable state, restores saved context state, permanently latches the building cache to null, and avoids retrying a failed fill or initialization on later draws.

- First static-body fill failure: one failed method call is added to baseline and prototype. Relative marker cost stays friendly +6 / enemy +10. Subsequent draws use the pure direct totals above with no repeated failed call.
- First marker-specific failure: cue costs 11 methods, so the full draw is HQ 19→30 and power/refinery/factory 14→25 relative to baseline cached. This includes the failed Path2D fill and successful direct fallback.
- After marker failure: the entire building cache is null. Subsequent draws use the direct totals above; enemy delta +10 relative to baseline direct.
- Constructor failure at index 19 (the twentieth path) correctly discards the partial cache rather than publishing an incomplete one.

Full per-type first-failure/latched cost rows are in `failureCosts` in the JSON evidence.

## Context and current-path distinction

Every cue uses exactly one save, one fixed-origin translate, and one restore, with no transform/style/clip/dash leakage, including when the cached fill throws. Nested caller transforms, clip, opacity, composition, font, stroke/fill styles and related state restore exactly.

**Canvas save/restore does not save the current path.** Friendly rectangle cues and cached enemy cues leave the prior current path unchanged. Enemy direct fallback replaces it with the translated triangle. When power/refinery/factory is the final entity and no subsequent path resets it, that triangle remains the frame's current path; HQ resets it for the flag. This is explicitly tested and is not claimed to be full current-path restoration.

All existing full-frame and next-frame consumers produce identical non-cue paint records; no actual render tail unintentionally strokes/fills that leftover path. Future code that strokes a current path after rendering without first starting its own path would need to account for this normal Canvas behavior.

## Limits

This is synthetic Canvas/Path2D command evidence, not native raster equivalence, screenshot readability, browser compatibility, or measured FPS. Cached-fill failures target the Path2D overload; arbitrary failures of the direct Canvas primitives are not promised recoverable. The inherited VM harness suppresses bootstrap persistence probes and makes every storage API throw. The tests therefore establish the draw/simulation scope without accessing persistence, rather than providing a storage-migration test.
