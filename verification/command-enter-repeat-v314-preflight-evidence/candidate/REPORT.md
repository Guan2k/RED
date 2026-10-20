# Enter-repeat candidate (still identifies as v313)

Candidate: /workspace/scratch/e433d7540f34/red-development/v314-work/RED
Frozen baseline: /workspace/scratch/e433d7540f34/red-development/v313-integration/RED

Only runtime change: src/script/04-interface-runtime.jsfrag:313, prepend a branch inside the existing attack/data-build onkeydown handler:

    if(e.key==='Enter'&&e.repeat&&!e.isComposing&&e.keyCode!==229){e.preventDefault();return}

This suppresses only non-IME repeated Enter default activation on these buttons. It leaves first Enter, Space token creation/cancellation/release, normal and assistive clicks, and IME handling alone. The global BUTTON/Enter early return is unchanged. Generated index and build receipt were regenerated with the normal builder. No version rename, release reseal, publication, full gate, native-browser acceptance, storage action or external write was performed.

## Results

- command-enter-repeat-candidate.cjs: candidate 51 passed / 0 failed; frozen baseline 29 passed / 22 failed.
- Coverage across attack and all four data-build buttons: first Enter/repeats/Escape/repeats/new press, independent behavior-only cancellation and stable armed-mode assertions, orphan repeat, mouse and detail=0 independent click, Space release/cancel/new press, composing and keyCode=229, unrelated key, Space-token preservation, unrelated pause button.
- command-enter-repeat-negative-candidate.cjs: 6/6 mutations detected. Remove guard; block first Enter; block composing; block legacy composing; block unrelated repeated keys; return without preventing default.
- Existing escape-key-repeat-v313.cjs: 47/47 passed.
- Existing factory-space-v313.cjs: 62/62 passed.
- tools/source-build.mjs --check: passed.
- Original enter-repeat.cjs reproduced against old and candidate via path-only adapter. Results in original-repro-old.json / original-repro-new.json.
- Two attempted additional suites did NOT pass: global-repeat-mode-scope-v313.cjs and global-repeat-scope-v313.cjs stop at frozen v313 hash/restoration guards because this is an intentionally modified candidate. Guards were not altered or repinned. These are not gameplay failures established by those suites; gameplay stages were not reached.
- Frozen baseline sha256sum -c SHA256SUMS.txt: exit 0, all entries OK.

All behavior tests are synthetic full-source VM plus an explicit native-default-click model. They do not prove actual native browser keyboard timing, rendering, focus, or assistive-technology activation.

## SHA-256

Baseline source fragment: c03dcdf297590ff6de27936023f8af680f3acd1231ac83894fec21453ccad3cb
Candidate source fragment: ae0619586362d1e8ff7be4e8e330481fc150ae27d0f712e963a824ff22489488
Baseline index.html: 1fa18e30606cecd2d237c74fe2056036adcb408c643fe601004de63b202d91fb
Candidate index.html: c87b96bda80287417710da0fe70ff9e944dbfe1f057e4644953672eb3e35ff38
Candidate build input digest: cb1c3f326e1f00e10d97bee96cd1216cc1db3147f8e324e6d0e0ec54570bc778

source.patch contains the one-line source diff. file-differences.txt enumerates exactly three changed existing files and two added tests. Candidate release checksums intentionally remain stale because release work was not authorized in this task.
