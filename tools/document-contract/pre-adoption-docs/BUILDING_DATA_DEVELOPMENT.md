# Building-data source tools supplement

Based on the published v297 package (commit76854f15daa249144ce77f5d074d2bcbebb495e0). No new game version or publication.

## Editable inputs and build

`src/art/buildings.mjs` is a real ES module with three named exports. It contains the exact former canonical-radius, geometry and recipe declarations. Edit its existing tuples/colors, then explicitly run `node tools/source-build.mjs --write-generated` from RED. Do not edit index.html or the insertion marker. The renderer remains a single ordered classic-script fragment, sharing existing globals at runtime.

The fixed input order appends this data file to the existing input list. Exactly one `@@RED_BUILDING_ART@@` marker must be on its own line immediately before `function buildingArtTrace(`. The builder removes only the exact terminal named-export footer and replaces that marker line with the declaration text, preserving original runtime declaration order and bytes. There are no runtime imports, CDN requests, dependencies, installations or bundler.

## Two different checks

The assembler reads text, validates structural/footer/raw-text syntax, and compiles the assembled classic script without evaluating it. It never imports or runs the art module. A deliberately throwing module body can therefore assemble successfully; this is expected, demonstrated, and is not semantic approval.

Direct data tests import the trusted developer-authored module. They execute its JavaScript and are not a sandbox for untrusted contributions. These tests check deep immutability, valid shapes/references/hex colors and each recipe's axis-aligned static-body footprint against its canonical radius. Canonical radii are compatibility metadata checked against actual game definitions, not an artist control for collision sizes. Dynamic flagpoles, barrel rotations, construction layers, caches and gameplay stay in their existing runtime code.

Keep the current art budget: at most20 cached paths,128 polygon vertices,12 circles/arcs. Baseline is19/81/9. Ordinary geometry/color edits inside these limits are supported; baseline exact byte identity is a migration proof, not a permanent artist-edit hash pin. Colors use portable CSS hex forms (#RGB/#RGBA/#RRGGBB/#RRGGBBAA). Larger footprint/budget changes require an explicit later design/test change.

The public `node verify-development.cjs --check-only` command runs sealed integrity, text-only source consistency, builder guards, then direct-data validation. Normal invocation adds the unchanged canonical game runner afterward; the adoption gate records that unchanged aggregate separately. Receipt/manual artifact refusal, output no-overwrite, lock, symlink/path, UTF-8, raw-text and fail-closed recovery behavior is retained. The two-file crash/TOCTOU limitations in DEVELOPING still apply.

## Historical tool compatibility and active workflow

The exact prior active builder, tests, public wrapper and seven-input layout/receipt are archived in `tools/source-build-history-v297/host/`, with hashes in its sibling host-manifest.json. This is a runnable old-layout host for the original tool tests, not a second game release or full historical game-verification package. Run `node --test tools/source-build-history-v297/host/tools/source-build.test.mjs tools/source-build-history-v297/host/tools/test-development-preflight.cjs`: original44 builder+40 wrapper tests pass. The two original builder files also remain separately archived byte-for-byte.

Active non-versioned tools evolve explicitly: the public verify-development.cjs command is unchanged, while its implementation adds a separate trusted-data stage. Active wrapper tests cover all five stages, fail-fast behavior, the eighth input in fixture copies, and a real semantically invalid data module that passes syntax assembly but blocks gameplay at the data stage. No guard or stage is skipped. An initial compatibility probe demonstrated the original three fixed-input drift fixtures were incompatible with the new layout; they now run unchanged against the archived old layout. That preliminary failed probe is retained as evidence, not the final result.

All immutable versioned verification runners and old evidence files remain byte-identical. Their historical frozen-code hashes record past runs; the new supplement documents the changed developer tools. Root README, player guide, current game runner/manifest and index bytes remain unchanged. The pilot checksum ledger may be refreshed for developer check-only verification; this does not authorize publication or claim a new game release.

## Proof scope

Initial assembled index is byte-identical to v297, SHA256ad451d7dd2b7b29e7006e7a5a9747694fb09e49455b2a76054b7dc29b91a571d. Extraction/tool tests use temporary build/data fixtures. A separate unchanged game-aggregate run is recorded in the adoption evidence. No browser, real player storage or performance measurements were performed. The purpose is focused art editing and validation, not FPS improvement or full engine modularization.
