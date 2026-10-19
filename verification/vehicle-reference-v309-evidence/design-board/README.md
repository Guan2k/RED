# Vehicle reference design evidence

## Delivered

- `vehicle-reference-board.svg` and `vehicle-reference-board.png`: five names from current `defs`, both current render styles at intended **96 × 64 CSS pixels** and **192 × 128 (2×)**. This is an SVG replay of actual current Canvas draw commands, **not a native-browser screenshot or browser acceptance test**.
- `snippets/*.svg`: ten reusable exact inline SVGs, each decorative (`aria-hidden="true" focusable="false"`).
- `snippets.json`: the same ten snippets keyed by `tank-default`, `tank-preview`, etc., ready to embed as static markup. Keep the adjacent name as real text.
- `canvas-commands.json`: full intercepted commands for each body.
- `manifest.json`: source/harness hashes, neutral inputs, per-snippet hashes.
- `verification.json`: successful independent hash, dimensions, save/restore balance and geometry bounds checks.

## Exact source and capture

Frozen source: `../../v308-work/RED/index.html`.
SHA-256: `12948c5d80dc8fd6d3fe8b892bde912fedf0849a8d85366ee0468b6e8b199e70`.

`build-board.cjs` loads the **full current index** through its own current `verification/vm-environment.cjs`, then invokes the original `drawUnit` or original `drawUnitPreview`. No reimplemented vehicle artwork, external assets, gameplay source changes or dependency installation. Friendly team 0, position 0/0, angle 0, stored track phase 0, load 0; radius/name/health derive from `defs`.

The VM has no Path2D, so the original current exact direct-command fallback for preview polygons is captured. Full-circle arcs are recorded as two SVG arcs. Eight-digit Canvas colors preserve their alpha. A state stack restores matrix, fill color and opacity. Each primitive receives the current composed matrix, avoiding the historical recorder's incorrect fixed closing-group count. Unsupported arc forms or cached path objects fail closed. The output is valid standalone SVG rather than nested unbalanced transform groups.

Shared viewBox: `-24 -24 72 48`, dimensions 96 × 64. This has the same scale for every type and both styles, preserves all artwork including artillery's x=34 cannon and harvester's y=20 shadow, and leaves margin. Neutral artwork is intentionally positioned left of the viewport center to accommodate forward-pointing barrels consistently. No recentering or shape rescaling per type.

Important visual truth: the preview harvester renderer already draws ore-like cargo shapes even with `load=0`; only the load meter depends on load. These shapes are preserved exactly, not removed to imply an empty cargo bay. Captions should say static identification / not live state rather than promise a visually empty vehicle.

## Smallest integration

1. Insert five static identification items inside the existing default-folded `unitReference` details. Keep all current `unitReferenceText` and original paragraphs untouched.
2. Each item has one normal text name from `defs` and two decorative SVGs. Do not add per-image tabindex, links, click handlers, controls or tooltip-only names.
3. Default SVG visible, preview SVG hidden initially. At the existing preview-toggle event, change only the gallery's presentation class/attribute or the paired SVG visibility to match the existing preview flag. Do not call the render functions at runtime for the help images, create live entities, touch track memory, render from state, or alter parameters.
4. Two-column CSS grid; each SVG `width:96px;height:auto;max-width:100%`; item text can wrap. Maintain `details` closed by default. If using `[hidden]`, ensure CSS never overrides its hiding behavior.
5. Explain briefly: friendly static identification images, not current battle state. Full old rules remain available beneath.

## Reproduce and inspect

Run from any directory:

    node path/to/vehicle-reference-board/build-board.cjs
    node path/to/vehicle-reference-board/verify-board.cjs

Uses already installed `sharp` for SVG rasterization; fontconfig emitted cache-write warnings but rendering succeeded with installed Noto Sans CJK SC. No fonts or packages were installed. PNG was inspected through `view_image`: all five Chinese names and both column labels are readable; all ten bodies, long artillery barrels and harvester shadows are uncut at both sizes. Actual browser responsive layout, accessibility behavior and existing toggle integration remain for the integration owner to test.
