# Explicit DOM projection optimization for v318 verifier

This is an optional **test-code transformation**, not a game change and not pure observation. The default verifier command remains unchanged. Do not report this mode as an unmodified default gate passing.

The exact SHA-pinned historical `command-allocation-feedback-v318.cjs` has three pure projection builders reconstructed inside every element filter. This adapter constructs those builders once per `dom(g)` invocation. It never caches between calls or scenarios. Element filtering order, all projection fields, parent/identity checks, 104 scenarios and 1114 assertions remain. The historical file is not edited. The transformation verifies exact reverse reconstruction of all original source bytes.

The independent positive/negative adapters preserve the historical module filename and directory. The negative adapter redirects exactly one positive filename and retains all eight source mutations, exact expected assertion messages, 120000 ms subprocess timeout and 4e6 maxBuffer.

## Explicit integration

After creating a new audit directory outside the package, opt into `preload.cjs` using an absolute quoted `--require` in `NODE_OPTIONS`, and set `RED_DOM_PROJECTION_AUDIT_DIR` to that directory. Preserve any existing `NODE_OPTIONS`; do not overwrite other hooks. It can accompany the Python verification-progress launcher without introducing an extra Node process.

The loader narrowly wraps `Module.prototype._compile`. Non-target calls preserve `this`, original argument count/values and native return/throw semantics. It matches only the exact target basename within a `verification` directory, requires the original fixed source SHA or the exact transform SHA, and rejects any other source. Already transformed exact source is passed through without applying a second transformation. Existing loaders that themselves change this target can conflict and must not be assumed compatible.

Each target compilation writes one mandatory external JSONL audit record identifying explicit transform mode, input/original/transformed SHA and reverse validation. An audit write failure prevents target compilation. This intentionally differs from the optional progress observer's best-effort logs. Audit events establish compilation only, never passed assertions. A complete canonical run is expected to audit the direct positive plus the negative baseline and eight mutated cases: ten target compilations.

## Acceptance limits

A prior pure-observation complete gate failed at the unchanged 120000 ms allocation-feedback subprocess threshold. The same exact call without observation also timed out. Profiling was bounded, separately labeled non-gate diagnostic execution. DOM projections were the measured dominant cost. A diagnostic pass is not a gate pass; no timeout has been increased. Read the external run evidence for the actual acceptance status and do not infer full completion from unit tests or logs alone.

Formal acceptance is limited to the recorded known preload combination. An earlier third-party `_compile` wrapper could further modify source after this hook's checks. Auditing this hook's input/output is not a guarantee about arbitrary third-party loaders; such combinations need separate review.
