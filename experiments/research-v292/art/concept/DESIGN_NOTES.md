# RED vehicle art direction pilot

**概念造型，非游戏截图。** This is a separate SVG design study; the actual game is unchanged. No library upload or publication was performed.

## Deliverables and provenance

- `red-vehicle-art-concept.svg`: editable, self-contained vector board, 1560 × 1310.
- `red-vehicle-art-concept.png`: exported from that SVG using the already installed `/usr/bin/inkscape`; visually inspected after export. This is a rasterized concept board, not browser evidence.
- `build-board.py`: deterministic generator, using only Python's standard library.
- Basis: `../v292-package-tools/RED/index.html`, especially `defs` (line 13), `drawUnit` (396), `drawTerrain` (398), `render` (453), and CSS (2). Line references refer to the reviewed v292 file.

The board contains 270 comparison specimens: five types × two teams × three states × three terrain palettes × three scales, plus large design illustrations. Terrain panels are simplified comparison backdrops, not proposed replacements for actual map geometry. Top friendly heroes are 3× and accompanying enemy samples 1.4×; matrix rows are precisely 1×, 0.75×, 0.5× relative to current world-unit sizes. The board must be viewed at 100% to evaluate those nominal sizes.

## Art decisions

- Tank: broad tracks, chamfered hull and angular turret.
- Scout: distinct wheel groups, tapered front, short weapon. A silhouette change only; no movement model change.
- Artillery: rear gun mount and long barrel, retaining the current forward extent (34 world units).
- Repair: pale tool compartment with wrench-like mark and a low utility arm. No medical emblem.
- Harvester: wide cargo bed, gold material, front extraction head; future game rendering retains a dynamic load indicator.
- Green/red remain faction colors. Double stripe versus triangle adds non-color information. Neutral pale selection brackets differ from orange dashed low-health warnings.
- Dark outlines, restrained three-value surfaces, muted field/dust/slate palettes; avoid texture noise competing with units.

## Observed concept limitation

The rendered board makes the wheel-based scout and long-barrel artillery easier to distinguish by outer shape. The faction badges are small at 0.75× and particularly weak at 0.5×; color currently still carries much of that distinction. This is a concept-review finding, not a claim of accessibility compliance or game usability. Before integrating, test a small screen-space minimum badge/selection stroke in an authorized real browser. Also review the repair arm and cargo detail at native scale; avoid adding more small ornament. The three terrain backgrounds are deliberately quiet.

## Exact future code mapping (not implemented)

1. `drawUnit(e)`: replace common square chassis drawing with five type-specific paths. Keep `ctx.translate(e.x,e.y)`, `ctx.rotate(e.angle)`, and existing definitions/radii. Do not create a separate gameplay turret angle. Current shadows rotate with the body; a future art pass can draw a world-oriented offset shadow outside the rotation group without modifying entity data.
2. `unitTrackPhase(e)` / `unitTrackMemory`: retain distance-driven track phase for tracked types; no frame-count-driven animation. Scout wheels can remain static in the first slice.
3. `render()`: extract final entity-status overlay after entities and combat effects. Render selection corners, HP bars and independent faction indicators there, preserving state conditions and existing text/inspection functions. Current UI uses only friendly selection; enemy selected rows on this board are hypothetical marker stress tests, not a proposal to enable enemy selection.
4. `drawTerrain()` and `drawRocks()`: initially only palette/hierarchy adjustments after direction approval. Do not implement a large ground cache as part of this pilot. Leave obstacle geometry and passability intact.
5. Existing `fire()` and `render()` FX cases: later differentiate flash, hit and boom in presentation only. Do not change projectile origins, collision, life, damage, timing or saved fields to match art.
6. CSS: later centralize the existing field-command palette; preserve controls, visibility rules, aria text, keyboard behavior and responsive structure until separately tested.

## Performance and determinism constraints

- No simulation RNG calls from rendering, no state mutations, no changes to durable save signatures. This generator is deterministic and uses no random module.
- Candidate future cache: static type/team hull only, dynamic tracks/load/status separate. Do not allocate sprites each frame or pre-cache every rotation/map/DPR.
- Keep existing `MAX_EFFECTS=256`; decorate a single effect with a small fixed number of primitive shapes instead of multiplying event objects.
- No real-time blur, shadowBlur, screen shake, heavy smoke, external font fetches, image downloads or engine migration.
- No performance claims from the SVG. Future baseline comparison must use the same authorized browser/device, battle state and viewport. Measure render time and whole-frame p50/p95 plus cache initialization/memory; provisional gate: no >10% p95 regression, with 16.7ms a 60Hz target rather than a promise.

## Review and validation boundary

This pilot verifies only that the intended concept file rasterizes and can be visually reviewed. Native browser routes were unavailable; none were retried or bypassed. No package installs or network calls were used.

After direction review: implement in an isolated art branch; run existing regression tests and rendering-state invariance checks; then obtain real browser screenshots of mixed units, team overlap, low health and selection, ore/rocks/chokepoints, firing/repair, pause/load and narrow viewports. Compare 850px breakpoint behavior and smaller widths. Check original screenshot scale as well as enlarged inspection. Actual browser layout, combat readability and FPS remain unapproved.
