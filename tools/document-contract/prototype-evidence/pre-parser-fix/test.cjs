'use strict';const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process'),{inspect}=require('./check.cjs');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'red-doc-contract-')),results=[],hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const template={'index.html':'<small>ORIGINAL RTS / v0.301</small>','verification/run-tests-v301.cjs':'throw Error("DO NOT EXECUTE");','verification/run-tests-v278.cjs':'historical fixture','README.md':'# RED v0.301\n\n## 当前测试与限制\n本版命令为 `node verification/run-tests-v301.cjs`，见[本版](verification/run-tests-v301.cjs)。\n[指南](CURRENT_PLAYER_GUIDE.md#1-开局)\n\n## 历史\n本版历史命令 node verification/run-tests-v278.cjs\n','CURRENT_PLAYER_GUIDE.md':'# v0.301 玩家指南\n## 1. 开局\n本指南对应 v0.301。\n## v0.278 历史\n本指南对应 v0.278。\n','CURRENT_VERIFICATION_ENTRY.md':'# v0.301 入口\n','QA_STATUS.md':'# v0.301 QA\n'};
template['current-verification.json']=JSON.stringify({schemaVersion:1,version:'301',source:'index.html',sourceSha256:hash(template['index.html']),runner:'verification/run-tests-v301.cjs',runnerSha256:hash(template['verification/run-tests-v301.cjs'])});
function snapshot(root){const out={};function walk(d){for(const n of fs.readdirSync(d)){const f=path.join(d,n),st=fs.lstatSync(f);if(st.isDirectory())walk(f);else out[path.relative(root,f)]=st.isSymbolicLink()?'link:'+fs.readlinkSync(f):hash(fs.readFileSync(f))}}walk(root);return out}
function test(name,change,expected){const root=path.join(temp,String(results.length),'package');fs.mkdirSync(root,{recursive:true});for(const [f,s]of Object.entries(template)){fs.mkdirSync(path.dirname(path.join(root,f)),{recursive:true});fs.writeFileSync(path.join(root,f),s)}change?.(root);const before=snapshot(root),r=inspect(root);assert.equal(r.failed===0,expected===null,name+JSON.stringify(r.checks.filter(x=>!x.passed)));if(expected)assert.ok(r.checks.some(x=>!x.passed&&x.code.includes(expected)),name);assert.deepEqual(snapshot(root),before,'read-only '+name);results.push({name,passed:true,failuresDetected:r.checks.filter(x=>!x.passed).map(x=>x.code)});return root}
const edit=(f,a,b)=>root=>{const p=path.join(root,f);fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace(a,b))};const rm=f=>r=>fs.unlinkSync(path.join(r,f));
try{
const valid=test('valid current and explicit history',null,null);
for(const f of ['current-verification.json','README.md','CURRENT_PLAYER_GUIDE.md','CURRENT_VERIFICATION_ENTRY.md','QA_STATUS.md','index.html','verification/run-tests-v301.cjs'])test('missing '+f,rm(f),'read:'+f);
for(const v of ['{','null','[]','"text"','{}'])test('invalid JSON/schema '+v,r=>fs.writeFileSync(path.join(r,'current-verification.json'),v),v==='{'?'manifest-json':v==='{}'?'manifest-schema':'manifest-json');
test('current command mismatch',edit('README.md','node verification/run-tests-v301.cjs','node verification/run-tests-v278.cjs'),'current-runner-command');
test('current link mismatch',edit('README.md','](verification/run-tests-v301.cjs)','](verification/run-tests-v278.cjs)'),'current-runner-link');
test('guide mismatch',edit('CURRENT_PLAYER_GUIDE.md','本指南对应 v0.301','本指南对应 v0.300'),'current-guide-identity');
test('header prefix mismatch',edit('QA_STATUS.md','v0.301','v0.3010'),'title:QA_STATUS');
test('only historical command cannot pass',edit('README.md','本版命令为','历史本版命令为'),'current-runner-line');
test('only historical nested subsection cannot pass',edit('README.md','本版命令为','### v0.301 历史\n本版命令为'),'current-runner-line');
test('only fenced command cannot pass',edit('README.md','本版命令为','```text\n本版命令为'),'current-runner-line');
test('missing current section cannot use history',edit('README.md','## 当前测试与限制','## v0.301历史'),'current-readme-section');
test('duplicate current section rejected',edit('README.md','## 历史','## 当前测试与限制'),'current-readme-section');
test('duplicate current command rejected',edit('README.md','[指南]','本版额外命令 node verification/run-tests-v301.cjs\n[指南]'),'current-runner-line');
test('missing current guide cannot use historical claim',edit('CURRENT_PLAYER_GUIDE.md','本指南对应 v0.301。',''),'current-guide-identity');
test('missing target',edit('README.md','CURRENT_PLAYER_GUIDE.md#1-开局','missing.md'),'read:missing.md');
test('missing anchor',edit('README.md','#1-开局','#missing'),'anchor:');
test('source bytes mismatch',edit('index.html','</small>','x</small>'),'manifest-source-hash');
test('runner bytes mismatch',edit('verification/run-tests-v301.cjs','DO NOT','NEVER'),'manifest-runner-hash');
test('source version mismatch',edit('index.html','v0.301','v0.302'),'manifest-version');
test('manifest unsafe source blocked',edit('current-verification.json','"index.html"','"../secret"'),'manifest-schema');
test('link escape blocked',edit('README.md','CURRENT_PLAYER_GUIDE.md#1-开局','../../outside'),'path:../../outside');
test('symlink escape blocked',r=>{fs.unlinkSync(path.join(r,'QA_STATUS.md'));fs.writeFileSync(path.join(temp,'outside.md'),'# v0.301');fs.symlinkSync(path.join(temp,'outside.md'),path.join(r,'QA_STATUS.md'))},'read:QA_STATUS.md');
test('external link is not fetched',edit('README.md','[指南]','[external](https://example.invalid/no-network)\n[指南]'),null);
const tool=path.join(temp,'relocated','check.cjs');fs.mkdirSync(path.dirname(tool));fs.copyFileSync(path.join(__dirname,'check.cjs'),tool);const before=snapshot(valid),cwd=path.join(temp,'othercwd');fs.mkdirSync(cwd);for(const args of [[valid],[path.relative(cwd,valid)]]){const p=spawnSync(process.execPath,[tool,...args],{cwd,encoding:'utf8'});assert.equal(p.status,0,p.stderr+p.stdout);assert.equal(JSON.parse(p.stdout).failed,0);results.push({name:'relocated tool arbitrary cwd '+args[0],passed:true})}for(const args of [[],['--fix'],[valid,'extra']]){const p=spawnSync(process.execPath,[tool,...args],{cwd,encoding:'utf8'});assert.equal(p.status,2);results.push({name:'reject CLI '+JSON.stringify(args),passed:true})}const bad=spawnSync(process.execPath,[tool,path.join(temp,'absent')],{cwd,encoding:'utf8'});assert.equal(bad.status,1);assert.ok(JSON.parse(bad.stdout).failed);results.push({name:'missing package CLI explicit failure',passed:true});assert.deepEqual(snapshot(valid),before);
console.log(JSON.stringify({passed:results.length,failed:0,results,scope:'Private temporary fixtures and relocated CLI; every inspected package remains byte-identical; runner fixtures intentionally throw if executed.'},null,2));
}finally{fs.rmSync(temp,{recursive:true,force:true})}
