'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=__dirname,hash=x=>crypto.createHash('sha256').update(x).digest('hex');
function run(suiteId,mutationId=null){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'current-suite-manifest.json'))),spec=manifest.suites[suiteId];
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'red-pilot-run-')),evidencePath=path.join(dir,'evidence.json');
 const child=cp.spawnSync(process.execPath,[path.join(root,spec.module)],{env:{...process.env,RED_PILOT_MUTATION:mutationId||'',RED_PILOT_EVIDENCE:evidencePath},encoding:'utf8',timeout:120000,maxBuffer:16*1024*1024});
 const evidence=fs.existsSync(evidencePath)?JSON.parse(fs.readFileSync(evidencePath)):null;
 fs.rmSync(dir,{recursive:true,force:true});
 return {child,evidence};
}
function positive(suiteId){const {child,evidence}=run(suiteId);assert.ifError(child.error);assert.equal(child.signal,null);assert.equal(child.status,0,child.stderr);assert.equal(evidence?.completed,true);const manifest=JSON.parse(fs.readFileSync(path.join(root,'current-suite-manifest.json'))),spec=manifest.suites[suiteId];assert.deepEqual(evidence.started,spec.scenarios,'runner complete scenario inventory');for(const role of ['candidate','reference']){const entry=role==='candidate'?manifest.candidate:manifest.references[spec.reference],raw=fs.readFileSync(path.resolve(root,entry.path)),script=[...raw.toString('utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];assert.equal(hash(raw),entry.sha256,'runner raw identity');assert.equal(script.length,1);for(const scenario of spec.scenarios){const loads=evidence.loads.filter(l=>l.role===role&&l.scenario===scenario);assert.equal(loads.length,1,'runner exactly one role load per scenario');for(const load of loads){assert.equal(load.compiled,true);assert.equal(load.sourceHash,entry.sha256,'runner compiled source');assert.equal(load.scriptHash,hash(script[0][1]),'runner compiled script');assert.equal(load.suiteId,suiteId)}}}return {result:JSON.parse(child.stdout),evidence}}
function classifyNegative(out,mutation){
 const {child,evidence}=out;
 if(child.error||child.signal||child.status!==1)return 'INVALID_PROCESS';
 if(!evidence||evidence.completed||evidence.failure?.code!=='ERR_ASSERTION'||evidence.failure?.name!=='AssertionError')return 'INVALID_INFRASTRUCTURE';
 if(evidence.failure.message!==mutation.expectedMessage)return 'INVALID_ASSERTION';
 if(evidence.scenario!==mutation.expectedScenario)return 'INVALID_SCENARIO';
 if(!evidence.mutation||evidence.mutation.id!==mutation.id)return 'INVALID_REGISTRATION';
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'current-suite-manifest.json'))),descriptorRaw=fs.readFileSync(path.join(root,manifest.mutations.path)),registered=JSON.parse(descriptorRaw).mutations.find(m=>m.id===mutation.id&&m.suiteId===mutation.suiteId);if(hash(descriptorRaw)!==manifest.mutations.sha256||!registered||JSON.stringify(registered)!==JSON.stringify(mutation)||evidence.mutation.descriptorHash!==hash(JSON.stringify(registered))||evidence.suiteId!==mutation.suiteId||evidence.suiteHash!==manifest.suites[mutation.suiteId].sha256)return 'INVALID_REGISTRATION';const raw=fs.readFileSync(path.resolve(root,manifest.candidate.path),'utf8');if(raw.split(mutation.anchor).length-1!==mutation.expectedOccurrences)return 'INVALID_REGISTRATION';const mutated=raw.replace(mutation.anchor,mutation.replacement),script=[...mutated.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];if(script.length!==1||evidence.mutation.originalHash!==hash(raw)||evidence.mutation.mutatedHash!==hash(mutated)||evidence.expected.candidate!==hash(mutated))return 'INVALID_REGISTRATION';if(!evidence.loads.some(l=>l.role==='candidate'&&l.scenario===mutation.expectedScenario&&l.sourceHash===hash(mutated)&&l.scriptHash===hash(script[0][1])))return 'INVALID_VM_PROVENANCE';
 if(!evidence.loads.some(l=>l.compiled&&l.role==='candidate'&&l.scenario===mutation.expectedScenario&&l.sourceHash===evidence.mutation.mutatedHash&&l.sourceHash!==evidence.mutation.originalHash))return 'INVALID_VM_PROVENANCE';
 const spec=manifest.suites[mutation.suiteId],ref=manifest.references[spec.reference],referenceRaw=fs.readFileSync(path.resolve(root,ref.path)),referenceScripts=[...referenceRaw.toString('utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];if(hash(referenceRaw)!==ref.sha256||referenceScripts.length!==1||evidence.expected.reference!==ref.sha256)return 'INVALID_REFERENCE';
 const sceneLoads=evidence.loads.filter(l=>l.scenario===mutation.expectedScenario);if(sceneLoads.length!==2||sceneLoads[0].role!=='candidate'||sceneLoads[1].role!=='reference'||sceneLoads.some(l=>l.suiteId!==mutation.suiteId||!l.compiled))return 'INVALID_VM_PROVENANCE';
 if(sceneLoads[1].sourceHash!==ref.sha256||sceneLoads[1].scriptHash!==hash(referenceScripts[0][1]))return 'INVALID_REFERENCE';
 return 'DETECTED_BEHAVIOR';
}
function main(){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'current-suite-manifest.json'))),required=['order-display-writes','selection-filter-writes'];assert.deepEqual(Object.keys(manifest.suites),required,'complete required suite registry');
 const results=[];
 for(const suiteId of required){const current=positive(suiteId),spec=manifest.suites[suiteId];
  const original=cp.spawnSync(process.execPath,[path.resolve(root,spec.historical.path)],{encoding:'utf8',timeout:120000,maxBuffer:16*1024*1024});assert.ifError(original.error);assert.equal(original.signal,null);assert.equal(original.status,0,original.stderr);assert.deepEqual(current.result,JSON.parse(original.stdout),'exact old/new semantic result '+suiteId);
  results.push({suiteId,...current,historicalComparison:'exact result equality, startup/provenance only changed'});
 }
 const mutations=JSON.parse(fs.readFileSync(path.join(root,manifest.mutations.path))).mutations,negative=[];
 for(const mutation of mutations){const out=run(mutation.suiteId,mutation.id),classification=classifyNegative(out,mutation);assert.equal(classification,'DETECTED_BEHAVIOR',mutation.id+': '+out.child.stderr);negative.push({id:mutation.id,suiteId:mutation.suiteId,classification,expectedMessage:mutation.expectedMessage,evidence:out.evidence})}
 const report={candidateSha256:manifest.candidate.sha256,normal:results,negative,scope:'Two-family pilot only; frozen default aggregate unchanged; exact existing semantic outputs retained.'};
 fs.writeFileSync(path.join(root,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({normal:results.map(r=>({suiteId:r.suiteId,passed:r.result.passed,assertions:r.result.assertions})),negative:negative.length},null,2));
}
if(require.main===module)main();module.exports={run,positive,classifyNegative};
