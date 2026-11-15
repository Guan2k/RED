# Bounded animation comparison

## Revisions and matched scenario

- **Before**: `ddc54deba51dae5754aa6d99a4b6f0ec002ee32d`, generated index SHA-256 `40a87bb71d524b5cf7756a39c4806a14655656e69a4bbd4774584a7dbf7494af`.
- **After**: this PR's renderer, generated index SHA-256 `05df30c381e1e8edb9d1571b522b1598f55d65ef2bc656d97d5679dc5b745521`. The source-build receipt and exact fifth inverse boundary identify the changed revision without a self-referential commit hash.
- Actual offline game loaded in Chrome 157.0.8103.51; viewport 1440×1100, device scale 1, dark theme, classic map, seeded initial state. One HQ and two tank destruction effects are emitted using the game's real helper. RAF is held and the existing effects are aged to identical simulation times for capture; no mock drawing or replacement renderer.
- `before-0.08.png` / `after-0.08.png`: ignition.
- `before-0.24.png` / `after-0.24.png`: expanding fire and pressure front (primary comparison).
- `before-0.55.png` / `after-0.55.png`: cooling blast.
- `before-1.3.png` / `after-1.3.png`: unchanged smoke/wreck continuation. Full-page captures use this late state and are intentionally identical.

All battlefield PNGs are 1066×712. Pixel differences for 0.08/0.24/0.55 are localized around the three emitted explosions; 1.3s and the full-page images are byte-content-equivalent pixels. No page errors occurred. Captures were machine-checked for dimensions and localized differences; aesthetic judgement is left to the human review (the execution model cannot view image inputs).

## Performance and scope

Existing queue remains capped at 256 effects; no particles or gameplay queries are added. Under 128 active effects, a blast uses six fixed fire lobes and one pressure-front ellipse, with no blur, filter, gradients, new assets, timers, allocations of effect objects or RNG calls. At 128 or more, lobes/pressure-front detail is omitted; smoke uses one circle rather than three, spark heads are omitted and ground fragments drop from five to two. Order, repair, cash, hit, muzzle-flash and artillery-radius feedback retains its previous detail. Detail recovers when the queue shrinks. Effect state and lifetime are untouched.

The primitive-count regression verifies busy decorative cost is below 60% of detailed cost per effect for the fixed mixed scene, saturation stays linear, feedback detail is retained, and render does not mutate the state.

`browser-report.json` contains 120 measured render-CPU samples per scene after 20 warmups. Before → After median / p95 milliseconds:

| Active effects | Before | After |
|---|---:|---:|
| 60 | 1.8 / 4.9 | 2.2 / 4.9 |
| 128 | 1.7 / 3.4 | 2.2 / 4.6 |
| 256 | 2.5 / 4.2 | 2.5 / 6.9 |

These are noisy headless Chrome CPU submission times for the complete renderer, not end-to-end frame times, GPU measurements, mobile/low-end results or an FPS guarantee. The richer low-load effect is not free; this run does **not** establish a speedup, and the saturated p95 is worse. The bounded primitive cost is the deterministic performance safeguard, not a claim that every device is faster.

## Reproduce

Install Playwright in a separate developer location (not a player dependency), select its module using `PLAYWRIGHT_MODULE` if necessary, and run:

```sh
node tools/capture-animation.cjs /path/to/baseline/index.html index.html verification/runs/animation-capture
```

Use the exact Before revision above; both inputs must be real generated game artifacts. The tool launches installed Chrome with `channel: 'chrome'` and writes matching screenshots plus the raw browser report.
