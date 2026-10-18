# Independent v292 digit-repeat acceptance

Decision: approve scoped product change. Parent retains aggregate/package/publication approval.

Source: `red-development/v292-key-repeat/RED/index.html`
SHA-256: `e5edd8f7384d37a356071c66c6788e681f3e45ad9ab224a52a783692b5ca0884`

Independent suite: 204 passed, 0 failed. Running the same suite against v291 produces 87 passes and 117 failures, confirming sensitivity to the repeat behavior.

Verified all three digits with Ctrl, Meta and no modifier; repeat prevents default but leaves exact world/log/input snapshots unchanged; paused operation; unopened/restart/terminal rejection; pending construction, attack, ordinary/append and drag preservation; first keydown with false or undefined repeat; selection change during held key, keyup then fresh keydown recovery; existing visible save and Ctrl-click/recall parity; editing focus exclusion.

Product diff is only version label and `if(!e.repeat)` guarding `controlGroup` in the existing digit branch at line 775. Existing preventDefault and return remain in place.

Reviewed deliberate inherited-test adaptation: `control-group-protection-v292.cjs` changes only the prior valid-repeat expectation to group preservation and adds fresh `repeat:false` successful save. The retained v291 suite is byte-identical to the prior package. This is an explicit intended behavior change, not hidden removal of a regression assertion.

No product edits, native browser, save/load/import/export or storage operations. Scratch harness suppresses persistence refresh before bootstrap and exposes throwing persistence APIs. Synthetic VM/DOM input fixtures do not establish native keyboard fidelity.

Evidence: `acceptance.cjs`, `no-persistence-vm.cjs`, `candidate-results.json`, `baseline-results.json`.
