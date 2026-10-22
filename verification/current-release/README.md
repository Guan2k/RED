# Latest source layered validation

The displayed game version remains v0.318, but the unpublished source is based on the c2d501a UI/effects artifact plus the feedback-retention fix (current SHA-256 is pinned in source-contract.json). The integrated candidate includes the bounded feedback-retention queue fix; styles, renderer and all unrelated gameplay retain exact published bytes.

The default stable entry runs two explicitly different layers:

1. Current source: exact four-boundary source contract (including the queue fix), 18 whole-index feedback-retention tests, existing effects fragment tests, whole-current-index runtime effects/differential scenarios and semantic negative controls. The inverse delta is never used as the current runtime input.
2. Historical source: reconstruct exact original v318 index; restore the archived stable runner and its exact release contract into a private directory; run its existing game aggregation unchanged. Its nested historical report's `current` labels refer to that v318 artifact only. This is not a latest-source replay of every old test. Historical package integrity/developer preflight are not run on that mixed private copy.

Any current layer failure stops the gate before historical success can mask it. All scripts, archived metadata and source-delta data are sealed in the package and explicit dependency inventory. The root developer preflight also verifies current editable-source/build consistency.

Known gap: the entire frozen focused-test collection has not been migrated to latest effects/CSS semantics. Strict unchanged-source boundaries are useful static evidence, not proof of unchanged behavior. New runtime comparisons must supply the actual current behavior evidence.

Feedback regression repaired within the 256-slot bound: only new spark/smoke/scorch are expendable. Current runtime pressure assertions require live order/repair/cash retention; old-FIFO and incorrect-cash-classification semantic mutants must fail. Semantic-only overload retains bounded FIFO rather than promising unlimited retention. The runtime report labels this targeted acceptance, never full UI acceptance.

No native-browser, touch, raster, FPS or real-device storage acceptance. Simulated storage tests only exercise actual save/load code within the Node VM harness.

Optional DOM projection optimization remains opt-in and SHA-locked. It applies only to the unchanged allocation-feedback test during historical replay. An explicit-mode pass must not be described as a default untransformed gate pass.

Additional targeted gate checks: `node verification/current-release/paths.test.cjs` validates the exact archive-name exception; `node verification/current-release/gate.test.cjs` tests disposable-package dependency omissions, metadata mismatches and propagation of a current-suite failure. These are validation-structure checks, not extra gameplay coverage.
