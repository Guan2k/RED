# Editable sources, unchanged offline artifact

## Source of truth

Edit `src/`, not `index.html`. The HTML is generated and remains the single-file offline player artifact. The v0.294 adoption initially reconstructed its published artifact exactly. The current game is v0.301; this additive vehicle-data adoption retains its exact generated artifact. Future approved source changes use the same guarded workflow.

`src/index.template.html` owns markup; `src/styles.css` owns CSS. Four ordered `.jsfrag` files retain the existing single script's order and shared globals. They are **not ES modules**. The renderer fragment includes inspection/presentation helpers and art initialization, not a newly isolated renderer API. `src/geometry.mjs` alone is a real ES module with named exports, imported by its unit tests. The narrow assembler removes exactly its terminal export footer for the classic inline player script. It is not a general-purpose JavaScript bundler.

The fixed input list is in `tools/source-build.mjs`. No directory glob determines order. Adding a new source fragment is an explicit builder/test change. There is no automatic extraction command that can overwrite sources from an edited generated index. There is no runtime CDN, import, server or new player dependency.

## Normal workflow

1. Edit the relevant source file(s).
2. Run `node --test tools/source-build-vehicle-art.test.mjs`.
3. Run `node tools/source-build.mjs --out /an/existing/directory/new-index.html` to inspect a fresh output. The output parent must exist; existing targets, symlinks and traversal paths are refused.
4. Run `node tools/source-build.mjs --write-generated` explicitly to replace this project's index and build receipt. Review source and generated diff together.
5. Run `node tools/source-build.mjs --check` to prove exact artifact/source consistency, then, after reviewed identity/checksum refresh, the current developer verifier before release integration.
6. Commit source, generated index and generated receipt together. Never refresh historical test hashes to conceal a failure.

The tools use existing Node standard libraries and execute no game code. Script syntax is checked without running it. Ordinary valid source edits compile without changing frozen input/output acceptance hashes. The receipt records input and output hashes for the last successful generation, not a builder hash; release package checksums must bind the builder separately. It is generated metadata, not an alternate source of truth.

The one-time migration proof is recorded separately in the parent candidate's evidence/original-preservation.json and build-check.json: all 897 original files remained byte-identical, including the pinned v0.294 index. The current source tests compare against the current generated artifact, not an immutable v0.294 acceptance hash. Intentional source changes therefore do not require repinning the development tests.

## Receipt guard, atomic writes and recovery

`--check` is read-only and fails on generated drift or an inconsistent receipt. `--write-generated` replaces only the designated root index.html, and only when its current bytes still match the previous receipt's output hash. It refuses unknown/manual artifact edits. A single-writer lock prevents overlapping cooperating writers; concurrent source editing is unsupported. Keep editing stopped during a build/check.

Path checks and the cooperative lock are not a security boundary against a hostile or uncooperative process changing directory entries concurrently: lstat/open/rename checks have time-of-check/time-of-use races. Use a trusted, exclusively controlled working directory.

Each destination is replaced via a temporary sibling and rename. Updating index.html and source-build-receipt.json is **not a two-file transaction**, and the tool does not provide a filesystem durability/fsync guarantee. A process/OS failure after the index rename but before receipt rename leaves a mismatch. Normal checks and writes then fail closed. A crash can also leave a lock or temporary file; the builder never guesses whether another process is alive and never removes an existing lock automatically.

Recovery:

- First establish no build process is running. Preserve/review the inconsistent files and any manual changes.
- If a stale `.source-build.lock` remains, remove that specific lock only after confirming it is stale. Temporary siblings may be inspected and removed; they are not authoritative inputs.
- Run `node tools/source-build.mjs --recover-receipt`. This can recreate metadata **only if a fresh assembly already equals current index.html byte-for-byte**. It refuses to bless an arbitrary edited artifact, and never writes index.html.
- If they differ, move legitimate manual changes into src deliberately, or restore the known generated index/receipt pair from version control. Do not edit receipt hashes by hand to bypass the guard.
- Rerun `--check` and tests.

Initial bootstrap uses the same restricted recovery command because the existing v0.294 artifact exactly matches assembled sources. Hash receipts are local consistency evidence, not tamper-resistant provenance or publisher authentication.

## Adopted developer release workflow

The original additive source-tools adoption retained the exact v0.294 player artifact. This additive v0.301 vehicle-data update retains the current game and player-package inputs byte-for-byte. Source-build checks and tool tests are separate from game coverage.

Run `node verify-development.cjs` before release. Its eight ordered stages are sealed package integrity through `verify-current.cjs --check-only`, current documentation contract, 66 documentation-contract tests, `node tools/source-build.mjs --check`, current vehicle-aware builder tests, trusted building-data tests, trusted vehicle-data tests, then unchanged `node verify-current.cjs`. Any failure stops later stages. `node verify-development.cjs --check-only` runs the first seven stages without gameplay. `node --test tools/test-development-preflight-vehicle-art-v301.cjs` tests current orchestration in disposable fixtures. The unchanged old tools/test-development-preflight.cjs runs from tools/document-contract/pre-adoption-host. Synthetic child scripts are not game coverage. See [documentation contract development](DOCUMENT_CONTRACT_DEVELOPMENT.md) for syntax limits and evidence.

The old `node verify-current.cjs` remains the canonical game verifier and does not inherently check editable sources or current documentation. Do not substitute it alone for the new developer release workflow. The unchanged README block describes that existing game entry. Discovery of the developer entry is here and in CURRENT_VERIFICATION_ENTRY.md; The v0.294 adoption preserved README/player-guide bytes; current-version documentation and packaging pins must deliberately track approved current-version changes.

After an intentional source edit/build, the sealed release checksums and current manifest no longer match. Prepare the next release's reviewed versioned verification/identity entries and refresh the current release manifest/checksums deliberately; never rewrite historical gates to conceal a failure. During development use the direct source-build checks above and `node tools/document-contract/check.cjs .`. For a documentation-only update the unchanged game manifest need not change. The root SHA256SUMS.txt must cover every regular package file except itself, including nested SHA256SUMS.txt files; assert the exact path set. The developer preflight is a sealed-package release gate, not an automatic resealer or builder.

Run from a trusted single-writer workspace with editing stopped. The preflight does not provide a transaction against concurrent mutations. The canonical game verifier snapshots its own sealed whitelist before running; adoption evidence additionally records a frozen full-package snapshot and before/after hashes.

## Evidence boundaries

verification/source-tools-v294 preserves original architect and independent review evidence. Their original report paths and scripts retain historical workspace assumptions; they are archival evidence, not promises of standalone replay. Current runnable builder and orchestration tests are the tools listed above. The original 897-file preservation proof describes the pilot before adoption documentation/checksum updates.

No browser/FPS, new gameplay coverage or full modular engine claim follows from this source-layout work. No actual save/load/import/export or real browser-storage operations are performed. Existing VM gameplay verification can read empty simulated storage at initialization.


## Building art source data supplement

Static building data now lives in `src/art/buildings.mjs`; the module has three named exports and no runtime imports. Edit data there, run `node tools/source-build.mjs --write-generated`, then review and deliberately refresh the sealing checksum before running the existing developer preflight. The assembler never executes the module; a distinct trusted-module data-test stage enforces immutable shapes, canonical square bounds, hex colors and20/128/12 budgets. See [BUILDING_DATA_DEVELOPMENT.md](BUILDING_DATA_DEVELOPMENT.md) for limits, tests and the runnable exact old-layout tool host. Do not edit generated index.html or its receipt by hand.


## Vehicle art source data supplement

The five canonical radii and ten fixed polygon slots now live in src/art/vehicles.mjs. All dynamic drawing, color choices and functions remain in the renderer fragment. The assembler text-splices the fixed export-free body without importing or evaluating the module. A separate trusted-data test checks recursively frozen numeric geometry, definition radii, canonical body-square bounds, fixed slots and the conservative 63-vertex adoption budget. This budget is not a Canvas platform limit. See [vehicle data workflow](VEHICLE_ART_DATA_DEVELOPMENT.md).

The previous active builder and documentation-aware wrapper tests remain unchanged. Run them from tools/vehicle-art-history-v301/host for their original source-layout assumptions. This historical fixture is not a standalone release gate.
