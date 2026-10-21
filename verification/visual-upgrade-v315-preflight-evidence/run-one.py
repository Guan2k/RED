import sys,subprocess,json,hashlib,time,shutil
from pathlib import Path
out=Path(__file__).resolve().parent;r=out.parent/'v315-recovery-integration/RED';name=sys.argv[1];assert '/' not in name and name.endswith('.cjs')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();before=sha(r/'index.html');suite_before=sha(r/'verification'/name);start=time.monotonic()
# Every superseded attempt is retained rather than overwritten.
if (out/(name+'.meta.json')).exists():
 history=out/'prior-attempts';history.mkdir(exist_ok=True);seq=1
 while (history/(name+f'.attempt-{seq}.meta.json')).exists():seq+=1
 for suffix in ['meta.json','stdout','stderr']:
  p=out/(name+'.'+suffix)
  if p.exists():shutil.copy2(p,history/(name+f'.attempt-{seq}.'+suffix))
p=subprocess.run(['node',str(r/'verification'/name),*sys.argv[2:]],cwd=r,capture_output=True,text=True)
(out/(name+'.stdout')).write_text(p.stdout);(out/(name+'.stderr')).write_text(p.stderr)
try:
 report=json.loads(p.stdout);result={'passed':report.get('passed'),'failed':report.get('failed'),'failures':[x for x in report.get('results',report.get('tests',[])) if x.get('passed',x.get('pass',True))==False]}
except Exception:result={'parseError':True,'tail':p.stdout[-2000:]}
meta={'command':['node','verification/'+name,*sys.argv[2:]],'exitCode':p.returncode,'elapsedSeconds':round(time.monotonic()-start,2),'sourceSha256':before,'sourceUnchanged':before==sha(r/'index.html'),'stderrBytes':len(p.stderr),'suiteSha256':suite_before,'suiteUnchanged':suite_before==sha(r/'verification'/name),**result}
(out/(name+'.meta.json')).write_text(json.dumps(meta,indent=2)+'\n');print(json.dumps(meta,ensure_ascii=False));sys.exit(0 if p.returncode==0 and not p.stderr else 1)
