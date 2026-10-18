# v297 top-edge health-bar correction

Only a shared local Y changes: `Math.max(0,e.y-e.r-12)` is used by both existing health rectangles. Nonnegative positions, x, width, color, ratio, draw predicate and paint order are preserved. No gameplay or input change. Source was edited through src renderer and template; generated index/receipt use the existing source builder.

Natural initial-world pointerdown/up/contextmenu traces select two initial tanks and request y0. Existing command rules assign y20; actual simulation stops at y24.8, radius13. Original bar Y is approximately -0.2, visible3.8px; corrected actual render is y0..4. This proves partial clipping. Fully hidden/top-threshold cases are synthetic.

New positive suite:2312 cases; 2240 branch combinations,63 complete-frame differential checks,2 natural routes,7 additional three-frame cached/direct scenarios. Ten negative controls reject missing/wrong clamp, one-rectangle fix, width, predicate, inset, world mutation, RNG, paint order and ratio changes. Expected full-frame shifts require unique adjacent entity-derived exact rectangles; unrelated paints/styles/clips stay exact. Independent review1089 plus56 expected-adapter boundaries passes.

Inherited renderer comparisons explicitly require interior HP bars, so no health normalization hides their differences. Existing narrow progress-rail adapter remains unchanged. All historical verification/tools are retained byte-identically.

Run `node verification/health-edge-v297.cjs`, `node verification/health-edge-negative-control-v297.cjs`; independent reproduction: `node verification/health-independent-v297/run.cjs` and `node verification/health-independent-v297/adapters.cjs`. The latter two files only adjust local dependency paths from reviewed originals.

VM/recording evidence is not native browser pixels, physical input or FPS acceptance. No real player storage lifecycle operations.
