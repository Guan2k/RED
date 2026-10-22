import os,sys,time,json,pathlib,hashlib,subprocess,datetime
w=pathlib.Path(__file__).resolve().parent;r=w/'RED';run=w/'controlled-full-final-capture';run.mkdir();audit=run/'dom-audit';audit.mkdir()
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def snapshot():return {str(p.relative_to(r)):hashlib.sha256(p.read_bytes()).hexdigest() for p in r.rglob('*') if p.is_file()}
expected=json.loads((w/'restored-inputs.json').read_text());before=snapshot();assert before==expected,'input drift before gate'
for name in ['progress','capture','loader','equivalence']:
 data=json.loads((w/'scoped'/f'{name}.stdout').read_text());assert data.get('failed')==0,(name,data)
(run/'inputs-before.json').write_text(json.dumps(before,indent=2))
env=dict(os.environ);existing=env.get('NODE_OPTIONS','');assert not existing,'Unexpected existing Node hooks need review'
assert not env.get('RED_VERIFY_PROGRESS_CONFIG'),'Unexpected inherited observer'
env['NODE_OPTIONS']=(existing+' ' if existing else '')+'--require '+json.dumps(str(r/'tools/dom-projection/preload.cjs'))
env['RED_DOM_PROJECTION_AUDIT_DIR']=str(audit)
command=['python3','tools/verification-progress/observe.py','--capture-failures','--progress-dir',str(run/'progress'),'--','verify-development.cjs']
mode={'started':now(),'mode':'explicit-dom-projection-transform-with-observation-and-final-head-capture','defaultGate':False,'command':command,'sourceSha256':before['index.html'],'candidateFiles':len(before),'historicalScriptsChanged':False,'timeoutsChanged':False,'assertionsChanged':False,'stderrCapture':{'position':'head','limit':8192},'stdoutCapture':{'position':'tail','limit':4096},'existingNodeOptionsEmpty':not existing}
(run/'mode.json').write_text(json.dumps(mode,indent=2));print(json.dumps(mode),flush=True)
t=time.time()
with (run/'stdout.log').open('wb') as out,(run/'stderr.log').open('wb') as err:
 p=subprocess.Popen(command,cwd=r,env=env,stdout=out,stderr=err)
 (run/'launcher-pid.json').write_text(json.dumps({'pid':p.pid,'supervisorPid':os.getpid()}));code=p.wait()
after=snapshot();(run/'inputs-after.json').write_text(json.dumps(after,indent=2));changed=[k for k in set(before)|set(after) if before.get(k)!=after.get(k)]
result={'finished':now(),'exit':code,'seconds':time.time()-t,'inputFiles':len(after),'changedInputPaths':changed,'mode':mode['mode'],'defaultGate':False}
(run/'result.json').write_text(json.dumps(result,indent=2));print(json.dumps(result),flush=True);sys.exit(code if code else bool(changed))
