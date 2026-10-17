'use strict';
// Current candidate behavior and exact historical identity checks stay separate.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const manifest=require('./v272-host-manifest.json'),restore=require('./restore-v272.cjs');
const source=path.resolve(__dirname,'../index.html'),html=fs.readFileSync(source,'utf8'),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const historical=restore(html),digest=hash(html);assert.equal(hash(historical),manifest.sourceSha256);
assert.throws(()=>restore(html+'\n'),{code:'ERR_ASSERTION'});assert.throws(()=>restore(html.replace('hoverActive=false;invalidateCoordinatePointer();','hoverActive=true;invalidateCoordinatePointer();')),{code:'ERR_ASSERTION'});
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'red-v273-verification-')),host=path.join(temp,'RED'),verify=path.join(host,'verification');
const passed=t=>t.passed===true||t.status==='pass',failed=t=>t.passed===false||t.status==='fail';
function run(script,args){const p=spawnSync(process.execPath,[script,...args],{encoding:'utf8',maxBuffer:16*1024*1024});if(p.error)throw p.error;assert.equal(p.signal,null,'test terminated by signal');assert.equal(p.stderr,'','unexpected test stderr');let report=JSON.parse(p.stdout);assert.ok(Number.isInteger(report.passed)&&Number.isInteger(report.failed));const cases=report.results||report.tests;assert.ok(Array.isArray(cases));assert.equal(cases.filter(passed).length,report.passed);assert.equal(cases.filter(failed).length,report.failed);assert.equal(cases.length,report.passed+report.failed);assert.equal(new Set(cases.map(t=>t.name)).size,cases.length,'duplicate case name');assert.equal(p.status,report.failed?1:0,'exit status must match test failures');return{report,cases}}
const sourceChecks={
 'repair-button-repeat.cjs':['source identity','packaged exact two-boundary delta and restoration guards'],
 'attack-pressed.cjs':['source identity','packaged exact three-boundary delta and restoration guards'],
 'same-repeat-factories.cjs':['source identity'],'control-group-add.cjs':['source identity'],'attack-tail-help.cjs':['source identity'],
 'delivery-refinery-selection.cjs':['strict_source_hash','source_bytes_unchanged_after_all_cases'],'queue-remainder.cjs':['source_file_unchanged']
};
const summary={sourceSha256:digest,current:[],historicalIdentity:[],focused:[],inheritedSourceChecks:0,inheritedBehaviorAndMarkup:0,legacyFullSuite:null,scope:'Current-source VM behavior/markup and source checks are counted separately from exact restored-v272 identities. Fifteen old source gates intentionally reject v273; only the frozen case name, failure shape and error first line are allowed. No browser or save/load/import/export execution.'};
try{
 fs.mkdirSync(verify,{recursive:true});fs.writeFileSync(path.join(host,'index.html'),historical);
 for(const [name,digest]of Object.entries(manifest.files)){assert.ok(!path.isAbsolute(name)&&!name.split('/').includes('..'),'safe baseline path');const bytes=fs.readFileSync(path.join(__dirname,name));assert.equal(hash(bytes),digest,'unchanged v272 verification file '+name);fs.mkdirSync(path.dirname(path.join(verify,name)),{recursive:true});fs.writeFileSync(path.join(verify,name),bytes)}
 for(const script of ['map-pointer-geometry.cjs','map-pointer-geometry-negative-control.cjs']){
  const p=spawnSync(process.execPath,[path.join(__dirname,script)],{encoding:'utf8',maxBuffer:4*1024*1024});if(p.error)throw p.error;assert.equal(p.status,0,p.stdout+p.stderr);assert.equal(p.stderr,'');const r=JSON.parse(p.stdout);assert.equal(r.failed,0);summary.focused.push({script,passed:r.passed,assertions:r.assertions??null});
 }
 const scripts=[...fs.readFileSync(path.join(verify,'run-tests.cjs'),'utf8').matchAll(/run\('([^']+)', \[source\]/g)].map(m=>m[1]);assert.equal(scripts.length,25);
 for(const script of scripts){const {report,cases}=run(path.join(verify,script),[source,digest]),gate=manifest.gates[script],failures=cases.filter(failed);assert.equal(failures.length,gate?1:0,'unexpected current failure count '+script);
  if(gate){const t=failures[0];assert.equal(t.name,gate.name,'only named historical gate may reject candidate');assert.deepEqual(t.failure??null,gate.failure);assert.equal(t.error.split('\n')[0],gate.errorFirstLine);if(gate.errorFormat==='assertion-stack')assert.ok(t.error.startsWith('AssertionError [ERR_ASSERTION]:'));else{assert.equal(gate.errorFormat,'assertion-message-only');assert.equal(t.failure,undefined);assert.equal(t.error,gate.errorMessage)}
   const baseline=run(path.join(verify,script),[path.join(host,'index.html'),manifest.sourceSha256]);assert.equal(baseline.report.failed,0,'historical host must pass every gate');const counterpart=baseline.cases.find(x=>x.name===gate.name);assert.ok(counterpart&&passed(counterpart),'exact old identity must actually pass');summary.historicalIdentity.push({script,name:gate.name,passed:true,currentRejection:{failure:t.failure??null,errorFirstLine:gate.errorFirstLine,errorFormat:gate.errorFormat}});
  }
  const checks=sourceChecks[script]||[];for(const name of checks)assert.ok(cases.some(t=>t.name===name&&passed(t)),'source check must pass');summary.inheritedSourceChecks+=checks.length;summary.inheritedBehaviorAndMarkup+=report.passed-checks.length;summary.current.push({script,passed:report.passed,historicalIdentityRejections:failures.length});
 }
 assert.equal(summary.historicalIdentity.length,15);
 if(process.argv.includes('--legacy')){const p=spawnSync(process.execPath,[path.join(verify,'run-tests.cjs')],{encoding:'utf8',maxBuffer:16*1024*1024});if(p.error)throw p.error;assert.equal(p.status,0,p.stdout+p.stderr);assert.equal(p.stderr,'');const lines=[...p.stdout.matchAll(/^(.+): (\d+) passed, 0 failed$/gm)];assert.equal(lines.length,65);assert.equal(lines.reduce((n,x)=>n+Number(x[2]),0),1304);summary.legacyFullSuite={groups:65,passed:1304,scope:'Exact restored v272 only, including its separately reported v249 baseline; not v273 behavior coverage.',log:p.stdout};}
 console.log(JSON.stringify(summary,null,2));
}finally{fs.rmSync(temp,{recursive:true,force:true})}
