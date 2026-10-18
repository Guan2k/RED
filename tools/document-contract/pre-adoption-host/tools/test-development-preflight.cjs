'use strict';
// Tool tests only. Synthetic children never execute gameplay or persistence actions.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {test}=require('node:test'),{spawnSync}=require('node:child_process');
const ROOT=path.dirname(__dirname),{run}=require('../verify-development.cjs');
function calls(args=[],results=[]){const seen=[],logs=[];const status=run(args,{spawn:(exe,cmd,opts)=>{seen.push({exe,cmd,opts});const r=results.shift();if(r instanceof Error)throw r;return r===undefined?{status:0}:r},log:s=>logs.push(s),error:s=>logs.push(s)});return{status,seen,logs}}
const expected=[['verify-current.cjs','--check-only'],['tools/source-build.mjs','--check'],['--test','tools/source-build.test.mjs'],['--test','tools/building-art-data.test.mjs'],['verify-current.cjs']];
test('normal exact ordered stages, explicit cwd and no shell',()=>{const r=calls();assert.equal(r.status,0);assert.deepEqual(r.seen.map(x=>x.cmd),expected);for(const x of r.seen){assert.equal(x.exe,process.execPath);assert.deepEqual(x.opts,{cwd:ROOT,shell:false,stdio:'inherit'})}});
test('check-only never launches canonical aggregate',()=>{const r=calls(['--check-only']);assert.equal(r.status,0);assert.deepEqual(r.seen.map(x=>x.cmd),expected.slice(0,4));assert.match(r.logs.at(-1),/not executed/)});
for(const a of [['--write-generated'],['--recover-receipt'],['--check-only','extra'],['--legacy'],['--long'],['--help']])test('reject arguments '+a.join(' '),()=>{const r=calls(a);assert.equal(r.status,1);assert.equal(r.seen.length,0)});
for(let stage=0;stage<5;stage++)for(const failure of [{status:7},{signal:'SIGTERM',status:null},{error:new Error('ENOENT')},{status:null},{status:-1},new Error('spawn exception')])test('fail fast stage '+stage+' '+(failure.message||failure.error?.message||failure.signal||failure.status),()=>{const r=calls([],Array(stage).fill({status:0}).concat(failure));assert.equal(r.status,failure.status===7?7:1);assert.equal(r.seen.length,stage+1);assert.ok(!r.logs.at(-1).endsWith('verification passed.'))});
function fixture(fn){const root=fs.mkdtempSync(path.join(os.tmpdir(),'red-dev-preflight-test-'));try{fs.mkdirSync(path.join(root,'tools'));fs.copyFileSync(path.join(ROOT,'verify-development.cjs'),path.join(root,'verify-development.cjs'));return fn(root)}finally{fs.rmSync(root,{recursive:true,force:true})}}
function stub(root,name,label,fail){fs.writeFileSync(path.join(root,name),`const fs=require('node:fs');fs.appendFileSync(${JSON.stringify(path.join(root,'order.txt'))},${JSON.stringify(label)}+'\\n');${fail?'process.exit(9);':''}`)}
function launch(root,args=[]){const env={...process.env};delete env.NODE_TEST_CONTEXT;return spawnSync(process.execPath,[path.join(root,'verify-development.cjs'),...args],{cwd:os.tmpdir(),encoding:'utf8',shell:false,env})}
for(const fail of ['none','integrity','source','builder','data','game'])test('real child chain '+fail+' from unrelated cwd',()=>fixture(root=>{
 fs.writeFileSync(path.join(root,'verify-current.cjs'),`const fs=require('node:fs');const s=process.argv.includes('--check-only')?'integrity':'game';fs.appendFileSync(${JSON.stringify(path.join(root,'order.txt'))},s+'\\n');if(s===${JSON.stringify(fail)})process.exit(9);`);
 stub(root,'tools/source-build.mjs','source',false);
 // mjs uses ESM, while the node --test fixture uses CJS by filename.
 fs.writeFileSync(path.join(root,'tools/source-build.mjs'),`import fs from 'node:fs';fs.appendFileSync(${JSON.stringify(path.join(root,'order.txt'))},'source\\n');${fail==='source'?'process.exit(9)':''}`);
 fs.writeFileSync(path.join(root,'tools/source-build.test.mjs'),`import fs from 'node:fs';fs.appendFileSync(${JSON.stringify(path.join(root,'order.txt'))},'builder\\n');${fail==='builder'?'process.exit(9)':''}`);
 fs.writeFileSync(path.join(root,'tools/building-art-data.test.mjs'),`import fs from 'node:fs';fs.appendFileSync(${JSON.stringify(path.join(root,'order.txt'))},'data\\n');${fail==='data'?'process.exit(9);':''}`);
 const result=launch(root);assert.equal(result.status,fail==='none'?0:['builder','data'].includes(fail)?1:9,result.stderr);const order=fs.readFileSync(path.join(root,'order.txt'),'utf8').trim().split('\n');const stages=['integrity','source','builder','data','game'];assert.deepEqual(order,fail==='none'?stages:stages.slice(0,stages.indexOf(fail)+1));
}));
for(const drift of ['source','artifact','receipt'])test('real builder '+drift+' drift prevents builder tests and game',()=>fixture(root=>{
 for(const n of ['index.html','source-build-receipt.json','tools/source-build.mjs','src/index.template.html','src/styles.css','src/geometry.mjs','src/script/01-bootstrap.jsfrag','src/script/02-gameplay.jsfrag','src/script/03-renderer.jsfrag','src/script/04-interface-runtime.jsfrag','src/art/buildings.mjs']){fs.mkdirSync(path.dirname(path.join(root,n)),{recursive:true});fs.copyFileSync(path.join(ROOT,n),path.join(root,n))}
 fs.appendFileSync(path.join(root,drift==='source'?'src/styles.css':drift==='artifact'?'index.html':'source-build-receipt.json'),drift==='receipt'?'invalid':'\n/* drift */');
 stub(root,'verify-current.cjs','integrity-or-game',false);stub(root,'tools/source-build.test.mjs','builder',false);
 const before=fs.readFileSync(path.join(root,'index.html'));const result=launch(root);assert.equal(result.status,1);assert.match(result.stderr,/drift|JSON|Unexpected|non-whitespace/i);assert.equal(fs.readFileSync(path.join(root,'order.txt'),'utf8'),'integrity-or-game\n');assert.deepEqual(fs.readFileSync(path.join(root,'index.html')),before);
}));
test('real invalid art data passes syntax assembly but prevents game at data stage',()=>fixture(root=>{
 const names=['index.html','source-build-receipt.json','tools/source-build.mjs','tools/building-art-data.test.mjs','tools/building-art-data-validation.mjs','src/index.template.html','src/styles.css','src/geometry.mjs','src/script/01-bootstrap.jsfrag','src/script/02-gameplay.jsfrag','src/script/03-renderer.jsfrag','src/script/04-interface-runtime.jsfrag','src/art/buildings.mjs'];
 for(const n of names){fs.mkdirSync(path.dirname(path.join(root,n)),{recursive:true});fs.copyFileSync(path.join(ROOT,n),path.join(root,n))}
 const art=path.join(root,'src/art/buildings.mjs');fs.writeFileSync(art,fs.readFileSync(art,'utf8').replace('#75977c','not-a-hex-color'));
 const built=spawnSync(process.execPath,[path.join(root,'tools/source-build.mjs'),'--write-generated'],{encoding:'utf8'});assert.equal(built.status,0,built.stderr);
 stub(root,'verify-current.cjs','integrity-or-game',false);fs.writeFileSync(path.join(root,'tools/source-build.test.mjs'),`import fs from 'node:fs';fs.appendFileSync(${JSON.stringify(path.join(root,'order.txt'))},${JSON.stringify('builder\n')});`);
 const result=launch(root);assert.equal(result.status,1);assert.match(result.stdout,/hex|color|building art/i);assert.equal(fs.readFileSync(path.join(root,'order.txt'),'utf8'),'integrity-or-game\nbuilder\n');
}));
