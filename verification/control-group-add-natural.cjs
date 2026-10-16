'use strict';
// v271 legal paired gameplay witness. The entire unmodified inline game runs in
// the shared Node VM/DOM harness. Only UI handlers and normal 1/60-second engine
// steps change gameplay. No entity, economy, health, order, or speed injection.
const nodeAssert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const {loadGame} = require('./vm-environment.cjs');
let assertions = 0;
const assert = Object.fromEntries(['ok', 'equal', 'deepEqual'].map(name =>
  [name, (...args) => { assertions++; return nodeAssert[name](...args); }]));
const SOURCE_HASH = '7d7e7e84d404be3af143e5c3c17527197e415e38192d1653543041f4e1e59b9b';
const BASELINE_HASH = 'f66ba2568cabc8c5a8645558bb15e8b337ebaf23e3641af18f54464cf53f205a';
const source = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const evidenceDirectory = process.argv[3] ? path.resolve(process.argv[3]) : null;
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const plain = value => JSON.parse(JSON.stringify(value));
const read = (game, expression) => JSON.parse(game.run(`JSON.stringify(${expression}, (key,value)=>{
  if(value===undefined)return {__undefined__:true};
  if(typeof value==='number'&&!Number.isFinite(value))return {__nonfinite__:String(value)};
  if(value instanceof Set)return {__set__:[...value]};
  if(value instanceof Map)return {__map__:[...value]};
  return value;
})`));
// Compare every field in state: all entities and command fields, economy,
// production, AI, resources, projectiles, effects, logs and battle result.
// Also compare group order and gameplay records held outside state.
const world = game => read(game, `({state,uid,groups,simulationRemainder,last,uiClock,
  restartPrompt,resumeAfterCancel,selectedDeathUiDirty,lastBaseAlert,
  harvesterAlert,lastHarvesterAlert,battleAlerts,objectiveAlert,objectiveAlertSeen,
  economyAlert,economyAlertSeen,finishedBattleNarrative,pocketRouteBudget,
  savedBattleSignature,savedBattleSource,savedBattleTime,
  navigation:state.entities.map(e=>[e.id,navigationMemory.get(e)]),
  deliveries:state.entities.map(e=>[e.id,harvesterDeliveries.get(e)]),
  movement:state.entities.map(e=>[e.id,movementIntent.has(e),goalMovementIntent.has(e)])})`);
const input = game => read(game, `({selection:[...selection],placement,attackMode,drag,
  ordinaryCommandMode,appendCommandMode,
  ordinaryCommandGesture:ordinaryCommandGesture&&{...ordinaryCommandGesture,battle:ordinaryCommandGesture.battle===state},
  ordinaryCommandActivation:ordinaryCommandActivation&&{...ordinaryCommandActivation,battle:ordinaryCommandActivation.battle===state},
  appendCommandActivation:appendCommandActivation&&{...appendCommandActivation,battle:appendCommandActivation.battle===state},
  factoryExitActivation:factoryExitActivation&&{...factoryExitActivation,battle:factoryExitActivation.battle===state},
  mouse,hoverActive,selectionClickCandidate,lastSelectionClick,doubleClickSelection,
  activeMapCommandReceipt,coordinateAidEnabled,coordinateMouseBaseline})`);
const selection = game => plain(game.run('[...selection]'));
const finance = game => plain({cash:game.state.cash,income:game.state.stats.income[0],
  spent:game.state.stats.spent[0],produced:game.state.stats.produced[0]});
const counters = {worldComparisons:0,simulationStepsPerWorld:0,legalPurchases:0,
  naturallyProducedVehicles:0,boxSelectionGestures:0,groupSaves:0,groupAdditions:0,
  actualRecalls:0,pendingModesPreserved:0,repeatNoOps:0,arrivedMembers:0};
const tests = [];
let pointerId = 10000;
let sourceHashBefore = null;
let sourceHashAfter = null;
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'red-v271-group-add-natural-'));
const baseline = path.join(temporary, 'index.html');

function activate(game, id) {
  const node = game.element(id);
  assert.ok(node, `#${id} exists`);
  assert.equal(node.disabled, false, `#${id} is enabled`);
  const event = {pointerId:++pointerId,pointerType:'mouse',button:0,isPrimary:true};
  node.dispatchEvent({type:'pointerdown',...event});
  node.dispatchEvent({type:'pointerup',...event});
  game.dispatch('pointerup', {...event,target:node});
  node.click({...event,detail:1});
}
function mapEvent(game, type, point, event = {}) {
  const details = {pointerId:++pointerId,pointerType:'mouse',button:0,isPrimary:true,
    shiftKey:false,detail:1,...event,clientX:point.x,clientY:point.y};
  const node = game.element('map');
  node.dispatchEvent({type,...details});
  if(type==='pointerup')game.dispatch('pointerup',{...details,target:node});
  return details;
}
function mapClick(game, point) {
  const event=mapEvent(game,'pointerdown',point);
  mapEvent(game,'pointerup',point,event);
  mapEvent(game,'click',point,event);
}
function rightClick(game, point, append = false) {
  const event=mapEvent(game,'pointerdown',point,{button:2,shiftKey:append});
  mapEvent(game,'pointerup',point,event);
  mapEvent(game,'contextmenu',point,event);
}
function selectIds(game, ids) {
  assert.ok(ids.length > 0, 'selection request is nonempty');
  ids.forEach((id,index) => {
    const entity=game.state.entities.find(e=>e.id===id);
    assert.ok(entity&&entity.team===0&&entity.hp>0, `select live friendly #${id}`);
    // A real ten-unit-wide drag box avoids clicking through a nearby building.
    const from={x:entity.x-5,y:entity.y-5},to={x:entity.x+5,y:entity.y+5};
    assert.ok(from.x>=0&&from.y>=0&&to.x<=1200&&to.y<=800, 'legal map selection box');
    const event=mapEvent(game,'pointerdown',from,{shiftKey:index>0});
    mapEvent(game,'pointermove',to,event);
    mapEvent(game,'pointerup',to,event);
    mapEvent(game,'click',to,event);
    assert.deepEqual(selection(game),ids.slice(0,index+1),'only requested real vehicle centers selected');
    counters.boxSelectionGestures++;
  });
}
function recall(game, slot) {
  const node=game.elements.find(e=>e.dataset.group===String(slot));
  assert.ok(node&&!node.disabled, 'existing group recall button is available');
  node.click();
  counters.actualRecalls++;
}
function openManager(game) {
  const manager=game.element('controlGroupManager');
  assert.equal(manager.tagName,'DETAILS');
  assert.equal(Object.hasOwn(manager.attributes,'open'),false,'manager is initially collapsed in markup');
  // The harness does not emulate native <details> default actions. Model only
  // this non-gameplay browser default; no native disclosure fidelity is claimed.
  manager.children.find(node=>node.tagName==='SUMMARY').click();
  manager.open=true;
  manager.dispatchEvent({type:'toggle'});
}
function normalizedWorld(game, substitutions = new Map()) {
  const result=world(game);
  result.state.logs=result.state.logs.map(line=>substitutions.get(line)||line);
  return result;
}
function runCase(spec) {
  const beforeCounts={...counters},beforeAssertions=assertions;
  const games=[baseline,source].map(file=>loadGame(file,{seed:269}).start());
  const [old,current]=games;
  const events=[];
  const permittedLogPair=new Map();
  const canonical=game=>normalizedWorld(game,game===current?permittedLogPair:new Map());
  let localSteps=0;
  function check(label, compareSelection = true) {
    assert.deepEqual(canonical(current),canonical(old),label+': exact paired world, economy, commands and group order');
    if(compareSelection) {
      assert.deepEqual(selection(current),selection(old),label+': exact selected IDs and order');
      for(const expression of ['placement','attackMode','ordinaryCommandMode','appendCommandMode','drag','ordinaryCommandGesture'])
        assert.deepEqual(read(current,expression),read(old,expression),label+': '+expression);
    }
    for(const game of games) {
      assert.equal(game.state.gameSpeed,1,'normal simulation speed');
      assert.equal(game.storage.size,0,'no battle persistence writes');
      assert.equal(game.state.cash,1700+game.state.stats.income[0]-game.state.stats.spent[0],'actual cash ledger balances');
    }
    counters.worldComparisons++;
  }
  function both(label, action) {
    games.forEach(action);
    check(label);
  }
  function step(label) {
    games.forEach(game=>game.step(1/60,1/60));
    // updateUI is a read-only presentation refresh in the shipped frame loop.
    games.forEach(game=>game.run('updateUI()'));
    localSteps++;
    counters.simulationStepsPerWorld++;
    check(label+' step '+localSteps);
    assert.equal(current.state.result,null,'observation remains in an active battle');
  }
  function snapshot(label, extra = {}) {
    events.push({label,t:current.state.t,finance:finance(current),groups:plain(current.run('groups')),
      selection:selection(current),worldSha256:digest(JSON.stringify(canonical(current))),...extra});
  }
  both('initial exact worlds',openManager);
  const initialIds=current.state.entities.map(e=>e.id);
  const oldIds=spec.support?[5]:[6,7,8];
  both('select original members',game=>selectIds(game,oldIds));
  both('existing visible replace-save creates original group',game=>{
    activate(game,'saveControlGroup'+spec.slot);counters.groupSaves++;
  });
  assert.deepEqual(plain(current.run(`groups[${spec.slot}]`)),oldIds);
  snapshot('original group saved');

  const purchaseCost=spec.types.reduce((sum,type)=>sum+current.run(`defs[${JSON.stringify(type)}].cost`),0);
  const beforePurchase=finance(current);
  for(const type of spec.types)both('legal paid '+type+' production purchase',game=>{
    const node=game.elements.find(e=>e.dataset.unit===type);
    assert.ok(node&&!node.disabled,'paid unit purchase is available');
    node.click();counters.legalPurchases++;
  });
  assert.equal(current.state.cash,beforePurchase.cash-purchaseCost);
  assert.equal(current.state.stats.spent[0],beforePurchase.spent+purchaseCost);
  assert.equal(current.state.queue.length,spec.types.length);
  snapshot('reinforcements paid for',{types:spec.types,totalPaid:purchaseCost});
  while(current.state.stats.produced[0]<spec.types.length&&current.state.t<25)step('natural paid production');
  assert.equal(current.state.stats.produced[0],spec.types.length,'every purchased reinforcement actually spawned');
  assert.equal(current.state.queue.length,0,'all paid work completed');
  const added=plain(current.state.entities.filter(e=>e.team===0&&!initialIds.includes(e.id)));
  const newIds=added.map(e=>e.id);
  assert.deepEqual(added.map(e=>e.type),spec.types,'real production preserves purchase order');
  assert.equal(added.length,2,'two newly paid vehicles exist');
  counters.naturallyProducedVehicles+=added.length*2;
  snapshot('all reinforcements naturally produced',{newIds,positions:added.map(e=>({id:e.id,type:e.type,x:e.x,y:e.y}))});

  if(!spec.support) {
    both('recall original group before existing orders',game=>recall(game,spec.slot));
    both('old members receive legal current ground command',game=>rightClick(game,{x:430,y:530}));
    both('old members receive legal later ground command',game=>rightClick(game,{x:470,y:600},true));
    assert.ok(oldIds.every(id=>current.state.entities.find(e=>e.id===id).moveQueue?.length===2),'original members have real queued commands');
  }
  // Reverse gesture order deliberately differs from state.entities order.
  // The add handler must still append newIds in source entity order.
  const selectedIds=[...newIds].reverse();
  if(spec.overlap)selectedIds.push(oldIds[0]);
  both('select real reinforcements in reverse entity order',game=>selectIds(game,selectedIds));
  if(!spec.support) {
    both('selected reinforcements receive current ground command',game=>rightClick(game,{x:420,y:710}));
    both('selected reinforcements receive future ground command',game=>rightClick(game,{x:490,y:700},true));
    assert.ok(newIds.every(id=>current.state.entities.find(e=>e.id===id).moveQueue?.length===2),'reinforcements have real queued commands');
  }
  if(spec.mode)both('arm legal pending '+spec.mode+' command',game=>activate(game,spec.mode));
  const desiredGroup=[...oldIds,...newIds];
  const beforeAddWorld=world(current),beforeAddInput=input(current),beforeLogs=plain(current.state.logs);
  const beforeReceipt={text:current.element('mapCommandReceipt').textContent,hidden:current.element('mapCommandReceipt').hidden};
  const addButton=current.element('addControlGroup'+spec.slot);
  assert.equal(addButton.textContent,`加入所选到编队${spec.slot+1} · +2辆`,'visible count counts only new eligible members');
  activate(current,'addControlGroup'+spec.slot);counters.groupAdditions++;
  assert.deepEqual(plain(current.run(`groups[${spec.slot}]`)),desiredGroup,'preserve original order then append new real vehicles in entity order');
  assert.deepEqual(input(current),beforeAddInput,'adding preserves exact selection and pending input context');
  assert.deepEqual({text:current.element('mapCommandReceipt').textContent,hidden:current.element('mapCommandReceipt').hidden},beforeReceipt,'adding does not issue or replace a command receipt');
  const expectedMessage=`编队 ${spec.slot+1} 已加入 2 辆车辆；现有 ${desiredGroup.length} 辆存活成员`;
  assert.deepEqual(plain(current.state.logs),[expectedMessage,...beforeLogs].slice(0,4),'exactly the intended one group-add log');
  const afterAddWorld=world(current);
  afterAddWorld.groups[spec.slot]=beforeAddWorld.groups[spec.slot];
  afterAddWorld.state.logs=beforeAddWorld.state.logs;
  assert.deepEqual(afterAddWorld,beforeAddWorld,'add changes only this group and its documented single log');
  if(spec.mode)counters.pendingModesPreserved++;

  // Legal v268 equivalent: cancel only the pending input (no order changes),
  // manually reselect every member, then use the already-existing replace-save.
  // Its temporary selection/UI differences occur without simulation advancement.
  if(spec.mode)activate(old,'cancelPending');
  selectIds(old,desiredGroup);
  const beforeBaselineSaveLogs=plain(old.state.logs);
  assert.deepEqual(beforeBaselineSaveLogs,beforeLogs,'manual selection/cancel emits no extra baseline log');
  activate(old,'saveControlGroup'+spec.slot);counters.groupSaves++;
  const expectedSaveMessage=`编队 ${spec.slot+1} 已保存 ${desiredGroup.length} 辆战车`;
  assert.deepEqual(plain(old.state.logs),[expectedSaveMessage,...beforeBaselineSaveLogs].slice(0,4),'baseline save produces exactly one expected raw log');
  permittedLogPair.set(expectedMessage,expectedSaveMessage);
  check('new add equals legal baseline manual union and replace-save',false);
  assert.deepEqual(selection(current),selectedIds,'new action leaves reinforcement selection in place');
  assert.deepEqual(selection(old),desiredGroup,'baseline manual union temporarily selects entire group');
  selectIds(old,selectedIds);
  if(spec.mode)activate(old,spec.mode);
  check('baseline selection and pending mode restored');
  snapshot('add matched baseline manual merge',{slot:spec.slot,newIds,oldIds,selectedIds,desiredGroup,
    pendingMode:spec.mode||null,overlappingOldMember:spec.overlap?oldIds[0]:null});

  const beforeRepeat=world(current),beforeRepeatInput=input(current);
  assert.equal(addButton.disabled,true,'no remaining new member makes add disabled');
  addButton.click();
  assert.deepEqual(world(current),beforeRepeat,'repeat activation is a total world/group/log no-op');
  assert.deepEqual(input(current),beforeRepeatInput,'repeat activation preserves pending input');
  counters.repeatNoOps++;
  check('repeat is harmless');
  if(spec.mode) {
    both('commit preserved pending command to legal map point',game=>mapClick(game,{x:520,y:740}));
    assert.equal(current.run('ordinaryCommandMode||appendCommandMode||attackMode'),false,'pending point operation actually consumed');
    assert.ok(newIds.every(id=>current.state.entities.find(e=>e.id===id).goal),'preserved mode produced actual ground goals');
    if(spec.mode==='appendCommand')assert.ok(newIds.every(id=>current.state.entities.find(e=>e.id===id).moveQueue.length===3),'preserved append mode kept prior current and later waypoints');
    if(spec.mode==='attack')assert.ok(newIds.every(id=>current.state.entities.find(e=>e.id===id).attackMove),'preserved attack mode issued attack-move');
  }
  // Actual recall must include every old and newly produced vehicle. It must
  // not change any world/economy/order fields; selection and input are allowed.
  const beforeRecall=canonical(current);
  both('actual recall of expanded group',game=>recall(game,spec.slot));
  assert.deepEqual(selection(current),desiredGroup,'recall selects original plus paid reinforcements in stored order');
  assert.deepEqual(canonical(current),beforeRecall,'recall has no gameplay or economy side effects');
  snapshot('expanded group actually recalled');

  const startPositions=desiredGroup.map(id=>{const e=current.state.entities.find(e=>e.id===id);return{id,x:e.x,y:e.y};});
  both('recalled full group receives one legal movement command',game=>rightClick(game,{x:480,y:730}));
  const goals=desiredGroup.map(id=>({id,...plain(current.state.entities.find(e=>e.id===id).goal)}));
  assert.ok(goals.every(goal=>Number.isFinite(goal.x)&&Number.isFinite(goal.y)),'every recalled member receives a real formation goal');
  const movementStart=current.state.t,arrivals=new Map();
  // Observe the first real goal-clear event, not the later position after an
  // early arrival has yielded to another vehicle or a harvester resumed mining.
  // The engine also has a specific bounded formation-settle arrival rule;
  // establish its pre-step wait/clearance/nearby-friend evidence independently.
  function arrivalEvidence(id) {
    const entity=current.state.entities.find(e=>e.id===id),goal=goals.find(e=>e.id===id);
    const nav=read(current,`navigationMemory.get(get(${id}))`);
    const radius=entity.arrivalRadius||5,remaining=Math.hypot(entity.x-goal.x,entity.y-goal.y);
    const neighbors=plain(current.state.entities.filter(other=>other.id!==id&&other.hp>0&&other.team===entity.team&&current.run(`!!defs[${JSON.stringify(other.type)}].speed`))
      .map(other=>({id:other.id,r:other.r,distanceToGoal:Math.hypot(other.x-goal.x,other.y-goal.y)})));
    return {id,x:entity.x,y:entity.y,goal:plain(entity.goal),radius,remaining,
      stableWait:typeof nav?.settleWait==='number'?nav.settleWait:0,
      settledDistance:typeof nav?.settleDistance==='number'?nav.settleDistance:null,
      settledGoal:nav?.settleGoal??null,neighbors,
      staticClear:current.run(`movementSegmentClear(get(${id}),${JSON.stringify(goal)},get(${id}).r,movementObstacles())`)};
  }
  while(current.state.t-movementStart<35&&arrivals.size<desiredGroup.length) {
    const previous=new Map(desiredGroup.filter(id=>!arrivals.has(id)).map(id=>[id,arrivalEvidence(id)]));
    step('natural expanded-group movement');
    for(const [id,before] of previous) {
      const entity=current.state.entities.find(e=>e.id===id),goal=goals.find(e=>e.id===id),start=startPositions.find(e=>e.id===id);
      assert.ok(entity&&entity.hp>0,'expanded-group member survives observed movement');
      if(entity.goal!==null)continue;
      const direct=before.remaining<before.radius;
      const neighbors=before.neighbors.filter(other=>other.distanceToGoal<entity.r+other.r+3&&before.remaining<=Math.min(36,entity.r+other.r+3));
      const settled=before.radius>5&&before.remaining<=36&&before.stableWait+1/60>=1-1e-8&&
        before.settledGoal?.x===goal.x&&before.settledGoal?.y===goal.y&&
        Math.abs(before.settledDistance-before.remaining)<2&&neighbors.length>0&&before.staticClear;
      const event={id,t:current.state.t,step:localSteps,acceptance:direct?'arrival-radius':settled?'bounded-formation-settle':'unexplained',
        goal,before,after:{x:entity.x,y:entity.y,goal:plain(entity.goal),distanceToGoal:Math.hypot(entity.x-goal.x,entity.y-goal.y)}};
      assert.ok(direct||settled,'first goal completion satisfies actual arrival-radius or independently witnessed formation-settle rule: '+JSON.stringify(event));
      assert.ok(Math.hypot(entity.x-start.x,entity.y-start.y)>10,'member physically moved from its starting position');
      arrivals.set(id,event);counters.arrivedMembers++;
    }
  }
  assert.equal(arrivals.size,desiredGroup.length,'every recalled group member naturally completes its goal in the observation window');
  for(let i=0;i<30;i++)step('post-arrival stability');
  both('recall again after natural progression',game=>recall(game,spec.slot));
  assert.deepEqual(selection(current),desiredGroup,'group remains recallable after natural progression');
  snapshot('all expanded-group members arrived and recalled again',{goals,arrivalTime:current.state.t,arrivals:[...arrivals.values()],
    positions:desiredGroup.map(id=>{const e=current.state.entities.find(e=>e.id===id);return{id,x:e.x,y:e.y,hp:e.hp};})});
  return {name:spec.name,passed:true,slot:spec.slot,seed:269,types:spec.types,purchaseCost,
    oldIds,newIds,desiredGroup,pendingMode:spec.mode||null,finalTime:current.state.t,
    assertions:assertions-beforeAssertions,counters:Object.fromEntries(Object.keys(counters).map(k=>[k,counters[k]-beforeCounts[k]])),events};
}

try {
  const html=fs.readFileSync(source,'utf8');
  sourceHashBefore=digest(html);
  assert.equal(sourceHashBefore,SOURCE_HASH,'exact frozen v271 source');
  const restored=require('./restore-v268.cjs')((sourceText=>require('./restore-v269.cjs')(sourceText.includes('ORIGINAL RTS / v0.271')?require('./restore-v270.cjs')(sourceText):sourceText))(html));
  assert.equal(digest(restored),BASELINE_HASH,'exact published v268 baseline');
  fs.writeFileSync(baseline,restored);
  for(const spec of [
    {name:'slot_1_paid_reinforcements_preserve_ordinary_pending',slot:0,types:['scout','tank'],mode:'ordinaryCommand'},
    {name:'slot_2_paid_reinforcements_preserve_append_pending',slot:1,types:['tank','scout'],mode:'appendCommand',overlap:true},
    {name:'slot_3_paid_reinforcements_preserve_attack_pending',slot:2,types:['scout','tank'],mode:'attack'},
    {name:'paid_repair_and_harvester_join_existing_worker_group',slot:2,types:['repair','harvester'],support:true}
  ]) {
    try {tests.push(runCase(spec));}
    catch(error) {tests.push({name:spec.name,passed:false,error:error.stack,actual:error.actual,expected:error.expected});}
  }
} catch(error) {
  tests.push({name:'portable_exact_source_and_baseline_setup',passed:false,error:error.stack});
} finally {
  fs.rmSync(temporary,{recursive:true,force:true});
  if(fs.existsSync(source))sourceHashAfter=digest(fs.readFileSync(source));
  if(sourceHashBefore!==sourceHashAfter)tests.push({name:'source_digest_unchanged',passed:false,error:'Source changed during witness execution.'});
}
const report={passed:tests.filter(test=>test.passed).length,failed:tests.filter(test=>!test.passed).length,
  total:tests.length,assertions,counters,source,sourceHashBefore,sourceHashAfter,baselineHash:BASELINE_HASH,
  scope:'Whole-source Node VM with simulated DOM only. Legal UI selection, existing group save/recall, new group-add, paid production and normal 1/60-second simulation. No entity, HP, cash, resource, command, speed or gameplay-state injection. No persistence save/load/import/export execution. Native browser pointer/keyboard dispatch, disclosure behavior, focus and layout are unverified.',
  equivalence:'Every simulation step compares the exact entire world/economy/commands/group arrays and additional navigation/delivery/input state. Only the one exactly asserted candidate-add message is mapped to its exactly asserted baseline-save message; unrelated logs are untouched. Baseline manual reselect temporarily changes only selection/UI, restored before progression. Candidate addition separately must preserve its complete pending input snapshot and all world fields except one group and the exact documented log.',
  countersDefinition:'simulationStepsPerWorld counts paired 1/60-second advances; purchases, produced vehicles, saves and recalls count both independent worlds. groupAdditions, pendingModesPreserved, repeatNoOps and arrivedMembers count candidate observations.',tests};
if(evidenceDirectory) {
  fs.mkdirSync(evidenceDirectory,{recursive:true});
  fs.writeFileSync(path.join(evidenceDirectory,'report.json'),JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify(report,null,2));
if(report.failed)process.exitCode=1;
