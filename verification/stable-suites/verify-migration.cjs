'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process'),{performance}=require('node:perf_hooks');
const contract=require('./migration-contract.json'),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const source=path.resolve(process.argv[2]||path.join(__dirname,'../../index.html')),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'red-stable-equivalence-')),results=[];
function run(file,label){const receipt=path.join(tmp,label+'.json'),start=performance.now();const p=spawnSync(process.execPath,[file,source],{encoding:'utf8',timeout:240000,maxBuffer:12e6,env:{...process.env,RED_STABLE_RECEIPT:receipt}});assert.ifError(p.error);assert.equal(p.signal,null);assert.equal(p.stderr,'');assert.equal(p.status,0,p.stdout);const report=JSON.parse(p.stdout);assert.equal(report.failed,0);return{report,elapsedMs:performance.now()-start,receipt:fs.existsSync(receipt)?JSON.parse(fs.readFileSync(receipt)):null}}
try{
 for(const recipe of contract.recipes){
  const oldPath=path.join(__dirname,recipe.historical),newPath=path.join(__dirname,recipe.module),old=fs.readFileSync(oldPath);
  assert.equal(hash(old),recipe.historicalSha256,'historical bytes locked');let transformed=old.toString();
  for(const c of recipe.changes){assert.equal(transformed.split(c.before).length-1,c.occurrences);transformed=transformed.split(c.before).join(c.after)}
  assert.equal(fs.readFileSync(newPath,'utf8'),transformed,'only declared bootstrap/path changes; all assertions and mutations retained');
  const a=run(oldPath,'old-'+recipe.module),b=run(newPath,'new-'+recipe.module);
  assert.deepEqual(b.report,a.report,'exact scenario inventory, outcomes, failures and counts match');
  if(!recipe.module.includes('-negative')){assert.ok(b.receipt.compiledLoads>0);assert.equal(b.receipt.sourceSha256,hash(fs.readFileSync(source)));}
  results.push({name:recipe.module,passed:true,cases:b.report.passed,historicalMs:a.elapsedMs,stableMs:b.elapsedMs,compiledLoads:b.receipt?.compiledLoads??null,report:b.report});
 }
 console.log(JSON.stringify({passed:results.length,failed:0,sourceSha256:hash(fs.readFileSync(source)),results,scope:'One-time migration proof, not repeated in normal quick/release runs. Exact positive and original negative-control reports matched, including mutation failure counts and named detections; bootstrap-only transformation checked.'},null,2));
}finally{fs.rmSync(tmp,{recursive:true,force:true})}
