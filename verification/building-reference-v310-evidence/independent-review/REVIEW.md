# RED v310 independent product review

Decision: frozen product source PASS; no blocking defect found. Integration/history/runner and full release gate remain separate pending checks.

Source SHA256: 10061270b6f245d2980f5eb7f45bc6ad742500157ac7e7b16b929fcde0f9a7bd.
Baseline: v309-work/RED/index.html.

## Independent results
Self-written review.cjs uses the unchanged baseline VM harness and independently records original baseline drawBuilding/drawBuildingPreview calls. No author capture module or test conclusion is used. Full-state drawing stacks preserve fill, stroke, alpha, line width/cap/join/miter and translations. Each of the ten embedded default/preview SVGs matches ordered baseline geometry, colors, transparency, stroke properties and team-cue translations: 108 paint primitives total. Circles, polygon paths, rectangles, HQ flagpole/flag, turret barrel, shadows and building team cues are included.

All ten diagrams share viewBox -60 -68 120 120 and 96x96 declared size, preserving inter-building scale. Every primitive's translated geometry plus conservative stroke bounds fits the viewBox, including the HQ shadow and flag. All five names match defs; HQ additionally states 不可新建.

5,623 assertions passed. This number includes repeated attribute/structure checks over SVG nodes and lifecycle states; it is not 5,623 distinct gameplay scenarios.

The four declared source changes reverse exactly to baseline bytes. Battlefield draw functions and core simulation are unchanged. The complete vehicle-reference markup is byte-identical to v309. Original unit/building text remains equal to baseline. Both visual galleries sync on the existing checkbox change; unchanged updates avoid writes; stale building mode repairs; preference survives starting a battle, while a new page starts off.

Initial, running, paused, restart confirmation and terminal cases preserve complete state, uid, selection, groups and input modes while opening reference and toggling appearance. A natural paired advancement also remains identical. Reference remains under existing initially closed details. Added nodes contain no control/link/tabindex/event attribute/external image or locally registered handler; the SVGs are decorative and nonfocusable in markup. Mock-DOM dispatch does not certify native event bubbling, focus order or assistive technology.

## Evidence boundary
Scoped CSS declares minmax(0,1fr) columns, shrinkable cards, 96px/max-width100%/height:auto SVGs and wrapping text. This is static layout-contract verification, not native narrow-screen or clipping/readability acceptance. Default/direct-fallback Canvas primitives are verified; no browser Path2D raster, antialiasing, screenshot, physical keyboard or screen-reader acceptance is claimed.

The first recorder draft inherited a vehicle-only assumption that every transform was identity. It correctly failed on building team-cue translation (-18,-5). The independent recorder was extended to track translation stacks; product code was not changed. The original failure is preserved in recorder-initial-failure.log.

Evidence: review.cjs, result.json. All review evidence is outside the product source tree; no product edits, commits or publication were performed.


## Integration supplement, 2026-10-19 08:50 UTC

PASS to start the full isolated gate. This does not assert that the gate has already completed.

Independently verified all 2,681 frozen v309 verification files against pinned SHA256 and baseline bytes. Executed the complete v310→v272 strict restoration and verified the final historical hash. Current runner has 85 unique direct entries, no missing scripts, current v310 source/DOM negative controls, both building suites and both vehicle suites; four pilot results bring the declared total to 89. Current pilot pins the reviewed candidate hash.

Reviewed the new building-only subtree projection layered after the unchanged vehicle projection in inherited, allocation and guide comparators. Independent 28 topology probes confirm invalid roots/parents/duplicates/tags/membership are not hidden and neither original text, preview control nor the vehicle gallery is included in the new building exclusion. Independently reran all 252 comparator boundary tests: passed.

The v310 vehicle test changes only its capture filename (capture bytes remain identical) and narrows the decorative-SVG count to the old vehicle gallery before the newly added building gallery. This prevents legitimate new building images from invalidating the old count without dropping old vehicle checks. Independent vehicle rerun: 19/19.

Reviewed the new building recorder and tests: no study/image-library dependency; full canvas style/transform stack and natural factory-progress absence. New building tests independently reran 21/21; all 13 targeted mutants independently reran successfully, each requiring its named behavioral assertion to fail rather than accepting a generic hash failure.

Product source hash remains the reviewed hash. Final full gate, final archive and post-gate input identity checks remain release coordination responsibilities; native-browser evidence limitations remain unchanged.
