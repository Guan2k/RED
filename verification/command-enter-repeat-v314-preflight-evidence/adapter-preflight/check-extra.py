from pathlib import Path
import subprocess,json,concurrent.futures,time
w=Path(__file__).resolve().parents[1];v=w/'RED/verification';out=w/'adapter-preflight'
names=['progress-rails-v314.cjs', 'beginner-guide-v314.cjs', 'hold-guidance-v314.cjs', 'building-team-cue-v314.cjs', 'render-preview-v314.cjs', 'command-allocation-feedback-v314.cjs']
def run(n):
 p=subprocess.run(['node',str(v/n)],capture_output=True,text=True);(out/(n+'.stdout.json')).write_text(p.stdout);(out/(n+'.stderr')).write_text(p.stderr);d=json.loads(p.stdout) if p.returncode==0 else {};r={'script':n,'exitCode':p.returncode,'stderrBytes':len(p.stderr.encode()),'passed':d.get('passed'),'failed':d.get('failed',0 if d.get('passed') is True else None)};print(json.dumps(r),flush=True);return r
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(run,names))
(out/'extra-results.json').write_text(json.dumps(results,indent=2)+'\n');assert all(x['exitCode']==0 and x['stderrBytes']==0 and x['failed']==0 for x in results)
