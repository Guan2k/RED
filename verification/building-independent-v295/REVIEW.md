# Integrated v295 independent source review

Reviewed source SHA-256: `6e59483fa674381da5ebf5e476cb1bd9cc6e65c20679b8803b18b5827b0ff7aa`.

108 checks pass: 96 established independent building/dynamic/full-frame checks plus 12 integration-control cases. Source/art behavior is approved for the parent’s release gate; final manifests, aggregate and publication are outside this review.

Authoritative `source-build --check` passes with input hash `8465029925bd35be23b7283994771eeb60ea29f817da5e4c9a14ccea1f953076`. Candidate normalized solely from v0.295 to v0.294 is byte-identical to approved prototype SHA `764b6174ad1dc8e94e3cac5e02421f3a02a45f144b49a890e8a8204e2bee49d0`; saved pre-version assembly also matches exactly. Early preservation scan of all 938 adopted v294 source-tools files found only index, receipt and the three intended authoritative inputs changed, with none missing. Docs/current runner work was still ongoing at that scan; no final seal claim is made.

The 96 checks retain original drawBuilding and dynamic helpers, canonical/fallback geometry, world-space progress clipping, countdown/turret/HQ layers, all five types/both teams cached/direct paints, bounded initialization and failure latches, default-OFF whole frames, retained current path and clip state across actual queued RAF transitions, world/durable/RNG parity. Details and recorder limitations remain documented in ../building-art-independent-review/REVIEW.md.

The 12 additional checks verify mismatched DOM checked state is repaired FROM the session flag in both directions across initial/active/paused/restart/terminal states; one correction then ten stable UI updates creates no additional writes, state/RNG/cache changes, or false-flag cache initialization. Preview remains enabled through restart cancellation and new rounds, while a fresh page is OFF with neither cache initialized. Checkbox autocomplete hint, explicit checked=false, both-building render branch and explicit vehicle/building label are present.

No game aggregate duplicated, product edits, storage execution, browser operations or publication. Native rendering, form restoration behavior and FPS remain unverified.

Evidence: results.json (96), glue.cjs/glue-results.json (12), preservation-early.json. The established 96-case runner is ../building-art-independent-review/review.cjs, invoked with frozen v294-package-tools/RED/index.html and the v295 candidate.
