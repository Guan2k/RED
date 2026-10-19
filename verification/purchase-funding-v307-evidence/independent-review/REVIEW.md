# v307 failed production purchase receipt review

Verdict: approve the narrow receipt improvement and reviewed verification integration. Complete release gate/archive verification remains separate.

Source SHA256: 6a7b87b2f75ff3af7ee57a74a4caeb5c029e2587a90ce0c3910067efaef3e183.

Independent review.cjs: 188/188 pass.

Four natural registered-control scenarios buy four tanks from initial cash1700, leaving300 and four paid orders, then press4. Frozen v306 produces only “资金不足”; v307 correctly produces “主战坦克新订单资金不足，还差 50资金；已付订单保留”. Covers paused/running and single/parallel global modes. Exact paid order object identities, values, cash, spending, full non-log world/input state and subsequent0.25-second processing match the baseline.

160 matrix cases cover all five purchasable unit types, four fractional/integer shortages, empty/nonempty queues, paused/running and single/parallel. Receipts name the requested type, round shortage upward, and mention paid-order retention only for a nonempty queue. Failure leaves every non-log world/input field and queued object identity unchanged.

Other cases verify exact-cost and above-cost purchase parity, full-queue/missing-factory/unfinished-factory/lifecycle precedence, repeat/modifier/composition guard parity, and markup-like unit names remaining literal log text. Name fixture is test-only. No new markup nodes or executable content are introduced through tell/textContent.

Exact source proof in diff.json: only display version and buy() insufficient-cash message expression change. All guards, guard ordering, economy, queue assignment/progression, costs, controls, available-purchase behavior, and DOM layout remain unchanged.

Initial test attempt used strict equality of arrays from distinct VM realms for some log comparisons, causing prototype-identity failures despite equal contents. The review harness now compares serialized log contents across realms; no product or assertion meaning changed. Final188/188 is the corrected complete run.

Limits: deterministic VM registered events/callbacks plus explicit cash/lifecycle/factory/name fixtures. No native keyboard, browser, screen-reader, real persistence or broad automatic-repeat policy claim. Failed attempts add only intended receipt logs; the tests exclude logs from no-mutation snapshots and verify those logs separately. Frozen baseline and candidate read-only. Complete release gate/archive verification is separately owned.

## Verification integration

Approved integration. Independent integration-review.cjs verifies2,329 historical verification files byte-for-byte against frozen v306 and its complete preservation manifest. All35 strict restoration steps through v272 execute successfully, and the two exact source substitutions reconstruct the current candidate. Existing source identity locks remain strict; unrelated mutations survive inverse normalization and are rejected by the strict restore.

No DOM projection changes: inherit-dom-v307 directly exports the identical v306 adapter object; beginner-guide and command-allocation comparator bodies retain their exact previous exclusions/field checks. Current runner retains actual candidate execution for focused/inherited behavior, separate restored historical identities, and adds purchase positive/negative entries for83 focused results (79 direct programs plus4 stable-family results).

Independent reruns: purchase192/192, receipt mutations4/4, inverse controls7/7, DOM boundaries134/134. Receipt mutation suite has no source-hash rejection oracle; failures come from behavior/receipt assertions. Complete release gate/archive verification remains separate and was not executed here.
