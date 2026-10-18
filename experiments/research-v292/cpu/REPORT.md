# RED bounded CPU sampling experiment

> Snapshot note: this is the retained historical report. All baseline/run paths and reproduction commands below refer to the original local experiment, not this reduced snapshot. Raw runs and VM dependencies are intentionally absent here. Read README.md before attempting reproduction. Summary recomputation was independently verified during snapshot preparation; no new CPU sampling was performed.

## Limitations first

This is CPU sampling in the existing Node VM harness with mock DOM and proxy/no-op Canvas. It does not measure native browser layout, text rasterization, GPU drawing, frame pacing, Windows performance or player FPS. Timer callbacks are queued by the harness rather than run as real timers. The sample includes harness observation overhead, legal UI commands and trace collection. A frequent function called `get` in the profile belongs to the Canvas proxy; do not confuse it with RED's entity lookup. Sample counts are not invocation counts. Inclusive percentages overlap and must not be summed.

No code optimization, game-state/resource/entity injection, browser execution, dependencies, installations, actual player storage access or publication occurred. Normal game startup reads its mock in-memory storage; no save/load/import/export actions were requested. Original release and architecture pilot were not changed.

## Plan and scope

Reuse the existing v293 mission evaluation's legal UI script, one fixed seed (29301), three fresh processes. Scenario: Switchback, stronghold, hard, mobile challenge, 1x speed. Purchases spend earned funds; selection, movement and hold commands use the existing UI route. Stop at terminal result or original 300-simulation-second bound.

Sampling begins after source loading, scenario setup, opening orders and first RAF. Setup wall time is recorded separately. There is no discarded steady-state warm-up: main sampling includes JIT warm-up, so these are repeated cold-process traces rather than steady-state benchmarks. Setup was about 49–57 ms. Built-in inspector sampling interval is requested as 1,000 microseconds; actual deltas are retained.

## Identity and reproducibility

Baseline: ../v292-package-tools/RED/index.html

SHA-256: e5edd8f7384d37a356071c66c6788e681f3e45ad9ab224a52a783692b5ca0884

Each process checks unchanged source hash. The gameplay sequence comes from ../v293-mission-playability/verify.cjs. Each run directory contains its exact profile.cjs; only profiling, output and fixed-seed invocation were added. No changes to source gameplay functions or the VM harness.

From this directory:

    node run-1/profile.cjs
    node run-2/profile.cjs
    node run-3/profile.cjs
    python analyze.py

Re-running overwrites only this experiment's retained profiles/traces. Raw files stay outside the release/player package. profile-template.cjs is the generation reference; run the copies inside run-N directories, whose relative paths resolve correctly.

Environment reported by OS/Node: Linux x64, Node v24.19.0, V8 13.6.233.17-node.51, AMD EPYC 9V74 80-Core Processor, 9 reported logical CPUs, 10,451,439,616 bytes total memory. These are container-visible values, not a guarantee of exclusive hardware or fixed CPU quota.

## Results

All three normalized action/event/state traces are identical. Result: victory at 102.46666666666214 simulation seconds; own stronghold progress 90, opponent 0. First capture 12.4833 seconds. Observed entity counts in the approximately five-second snapshots: 18–29 total entities (not an every-frame peak count).

Main-loop elapsed wall time: run 1 = 5,503.55 ms; run 2 = 5,404.95 ms; run 3 = 5,152.90 ms. These are accelerated harness execution times, not FPS or a claim of browser smoothness.

Sampled inclusive CPU shares, runs 1 / 2 / 3:

- render: 39.43% / 37.94% / 39.35%
- advanceSimulation: 25.39% / 26.56% / 25.68%
- updateUI: 8.44% / 8.14% / 9.19%
- oreLabelLayout: 4.85% / 5.59% / 6.16%
- drawRocks: 6.35% / 5.98% / 6.25%
- drawTerrain: 1.85% / 1.83% / 1.77%
- separateUnits: 1.90% / 2.11% / 2.19%
- findMovementRoute: 0.25% / 0.30% / 0.36%
- nearestEnemyInRange: 0.56% / 0.56% / 0.61%

Harness runInContext self CPU: 21.05% / 21.02% / 18.81%. This sizable cost makes total harness time a poor proxy for production-runtime performance.

findMovementRoute appeared in 15 / 18 / 19 sampled stacks; separateUnits in 101 / 113 / 112; oreLabelLayout in 243 / 278 / 293. Those are samples, not calls. Full function self/inclusive records with file identity are in summary.json; raw profile call frames use script-local line numbers, which need not equal HTML file line numbers.

## Decision

This trace does not justify rewriting navigation, changing the separation threshold, switching to WebGL or porting to a native engine. Its ordinary force sizes also do not establish large-army scaling.

A narrowly scoped label-layout cache is a plausible next algorithm prototype: oreLabelLayout constructs candidate layouts and measures labels repeatedly, even when inputs stay unchanged. Before implementation, enumerate invalidation inputs (map, ore displayed amount/depletion, post captions, objective markers, font/viewport-related geometry) and test cache equivalence. This is a candidate supported by this harness, not a proven browser bottleneck. Static terrain/rock caching is another rendering hypothesis but its true benefit cannot be inferred from no-op Canvas.

If profiling expands later, use a separate legitimate congested battle trace rather than injected units. Real browser measurements remain necessary before renderer or engine selection and before claiming any smoothness improvement.
