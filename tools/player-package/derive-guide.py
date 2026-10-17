#!/usr/bin/env python3
"""Derive the reviewed RED v0.289 player guide from its exact full baseline.

Standard-library only. This script never executes the game or reads save data.
API: derive(source_bytes: bytes, mapping_bytes: bytes | None = None) -> bytes.
When mapping_bytes is supplied, the function performs no file reads at all.
The CLI refuses to overwrite an existing output; --check only compares bytes.
"""
from pathlib import Path
import argparse
import hashlib
import json
import re

SOURCE_SHA256 = '01e0e4a19f10778c572f824723aee05da8523f61fd9afbcc442d0fb683647b3e'
MAPPING_SHA256 = 'db6fcfe5afd1aad5453118623995160ed4398adfdf141038cac96133d8b7ca57'
OUTPUT_SHA256 = '1c7fd155e6988c21b9c62f1bdc18c21c0293c40e2ef8ba7e87857806fc3c6f1f'
VERSION = '0.289'
MAPPING_FILENAME = 'guide-map.json'


def _hash(data):
    return hashlib.sha256(data).hexdigest()


def _require(condition, message):
    if not condition:
        raise ValueError(message)


def _paragraphs(text):
    result = []
    for index, match in enumerate(re.finditer(r'[^\n]+(?:\n(?!\n)[^\n]+)*', text), 1):
        value = match.group()
        first = text[:match.start()].count('\n') + 1
        result.append({'id': f'p{index:03d}', 'text': value,
                       'line_start': first, 'line_end': first + value.count('\n'),
                       'sha256': _hash(value.encode('utf-8'))})
    return result


def _heading_anchor(text):
    # The seven fixed Chinese chapter headings use this conventional Markdown ID.
    return re.sub(r'[^\w\- ]', '', text.casefold()).replace(' ', '-')


def derive(source_bytes, mapping_bytes=None):
    """Return exact reviewed UTF-8/LF guide bytes, rejecting all unknown inputs.

    Callers may pass already-read mapping bytes to avoid a second file read.
    Both inputs are checked and consumed from these same immutable byte values.
    """
    _require(type(source_bytes) is bytes, 'source_bytes must be immutable bytes')
    _require(_hash(source_bytes) == SOURCE_SHA256,
             'Unknown guide baseline SHA-256; additions, removals or edits require a new reviewed mapping')
    if mapping_bytes is None:
        path = Path(__file__).with_name(MAPPING_FILENAME)
        _require(not path.is_symlink(), 'Refusing a symlink mapping')
        mapping_bytes = path.read_bytes()
    _require(type(mapping_bytes) is bytes, 'mapping_bytes must be immutable bytes')
    _require(_hash(mapping_bytes) == MAPPING_SHA256, 'Unreviewed or modified guide mapping SHA-256')
    mapping = json.loads(mapping_bytes.decode('utf-8'))
    _require(mapping['schema_version'] == 1 and mapping['version'] == VERSION, 'Mapping schema/version mismatch')
    _require(mapping['expected_source_sha256'] == SOURCE_SHA256, 'Mapping source identity mismatch')
    _require(mapping['expected_output_sha256'] == OUTPUT_SHA256, 'Mapping output identity mismatch')
    _require(len(source_bytes) == mapping['expected_source_bytes'], 'Source length mismatch')
    source_text = source_bytes.decode('utf-8')
    _require('\r' not in source_text and not source_text.startswith('\ufeff'), 'Source must use plain UTF-8/LF')
    paragraphs = _paragraphs(source_text)
    records = mapping['source_paragraphs']
    _require(len(paragraphs) == len(records) == mapping['expected_source_paragraphs'], 'Incomplete source paragraph coverage')
    for actual, record in zip(paragraphs, records):
        for field in ('id', 'text', 'line_start', 'line_end', 'sha256'):
            _require(actual[field] == record[field], f"Source paragraph {actual['id']} {field} mismatch")
        _require(record['disposition'] and record['reason'] and record['output_ids'], f"Unclassified source paragraph {record['id']}")
    by_id = {p['id']: p for p in paragraphs}
    outputs = mapping['output_paragraphs']
    output_by_id = {o['id']: o for o in outputs}
    _require(len(output_by_id) == len(outputs), 'Duplicate output paragraph ID')
    values = []
    chapter = '前言与目录'
    subheading = ''
    line = 1
    for output in outputs:
        source_id = output['source_id']
        if source_id is not None:
            _require(source_id in by_id, f'Unknown source reference {source_id}')
        for origin_id in output.get('origin_ids', []):
            _require(origin_id in by_id, f'Unknown explanatory source reference {origin_id}')
        value = output['text'] if output['text'] is not None else by_id[source_id]['text']
        _require(type(value) is str and value and '\r' not in value and '\n\n' not in value,
                 f"Invalid output paragraph {output['id']}")
        _require(_hash(value.encode('utf-8')) == output['sha256'], f"Output paragraph hash mismatch: {output['id']}")
        _require(output['line_start'] == line and output['line_end'] == line + value.count('\n'),
                 f"Output line mapping mismatch: {output['id']}")
        if value.startswith('## '): chapter, subheading = value, ''
        elif value.startswith('### '): subheading = value
        _require(output['chapter'] == chapter and output['subheading'] == subheading,
                 f"Output destination mismatch: {output['id']}")
        values.append(value)
        line += value.count('\n') + 2
    for record in records:
        _require(all(ref in output_by_id for ref in record['output_ids']), f"Broken paragraph mapping: {record['id']}")
        for output_id, destination in zip(record['output_ids'], record['destinations']):
            o = output_by_id[output_id]
            expected = o['chapter'] + (' / ' + o['subheading'] if o['subheading'] else '')
            _require(destination == expected, f"Wrong preservation destination: {record['id']}")
    result_text = '\n\n'.join(values) + '\n'
    result_bytes = result_text.encode('utf-8')
    _require(_hash(result_bytes) == OUTPUT_SHA256, 'Output differs from the reviewed player guide')
    _require(len(result_bytes) == mapping['expected_output_bytes'], 'Output length mismatch')
    headings = re.findall(r'^## .+$', result_text, flags=re.M)
    _require(headings == mapping['required_main_headings'], 'The seven original main chapters must remain unchanged')
    anchors = {_heading_anchor(h[3:]) for h in headings}
    expected_anchors = set(mapping['preservation_checks']['unchanged_main_anchors'])
    _require(anchors == expected_anchors, 'Main chapter anchor mismatch')
    for href in re.findall(r'\[[^\]]*\]\(([^)\s]+)\)', result_text):
        _require(href == 'README.md' or href.startswith('#') and href[1:] in anchors,
                 f'Package-external or unknown Markdown link: {href}')
    _require(not re.search(r'https?://|RELEASE_NOTES|verification/|run-tests|v0\.274|^## v0\.', result_text, flags=re.M),
             'Historical version or package-external material in player guide')
    for source_id in mapping['preservation_checks']['chapter_6_source_ids']:
        output = output_by_id['o_' + source_id]
        _require(output['source_id'] == source_id and output['text'] is None,
                 f'All original save-risk paragraphs must be verbatim: {source_id}')
        _require(by_id[source_id]['text'] in result_text, f'Missing save-risk paragraph: {source_id}')
    for source_id in mapping['preservation_checks']['appended_coordinate_and_select_rules']:
        output = output_by_id['o_' + source_id]
        _require(output['chapter'] == '## 3. 选择、编队与地图命令', f'Appendix rule not moved to chapter 3: {source_id}')
    _require('没有通知的静默位置变动只在下次地图输入重判' in result_text, 'Missing silent-layout-shift limitation')
    _require('旧的迟到点击' in result_text and '重新明确按下后可正常操作' in result_text,
             'Missing canceled-input/late-click rule')
    return result_bytes


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True, help='Exact full baseline CURRENT_PLAYER_GUIDE.md')
    parser.add_argument('--mapping', type=Path, help='Reviewed guide-map.json; defaults beside this script')
    parser.add_argument('--output', type=Path, required=True, help='Derived player guide path')
    parser.add_argument('--check', action='store_true', help='Verify an existing output without writing')
    args = parser.parse_args()
    try:
        _require(not args.source.is_symlink(), 'Refusing a symlink source')
        mapping_path = args.mapping or Path(__file__).with_name(MAPPING_FILENAME)
        _require(not mapping_path.is_symlink(), 'Refusing a symlink mapping')
        source_bytes = args.source.read_bytes()
        mapping_bytes = mapping_path.read_bytes()
        result = derive(source_bytes, mapping_bytes)
        _require(args.source.resolve() != args.output.resolve(), 'Output must not replace the full source guide')
        _require(not args.output.is_symlink(), 'Refusing a symlink output')
        if args.check:
            _require(args.output.read_bytes() == result, 'Existing player guide differs from reviewed output')
        else:
            with args.output.open('xb') as handle:
                handle.write(result)
        print(json.dumps({'version': VERSION, 'source_sha256': _hash(source_bytes),
                          'mapping_sha256': _hash(mapping_bytes), 'output_sha256': _hash(result),
                          'output_bytes': len(result), 'mode': 'check' if args.check else 'create'},
                         sort_keys=True))
    except (ValueError, OSError, UnicodeError, json.JSONDecodeError) as exc:
        parser.exit(1, f'Guide derivation refused: {exc}\n')


if __name__ == '__main__':
    main()
