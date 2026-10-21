'use strict';
// Behavior only: identity is a separate gate, no version/change-fence adaptation.
const path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const {performance}=require('node:perf_hooks');
const source=path.resolve(process.argv[2]||path.join(__dirname,'../../index.html'));
const results=[];
for(const family of require('./migration-contract.json').families){
 const start=performance.now();const p=spawnSync(process.execPath,[path.join(__dirname,family+'.cjs'),source],{encoding:'utf8',timeout:180000,maxBuffer:8e6});
 assert.ifError(p.error);assert.equal(p.signal,null);assert.equal(p.stderr,'');assert.equal(p.status,0,p.stdout);
 const r=JSON.parse(p.stdout);assert.equal(r.failed,0);assert.equal(r.passed,r.results.length);
 results.push({name:family,passed:true,cases:r.passed,sourceSha256:r.sourceSha256,elapsedMs:performance.now()-start});
}
console.log(JSON.stringify({passed:results.length,failed:0,results,scope:'Three stable behavior suites only; no release or native browser claim.'},null,2));
