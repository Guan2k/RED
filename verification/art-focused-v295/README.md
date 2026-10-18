# Combined art focused integration evidence

Source SHA256: `6e59483fa674381da5ebf5e476cb1bd9cc6e65c20679b8803b18b5827b0ff7aa`.

All five suites passed. See summary.json for case and assertion counts and per-suite hashes. Historical v294 suites remain untouched. Run each new .cjs from verification; no package outside this RED directory is required. The building suite restores exact v294 bytes through restore-v294.cjs into an ephemeral temporary directory, removed on exit.

## Deliberate v295 adaptation

- Real combined toggle initializes 29 frozen paths: vehicle 10 plus building 19. Recording Path2D now models arc. Combined initialization is 173 path methods (20 moveTo, 124 lineTo, 20 closePath, 9 arc), with zero off-mode constructors.
- Complete render tests verify explicit invocation of both vehicle and building preview branches, paint-order/style/transform/clip parity across cached/direct paths, state/RNG/track invariants and default-off old-frame equivalence. 8 maps × 90 seconds plus natural UI production/movement trajectory retained.
- Existing unit-specific cache/fill failure cases force the building cache null after toggle, isolating unit failure counts. Building failures are separately exercised by building-preview-v295: constructor first/partial, trace, arc, absent/nonfunction, first/second cached fill, with permanent latches and exact fallback paints.
- Building suite covers 450 role/team/angle/build/HP combinations and 5601 assertions. Its `passed:450` denotes that main fixture matrix, with additional failure/lifecycle/factory/map checks represented in assertions and detail fields.
- Negative render controls add ignored building branch, removed building initialization, world/RNG mutation, corrupted cached alpha, removed construction/factory progress, lost turret rotation, premature restore before construction, and retry after failed building cache initialization. Five positive building dynamic/latch cases establish passing semantic prerequisites. Existing controls still require passing unmodified prerequisite plus exact intended diagnostic/class; generic setup errors are not credited.
- Preference checks require combined accessible label, missing-API fallback for both caches and no default-off building allocation. Setting remains session-only, default-off, no new control.

## Cost and limits

Completed/no-order original / cached / direct Canvas methods: HQ 15/19/33; power 24/14/41; refinery 14/14/46; factory 13/14/36; turret 13/15/39. Detailed construction and factory state counts are in building-preview-v295.json. Direct fallback is substantially more expensive. No speedup, performance neutrality or FPS claim.

Command recording models current-path/clip/transform behavior; native rasterization, GPU/backend behavior and actual browser accessibility are unverified. The building suite suppresses mock persistence bootstrap and throws on storage APIs; whole-render/preference suites inherit empty simulated bootstrap reads with persistence-write guards. No real user storage involved.
