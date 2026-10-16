'use strict';
// Legal paired gameplay witness. Only public UI handlers and fixed simulation
// steps change gameplay. No state injection, source patching, or persistence.
const nodeAssert = require('node:assert/strict');
let assertions = 0;
const assert = Object.fromEntries(['equal','notEqual','deepEqual','ok'].map(k =>
  [k,(...args) => { assertions++; return nodeAssert[k](...args); }]));
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const crypto = require('node:crypto');
const {loadGame} = require('./vm-environment.cjs');
const SOURCE_HASH = '4a7bd31abc7c433f5de2637677cb8d11d5fa4ec75094ac5e8c7d9d9fdb0fb05f';
const BASE_HASH = '73c86d0eb92947d85c70fd47470f1c7c120d36c6f1f120ad84a3bf789546c3fe';
const source = path.resolve(process.argv[2] || path.join(__dirname,'../index.html'));
const evidence = process.argv[3] ? path.resolve(process.argv[3]) : null;
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const plain = value => JSON.parse(JSON.stringify(value));
const read = (g,expression) => JSON.parse(g.run(`JSON.stringify(${expression},(key,value)=>{
  if(value===undefined)return {__undefined__:true};
  if(typeof value==='number'&&!Number.isFinite(value))return {__nonfinite__:String(value)};
  if(value instanceof Set)return {__set__:[...value]};
  if(value instanceof Map)return {__map__:[...value]};
  return value;
})`));
// Preserve complete state, including every entity, order, ore, effect and log.
// Additional outside-state delivery/navigation records are compared as well.
const world = g => read(g,`({state,uid,groups,simulationRemainder,
  harvesterDeliveries:state.entities.map(e=>[e.id,harvesterDeliveries.get(e)]),
  navigationMemory:state.entities.map(e=>[e.id,navigationMemory.get(e)])})`);
const input = g => read(g,`({selection:[...selection],placement,attackMode,drag,
  ordinaryCommandMode,appendCommandMode,ordinaryCommandGesture,
  ordinaryCommandActivation,appendCommandActivation,factoryExitActivation,
  mouse,hoverActive,selectionClickCandidate,lastSelectionClick,doubleClickSelection,
  last,uiClock,restartPrompt,resumeAfterCancel,coordinateAidEnabled,coordinateMouseBaseline,
  activeMapCommandReceipt,commandSpaceActivations:[...commandSpaceActivations].map(([node,value])=>[node.id||node.dataset.build,value])})`);
const temp = fs.mkdtempSync(path.join(os.tmpdir(),'red-v272-refinery-natural-'));
const baseline = path.join(temp,'index.html');
let comparisons=0,simulationSteps=0,selectionChecks=0,fullNoOps=0,legalBuilds=0,legalSalvages=0;
const results=[];
try {
  const html=fs.readFileSync(source,'utf8');
  assert.equal(digest(html),SOURCE_HASH,'frozen v272 source');
  const reversePath=path.join(__dirname,'restore-v266.cjs');
  // Exact in-package reversal makes this witness portable and verifies the
  // whole baseline without downloading or silently accepting another release.
  assert.ok(fs.existsSync(reversePath),'portable byte-exact v266 reversal is present');
  const restored=require(reversePath)(require('./restore-v267.cjs')(require('./restore-v268.cjs')((sourceText=>require('./restore-v269.cjs')((sourceText.includes('ORIGINAL RTS / v0.271')||sourceText.includes('ORIGINAL RTS / v0.272'))?(sourceText=>require('./restore-v270.cjs')(sourceText.includes('ORIGINAL RTS / v0.272')?require('./restore-v271.cjs')(sourceText):sourceText))(sourceText):sourceText))(html))));
  assert.equal(digest(restored),BASE_HASH,'byte-exact published v266 reference');
  fs.writeFileSync(baseline,restored);
  for(const scenario of ['salvage-rebuild-fresh-id','completion-changes-rendered-destination']) {
    const assertionStart=assertions,comparisonStart=comparisons,stepStart=simulationSteps;
    const games=[baseline,source].map(s=>loadGame(s,{seed:267}).start());
    const [old,g]=games,events=[],inputs=[],confirmations=[],deposits=[];
    const minerId=g.state.entities.find(e=>e.team===0&&e.type==='harvester').id;
    const oldRef=plain(g.state.entities.find(e=>e.team===0&&e.type==='refinery'));
    let pointerId=100,localSteps=0;
    const miner=x=>x.state.entities.find(e=>e.id===minerId);
    const refs=x=>x.state.entities.filter(e=>e.team===0&&e.type==='refinery'&&e.hp>0);
    const phase=x=>x.run(`harvesterWorkState(get(${minerId}))`);
    // Independent host-side nearest-distance oracle, using observed real
    // entities and source-order tie breaking, never the feature helper.
    const currentTarget=x=>{
      const m=miner(x);let target=null,distance=Infinity;
      for(const r of refs(x).filter(r=>!r.build)){
        const d=Math.hypot(m.x-r.x,m.y-r.y);
        if(!target||d<distance){target=r;distance=d;}
      }
      return target?.id??null;
    };
    games.forEach((x,index)=>{x.context.confirm=text=>{confirmations.push({game:index===0?'v266':'v272',t:x.state.t,text,accepted:true});return true;};});
    function check(label) {
      assert.deepEqual(world(old),world(g),`${scenario}/${label}: exact entire paired world`);
      assert.equal(old.storage.size,0);assert.equal(g.storage.size,0);
      comparisons++;
    }
    function snapshot(label,extra={}) {
      events.push({label,t:g.state.t,miner:plain(miner(g)),phase:phase(g),
        expectedLiveRefineryId:currentTarget(g),refineries:plain(refs(g)),
        cash:g.state.cash,income:g.state.stats.income[0],spent:g.state.stats.spent[0],
        harvested:g.state.stats.harvested[0],ore:plain(g.state.ores),
        candidateSelection:read(g,'[...selection]'),baselineSelection:read(old,'[...selection]'),
        button:{hidden:g.element('deliveryRefineryRow').hidden,disabled:g.element('selectDeliveryRefinery').disabled,text:g.element('selectDeliveryRefinery').textContent},
        worldSha256:digest(JSON.stringify(world(g))),...extra});
    }
    function both(label,action) {
      games.forEach((x,index)=>action(x,index));check(label);
    }
    function mapEvent(x,type,p,id) {
      x.element('map').dispatchEvent({type,clientX:p.x,clientY:p.y,pointerId:id,
        pointerType:'mouse',button:0,isPrimary:true,shiftKey:false,detail:1});
    }
    function canvasSelect(x,id,pointer) {
      const entity=x.state.entities.find(e=>e.id===id);assert.ok(entity?.hp>0);
      const p={x:entity.x,y:entity.y};
      for(const type of ['pointerdown','pointerup','click'])mapEvent(x,type,p,pointer);
      assert.deepEqual(read(x,'[...selection]'),[id],'actual canvas selected requested entity');
    }
    function selectBoth(id,label='canvas-select') {
      const pointer=++pointerId;
      inputs.push({kind:'paired-canvas-selection',t:g.state.t,id,pointer});
      both(label,x=>canvasSelect(x,id,pointer));
      assert.deepEqual(input(old),input(g),'identical real canvas inputs align all selection/input fields');
    }
    function key(x,key) {
      x.dispatch('keydown',{key,code:key==='Escape'?'Escape':'Key'+key.toUpperCase(),repeat:false,
        shiftKey:false,ctrlKey:false,altKey:false,metaKey:false,isComposing:false,keyCode:0});
    }
    function returnCargo() {
      selectBoth(minerId,'reselect-miner-to-refresh-controls');
      assert.equal(g.element('returnCargo').disabled,false);
      inputs.push({kind:'paired-keyboard',key:'g',t:g.state.t});
      both('accepted-real-G',x=>key(x,'g'));
      assert.equal(miner(g).returnCargo,true);
      assert.equal(g.element('selectDeliveryRefinery').disabled,false);
      assert.equal(g.element('deliveryRefineryRow').hidden,false);
      snapshot('G-accepted');
    }
    function tick() {
      const before={load:miner(g).load,ore:g.state.ores[0].amount+g.state.ores[1].amount,
        cash:g.state.cash,income:g.state.stats.income[0],spent:g.state.stats.spent[0],harvested:g.state.stats.harvested[0]};
      games.forEach(x=>x.step(1/60,1/60));simulationSteps+=2;localSteps++;
      check(`fixed-step-${localSteps}`);
      const credited=g.state.stats.harvested[0]-before.harvested,m=miner(g);
      assert.equal(g.state.result,null);assert.ok(m?.hp>0);assert.ok(g.state.t<=45,'bounded first-delivery/recollection window');
      assert.equal(g.state.cash-before.cash,credited,'only actual delivery changes friendly cash during step');
      assert.equal(g.state.stats.income[0]-before.income,credited);
      assert.equal(g.state.stats.spent[0],before.spent);
      if(credited) {
        assert.equal(credited,before.load);assert.equal(m.load,0);assert.equal(m.returnCargo,false);
        deposits.push({t:g.state.t,amount:credited,cash:g.state.cash,income:g.state.stats.income[0],
          harvested:g.state.stats.harvested[0],oreIndex:m.oreIndex,nearestRefinery:currentTarget(g)});
        snapshot('actual-deposit');
      } else assert.ok(m.load>=before.load,'no cargo loss outside actual delivery');
      if(m.load>before.load)assert.equal(before.ore-g.state.ores[0].amount-g.state.ores[1].amount,m.load-before.load);
    }
    function until(predicate) { while(!predicate())tick(); }
    function advanceTo(time) {until(()=>g.state.t>=time-1e-9);}
    function build(p) {
      const previews=games.map(x=>read(x,`constructionPreview('refinery',${JSON.stringify(p)})`));
      assert.deepEqual(previews[0],previews[1]);assert.equal(previews[1].canBuild,true);assert.equal(previews[1].cost,650);
      const beforeCash=g.state.cash,beforeSpent=g.state.stats.spent[0],priorIds=refs(g).map(e=>e.id);
      const pointer=++pointerId;
      inputs.push({kind:'paired-refinery-purchase-placement',t:g.state.t,p,preview:previews[1],pointer});
      both('legal-paid-refinery-build',x=>{
        const b=x.document.querySelectorAll('[data-build]').find(b=>b.dataset.build==='refinery');
        assert.equal(b.disabled,false);b.click();
        for(const type of ['pointerdown','pointerup','click'])mapEvent(x,type,p,pointer);
      });
      const ref=refs(g).find(e=>!priorIds.includes(e.id));assert.ok(ref);assert.equal(ref.build,9);
      assert.equal(g.state.cash,beforeCash-650);assert.equal(g.state.stats.spent[0],beforeSpent+650);
      legalBuilds+=2;snapshot('legal-refinery-construction-paid',{newRefineryId:ref.id,preview:previews[1]});
      return ref.id;
    }
    function unavailable(label) {
      assert.equal(g.element('selectDeliveryRefinery').disabled,true);
      assert.equal(g.element('deliveryRefineryRow').hidden,true);
      const before=world(g),beforeInput=input(g);g.click('selectDeliveryRefinery');
      assert.deepEqual(world(g),before);assert.deepEqual(input(g),beforeInput);
      fullNoOps++;check(label);snapshot(label);
    }
    function choose(label,targetId,{pending=false,staleText=null}={}) {
      assert.equal(currentTarget(g),targetId,'expected target independently uses actual nearest completed living refinery');
      assert.ok(['returning','delivery'].includes(phase(g)));
      assert.equal(g.element('selectDeliveryRefinery').disabled,false);
      assert.equal(g.element('deliveryRefineryRow').hidden,false);
      if(staleText!==null)assert.equal(g.element('selectDeliveryRefinery').textContent,staleText,'render still shows old target');
      const target=plain(g.state.entities.find(e=>e.id===targetId));
      assert.equal(target.team,0);assert.equal(target.type,'refinery');assert.equal(target.build,0);assert.ok(target.hp>0);
      if(!staleText)assert.equal(g.element('selectDeliveryRefinery').textContent,
        `选择当前交矿精炼厂 · #${targetId}（${Math.round(target.x)},${Math.round(target.y)}）`);
      if(pending) {
        // Both versions arm a genuine, not-yet-released point command. The
        // baseline needs Escape before manual canvas selection; v272 selects
        // and cancels the held command in the single new button action.
        const pointer=++pointerId,p={x:460,y:520};
        both('arm-real-pending-map-command',x=>{
          assert.equal(x.element('ordinaryCommand').disabled,false);x.click('ordinaryCommand');
          mapEvent(x,'pointerdown',p,pointer);
        });
        assert.equal(g.run('ordinaryCommandMode'),true);assert.ok(g.run('ordinaryCommandGesture'));
        inputs.push({kind:'paired-held-ordinary-command',t:g.state.t,pointer,p});
      }
      const beforeWorld=games.map(world),beforeInput=games.map(input);
      const buttonText=g.element('selectDeliveryRefinery').textContent;
      const p=++pointerId;
      inputs.push({kind:'differential-selection',label,t:g.state.t,baseline:pending?'Escape then canvas':'canvas',
        candidate:'selectDeliveryRefinery',targetId,pointer:p,buttonText});
      if(pending)key(old,'Escape');
      canvasSelect(old,targetId,p);
      g.click('selectDeliveryRefinery');
      games.forEach((x,i)=>assert.deepEqual(world(x),beforeWorld[i],`${label}: selection never changes full world`));
      const expectedCandidate=plain(beforeInput[1]);
      Object.assign(expectedCandidate,{selection:[targetId],placement:null,attackMode:false,drag:null,
        ordinaryCommandMode:false,appendCommandMode:false,ordinaryCommandGesture:null,
        selectionClickCandidate:null,lastSelectionClick:0,doubleClickSelection:false});
      if(expectedCandidate.ordinaryCommandActivation)expectedCandidate.ordinaryCommandActivation.canceled=true;
      if(expectedCandidate.appendCommandActivation)expectedCandidate.appendCommandActivation.canceled=true;
      if(expectedCandidate.factoryExitActivation)expectedCandidate.factoryExitActivation.canceled=true;
      assert.deepEqual(input(g),expectedCandidate,`${label}: only explicitly expected selection/pending-input changes`);
      const expectedBaseline=plain(beforeInput[0]);
      Object.assign(expectedBaseline,{selection:[targetId],placement:null,attackMode:false,drag:null,
        ordinaryCommandMode:false,appendCommandMode:false,ordinaryCommandGesture:null,
        selectionClickCandidate:null,lastSelectionClick:1,doubleClickSelection:false,
        mouse:{x:target.x,y:target.y},hoverActive:true});
      if(pending) {
        if(expectedBaseline.ordinaryCommandActivation)expectedBaseline.ordinaryCommandActivation.canceled=true;
        if(expectedBaseline.appendCommandActivation)expectedBaseline.appendCommandActivation.canceled=true;
      }
      assert.deepEqual(input(old),expectedBaseline,`${label}: baseline input differs exactly by real canvas position/click counter`);
      check(label);selectionChecks++;
      assert.deepEqual(read(g,'[...selection]'),[targetId]);assert.deepEqual(read(old,'[...selection]'),[targetId]);
      assert.equal(g.element('deliveryRefineryRow').hidden,true);assert.equal(g.element('selectDeliveryRefinery').disabled,true);
      snapshot(label,{selectedRefineryId:targetId,renderedBefore:buttonText,staleRender:staleText!==null,pendingCommandCanceled:pending,
        baselineInputAfter:input(old),candidateInputAfter:input(g)});
      if(pending) {
        const before=games.map(world),beforeInputs=games.map(input);
        const held=inputs.findLast(e=>e.kind==='paired-held-ordinary-command');
        for(const type of ['pointerup','click'])games.forEach(x=>mapEvent(x,type,held.p,held.pointer));
        games.forEach((x,i)=>{
          assert.deepEqual(world(x),before[i],'late held point cannot issue old command');
          const expected=plain(beforeInputs[i]);expected.lastSelectionClick=0;
          assert.deepEqual(input(x),expected,'late click changes only inert click counter');
        });
        fullNoOps+=2;check('late-old-point-does-not-command');
      }
    }
    check('initial');selectBoth(minerId);
    inputs.push({kind:'paired-ore-assignment',t:g.state.t,oreIndex:1});
    both('actual-ore-assignment',x=>x.element('map').dispatchEvent({type:'contextmenu',
      clientX:x.state.ores[1].x,clientY:x.state.ores[1].y,button:2,shiftKey:false}));
    assert.equal(miner(g).oreIndex,1);
    let chosenId,expectedLoad;
    if(scenario==='salvage-rebuild-fresh-id') {
      until(()=>miner(g).load===45);snapshot('naturally-mined-45');
      assert.equal(g.state.ores[1].amount,11955);assert.equal(g.state.cash,1700);
      returnCargo();selectBoth(oldRef.id);
      inputs.push({kind:'paired-confirmed-salvage',t:g.state.t,id:oldRef.id});
      both('salvage-old-refinery',x=>{assert.equal(x.element('salvage').disabled,false);x.click('salvage')});
      legalSalvages+=2;assert.equal(confirmations.length,2);assert.equal(refs(g).length,0);
      assert.equal(g.state.cash,2025);assert.equal(g.state.stats.income[0],325);
      assert.equal(g.state.stats.harvested[0],0);assert.equal(g.state.stats.losses[0],0);
      selectBoth(minerId);unavailable('absent-refinery-button-inert');
      advanceTo(g.state.t+1);assert.equal(phase(g),'noRefinery');
      chosenId=build({x:oldRef.x,y:oldRef.y});assert.notEqual(chosenId,oldRef.id);
      selectBoth(minerId);unavailable('unfinished-replacement-button-inert');
      until(()=>g.state.entities.find(e=>e.id===chosenId).build===0);
      assert.equal(miner(g).load,45);assert.equal(miner(g).returnCargo,true);assert.equal(miner(g).oreIndex,1);
      selectBoth(minerId);snapshot('completed-replacement-current-target');
      choose('select-fresh-id-after-legal-loss-rebuild',chosenId,{pending:true});
      expectedLoad=45;
    } else {
      advanceTo(3);
      chosenId=build({x:190,y:490});
      selectBoth(minerId);
      // Natural gathering continues while the paid nearer refinery is built.
      // Render old destination with less than a frame's UI refresh interval
      // remaining; completing construction then changes live destination.
      until(()=>g.state.entities.find(e=>e.id===chosenId).build<=1/60+1e-9);
      assert.ok(miner(g).load>0);assert.equal(g.state.stats.harvested[0],0);
      expectedLoad=miner(g).load;returnCargo();
      assert.equal(currentTarget(g),oldRef.id);
      const staleText=g.element('selectDeliveryRefinery').textContent;
      assert.ok(staleText.includes(`#${oldRef.id}（`));
      const renderedAt=g.state.t;
      until(()=>g.state.entities.find(e=>e.id===chosenId).build===0);
      assert.ok(g.state.t-renderedAt<.15,'legal completion falls inside normal UI refresh interval');
      assert.equal(currentTarget(g),chosenId);assert.equal(miner(g).load,expectedLoad);
      assert.equal(g.element('selectDeliveryRefinery').textContent,staleText);
      snapshot('completion-changes-live-target-before-render',{renderedAt,oldTarget:oldRef.id,newTarget:chosenId});
      choose('stale-render-revalidates-newly-completed-nearer-refinery',chosenId,{staleText});
    }
    // Observe actual return motion while refineries, not miners, are selected.
    const startPosition={x:miner(g).x,y:miner(g).y};
    until(()=>phase(g)==='delivery');
    assert.ok(Math.hypot(miner(g).x-startPosition.x,miner(g).y-startPosition.y)>0,'miner continues its prior return order');
    assert.equal(g.state.stats.harvested[0],0);
    selectBoth(minerId);assert.equal(phase(g),'delivery');
    choose('select-current-refinery-at-delivery-edge',chosenId);
    until(()=>deposits.length===1);
    assert.equal(deposits[0].amount,expectedLoad);assert.equal(miner(g).oreIndex,1);
    until(()=>miner(g).load>0);
    assert.equal(deposits.length,1);assert.equal(g.state.stats.harvested[0],expectedLoad);
    assert.equal(g.state.ores[0].amount+g.state.ores[1].amount,24000-expectedLoad-miner(g).load);
    assert.equal(miner(g).oreIndex,1);
    assert.deepEqual(read(g,`harvesterDeliveries.get(get(${minerId}))`),{trips:1,total:expectedLoad,lastAt:deposits[0].t});
    snapshot('natural-recollection-after-one-exact-delivery');
    results.push({scenario,status:'pass',seed:267,assertions:assertions-assertionStart,
      worldComparisons:comparisons-comparisonStart,simulationSteps:simulationSteps-stepStart,
      oldRefineryId:oldRef.id,selectedRefineryId:chosenId,expectedLoad,
      confirmations,inputs,deposits,events});
  }
  assert.equal(digest(fs.readFileSync(source)),SOURCE_HASH,'candidate source unchanged');
  assert.equal(digest(fs.readFileSync(baseline)),BASE_HASH,'reconstructed baseline unchanged');
  const result={status:'pass',passed:results.length,failed:0,sourceSha256:SOURCE_HASH,baselineSha256:BASE_HASH,
    portableReversal:fs.existsSync(path.join(__dirname,'restore-v266.cjs')),cases:results.length,assertions,
    checks:{worldComparisons:comparisons,simulationSteps,selectionChecks,fullNoOps,legalBuilds,legalSalvages},results,
    scope:'Two fresh classic/normal/standard seeded paired battles. Real canvas, keyboard, purchase, salvage confirmation and button handlers; fixed 1/60-second simulation. Full state/uid/groups/remainder plus live per-entity navigation and delivery records compared without normalization. Candidate selection/input changes asserted against explicit exact snapshots. No artificial money, ore, load, damage, entities, timers, commands, or state injection; no save/load/import/export, browser, network, user computer, or publication. Simulated DOM is not browser evidence.',
    conclusion:'Manual v266 canvas selection and v272 current-delivery-refinery selection preserve identical complete worlds, first delivery and assigned-ore resumption. Legal refinery loss/rebuild selects a fresh live id. Paid nearer-refinery completion changes the live target between render and click, and the new button selects the current target. Pending point input is canceled without issuing an order.'};
  if(evidence){fs.mkdirSync(evidence,{recursive:true});fs.writeFileSync(path.join(evidence,'result.json'),JSON.stringify(result,null,2)+'\n');}
  console.log(JSON.stringify({...result,results:results.map(r=>({scenario:r.scenario,status:r.status,assertions:r.assertions,
    worldComparisons:r.worldComparisons,simulationSteps:r.simulationSteps,oldRefineryId:r.oldRefineryId,
    selectedRefineryId:r.selectedRefineryId,expectedLoad:r.expectedLoad,deposit:r.deposits[0],completedAt:r.events.at(-1).t}))},null,2));
} finally {fs.rmSync(temp,{recursive:true,force:true});}
