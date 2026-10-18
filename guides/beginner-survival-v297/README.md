# 休闲守卫入门参考 · v0.297 文档补充

Read GUIDE-zh.md or guide-zh.html. This supplement does not change game code, version, the canonical player guide, root README or the existing player ZIP.

## Evidence and limitations
The initial arrival-hold policy lost all three fixed-seed runs at295.25 game seconds. Omitting only the two arrival-hold clicks yielded three wins at360 seconds. Delaying each maintenance action15 seconds yielded three further wins at360 seconds. All recorded HQ checkpoints in both successful policies have1800/1800HP. These are limited examples, not a guarantee or statistical win rate: within each policy the three different seed runs have identical recorded actions/checkpoints; baseline and delayed policies differ from each other. The delayed variant demonstrates tolerance to this maintenance delay only. Exact map placement and native-browser beginner usability remain unverified.

Provenance clarification: 固定种子的测试随机源；各策略间不改随机源或AI规则，未注入战局状态。The VM explicitly supplies a seeded test RNG. Some original predeclared policies/reports say “no RNG replacement”; that wording was too broad and is retained only as historical evidence, clarified here. Normal game simulation/AI, paid production, legal construction and ordinary UI pauses are exercised. The no-persistence harness removes persistence initialization and rejects persistence calls. No real browser storage or save/load/import/export actions are used.

## Portable reproduction
Requires Node.js and this complete repository package. From the repository root:

    node guides/beginner-survival-v297/verify-v2.cjs
    node guides/beginner-survival-v297/verify-v2-delayed.cjs

Each defaults to this repository root and all three fixed seeds. Optional positional arguments are an alternate repository root and one fixed seed, for example:

    node guides/beginner-survival-v297/verify-v2.cjs /absolute/path/to/RED 29801

The entrypoints pin index.html SHA256 ad451d7dd2b7b29e7006e7a5a9747694fb09e49455b2a76054b7dc29b91a571d. They compare the entire recorded actions, checkpoints, terminal outcome/text and timing against archived JSON, fail on any difference, and write no artifacts. They are minimally adapted copies of the historical scripts: path resolution, fixed-seed CLI selection, source pin and read-only evidence comparison replace original artifact writes; gameplay policy/event sequence remains unchanged.

`archived-original/` preserves original scripts, policies, logs and traces including all three losses and preliminary stale-UI harness failures. Those original scripts contain workspace-relative paths and are not standalone reproduction entrypoints. Preliminary stale-UI attempts stopped at time zero and are harness issues, not gameplay losses. Original files are not silently corrected. `independent-review/` contains separate reviewed evidence; its original scripts are also archived provenance, not portable entrypoints.

The source and all existing package files are preserved except the root checksum manifest updated for additions. This docs-only supplement uses the existing check-only gate; it does not claim a new full gameplay aggregate run. Parent publication approval is separate.

Portable reproduction was rerun for seed29801 under both policies and compares every recorded field exactly to the archived JSON; both pass with empty stderr. The initial comparator rejected VM array prototypes despite matching serialized data; those failed diagnostic outputs are retained separately. The final comparator normalizes the complete record through JSON, without dropping fields or relaxing numerical/time comparisons.

The reviewed HTML is byte-identical to the worker artifact and renamed guide-zh.html solely to satisfy the canonical package ASCII-path gate; HTML_CHECKS.json retains its original artifact filename. The initial check-only refusal for a noncanonical Unicode filename is retained in integration evidence, not a game regression.
