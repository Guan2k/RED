#!/usr/bin/env python3
"""Experimental release-document contract, intentionally outside the product."""
import re,json,hashlib,sys
from pathlib import Path

def inspect(root,overrides=None):
 root=Path(root);overrides=overrides or {};read=lambda n:overrides.get(n,(root/n).read_text())
 manifest=json.loads(read('current-verification.json'));source=read(manifest['source']);v=re.search(r'ORIGINAL RTS / v0\.(\d+)',source)[1];issues=[];checks=[]
 def require(ok,code,detail):
  checks.append({'code':code,'passed':bool(ok),'detail':detail})
  if not ok:issues.append(code)
 require(manifest['version']==v,'manifest-version','manifest.version equals displayed source version')
 require(manifest['sourceSha256']==hashlib.sha256(source.encode()).hexdigest(),'manifest-source','manifest source SHA equals actual bytes')
 require(manifest['runner']==f'verification/run-tests-v{v}.cjs','manifest-runner','current release runner version')
 runner=root/manifest['runner'];require(runner.is_file() and hashlib.sha256(runner.read_bytes()).hexdigest()==manifest['runnerSha256'],'manifest-runner-hash','declared runner exists with exact SHA')
 for name in ['README.md','CURRENT_PLAYER_GUIDE.md','CURRENT_VERIFICATION_ENTRY.md','QA_STATUS.md']:
  first=read(name).splitlines()[0];require(re.findall(r'v0\.(\d+)',first)==[v],'title-'+name,'first heading agrees exactly with source')
 readme=read('README.md');section=re.search(r'^## 当前测试与限制\n([\s\S]*?)(?=^## |\Z)',readme,re.M);require(section is not None,'current-readme-section','explicit current testing section');currentLines=[x for x in (section[1] if section else '').splitlines() if '本版' in x and re.search(r'node verification/run-tests-v\d+\.cjs',x)]
 require(len(currentLines)==1,'current-runner-line','one explicitly current underlying runner paragraph')
 if len(currentLines)==1:
  line=currentLines[0];commands=re.findall(r'node (verification/run-tests-v\d+\.cjs)',line);links=re.findall(r'\]\((verification/run-tests-v\d+\.cjs)\)',line)
  require(commands==[manifest['runner']],'current-runner-command',commands)
  require(links==[manifest['runner']],'current-runner-link',links)
 guide=read('CURRENT_PLAYER_GUIDE.md');current=True;claims=[]
 for line in guide.splitlines():
  if re.match(r'^## ',line):current=not bool(re.match(r'^## v\d',line))
  if current and '本指南对应' in line:claims+=re.findall(r'本指南对应\s*v0\.(\d+)',line)
 require(claims==[v],'current-guide-identity',claims)
 # Local file targets only: historical targets also must remain available, but their version is unconstrained.
 for name in ['README.md','CURRENT_PLAYER_GUIDE.md','CURRENT_VERIFICATION_ENTRY.md','QA_STATUS.md']:
  for target in re.findall(r'\[[^\]]+\]\(([^)]+)\)',read(name)):
   if re.match(r'\w+://',target):continue
   f=target.partition('#')[0]
   if f:require((root/f).is_file(),'link-'+name+'-'+target,'linked file exists; historical versions allowed')
 return {'sourceVersion':v,'passed':len(checks)-len(issues),'failed':len(issues),'issues':issues,'checks':checks,'scope':'Experimental explicit release-document contract; historical version sections excluded from current identity checks. Does not execute game commands.'}
if __name__=='__main__':
 result=inspect(sys.argv[1]);print(json.dumps(result,ensure_ascii=False,indent=2));sys.exit(1 if '--strict' in sys.argv[2:] and result['failed'] else 0)
