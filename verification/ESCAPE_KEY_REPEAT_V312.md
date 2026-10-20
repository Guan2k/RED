# Escape repeat protection

## Product boundary

One expression in the global key handler now includes Escape in the existing repeat-return guard. Initial/missing-repeat Escape retains cancellation of pending building placement, attack/ordinary/append point modes, drag selection, command Space tokens and restart. Result-view Escape already excluded repeats and remains unchanged. Input/editor/IME/modifier guards, default-event handling, visible cancel controls, world simulation, issued orders, economy and saved schema remain unchanged.

The reproduced sequence uses registered callbacks: first Escape, a newly armed pending action or newly opened restart, then a repeated Escape. The former handler canceled that newer action even though Escape had not been released and pressed again. The new guard retains it until a fresh Escape or another deliberate cancellation. No cooldown or persistent key state was introduced.

## Reproducible focused evidence

Run from package root:

- `node verification/escape-key-repeat-v312.cjs`
- `node verification/escape-key-repeat-negative-v312.cjs`

47 focused cases pass. The same cases against the frozen v311 artifact give 33 passes and 14 expected behavioral failures. Four exact mutations are rejected by specifically named cases: restore old repeat cancellation, block first Escape, omit attack cancellation, omit restart return. This is test sensitivity evidence, not four additional gameplay scenarios.

Cases cover running/paused attack, placement, ordinary/append and drag input, reopening restart, fresh and absent-repeat events, Shift, editor/IME/modifier guards, initial/result snapshots, first Escape return from result view, command Space tokens and the explicit cancel button. The command modes start through real registered controls. Drag is created by registered canvas pointerdown. Terminal and editor cases use explicit fixtures. Snapshot comparisons include full state, selection, groups and pending input state; no save/load/import/export operation is performed.

Focused results in escape-key-repeat-v312-evidence were captured before release version-label integration. Tests accept an explicit source argument and must be rerun by the current aggregate on final source bytes. Historical checks are preserved; current reverse-source adapters identify only the reviewed change and version-label edits.

## Limits

Evidence is a deterministic Node VM with mocked DOM/canvas and synthetic events, not browser keyboard repeat timing, browser default activation, physical keys, touch, accessibility, visual layout, performance, storage, natural-play win rate or publication. The independent review and full developer gate are separate evidence. No blocked browser route was retried.
