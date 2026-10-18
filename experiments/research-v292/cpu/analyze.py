from pathlib import Path
import json,hashlib,collections,statistics
root=Path(__file__).parent
runs=[]
for n in range(1,4):
 p=root/f'run-{n}'; profile=json.loads((p/'main.cpuprofile').read_text()); trace=json.loads((p/'seed-29301.json').read_text()); runtime=json.loads((p/'runtime.json').read_text())
 nodes={x['id']:x for x in profile['nodes']}; parents={c:x['id'] for x in profile['nodes'] for c in x.get('children',[])}
 def label(i):
  c=nodes[i]['callFrame']; return (c.get('functionName') or '(anonymous)',c.get('url',''),c.get('lineNumber',-1)+1)
 own=collections.Counter(); inclusive=collections.Counter(); counts=collections.Counter()
 for sample,us in zip(profile['samples'],profile['timeDeltas']):
  own[label(sample)]+=us;counts[label(sample)]+=1; seen=set()
  while sample in nodes:
   key=label(sample)
   if key not in seen: inclusive[key]+=us;seen.add(key)
   sample=parents.get(sample)
 def rows(counter): return [{'function':k[0],'url':k[1],'line':k[2],'sampledMs':round(v/1000,3),'sharePercent':round(v/sum(profile['timeDeltas'])*100,2),'selfSamples':counts[k]} for k,v in counter.most_common()]
 stable={k:trace[k] for k in ['seed','sha256','config','result','time','firstCapture','contestSeconds','progress','stats','actions','events','trace']}
 result={'run':n,'runtime':runtime,'sampleCount':len(profile['samples']),'sampledMs':round(sum(profile['timeDeltas'])/1000,3),'sourceSha256':trace['sha256'],'traceSha256':hashlib.sha256(json.dumps(stable,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'gameSeconds':trace['time'],'result':trace['result'],'sampledTraceEntityCount':{'min':min(len(t['entities']) for t in trace['trace']),'max':max(len(t['entities']) for t in trace['trace'])},'topSelf':rows(own)[:30],'gameInclusive':[r for r in rows(inclusive) if r['url'].endswith('/RED/index.html')][:30]}
 runs.append(result)
(root/'summary.json').write_text(json.dumps({'runs':runs,'identicalTraces':len({r['traceSha256'] for r in runs})==1},indent=2)+'\n')
for r in runs:
 print('RUN',r['run'],'runtime',r['runtime'],'seconds',r['gameSeconds'],'entities',r['sampledTraceEntityCount'])
 print('SELF',[(x['function'],x['sharePercent']) for x in r['topSelf'][:10]])
 print('GAME INCLUSIVE',[(x['function'],x['sharePercent']) for x in r['gameInclusive'][:12]])
print('IDENTICAL TRACES',len({r['traceSha256'] for r in runs})==1)
