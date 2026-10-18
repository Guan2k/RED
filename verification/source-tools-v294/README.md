# v294 additive source-development tools evidence

Original architect and independent builder reports/scripts are archival; their paths can refer to the earlier pilot workspace. Original preservation.json covers all 897 pilot base files before current documentation adoption. wrapper-results.json independently covers 30 injected-spawn cases, no game execution. Current author tools: node --test tools/source-build.test.mjs (44) and node --test tools/test-development-preflight.cjs (40). Source/layout work adds no gameplay coverage. frozen-inputs.json records exact final code/input hashes before the actual isolated developer gate. Actual gate results are separate from stub tests.

Preliminary author preflight fixture run had 37/40 pass because Node test-runner context was inherited into a nested test fixture, suppressing that fixture. The fixture subprocess now removes NODE_TEST_CONTEXT; final 40/40 passed. Product/game bytes were never changed.
