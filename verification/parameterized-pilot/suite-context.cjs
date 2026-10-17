'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
function infrastructure(message){const e=new Error(message);e.code='PILOT_INFRASTRUCTURE';throw e}
function createContext(suiteId){
 const root=__dirname,manifest=JSON.parse(fs.readFileSync(path.join(root,'current-suite-manifest.json'),'utf8'));
 const spec=manifest.suites[suiteId];if(!spec)infrastructure('unknown suite');
 const evidence={suiteId,scenario:null,started:[],loads:[],completed:false,failure:null};
 const evidencePath=process.env.RED_PILOT_EVIDENCE;if(!evidencePath)infrastructure('evidence destination required');
 const flush=()=>fs.writeFileSync(evidencePath,JSON.stringify(evidence,null,2)+'\n');
 process.on('uncaughtExceptionMonitor',e=>{evidence.failure={name:e.name,code:e.code||null,message:e.message.split('\n')[0],stack:e.stack};flush()});flush();
 const readVerified=entry=>{const file=path.resolve(root,entry.path),bytes=fs.readFileSync(file);if(hash(bytes)!==entry.sha256)infrastructure('integrity mismatch '+entry.path);return bytes};
 if(manifest.schema!==1)infrastructure('manifest schema');
 for(const entry of Object.values(manifest.integrity))readVerified(entry);
 readVerified(spec.historical);
 if(hash(fs.readFileSync(path.join(root,spec.module)))!==spec.sha256)infrastructure('suite module identity');
 const current=readVerified(manifest.candidate),reference=readVerified(manifest.references[spec.reference]);
 if(hash(current)===hash(reference))infrastructure('candidate reference collision');
 let previous=readVerified(manifest.references[manifest.changeFence.previous]).toString('utf8');
 for(const change of manifest.changeFence.changes){if(previous.split(change.before).length-1!==1)infrastructure('change fence occurrence');previous=previous.replace(change.before,change.after)}
 if(previous!==current.toString('utf8'))infrastructure('current change fence mismatch');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'red-pilot-')),baseline=path.join(dir,'reference.html');fs.writeFileSync(baseline,reference);
 let source=path.resolve(root,manifest.candidate.path),candidateBytes=current;
 const mutationId=process.env.RED_PILOT_MUTATION;
 if(mutationId){
  const mutations=JSON.parse(readVerified(manifest.mutations).toString('utf8')).mutations;const mutation=mutations.find(m=>m.id===mutationId&&m.suiteId===suiteId);if(!mutation)infrastructure('unregistered mutant');
  const text=current.toString('utf8');if(text.split(mutation.anchor).length-1!==mutation.expectedOccurrences)infrastructure('mutation anchor mismatch');
  candidateBytes=Buffer.from(text.replace(mutation.anchor,mutation.replacement));if(hash(candidateBytes)===hash(current))infrastructure('mutation unchanged');
  source=path.join(dir,'mutant.html');fs.writeFileSync(source,candidateBytes);evidence.mutation={id:mutationId,originalHash:hash(current),mutatedHash:hash(candidateBytes),descriptorHash:hash(JSON.stringify(mutation))};
 }
 evidence.suiteHash=spec.sha256;evidence.expected={candidate:hash(candidateBytes),reference:hash(reference)};flush();
 const policy=new Map([[source,{role:'candidate',sha256:hash(candidateBytes)}],[baseline,{role:'reference',sha256:hash(reference)}]]);
 const {createLoader}=require('./vm-environment-provenance.cjs');
 const loadGame=createLoader((actualPath,raw,options)=>{
  const allowed=policy.get(actualPath);if(!allowed)infrastructure('unregistered VM source');
  const sourceHash=hash(raw);if(sourceHash!==allowed.sha256)infrastructure('VM bytes identity mismatch');
  if(!evidence.scenario)infrastructure('VM outside scenario');
  const loadIndex=evidence.loads.filter(l=>l.scenario===evidence.scenario).length;if(allowed.role!==['candidate','reference'][loadIndex])infrastructure('VM role order mismatch');
  return{role:allowed.role,sourceHash,scenario:evidence.scenario,seed:options.seed??198199,suiteId};
 },(receipt,script)=>{evidence.loads.push({...receipt,scriptHash:hash(script),compiled:true});flush()});
 return{source,baseline,dir,loadGame,enterScenario(name){if(evidence.started.includes(name))infrastructure('duplicate scenario');if(!spec.scenarios.includes(name))infrastructure('unknown scenario');evidence.scenario=name;evidence.started.push(name);flush()},finish(result){
  assert.deepEqual(evidence.started,spec.scenarios,'required scenario inventory');assert.equal(result.passed,spec.passed,'required case count');assert.equal(result.assertions,spec.assertions,'required assertion count');assert.equal(result.failed,0,'no failed cases');
  for(const scenario of spec.scenarios)for(const role of ['candidate','reference'])if(!evidence.loads.some(l=>l.scenario===scenario&&l.role===role&&l.compiled))infrastructure('missing '+role+' compiled load '+scenario);
  evidence.completed=true;flush();console.log(JSON.stringify(result,null,2));
 }};
}
module.exports={createContext};
