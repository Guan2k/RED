# Current whole-document effects evidence

Run from the repository root:

    node verification/current-effects/suite.cjs
    node verification/current-effects/negative-controls.cjs
    node --test tools/explosion-effects.test.cjs

Optional explicit inputs:

    node verification/current-effects/suite.cjs CURRENT_HTML BASELINE_HTML
    node verification/current-effects/negative-controls.cjs CURRENT_HTML BASELINE_HTML OUTPUT_DIRECTORY

The default reference is materialized outside the repository by the current-release source helper's exact inverse of the reviewed changes. It is reference-only: every actual-side test loads the **full current HTML** using `verification/vm-environment.cjs`. An explicit baseline bypasses baseline construction. Negative controls resolve the exact reference before mutation, then send full mutated current documents directly to semantic assertions with an explicit baseline. The current-source hash fence is not consulted for any mutant. The existing fragment suite is unchanged and supplementary, not a substitute.

## Coverage

- Actual hit and destruction entry points: spark, smoke, boom and 30-second scorch counts; vehicles/buildings; finite geometry; repeated damage cannot double-count death.
- Actual `update()` advances and expires particles. The test does not implement a substitute lifetime loop.
- Full `render()` invokes real effects/scar branches. A recursively write-rejecting gameplay-state proxy and state/selection/group/ID/RNG snapshots catch rendering mutation; canvas call recording verifies spark/smoke/boom/scorch branches. This is VM command evidence, not browser raster output.
- Actual `saveGame()`, `loadGame()` and `reset()`: no saved effects, save preserves live effects, load clears a valid injected legacy effect and existing live effects, reset clears effects.
- Current/reference damage multipliers, artillery splash exclusions and falloff, kill/death counters, selected-death removal, economy and purchase parity.
- Three 60-game-second mission trajectories, 600 real `advanceSimulation(.1)` steps each: classic/annihilation/normal, meridian/control/hard, switchback/survival/easy. Each uses a real attack command, purchases and a deterministic opposing-tank/repair skirmish. Entire non-fx state plus selection, groups, UID, selected-death status and RNG sequence match **every step**. Existing order/repair/cash effects are actually observed in all three. Save payloads match exactly except wall-clock `savedAt`, and loaded gameplay state matches.
- Real projectile updates produce victory, defeat and simultaneous-HQ draw, with terminal freeze parity.
- 16 semantic negative controls cover missing spawns/render branches/expiration, save persistence/load clearing, damage, money, RNG consumption, render state writes, victory handling, old-FIFO feedback eviction and wrong cash classification.

## Precisely bounded effect differences

Ordinary parity compares every pre-existing non-destruction effect object exactly, including hit, blast, flash, order, repair and cash. Only new spark/smoke/scorch types and the intentionally changed boom geometry/lifetime are excluded from the reference effect-array comparison. These excluded features have separate positive and mutation tests. No other world, command, economic, damage, selection, save or RNG field is normalized away.

## Repaired feedback pressure regression

The cap fixture adds order/repair/cash markers with ordinary .6/.3/1-second lifetimes, then delivers 24 lethal projectiles in one real update(.05). The current 256-effect queue must retain all three just as v318 does, while gameplay state, deaths and RNG match. Restoring all-FIFO or classifying cash as expendable must fail the same semantic test without consulting a hash fence.

The default gate also executes all 18 cases in tools/effect-feedback-retention.test.cjs against the actual current index: marker object identity and lifetime, mixed/critical-only pressure, unknown types, order replacement, repeated bursts, rendering, expiry, save/load and three 600-step paired trajectories against exact c2d501a. These are distinct from the separate historical v318 suite. Total capacity stays 256; critical-only overload still drops oldest critical effects.

## Limits

Node VM with stub DOM/canvas only. No browser execution, screenshot fidelity, layout, visual readability, animation smoothness, FPS or performance claim; no publication. The mission samples are bounded deterministic regressions, not exhaustive gameplay proof. Historical v318 suites remain historical reference coverage rather than current-runtime tests.
