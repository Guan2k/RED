# RED Enter repeat independent review

Decision: PASS for the narrow source fix and synthetic VM behavior. This is not a release/full-gate PASS or a native-browser acceptance.

Reviewed candidate: ../v314-work/RED (version remains 313).
Candidate index SHA-256: c87b96bda80287417710da0fe70ff9e944dbfe1f057e4644953672eb3e35ff38.
Baseline: ../v313-integration/RED.

## Independent evidence

- Independent review.cjs: 57/57 candidate. The unchanged baseline fails 27/57, including reopening after Escape, focus transitions and disabled-to-enabled held keys. The default-click adapter asserts after each repeat, avoiding attack toggle parity false negatives.
- Builder focused suite independently replayed: 51/51.
- Six builder negative mutants independently replayed: all rejected at their named assertions.
- Existing Escape suite replayed: 47/47.
- Existing factory Space suite replayed: 62/62.
- source-delta.json verifies index.html and source fragment each differ only by the single new guard, and output receipt matches candidate bytes.

## Semantic review

The shared attack/build keydown handler cancels only Enter repeat defaults outside IME. Browser default click can therefore no longer toggle attack or restore placement after cancellation. It does not add a synthetic click, change click handlers, stop propagation, mutate Space tokens, or persist an activation latch. First Enter (including missing repeat), subsequent fresh Enter, direct mouse/assistive-style detail-zero clicks, and existing Space keyup semantics remain available. Numpad Enter is covered when its key is Enter, regardless of code.

All five target controls are covered. Disabled button .click remains blocked in the model; re-enabling or transferring focus onto a target while Enter is already held cannot activate it until a fresh nonrepeat press. The handler is local: an input or unrelated button does not get this prevention just because a command button previously had focus. No focus tracking is necessary for suppression, because actual keydown delivery supplies the focused target. The disabled fixture tests only the application's handler/click behavior, not browser focus loss on disabling.

The Enter branch precedes the Space branch's target/disabled/commandBlocked guards. This intentionally prevents repeated native activation even across lifecycle changes, without changing world state. It also suppresses bubbled Enter repeats from descendants. Current build descendants are noneditable, nonfocusable spans and attack has text only, so this does not obstruct a current nested editor. Future focusable/editable descendants would require a scope reassessment. Modified Enter repeats are also suppressed, consistent with the existing production-button guard; fresh modified Enter is not newly intercepted.

IME is preserved by both isComposing and legacy keyCode 229 exclusions. This establishes that the change does not intercept those events; it does not claim that a browser/IME cannot itself generate a click.

## Limits and remaining work

All execution here uses the existing full-inline-source VM and an explicitly synthetic Enter-keydown / Space-keyup default-click model. No real keyboard timing, native focus/disabled routing, browser-generated trusted clicks, accessibility platform delivery, persistence, packaging, whole gate or release validation was performed. Passing detail-zero direct clicks is not an accessibility certification.

The historical global-repeat fixed-hash guard is known not to match this candidate and remains unadapted. It is not a PASS and must be reconciled honestly before release acceptance; no old goldens or frozen packages were changed. This review changed only new files in v314-independent-review and read candidate/baseline files.
