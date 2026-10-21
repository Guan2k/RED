from pathlib import Path
import hashlib, json, shutil
from datetime import datetime, timezone

work = Path(__file__).resolve().parent
root = work.parent / 'v315-recovery-integration/RED'
verification = root / 'verification'
baseline = work.parent / 'v314-recovery/repo/verification'
dest = verification / 'visual-upgrade-v315-preflight-evidence'
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
source_hash = sha(root / 'index.html')
assert source_hash == '3956a8f7f751949b226fc4cdd91dfe8abd7b4eadd79f83ee02a0df794e08acb6'
metas = sorted(work.glob('*.cjs.meta.json'))
assert len(metas) == 26, len(metas)
current = []
for path in metas:
    data = json.loads(path.read_text())
    name = path.name.removesuffix('.meta.json')
    assert data['sourceSha256'] == source_hash and data['sourceUnchanged'], name
    assert data['exitCode'] == 0 and data['stderrBytes'] == 0 and data['failed'] == 0, name
    assert not data['failures'] and data['suiteUnchanged'], name
    assert data['suiteSha256'] == sha(verification / name), name
    assert (work / (name + '.stderr')).read_bytes() == b'', name
    report = json.loads((work / (name + '.stdout')).read_text())
    assert report['failed'] == 0, name
    current.append({'script': name, **data})
inherited = json.loads((work / 'inherited-preflight-summary.json').read_text())
assert inherited['sourceSha256'] == source_hash
assert inherited['programs'] == inherited['passed'] == 25 and inherited['failed'] == 0
assert sum(row['expectedHistoricalIdentityRejections'] for row in inherited['reports']) == 15
for row in inherited['reports']:
    assert row['okay'] and (work / ('inherited-' + row['script'] + '.stderr')).read_bytes() == b''
health = work.parent / 'v315-recovery-health-preflight'
receipt = json.loads((health / 'health-recovery-receipt.json').read_text())
assert receipt['freshRecoveryRun'] and not receipt['fullgateRun']
for name, digest in receipt['hashes'].items():
    assert sha(root / name) == digest, name
assert receipt['positive'] == {'passed': 2952, 'failed': 0}
assert receipt['negative'] == {'passed': 50, 'failed': 0, 'productMutants': 24, 'oracleControls': 26}
historical = [p for p in baseline.rglob('*') if p.is_file()]
changed = [str(p.relative_to(baseline)) for p in historical
           if not (verification / p.relative_to(baseline)).is_file()
           or p.read_bytes() != (verification / p.relative_to(baseline)).read_bytes()]
assert len(historical) == 3624 and not changed, changed
new_cjs = [p for p in verification.glob('*v315*.cjs') if not (baseline / p.name).exists()]
assert len(new_cjs) == 107
assert all(p.read_text().startswith("'use strict';") for p in new_cjs)
dest.mkdir(exist_ok=True)
for path in metas:
    shutil.copy2(path, dest / path.name)
    name = path.name.removesuffix('.meta.json')
    shutil.copy2(work / (name + '.stdout'), dest / (name + '.report.json'))
    shutil.copy2(work / (name + '.stderr'), dest / (name + '.stderr'))
for path in sorted(work.glob('inherited-*.stdout')):
    shutil.copy2(path, dest / path.name.replace('.stdout', '.report.json'))
for name in ['inherited-preflight-summary.json', 'migration-identities.json',
             'render-gallery-preflight-summary.json', 'migrate-adapters.py',
             'adapt-focused.py', 'run-one.py', 'preflight-inherited.cjs',
             'archive-preflight.py']:
    shutil.copy2(work / name, dest / name)
for name in ['health-positive-v315.json', 'health-negative-v315.json', 'health-recovery-receipt.json']:
    shutil.copy2(health / name, dest / name)
if (work / 'prior-attempts').exists():
    shutil.copytree(work / 'prior-attempts', dest / 'prior-attempts', dirs_exist_ok=True)
integrity = {'frozenBaseline': 'v314-recovery/repo',
             'frozenCommit': 'add24f6949c58980f5944f9faf6782b1851aea16',
             'preExistingFiles': len(historical), 'changed': changed, 'allByteIdentical': True}
(dest / 'frozen-history-integrity.json').write_text(json.dumps(integrity, indent=2) + '\n')
new_files = {str(p.relative_to(verification)): sha(p)
             for p in sorted(verification.rglob('*'))
             if p.is_file() and dest not in p.parents
             and not (baseline / p.relative_to(verification)).exists()}
(dest / 'new-verification-files.json').write_text(json.dumps(new_files, indent=2) + '\n')
summary = {'status': 'PASS', 'freshRecoveryRun': True,
           'kind': 'Individual targeted preflight, not the full release gate',
           'verifiedAt': datetime.now(timezone.utc).isoformat(),
           'sourceSha256': source_hash,
           'runnerSha256': sha(verification / 'run-tests-v315.cjs'),
           'currentPrograms': len(current), 'currentFailures': 0,
           'inheritedPrograms': 25, 'inheritedUnexpectedFailures': 0,
           'exactHistoricalIdentityRejections': 15,
           'healthPositive': receipt['positive'], 'healthNegative': receipt['negative'],
           'inverseSpans': 26, 'historicalFilesByteIdentical': 3624,
           'newStrictModePrograms': len(new_cjs), 'currentReports': current}
(dest / 'SUMMARY.json').write_text(json.dumps(summary, indent=2) + '\n')
(dest / 'README.md').write_text('''# Newly executed v315 targeted preflight

These reports were executed anew against the recovered candidate; no earlier
workspace scores are reused. This is not the full release gate. Commands and
suite hashes are recorded in each `.meta.json`; the matching `.report.json`
contains the complete unfiltered output. The 25 inherited reports include only
the exact 15 frozen historical-identity rejections. Health has a separate fresh
execution receipt. All 3,624 existing verification files remain byte-identical.

The scripts are retained as the exact recovery orchestration used. Their paths
are relative to the sibling recovery directories documented in them. To rerun,
copy them to `v315-recovery-adapter-preflight` beside the frozen baseline and
integration directories, then invoke `python run-one.py <suite-name>` and
`node preflight-inherited.cjs`. Migration is not required to execute the suites.
The two health suites run directly with Node from the package root.

All render evidence is synthetic Canvas/Node or generated markup, not native
browser raster, input latency, accessibility acceptance, or measured FPS.
''')
files = sorted(p for p in dest.rglob('*') if p.is_file() and p.name != 'SHA256SUMS')
(dest / 'SHA256SUMS').write_text(''.join(sha(p) + '  ' + str(p.relative_to(dest)) + '\n' for p in files))
print(json.dumps({key: value for key, value in summary.items() if key != 'currentReports'}, indent=2))
