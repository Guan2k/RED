'use strict';
// Whole-source legal gameplay witness: paid construction, natural mining and
// production, and visible UI controls only. No game-state or clock injection.
const nodeAssert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {loadGame}=require('./vm-environment.cjs');
let assertions=0;
const assert=Object.fromEntries(['ok','equal','deepEqual'].map(name=>[name,(...args)=>{assertions++;return nodeAssert[name](...args);} ]));
const SOURCE_HASH='5d8e0f32d62179704ac98c14ab9229ba4725a5080c1379200ce35b99dd765e2d';
const BASELINE_HASH='b2cdc69c32887afd4887e0eb642af694b317de378f8dab6ce509b1b882167c12';
const source=path.resolve(process.argv[2]||path.join(__dirname,'../index.html'));
const evidenceDirectory=process.argv[3]?path.resolve(process.argv[3]):null;
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
const plain=value=>JSON.parse(JSON.stringify(value));
const read=(game,expression)=>JSON.parse(game.run(`JSON.stringify(${expression},(key,value)=>{
  if(value===undefined)return {__undefined__:true};
  if(typeof value==='number'&&!Number.isFinite(value))return {__nonfinite__:String(value)};
  if(value instanceof Set)return {__set__:[...value]};
  if(value instanceof Map)return {__map__:[...value]};
  return value;
})`));
// All state fields are compared, including every entity/order, cash, local and
// global production settings/targets, logs, AI, resources, effects and result.
const world=game=>read(game,`({state,uid,groups,simulationRemainder,last,uiClock,
  restartPrompt,resumeAfterCancel,selectedDeathUiDirty,lastBaseAlert,
  harvesterAlert,lastHarvesterAlert,battleAlerts,objectiveAlert,objectiveAlertSeen,
  economyAlert,economyAlertSeen,finishedBattleNarrative,pocketRouteBudget,
  savedBattleSignature,savedBattleSource,savedBattleTime,
  navigation:state.entities.map(e=>[e.id,navigationMemory.get(e)]),
  deliveries:state.entities.map(e=>[e.id,harvesterDeliveries.get(e)]),
  movement:state.entities.map(e=>[e.id,movementIntent.has(e),goalMovementIntent.has(e)])})`);
const input=game=>read(game,`({selection:[...selection],placement,attackMode,drag,
  ordinaryCommandMode,appendCommandMode,
  ordinaryCommandGesture:ordinaryCommandGesture&&{...ordinaryCommandGesture,battle:ordinaryCommandGesture.battle===state},
  ordinaryCommandActivation:ordinaryCommandActivation&&{...ordinaryCommandActivation,battle:ordinaryCommandActivation.battle===state},
  appendCommandActivation:appendCommandActivation&&{...appendCommandActivation,battle:appendCommandActivation.battle===state},
  factoryExitActivation:factoryExitActivation&&{...factoryExitActivation,battle:factoryExitActivation.battle===state},
  mouse,hoverActive,selectionClickCandidate,lastSelectionClick,doubleClickSelection,
  activeMapCommandReceipt,coordinateAidEnabled,coordinateMouseBaseline})`);
const selection=game=>plain(game.run('[...selection]'));
const finance=game=>plain({cash:game.state.cash,income:game.state.stats.income[0],spent:game.state.stats.spent[0],produced:game.state.stats.produced[0]});
const settings=game=>read(game,`({global:repeatProductionType(),target:repeatProductionTarget(),reserve:repeatProductionReserve(),parallel:repeatProductionParallel(),factories:structures(0,'factory').map(e=>({id:e.id,build:e.build,type:factoryRepeatType(e),target:factoryRepeatTarget(e),effective:effectiveFactoryRepeatTarget(e),reached:factoryRepeatTargetReached(e)}))})`);
const counters={pairedWorldComparisons:0,simulationStepsPerWorld:0,paidBuildings:0,manualPaidOrders:0,naturallyCompletedFactories:0,selectionActions:0,pendingModesCleared:0,legalRetypes:0,manualMapSelections:0,naturallyProducedVehicles:0,observedLocalRepeatOrders:0};
const tests=[];
let pointerId=20000,sourceHashBefore=null,sourceHashAfter=null;
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'red-v270-same-repeat-natural-'));
const baseline=path.join(temporary,'index.html');

function activate(game,id) {
  const node=game.element(id);
  assert.ok(node,`#${id} exists`);assert.equal(node.disabled,false,`#${id} is enabled`);
  const event={pointerId:++pointerId,pointerType:'mouse',button:0,isPrimary:true};
  node.dispatchEvent({type:'pointerdown',...event});node.dispatchEvent({type:'pointerup',...event});
  game.dispatch('pointerup',{...event,target:node});node.click({...event,detail:1});
}
function mapEvent(game,type,point,event={}) {
  const details={pointerId:++pointerId,pointerType:'mouse',button:0,isPrimary:true,shiftKey:false,detail:1,...event,clientX:point.x,clientY:point.y};
  const node=game.element('map');node.dispatchEvent({type,...details});
  if(type==='pointerup')game.dispatch('pointerup',{...details,target:node});
  return details;
}
function mapClick(game,point,shiftKey=false) {
  const event=mapEvent(game,'pointerdown',point,{shiftKey});
  mapEvent(game,'pointerup',point,event);mapEvent(game,'click',point,event);
}
function selectIds(game,ids) {
  ids.forEach((id,index)=>{
    const entity=game.state.entities.find(e=>e.id===id);
    assert.ok(entity&&entity.hp>0&&entity.team===0&&entity.type==='factory','manual target is a live friendly factory');
    mapClick(game,entity,index>0);counters.manualMapSelections++;
    assert.deepEqual(selection(game),ids.slice(0,index+1),'real map click/Shift-click selects exactly requested factories');
  });
}
function change(game,id,value) {
  const node=game.element(id);assert.ok(node&&!node.disabled,`#${id} change is available`);
  node.value=String(value);node.dispatchEvent({type:'change'});
}
function build(game,type,point) {
  const before=finance(game),ids=new Set(game.state.entities.map(e=>e.id));
  const button=game.elements.find(e=>e.dataset.build===type);
  assert.ok(button&&!button.disabled,'construction is affordable and enabled');
  assert.equal(game.run(`canPlace(${JSON.stringify(type)},${JSON.stringify(point)})`),true,'legal construction location');
  button.click();mapClick(game,point);
  const placed=game.state.entities.find(e=>!ids.has(e.id)&&e.team===0&&e.type===type);
  assert.ok(placed&&placed.build>0,'paid construction actually begins');
  const cost=game.run(`defs[${JSON.stringify(type)}].cost`);
  assert.equal(game.state.cash,before.cash-cost,'construction is paid exactly once');
  assert.equal(game.state.stats.spent[0],before.spent+cost,'construction spending is recorded');
  counters.paidBuildings++;
  return placed.id;
}
function buy(game,type) {
  const before=finance(game),node=game.elements.find(e=>e.dataset.unit===type);
  assert.ok(node&&!node.disabled,'manual production purchase is enabled');node.click();
  const order=game.state.queue.at(-1),cost=game.run(`defs[${JSON.stringify(type)}].cost`);
  assert.equal(order.type,type);assert.equal(order.factoryRepeatSource,undefined,'manual paid order remains manual');
  assert.equal(game.state.cash,before.cash-cost);assert.equal(game.state.stats.spent[0],before.spent+cost);
  counters.manualPaidOrders++;
  return order;
}
function openChooser(game) {
  const node=game.element('factoryRepeatSelection');
  assert.equal(node.tagName,'DETAILS');assert.equal(Object.hasOwn(node.attributes,'open'),false,'new chooser starts folded');
  assert.equal(node.hidden,false,'selected factory exposes chooser');
  node.children.find(child=>child.tagName==='SUMMARY').click();
  // The shared DOM has no browser <details> default action. Only this visual
  // disclosure default is modeled; no game model is written.
  node.open=true;node.dispatchEvent({type:'toggle'});
}
function assertCleared(game,before) {
  const after=input(game);
  for(const name of ['placement','drag','ordinaryCommandGesture','selectionClickCandidate'])assert.equal(after[name],null,`${name} is cleared`);
  for(const name of ['attackMode','ordinaryCommandMode','appendCommandMode','doubleClickSelection'])assert.equal(after[name],false,`${name} is cleared`);
  assert.equal(after.lastSelectionClick,0,'selection click sequence is reset');
  for(const name of ['ordinaryCommandActivation','appendCommandActivation','factoryExitActivation'])if(before[name])assert.equal(after[name].canceled,true,`${name} is canceled`);
  for(const name of ['mouse','hoverActive','activeMapCommandReceipt','coordinateAidEnabled','coordinateMouseBaseline'])assert.deepEqual(after[name],before[name],`${name} is untouched`);
  assert.equal(game.element('ordinaryCommandPreviewText').textContent,'','ordinary preview is cleared');
  assert.ok(game.element('map').getAttribute('aria-describedby')!=='ordinaryCommandPreviewText','ordinary preview mirror is detached');
}

function runCase(spec) {
  const beforeAssertions=assertions,beforeCounters={...counters};
  const games=[baseline,source].map(file=>loadGame(file,{seed:270}).start()),[old,current]=games;
  const events=[],autoOrders=new Set(),produced=[];
  let steps=0;
  function check(label,compareSelection=true) {
    assert.deepEqual(world(current),world(old),label+': entire worlds, orders, finances, logs and settings are exact');
    if(compareSelection)assert.deepEqual(selection(current),selection(old),label+': selected IDs and order are exact');
    for(const game of games) {
      assert.equal(game.state.gameSpeed,1,'normal speed');assert.equal(game.storage.size,0,'no persistence writes');
      assert.equal(game.state.cash,1700+game.state.stats.income[0]-game.state.stats.spent[0],'full cash ledger balances');
      assert.equal(game.state.result,null,'bounded witness remains an active battle');
    }
    counters.pairedWorldComparisons++;
  }
  function both(label,action) {const values=games.map(action);check(label);return values;}
  function step(label) {
    games.forEach(game=>game.step(1/60,1/60));
    // This is the shipped frame's presentation refresh, not a gameplay mutation.
    games.forEach(game=>game.run('updateUI()'));
    steps++;counters.simulationStepsPerWorld++;check(label+' #'+steps);
    for(const order of current.state.queue)if(order.factoryRepeatSource!==undefined)autoOrders.add(order);
  }
  function until(label,predicate,maxSeconds) {
    const deadline=current.state.t+maxSeconds;
    while(!predicate()&&current.state.t<deadline)step(label);
    assert.ok(predicate(),label+' completes within '+maxSeconds+' normal game seconds');
  }
  function snapshot(label,extra={}) {
    events.push({label,t:current.state.t,finance:finance(current),selection:selection(current),settings:settings(current),orders:plain(current.state.queue),worldSha256:digest(JSON.stringify(world(current))),...extra});
  }
  check('initial paired state');
  const secondIds=both('pay for second factory',game=>build(game,'factory',{x:50,y:600}));
  assert.equal(secondIds[0],secondIds[1]);const second=secondIds[1];
  both('pay for supporting power',game=>build(game,'power',{x:50,y:520}));
  until('naturally deliver ore to afford third factory',()=>current.state.cash>=850,20);
  const thirdIds=both('pay for third factory',game=>build(game,'factory',{x:150,y:470}));
  assert.equal(thirdIds[0],thirdIds[1]);const third=thirdIds[1];
  until('complete construction and fund paid work through real mining',()=>current.run("structures(0,'factory').length===3&&structures(0,'factory').every(e=>!e.build)&&powered()")&&current.state.cash>=1000,35);
  for(const game of games) {
    assert.equal(game.state.stats.spent[0],2000,'two factories and one power station paid for');
    assert.equal(game.state.stats.income[0],game.state.stats.harvested[0],'funding is real ore delivery');
    assert.equal(game.state.stats.produced[0],0,'setup creates no units artificially');
    assert.equal(game.run("structures(0,'factory').filter(e=>!e.build).length"),3);
    counters.naturallyCompletedFactories+=2;
  }
  snapshot('three naturally completed paid factories',{factoryIds:[4,second,third],constructionCost:2000});
  both('pause while configuring real orders',game=>activate(game,'pause'));
  for(const [id,type,target] of [[4,'scout',1],[second,'scout',3],[third,'tank',2]]) {
    both('select factory '+id,game=>selectIds(game,[id]));
    both('set legal local '+type+' repeat',game=>change(game,'factoryRepeat',type));
    both('set local target '+target,game=>change(game,'factoryRepeatTarget',target));
  }
  both('set global target',game=>change(game,'repeatTarget',5));
  both('set global reserve',game=>change(game,'repeatReserve',300));
  both('set global parallel preference',game=>change(game,'repeatParallel','parallel'));
  const initialVehicleIds=new Set(current.state.entities.filter(e=>current.run(`!!defs[${JSON.stringify(e.type)}].speed`)).map(e=>e.id));
  const manualOrders=[];
  for(const type of spec.paidTypes)manualOrders.push(both('buy real paid '+type+' order',game=>buy(game,type))[1]);
  assert.deepEqual(manualOrders.map(order=>order.factoryId),[4,second],'paid orders are actually assigned to distinct factories');
  assert.equal(current.run(`factoryRepeatTargetReached(get(${third}))`),true,'different-type third factory is idle because its target is met');
  assert.equal(current.state.queue.some(order=>order.factoryId===third),false,'third factory is currently idle');
  both('select local scout seed',game=>selectIds(game,[4]));
  openChooser(current);
  const retainedButton=current.element('selectSameRepeatFactories');
  assert.equal(retainedButton.disabled,false,'two configured scout factories enable selection');
  assert.ok(retainedButton.textContent.includes('侦察战车')&&retainedButton.textContent.endsWith('2厂'),'rendered chooser identifies two scout factories');
  snapshot('real paid orders and differing local settings',{paidTypes:spec.paidTypes,retainedLabel:retainedButton.textContent});

  let expected=[4,second];
  if(spec.retype) {
    const paidBefore=plain(current.state.queue),beforeLabel=retainedButton.textContent;
    both('legally retype selected seed after first button render',game=>change(game,'factoryRepeat','tank'));
    both('set changed seed target',game=>change(game,'factoryRepeatTarget',3));
    counters.legalRetypes++;
    assert.deepEqual(plain(current.state.queue),paidBefore,'legal local mode change retains exact already-paid manual orders');
    assert.equal(current.element('selectSameRepeatFactories'),retainedButton,'same rendered button node survives legal setting change');
    assert.ok(retainedButton.textContent.includes('主战坦克')&&retainedButton.textContent.endsWith('2厂'),'current presentation tracks new matching type');
    assert.ok(retainedButton.textContent!==beforeLabel,'legal retype actually changes chooser type');
    expected=[4,third];
    assert.equal(current.run('factoryRepeatTargetReached(get(4))'),true,'changed seed target is already met');
    snapshot('retained button after real seed retype',{previousLabel:beforeLabel,currentLabel:retainedButton.textContent,expected});
  } else {
    both('resume paid production before selection',game=>activate(game,'pause'));
    for(let i=0;i<30;i++)step('observe real paid progress before action');
    assert.ok(manualOrders.every(order=>order.left>0&&order.left<order.total),'both paid orders have genuinely progressed');
  }
  assert.equal(current.state.paused,spec.retype,'selection tested running in first case and paused in second');
  both('arm pending '+spec.pending+' through UI',game=>activate(game,spec.pending));
  assert.equal(current.run(spec.pending==='ordinaryCommand'?'ordinaryCommandMode':'attackMode'),true,'requested pending input is really active');
  const beforeWorld=world(current),beforeInput=input(current),beforeSettings=settings(current),beforeQueue=plain(current.state.queue);
  const beforeLog=plain(current.state.logs),beforeFinance=finance(current),beforeReceipt={text:current.element('mapCommandReceipt').textContent,hidden:current.element('mapCommandReceipt').hidden};
  activate(current,'selectSameRepeatFactories');
  counters.selectionActions++;counters.pendingModesCleared++;
  assert.deepEqual(selection(current),expected,'selection uses current local setting, includes seed, and excludes different types');
  assert.deepEqual(world(current),beforeWorld,'new action changes no world, order, economy, log or production setting field');
  assert.deepEqual(settings(current),beforeSettings,'all local/global types, targets, reserve and parallel settings unchanged');
  assert.deepEqual(plain(current.state.queue),beforeQueue,'exact already-paid order contents unchanged');
  assert.deepEqual(finance(current),beforeFinance,'selection is free');
  assert.deepEqual(plain(current.state.logs),beforeLog,'selection emits no log');
  assert.deepEqual({text:current.element('mapCommandReceipt').textContent,hidden:current.element('mapCommandReceipt').hidden},beforeReceipt,'selection emits no command receipt');
  assertCleared(current,beforeInput);
  assert.ok(expected.some(id=>current.state.queue.some(order=>order.factoryId===id&&order.type!==current.run(`factoryRepeatType(get(${id}))`))),'matches a busy factory whose currently paid type differs from its local repeat type');
  assert.ok(expected.some(id=>current.run(`factoryRepeatTargetReached(get(${id}))`)),'matches a factory whose target is already reached');
  if(spec.retype)assert.ok(expected.some(id=>!current.state.queue.some(order=>order.factoryId===id)),'current-type selection includes an idle matching factory');

  // Exact v269 equivalent: existing pending cancellation, one map click and
  // Shift-click. No world/log normalization is allowed or needed.
  const baselineBefore=world(old);
  activate(old,'cancelPending');selectIds(old,expected);
  assert.deepEqual(world(old),baselineBefore,'legal baseline manual selection has no gameplay side effect');
  check('new action equals exact v269 map multi-selection');
  for(const expression of ['placement','attackMode','ordinaryCommandMode','appendCommandMode','drag','ordinaryCommandGesture'])assert.deepEqual(read(current,expression),read(old,expression),'paired cleared input '+expression);
  snapshot('selection equals legal published baseline',{expected,pendingCleared:spec.pending,paused:current.state.paused});
  const afterWorld=world(current),afterInput=input(current);
  assert.equal(retainedButton.disabled,true,'multi-selection is not a new single seed');retainedButton.click();
  assert.deepEqual(world(current),afterWorld,'disabled repeat click is a full world no-op');
  assert.deepEqual(input(current),afterInput,'disabled repeat click preserves input');
  if(spec.retype)both('resume after paused selection',game=>activate(game,'pause'));
  const productionStart=current.state.t;
  until('complete the paid work and a naturally paid follow-on',()=>manualOrders.every(order=>!current.state.queue.includes(order))&&current.state.stats.produced[0]>=3,16);
  for(let i=0;i<30;i++)step('post-production paired stability');
  assert.ok(autoOrders.size>=1,'existing local repeat buys a real follow-on after selection');
  assert.ok([...autoOrders].some(order=>!current.state.queue.includes(order)),'at least one actual automatic paid order also completes');
  assert.equal(current.state.stats.produced[0],3,'two manual vehicles and one local-repeat vehicle are actually produced');
  const fresh=current.state.entities.filter(entity=>entity.team===0&&current.run(`!!defs[${JSON.stringify(entity.type)}].speed`)&&!initialVehicleIds.has(entity.id));
  assert.equal(fresh.length,3,'three produced friendly vehicles actually exist');
  const expectedTypes=[...spec.paidTypes,'scout'].sort();
  assert.deepEqual(plain(fresh.map(entity=>entity.type)).sort(),expectedTypes,'manual types and subsequent local scout repeat are preserved');
  assert.equal(current.state.stats.spent[0],2000+530+180,'construction, manual orders and local follow-on are the only charged purchases');
  assert.deepEqual(selection(current),expected,'selected factories remain selected throughout real production');
  for(const game of games)assert.equal(game.state.queue.length,0,'all observed paid work finishes, targets prevent further buying');
  for(const entity of fresh)produced.push({id:entity.id,type:entity.type,x:entity.x,y:entity.y,hp:entity.hp});
  counters.naturallyProducedVehicles+=fresh.length*2;counters.observedLocalRepeatOrders+=autoOrders.size;
  snapshot('paid orders and local follow-on naturally completed',{productionDuration:current.state.t-productionStart,produced,automaticOrders:[...autoOrders].map(plain)});
  return {name:spec.name,passed:true,seed:270,factoryIds:[4,second,third],expectedSelection:expected,pendingMode:spec.pending,retypedAfterFirstRender:spec.retype,
    revalidationLimit:spec.retype?'Retained live button is activated after an actual UI setting change and its normal presentation refresh; no stale-render suppression or synthetic setting mutation.':null,
    finalTime:current.state.t,assertions:assertions-beforeAssertions,counters:Object.fromEntries(Object.keys(counters).map(key=>[key,counters[key]-beforeCounters[key]])),events};
}

try {
  const html=fs.readFileSync(source,'utf8');sourceHashBefore=digest(html);
  assert.equal(sourceHashBefore,SOURCE_HASH,'exact frozen v270 source');
  const restored=require('./restore-v269.cjs')(html);assert.equal(digest(restored),BASELINE_HASH,'exact published v269 baseline');
  fs.writeFileSync(baseline,restored);
  for(const spec of [
    {name:'running_paid_different_types_and_caps_clear_ordinary_pending',paidTypes:['tank','scout'],pending:'ordinaryCommand',retype:false},
    {name:'paused_live_seed_retype_matches_busy_and_idle_factories',paidTypes:['scout','tank'],pending:'attack',retype:true}
  ])try {tests.push(runCase(spec));}catch(error){tests.push({name:spec.name,passed:false,error:error.stack,actual:error.actual,expected:error.expected});}
}catch(error){tests.push({name:'portable_exact_source_and_baseline_setup',passed:false,error:error.stack});}
finally {
  fs.rmSync(temporary,{recursive:true,force:true});
  if(fs.existsSync(source))sourceHashAfter=digest(fs.readFileSync(source));
  if(sourceHashBefore!==sourceHashAfter)tests.push({name:'source_digest_unchanged',passed:false,error:'Source changed during witness execution.'});
}
const report={passed:tests.filter(test=>test.passed).length,failed:tests.filter(test=>!test.passed).length,total:tests.length,assertions,counters,
  source,sourceHashBefore,sourceHashAfter,baselineHash:BASELINE_HASH,
  scope:'Whole-source Node VM/simulated DOM only. Legal paid multi-factory construction, natural ore delivery, UI local/global settings, manual paid orders and normal 1/60-second engine steps. New selection is compared with exact restored published v269 map click/Shift-click selection, then both worlds complete real paid production. No entity, HP, economy, order, resource or speed injection. No save/load/import/export execution. Browser pointer/keyboard behavior, disclosure, focus and layout are not verified.',
  equivalence:'Every simulation step and shared UI action compares all world and external navigation/delivery fields exactly. Selection actions separately preserve the full world including logs and all paid orders/settings/caps. No log normalization. Manual baseline selection changes only selection and pointer bookkeeping; candidate additionally resets existing pending-input bookkeeping as required.',
  countersDefinition:'simulationStepsPerWorld and pairedWorldComparisons count paired observations. Buildings, manual orders, construction completions, map selections and produced vehicles count both independent worlds. Other counters count candidate observations.',tests};
if(evidenceDirectory){fs.mkdirSync(evidenceDirectory,{recursive:true});fs.writeFileSync(path.join(evidenceDirectory,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report,null,2));
if(report.failed)process.exitCode=1;
