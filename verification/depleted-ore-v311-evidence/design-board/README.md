# Depleted-ore design board (not integrated)

Open **depleted-ore-comparison.png** (1288 × 960). Rows compare current and proposed visuals; columns compare 0.1 remaining, just depleted with miner present, and depleted with miner moved clear. The board uses a 1:1 world-coordinate crop.

## Scope and provenance

Design research only. No product source, command, hover, ore selection, obstacle, or pathfinding changes. Frozen input: `../../v310-work/RED/index.html`, SHA-256 `10061270b6f245d2980f5eb7f45bc6ad742500157ac7e7b16b929fcde0f9a7bd`. The build asserts the hash before reading and after rendering.

This is explicitly **not a browser screenshot or natural gameplay capture**. The existing VM executes the entire frozen source and actual `render()`; the existing `building-recorder-v295.cjs` records actual Canvas paint commands. `replay-svg.cjs` adapts the existing verification SVG converter. Installed sharp rasterizes SVG to PNG. Browser rasterization, font metrics, browser layout, input hitboxes, timing, GPU performance, and gameplay usability are not established.

The controlled fixture retains actual terrain, ore, miner and rock drawing commands. It selects canyon terrain for a nearby actual rock comparison, retains the target ore at (420,640), sets its amount to 0.1, stages miner 5 there, and moves a different live ore to (480,530). This mixed state is a visual test fixture, not a naturally reached canyon battle. Other starting units/buildings remain in the crop. The exact fixture is saved in `fixture.js` and `evidence.json`.

## State transition and evidence

1. Set ore to 0.1 and miner mining accumulator to .35, record full `render()`.
2. Call the actual game function `harvest(get(5),.05)`. Assert ore reaches 0 and miner load becomes 0.1. Record full `render()`.
3. Stage the miner clear at (350,660), record full `render()`.
4. Check actual hover at (420,640) still returns that exhausted ore and its existing exhausted explanation.

Each state has `*-state.json` and `*-commands.json`; `evidence.json` records all assertions and before/after source hashes. All three actual renders are state-immutable. The first state contains the unchanged radius-33 brown bed, one golden chunk and actual “矿 1” text; depleted actual states contain none of these. The proposed first panel is exactly the same captured paint sequence as current.

## Proposed design illustration

Only the two depleted SVG panels add a flat gray-green circle within the old ore radius, a thin broken rim, and three short parallel diagonal marks. The illustration is placed behind actual world objects, uses no gold, raised facets, big X or persistent text, and does not represent integrated renderer behavior. Existing rock obstacles remain dark solid polygons with bright edges and interior facets; nearby live ore remains gold on brown. This distinction is a visual hypothesis, not a player-tested finding. The cue is intentionally subtle and partly occluded by the miner; the moved-clear column is the best inspection view.

No interaction or simulation behavior is proposed or changed. Actual hover remains the discoverable explanation. Later integration and browser/player checks require separate approval.

## Reproduce

From the workspace root:

    XDG_CACHE_HOME=/tmp/red-fontcache node red-development/v311-study/depleted-ore-board/build.cjs

Requires already-installed sharp; no installation performed. Reproducible fixture and assertions fail on a source-hash mismatch or unexpected bed/label counts. A font-cache warning may appear if XDG_CACHE_HOME is omitted; PNG generation still succeeds. The board was visually inspected after generation.
