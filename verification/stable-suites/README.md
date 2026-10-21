# Stable production/input verification

This is a maintenance-only migration on the v316 source. Product code, gameplay and all historical verification files remain unchanged.

## Entrypoints and coverage accounting

- `node verification/stable-suites/run-quick.cjs [candidate.html]`: the three positive behavior suites. No package identity, mutation checks, historical replay, or release-pass claim.
- `node verify-current.cjs --check-only`: package checksums, candidate identity, fixed runner contract and required tool identities. No behavior execution.
- `node verify-current.cjs`: complete existing release gate, with exactly six focused dispatches replaced by stable positive/negative modules. Other existing gates remain. Each migrated behavior family and negative-control family is counted once, not both under old and stable names.
- `node verification/stable-suites/verify-migration.cjs`: one-time migration proof against packaged current source. Executes both old/new versions for equivalence. This is not called by the normal quick or release entry.
- `node verification/stable-suites/release-runner.cjs --dispatch-check`: verify dependency hashes and the exact six dispatch replacements without executing the release gate.

## Stable behavior, separate identity, historical evidence

The stable modules retain every historical test body, assertion, fixture, scenario name, seed and negative mutation. `migration-contract.json` permits only explicit module/default-source path changes. Positive modules reuse the existing `parameterized-pilot/vm-environment-provenance.cjs` instead of maintaining a new mock DOM. The loader authorizes only the requested candidate bytes and records compiled VM loads when `RED_STABLE_RECEIPT` is set. Behavior has no version string or candidate checksum and needs no reverse reconstruction when a version changes.

Package identity remains in `SHA256SUMS.txt` and `current-verification.json`. Schema 2 allows only the exact stable release runner path, a fixed six-entry dispatch inventory and required dependency hashes. It does not allow arbitrary executable paths. `release-contract.json` identifies the unchanged historical gate and stable tools. Future product releases update package/release metadata, not behavior modules. The historical gate still has other version-coupled machinery; this migration does not claim to remove that unrelated maintenance burden.

The release runner replaces exactly one quoted dispatch for each of the six entries and proves inverse replacement reproduces the original runner byte-for-byte before executing it with its original directory resolution. This is dispatch adaptation, not product source reversal. No assertion is deleted and no inherited gate is skipped. Historical scripts and evidence remain available but their migrated focused runs are not duplicated in the release list.

## Evidence and limits

The migration proof compares complete JSON reports, including all positive scenario names/outcomes and the original negative-control counts and designated detections. A deterministic bootstrap-only byte comparison proves assertion and mutation text preservation. Negative-control code keeps its original checks for behavioral failures, not syntax/identity errors. Results and wall times are stored outside the package during review. Report observed timings as measurements only; replacing duplicated maintenance scripts does not inherently reduce test runtime. Synthetic VM dispatch is not native keyboard timing, browser layout or accessibility validation.

A full release gate is still required after independent review. Focused checks, equivalence and package integrity alone are not a full release pass.
