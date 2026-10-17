'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const source=path.resolve(process.argv[2]||path.join(__dirname,'../index.html')),log=path.resolve(process.argv[3]||path.join(__dirname,'mixed-ui-v280-results.json')),original=JSON.parse(fs.readFileSync(log,'utf8')),dir=fs.mkdtempSync(path.join(os.tmpdir(),'red-mixed-log-negative-'));
const tests=[
 ['empty records',r=>r.records=[],'exactly three scenario records'],
 ['duplicate scenario',r=>r.records[1]=r.records[0],'unique ordered scenario set'],
 ['unknown root field',r=>r.payload='state.cash=1','saved log exact keys'],
 ['unknown record field',r=>r.records[0].payload='state.cash=1','scenario record exact keys'],
 ['unknown macro field',r=>r.records[0].log[0].payload='state.cash=1','macro exact keys'],
 ['unknown summary field',r=>r.results[0].payload=1,'result summary exact keys'],
 ['unknown coverage field',r=>r.records[0].coverage.save=1,'coverage exact keys'],
 ['unknown feature count field',r=>r.records[0].featureResults.coordinateCommandExecute.other=1,'feature counts exact keys'],
 ['false coverage count',r=>r.records[0].coverage.start=999,'summary derived from operations'],
 ['false result summary',r=>r.results[0].operations=999,'saved result summaries match records'],
 ['empty operations',r=>r.records[0].log[0].operations=[],'bounded macro operations'],
 ['empty second battle queue',r=>r.records[0].queueCheckpointsByBattle[1]=0,'nonempty queue in each battle'],
 ['false battle queue count',r=>{r.records[0].queueCheckpointsByBattle[1]++;r.results[0].queueCheckpointsByBattle[1]++},'recorded queues by battle'],
 ['missing post success',r=>r.records[0].featureResults.selectPostTroops3.success=0,'each feature actually succeeds'],
 ['forbidden keyboard',r=>{r.records[0].log[0].operations[0]={kind:'key',key:'F5'}},'whitelisted keyboard'],
 ['missing concrete target',r=>{r.records[0].log[0].operations[0]={kind:'map',x:10,y:10}},'map exact keys'],
 ['unknown expected result field',r=>{r.records[0].log[1].operations.find(o=>o.expectedFeatureResult).expectedFeatureResult.code='state.cash=1'},'feature result exact keys'],

 ['unknown operation',r=>r.records[0].log[0].operations[0].kind='eval','whitelisted operation'],
 ['forbidden button',r=>r.records[0].log[0].operations.find(o=>o.kind==='button').id='save','whitelisted button'],
 ['unknown field',r=>r.records[0].log[0].operations[0].id='unknownField','whitelisted field'],
 ['extra executable property',r=>r.records[0].log[0].operations[0].code='state.cash=1','no unknown operation properties'],
 ['invalid step',r=>r.records[0].log[1].operations.find(o=>o.kind==='step').seconds=100,'bounded simulation step'],
 ['macro substitution',r=>r.records[0].log[0].name='arbitrary macro','fixed macro identity'],
 ['false accepted result',r=>{const o=r.records[0].log[1].operations.find(o=>o.expectedFeatureResult);const old=o.expectedFeatureResult.success;o.expectedFeatureResult.success=!old;for(const rec of [r.records[0],r.results[0]]){rec.featureResults[o.id][old?'success':'rejected']--;rec.featureResults[o.id][old?'rejected':'success']++}},'recorded success/rejection exactly replayed'],
 ['false world hash',r=>r.records[0].log[0].worldHash='0'.repeat(64),'exact logged macro replay'],
 ['missing feature result',r=>delete r.records[0].log[1].operations.find(o=>o.expectedFeatureResult).expectedFeatureResult,'feature result required']
];
const results=[];for(const[name,mutate,expected]of tests){const data=JSON.parse(JSON.stringify(original));mutate(data);const file=path.join(dir,results.length+'.json');fs.writeFileSync(file,JSON.stringify(data));const p=spawnSync(process.execPath,[path.join(__dirname,'mixed-ui.cjs'),source,'--replay',file],{encoding:'utf8',maxBuffer:2e6});assert.equal(p.error,undefined);assert.notEqual(p.status,0,name);assert.ok(p.stderr.includes(expected),name+': expected targeted validation failure, got '+p.stderr);results.push({name,detected:true,expected});}fs.rmSync(dir,{recursive:true,force:true});console.log(JSON.stringify({passed:results.length,failed:0,results,scope:'Malformed/tampered log negative controls. Failure must match the named schema/result/hash assertion; arbitrary setup errors do not count. These are replay-verifier controls, not game-product mutations.'},null,2));
