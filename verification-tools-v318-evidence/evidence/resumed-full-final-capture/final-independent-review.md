# RED v318 controlled validation: independent review

Reviewed: 2026-10-22 UTC.

## Conclusion

**Accepted for the recorded explicit DOM-transform + progress-observer + final failure-capture configuration.** The full developer run passed, preserved all frozen candidate inputs, and produced a canonical aggregate deeply equal to the archived successful baseline aggregate, with no fields excluded.

This is not a newly demonstrated unmodified default-mode pass. The reviewer inspected evidence and performed read-only hashing/parsing checks; the reviewer did not initiate another full run or modify the candidate.

## Integrity and launch

- All 5,421 candidate file hashes match `restored-inputs.json`, the pre-run snapshot, the post-run snapshot, and the live candidate after completion.
- Relative to the recovered baseline, all original files remain unchanged except the deliberately refreshed `SHA256SUMS.txt`; exactly 14 tooling files were added and no originals were removed.
- All 14 tooling files match the extracted delivery and `delivery-frozen-tools.json`. The checksum manifest covers exactly the other 5,420 regular files, with matching hashes and no candidate symlinks.
- The launcher ran the full `verify-development.cjs`, not `--check-only`, with fresh evidence directories outside the sealed package. Existing `NODE_OPTIONS` was empty. The absolute DOM preload was explicitly enabled and the observer appended its own preload without an extra Node wrapper.
- No historical verifier files, assertions, or timeouts were changed. Capture used stderr head 8,192 bytes and stdout tail 4,096 bytes.

## Completed run

Evidence: `controlled-full-final-capture/`.

- Finished at 2026-10-22 00:23:19 UTC in 733.437 seconds. Supervisor exit was 0; observer final status was 0 with no signal or error. Root stderr was empty.
- Stdout contains all eight developer stages, a complete canonical aggregate, and the final developer-pass marker. That inherited marker's wording does not override the explicit-transform qualification above.
- Bounded UI: 7 cases and 232 assertions passed; its normal negative-wrapper baseline succeeded and all 10 intended mutations were detected.
- Allocation feedback: 104 cases and 1,114 assertions passed; its normal negative-wrapper baseline succeeded and all 8 intended mutations were detected.
- The aggregate contains 109 focused entries, 25 inherited current programs, 15 checked historical identity rejections, 10 inherited source checks, and 959 inherited behavior/markup passes. These categories are not interchangeable or a single assertion total.
- Independently checked 556 terminal process streams and 552 completed child calls. No sequence gaps, dropped events, active calls, signals, spawn errors, or thrown child-call errors were found.

## Transform audit

Exactly 10 audit events correspond to 10 distinct allocation-test processes: the direct positive, the negative wrapper's passing baseline, and its eight expected failing mutants. Every event records one applied transform and successful exact reverse-restoration checking.

- Original/input SHA-256: `7d02d8719470791dc2e9a9eba193ba338f9f729304bfeb4a903e842d52f69ac4`
- Transformed SHA-256: `1018a5e4fefb3744ba353bb66b45004ad60e12dd22f883c45bda39cbe9134dad`

Audit events establish compilation. The corresponding child outcomes and successful aggregate establish the reported test results.

## Captured negative outcomes

All 345 capture artifacts exactly correspond to the 345 observed nonzero child calls. Each capturing parent ultimately exited 0: 342 status-1 negative controls or expected rejections, and three status-2 documentation-checker CLI-usage controls. These are not 345 unexpected gate failures.

Every artifact's recorded fragment hash, byte count, limit, position, truncation flag, and mode 0600 validates. There are 48 truncated stderr samples and 132 truncated stdout samples. All 10 bounded-UI assertion headers survived, including the eight truncated stderr samples; all eight allocation mutation headers also survived. Captures remain bounded fragments, not full child transcripts.

## Independent baseline output comparison

The reviewer independently parsed the canonical aggregate directly from both raw logs, rather than relying on the supplied comparison result:

1. `../v318-recovered/RED/verification/mission-guidance-v318-evidence/full-gate.stdout`
2. `controlled-full-final-capture/stdout.log`

Each contains exactly one canonical aggregate. The parsed objects are deeply equal across every field, and both separately saved aggregate JSON files match those independently parsed objects. No fields were omitted, normalized away, or ignored. Sorting JSON object keys for deterministic serialization produces the same SHA-256:

`afb23fc15b731b3eee59ced492b261eefcddabba7acaad9a1b918edf4d0f56b8`

For provenance, the raw baseline stdout SHA-256 is `95c728f09a5eeba77c12c21ca558a3d71768c245b9c895b7e203e7177ff1b7e6`; the new raw stdout SHA-256 is `f4ed83816b1cea27c29fdd501dced4d2aea3767bba18ed81e6e14d14150031b2`. The whole logs are not byte-identical; the complete canonical result objects are equal.

## Acceptance limits

- Acceptance applies to this one completed run with the exact recorded tooling and preload combination. Arbitrary other loaders and repeatability were not established.
- The comparison establishes reported-output equivalence to an archived successful baseline, not a fresh default-mode run or proof of every possible runtime behavior.
- The earlier failure did not recur here. Its root cause remains unresolved; this successful run does not retroactively invalidate it or establish that a product bug was fixed.
- Runtime is descriptive only, not a controlled speedup or FPS claim.
- Coverage is VM/mock-DOM. Native-browser rendering, touch/layout, real storage, save/load/import/export, and FPS acceptance are outside scope. Optional legacy-full and long-game modes were not executed.
- No GitHub publication, release deployment, or default-command change is established by this review.
