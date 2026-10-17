'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),hash=b=>crypto.createHash('sha256').update(b).digest('hex'),jsonHash=x=>hash(Buffer.from(JSON.stringify(x))),families=['harvest','control','annihilation'],args=process.argv.slice(2);
assert.ok(args.length===0||(args.length===2&&args[0]==='--family'&&families.includes(args[1])),'usage: no arguments, or --family harvest|control|annihilation');
const selected=args.length?[args[1]]:families,tracked=new Map();
function local(relative){assert.equal(typeof relative,'string');assert.ok(!path.isAbsolute(relative)&&!relative.includes('\\')&&relative.split('/').every(p=>p&&p!=='.'&&p!=='..'),'package-relative path');const full=path.resolve(root,relative);assert.ok(full.startsWith(root+path.sep));return full}
function read(relative){const file=local(relative),b=fs.readFileSync(file);if(!tracked.has(file))tracked.set(file,hash(b));return b}
const manifest=JSON.parse(read('verification/goal-evidence/migration-manifest.json'));
assert.equal(manifest.schemaVersion,1);assert.deepEqual(Object.keys(manifest.families),families);
assert.equal(manifest.source.path,'index.html');assert.equal(manifest.vm.path,'verification/vm-environment.cjs');
for(const item of [manifest.source,manifest.vm])assert.equal(hash(read(item.path)),item.sha256,'approved source/VM identity');
for(const family of families){const f=manifest.families[family];assert.deepEqual(Object.keys(f.scripts),['verify.cjs','oracle.cjs','check-oracle.cjs']);
 for(const [name,s]of Object.entries(f.scripts)){assert.equal(s.portablePath,`verification/goal-evidence/${family}/${name}`);const b=read(s.portablePath);assert.equal(hash(b),s.portableSha256,'portable script identity');let original=b.toString('utf8');if(s.inverseReplacement){const r=s.inverseReplacement;assert.equal(r.occurrences,1);assert.equal(original.split(r.from).length-1,1,'unique inverse bootstrap');original=original.replace(r.from,r.to)}assert.equal(hash(Buffer.from(original)),s.originalSha256,'exact approved assertion body after reverse bootstrap')}
 assert.equal(hash(read(f.summaryPath)),f.summarySha256);assert.equal(hash(read(f.negativeResult.path)),f.negativeResult.rawSha256);
 for(const p of Object.values(f.preservedFiles))assert.equal(hash(read(p.portablePath)),p.sha256);
}
function run(file,extra=[]){const c=spawnSync(process.execPath,[local(file),...extra],{cwd:root,shell:false,encoding:'utf8',maxBuffer:64*1024*1024,timeout:600000});assert.equal(c.error,undefined,'spawn error');assert.equal(c.signal,null,'child signal');assert.equal(c.status,0,'child failed: '+c.stderr);assert.equal(c.stderr,'','unexpected stderr');return {raw:c.stdout,result:JSON.parse(c.stdout)}}
const output={scope:'Three natural enemy victories/player defeats; original full-step oracles and offline record mutations, not product mutants. Default aggregate unchanged.',sourceSha256:manifest.source.sha256,families:selected,results:{},defaultAggregateExecuted:false};
for(const family of selected){const f=manifest.families[family],meta=f.traceMetadata,{raw,result}=run(f.scripts['verify.cjs'].portablePath);
 assert.equal(result.sha256,manifest.source.sha256);assert.equal(result.passed,true);assert.equal(result.terminal.result,'战败');assert.equal(result.stepTrace.length,meta.rows);assert.equal(jsonHash(result.stepTrace),meta.traceJsonSha256,'complete generated trace digest');assert.equal(jsonHash(result),meta.sourceResultJsonSha256,'full semantic result unchanged');assert.equal(Buffer.byteLength(raw),meta.sourceResultRawBytes);assert.equal(hash(Buffer.from(raw)),meta.sourceResultRawSha256,'full raw report unchanged');
 const {stepTrace,...fields}=result,summary={...fields,traceMetadata:meta};assert.deepEqual(summary,JSON.parse(read(f.summaryPath)),'summary contains every non-trace original field');
 let temporary;try{temporary=fs.mkdtempSync(path.join(os.tmpdir(),'red-goal-evidence-'));const full=path.join(temporary,'full-result.json');fs.writeFileSync(full,raw,{flag:'wx'});const negative=run(f.scripts['check-oracle.cjs'].portablePath,[full]);assert.equal(hash(Buffer.from(negative.raw)),f.negativeResult.rawSha256);assert.equal(jsonHash(negative.result),f.negativeResult.jsonSha256);assert.equal(negative.result.passed,true);assert.equal(negative.result.results.length,f.negativeResult.cases);assert.ok(negative.result.results.every(x=>x.rejected===true));output.results[family]={summary,offlineRecordedEvidenceMutations:negative.result}}finally{if(temporary)fs.rmSync(temporary,{recursive:true,force:true})}
}
for(const [file,sha]of tracked)assert.equal(hash(fs.readFileSync(file)),sha,'packaged input unchanged: '+path.relative(root,file));
console.log(JSON.stringify(output,null,2));
