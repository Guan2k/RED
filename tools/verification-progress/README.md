# Optional verification progress (v318 tooling supplement)

The standard commands remain unchanged. This tool adds observation; it does not replace a test, skip checks, shorten a timeout, enable parallel tests, or change the game's version.

## Run and inspect

With Python 3 and Node on PATH, on POSIX systems (Linux/macOS), create a **new absolute directory outside the sealed package**:

```sh
python3 tools/verification-progress/observe.py --progress-dir /tmp/red-gate-progress-unique -- verify-development.cjs
```

The parent directory must already exist. The final directory must not exist; prior evidence is never overwritten. `verify-current.cjs` is also supported. Either entry accepts its existing `--check-only` option. No arbitrary command is accepted.

From another terminal or session, inspect without touching the running process:

```sh
node tools/verification-progress/status.cjs /tmp/red-gate-progress-unique
```

For example, an active `child-start` record can show which focused `.cjs` script has begun even while the canonical aggregate buffers its JSON report until completion. Completed records provide wall-clock elapsed milliseconds and the child process's exit status, signal or spawn error. A child exit of zero is **not** proof that its parent's subsequent assertions passed.

Windows is explicitly unsupported by this optional launcher because it uses POSIX process-group cancellation. On Windows, use the original `node verify-development.cjs` / `node verify-current.cjs`; the game and original verification tools remain unchanged.

## What is preserved, and what is observable

- The Python-standard-library launcher runs the unchanged Node entry with inherited stdin/stdout/stderr. It creates no additional Node wrapper, so existing Node preloads do not execute an extra time merely to start observation. It does not parse or rewrite the gate's output.
- The preload wraps the CommonJS `child_process.spawnSync` binding, passes the original `this` and arguments, and returns the original result or rethrows the original exception. It does not change timeout, maxBuffer, encoding, cwd, env, stdio or child arguments.
- Existing `NODE_OPTIONS` text is retained; a quoted absolute `--require` is appended. An additional `RED_VERIFY_PROGRESS_CONFIG` environment value carries the sidecar location and run ID.
- This means instrumentation is **observable** to the program through its environment, loaded module and wrapped function identity. There is also synchronous log-write overhead. This is not a claim of byte-identical environments, zero performance perturbation or speedup.
- A subprocess that explicitly filters its environment can omit the preload. Non-Node programs and asynchronous spawn calls have no internal instrumentation. The observer reports known boundaries, not all assertions or a percentage complete. An ESM binding or a function reference captured before this preload may also remain unobserved. Active elapsed time means time since an observed start, not proof of continuing CPU work.
- Each Node process writes its own UUID-named JSONL stream; process IDs and parent IDs are also recorded. In the default mode only command/script metadata is logged; stdin, buffers, full arguments and environment values are not copied into evidence. The explicit failure-output mode below adds bounded failed stdout/stderr fragments only.

## Failure and cancellation policy

Before launch, invalid options, a reused path, a path within the sealed package (including a symlinked parent), or inability to create the directory causes refusal without running tests.

After launch, logging is best-effort and must never replace a real test exception or change a failing gate into success. Streams contain sequence numbers and a dropped-write count at ordinary process exit. The status reader reports malformed/gapped records and missing terminal records as incomplete/unknown. Missing `final.json` means the overall gate outcome is unknown. Even complete observed streams do not guarantee every child was instrumented.

The final sidecar records the direct gate process's status/signal/error, not an inferred test verdict. If sidecar persistence fails, it may be absent; check the actual launcher exit and ordinary gate output. Never use a quiet or missing log as evidence of success.

The launcher places the direct gate and descendants in a dedicated POSIX process group. SIGINT, SIGTERM and SIGHUP are forwarded to that group. A child terminating by signal causes the launcher to terminate by the same signal; it is not translated into success. Abrupt SIGKILL, machine loss, intentional process detachment or hostile signal handlers cannot be fully recovered by this observer and may leave incomplete evidence.

## Why no tests were removed

The v318 audit found 105 unique direct focused entries. Stable-suite dispatch replaces six old entries instead of adding duplicate runs. Current-source, historical-identity and adapted-DOM runs have different inputs or assertions.

There are 62,051 historical-manifest file/hash checks covering 4,373 distinct paths. Repeated checks exist, but their share of total runtime has not yet been measured. Original-package preflight, launch-time revalidation and isolated-copy validation protect different times/locations. This tooling supplement removes none of them and makes no speedup claim.

## Optional failure-output capture (default off)

Pass `--capture-failures` as the first argument before `--progress-dir` to explicitly allow external diagnostic copies of failed test output. This can contain test-generated text and assertion excerpts; review access before sharing. It does not record environment values, stdin, or full argument lists. Successful child output is never copied by this feature.

For a nonzero child status, signal, child error, or thrown error, available own-data stdout/stderr strings or non-Proxy Buffers are sampled. Stderr is capped to its first 8192 bytes (`position: head`) to favor preserving the initial error header; long prefixes can still omit it; stdout is capped to its last 4096 bytes (`position: tail`). Each unique `failure-*.json` file is created with exclusive creation and mode 0600 inside the external progress directory. Binary data is base64 encoded. Each stream records original byte count, captured count, truncation flag and SHA-256 of the captured fragment only, not a misleading full-output hash. Unsupported/getter/Proxy stream values are unavailable, not coerced or inspected.

Capture is best effort. File-write, serialization or observation failures never replace a child's original return object, exception, exit status or signal; dropped observation counts mark incomplete evidence. A missing failure artifact does not prove there was no failure. No automatic retry or relaxed timeout follows a captured failure. This optional feature is independent of the explicit DOM test-code transform, whose mandatory audit failures intentionally stop that transform.

For string-valued child output, byte counts and hashes refer to the UTF-8 encoding of the returned JavaScript string, not pre-decoding operating-system bytes. For Buffer output they refer to the returned bytes directly. No claim is made that invalid bytes already decoded by Node can be reconstructed.
