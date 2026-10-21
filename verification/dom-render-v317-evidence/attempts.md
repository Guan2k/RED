Focused test attempt history

First DOM negative run in parallel with the full render suite was killed by the OS, with no assertion diagnostic or JSON result. Shell output: `Killed node .../inherit-dom-v317-negative-control.cjs`. An intermediate negative runner attempted explicit garbage collection between independent VM fixtures using a test-only V8 GC hook; no product bytes, assertions, cases, VM timeouts, or behavior change. The final runner is described below and runs normally with node, without extra flags.

First full render attempt: 78 passing, one existing 10-second VM timeout on ridge trajectory during concurrent execution. Retained unchanged result attached. No timeout increase.

First beginner attempt: 40 passing, one stale version-mutation failure. Updated only v0.317 to v0.316 mutation, retaining all 41 cases.

Second DOM attempt with test-only GC was also killed. A four-case subprocess attempt subsequently reported child termination (status null in batch 1), without a semantic assertion. Review identified object-valued assertion diagnostics on cyclic DOM graphs as the trigger candidate; node-identity/order guards now compare booleans and exact per-position identities rather than recursively printing graph objects. This preserves every structural rejection and is stricter about object identity. Final runner uses four-case isolated processes and exact per-batch name/hash/pass inventory checks; no GC hook remains.
