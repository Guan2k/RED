# Independent v294 optional visual-preview acceptance

Decision: approve scoped candidate behavior for aggregate/package gating. Parent retains publication approval. Native visual/performance acceptance remains unverified.

Source SHA-256: `740f0f6155e2c316992ec7cbd9d9dbd92395810454e904baeddc376d7ff5bc3d`.

## Independent results
48 whole-source tests passed, zero failures.75 independent extracted-layout tests passed, zero failures; integrated oreLabelLayout is byte-identical to the previously reviewed prototype function, with704 baseline concat calls versus82 current calls in these cases.

- Fresh page starts unchecked and false, with closed display panel; no Path2D construction during startup or legacy rendering.
- Enable creates at most10 paths, once. Repeated toggles, restart cancellation, new rounds and terminal/new-start transitions preserve the page-session choice without rebuilding. Fresh page resets false.
- Checkbox changes preserve exact battle/input/durable-signature snapshots, narratives and menu visibility in initial, active, paused, restart and terminal phases.
- Missing Path2D, constructor failure and cached-fill failure latch fallback. Subsequent toggles/rounds do not rebuild or retry the failing cached draw.
- Original drawUnit, reset/save/load/validation/signature/command/update functions match base. The session flag and cache are outside battle schema.
- Three maps across normal, paused, selected/damaged/effects and terminal fixtures: full default-off Canvas method sequences and paint records equal base; full cached-preview paint records equal direct-preview fallback.
- Ten seconds of real queued RAF callbacks with repeated toggles preserve exact world/input snapshots and RNG streams against base.

## Current-path caveat explicitly tested
The recorder DOES NOT include current path in save/restore state. It retains current path separately across frames, and resets it only on beginPath. This matches the important Canvas rule that save/restore does not restore current path.

Two additional continuous16-frame RAF scenarios carry the same recorder/context through OFF→ON→OFF→ON. One is healthy cached rendering; the other throws on cached fill number2, after an earlier cached polygon in the unit succeeded. Every complete frame matches direct-preview paint records, including subsequent units and overlays. Every OFF frame also matches base legacy complete paints after prior preview rendering. The failing cache receives no further cached-fill attempts. Selection, damaged-unit visuals and active effects are present.

This establishes no observed current-path-residue consumer in the recorded game paths. It is not native clipping/compositing/context-loss or partial-native-paint-failure proof.

## Scope and limits
No browser, persistence, installs or product modifications. Independent harness suppresses persistence refresh before bootstrap and uses throwing persistence APIs. Whole-source synthetic fixtures and explicit lifecycle setups are labeled; native keyboard, layout and raster fidelity are not claimed.

Default-off preserves legacy vehicle paints; the local label allocation optimization is behavior-equivalent in independent cases. Preview-on still costs more Canvas calls than old artwork. Neither optional art nor concat-count reduction proves real FPS, runtime or GC improvement. UI wording appropriately labels experimental status and potentially higher draw overhead.

Evidence: `acceptance.cjs`, `results.json`, `layout-acceptance.cjs`, `layout-results.json`, `no-persistence-vm.cjs`.

## Final checkbox hardening
The final delta from the initially reviewed e66903 source is exactly autocomplete="off", the bounded updateVisualPreviewControl helper, and its updateUI entry call. Removing these three changes restores the initial hash exactly. The helper only corrects the checkbox from the page-session flag, never the other direction.

Ten additional mismatch cases test both flag directions in initial/active/paused/restart/terminal phases. A mismatched checkbox causes exactly one correcting property write; twenty subsequent UI refreshes cause zero additional writes. The flag, world/input/durable signature, RNG and cache identity/construction count remain unchanged. False flag plus stale checked DOM does not activate preview or create paths. Explicit startup checked=false remains. autocomplete is only a browser hint; no guaranteed native form-restoration behavior is claimed.
