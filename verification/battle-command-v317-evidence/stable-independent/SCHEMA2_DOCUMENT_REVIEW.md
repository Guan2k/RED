# Schema-2 document-contract compatibility review

Independent PASS for `red-development/v317-integration/RED/tools/document-contract/check.cjs` and `test.cjs`, compared with original v316 integration. No required fixes found in this bounded implementation review.

Independently ran the complete fixture test source plus ten extra probes injected in memory; package files were never modified. 113 passed, 0 failed: original 66, author-added 37 and independent 10. Evidence: `schema2-probes.json`; reproducible external harness: `schema2-probes.cjs`.

Verified exact schema-2 stable runner path, exact ordered six-entry positive/negative dispatch inventory, version-matching historical runner, required dependency inventory and digest checks. Schema-1 acceptance remains versioned-only. Wrong schema, quick runner, traversal, omitted/duplicated dispatch, omitted negative identity and malformed paths are rejected.

Independently demonstrated retained source bytes, source display version, manifest runner hash, stable runner bytes, README exact command/link, mixed old/stable links and shell-suffix validation. This is not an early-return schema workaround. Existing current document title/guide/entry checks remain active.

The original blocker in REVIEW.md is resolved by these two implementation files. This conclusion is not a pass for the currently in-progress v317 root documents or release package, and no full gate was executed. Final integrated documents, dependency identities and package metadata still require normal final verification.
