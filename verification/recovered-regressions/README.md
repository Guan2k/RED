# Recovered non-import regressions adapted for v258/v259/v260/v261/v262/v263

Install this directory under the matching v258/v259/v260/v261/v262/v263 `verification/` directory. Run from any working directory:

    node /path/to/RED/verification/recovered-regressions/run.cjs

Requires Node and the matching exact index.html and verification/restore-v249.cjs through restore-v257.cjs with their existing fixtures, plus restore-v258.cjs and its fixture for v259, restore-v259.cjs and its fixture for v260, restore-v260.cjs and its fixture for v261, restore-v261.cjs and its fixture for v262, and restore-v262.cjs and its fixture for v263. No Library, downloaded archive, absolute workspace path, additional package or network is needed. Scripts write isolated timestamped command-comparison evidence outside RED, by default in verification-runs/recovered-regressions/ beside RED. RED_VERIFICATION_OUTPUT_DIR may choose another evidence directory; temporary S reference files are removed by its original test cleanup.

## Separately reported groups

- Repeated S: 47 total, comprising 5 current-host behavior tests, 38 current-host/exact-v246 paired behavior tests, 2 old-v246 defect reproductions, 1 mutated-current-host negative control, and 1 historical restoration boundary. The current side is the actual exact v258, v259, v260, v261, v262 or v263 source being tested.
- NEW current-host command equivalence: 74 two-sided function-pairing checks plus 1 current-host-only read-only helper check (75 total). The 74 paired checks use two complete identical-version current hosts; only the reference host's issueMapCommand is replaced with the exact v242 function. All original state, trace and DOM assertions remain.
- Separately, seven intentional mutations must first pass unmutated pairing, pass their initial setup comparison, then fail after-command world/trace comparison. Entry rejects early/setup failures as valid controls. These seven are additional negative controls, not part of the 75 checks.

All are synthetic VM tests; some fixtures create units or assign money/HP. No native browser or natural-match claim. No import tests or mixed save/load groups are included or invoked. The harness adaptation itself does not change product HTML or bump its version.

## Origins and limitations

Original v249 ZIP and exact source hashes are recorded in PROVENANCE.json. Its original safe baseline groups were separately replayed: double-click20, S47, command75. These historical counts are not current coverage. The original v250 full-suite runner remains missing; this is not a recreation of its claimed1078 tests.

A first attempt directly compared v258 against v242 using the unmodified behavioral assertions:74 before-command DOM failures plus1 readonly pass. Its seven apparent mutation detections were invalid because they hit the same initial DOM differences. That attempt remains in research evidence, not this runnable passing tool package. The replacement reference strategy is explicitly a new current-host test.

The only legacy executable logic carried as a fixture is the historical command function. Its hash and full current/reference-source hashes are pinned in load-command-reference.cjs. Minimal old-version difference fixtures allow S's original historical boundaries and negative controls; no whole historical HTML or player archive is included. Only the six pinned exact v258, v259, v260, v261, v262 and v263 source hashes are accepted; other versions fail closed. The v259 chain first restores byte-exact v258; the current-host command reference pins its own full v259 reference-source hash.

The v259 adaptation preserves all 16 recovered files and every existing behavior assertion and mutation. Product source is unchanged by this harness adaptation.

The v260 adaptation first restores exact v259 before following the reviewed v259 chain. Its current-host reference retains the full v260 UI and replaces only the historical command function; its resulting whole-source hash is separately pinned. All behavior assertions and seven after-command controls remain unchanged.

The v261 adaptation first restores exact v260 before following the reviewed chain. Its current-host reference keeps the complete v261 UI and replaces only the same pinned historical command function. The exact v261 host and resulting whole-reference source hashes are separately pinned. Every existing behavior assertion and all seven after-command mutations are retained. The original 16 recovered files remain present; generated run evidence is kept outside RED.

The v262 adaptation first restores exact v261 before following the reviewed chain. Its current-host command reference keeps the complete v262 source and replaces only the same pinned historical command function. The exact v262 host and whole-reference source hashes are separately pinned. All behavior assertions, all seven after-command mutations, and all 16 recovered files are retained. Evidence remains outside RED.

The v263 adaptation first restores exact v262 before following the reviewed chain. Its current-host command reference keeps the complete v263 source and replaces only the same pinned historical command function. The exact v263 host and whole-reference source hashes are separately pinned. All behavior assertions, all seven after-command mutations, and all 16 recovered files are retained. Evidence remains outside RED.
