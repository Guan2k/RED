'use strict';const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process'),{inspect}=require('./check.cjs');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'red-doc-contract-')),results=[],hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const template={'index.html':'<small>ORIGINAL RTS / v0.301</small>','verification/run-tests-v301.cjs':'throw Error("DO NOT EXECUTE");','verification/run-tests-v278.cjs':'historical fixture','README.md':'# RED v0.301\n\n## 当前测试与限制\n本版命令为 `node verification/run-tests-v301.cjs`，见[本版](verification/run-tests-v301.cjs)。\n[指南](CURRENT_PLAYER_GUIDE.md#1-开局)\n\n## 历史\n本版历史命令 node verification/run-tests-v278.cjs\n','CURRENT_PLAYER_GUIDE.md':'# v0.301 玩家指南\n## 1. 开局\n本指南对应 v0.301。\n## v0.278 历史\n本指南对应 v0.278。\n','CURRENT_VERIFICATION_ENTRY.md':'# v0.301 入口\nnode verify-development.cjs\n','QA_STATUS.md':'# v0.301 QA\n'};
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

test('historical H3 inherited through H4',edit('README.md','本版命令为','### v0.278 历史\n#### 示例\n本版命令为'),'current-runner-line');
test('historical guide H2 inherited through H3',edit('CURRENT_PLAYER_GUIDE.md','本指南对应 v0.301','## v0.278 历史\n### 示例\n本指南对应 v0.301'),'current-guide-identity');
test('comment-only current command excluded',edit('README.md','本版命令为 `node verification/run-tests-v301.cjs`，见[本版](verification/run-tests-v301.cjs)。','<!--\n本版命令为 `node verification/run-tests-v301.cjs`，见[本版](verification/run-tests-v301.cjs)。\n-->'),'current-runner-line');
test('inline commented command excluded',edit('README.md','node verification/run-tests-v301.cjs','<!-- node verification/run-tests-v301.cjs -->'),'current-runner-command');
test('fake fenced anchor excluded',edit('CURRENT_PLAYER_GUIDE.md','## 1. 开局','```md\n## 1. 开局\n```'),'anchor:');
test('fake commented anchor excluded',edit('CURRENT_PLAYER_GUIDE.md','## 1. 开局','<!--\n## 1. 开局\n-->'),'anchor:');
test('shorter closing fence not accepted',edit('CURRENT_PLAYER_GUIDE.md','## 1. 开局','````md\n```\n## 1. 开局\n````'),'anchor:');
test('wrong closing fence type not accepted',edit('CURRENT_PLAYER_GUIDE.md','## 1. 开局','```md\n~~~\n## 1. 开局\n```'),'anchor:');
test('real fenced current command supported',edit('README.md','本版命令为 `node verification/run-tests-v301.cjs`，见[本版](verification/run-tests-v301.cjs)。','本版底层命令：\n\n```sh\nnode verification/run-tests-v301.cjs\n```\n\n见[本版](verification/run-tests-v301.cjs)。'),null);
test('same-level heading exits historical subtree',edit('README.md','本版命令为','### v0.278 历史\n#### 示例\n旧说明\n### 当前运行\n本版命令为'),null);
test('commented fake history cannot hide valid command',edit('README.md','本版命令为','<!-- ### v0.278 历史 -->\n本版命令为'),null);
test('current entry old runner rejected',edit('CURRENT_VERIFICATION_ENTRY.md','node verify-development.cjs','node verification/run-tests-v278.cjs'),'current-entry-command:');
test('current entry unsupported option rejected',edit('CURRENT_VERIFICATION_ENTRY.md','node verify-development.cjs','node verify-development.cjs --fix'),'current-entry-command:');
test('current entry positional argument rejected',edit('CURRENT_VERIFICATION_ENTRY.md','node verify-development.cjs','node verify-development.cjs extra'),'current-entry-command:');
test('current entry unknown command extension rejected',edit('CURRENT_VERIFICATION_ENTRY.md','node verify-development.cjs','node tools/fake.mjs'),'current-entry-command:');
test('current entry fenced supported option',edit('CURRENT_VERIFICATION_ENTRY.md','node verify-development.cjs','```sh\nnode verify-current.cjs --check-only\n```'),null);
test('current entry only comment rejected',edit('CURRENT_VERIFICATION_ENTRY.md','node verify-development.cjs','<!-- node verify-development.cjs -->'),'current-entry-command-present');
test('current entry only history rejected',edit('CURRENT_VERIFICATION_ENTRY.md','node verify-development.cjs','## v0.278 历史\n### 示例\nnode verify-development.cjs'),'current-entry-command-present');
test('current entry history old command allowed',edit('CURRENT_VERIFICATION_ENTRY.md','node verify-development.cjs','node verify-development.cjs\n## v0.278 历史\n### 示例\nnode verification/run-tests-v278.cjs'),null);

test('entry quoted unsupported option rejected',edit('CURRENT_VERIFICATION_ENTRY.md','node verify-development.cjs','node verify-development.cjs "--wrong"'),'current-entry-command:');
test('entry single-quoted unsupported option rejected',edit('CURRENT_VERIFICATION_ENTRY.md','node verify-development.cjs',"node verify-development.cjs '--wrong'"),'current-entry-command:');
test('entry quoted supported option accepted',edit('CURRENT_VERIFICATION_ENTRY.md','node verify-development.cjs','node verify-development.cjs "--check-only"'),null);
test('entry unterminated quote rejected',edit('CURRENT_VERIFICATION_ENTRY.md','node verify-development.cjs','node verify-development.cjs "--check-only'),'current-entry-command:');
test('entry inline unsupported quoted tail rejected',edit('CURRENT_VERIFICATION_ENTRY.md','node verify-development.cjs','运行 `node verify-development.cjs "--wrong"`。'),'current-entry-command:');
test('entry mixed appended argument rejected',edit('CURRENT_VERIFICATION_ENTRY.md','node verify-development.cjs','node verify-development.cjs --check-only "extra"'),'current-entry-command:');
test('entry shell suffix rejected',edit('CURRENT_VERIFICATION_ENTRY.md','node verify-development.cjs','node verify-development.cjs && echo nope'),'current-entry-command:');
test('README runner quoted tail rejected',edit('README.md','node verification/run-tests-v301.cjs','node verification/run-tests-v301.cjs \"--wrong\"'),'current-runner-command');
const tool=path.join(temp,'relocated','check.cjs');fs.mkdirSync(path.dirname(tool));fs.copyFileSync(path.join(__dirname,'check.cjs'),tool);const before=snapshot(valid),cwd=path.join(temp,'othercwd');fs.mkdirSync(cwd);for(const args of [[valid],[path.relative(cwd,valid)]]){const p=spawnSync(process.execPath,[tool,...args],{cwd,encoding:'utf8'});assert.equal(p.status,0,p.stderr+p.stdout);assert.equal(JSON.parse(p.stdout).failed,0);results.push({name:'relocated tool arbitrary cwd '+args[0],passed:true})}for(const args of [[],['--fix'],[valid,'extra']]){const p=spawnSync(process.execPath,[tool,...args],{cwd,encoding:'utf8'});assert.equal(p.status,2);results.push({name:'reject CLI '+JSON.stringify(args),passed:true})}const bad=spawnSync(process.execPath,[tool,path.join(temp,'absent')],{cwd,encoding:'utf8'});assert.equal(bad.status,1);assert.ok(JSON.parse(bad.stdout).failed);results.push({name:'missing package CLI explicit failure',passed:true});assert.deepEqual(snapshot(valid),before);
// Schema 2 keeps the same document grammar, but pins the stable entry and its dependency contract.
const stable='verification/stable-suites/release-runner.cjs',contractPath='verification/stable-suites/release-contract.json';
function jsonEdit(root,file,change){const p=path.join(root,file),v=JSON.parse(fs.readFileSync(p,'utf8'));change(v);fs.writeFileSync(p,JSON.stringify(v))}
function schema2(root){
 const put=(n,s)=>{fs.mkdirSync(path.dirname(path.join(root,n)),{recursive:true});fs.writeFileSync(path.join(root,n),s)};
 const dispatch=['purchase-funding','selection-key-repeat','escape-key-repeat'].flatMap(f=>[f,f+'-negative']).map(f=>[f+'-v315.cjs','stable-suites/'+f+'.cjs']);
 const files={};for(const n of [stable,'verification/run-tests-v301.cjs','verification/parameterized-pilot/vm-environment-provenance.cjs','verification/stable-suites/provenance-loader.cjs',...dispatch.map(x=>'verification/'+x[1])]){if(n!=='verification/run-tests-v301.cjs')put(n,'throw Error("DO NOT EXECUTE STABLE DEPENDENCY");');files[n]=hash(fs.readFileSync(path.join(root,n)))}
 put(contractPath,JSON.stringify({schema:1,historicalRunner:'verification/run-tests-v301.cjs',dispatch,files}));
 jsonEdit(root,'current-verification.json',m=>{m.schemaVersion=2;m.runner=stable;m.runnerSha256=files[stable]});
 edit('README.md','node verification/run-tests-v301.cjs','node '+stable)(root);edit('README.md','](verification/run-tests-v301.cjs)',']('+stable+')')(root);
}
function test2(name,change,expected){return test('schema2 '+name,r=>{schema2(r);change?.(r)},expected)}
test2('valid stable entry',null,null);
test2('direct current entry',edit('CURRENT_VERIFICATION_ENTRY.md','node verify-development.cjs','node '+stable),null);
test2('fenced README command',edit('README.md','本版命令为 `node '+stable+'`，见[本版]('+stable+')。','本版底层命令：\n\n```sh\nnode '+stable+'\n```\n\n见[本版]('+stable+')。'),null);
for(const v of [0,3,'2',null])test2('unknown manifest schema '+v,r=>jsonEdit(r,'current-verification.json',m=>m.schemaVersion=v),'manifest-schema');
for(const runner of ['verification/run-tests-v301.cjs','verification/stable-suites/run-quick.cjs','verification/stable-suites/../stable-suites/release-runner.cjs'])test2('wrong entry '+runner,r=>jsonEdit(r,'current-verification.json',m=>m.runner=runner),'manifest-schema');
test2('manifest source identity mismatch',r=>jsonEdit(r,'current-verification.json',m=>m.version='302'),'manifest-version');
test2('historical identity mismatch',r=>jsonEdit(r,contractPath,c=>c.historicalRunner='verification/run-tests-v278.cjs'),'stable-contract-identity');
test2('missing contract',rm(contractPath),'read:'+contractPath);
for(const raw of ['{','null','[]','{}','{"schema":2}'])test2('invalid contract '+raw,r=>fs.writeFileSync(path.join(r,contractPath),raw),raw==='{'?'stable-contract-json':'stable-contract-schema');
test2('missing dispatch',r=>jsonEdit(r,contractPath,c=>delete c.dispatch),'stable-contract-dispatch');
test2('wrong dispatch target',r=>jsonEdit(r,contractPath,c=>c.dispatch[0][1]='stable-suites/run-quick.cjs'),'stable-contract-dispatch');
test2('missing dependency inventory',r=>jsonEdit(r,contractPath,c=>delete c.files),'stable-contract-dependencies');
test2('invalid dependency inventory',r=>jsonEdit(r,contractPath,c=>c.files=[]),'stable-contract-dependencies');
test2('dependency omitted',r=>jsonEdit(r,contractPath,c=>delete c.files['verification/stable-suites/provenance-loader.cjs']),'stable-contract-dependencies');
for(const f of [stable,'verification/run-tests-v301.cjs','verification/parameterized-pilot/vm-environment-provenance.cjs','verification/stable-suites/provenance-loader.cjs','verification/stable-suites/purchase-funding.cjs'])test2('missing dependency '+f,rm(f),'read:'+f);
test2('dependency bytes mismatch',edit('verification/stable-suites/purchase-funding.cjs','DO NOT','NEVER'),'stable-dependency-hash:');
test2('invalid dependency digest',r=>jsonEdit(r,contractPath,c=>c.files[stable]='invalid'),'stable-dependency-schema:');
test2('unsafe dependency path',r=>jsonEdit(r,contractPath,c=>c.files['../outside']=hash('outside')),'stable-dependency-schema:');
test2('old README command',edit('README.md','node '+stable,'node verification/run-tests-v301.cjs'),'current-runner-command');
test2('old README link',edit('README.md',']('+stable+')','](verification/run-tests-v301.cjs)'),'current-runner-link');
test2('extra stable README link',edit('README.md','见[本版]('+stable+')','见[本版]('+stable+') [duplicate]('+stable+')'),'current-runner-link');
test2('old current entry rejected',edit('CURRENT_VERIFICATION_ENTRY.md','node verify-development.cjs','node verification/run-tests-v301.cjs'),'current-entry-command:');
test2('stable runner options rejected',edit('CURRENT_VERIFICATION_ENTRY.md','node verify-development.cjs','node '+stable+' --check-only'),'current-entry-command:');
test('schema1 fixed stable runner rejected',r=>jsonEdit(r,'current-verification.json',m=>m.runner=stable),'manifest-schema');
console.log(JSON.stringify({passed:results.length,failed:0,results,scope:'Private temporary fixtures and relocated CLI; every inspected package remains byte-identical; runner fixtures intentionally throw if executed.'},null,2));
}finally{fs.rmSync(temp,{recursive:true,force:true})}
