# Independent integrated v301 review

Product SHA-256: 75c75c7a25af246d366770809853f2fab440cd734c11d9fbe6acfe840a0efd39.

Source/behavior and frozen renderer adapters pass independent review: 255 focused rendering/state/method-count checks plus 96 paint-adapter assertions, 351 total. No blocker found for the parent's final package gate. This review does not itself seal or publish the package.

Both migrated art source inputs are byte-identical to the approved prototype. Reversing the emitted renderer/data block, only the preview-help suffix, and version restores the entire final v300 index exactly. The v300 guide and v298/v299 hints therefore remain intact. Source-build --check matches. All 1789 baseline paths were retained, with historical tests unchanged at the inventory snapshot; current docs, source and generated files are the recorded changed paths.

Original focused checks were rerun on actual v301 versus final v300: preview-OFF methods and paints exact, four building cues only, turret unchanged, dynamic layers/non-cue paints retained, cached/direct/failure behavior, consecutive OFF/ON transitions and final-enemy-building frame tails. Added method costs remain friendly+6, enemy cached+5/direct+10; building paths20, combined paths30. No FPS/performance-neutral or native-raster claim.

Read final building-cue-normalization-v301.cjs and current renderer/building/health/progress test wiring. Membership uses fixed test-owned types/radii/origins, not the new product table. Stripping requires exact backing/geometry/colors/full style/transforms/order and exact preceding static-body paint; method stripping requires exact scoped save/translate/paint/restore sequence. Independent tests on actual recorded v301 output restore actual v300 paint/events and reject wrong geometry/color/transform/opacity, missing/duplicate cues, changed predecessor, whole cue moved before body and added beginPath; unrelated paint mutations remain visible. Health/progress comparisons retain their previous narrowly bounded adapters; current cached/direct suites continue testing actual current paints.

Current README now points to run-tests-v301.cjs and current v301 package scope. README current preview count is30 (10+20); player-guide current v301 count is30, while historical v0.295 was restored to29 (10+19). These corrections fix stale current references without rewriting historical release facts. Historical building-data migration documentation remains explicitly baseline19/81/9; its budget20/128/12 is unchanged. Final manifest/checksum/package gate remains the implementer's responsibility and was still being prepared at this review stage.

Evidence: review.cjs/results.json (255), adapters.cjs/adapter-results.json (96), preservation.json. Synthetic Canvas/Path2D/DOM, no storage or native-browser actions. No long aggregate duplication or product edits.
