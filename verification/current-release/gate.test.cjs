'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'red-linkage-negative-')),copy=path.join(temp,'RED'),hash=b=>crypto.createHash('sha256').update(b).digest('hex'),results=[];
function run(){const p=spawnSync(process.execPath,[path.join(copy,'verify-current.cjs'),'--check-only'],{encoding:'utf8',maxBuffer:4*1024*1024});assert.ifError(p.error);assert.equal(p.signal,null);return p}
try{
 fs.cpSync(root,copy,{recursive:true});
 const names=['SHA256SUMS.txt','current-verification.json','verification/stable-suites/release-contract.json','verification/stable-suites/release-runner.cjs','verification/current-effects/suite.cjs','tools/effect-feedback-retention.test.cjs'];
 const originals=new Map(names.map(n=>[n,fs.readFileSync(path.join(copy,n))]));
 const reset=()=>{for(const[n,b]of originals)fs.writeFileSync(path.join(copy,n),b)};
 const editJSON=(n,fn)=>{const p=path.join(copy,n),j=JSON.parse(fs.readFileSync(p));fn(j);fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n')};
 function reseal(){const p=path.join(copy,'SHA256SUMS.txt');fs.writeFileSync(p,fs.readFileSync(p,'utf8').trimEnd().split('\n').map(l=>{const n=l.slice(66);return hash(fs.readFileSync(path.join(copy,n)))+'  '+n}).join('\n')+'\n')}
 function test(name,mutate,pattern){reset();mutate();const p=run();assert.notEqual(p.status,0,name);assert.match(p.stderr,pattern,name);results.push({name,passed:true,exitCode:p.status,reason:p.stderr.trim()})}
 test('omitted current effects file from checksum manifest rejects',()=>{const p=path.join(copy,'SHA256SUMS.txt');fs.writeFileSync(p,fs.readFileSync(p,'utf8').split('\n').filter(l=>!l.endsWith('  tools/explosion-effects.test.cjs')).join('\n'))},/stable dependency missing/);
 test('omitted effects from both dependency inventories rejects',()=>{editJSON('verification/stable-suites/release-contract.json',j=>delete j.files['tools/explosion-effects.test.cjs']);const p=path.join(copy,'SHA256SUMS.txt');fs.writeFileSync(p,fs.readFileSync(p,'utf8').split('\n').filter(l=>!l.endsWith('  tools/explosion-effects.test.cjs')).join('\n'));reseal()},/current layer dependency missing/);
 test('omitted retention test from checksum manifest rejects',()=>{const p=path.join(copy,'SHA256SUMS.txt');fs.writeFileSync(p,fs.readFileSync(p,'utf8').split('\n').filter(l=>!l.endsWith('  tools/effect-feedback-retention.test.cjs')).join('\n'))},/stable dependency missing/);
 test('omitted retention test from both dependency inventories rejects',()=>{editJSON('verification/stable-suites/release-contract.json',j=>delete j.files['tools/effect-feedback-retention.test.cjs']);const p=path.join(copy,'SHA256SUMS.txt');fs.writeFileSync(p,fs.readFileSync(p,'utf8').split('\n').filter(l=>!l.endsWith('  tools/effect-feedback-retention.test.cjs')).join('\n'));reseal()},/current layer dependency missing/);
 test('changed current layer entry rejects',()=>{editJSON('verification/stable-suites/release-contract.json',j=>j.currentValidation.entry='verification/run-tests-v318.cjs');reseal()},/current layered validation contract mismatch/);
 test('stale selected current source hash rejects',()=>{editJSON('current-verification.json',j=>j.sourceSha256='0'.repeat(64));reseal()},/manifest\/source\/runner checksum disagreement/);
 test('unsealed runner replacement rejects',()=>fs.appendFileSync(path.join(copy,'verification/stable-suites/release-runner.cjs'),'\n// modified\n'),/checksum mismatch/);
 reset();
 // A test fixture with a valid regenerated dependency/hash inventory proves that
 // current execution failure, not a stale digest, blocks the default layered gate.
 const stub="'use strict'; console.log(JSON.stringify({pass:false,results:[{name:'injected-current-semantic-failure',pass:false}]})); process.exitCode=1;\n";
 fs.writeFileSync(path.join(copy,'verification/current-effects/suite.cjs'),stub);
 editJSON('verification/stable-suites/release-contract.json',j=>j.files['verification/current-effects/suite.cjs']=hash(stub));reseal();assert.equal(run().status,0,'fixture integrity really passes');
 const failed=spawnSync(process.execPath,[path.join(copy,'verify-current.cjs')],{encoding:'utf8',maxBuffer:4*1024*1024});assert.ifError(failed.error);assert.notEqual(failed.status,0);assert.match(failed.stderr,/injected-current-semantic-failure/);assert.ok(!failed.stdout.includes('"historical":'),'no success report published');results.push({name:'actual current suite failure propagates through default isolated gate',passed:true,exitCode:failed.status});
 reset();
 const retentionStub="'use strict'; console.log('injected-feedback-retention-failure'); process.exitCode=1;\n";
 fs.writeFileSync(path.join(copy,'tools/effect-feedback-retention.test.cjs'),retentionStub);
 editJSON('verification/stable-suites/release-contract.json',j=>j.files['tools/effect-feedback-retention.test.cjs']=hash(retentionStub));reseal();assert.equal(run().status,0,'retention failure fixture integrity really passes');
 const retentionFailed=spawnSync(process.execPath,[path.join(copy,'verify-current.cjs')],{encoding:'utf8',maxBuffer:4*1024*1024});assert.ifError(retentionFailed.error);assert.notEqual(retentionFailed.status,0);assert.match(retentionFailed.stderr,/injected-feedback-retention-failure/);assert.ok(!retentionFailed.stdout.includes('"historical":'));results.push({name:'actual retention test failure propagates through default isolated gate',passed:true,exitCode:retentionFailed.status});
 console.log(JSON.stringify({passed:results.length,failed:0,results,scope:'Disposable copied package: integrity omission/replacement refusals and a re-sealed current failing-suite fixture; not additional gameplay acceptance.'},null,2));
}finally{fs.rmSync(temp,{recursive:true,force:true})}
