#!/usr/bin/env python3
"""Optional POSIX observer. The sole Node entry retains its existing preload semantics."""
import datetime
import json
import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import uuid

ROOT = Path(__file__).resolve().parents[2]


def write_new(path, value):
    with path.open('x', encoding='utf-8') as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2)
        stream.write('\n')


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def main(args):
    capture_failures = bool(args and args[0] == "--capture-failures")
    if capture_failures:
        args = args[1:]
    if not (len(args) in (4, 5) and args[0] == '--progress-dir' and args[2] == '--'
            and args[3] in ('verify-development.cjs', 'verify-current.cjs')
            and (len(args) == 4 or args[4] == '--check-only')):
        raise ValueError('Usage: python3 tools/verification-progress/observe.py [--capture-failures] --progress-dir /absolute/new-directory -- verify-development.cjs [--check-only] (or verify-current.cjs)')
    if os.name != 'posix':
        raise ValueError('This optional observer requires POSIX process-group signals. Use the unchanged standard verifier on Windows.')
    raw = Path(args[1])
    if not raw.is_absolute():
        raise ValueError('Progress directory must be absolute.')
    # Resolve its existing parent, but never follow/reuse the final path.
    directory = raw.parent.resolve(strict=True) / raw.name
    if directory == ROOT or ROOT in directory.parents:
        raise ValueError('Progress directory must be outside the sealed package.')
    node = shutil.which('node')
    if not node:
        raise ValueError('Node executable was not found on PATH.')
    directory.mkdir(mode=0o700)
    run_id = str(uuid.uuid4())
    config = {'schema': 1, 'directory': str(directory), 'runId': run_id, 'captureFailures': capture_failures}
    env = dict(os.environ)
    original_options = env.get('NODE_OPTIONS', '')
    require_option = '--require ' + json.dumps(str(Path(__file__).with_name('preload.cjs').resolve()), ensure_ascii=False)
    env['NODE_OPTIONS'] = original_options + (' ' if original_options else '') + require_option
    env['RED_VERIFY_PROGRESS_CONFIG'] = json.dumps(config)
    write_new(directory / 'run.json', {
        'schema': 1, 'runId': run_id, 'started': now(), 'root': str(ROOT),
        'command': args[3:], 'node': node,
        'failureOutputCapture': capture_failures,
        'failureOutputLimits': {'stderrHeadBytes': 8192, 'stdoutTailBytes': 4096} if capture_failures else None,
        'scope': 'spawnSync boundaries and process lifecycle only; not assertion-level progress, browser performance or a pass verdict'})
    child = None
    pending_signals = []
    previous_handlers = {}

    def forward(sig, _frame):
        if child is None:
            pending_signals.append(sig)
        else:
            try:
                os.killpg(child.pid, sig)
            except ProcessLookupError:
                pass

    for sig in (signal.SIGINT, signal.SIGTERM, signal.SIGHUP):
        previous_handlers[sig] = signal.signal(sig, forward)
    returncode = None
    error = None
    try:
        # No extra Node wrapper: an existing NODE_OPTIONS hook executes only in the
        # original Node entry and its original descendants, exactly as before.
        child = subprocess.Popen([node, *args[3:]], cwd=ROOT, env=env, start_new_session=True)
        for sig in pending_signals:
            forward(sig, None)
        try:
            write_new(directory / 'root-pid.json', {'pid': child.pid})
        except OSError:
            pass  # Post-launch telemetry failure must not replace the gate result.
        returncode = child.wait()
    except OSError as exc:
        error = {'name': type(exc).__name__, 'errno': exc.errno}
    finally:
        for sig, handler in previous_handlers.items():
            signal.signal(sig, handler)
    ended_signal = signal.Signals(-returncode).name if returncode is not None and returncode < 0 else None
    final = {'schema': 1, 'runId': run_id, 'finished': now(),
             'status': returncode if returncode is not None and returncode >= 0 else None,
             'signal': ended_signal, 'error': error}
    try:
        write_new(directory / 'final.json', final)
    except OSError:
        pass  # Missing final.json means unknown; never infer success from silence.
    if ended_signal:
        sig = -returncode
        signal.signal(sig, signal.SIG_DFL)
        os.kill(os.getpid(), sig)
        return 128 + sig  # Defensive fallback if an unusual runtime intercepts it.
    return 1 if error or returncode is None else returncode


if __name__ == '__main__':
    try:
        code = main(sys.argv[1:])
    except (OSError, ValueError) as exc:
        print('Verification progress refused: ' + str(exc), file=sys.stderr)
        code = 1
    sys.exit(code)
