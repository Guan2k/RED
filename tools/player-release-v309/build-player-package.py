#!/usr/bin/env python3
"""Pinned, standard-library-only RED v0.309 player archive builder."""
import argparse
from html.parser import HTMLParser
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat
import tempfile
import unicodedata
import zipfile

HERE = Path(__file__).resolve().parent
DATA = HERE / 'player-package'
ROOT = 'RED-v0.309-player/'
FILES = ('CURRENT_PLAYER_GUIDE.md', 'QUICK_START.html', 'README.md', 'SHA256SUMS.txt', 'index.html')

def require(ok, message):
    if not ok:
        raise ValueError(message)

def digest(data):
    return hashlib.sha256(data).hexdigest()

def no_symlinks(path):
    p = Path(path)
    current = Path(p.anchor) if p.is_absolute() else Path.cwd()
    # Inspect original components before resolving '..'; do not erase a symlink.
    for part in p.parts[1:] if p.is_absolute() else p.parts:
        current = current / part
        require(not current.is_symlink(), 'symlink path refused: ' + str(current))

def read_fixed(path, expected):
    no_symlinks(path)
    require(path.is_file(), 'missing regular input: ' + str(path))
    data = path.read_bytes()
    require(digest(data) == expected, 'input hash mismatch: ' + path.name)
    return data

def slug(text):
    text = ''.join(c for c in text.lower() if not unicodedata.category(c).startswith(('P', 'S')))
    return re.sub(r'\s', '-', text)

def validate_documents(files):
    for name in ('README.md', 'CURRENT_PLAYER_GUIDE.md'):
        text = files[name].decode('utf-8')
        require('\r' not in text, 'documents require LF')
        require('v0.309' in text, 'current player version missing')
        require('v0.274' not in text, 'obsolete guide version')
        require(not re.search(r'https?://|<a\b|<img\b|^\s*\[[^\]]+\]:', text, re.I | re.M), 'unsupported external/reference link markup')
        require(not re.search(r'verification/|RELEASE_NOTES|node\s+verification/|run-tests', text), 'development links or test commands in player document')
        for match in re.finditer(r'\[[^\]]*\]\(([^)]+)\)', text):
            target, _, fragment = match.group(1).partition('#')
            target = target or name
            require(target in files, 'outside package link: ' + target)
            if fragment:
                headings = [slug(line.lstrip('#').strip()) for line in files[target].decode('utf-8').splitlines() if re.match(r'^#{1,6} ', line)]
                require(fragment in headings, 'missing anchor: ' + match.group(1))
    for marker in ('需要手动保存', '未保存进度', '导出所选存档', '不保存当前局', '已发起下载', '不等于下载完成', '覆盖所选槽', '载入会替换当前局', '文件位置', '移动HTML文件前先导出JSON备份'):
        require(marker in files['README.md'].decode(), 'required player safety reminder: ' + marker)

def static_self_contained(data):
    text = data.decode('utf-8')
    require(text.count('<script>') == 1 and text.count('<style>') == 1, 'inline script/style boundary')
    require(not re.search(r'<(?:script|link|img|iframe|audio|video|source)\b[^>]*(?:src|href)\s*=', text, re.I), 'external asset tag')
    require(not re.search(r'\burl\s*\(|https?://|\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bimport\s*\(', text.replace('xmlns="http://www.w3.org/2000/svg"', ''), re.I), 'external asset/network pattern')
    require('v0.309' in text, 'game version mismatch')

def validate_quick_start(data):
    text = data.decode('utf-8')
    require('v0.309' in text and '\r' not in text, 'quick start version/LF')
    require(not re.search(r'https?://|\burl\s*\(|@import|javascript:|data:', text, re.I), 'quick start external resource')
    class Reader(HTMLParser):
        def __init__(self):
            super().__init__(convert_charrefs=True)
            self.links=[];self.ids=[];self.stack=[]
        def handle_starttag(self, tag, attrs):
            require(tag in {'html','head','meta','title','style','body','main','header','div','h1','h2','h3','p','br','nav','a','section','ol','li','strong','details','summary','footer'}, 'quick start forbidden element')
            values=dict(attrs)
            require(not any(k.startswith('on') or k in {'src','srcset','action','formaction','style'} for k,v in attrs), 'quick start active/resource attribute')
            if tag=='meta':require('http-equiv' not in values, 'quick start meta redirect')
            if tag=='a':
                require(values.get('href') in {'index.html','CURRENT_PLAYER_GUIDE.md'} and 'target' not in values, 'quick start outside link')
                self.links.append(values['href'])
            elif 'href' in values:raise ValueError('quick start unexpected href')
            if tag=='details':require('open' not in values, 'quick start advanced must be collapsed')
            if 'id' in values:self.ids.append(values['id'])
            if tag not in {'meta','br'}:self.stack.append(tag)
        def handle_endtag(self, tag):
            require(bool(self.stack) and self.stack.pop()==tag, 'quick start unbalanced markup')
    parser=Reader();parser.feed(text);parser.close()
    require(not parser.stack and len(parser.ids)==len(set(parser.ids)), 'quick start markup/duplicate id')
    require(sorted(parser.links)==['CURRENT_PLAYER_GUIDE.md','index.html'], 'quick start two local entry links')
    require('打开游戏会离开此速查页' in text, 'quick start navigation reminder')

def validate_payload(files):
    require(set(files) == set(FILES), 'exact five-file whitelist required')
    static_self_contained(files['index.html'])
    validate_documents(files)
    validate_quick_start(files['QUICK_START.html'])
    expected = ''.join(digest(files[n]) + '  ' + n + '\n' for n in sorted(files) if n != 'SHA256SUMS.txt').encode()
    require(files['SHA256SUMS.txt'] == expected, 'payload checksum manifest mismatch')

def validate_archive(path, expected):
    with zipfile.ZipFile(path) as z:
        infos = z.infolist()
        require([i.filename for i in infos] == [ROOT + n for n in FILES], 'archive whitelist/order/duplicates')
        require(z.comment == b'', 'archive comment')
        payload = {}
        for i in infos:
            p = PurePosixPath(i.filename)
            require(not p.is_absolute() and '..' not in p.parts and '\\' not in i.filename, 'unsafe archive path')
            require(i.date_time == (1980,1,1,0,0,0) and i.compress_type == zipfile.ZIP_STORED, 'archive timestamp/compression')
            require(i.create_system == 3 and i.external_attr >> 16 == stat.S_IFREG | 0o644, 'archive file permissions')
            require(not i.extra and not i.comment, 'archive extra metadata')
            name = i.filename[len(ROOT):]
            payload[name] = z.read(i)
            require(payload[name] == expected[name], 'archive payload mismatch: ' + name)
        validate_payload(payload)

def prepare(source):
    no_symlinks(source)
    require(source.is_dir(), 'source must be a directory')
    no_symlinks(DATA / 'manifest.json')
    config = json.loads((DATA / 'manifest.json').read_text())
    inputs = {name: read_fixed(source / name, value) for name, value in config['inputs'].items()}
    templates = {name: read_fixed(DATA / name, value) for name, value in config['templates'].items()}
    # The converter is fixed by manifest before execution, never loaded from source.
    converter = DATA / 'derive-guide.py'
    namespace = {'__file__': str(converter), '__name__': 'red_player_guide'}
    exec(compile(templates['derive-guide.py'], str(converter), 'exec'), namespace)
    guide = namespace['derive'](inputs['CURRENT_PLAYER_GUIDE.md'], templates['guide-map.json'])
    if isinstance(guide, str):
        guide = guide.encode('utf-8')
    require(digest(guide) == config['derivedGuideSha256'], 'derived guide hash mismatch')
    files = {'QUICK_START.html': inputs['QUICK_START.html'], 'index.html': inputs['index.html'], 'README.md': templates['README.player.md'], 'CURRENT_PLAYER_GUIDE.md': guide}
    files['SHA256SUMS.txt'] = ''.join(digest(files[n]) + '  ' + n + '\n' for n in sorted(files)).encode()
    validate_payload(files)
    return files

def build(source, output):
    source, output = Path(source), Path(output)
    no_symlinks(output)
    require(output.parent.is_dir(), 'output parent must exist')
    require(not output.exists(), 'existing output refused')
    require(not output.resolve().is_relative_to(source.resolve()), 'output must be outside source package')
    files = prepare(source)
    fd, temp = tempfile.mkstemp(prefix='.red-player-', suffix='.zip', dir=output.parent)
    os.close(fd)
    try:
        with zipfile.ZipFile(temp, 'w', compression=zipfile.ZIP_STORED) as z:
            for name in FILES:
                info = zipfile.ZipInfo(ROOT + name, date_time=(1980,1,1,0,0,0))
                info.create_system = 3
                info.external_attr = (stat.S_IFREG | 0o644) << 16
                info.compress_type = zipfile.ZIP_STORED
                info.extra = info.comment = b''
                z.writestr(info, files[name])
        validate_archive(temp, files)
        # Atomic no-clobber installation; a raced-in destination is never replaced.
        os.link(temp, output)
    finally:
        os.unlink(temp)
    return {'archive': output.name, 'bytes': output.stat().st_size, 'sha256': digest(output.read_bytes()), 'files': {n: digest(files[n]) for n in FILES}, 'validation': 'static packaging only; no game/browser/storage execution'}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(build(args.source, args.output), ensure_ascii=False, indent=2))
