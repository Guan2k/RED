Current workflow note: the following records the earlier documentation-contract adoption. The current wrapper adds trusted vehicle-data validation and uses the vehicle-aware builder tests; see [VEHICLE_ART_DATA_DEVELOPMENT.md](VEHICLE_ART_DATA_DEVELOPMENT.md). Its current total is eight stages, seven with --check-only. Historical run counts and commands below describe the retained prior host.

# v301 documentation-contract tools: retained adoption record

Game version remains v0.301. index.html, README.md, CURRENT_PLAYER_GUIDE.md, current-verification.json, all versioned game runners and player-package inputs are preserved byte-for-byte from the final v301 base.

## Current commands

From the package root, run `node tools/document-contract/check.cjs .` and `node tools/document-contract/test.cjs`. The checker also accepts one explicit package directory from any working directory. It never repairs documents, executes the game or writes package files. The test suite uses temporary fixtures and cleans them up.

Run `node --test tools/test-development-preflight-doc-contract-v301.cjs` for the new wrapper's order, fail-fast, read-only and arbitrary-working-directory checks. The current developer wrapper runs integrity first, then the checker, 66 checker tests, source consistency, source-builder tests and trusted-building-data tests. Without --check-only it then invokes the unchanged canonical game verifier. A failed stage prevents later execution.

The sealed gate is not the edit loop: intentional edits require review and deliberate root-checksum refresh before verify-development can pass. Direct checker/source checks are available during editing. Never repin historical test identities to make an edit pass.

## Bounded contract

The checker compares current source/manifest identities, current document headings, the README current-test paragraph and its command/link, the guide's current version declaration, explicit current-entry node commands and local inline Markdown link targets/real heading anchors. Historical sections inherit their heading scope; fenced pseudo-headings and HTML comments cannot satisfy current prose or anchors. Ordinary command code fences remain supported. Simple quoted arguments are tokenized and unknown/unconsumed parameters fail closed.

This is a deliberately limited RED Markdown/command grammar, not a complete Markdown or shell parser. It does not check raw-HTML/reference-style links, remote URLs, factual claims, actual ZIP contents, test totals, native browser layout, accessibility or FPS. It does not authenticate a maliciously repinned manifest. Recognized current sections must remain explicit; changing their grammar requires reviewed tests.

## Retained history and evidence

The final checker hash is facc2f413a4c20e75c1c8eb4c79b2b3b68a661b569bfe8d161eb802cb4c2b456. The prototype's original v300 stale command/link/guide failures and later parser counterexamples remain under tools/document-contract/prototype-evidence and independent-review. The independent final review covers 17 scenarios; current wrapper tests cover 150 cases.

Old tools/test-development-preflight.cjs remains unchanged. Its original runnable wrapper environment is preserved at tools/document-contract/pre-adoption-host. Run `node --test tools/test-development-preflight.cjs` from that host directory: 48 tests pass. The host is a bounded historical test fixture, not a standalone game release. Its copied historical wrapper must not be used as the current release gate.

## Integration verification

The single full isolated developer gate passed on 2026-10-18, 10:34:03–10:41:13 UTC: 57 document checks, 66 checker tests, 67 builder tests, 56 building-data tests and the unchanged 959/10/15/73 game results. All 2022 input files stayed byte-identical in both the original package and the temporary copy; stderr was empty and no new tracked temporary directories remained. Execution results and complete input hashes are archived under tools/document-contract/evidence/adoption. The separately run 150 wrapper cases and independent 20 cases/48 historical-host tests also passed. Final additions after the gate contain evidence and this completion statement only; final sealing is rechecked without another game aggregate. No native browser verification is claimed.
