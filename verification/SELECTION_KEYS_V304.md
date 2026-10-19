# v0.304 selection-key repeat guard

## Product boundary

The only functional source edit is adding `f`, `i`, `m` to the existing global keydown repeat guard in `src/script/04-interface-runtime.jsfrag`. The other source edit advances the display label. No selection callback, world simulation, pricing, saving, or button handler changes.

Holding a selection key previously invoked its callback on every repeated event. Each callback resets selection input and cancels pending commands. A player can start attack targeting after the first selection while still holding the key; the repeated key then cancels it. I additionally repeats selection feedback. Existing help describes discrete selection, not a held-key mode.

## Reproduction and verification

Run `node verification/selection-key-repeat-v304.cjs [index path]` for 93 cases, and `node verification/selection-key-repeat-negative-v304.cjs` for five exact source mutants. The frozen v303 artifact fails precisely the 12 held-key cases (F/I/M, uppercase/lowercase, running/paused), passing the other 81. The current artifact passes 93/93. Cases start the natural initial battle and use registered button/key callbacks for intervening army selection and attack targeting. Explicit lifecycle/focus fixtures are separate. First press, absent repeat flag, later fresh press, modifiers, composition, editable focus, and visible controls remain covered.

The mutation suite restores each missing guard independently, blocks all first presses, and disables uppercase suppression. Each is rejected by a named behavior assertion rather than a source-identity exception.

## Release integration boundary

`changes-v304.json` records exactly the two reviewed replacements. `restore-v303.cjs` pins BOTH complete input and restored output hashes. `source-delta-v304.cjs` is deliberately a non-identity inverse for mutation/source comparisons: it removes only those exact anchors, leaving unrelated changes visible. Its boundary suite confirms changed/duplicated anchors and unrelated changes cannot be silently blessed.

The new current runner executes the current candidate, retains all prior source-identity checks, and adds the full frozen v303 verification manifest. New current wrappers only advance dependency paths and candidate identity; comparison normalization composes exact reviewed v304 and older inverses. No new DOM exclusions, weakening of historical identities, or new render normalization is introduced. Old wrappers and evidence retain original bytes. The stable pilot manifest appends exactly the two reviewed changes to its existing fence.

The game-focused aggregate adds two entries (93-case suite and five mutants). Existing focused entries run on v304 but remain inherited tests, not newly invented coverage. Current complete gate outcome is recorded separately in QA_STATUS.md.

## Limitations

These are isolated Node VM event/DOM and source checks. Physical browser key timing, real browser layout, screen readers, FPS, and persistence lifecycle are unverified. Synthetic focus controls do not establish native default activation behavior. No browser workaround, hosting, remote publishing, or local-computer operation was used.
