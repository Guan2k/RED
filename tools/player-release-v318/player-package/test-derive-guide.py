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
wrong_version = source.replace(b'v0.318', b'v0.319', 1)
check('version negative changes v0.318 to v0.319 exactly once', wrong_version != source and wrong_version.count(b'v0.319') == source.count(b'v0.319') + 1)
rejects('wrong version', wrong_version)
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
check('all 220 source paragraphs are classified', len(mapping['source_paragraphs']) == 220 and all(p['reason'] and p['output_ids'] for p in mapping['source_paragraphs']))
result_text = output.decode()
main = re.findall(r'^## .+$', result_text, flags=re.M)
check('seven original main chapter headings preserved', main == mapping['required_main_headings'] and len(main) == 7)
check('all 15 original save chapter paragraphs preserved verbatim', all(next(p['text'] for p in mapping['source_paragraphs'] if p['id']==pid) in result_text for pid in mapping['preservation_checks']['chapter_6_source_ids']))
check('no historical release links, test commands or old current-version statement', not re.search(r'RELEASE_NOTES|verification/|run-tests|本指南对应 v0\.274', result_text))
check('known local Markdown links only', all(link == 'README.md' or link[1:] in mapping['preservation_checks']['unchanged_main_anchors'] for link in re.findall(r'\[[^\]]*\]\(([^)]+)\)', result_text)))
check('static layout-shift limitation preserved', '没有通知的静默位置变动只在下次地图输入重判，不保证静止预览立即更新。' in result_text)
check('old delayed click and fresh-press rule preserved', '旧的迟到点击' in result_text and '重新明确按下后可正常操作' in result_text)
check('visual/UI scope and opt-in boundary preserved', '实验性车辆与建筑外观预览仍默认关闭' in result_text and '不改变按钮用途、快捷键、焦点顺序' in result_text)
check('critical-health cue is not faction and does not promise arrival', '琥珀色表示低生命状态，不代表阵营' in result_text and '不保证命令已经执行成功或单位一定抵达' in result_text)
check('native/FPS limits and historical color qualification retained', '调用计数不等于帧率' in result_text and '这是先前位置修正的说明，本版另加低生命琥珀色' in result_text)
check('current scope identifies v0.318, not v0.317', '本指南对应 v0.318 玩家版。' in result_text and '本指南对应 v0.317' not in result_text)
check('production reasons, restoration, pause and unchanged rules retained', all(x in result_text for x in ['五种车型的生产卡', '恢复可用时清空原因', '暂停本身不禁止下单', '不改变价格、订单、生产、快捷键或存档规则', '原生浏览器排版、触屏与读屏效果尚未验收']))
check('v317 command arrangement, route order and VM limits retained', all(x in result_text for x in ['五种生产卡紧随其后', '按钮、快捷键和付款规则不变', '全部现有路线改为先于单位与生命条绘制', '路径几何、颜色与选择数量规则不变', '全源码VM／模拟DOM与Canvas调用记录', '实际窄屏体验已验收', '未发布远端']))
check('v318 static guidance and no gameplay changes retained', all(x in result_text for x in ['默认折叠的“双闸突进”任务简报', '不新增控件、自动下令或暂停', '不改变经济、伤害、寻路、输入与胜负规则']))
check('v318 repeat funding scope and explicit follow retained', all(x in result_text for x in ['循环补单保留：300', '保留额只限制新的循环补单', '手动购买、建造和自动维修仍会花钱', '关闭循环不取消已付订单', '开启全局车型会关闭全部本厂循环', '只选维修车', '攻击移动不是跟随']))
check('v318 reinforcement selection and evidence limits retained', all(x in result_text for x in ['先让增援进入据点，再撤旧守军', '再点“仅选坦克”也仍含旧守军', '不能延续失守前进度', '每5游戏秒最多一次决策批次', '不是失守翻盘证明', '展开说明不会自动暂停']))
check('v318 subsection label does not capture unrelated later opening guidance', '**双闸突进：补给、跟随与驻守操作**' in result_text and '### 双闸突进：补给、跟随与驻守操作' not in result_text)
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
