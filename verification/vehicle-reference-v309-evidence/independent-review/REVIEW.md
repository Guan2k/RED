# RED v309 independent product review

Decision: PASS for the frozen product source; no blocking defect found in the requested scope. Final integration, package and release gates are separate.

Source SHA256: ba5e8c88592018cd42c49843f3d9f49bc91ee298d1bece3050b34b9596be714b.
Baseline: v308-work/RED/index.html, SHA256 12948c5d80dc8fd6d3fe8b892bde912fedf0849a8d85366ee0468b6e8b199e70.

## Independent checks
review.cjs loads the unchanged baseline VM harness. It does not import the author's vehicle capture, DOM adapter or assertions. It independently instruments the unchanged baseline Canvas draw functions and decodes each embedded SVG, comparing shape geometry, ordered paint layers, fill colors, opacity and identity transforms. All ten default/preview images, containing 175 paint primitives total, match the original neutral friendly-unit drawing. Display names match defs; each type has exactly one default and one preview SVG.

7,719 assertions pass. Many assertions repeat structural checks over decorative SVG nodes and across lifecycle states; this is not 7,719 distinct gameplay scenarios.

The five declared source deltas are unique and reversible; exact inversion returns the baseline bytes. Battlefield draw functions, simulation, data, economy, purchasing, movement, save rules and input handlers are unchanged apart from the existing presentation checkbox handler calling presentation synchronization.

Initial, running, paused, restart-confirmation and terminal states preserve complete game state, uid, groups, selection and input modes while opening the reference and switching styles. Original unitReferenceText remains equal to the baseline. Preference survives start, a new page defaults off, change events sync immediately, unchanged refreshes avoid redundant dataset writes and a stale gallery mode repairs on UI refresh. A 20-step natural progression pair remains equal while only the candidate's visual preference toggles.

The reference stays within the existing details, initially closed. Five ordinary visible text labels accompany ten decorative SVGs with aria-hidden=true and focusable=false. The added subtree has no control, link, tabindex, inline event attribute, external image/use/foreignObject or locally registered listener. Mock-DOM event checks do not replace native event bubbling, keyboard or assistive-technology tests.

## Layout and presentation evidence boundary
The CSS declares two minmax(0,1fr) columns, min-width:0 items, SVG width 96px/max-width 100%/height auto, wrapping labels, and mutually exclusive style selectors. These are sound static fit constraints. They are not evidence of real narrow-screen computed layout, clipping, physical readability, focus navigation or screen-reader behavior.

The design-board README correctly describes its PNG/SVG as a replay of actual Canvas commands rather than a native-browser screenshot. Its capture uses the direct-command preview fallback because the VM has no Path2D. This independent comparison likewise validates that direct rendering geometry, not browser Path2D rasterization, antialiasing or pixel parity. Preview harvester cargo-like shapes are inherited even at load=0; the in-product caption correctly says static identification and not live load/current battle state.

No native browser screenshot was captured or used as acceptance evidence. No product files were changed by this review. Documents and full integration were still being updated at review time; the existing QA_STATUS was still v308 and must not be presented as v309 full-gate evidence.

Artifacts: review.cjs and result.json in this directory, outside the product source tree.

## Integration supplement, 2026-10-19 08:18 UTC

Integration PASS to start the full isolated release gate; this is not a claim that that gate has already run.

- Independently verified all 2,548 v308 historical verification files against both pinned SHA256 and immutable v308 bytes: unchanged.
- Executed every strict restore from v309 down through v272 and verified the resulting v272 source hash against its frozen manifest: passed.
- Inspected gallery-only comparator projection in inherited comparators, command-allocation and beginner-guide routes. Independent 21 topology probes cover a valid attached gallery, detached or wrong-parent roots, duplicate IDs, wrong tag/name and child-parent membership inconsistencies. Invalid structures stay visible; existing reference text and preview control remain unprojected. Full author boundary suite independently reran: 216 passed, 0 failed.
- Current runner has 83 unique direct entries, including current v309 source-delta/DOM negative controls and both vehicle-reference suites. Four pilot results bring the declared focused count to 87. Pilot invokes the current v309 manifest and candidate hash, preserving frozen historical hosts separately.
- Package self-contained validation now removes only the exact literal SVG namespace declaration before its existing resource/network scan. Independently accepted the actual source and rejected six probes: HTTPS namespace, foreign namespace, SVG image href to the namespace URI, external hyperlink, CSS url and fetch. No broader URL whitelist was introduced. An import-generated Python bytecode cache was immediately removed; product source files were not edited.
- Inspected strengthened new tests: boolean open uses property presence, responsive SVG assertion names the exact gallery rule, and guide version mutation uses the current version anchor. These close test gaps without changing runtime.

Full isolated gate, final archive and post-gate package identity remain release tasks. Earlier browser/layout/accessibility limitations remain unchanged.
