# Independent stable-suite review

Result: PASS for migrated behavior and fixed schema-2 release contract. Integration has one known must-fix compatibility item before development/release acceptance. This review did not run or claim the full release gate.

## Independently verified

- `probes.json`: 9/9. Refused runner traversal, wrong declared candidate version, missing family, duplicated family replacement, negative replaced with positive, omitted negative identity, incorrect dependency digest and identical-byte external symlink. Existing schema 1 accepted and explicitly labeled integrity-only.
- `behavior-probes.json`: 3/3 groups. Provenance loader rejects another same-byte source path and changed bytes after bootstrap. A changed-byte valid source runs all 47 Escape cases, proving behavioral execution is not a fixed package-hash veto. Four Escape mutants fail designated behavioral assertions (14, 24, 5, 2 failures), not identity/syntax errors.
- Independently reproduced all six `migration-contract.json` transformations and historical hashes: stable modules equal historical bodies after only the declared bootstrap/path changes. No assertion, mutation or test-name deletion.
- Independently executed `release-runner.cjs --dispatch-check`: 6/6. Source lines 9-16 require one old literal, no preexisting new literal, one resulting literal and inverse replacement equal to the historical runner. This neither double counts migrated families nor removes other gates.
- Examined author's `migration-results.json`: six complete old/new JSON reports equal, with 332 positive cases and 13 mutation controls. This author-run evidence was reviewed, not redundantly rerun here.
- Compared candidate to integration: only existing `verify-current.cjs`, `current-verification.json`, `SHA256SUMS.txt` changed, plus new stable-suites directory. Product source and historical verification files unchanged.

## Must fix in integration

`RED/tools/document-contract/check.cjs:31` only accepts schema 1 and versioned runner paths; line 35 requires a versioned manifest runner. Running it against the schema-2 candidate yields 41 passed, 1 failed (`manifest-schema`), saved in `document-contract.json`. Its current README command/link logic also assumes versioned paths. Integrator has acknowledged and owns tested exact schema-2 compatibility, preserving schema-1 restrictions and retaining all checks. Candidate integrity success is not development-precheck success.

## Contract and limits

`verify-current.cjs:44-62` keeps a fixed schema-2 runner, exact ordered six-dispatch inventory and required hashed dependencies. The ordinary entry uses the existing isolated verified-byte copy, canonical path and symlink checks. `release-runner.cjs` itself is a lower-level helper, not an alternate identity-authorizing public entry; its `--dispatch-check` is explicitly structure/integrity only.

Stable behavior modules are unversioned and need no per-release copies. Future version metadata and the remaining version-coupled historical aggregator still need maintenance, as the README discloses. This is real reduction for three families, not elimination of all release maintenance or a runtime speed claim.

`purchase-funding-negative.cjs:3` intentionally preserves the historical package-local source interface, unlike other negative scripts accepting argv. The migration README limits its proof to the packaged current source; do not advertise `verify-migration.cjs [candidate]` as arbitrary-candidate negative-control equivalence. No interface expansion is needed for this bounded migration.

No native browser fidelity, complete release pass, authenticity/signature or remote-latest claim was established.
