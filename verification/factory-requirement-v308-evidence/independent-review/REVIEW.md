# RED v308 independent review

Decision: product source passes; no blocking runtime finding. This is not publication approval or a claim that the final package/full release gate has passed.

Candidate source SHA256: 12948c5d80dc8fd6d3fe8b892bde912fedf0849a8d85366ee0468b6e8b199e70
Reference: immutable v307-restored/RED/index.html.

## Findings
Removing the new helper, replacing its two calls with the original fixed text, and reverting the version restores the immutable v307 source byte-for-byte. No economy, purchase predicate, queue, factory assignment, lifecycle guard, DOM structure or input-handler change exists.

The helper is called only after existing completed-factory absence checks. Its construction lookup counts living own factories; dead or enemy factories cannot produce the construction explanation. A completed own factory overrides construction wording even when unfinished factories coexist. Prestart, terminal, restart confirmation and queue-full precedence remain ahead of factory feedback; factory absence remains ahead of insufficient funds. Paused purchases remain allowed when a completed factory and funds exist. No promise of automatic ordering is added.

The existing tooltip assignment uses a title property; rejected purchases flow through tell(), which writes textContent. Added static strings do not introduce an HTML sink.

## Independent evidence
- review.cjs uses the unchanged v307 VM harness, not the candidate harness.
- 100 explicit combinations of factory state, pause, phase and cash, plus a natural registered-input lifecycle.
- 871 assertions passed; 751 paired v307/v308 state comparisons passed, excluding only human-readable logs. Comparisons include economy, queue, entities, uid, selection, groups and input modes.
- Natural lifecycle: buy an order while paused, salvage its factory, legally rebuild, reject a new purchase without economic/queue changes while paused, verify paused work remains fixed, resume, complete construction at 12 game seconds, buy another tank and produce both paid orders. No HP/cash/build-time/queue injection is used in the natural scenario.
- Independent rerun of author's factory-requirement-v308.cjs: 164 passed, 0 failed.
- Independently checked all 2,439 files pinned by v307-host-manifest.json against both their recorded hash and immutable v307 file bytes: unchanged.
- restore-v307.cjs pins exact candidate and restored baseline hashes. source-delta-v308.cjs requires each of the four inverse changes to occur once. inherit-dom-v308 reuses unchanged v307 projection. Pilot manifest pins the reviewed candidate source hash.

## Test corrections and limits
The first independent test draft used an incorrect tank price (280 rather than actual unchanged 350); the assertion was corrected. A first lifecycle test stopped after exactly 12 simulated seconds for two six-second orders, before both fixed-step completions. The paired states were equal; increasing the observation window to 15 seconds completed both. Failure output is retained in first-lifecycle-failure.log. Neither required product changes.

Only source review and Node full-source VM/mock DOM are covered. Native browser rendering, hover discoverability and accessibility are not validated. Final package freeze, manifest/checksums, current 85-suite full gate and publication checks remain with release coordination.
