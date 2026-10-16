# Recovered non-import regressions adapted for v258

Install this directory under the existing released v258 `verification/` directory. Run from any working directory:

    node /path/to/RED/verification/recovered-regressions/run.cjs

Requires Node and the existing v258 index.html and verification/restore-v249.cjs through restore-v257.cjs with their existing fixtures. No Library, downloaded archive, absolute workspace path, additional package or network is needed. Scripts write isolated timestamped command-comparison evidence below this directory's runs/; temporary S reference files are removed by its original test cleanup.

## Separately reported groups

- Repeated S: 47 total, comprising 5 v258-only behavior tests, 38 v258/exact-v246 paired behavior tests, 2 old-v246 defect reproductions, 1 mutated-v258 negative control, and 1 historical restoration boundary. The current side is always v258 itself.
- NEW current-host command equivalence: 74 two-sided function-pairing checks plus 1 current-host-only read-only helper check (75 total). The 74 paired checks use two complete v258 hosts; only the reference host's issueMapCommand is replaced with the exact v242 function. All original state, trace and DOM assertions remain.
- Separately, seven intentional mutations must first pass unmutated pairing, pass their initial setup comparison, then fail after-command world/trace comparison. Entry rejects early/setup failures as valid controls. These seven are additional negative controls, not part of the 75 checks.

All are synthetic VM tests; some fixtures create units or assign money/HP. No native browser or natural-match claim. No import tests or mixed save/load groups are included or invoked. No product HTML change or version bump.

## Origins and limitations

Original v249 ZIP and exact source hashes are recorded in PROVENANCE.json. Its original safe baseline groups were separately replayed: double-click20, S47, command75. These historical counts are not current coverage. The original v250 full-suite runner remains missing; this is not a recreation of its claimed1078 tests.

A first attempt directly compared v258 against v242 using the unmodified behavioral assertions:74 before-command DOM failures plus1 readonly pass. Its seven apparent mutation detections were invalid because they hit the same initial DOM differences. That attempt remains in research evidence, not this runnable passing tool package. The replacement reference strategy is explicitly a new current-host test.

The only legacy executable logic carried as a fixture is the historical command function. Its hash and full current/reference-source hashes are pinned in load-command-reference.cjs. Minimal old-version difference fixtures allow S's original historical boundaries and negative controls; no whole historical HTML or player archive is included. Versions other than exact v258 fail closed until a separately reviewed adaptation.
