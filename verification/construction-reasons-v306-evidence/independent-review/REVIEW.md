# v306 construction-card reason independent review

Verdict: approve the narrow UX change and reviewed release verification integration. Full release gate/archive verification remains separate.

Source SHA256: 1a9f77bd7329575c42415af5bf41dc1b0c9440227a119c7c582d395c3a57753a.

## Executed evidence

Independent review.cjs: 247/247 tests pass.

240 matrix cases compare all four construction cards against v305 at six cash boundaries (zero, cost minus 200, minus 1, minus 0.1, exact cost, and above cost), five lifecycle states (prestart, running, paused, restart confirmation, terminal), and standard/mobile modes. Each verifies exact disabled/title parity, reason iff disabled, expected reason text, world/input equality, repeat refresh read-only behavior, and unchanged button click behavior.

Seven additional cases verify live cash/mode/restart transitions on each card, no repeated text writes for unchanged reasons, literal-text handling of markup-like strings, and overlapping lifecycle precedence. Factory cost 850 at cash 650 displays “资金不足，还差 200资金”; at cash 850 the reason clears. Fractions round the missing amount upward, correctly reflecting the minimum whole-unit shortfall.

The exact generated-source diff consists of seven substitutions: display version, four empty inline reason spans, one read-only reason helper, and one guarded textContent update. Original cost/time markup, disabled predicate, title, purchase/placement paths, and game definitions remain unchanged. Diff proof is in diff.json.

## Accessibility and text safety

The four reason spans are children of the existing buttons and use aria-live="off", with no status/alert role. Dynamic content is assigned through guarded textContent, not innerHTML. The injection probe supplies markup-like text through a controlled rule-function fixture and confirms literal text/no added elements. These checks establish source/DOM semantics, not actual screen-reader behavior or native-browser layout acceptance.

## Limits

Deterministic VM evidence with explicit cash, challenge and lifecycle fixtures; no native browser, raster layout, screen-reader, storage or performance claim. Candidate and frozen baseline were read-only throughout. No release archive/full-gate claim is made here.

## Release verification integration

Integration approved. Independent integration-review.cjs verified all 2,202 frozen v305 verification files against disk and their full preservation manifest. Executed 34 strict restoration steps v306→v272, with additional available host-manifest hash checks. Source inverse recovers the exact v305 bytes. The source oracle remains strict; unrelated edits cannot be silently normalized into the baseline.

Inspected current runner routing: actual candidate source feeds current focused/inherited programs, strict historical restoration is separately used for old identities, and the new reason positive/negative suites are added without dropping earlier focused programs. Expected total is 77 direct program entries plus four stable-family results.

The new inherited comparator adapter adds exactly two filters to each preceding comparator: omit reason SPAN nodes whose IDs match the four building types and whose direct parent has the matching data-build, and omit corresponding child-list references. It makes no other change to the previous projection. The separate command-allocation comparator uses the same bounded node predicate. Existing button fields remain compared. Descendants, wrong parent, wrong tag, renamed IDs and similar siblings remain visible. These are pattern-based filters for the four intended nodes, not a general subtree or prefix exclusion; strict source identity independently pins the actual markup.

Independently reran adapter boundary checks: 101/101; source inverse controls: 12/12; author's reasons suite: 47/47; behavioral mutation controls: 4/4. No test weakening found.

Minor nonblocking copy observation sent to author: the current inverse-control report still says “precisely two” reviewed changes despite testing seven; correcting that scope prose does not affect product source or approval.

Full release gate/archive verification remains separately owned; no claim that this reviewer executed it.

## Follow-up: stale-title mutation anchor maintenance

Approved the narrow current-test correction after the isolated gate exposed an obsolete mutation anchor. Read both archived failures: the first was an omitted nested historical SHA256SUMS.txt in the sealed snapshot; the second was a zero-match stale-title mutation anchor whose old context assumed the end of the construction-card loop immediately followed the title write. v306 legitimately appends the inline-reason write there.

Independent bounded-anchor-proof.json proves the negative-control script differs from v305 only in current-version entry names and shortening that one before/after anchor. The matched mutation remains exactly `if(b.title===undefined)` before the construction title setter. Unique-occurrence checking remains mandatory; the expected failure map and assertion checks are unchanged. The new inline-reason update is retained in the mutant, so this still specifically tests stale original titles rather than disabling the new text feature.

Independently reran only the bounded negative suite: 10/10 mutations detected, including unchanged exact failure `bounded display parity mobile new battle`. Result is bounded-ui-negative-recheck.json. Product source hash remained unchanged. The missing nested manifest path is now present in the outer checksum manifest. Full gate was not rerun by this reviewer.

## Follow-up: beginner-guide retained DOM comparator

Approved the current beginner-guide comparator's narrow projection update. It uses the same exact SPAN tag / full reason ID / matching data-build parent predicate. Both flat elements and child-list references are omitted only with project=true. Unprojected baseline handling, original field enumeration, attributes/style/dataset, parent mapping, source hashes, exact delta checks and behavior assertions are unchanged.

Independent guide-projection-review.cjs: 22/22 checks. Unprojected output is exactly identical to the preceding comparator on the same candidate. Mutating any original card's title, disabled flag, original price/time span, dataset or style still changes the projected result. Physically removing only the four intended reason spans gives precisely the old projected result.

Independently reran guide suite: 41/41; expanded adapter boundary suite: 134/134. The direct 247-case reason review separately verifies new reason updates, rather than relying on their deliberately excluded historical-DOM comparison. Product source hash unchanged. No whole-gate rerun by this reviewer.
