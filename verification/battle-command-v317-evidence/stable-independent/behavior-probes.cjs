const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process'),assert=require('assert/strict');
const root=path.resolve('red-development/v316-stable-suites/RED'),suite=path.join(root,'verification/stable-suites'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'red-independent-behavior-')),out=[];
try{
const source=path.join(tmp,'index.html'),other=path.join(tmp,'other.html'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');fs.writeFileSync(source,html);fs.writeFileSync(other,html);
const snippet=`const fs=require('fs'),assert=require('assert/strict');process.argv[2]=${JSON.stringify(source)};const {loadGame}=require(${JSON.stringify(path.join(suite,'provenance-loader.cjs'))});assert.throws(()=>loadGame(${JSON.stringify(other)}),/only requested candidate/);fs.appendFileSync(process.argv[2],'\\n');assert.throws(()=>loadGame(process.argv[2]),/candidate bytes cannot change/);console.log('ok')`;
let p=cp.spawnSync(process.execPath,['-e',snippet],{encoding:'utf8'});assert.equal(p.status,0,p.stderr);out.push({name:'wrong same-byte path and post-bootstrap byte change refused',passed:true});
// Behavior contract is not a release-hash fence: harmless changed input is exercised.
fs.writeFileSync(source,html+'\n<!-- independent changed-byte candidate -->\n');
p=cp.spawnSync(process.execPath,[path.join(suite,'escape-key-repeat.cjs'),source],{encoding:'utf8'});assert.equal(p.status,0,p.stderr);let r=JSON.parse(p.stdout);assert.equal(r.passed,47);assert.equal(new Set(r.results.map(x=>x.name)).size,47);out.push({name:'changed-byte valid candidate behavior executes, no hash veto',passed:true,cases:r.passed});
p=cp.spawnSync(process.execPath,[path.join(suite,'escape-key-repeat-negative.cjs'),source],{encoding:'utf8'});assert.equal(p.status,0,p.stderr);r=JSON.parse(p.stdout);assert.equal(r.passed,4);assert.ok(r.results.every(x=>x.failedCases>0&&x.rejectedBy));out.push({name:'four mutants rejected by named behavior, not identity',passed:true,results:r.results});
console.log(JSON.stringify({passed:out.length,results:out},null,2));
}finally{fs.rmSync(tmp,{recursive:true,force:true})}
