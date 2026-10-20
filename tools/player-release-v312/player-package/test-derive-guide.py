#!/usr/bin/env python3
"""Static-only regression checks for guide conversion; never execute the game."""
from pathlib import Path
from unittest.mock import patch
import argparse
import collections
import hashlib
import importlib.util
import json
import re
import subprocess
import sys
import tempfile

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source', type=Path, required=True, help='Exact full baseline CURRENT_PLAYER_GUIDE.md')
parser.add_argument('--report', type=Path, help='Optional new report path; omitted means stdout only')
args = parser.parse_args()
SOURCE = args.source.resolve(strict=True)
spec = importlib.util.spec_from_file_location('derive_guide', ROOT / 'derive-guide.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
source = SOURCE.read_bytes()
source_hash = hashlib.sha256(source).hexdigest()
mapping_bytes = (ROOT / 'guide-map.json').read_bytes()
mapping = json.loads(mapping_bytes)
output = module.derive(source, mapping_bytes)
checks = []

def check(name, condition):
    if not condition:
        raise AssertionError(name)
    checks.append({'name': name, 'result': 'pass'})

def rejects(name, source_arg=source, mapping_arg=mapping_bytes):
    try:
        module.derive(source_arg, mapping_arg)
    except ValueError as exc:
        checks.append({'name': name, 'result': 'pass', 'rejection': str(exc)})
    else:
        raise AssertionError(name + ' incorrectly accepted')

check('exact approved baseline renders the fixed reviewed OUTPUT_SHA256', hashlib.sha256(output).hexdigest() == module.OUTPUT_SHA256)
check('two derivations are byte-identical', module.derive(source, mapping_bytes) == module.derive(source, mapping_bytes))
with patch.object(Path, 'read_bytes', side_effect=AssertionError('Unexpected file reread')):
    check('provided immutable mapping bytes cause no filesystem reads', module.derive(source, mapping_bytes) == output)
rejects('wrong version', source.replace(b'v0.312', b'v0.313', 1))
rejects('unknown extra paragraph', source + '\n新增未审查玩家功能。\n'.encode())
rejects('missing source paragraph', source.replace(mapping['source_paragraphs'][150]['text'].encode(), b'', 1))
rejects('source byte alteration', source[:-1] + b'!')
rejects('unexpected CRLF baseline', source.replace(b'\n', b'\r\n'))
rejects('unreviewed mapping whitespace', mapping_arg=mapping_bytes+b' ')
changed = json.loads(mapping_bytes)
changed['output_paragraphs'][0]['text'] = '[Package-external link](https://invalid.example/)'
rejects('mapping with external link', mapping_arg=json.dumps(changed, ensure_ascii=False).encode())
changed = json.loads(mapping_bytes)
for p in changed['output_paragraphs']:
    if p['id'] == 'o_' + mapping['preservation_checks']['chapter_6_source_ids'][1]: p['text'] = '保存说明已删除。'
rejects('mapping missing mandatory save warning', mapping_arg=json.dumps(changed, ensure_ascii=False).encode())
changed = json.loads(mapping_bytes)
changed['source_paragraphs'].pop()
rejects('mapping with an unclassified source paragraph', mapping_arg=json.dumps(changed, ensure_ascii=False).encode())
check('all 208 source paragraphs are classified', len(mapping['source_paragraphs']) == 208 and all(p['reason'] and p['output_ids'] for p in mapping['source_paragraphs']))
result_text = output.decode()
main = re.findall(r'^## .+$', result_text, flags=re.M)
check('seven original main chapter headings preserved', main == mapping['required_main_headings'] and len(main) == 7)
check('all 15 original save chapter paragraphs preserved verbatim', all(next(p['text'] for p in mapping['source_paragraphs'] if p['id']==pid) in result_text for pid in mapping['preservation_checks']['chapter_6_source_ids']))
check('no historical release links, test commands or old current-version statement', not re.search(r'RELEASE_NOTES|verification/|run-tests|本指南对应 v0\.274', result_text))
check('known local Markdown links only', all(link == 'README.md' or link[1:] in mapping['preservation_checks']['unchanged_main_anchors'] for link in re.findall(r'\[[^\]]*\]\(([^)]+)\)', result_text)))
check('static layout-shift limitation preserved', '没有通知的静默位置变动只在下次地图输入重判，不保证静止预览立即更新。' in result_text)
check('old delayed click and fresh-press rule preserved', '旧的迟到点击' in result_text and '重新明确按下后可正常操作' in result_text)
check('source byte hash unchanged after API checks', hashlib.sha256(SOURCE.read_bytes()).hexdigest() == source_hash)
with tempfile.TemporaryDirectory(prefix='derive-guide-test-') as tmp:
    tmp = Path(tmp)
    target = tmp / 'player.md'
    base = [sys.executable, str(ROOT / 'derive-guide.py'), '--source', str(SOURCE), '--output', str(target)]
    p = subprocess.run(base, capture_output=True, text=True)
    check('CLI creates new exact output', p.returncode == 0 and target.read_bytes() == output)
    p = subprocess.run(base, capture_output=True, text=True)
    check('CLI refuses overwrite', p.returncode != 0 and target.read_bytes() == output)
    p = subprocess.run(base + ['--check'], capture_output=True, text=True)
    check('CLI verifies same output without replacing it', p.returncode == 0)
    target.write_bytes(output.replace('必须手动保存'.encode(), '保存提醒已删'.encode(), 1))
    p = subprocess.run(base + ['--check'], capture_output=True, text=True)
    check('CLI rejects altered output missing save warning', p.returncode != 0)
    symlink = tmp / 'source-link.md'
    symlink.symlink_to(SOURCE)
    p = subprocess.run([sys.executable, str(ROOT / 'derive-guide.py'), '--source', str(symlink), '--output', str(tmp/'bad.md')], capture_output=True, text=True)
    check('CLI refuses source symlink', p.returncode != 0 and not (tmp/'bad.md').exists())
check('source byte hash unchanged after CLI checks', hashlib.sha256(SOURCE.read_bytes()).hexdigest() == source_hash)
report = {
 'scope': 'Static guide conversion only; no game, browser, save/load/import/export or network operations.',
 'checks_passed': len(checks),
 'checks': checks,
 'source_sha256': source_hash,
 'mapping_sha256': hashlib.sha256(mapping_bytes).hexdigest(),
 'guide_sha256': hashlib.sha256(output).hexdigest(),
 'source_paragraphs': len(mapping['source_paragraphs']),
 'output_paragraphs': len(mapping['output_paragraphs']),
 'disposition_counts': dict(collections.Counter(p['disposition'] for p in mapping['source_paragraphs'])),
}
report_text = json.dumps(report, ensure_ascii=False, indent=2) + '\n'
if args.report is not None:
    with args.report.open('x', encoding='utf-8', newline='\n') as handle:
        handle.write(report_text)
print(report_text, end='')
