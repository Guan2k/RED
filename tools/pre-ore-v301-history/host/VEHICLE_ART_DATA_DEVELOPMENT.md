# v301 vehicle static-data developer adoption

This maintenance update extracts exactly 674 original renderer bytes: five canonical vehicle radii and ten frozen polygon paths. The output index.html, game version, README, CURRENT_PLAYER_GUIDE, current game verification manifest, player-package inputs and runtime behavior remain byte-identical to the preceding v301 documentation-tools release. Color choices and dynamic drawing functions are not extracted.

## Source and validation

Edit src/art/vehicles.mjs. The fixed source builder input list includes that exact path and binds its bytes and name into the input digest. The renderer has exactly one correctly placed @@RED_UNIT_ART@@ marker immediately before unitArtTrace. The assembler strips only the exact terminal export footer, rejects misplaced/unknown markers and import/export syntax in the body, checks UTF-8 and script syntax, and never imports or evaluates the art module. This is text assembly of trusted developer inputs, not a sandbox for hostile JavaScript.

The separate vehicle validator imports trusted module data during tests. It requires exactly the two named exports, five exact radius keys matching gameplay definitions, plain recursively frozen records/dense arrays without accessor/symbol/cyclic numeric data, ten fixed path slots, finite coordinate pairs with nonzero polygon area, canonical body-square bounds and at most 63 total polygon vertices. The 63-vertex ceiling is this adoption's conservative complexity budget, not a Canvas API/platform limit. Path ownership is scout 0/1, tank 2/3/4, artillery 5/6, repair 7/8/9. Harvester retains radius 16 but has no cached polygon; its rectangles and dynamic cargo remain runtime drawing. The validator checks slot bounds, not arbitrary semantic shape identity or future art quality. Existing render trace tests remain necessary for any real art edits.

## Commands and gates

Use `node --test tools/source-build-vehicle-art.test.mjs`, `node --test tools/vehicle-art-data.test.mjs` and `node --test tools/test-development-preflight-vehicle-art-v301.cjs` for the new source/data/orchestration tests. Existing building-data checks remain unchanged.

The current `node verify-development.cjs` stages are: sealed integrity, documentation contract, contract tests, source assembly consistency, vehicle-aware builder tests, building-data tests, vehicle-data tests, unchanged canonical game verification. `--check-only` runs the first seven and never the game. Every failed stage stops later stages. The canonical player verifier still does not independently check editable source/data/documents.

During editing run direct source and data checks. Review source/generated/receipt changes together, then deliberately refresh the current package checksum before the sealed developer gate. Preserve all historical identities. Builder receipt recovery, cooperative-lock/TOCTOU limits and nontransactional two-file write recovery remain as documented in DEVELOPING.md.

## Exact-output migration and history

The old receipt was rejected because the fixed input list and digest changed. Only after complete assembled HTML equality was asserted was the existing explicit --recover-receipt used. Generated HTML was not rewritten. New inputs digest: 52d3a6eb83961fc74c06a09892f6fae710c95ec3c9459173232d5e593c9697e8; output SHA256 remains 75c75c7a25af246d366770809853f2fab440cd734c11d9fbe6acfe840a0efd39.

Previous builder/wrapper/source files are preserved byte-for-byte under tools/vehicle-art-history-v301/host. From that directory run `node --test tools/source-build.test.mjs tools/test-development-preflight-doc-contract-v301.cjs`. Old active test files remain unchanged in the current package too; use the historical host when they assume the previous input layout or stage sequence. The host is not a standalone game package. Pre-adoption maintenance docs are preserved alongside it.

## Evidence and limits

The original 21-case extraction assessment is archived as historical evidence with its original workspace-relative paths. Current integration evidence will be retained under tools/vehicle-art-history-v301/evidence. The single full isolated developer gate passed on 2026-10-18, 11:46:48–11:53:55 UTC: 63 document checks, 66 contract tests, 101 builder tests, 56 building-data tests, 180 vehicle-data tests and unchanged 959/10/15/73 game results. All 2103 frozen input files remained byte-identical in both original and isolated copy; stderr was empty, with no new tracked temporary directories left behind. Separate wrapper tests passed 171 cases; independent checks passed 85 and the runnable historical host passed 217. Final post-gate additions contain evidence and this completion statement; final sealing is rechecked without another game aggregate. No new rendering paths, browser/native visual, accessibility, collision-circle, allocation or FPS improvement is claimed. The benefit is independently checked editable geometry and fixed-input source-digest binding, with unchanged runtime output.
