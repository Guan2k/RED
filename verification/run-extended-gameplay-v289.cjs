'use strict';
// Separate opt-in evidence families. Does not change the default aggregation.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),base=path.join(__dirname,'extended-gameplay'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const families=['damage','repair','switchback','survival'],args=process.argv.slice(2);
assert.ok(args.length===0||(args.length===2&&args[0]==='--family'&&families.includes(args[1])),'usage: no arguments, or --family damage|repair|switchback|survival');
const selected=args.length?[args[1]]:families;
const manifest=JSON.parse(fs.readFileSync(path.join(base,'migration-manifest.json')));
assert.equal(manifest.schemaVersion,1);
assert.equal(hash(fs.readFileSync(path.join(root,'index.html'))),manifest.sourceSha256,'fixed approved game source');
assert.equal(hash(fs.readFileSync(path.join(root,'verification/vm-environment.cjs'))),manifest.vmSha256,'fixed approved VM dependency');
const ids=['damage','repair-natural','repair-boundary','switchback','survival','survival-oracle','survival-check-oracle'];
assert.deepEqual(manifest.scripts.map(x=>x.id).sort(),[...ids].sort(),'exact approved scripts; no unreviewed single-far-point route');
const tracked=new Map();
function remember(file){const b=fs.readFileSync(file);if(!tracked.has(file))tracked.set(file,hash(b));return b}
function local(relative){assert.equal(typeof relative,'string');assert.ok(!path.isAbsolute(relative)&&relative.split('/').every(p=>p&&p!=='.'&&p!=='..')&&!relative.includes('\\'),'package relative path');const full=path.resolve(base,relative);assert.ok(full.startsWith(base+path.sep));return full}
remember(path.join(root,'index.html'));remember(path.join(root,'verification/vm-environment.cjs'));remember(path.join(base,'migration-manifest.json'));
for(const item of manifest.scripts){
  const bytes=remember(local(item.path));assert.equal(hash(bytes),item.portableSha256,item.id+' portable script identity');
  let original=bytes.toString('utf8');
  if(item.replacement){const {from,to}=item.replacement;assert.equal(original.split(to).length-1,1,item.id+' unique portable bootstrap anchor');original=original.replace(to,from)}
  assert.equal(hash(Buffer.from(original)),item.originalSha256,item.id+' reverse-bootstrap exact original; assertions unchanged');
  if(item.resultPath)remember(local(item.resultPath));
  if(item.summaryPath)remember(local(item.summaryPath));
}
function run(id,extra=[]){
  const item=manifest.scripts.find(x=>x.id===id);assert.ok(item);const child=spawnSync(process.execPath,[local(item.path),...extra],{cwd:root,shell:false,encoding:'utf8',maxBuffer:32*1024*1024,timeout:600000});
  assert.equal(child.error,undefined,id+' spawn error');assert.equal(child.signal,null,id+' terminated by signal');assert.equal(child.status,0,id+' failed: '+child.stderr);assert.equal(child.stderr,'',id+' unexpected stderr');
  const result=JSON.parse(child.stdout),normalized=JSON.parse(JSON.stringify(result));
  if(id==='damage'||id==='switchback'){assert.equal(result.source,path.join(root,'index.html'),id+' actual package source path');normalized.source='index.html'}
  if(id!=='survival-check-oracle')assert.equal(result.sha256,manifest.sourceSha256,id+' observed source identity');
  assert.equal(hash(Buffer.from(JSON.stringify(normalized))),item.normalizedResultSha256,id+' approved full semantic result unchanged');
  return {result:normalized,stdout:child.stdout};
}
const result={scope:'Opt-in v289 expanded gameplay evidence. Existing default aggregation and game source unchanged. Natural UI, explicit fixtures and offline record mutations are separate.',sourceSha256:manifest.sourceSha256,families:selected,results:{},defaultAggregateExecuted:false};
for(const family of selected){
  if(family==='damage')result.results.damage=run('damage').result;
  if(family==='repair')result.results.repair={natural:run('repair-natural').result,fixtures:run('repair-boundary').result};
  if(family==='switchback')result.results.switchback=run('switchback').result;
  if(family==='survival'){
    const {result:full,stdout}=run('survival');
    assert.equal(full.stepTrace.length,manifest.survivalTrace.rows,'complete 21600-step trace generated');
    assert.deepEqual(full.stepTraceColumns,manifest.survivalTrace.columns);
    assert.equal(hash(Buffer.from(JSON.stringify(full.stepTrace))),manifest.survivalTrace.canonicalTraceSha256,'complete trace canonical digest');
    assert.equal(hash(Buffer.from(stdout)),manifest.survivalTrace.fullRawSha256,'complete original raw trace report digest');
    assert.equal(Buffer.byteLength(stdout),manifest.survivalTrace.fullRawBytes,'complete original raw trace report bytes');
    let temporary;
    try{
      temporary=fs.mkdtempSync(path.join(os.tmpdir(),'red-survival-evidence-'));
      const trace=path.join(temporary,'full-result.json');fs.writeFileSync(trace,stdout,{flag:'wx'});
      const offline=run('survival-check-oracle',[trace]).result;
      const {stepTrace,...summary}=full;
      result.results.survival={summary,trace:{rows:stepTrace.length,columns:full.stepTraceColumns,canonicalTraceSha256:manifest.survivalTrace.canonicalTraceSha256,fullRawSha256:manifest.survivalTrace.fullRawSha256,fullRawBytes:manifest.survivalTrace.fullRawBytes},offlineRecordedEvidenceMutations:offline};
    }finally{if(temporary)fs.rmSync(temporary,{recursive:true,force:true})}
  }
}
for(const [file,sha]of tracked)assert.equal(hash(fs.readFileSync(file)),sha,'packaged input unchanged: '+path.relative(root,file));
console.log(JSON.stringify(result,null,2));
