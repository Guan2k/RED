# v305 acceptance evidence

One complete isolated developer gate ran against the 2823 inputs recorded in full-gate-inputs.json. Exit was 0, stderr empty, and original/isolated input sets remained byte-identical. game-aggregate.json is extracted from that run, not another invocation. baseline-factory-space-results.json deliberately records the six original failures, with 56 passing compatibility cases. Current 62-case and four-mutant reports are separate.

After the complete gate, only current QA/entry completion wording and this evidence directory changed before root checksums were refreshed. No product source, test assertions, runner, or player inputs changed. Final check-only output is outside the sealed tree to avoid self-reference.

Independent review scripts retain their original workspace paths; they are archival evidence, not standalone portable release tools. The portable current entry is verify-development.cjs. No native-browser default activation, keyboard timing, screen-reader, storage lifecycle or FPS validation is claimed. Escape/visibility behavior and tokenless synthetic/direct-click baseline compatibility remain outside the narrow fix.
