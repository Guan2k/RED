# Per-search A* heuristic cache

## Scope and baseline

Baseline: `ddc54deba51dae5754aa6d99a4b6f0ec002ee32d` (main). Only `findMovementRoute` changes in production. No UI, renderer, animation, command, save format or simulation-step change. This is independent of the animation work in PR #3.

The 600-node A* grid previously recomputed a node's Euclidean distance to the same destination on every open-set scan. A search-local 602-element Float64Array now stores each value after its first use. Cost relaxation, open-set insertion/iteration order, strict comparisons and route smoothing are unchanged. Direct paths return before allocating the array. Nontrivial searches allocate an additional 4,816 bytes, released with the call; there is no persistent cache or invalidation protocol.

## Reproducible checks

- `node --test tools/pathfinding-performance.test.cjs`: five tests pass. Exact waypoint/null equality against unmodified baseline functions, 100 seeded obstacle/radius/endpoint variations, blocked endpoints, crowd obstacles, unreachable goals and changing successive searches.
- The detour fixture reduces all distance evaluations from **9,932 to 2,579** (74.0% fewer). The work-count assertion is deterministic; it does not depend on machine speed and rejects the uncached implementation.
- `node verification/current-release/run.cjs --current-only`: passes, including the new pathfinding tests, 18 whole-index feedback/paired-trajectory tests (three 600-step maps), exact historical source restoration, effects runtime comparisons and semantic negative controls. The c2d501a and original v318 historical hashes remain unchanged; only an explicit reversible fifth boundary accounts for the new route code.
- `node tools/pathfinding-benchmark.cjs`: warmed native Node v24.12.0 microbenchmark, alternating before/after order, nine samples of 150 searches each. No timing threshold is used in tests.

Observed median milliseconds per search on this worker:

| Scenario | Baseline | Changed | Change |
| --- | ---: | ---: | ---: |
| Direct | 0.001658 | 0.001589 | within sub-microsecond noise |
| Barrier detour | 1.961252 | 1.647585 | 16.0% lower |
| Unreachable | 1.872098 | 1.714719 | 8.4% lower |

These timings are isolated CPU measurements, **not browser FPS or input-latency evidence**. This removes repeated work from route-search spikes; it does not establish that all sources of game stutter are fixed. No real-device/browser performance acceptance is claimed.
