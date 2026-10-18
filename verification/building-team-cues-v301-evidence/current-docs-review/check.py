#!/usr/bin/env python3
"""Read-only bounded documentation identity/link audit; no game/test execution."""
from pathlib import Path
import hashlib,json,re,sys,unicodedata
root=Path(sys.argv[1] if len(sys.argv)>1 else Path(__file__).resolve().parent.parent/'v301-building-team-cues/RED').resolve()
names=['README.md','CURRENT_VERIFICATION_ENTRY.md','QA_STATUS.md','current-verification.json','CURRENT_PLAYER_GUIDE.md']
texts={n:(root/n).read_text() for n in names}
sha=lambda s:hashlib.sha256(s.encode()).hexdigest()
version=re.search(r'ORIGINAL RTS / v0\.(\d+)',(root/'index.html').read_text())[1]
manifest=json.loads(texts['current-verification.json'])
def slug(s):
 s=re.sub(r'[`*_]','',s.strip()).lower();return ''.join(c for c in s if not unicodedata.category(c).startswith('P') or c in '-_').replace(' ','-')
links=[];identities=[];scoped=[]
for name,text in texts.items():
 if not name.endswith('.md'):continue
 section='';historical=False
 for num,line in enumerate(text.splitlines(),1):
  if re.match(r'^#{1,6} ',line):
   section=line;historical=bool(re.match(r'^#{2,6}\s+(?:v0?\.?\d+|.*历史)',line))
  if re.search('当前|本版|本轮|本指南对应',line) and not historical and not re.match(r'^v0\.\d+：',line):scoped.append({'file':name,'line':num,'section':section,'text':line})
  if '本指南对应' in line:identities.append({'file':name,'line':num,'text':line,'currentSection':not historical,'matchesSource':f'v0.{version}' in line})
  for target in re.findall(r'\[[^\]]+\]\(([^)]+)\)',line):
   if re.match(r'\w+://',target):continue
   p,sep,anchor=target.partition('#');f=(root/name).parent/p if p else root/name
   row={'file':name,'line':num,'target':target,'fileExists':f.is_file(),'section':section,'historicalSection':historical}
   if sep and f.is_file() and f.suffix=='.md':row['headingAnchorMatches']=anchor in [slug(x) for x in re.findall(r'^#{1,6}\s+(.+)$',f.read_text(),re.M)]
   links.append(row)
commands=[]
for match in re.finditer(r'node\s+([\w./-]+\.cjs)',texts['README.md']):commands.append({'command':match[0],'exists':(root/match[1]).is_file()})
print(json.dumps({'sourceVersion':version,'root':str(root),'hashes':{n:sha(t) for n,t in texts.items()},'manifestVersion':manifest['version'],'manifestMatchesCurrentSource':manifest['sourceSha256']==hashlib.sha256((root/manifest['source']).read_bytes()).hexdigest(),'manifestRunnerExists':(root/manifest['runner']).is_file(),'manifestRunnerHashMatches':(root/manifest['runner']).is_file() and manifest['runnerSha256']==hashlib.sha256((root/manifest['runner']).read_bytes()).hexdigest(),'readmeKnownOldCurrentRunnerRemoved':'本版实际聚合命令是 `node verification/run-tests-v297.cjs`' not in texts['README.md'] and '本轮v296' not in texts['README.md'],'explicitGuideIdentityClaims':identities,'localLinks':links,'readmeNodeCommands':commands,'currentMarkedLines':scoped,'limits':'Semantic historical/current scope needs human review; mutable candidate manifest/links may be intentionally pending. No game execution or package writes.'},ensure_ascii=False,indent=2))
