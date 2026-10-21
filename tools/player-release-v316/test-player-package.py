#!/usr/bin/env python3
"""Reproducibility, extraction, and rejected-input tests; never runs the game."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import stat
import subprocess
import sys
import tempfile
import zipfile

HERE=Path(__file__).resolve().parent
ns={'__file__':str(HERE/'build-player-package.py'),'__name__':'player_builder_test'}
exec(compile((HERE/'build-player-package.py').read_bytes(),str(HERE/'build-player-package.py'),'exec'),ns)
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source',type=Path,required=True)
source=parser.parse_args().source.resolve()
sha=lambda b:hashlib.sha256(b).hexdigest()
before={str(p.relative_to(source)):sha(p.read_bytes()) for p in source.rglob('*') if p.is_file()}
files=ns['prepare'](source)
results=[]
def rejected(name, fn, message):
    try:fn()
    except ValueError as e:
        assert message in str(e),(name,str(e),message)
        results.append({'name':name,'rejectedBy':message})
    else:raise AssertionError('accepted invalid input: '+name)
with tempfile.TemporaryDirectory(prefix='red-player-build-a-') as a, tempfile.TemporaryDirectory(prefix='red-player-build-b-') as b:
    a,b=Path(a),Path(b)
    sources=[]
    for parent in (a,b):
        src=parent/'source';src.mkdir()
        for name in ('index.html','README.md','CURRENT_PLAYER_GUIDE.md','QUICK_START.html'):shutil.copyfile(source/name,src/name)
        sources.append(src)
    first=ns['build'](sources[0],a/'first.zip')
    second=ns['build'](sources[1],b/'second.zip')
    assert (a/'first.zip').read_bytes()==(b/'second.zip').read_bytes(),'path-independent archive bytes'
    with zipfile.ZipFile(a/'first.zip') as z:
        z.extractall(a/'extracted')
    extracted=a/'extracted'/ns['ROOT']
    assert sorted(p.name for p in extracted.iterdir())==sorted(ns['FILES'])
    for n,data in files.items():assert (extracted/n).read_bytes()==data
    rejected('existing output',lambda:ns['build'](sources[0],a/'first.zip'),'existing output refused')
    rejected('output in source',lambda:ns['build'](sources[0],sources[0]/'new.zip'),'output must be outside')
    (sources[0]/'index.html').write_bytes(files['index.html']+b'\n')
    rejected('wrong game bytes',lambda:ns['build'](sources[0],a/'wrong.zip'),'input hash mismatch: index.html')
    assert not (a/'wrong.zip').exists()
    shutil.copyfile(source/'index.html',sources[0]/'index.html')
    (sources[0]/'CURRENT_PLAYER_GUIDE.md').write_text('missing section\n')
    rejected('missing source guide paragraphs',lambda:ns['prepare'](sources[0]),'input hash mismatch: CURRENT_PLAYER_GUIDE.md')
    shutil.copyfile(source/'CURRENT_PLAYER_GUIDE.md',sources[0]/'CURRENT_PLAYER_GUIDE.md')
    (sources[0]/'index.html').unlink();(sources[0]/'index.html').symlink_to(source/'index.html')
    rejected('symlink input',lambda:ns['prepare'](sources[0]),'symlink path refused')
    (a/'linked-output').symlink_to(b,target_is_directory=True)
    rejected('symlink output parent',lambda:ns['build'](sources[1],a/'linked-output'/'new.zip'),'symlink path refused')
    rejected('symlink before parent traversal',lambda:ns['build'](sources[1],a/'linked-output'/'..'/'hidden.zip'),'symlink path refused')
    for name,change,message in [
        ('outside markdown link',lambda d:d.update({'README.md':d['README.md']+b'\n[bad](../outside.md)\n'}),'outside package link'),
        ('missing save warning',lambda d:d.update({'README.md':d['README.md'].replace('需要手动保存'.encode(),b'')}),'required player safety reminder: 需要手动保存'),
        ('extra payload file',lambda d:d.update({'extra.txt':b'extra'}),'exact five-file whitelist'),
        ('source external SVG namespace',lambda d:d.update({'index.html':d['index.html']+b'<svg xmlns="https://invalid.example/svg"></svg>'}),'external asset/network pattern'),
        ('source external asset',lambda d:d.update({'index.html':d['index.html']+b'<img src="remote.png">'}),'external asset tag'),
        ('broken guide anchor',lambda d:d.update({'README.md':d['README.md']+b'\n[bad](CURRENT_PLAYER_GUIDE.md#missing)\n'}),'missing anchor'),
        ('wrong checksum manifest',lambda d:d.update({'SHA256SUMS.txt':b'wrong'}),'payload checksum manifest mismatch')]:
        d=dict(files);change(d);rejected(name,lambda:ns['validate_payload'](d),message)
    for name, suffix, message in [
        ('quick start script', '<script>alert(1)</script>', 'quick start forbidden element'),
        ('quick start external URL', '<a href="https://example.invalid">bad</a>', 'quick start external resource'),
        ('quick start traversal', '<a href="../index.html">bad</a>', 'quick start outside link'),
        ('quick start event handler', '<p onclick="x()">bad</p>', 'quick start active/resource attribute'),
        ('quick start remote css', '<style>@import "x";</style>', 'quick start external resource'),
        ('quick start redirect', '<meta http-equiv="refresh" content="0;url=index.html">', 'quick start meta redirect')]:
        rejected(name,lambda suffix=suffix:ns['validate_quick_start'](files['QUICK_START.html']+suffix.encode()),message)
    wrong_quick_version = files['QUICK_START.html'].replace(b'V0.316', b'V0.317', 1)
    assert wrong_quick_version != files['QUICK_START.html']
    rejected('quick start stale visible version', lambda:ns['validate_quick_start'](wrong_quick_version), 'quick start version/LF')
    (sources[1]/'QUICK_START.html').write_bytes(b'changed')
    rejected('changed quick start input',lambda:ns['prepare'](sources[1]),'input hash mismatch: QUICK_START.html')
    shutil.copyfile(source/'QUICK_START.html',sources[1]/'QUICK_START.html')
    # Construct archive-level invalid metadata/path fixtures, then exercise actual ZIP parser.
    for name,entry,metadata in [('path traversal','../evil',False),('absolute path','/evil',False),('duplicate entry',ns['ROOT']+'index.html',False),('symlink entry',None,True)]:
        p=a/(name.replace(' ','-')+'.zip')
        with zipfile.ZipFile(p,'w') as z:
            for n in ns['FILES']:
                i=zipfile.ZipInfo(ns['ROOT']+n,(1980,1,1,0,0,0));i.create_system=3;i.external_attr=(stat.S_IFREG|0o644)<<16
                if metadata and n=='index.html':i.external_attr=(stat.S_IFLNK|0o777)<<16
                z.writestr(i,files[n])
            if entry:z.writestr(entry,b'bad')
        rejected(name,lambda:ns['validate_archive'](p,files),'archive file permissions' if metadata else 'archive whitelist/order/duplicates')
    template_copy=a/'templates';shutil.copytree(ns['DATA'],template_copy)
    original_data=ns['DATA'];ns['DATA']=template_copy
    try:
        (template_copy/'README.player.md').write_bytes(b'changed template')
        rejected('changed player template',lambda:ns['prepare'](sources[1]),'input hash mismatch: README.player.md')
    finally:ns['DATA']=original_data
    original_validate=ns['validate_archive']
    def fail_validation(*args):raise ValueError('injected archive validation failure')
    ns['validate_archive']=fail_validation
    try:rejected('validation prevents publication',lambda:ns['build'](sources[1],b/'failed.zip'),'injected archive validation failure')
    finally:ns['validate_archive']=original_validate
    assert not (b/'failed.zip').exists() and not list(b.glob('.red-player-*'))
    original_link=os.link
    def race_link(src,dst):
        Path(dst).write_bytes(b'existing concurrent file')
        return original_link(src,dst)
    os.link=race_link
    try:
        try:ns['build'](sources[1],b/'raced.zip')
        except FileExistsError:results.append({'name':'destination race','rejectedBy':'FileExistsError; concurrent bytes preserved'})
        else:raise AssertionError('race overwrote output')
    finally:os.link=original_link
    assert (b/'raced.zip').read_bytes()==b'existing concurrent file' and not list(b.glob('.red-player-*'))
    archive_hash=first['sha256'];archive_bytes=first['bytes']
after={str(p.relative_to(source)):sha(p.read_bytes()) for p in source.rglob('*') if p.is_file()}
assert before==after,'complete source package untouched'
print(json.dumps({'status':'passed','archiveSha256':archive_hash,'archiveBytes':archive_bytes,'reproducibility':'two distinct temporary source/output paths, byte-identical ZIP_STORED','exactExtractedFiles':5,'protectedSourceFiles':len(before),'negativeCases':results,'gameOrBrowserOrStorageRun':False},ensure_ascii=False,indent=2))
