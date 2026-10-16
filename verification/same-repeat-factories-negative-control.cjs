'use strict';
// Exact single-boundary temporary source mutations; healthy fixtures must pass first.
// Synthetic VM evidence only. No browser, native event, persistence or network execution.
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const source=path.join(__dirname,'../index.html'),focused=path.join(__dirname,'same-repeat-factories.cjs');
const html=fs.readFileSync(source,'utf8'),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const SOURCE_HASH='7d7e7e84d404be3af143e5c3c17527197e415e38192d1653543041f4e1e59b9b';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'red-same-repeat-negative-')),file=path.join(dir,'index.html');
function run(text){fs.writeFileSync(file,text);const p=spawnSync(process.execPath,[focused,file,hash(text)],{encoding:'utf8',maxBuffer:8*1024*1024,timeout:120000});if(p.error)throw p.error;assert.equal(p.signal,null,'focused runner must exit normally');let report;try{report=JSON.parse(p.stdout)}catch(e){throw new Error('Focused runner did not emit a JSON report: '+p.stderr+'\n'+p.stdout,{cause:e})}assert.equal(report.results.length,57,'all named fixtures must execute');assert.equal(report.results.filter(x=>x.passed).length,report.passed);assert.equal(report.results.filter(x=>!x.passed).length,report.failed);assert.equal(report.passed+report.failed,57);return{status:p.status,report}}
const target=(test,stage,invariant)=>({test,stage,invariant});
const active=target('active local type tank','action','world_exactly_unchanged');
const order=target('current configuration ignores paid order type origin and occupancy','action','world_exactly_unchanged');
const pending='successful selection clears pending input ordinaryCommandMode=true;appendCommandMode=true;ordinaryCommandGesture={pointerId:55,battle:state,start:{x:1,y:2},moved:false};ordinaryCommandActivation={battle:state,kind:"pointer",pointerId:55,canceled:false};appendCommandActivation={battle:state,kind:"key",key:"Enter",canceled:false};factoryExitActivation={battle:state,canceled:false};selectionClickCandidate={id:4};lastSelectionClick=4;doubleClickSelection=true';
const anchorBoundary='function sameRepeatFactoriesView(){let anchor=factorySpawnCheckFactory(),type=';
function anchorMutation(name,body,test){return{name,before:anchorBoundary,after:'function sameRepeatFactoriesView(){let anchor=(()=>{'+body+'})(),type=',targets:[target('invalid seed '+test,'render','invalid_seed_disabled')]}}
const selectionBoundary='resetSelectionClicks();selection=new Set(view.factories.map(e=>e.id));';
function actionMutation(name,insert,expected=active){return{name,before:selectionBoundary,after:selectionBoundary+insert,targets:[expected]}}
const cohortBoundary="factories:structures(0,'factory').filter(e=>!e.build&&factoryRepeatType(e)===type)";
const mutations=[
 {name:'ignore exact current local type match',before:cohortBoundary,after:"factories:structures(0,'factory').filter(e=>!e.build)",targets:[target('active local type tank','render','exact_label')]},
 {name:'off seed borrows global repeat type',before:'type=factoryRepeatType(anchor);if(!anchor||type===\'off\')return null;',after:'type=factoryRepeatType(anchor)===\'off\'?(state.repeatProduction||"off"):factoryRepeatType(anchor);if(!anchor||type===\'off\')return null;',targets:[target('off seed cannot borrow global or peer settings','render','off_seed_disabled')]},
 anchorMutation('accept multiple selected seeds','let e=get(selection.values().next().value);return e&&e.team===0&&e.type===\'factory\'&&!e.build?e:null','selection=new Set([4,peer.id])'),
 anchorMutation('accept dead seed','if(selection.size!==1)return null;let e=state.entities.find(e=>e.id===selection.values().next().value);return e&&e.team===0&&e.type===\'factory\'&&!e.build?e:null','seed.hp=0'),
 anchorMutation('accept enemy seed','if(selection.size!==1)return null;let e=get(selection.values().next().value);return e&&e.type===\'factory\'&&!e.build?e:null','seed.team=1'),
 anchorMutation('accept unfinished seed','if(selection.size!==1)return null;let e=get(selection.values().next().value);return e&&e.team===0&&e.type===\'factory\'?e:null','seed.build=1'),
 {name:'include dead peer',before:cohortBoundary,after:"factories:state.entities.filter(e=>e.team===0&&e.type==='factory'&&!e.build&&factoryRepeatType(e)===type)",targets:[target('only seed after peer exclusion peer.hp=0','render','one_match_disabled')]},
 {name:'include enemy peer',before:cohortBoundary,after:"factories:state.entities.filter(e=>e.hp>0&&e.type==='factory'&&!e.build&&factoryRepeatType(e)===type)",targets:[target('only seed after peer exclusion peer.team=1','render','one_match_disabled')]},
 {name:'include unfinished peer',before:cohortBoundary,after:"factories:structures(0,'factory').filter(e=>factoryRepeatType(e)===type)",targets:[target('only seed after peer exclusion peer.build=1','render','one_match_disabled')]},
 {name:'allow single match to clear pending input',before:'if(!view||view.factories.length<2)return;resetSelectionClicks();',after:'if(!view||view.factories.length<1)return;resetSelectionClicks();',targets:[target('one match preserves pending input','action','exact_noop')]},
 {name:'enable button for single match',before:"setReadonlyPanelProperty(button,'disabled',commandBlocked()||count<2);",after:"setReadonlyPanelProperty(button,'disabled',commandBlocked()||count<1);",targets:[target('only seed after peer exclusion peer.hp=0','render','one_match_disabled')]},
 ...[
  ['started','state.started=false','if(!!state.result||restartPrompt)return;'],
  ['result','state.result="测试结束"','if(!state.started||restartPrompt)return;'],
  ['restart','restartPrompt=true','if(!state.started||!!state.result)return;']
 ].map(([name,setup,gate])=>({name:'ignore '+name+' command gate',before:'function selectSameRepeatFactories(){if(commandBlocked())return;',after:'function selectSameRepeatFactories(){'+gate,targets:[target('blocked lifecycle '+setup,'action','exact_noop')]})),
 {name:'reuse stale cached cohort instead of revalidating current configuration',before:'function sameRepeatFactoriesView(){',after:'function sameRepeatFactoriesView(){return sameRepeatFactoriesView.cached||(sameRepeatFactoriesView.cached=uncachedSameRepeatFactoriesView())}function uncachedSameRepeatFactoriesView(){',targets:[
  target('stale rendered enabled button peer.hp=0','action','stale_revalidation_noop'),
  target('stale rendered enabled button seed.hp=0','action','stale_revalidation_noop'),
  target('stale rendered enabled button seed.factoryRepeatType="off"','action','stale_revalidation_noop'),
  target('stale rendered enabled button peer.factoryRepeatType="scout"','action','stale_revalidation_noop'),
  target('setting changed after render selects current cohort','action','selection_and_input_only'),
  target('newly completed matching factory participates at click','action','selection_and_input_only'),
  target('selected anchor changes after render','action','selection_and_input_only')
 ]},
 actionMutation('charge funds during selection','state.cash--;'),
 actionMutation('discard paid orders during selection','state.queue.length=0;',order),
 actionMutation('overwrite local repeat type during selection','view.anchor.factoryRepeatType="off";'),
 actionMutation('overwrite local quantity target during selection','view.anchor.factoryRepeatTarget=0;',order),
 actionMutation('overwrite global repeat setting during selection','state.repeatProduction="off";',order),
 actionMutation('replace queue identity despite equal serialized state','state.queue=state.queue.slice();',target('active local type tank','action','references_preserved')),
 {name:'reverse stable entity selection order',before:selectionBoundary,after:'resetSelectionClicks();selection=new Set(view.factories.slice().reverse().map(e=>e.id));',targets:[target('stable current entity order includes seed','action','selection_and_input_only')]},
 ...[
  ['placement','placement=null;','placement="power"'],
  ['attack','attackMode=false;','attackMode=true'],
  ['drag','drag=null;','drag={start:{x:100,y:100},end:{x:120,y:120}}']
 ].map(([name,statement,setup])=>({name:'retain pending '+name+' input',before:selectionBoundary+'placement=null;attackMode=false;drag=null;',after:selectionBoundary+'placement=null;attackMode=false;drag=null;'.replace(statement,''),targets:[target('successful selection clears pending input '+setup,'action','selection_and_input_only')]})),
 {name:'skip pending command and activation cleanup',before:'function clearOrdinaryCommand(){clearOrdinaryPreviewMirror();',after:'function clearOrdinaryCommand(){return;clearOrdinaryPreviewMirror();',targets:[target(pending,'action','selection_and_input_only')]},
 {name:'misreport matching factory count',before:'function updateSameRepeatFactories(){let view=sameRepeatFactoriesView(),count=view?.factories.length||0,',after:'function updateSameRepeatFactories(){let view=sameRepeatFactoriesView(),count=(view?.factories.length||0)+1,',targets:[target('active local type tank','render','exact_label')]},
 {name:'mislabel current local vehicle type',before:"'选择同循环车型工厂'+(view?'（'+defs[view.type].name+'）':'')",after:"'选择同循环车型工厂'+(view?'（'+'错误车型'+'）':'')",targets:[target('active local type tank','render','exact_label')]},
 {name:'mutate world while rendering read-only control',before:'function updateSameRepeatFactories(){let view=',after:'function updateSameRepeatFactories(){state.cash--;let view=',targets:[target('render and query are read only','render','readonly')]},
 {name:'allow repeated Enter activation',before:"$('selectSameRepeatFactories').onkeydown=e=>{if(e.key==='Enter'&&e.repeat&&!e.isComposing&&e.keyCode!==229)",after:"$('selectSameRepeatFactories').onkeydown=e=>{if(e.key==='Enter'&&false&&!e.isComposing&&e.keyCode!==229)",targets:[target('keyboard "Enter" repeat true','keyboard','repeat_enter_suppressed')]},
 {name:'consume composing repeated Enter',before:"$('selectSameRepeatFactories').onkeydown=e=>{if(e.key==='Enter'&&e.repeat&&!e.isComposing&&e.keyCode!==229)",after:"$('selectSameRepeatFactories').onkeydown=e=>{if(e.key==='Enter'&&e.repeat&&e.keyCode!==229)",targets:[target('IME repeat not consumed {"isComposing":true}','keyboard','ime_not_consumed')]},
 {name:'consume keyCode 229 repeated Enter',before:"$('selectSameRepeatFactories').onkeydown=e=>{if(e.key==='Enter'&&e.repeat&&!e.isComposing&&e.keyCode!==229)",after:"$('selectSameRepeatFactories').onkeydown=e=>{if(e.key==='Enter'&&e.repeat&&!e.isComposing)",targets:[target('IME repeat not consumed {"keyCode":229}','keyboard','ime_not_consumed')]}
];
try{
 assert.equal(hash(html),SOURCE_HASH,'packaged source digest');
 const healthy=run(html);assert.equal(healthy.status,0,'healthy runner exit');assert.equal(healthy.report.failed,0,'healthy runner failures');assert.equal(healthy.report.passed,57,'healthy 57-case prerequisite');
 assert.equal(new Set(healthy.report.results.map(x=>x.name)).size,57,'unique named healthy fixtures');
 const results=[];
 for(const mutation of mutations){
  const result={name:mutation.name,expectedTargets:mutation.targets,detected:false};
  try{
   assert.equal(html.split(mutation.before).length-1,1,mutation.name+' exact single boundary');
   assert.notEqual(mutation.before,mutation.after,mutation.name+' must change source');
   for(const t of mutation.targets)assert.equal(healthy.report.results.find(x=>x.name===t.test)?.passed,true,mutation.name+' healthy named target: '+t.test);
   const modified=html.replace(mutation.before,mutation.after),runResult=run(modified);assert.notEqual(hash(modified),SOURCE_HASH);assert.equal(runResult.status,1,mutation.name+' must fail focused runner');
   const sourceIdentity=runResult.report.results.find(x=>x.name==='source identity');assert.equal(sourceIdentity?.passed,true,mutation.name+' supplied mutated source digest');
   for(const failure of runResult.report.results.filter(x=>!x.passed)){assert.equal(failure.failure?.code,'ERR_ASSERTION',mutation.name+' must not count runtime/setup errors: '+failure.name);assert.notEqual(failure.failure.stage,'setup',mutation.name+' must not count setup assertion failure: '+failure.name);assert.ok(failure.failure.stage&&failure.failure.invariant,mutation.name+' labeled invariant: '+failure.name)}
   for(const t of mutation.targets){const failure=runResult.report.results.find(x=>x.name===t.test);assert.equal(failure?.passed,false,mutation.name+' exact named test: '+t.test);assert.deepEqual(failure.failure,{stage:t.stage,invariant:t.invariant,code:'ERR_ASSERTION'},mutation.name+' exact phase/invariant: '+t.test)}
   result.detected=true;result.mutatedSourceSha256=hash(modified);result.focusedFailures=runResult.report.failed;
  }catch(error){result.error=error.stack}
  results.push(result);
 }
 assert.equal(hash(fs.readFileSync(source)),SOURCE_HASH,'packaged source must remain unchanged');
 const failed=results.filter(x=>!x.detected).length;
 console.log(JSON.stringify({passed:results.length-failed,failed,healthyPassed:healthy.report.passed,healthyAssertions:healthy.report.assertions,sourceSha256:SOURCE_HASH,targetAssertions:results.filter(x=>x.detected).reduce((sum,x)=>sum+x.expectedTargets.length,0),results,scope:'Healthy 57-case prerequisite and exact named phase/invariant ERR_ASSERTION mutation controls. Every mutant replaces one unique source boundary in a temporary directory; all fixtures execute and setup/runtime failures are rejected. Synthetic VM only; no native browser/event, persistence, network or natural construction execution.'},null,2));if(failed)process.exitCode=1;
}finally{fs.rmSync(dir,{recursive:true,force:true})}
