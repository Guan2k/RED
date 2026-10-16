'use strict';
// Natural whole-source VM witness. Gameplay setup uses actual UI handlers only.
// The tell wrapper observes messages; it neither edits logs nor injects gameplay.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const {loadGame} = require('./vm-environment.cjs');
const source = path.join(__dirname, '../index.html');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'red-queue-remainder-natural-'));
const baseline = path.join(temp, 'index.html');
const SOURCE_HASH = '4681522a07855adca4e7baf9964175ebe1610461c9d10504d045d3c154745dd4';
const BASE_HASH = '23f0c3092ff11369fd7bb5e4af5dd6f5e33c5928a08949f10df9f9b7843c4758';
const targets = [17, 18, 15, 16, 13, 10, 11, 12];
const route = [{x:450,y:540}, {x:500,y:620}, {x:480,y:700}];
const NEW_EVENT = '已清除后续队列：攻击1辆、路线1辆；当前指令与抵达后坚守保留，待点选操作保留';
const OLD_MIXED = '已撤销队尾：攻击1辆、路线1辆；各撤一项，当前指令保持';
const OLD_ATTACK = '已撤销队尾：攻击1辆；各撤一项，当前指令保持';
const oldEvents = [OLD_MIXED, OLD_MIXED, ...Array(5).fill(OLD_ATTACK)];
const CANONICAL_EVENT = '[verified clearing of both future queues]';
const results = [];
let comparisons = 0, actionDeltaChecks = 0, simulationSteps = 0;
const hash = s => crypto.createHash('sha256').update(s).digest('hex');
const read = (g, expression) => JSON.parse(g.run(`JSON.stringify(${expression}, (key,value) => {
  if (key === 'battle') return value === state ? '[current battle]' : '[foreign battle]';
  if (value === undefined) return {'__undefined__':true};
  if (typeof value === 'number' && !Number.isFinite(value)) return {'__nonfinite__':String(value)};
  if (value instanceof Set) return {'__set__':[...value]};
  if (value instanceof Map) return {'__map__':[...value]};
  return value;
})`));
const input = g => read(g, `({selection:[...selection], groups, placement, attackMode,
  ordinaryCommandMode, appendCommandMode, ordinaryCommandGesture,
  ordinaryCommandActivation, appendCommandActivation, factoryExitActivation,
  drag, hoverActive, mouse, restartPrompt, resumeAfterCancel,
  selectionClickCandidate, lastSelectionClick, doubleClickSelection,
  commandSpaceActivations:[...commandSpaceActivations].map(([node,value])=>[node.id||node.dataset.build,value]),
  activeMapCommandReceipt, coordinateAidEnabled, coordinateMouseBaseline,
  activeElement:document.activeElement?.id||document.activeElement?.tagName})`);
const snapshot = g => ({state:read(g, 'state'), uid:g.run('uid'),
  simulationRemainder:g.run('simulationRemainder'), input:input(g)});
const history = g => read(g, '__naturalLogHistory');
const ring = events => events.slice(-4).reverse();
const entity = (snapshot, id) => {
  const found = snapshot.state.entities.filter(e => e.id === id);
  assert.equal(found.length, 1, `exactly one designated unit ${id}`);
  return found[0];
};
function assertRawLog(g) {
  const events = history(g);
  assert.deepEqual(read(g, 'state.logs'), ring(events), 'raw four-entry log must equal this game\'s own emitted history');
  assert.equal(g.element('log').textContent, ring(events).join('\n'), 'rendered raw log equals its own ring');
  return events;
}
function observe(g) {
  // Seed from the one existing startup message, then record every subsequent tell.
  assert.deepEqual(read(g, 'state.logs'), ['左键选中部队，右键下达命令']);
  g.run(`globalThis.__naturalLogHistory=state.logs.slice().reverse();
    globalThis.__naturalOriginalTell=tell;
    tell=function(message){__naturalLogHistory.push(message);return __naturalOriginalTell(message)}`);
}
function controls(g) {
  return Object.fromEntries(['ordinaryCommand', 'appendCommand', 'cancelPending', 'mission', 'mapCommandReceipt']
    .map(id => { const e=g.element(id); return [id,{disabled:e.disabled,hidden:e.hidden,text:e.textContent,pressed:e.getAttribute('aria-pressed')}]; }));
}
try {
  const html = fs.readFileSync(source, 'utf8');
  assert.ok([SOURCE_HASH, '73c86d0eb92947d85c70fd47470f1c7c120d36c6f1f120ad84a3bf789546c3fe'].includes(hash(html)), 'candidate frozen source');
  const oldHtml = require('./restore-v264.cjs')(html);
  assert.equal(hash(oldHtml), BASE_HASH, 'exact v264 reference');
  fs.writeFileSync(baseline, oldHtml);
  for (const pending of ['none', 'ordinary', 'append']) {
    const games = [baseline, source].map(p => {const g=loadGame(p,{seed:265}).start();observe(g);return g});
    const [old, current] = games;
    let pointer = 0, actionStart = null, completedActions = false, caseSteps = 0;
    const check = label => {
      const logs = games.map(assertRawLog);
      const worlds = games.map(snapshot);
      if (!completedActions) {
        assert.deepEqual(logs[0], logs[1], `${pending}/${label}: complete emitted histories`);
      } else {
        // Accept only the known, position-checked seven-to-one action block.
        const expected = [oldEvents, [NEW_EVENT]];
        const canonical = logs.map((events, i) => {
          const block = expected[i];
          assert.deepEqual(events.slice(actionStart, actionStart+block.length), block, 'exact action event block');
          const others = [...events.slice(0,actionStart), ...events.slice(actionStart+block.length)];
          assert.equal(others.filter(s => s.startsWith('已撤销队尾：') || s.startsWith('已清除后续队列：')).length, 0,
            'no additional queue actions hidden by canonicalization');
          return [...events.slice(0,actionStart), CANONICAL_EVENT, ...events.slice(actionStart+block.length)];
        });
        assert.deepEqual(canonical[0], canonical[1], `${pending}/${label}: all non-action log events must match exactly`);
        worlds.forEach((w,i) => { w.state.logs=ring(canonical[i]); });
        // The old one-item queue retains the current enemy. The new action removes
        // the queue property. Assert both exact raw shapes before normalizing only
        // this one property of this designated unit, never any other world field.
        const a=entity(worlds[0],6), b=entity(worlds[1],6);
        assert.equal(a.target,17, 'old actual current target remains #17');
        assert.equal(b.target,17, 'new actual current target remains #17');
        assert.deepEqual(a.attackQueue,[17], 'reference queue is exactly the current target');
        assert.equal(Object.hasOwn(b,'attackQueue'),false, 'candidate queue property is absent');
        delete a.attackQueue;
      }
      assert.deepEqual(worlds[0], worlds[1], `${pending}/${label}: entire world and command context`);
      assert.deepEqual(controls(old), controls(current), `${pending}/${label}: pending-input UI`);
      assert.deepEqual(input(current).selection, completedActions ? [6,7] : input(old).selection);
      comparisons++;
    };
    const both = (label, action) => {games.forEach(action);check(label)};
    const point = (label,x,y,shift=false) => {
      const e={pointerId:++pointer,pointerType:'mouse',button:0,isPrimary:true,clientX:x,clientY:y,shiftKey:shift,detail:1};
      for (const type of ['pointerdown','pointerup','click']) both(`${label}/${type}`,g => g.element('map').dispatchEvent({type,...e}));
    };
    const button = (label,id) => {
      const e={pointerId:++pointer,pointerType:'mouse',button:0,isPrimary:true};
      for(const type of ['pointerdown','pointerup','click']) both(`${label}/${type}`,g => g.element(id).dispatchEvent({type,...e}));
    };
    const select = (id,shift=false) => {const e=current.state.entities.find(e=>e.id===id);point(`select-${id}`,e.x,e.y,shift)};
    const append = (x,y) => {
      button('arm-append','appendCommand');
      games.forEach(g=>assert.equal(g.run('appendCommandMode'),true));
      point('append-point',x,y);
      games.forEach(g=>assert.equal(g.run('appendCommandMode'),false));
    };
    check('started');
    both('pause',g=>g.click('pause'));
    select(6);
    for(const id of targets) {const e=current.state.entities.find(e=>e.id===id);append(e.x,e.y)}
    select(7);
    for(const p of route) append(p.x,p.y);
    both('reserve-arrival-hold',g=>g.click('holdOnArrival'));
    select(6);select(7,true);
    if(pending!=='none') button(`pending-${pending}`,pending==='ordinary'?'ordinaryCommand':'appendCommand');
    for(const g of games) {
      assert.equal(g.state.t,0); assert.equal(g.state.paused,true);
      const w=snapshot(g), a=entity(w,6), b=entity(w,7);
      assert.equal(a.target,17); assert.equal(a.goal,null); assert.deepEqual(a.attackQueue,targets);
      assert.equal(b.target,null); assert.deepEqual(b.goal,route[0]); assert.deepEqual(b.moveQueue,route);
      assert.equal(b.holdOnArrival,true); assert.notEqual(b.hold,true);
      assert.deepEqual(w.input.selection,[6,7]);
      assert.equal(w.input.ordinaryCommandMode,pending==='ordinary');
      assert.equal(w.input.appendCommandMode,pending==='append');
      assert.equal(g.storage.size,0,'no save/import/export storage touched');
    }
    assert.equal(current.element('clearFutureQueue').disabled,false);
    assert.equal(current.element('clearFutureQueue').textContent,'清除后续队列 · 2辆');
    actionStart=history(current).length;
    assert.equal(actionStart,history(old).length);
    const inputBefore=games.map(input), startWorld=games.map(snapshot);
    const identities=games.map(g=>({goal:g.run('get(7).goal'),route:g.run('get(7).moveQueue'),unit6:g.run('get(6)'),unit7:g.run('get(7)')}));
    // Verify the candidate click's complete world delta, without a normalization.
    current.click('clearFutureQueue');
    const expectedNew=structuredClone(startWorld[1]);
    delete entity(expectedNew,6).attackQueue;
    entity(expectedNew,7).moveQueue=[route[0]];
    expectedNew.state.logs=ring([...history(old),NEW_EVENT]);
    assert.deepEqual(snapshot(current),expectedNew,'one candidate click changes only intended queues and exact action log');
    assert.deepEqual(history(current).slice(actionStart),[NEW_EVENT]);
    assertRawLog(current);actionDeltaChecks++;
    // Verify every one of the seven original clicks independently. No simulation
    // runs while paused, and no other entity/property/context may change.
    for(let i=0;i<7;i++) {
      assert.equal(old.element('undoAttackTail').disabled,false,`original undo ${i+1} is available`);
      const expected=structuredClone(snapshot(old));
      entity(expected,6).attackQueue.pop();
      if(entity(expected,7).moveQueue.length>1)entity(expected,7).moveQueue.pop();
      expected.state.logs=ring([...history(old),oldEvents[i]]);
      old.click('undoAttackTail');
      assert.deepEqual(snapshot(old),expected,`original undo ${i+1} exact world delta`);
      assert.deepEqual(history(old).slice(actionStart),oldEvents.slice(0,i+1));
      assertRawLog(old);actionDeltaChecks++;
    }
    assert.equal(old.element('undoAttackTail').disabled,true,'exactly seven original clicks exhaust all future entries');
    assert.equal(current.element('clearFutureQueue').disabled,true);
    for(let i=0;i<games.length;i++) {
      const g=games[i];
      assert.deepEqual(input(g),inputBefore[i],'clearing preserves every captured pending-input value');
      assert.equal(g.run('get(7).goal'),identities[i].goal,'current goal identity retained');
      assert.equal(g.run('get(7).moveQueue'),identities[i].route,'route truncated in place');
      assert.equal(g.run('get(6)'),identities[i].unit6);
      assert.equal(g.run('get(7)'),identities[i].unit7);
      assert.equal(g.run('get(7).holdOnArrival'),true);
      assert.deepEqual(read(g,'get(7).moveQueue'),[route[0]]);
    }
    completedActions=true;check('queues-cleared');
    // Paused stepping itself is also required to be inert.
    const pausedBefore=games.map(snapshot);
    both('paused-step',g=>g.step(1/60,1/60));
    games.forEach((g,i)=>assert.deepEqual(snapshot(g),pausedBefore[i]));
    both('resume',g=>g.click('pause'));
    assert.equal(current.state.paused,false);
    const step=Number(current.run('SIMULATION_STEP'));
    assert.equal(step,1/60);assert.equal(current.state.gameSpeed,1);
    let prior=current.state.entities.find(e=>e.id===7);
    let priorPosition={x:prior.x,y:prior.y}, moved=false;
    // Each advance is exactly one engine step. Assert the clock increment so an
    // unnoticed multi-step harness call cannot weaken the per-step comparison.
    while(!current.run('get(7).hold===true') && current.state.t<20 && !current.state.result) {
      const before=current.state.t;
      both(`simulation-step-${caseSteps+1}`,g=>g.step(step,step));
      both(`simulation-ui-${caseSteps+1}`,g=>g.run('updateUI()'));
      assert.ok(Math.abs(current.state.t-before-step)<1e-12,'exactly one fixed simulation step');
      assert.deepEqual(input(current).selection,[6,7]);
      assert.equal(current.run('ordinaryCommandMode'),pending==='ordinary');
      assert.equal(current.run('appendCommandMode'),pending==='append');
      const unit=current.state.entities.find(e=>e.id===7);
      if(unit.x!==priorPosition.x||unit.y!==priorPosition.y)moved=true;
      priorPosition={x:unit.x,y:unit.y};
      if(!unit.hold) {
        assert.deepEqual(read(current,'get(7).goal'),route[0]);
        assert.deepEqual(read(current,'get(7).moveQueue'),[route[0]]);
        assert.equal(unit.holdOnArrival,true);
      }
      caseSteps++;simulationSteps++;
    }
    assert.equal(current.state.result,null,'arrival precedes battle end');
    assert.equal(moved,true,'tank 7 actually moved after resume');
    for(const g of games) {
      const unit=g.state.entities.find(e=>e.id===7);
      assert.equal(unit.hold,true,'actual arrival activated hold');
      assert.equal(unit.goal,null);assert.equal(unit.target,null);assert.equal(unit.attackMove,false);
      assert.equal(Object.hasOwn(unit,'moveQueue'),false);
      assert.equal(Object.hasOwn(unit,'holdOnArrival'),false,'arrival consumed the reservation');
      assert.ok(Math.hypot(unit.x-route[0].x,unit.y-route[0].y)<=5,'arrived at retained first waypoint');
      assert.equal(g.storage.size,0,'no stored data touched');
    }
    check('actual-arrival-hold');
    results.push({pending,status:'pass',seed:265,oldClicks:7,newClicks:1,simulationSteps:caseSteps,
      arrivalTime:current.state.t,arrivalPosition:read(current,'({x:get(7).x,y:get(7).y})'),
      targetPreserved:17,retainedGoal:route[0],verifiedOldEvents:oldEvents,verifiedNewEvents:[NEW_EVENT],
      emittedNonActionEvents:history(current).length-1});
  }
  assert.equal(hash(fs.readFileSync(source,'utf8')),hash(html),'source remained frozen');
  console.log(JSON.stringify({passed:results.length,failed:0,comparisons,actionDeltaChecks,simulationSteps,
    sourceSha256:hash(html),referenceSha256:BASE_HASH,results,
    scope:'Legal UI-only setup, selection, queue commands, arrival-hold and pending ordinary/append input; exact v264/current whole-world and command-context equality at setup checkpoints and every 1/60 simulation step through actual first-waypoint arrival-hold. Only designated tank 6 current-only queue representation and explicitly verified seven-to-one action log block are normalized; each raw log ring is independently checked against its own complete observed history. No gameplay-state injection, save/import/export, native browser, touch fidelity or human-speed claim.'},null,2));
} finally {
  fs.rmSync(temp,{recursive:true,force:true});
}
