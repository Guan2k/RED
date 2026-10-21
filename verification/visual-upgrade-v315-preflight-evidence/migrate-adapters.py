from pathlib import Path
import hashlib,json,difflib,sys
w=Path(__file__).resolve().parent;r=w.parent/'v315-recovery-integration/RED';v=r/'verification';old=w.parent/'v314-recovery/repo/verification';sha=lambda b:hashlib.sha256(b).hexdigest();b=(old.parent/'index.html').read_text();a=(r/'index.html').read_text();oh=sha(b.encode());prepare='--prepare' in sys.argv;nh='__V315_CANDIDATE_SHA256__' if prepare else sha(a.encode())
assert oh=='d0fa1baa9faed8be2a05f050b2289ea5a419654b4d95f48cef0ff2742e52091d'
if not prepare:assert a!=b and 'v0.315' in a,'final integrated v315 required'
for p in old.rglob('*'):
 if p.is_file():assert (v/p.relative_to(old)).read_bytes()==p.read_bytes(),'historical bytes changed '+str(p.relative_to(old))
previousIdentity=w/'migration-identities.json'
if previousIdentity.exists():
 previousHash=json.loads(previousIdentity.read_text())['sourceSha256']
 for p in v.glob('*v315*.cjs'):
  s=p.read_text()
  if previousHash in s:p.write_text(s.replace(previousHash,nh))
raw=[];bl=b.splitlines(True);al=a.splitlines(True)
if not prepare:
 for tag,i,j,k,l in difflib.SequenceMatcher(None,bl,al,autojunk=False).get_opcodes():
  if tag=='equal':continue
  before=''.join(bl[i:j]);after=''.join(al[k:l]);pre=0
  while pre<min(len(before),len(after)) and before[pre]==after[pre]:pre+=1
  suf=0
  while suf<min(len(before),len(after))-pre and before[-suf-1]==after[-suf-1]:suf+=1
  bi=sum(map(len,bl[:i]));ai=sum(map(len,al[:k]));raw.append([bi+pre,bi+len(before)-suf,ai+pre,ai+len(after)-suf])
def expand(c):
 pad=24
 while True:
  i,j,k,l=c;front=min(pad,i,k);back=min(pad,len(b)-j,len(a)-l);x=[i-front,j+back,k-front,l+back]
  if b.count(b[x[0]:x[1]])==a.count(a[x[2]:x[3]])==1:return x
  pad*=2;assert pad<1000000
while True:
 expanded=[expand(c) for c in raw];merged=False
 for i in range(len(raw)-1):
  if expanded[i][1]>=expanded[i+1][0] or expanded[i][3]>=expanded[i+1][2]:raw[i:i+2]=[[raw[i][0],raw[i+1][1],raw[i][2],raw[i+1][3]]];merged=True;break
 if not merged:break
changes=[{'before':b[i:j],'after':a[k:l]} for i,j,k,l in expanded]
if not prepare:
 x=a
 for c in reversed(changes):assert x.count(c['after'])==1;x=x.replace(c['after'],c['before'])
 assert x==b
(v/'changes-v315.json').write_text(json.dumps(changes,ensure_ascii=False,indent=2)+'\n')
(v/'v314-host-manifest.json').write_text(json.dumps({'sourceSha256':oh,'files':{str(p.relative_to(old)):sha(p.read_bytes()) for p in sorted(old.rglob('*')) if p.is_file()}},indent=2)+'\n')
skip={'run-tests-v314.cjs','source-delta-v314.cjs','source-delta-history-v314.cjs','source-delta-v314-negative-control.cjs','source-delta-to-v302-v314.cjs','inherit-dom-v314.cjs','health-edge-v314.cjs','health-edge-negative-control-v314.cjs'}
for p in old.glob('*v314*.cjs'):
 if p.name in skip or p.name.startswith('restore-'):continue
 s=p.read_text().replace('v314','v315').replace(oh,nh)
 s=s.replace("...require('./changes-v315.json')", "...require('./changes-v314.json'),...require('./changes-v315.json')")
 for arg in ['html','s']:s=s.replace("require('./source-delta-v315.cjs')("+arg+")","require('./source-delta-v314.cjs')(require('./source-delta-v315.cjs')("+arg+"))")
 if p.name=='beginner-guide-v314.cjs':s=s.replace("value.replace('v0.314', 'v0.313')","value.replace('v0.315', 'v0.314')")
 if p.name=='inherit-dom-v314-negative-control.cjs':s=s.replace("require('./inherit-dom-v315.cjs')","require('./inherit-dom-v314.cjs')").replace('repair-repeat-case-v315.json','repair-repeat-case-v314.json')
 if p.name=='run-pilot-release-v314.cjs':s=s.replace('current-v294','current-v315')
 out=v/p.name.replace('v314','v315')
 if not out.exists():out.write_text(s)
(v/'source-delta-v315.cjs').write_text((old/'source-delta-v314.cjs').read_text().replace('v314','v315'))
for kind in ['history','to-v302']:(v/f'source-delta-{kind}-v315.cjs').write_text(f"'use strict';module.exports=html=>require('./source-delta-{kind}-v314.cjs')(require('./source-delta-v315.cjs')(html));\n")
(v/'restore-v314.cjs').write_text("'use strict';const assert=require('node:assert/strict'),crypto=require('node:crypto');const hash=x=>crypto.createHash('sha256').update(x).digest('hex');module.exports=html=>{assert.equal(hash(html),'"+nh+"','exact v315 source');html=require('./source-delta-v315.cjs')(html);assert.equal(hash(html),'"+oh+"','exact v314 source');return html};\n")
for n in range(288,314):
 previous=f'restore-v{n}-from-v314.cjs' if n<313 else 'restore-v313.cjs'
 (v/f'restore-v{n}-from-v315.cjs').write_text("'use strict';module.exports=html=>require('./"+previous+"')(require('./restore-v314.cjs')(html));\n")
s=(old/'source-delta-v314-negative-control.cjs').read_text().replace('v314','v315').replace("restore=require('./restore-v313.cjs')","restore=require('./restore-v314.cjs')").replace('1fa18e30606cecd2d237c74fe2056036adcb408c643fe601004de63b202d91fb',oh).replace('pinned v313','pinned v314').replace('<h1><b>RED</b> FRONT</h1>','<h2>战术指令</h2>').replace('<h1><b>WRONG</b> FRONT</h1>','<h2>WRONG</h2>').replace('precisely 2 reviewed inverse changes',f'precisely {len(changes)} reviewed inverse changes');(v/'source-delta-v315-negative-control.cjs').write_text(s)
s=(old/'run-tests-v314.cjs').read_text().replace('v314.cjs','v315.cjs').replace('v314-negative-control.cjs','v315-negative-control.cjs').replace('current-suite-manifest-v314.json','current-suite-manifest-v315.json').replace("version:'314'","version:'315'")
s=s.replace("adapter=require('./inherit-dom-v315.cjs')","adapter=require('./inherit-dom-v314.cjs')")
s=s.replace("const v313=require('./restore-v313.cjs')(html)","const v314=require('./restore-v314.cjs')(html),v313=require('./restore-v313.cjs')(v314)")
s=s.replace("require('./restore-v313.cjs')(html+", "require('./restore-v313.cjs')(v314+").replace("require('./restore-v313.cjs')(html.replace", "require('./restore-v313.cjs')(v314.replace")
marker="const source=path.resolve(__dirname,'../index.html')";s=s.replace(marker,"for(const[name,digest]of Object.entries(require('./v314-host-manifest.json').files))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,name))).digest('hex'),digest,'unchanged v314 verification file '+name);\n"+marker)
s=s.replace("scope:'v314 suppresses", "scope:'v315 changes presentation only; exact expected-side render adaptation retains complete candidate paint, event, world, input and storage evidence. v314 suppresses",1)
anchor="assert.throws(()=>require('./restore-v313.cjs')(v314+'\\n')";assert anchor in s;s=s.replace(anchor,"assert.throws(()=>require('./restore-v314.cjs')(html+'\\n'),{code:'ERR_ASSERTION'});assert.throws(()=>require('./restore-v314.cjs')(html.replace('v0.315','v0.316')),{code:'ERR_ASSERTION'});\n"+anchor)
s=s.replace('actual v314 source','actual v315 source').replace('reject v314','reject v315').replace('not v314 behavior coverage.','not v315 behavior coverage.')
s=s.replace("'source-delta-v315-negative-control.cjs'","'source-delta-v315-negative-control.cjs','presentation-v315.cjs','presentation-negative-control-v315.cjs'").replace("summary.focused.length,99,'95 direct current program entries plus four stable-family results'","summary.focused.length,101,'97 direct current program entries plus four stable-family results'")
if not (v/'run-tests-v315.cjs').exists():(v/'run-tests-v315.cjs').write_text(s)
pilot=json.loads((old/'parameterized-pilot/current-suite-manifest-v314.json').read_text());pilot['candidate']['sha256']=nh;pilot['changeFence']['changes']+=changes;(v/'parameterized-pilot/current-suite-manifest-v315.json').write_text(json.dumps(pilot,ensure_ascii=False,indent=2)+'\n')
previousIdentity.write_text(json.dumps({'baselineSha256':oh,'sourceSha256':nh,'reviewedChanges':len(changes),'preparedOnly':prepare},indent=2)+'\n')
print('changes',len(changes),'source',nh)
