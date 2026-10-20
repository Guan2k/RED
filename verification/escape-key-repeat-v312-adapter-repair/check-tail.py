from pathlib import Path
import subprocess,json,concurrent.futures,time
w=Path(__file__).resolve().parents[1];v=w/'RED/verification';out=w/'adapter-repair'
names=['vehicle-reference-v312.cjs','vehicle-reference-negative-v312.cjs','factory-requirement-v312.cjs','factory-requirement-negative-v312.cjs','purchase-funding-v312.cjs','purchase-funding-negative-v312.cjs','construction-reasons-v312.cjs','construction-reasons-negative-v312.cjs','factory-space-v312.cjs','factory-space-negative-v312.cjs','selection-key-repeat-v312.cjs','selection-key-repeat-negative-v312.cjs','ore-density-v312.cjs','low-ore-label-v312.cjs','run-pilot-release-v312.cjs']
def run(n):
 p=subprocess.run(['node',str(v/n)],capture_output=True,text=True);(out/(n+'.stdout.json')).write_text(p.stdout);(out/(n+'.stderr')).write_text(p.stderr);d=json.loads(p.stdout) if p.returncode==0 else {};r={'script':n,'exitCode':p.returncode,'stderrBytes':len(p.stderr.encode()),'passed':d.get('passed'),'failed':d.get('failed')};print(json.dumps(r),flush=True);return r
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(run,names))
(out/'tail-results.json').write_text(json.dumps(results,indent=2)+'\n');assert all(x['exitCode']==0 and x['stderrBytes']==0 and x['failed']==0 for x in results)
