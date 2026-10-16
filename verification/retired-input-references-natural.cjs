'use strict';
// Whole-source paired VM witness. World changes use enabled UI handlers and
// fixed simulation steps only. This is not a native-browser/heap/GC benchmark.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {loadGame} = require('./vm-environment.cjs');
const SOURCE_HASH = '73c86d0eb92947d85c70fd47470f1c7c120d36c6f1f120ad84a3bf789546c3fe';
const BASE_HASH = '4681522a07855adca4e7baf9964175ebe1610461c9d10504d045d3c154745dd4';
const source = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'red-retired-input-natural-'));
const baseline = path.join(temp, 'index.html');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const plain = value => JSON.parse(JSON.stringify(value));
const read = (g, expression) => JSON.parse(g.run(`JSON.stringify(${expression}, (key,value) => {
  if (value === undefined) return {'__undefined__':true};
  if (typeof value === 'number' && !Number.isFinite(value)) return {'__nonfinite__':String(value)};
  if (value instanceof Set) return {'__set__':[...value]};
  if (value instanceof Map) return {'__map__':[...value]};
  return value;
})`));
// No battle-reference replacement occurs in serialization. The raw full old
// state is retained in the snapshot until its exact identity is asserted below.
const snapshot = g => read(g, `({state,uid,last,simulationRemainder,uiClock,
  input:{selection:[...selection],groups,placement,attackMode,
    ordinaryCommandMode,appendCommandMode,ordinaryCommandGesture,
    ordinaryCommandActivation,appendCommandActivation,factoryExitActivation,
    drag,hoverActive,mouse,restartPrompt,resumeAfterCancel,
    selectionClickCandidate,lastSelectionClick,doubleClickSelection,
    commandSpaceActivations:[...commandSpaceActivations].map(([node,value])=>[node.id||node.dataset.build,value]),
    activeMapCommandReceipt,coordinateAidEnabled,coordinateMouseBaseline,
    activeElement:document.activeElement?.id||document.activeElement?.tagName}})`);
const controlIds = ['ordinaryCommand','appendCommand','cancelPending','pause','restart','start',
  'mapCommandReceipt','ordinaryCommandPreviewText','log','mission','productionOrders'];
const controls = g => Object.fromEntries(controlIds.map(id => {
  const e = g.element(id);
  return [id,{disabled:e.disabled,hidden:e.hidden,text:e.textContent,
    title:e.title,pressed:e.getAttribute('aria-pressed')}];
}));
const tokenFields = token => Object.fromEntries(Object.entries(token).filter(([key]) => key !== 'battle'));
const gestures = [{name:'pointer',key:null},{name:'Enter',key:'Enter'},{name:'Space',key:' '}];
const results = [];
let comparisons = 0, exactReferenceChecks = 0, inertEventChecks = 0;
let simulationSteps = 0, paidOrders = 0, restartCycles = 0;
try {
  const html = fs.readFileSync(source, 'utf8');
  assert.equal(hash(html), SOURCE_HASH, 'frozen v266 source');
  const oldHtml = require('./restore-v265.cjs')(html);
  assert.equal(hash(oldHtml), BASE_HASH, 'byte-exact published v265 reference');
  fs.writeFileSync(baseline, oldHtml);
  for (const gesture of gestures) for (const phase of ['pending','consumed']) {
    const name = `${gesture.name}/${phase}`;
    const games = [baseline,source].map(p => loadGame(p,{seed:266}).start());
    const [old,current] = games;
    const records = new Map(), heldPoints = [];
    let pointerId = 100, caseComparisons = 0, caseSteps = 0;
    function check(label) {
      const worlds = games.map(snapshot);
      for (const [slot,record] of records) {
        for (let i=0;i<games.length;i++) {
          const actual = games[i].run(slot);
          assert.equal(actual,record.tokens[i],`${name}/${label}: ${slot} object identity`);
          assert.equal(actual.battle,record.retired && i===1 ? null : record.battles[i],
            `${name}/${label}: exact ${slot} battle reference`);
          assert.deepEqual(Object.keys(actual),gesture.key
            ? ['kind','key','battle','released','consumed','canceled']
            : ['kind','pointerId','battle','released','consumed','canceled'], 'no added token history links');
          exactReferenceChecks++;
        }
        assert.deepEqual(tokenFields(record.tokens[0]),tokenFields(record.tokens[1]),
          `${name}/${label}: every non-reference token field matches`);
        // Confirm paired outgoing worlds also remain equal; holding them here
        // is a test witness and is not evidence about collection or heap size.
        assert.deepEqual(plain(record.battles[0]),plain(record.battles[1]), 'paired original battle objects remain equal');
        if (record.retired) {
          assert.notEqual(record.battles[0],old.state,'old reference belongs to a previous actual battle');
          assert.notEqual(record.battles[1],current.state,'candidate witness belongs to a previous actual battle');
          assert.equal(record.tokens[0].canceled,true);
          assert.equal(record.tokens[1].canceled,true);
          assert.deepEqual(worlds[0].input[slot].battle,plain(record.battles[0]),'raw baseline contains exact outgoing state');
          assert.equal(worlds[1].input[slot].battle,null,'raw candidate reference is null');
          // This is the entire normalization: only this independently verified
          // retired ordinary/append token's .battle, never flags or world data.
          worlds[0].input[slot].battle = null;
        }
      }
      assert.equal(old.run('factoryExitActivation'),null,'no synthetic factory-exit activation');
      assert.equal(current.run('factoryExitActivation'),null);
      assert.deepEqual(worlds[0],worlds[1],`${name}/${label}: full state, economy, selection and pending input`);
      assert.deepEqual(controls(old),controls(current),`${name}/${label}: command and lifecycle controls`);
      games.forEach(g => assert.equal(g.storage.size,0,'no save/import/export action or storage write'));
      comparisons++;caseComparisons++;
    }
    const both = (label,action,after) => {games.forEach(action);if(after)after();check(label)};
    const enabled = (g,id) => {const button=g.element(id);assert.equal(button.disabled,false,`${id} is enabled`);return button};
    const selectArmy = () => both('select-actual-starting-army',g => enabled(g,'selectArmy').click());
    const mapEvent = (type,id,x=450,y=540) => ({type,pointerId:id,pointerType:'mouse',
      button:0,isPrimary:true,clientX:x,clientY:y,detail:1,shiftKey:false});
    function press(id) {
      const slot = `${id}Activation`, idNumber = ++pointerId;
      both(`${id}/deliberate-press`,g => {
        const button=enabled(g,id);
        button.dispatchEvent(gesture.key
          ? {type:'keydown',key:gesture.key,code:gesture.key===' '?'Space':'Enter',repeat:false}
          : {type:'pointerdown',pointerId:idNumber,pointerType:'mouse',button:0,isPrimary:true});
      },() => records.set(slot,{tokens:games.map(g=>g.run(slot)),battles:games.map(g=>g.state),retired:false,pointerId:idNumber}));
      games.forEach(g => {assert.equal(g.run(`${slot}.consumed`),false);assert.equal(g.run(`${slot}.canceled`),false)});
      return records.get(slot);
    }
    function release(id) {
      const slot=`${id}Activation`, record=records.get(slot);
      const before=games.map(snapshot);
      both(`${id}/matching-release`,g => enabled(g,id).dispatchEvent(gesture.key
        ? {type:'keyup',key:gesture.key,code:gesture.key===' '?'Space':'Enter'}
        : {type:'pointerup',pointerId:record.pointerId,pointerType:'mouse',button:0,isPrimary:true}));
      games.forEach((g,i) => {
        before[i].input[slot].released=true;
        assert.deepEqual(snapshot(g),before[i],'release changes only the matching token released bit');
      });
    }
    function completeActivation(id) {
      // Enter's default click occurs on keydown; pointer and Space wait for up.
      if(gesture.key!=='Enter')release(id);
      both(`${id}/native-default-click`,g => enabled(g,id).click());
      games.forEach(g => {
        assert.equal(g.run(`${id}Mode`),true,'fresh deliberate activation arms the selected mode');
        assert.equal(g.run(`${id}Activation.consumed`),true);
        assert.equal(g.run(`${id}Activation.battle`),g.state,'same-battle cancellation retains current reference');
      });
      if(gesture.key==='Enter')release(id);
    }
    function restart(label) {
      const before = [...records.values()].map(r=>({record:r,refs:r.tokens.map(t=>t.battle),fields:r.tokens.map(tokenFields)}));
      both(`${label}/restart-menu`,g => enabled(g,'restart').click());
      games.forEach(g => {assert.equal(g.run('restartPrompt'),true);assert.equal(g.state.paused,true)});
      for(const witness of before) witness.record.tokens.forEach((token,i)=>{
        assert.equal(token.battle,witness.refs[i],'menu-only cancellation leaves battle reference unchanged');
        assert.deepEqual(tokenFields(token),{...witness.fields[i],canceled:true},'menu changes only canceled token flag');
      });
      const canceled = [...records.values()].map(r=>({record:r,fields:r.tokens.map(tokenFields)}));
      const outgoing=games.map(g=>g.state);
      both(`${label}/start`,g => enabled(g,'start').click(),()=>{for(const r of records.values())r.retired=true});
      games.forEach((g,i)=>{
        assert.notEqual(g.state,outgoing[i],'start creates a distinct actual battle');
        assert.equal(g.state.started,true);assert.equal(g.state.t,0);assert.equal(g.state.paused,false);
        assert.equal(g.state.cash,1700);assert.equal(g.state.queue.length,0);
        assert.deepEqual(read(g,'[...selection]'),[]);assert.equal(g.run('ordinaryCommandGesture'),null);
        assert.equal(g.run('ordinaryCommandMode'),false);assert.equal(g.run('appendCommandMode'),false);
      });
      for(const witness of canceled)witness.record.tokens.forEach((token,i)=>
        assert.deepEqual(tokenFields(token),witness.fields[i],'reset preserves all token data and rejection flags'));
      restartCycles++;
    }
    function inert(label,action) {
      const before=games.map(snapshot),ui=games.map(controls);
      both(label,action);
      games.forEach((g,i)=>{
        assert.deepEqual(snapshot(g),before[i],`${label}: entire raw world and input remain unchanged`);
        assert.deepEqual(controls(g),ui[i],`${label}: UI remains unchanged`);
      });
      inertEventChecks++;
    }
    function staleProbes() {
      selectArmy();
      assert.deepEqual(read(current,'[...selection]'),[6,7,8]);
      for(const id of ['ordinaryCommand','appendCommand']) {
        release(id);
        inert(`${id}/late-click`,g=>enabled(g,id).click());
        for(const key of ['Enter',' ']) inert(`${id}/repeat-${key===' '?'Space':'Enter'}`,g=>{
          let prevented=false;
          enabled(g,id).dispatchEvent({type:'keydown',key,code:key===' '?'Space':'Enter',repeat:true,
            preventDefault(){prevented=true}});
          assert.equal(prevented,true,'stale key repeat is prevented');
        });
        inert(`${id}/late-click-after-repeat`,g=>enabled(g,id).click());
        games.forEach(g=>{
          assert.equal(g.run(id==='ordinaryCommand'?'validOrdinaryActivation()':'validAppendActivation()'),false);
          assert.equal(g.run(`${id}Mode`),false);
        });
      }
      for(const point of heldPoints) for(const type of ['pointerup','click'])
        inert(`retired-map-point/${type}`,g=>g.element('map').dispatchEvent(mapEvent(type,point)));
    }
    function step(label) {
      const times=games.map(g=>g.state.t),dt=1/60;
      both(label,g=>g.step(dt,dt));
      games.forEach((g,i)=>assert.ok(Math.abs(g.state.t-times[i]-dt)<1e-12,'exactly one natural fixed step'));
      both(`${label}/render`,g=>g.run('updateUI()'));
      simulationSteps++;caseSteps++;
    }
    check('initial-start');
    // These are two different real battles, not injected objects or fake rows.
    for(const id of ['ordinaryCommand','appendCommand']) {
      selectArmy();press(id);
      if(phase==='consumed') {
        completeActivation(id);
        const point=++pointerId;heldPoints.push(point);
        both(`${id}/held-map-point`,g=>g.element('map').dispatchEvent(mapEvent('pointerdown',point)));
        games.forEach(g=>{
          assert.equal(g.run('ordinaryCommandGesture.battle'),g.state);
          assert.equal(g.run('get(6).goal'),null,'pressing map has not issued a command');
        });
      } else games.forEach(g=>assert.equal(g.run(`${id}Mode`),false,'pending activation has not armed mode'));
      restart(`seed-${id}`);
    }
    for(let i=0;i<2;i++)assert.notEqual(records.get('ordinaryCommandActivation').battles[i],
      records.get('appendCommandActivation').battles[i],'ordinary and append witness two distinct old battles');
    for(let cycle=1;cycle<=20;cycle++) {
      staleProbes();
      // Spend real starting cash on an enabled production button in each actual
      // battle. Restart must reset this paid queue/economy identically.
      both(`cycle-${cycle}/paid-tank`,g=>{
        const purchase=g.elements.find(e=>e.dataset.unit==='tank');
        assert.ok(purchase&&!purchase.disabled,'actual tank purchase enabled');purchase.click();
        assert.equal(g.state.queue.length,1);assert.equal(g.state.queue[0].type,'tank');
        const cost=g.run('defs.tank.cost');assert.equal(g.state.cash,1700-cost);
        assert.equal(g.state.stats.spent[0],cost);
      });paidOrders++;
      both(`cycle-${cycle}/legal-map-command`,g=>g.element('map').dispatchEvent({
        type:'contextmenu',clientX:450,clientY:540,button:2,shiftKey:false}));
      games.forEach(g=>{
        assert.ok(g.run('[6,7,8].every(id=>get(id).goal!==null)'),'actual selected army accepted map command');
        assert.deepEqual(read(g,'[...selection]'),[6,7,8]);
      });
      const positions=games.map(g=>read(g,'[get(6).x,get(6).y]'));
      step(`cycle-${cycle}/natural-motion`);
      games.forEach((g,i)=>assert.notDeepEqual(read(g,'[get(6).x,get(6).y]'),positions[i],'command actually moves tank'));
      restart(`retention-cycle-${cycle}`);
    }
    // Tombstones have survived all 20 cycles. A new, deliberate gesture must
    // replace its own token, arm normally and issue a valid release-committed
    // point command. The other old token remains independently retired.
    staleProbes();
    for(const [index,id] of ['ordinaryCommand','appendCommand'].entries()) {
      const retired=records.get(`${id}Activation`);
      const replacement=press(id);
      games.forEach((g,i)=>assert.notEqual(replacement.tokens[i],retired.tokens[i],'fresh press replaces tombstone'));
      completeActivation(id);
      const point=++pointerId, x=500+index*40,y=540+index*40;
      for(const type of ['pointerdown','pointerup','click'])
        both(`${id}/fresh-valid-map-${type}`,g=>g.element('map').dispatchEvent(mapEvent(type,point,x,y)));
      games.forEach(g=>{
        assert.equal(g.run(`${id}Mode`),false);assert.equal(g.run('ordinaryCommandGesture'),null);
        assert.deepEqual(read(g,'[...selection]'),[6,7,8]);
        assert.ok(g.run('[6,7,8].every(id=>get(id).goal!==null)'));
        if(index===1)assert.equal(g.run('get(6).moveQueue.length'),2,'append preserves first goal and adds next waypoint');
      });
      assert.equal(retired.tokens[0].battle,retired.battles[0],'baseline old witness unchanged after replacement');
      assert.equal(retired.tokens[1].battle,null,'candidate old witness stays retired after replacement');
    }
    const beforeMotion=games.map(g=>read(g,'[get(6).x,get(6).y]'));
    for(let n=0;n<6;n++)step(`fresh-command-step-${n+1}`);
    games.forEach((g,i)=>{
      assert.notDeepEqual(read(g,'[get(6).x,get(6).y]'),beforeMotion[i]);
      assert.equal(g.state.result,null);assert.ok(g.state.t<1,'bounded short motion, no long battle');
    });
    results.push({name,status:'pass',seed:266,setupRestarts:2,retentionRestarts:20,
      distinctOldBattles:2,paidTankOrders:20,simulationSteps:caseSteps,comparisons:caseComparisons,
      freshOrdinaryAndAppendAccepted:true,staleReleaseClickRepeatRejected:true,
      normalization:'Only verified retired ordinary/append token .battle: actual old state in v265, null in v266'});
  }
  assert.equal(hash(fs.readFileSync(source)),SOURCE_HASH,'candidate source remains frozen');
  console.log(JSON.stringify({passed:results.length,failed:0,sourceSha256:SOURCE_HASH,referenceSha256:BASE_HASH,
    comparisons,exactReferenceChecks,inertEventChecks,restartCycles,paidOrders,simulationSteps,results,
    scope:'Six legal UI-only whole-source VM pairs: pointer/Enter/Space x pending/consumed. Two setup restarts establish tokens for distinct real outgoing battles, followed by 20 retention restart/start cycles per pair. Full state/economy/logs, selection, pending input and control values match at every event and fixed step after only exact, identity-checked retired token .battle normalization. Actual paid orders, stale release/click/repeat rejection, held map gesture cancellation, and fresh ordinary/append commands with bounded natural movement are checked. No world injection, factory fixture, direct finish, save/import/export action, native browser, heap/GC or speed claim. Startup/menu read-only save-status UI is unchanged; storage stays empty.'},null,2));
} finally {
  fs.rmSync(temp,{recursive:true,force:true});
}
