# Read-only current documentation contract

See ../../DOCUMENT_CONTRACT_DEVELOPMENT.md for the adopted release workflow, bounded syntax and historical evidence. Run `node tools/document-contract/check.cjs /absolute/path/to/RED` from any working directory. The checker emits JSON and returns 0 for success, 1 for failed checks and 2 for invalid invocation. Run test.cjs for the 66 temporary-fixture tests. No automatic repair or game execution occurs.
