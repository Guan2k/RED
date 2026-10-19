# v305 all-factories held-Space fix

The repeated-key branch alone now retains an enabled-button, same-battle, Space-key token that is not released, consumed or canceled. It still prevents default for repeats; every other token follows the prior cancel branch. Display version is the only other product edit. No Escape or visibility rule is added.

Reproduction: start the battle, select the army, focus selectAllFactories, dispatch initial Space down, repeat down, Space up and the release click. Frozen v304 retains army selection, whereas short Space selects the initial factory. The current branch permits exactly one release selection and preserves later deliberate presses. The existing all-factories keyboard test repeated only after a finished first activation, so it did not cover this held-before-release ordering.

Portable current probes are factory-space-v305.cjs (62 cases) and factory-space-negative-v305.cjs (four mutants). Frozen baseline rejects exactly six held-Space cases. Explicit blur/focus, disabled-at-repeat, menu/new-battle, pointer cancellation, Enter, mixed tokens, composition and duplicate-release boundaries remain checked. The four mutants cover original cancellation, overbroad preservation, missing default suppression and missing disabled check. This is registered-handler VM evidence; native default activation is not simulated as a platform guarantee.

changes-v305.json contains exactly the two source replacements. restore-v304.cjs pins complete current and historical source hashes. Source-only inverses preserve unrelated mutations for source-comparison tests. Current wrappers route the actual candidate to the same inherited behavioral suites and preserve all earlier identity gates; no DOM exclusions are added. v304-host-manifest.json preserves every frozen verification input.

Current full-gate status is in QA_STATUS.md. Historical results remain their original versions. No native browser, storage lifecycle, FPS or remote publication claim follows.
