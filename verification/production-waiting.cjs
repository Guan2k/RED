'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{loadGame}=require('./vm-environment.cjs');const source=path.resolve(process.argv[2]||path.join(__dirname,'../index.html')),results=[];
function test(name,fn){try{fn();results.push({name,status:'pass'})}catch(e){results.push({name,status:'fail',error:e.message})}}
function setup(){const g=loadGame(source).start();g.run("buy('tank');buy('artillery');globalThis.q=state.queue[1]");return g}
function explanation(g){return g.run('productionWaitingExplanation(q)')}
function status(g){g.run('updateUI()');return g.run('productionOrderRows.get(q).statusNode.textContent')}
const retained='已付费用及已有进度保留';
test('busy factory explains pending paid order',()=>{const g=setup();assert.match(explanation(g),/已完工工厂均占用，等待空闲/);assert.ok(explanation(g).includes(retained))});
test('existing remaining production seconds remain',()=>{const g=setup();assert.match(status(g),/还需生产 10 秒/);assert.ok(status(g).includes(retained))});
test('no surviving factory asks to build',()=>{const g=setup();g.run("state.entities=state.entities.filter(e=>e.type!=='factory'||e.team!==0);assignFactories()");assert.match(status(g),/没有存活工厂，请建造工厂/);assert.doesNotMatch(status(g),/建设中/)});
test('unfinished factory explains completion wait',()=>{const g=setup();g.run("structures(0,'factory')[0].build=3;assignFactories()");assert.match(status(g),/工厂建设中，等待完工/)});
test('dead factory is not construction evidence',()=>{const g=setup();g.run("structures(0,'factory')[0].hp=0;assignFactories()");assert.match(status(g),/没有存活工厂/)});
test('enemy factory cannot satisfy own factory wait',()=>{const g=setup();g.run("state.entities=state.entities.filter(e=>e.type!=='factory'||e.team!==0);assignFactories()");assert.match(status(g),/没有存活工厂/)});
test('unfinished extra factory does not hide completed busy factory',()=>{const g=setup();g.run("create('factory',0,50,450).build=3");assert.match(status(g),/已完工工厂均占用/)});
test('idle completed factory uses pending assignment not busy claim',()=>{const g=setup();g.run("create('factory',0,50,450)");assert.match(explanation(g),/等待分配可用工厂/);assert.doesNotMatch(explanation(g),/均占用/)});
test('partially worked order retains accurate seconds',()=>{const g=setup();g.run("q.left=3.2");assert.match(status(g),/还需生产 4 秒/);assert.ok(status(g).includes(retained))});
test('completed unassigned order still explains preserved paid work',()=>{const g=setup();g.run('q.left=0;q.waitingForExit=true');assert.match(status(g),/生产已完成/);assert.ok(status(g).includes(retained))});
test('assigned production has no waiting explanation',()=>{const g=setup();g.run('q=state.queue[0]');assert.equal(explanation(g),'')});
test('assigned exit-blocked order keeps exit status only',()=>{const g=setup();g.run('q=state.queue[0];q.left=0;q.waitingForExit=true');assert.equal(explanation(g),'');assert.match(status(g),/等待出口/)});
test('paused pending row still explains factual queue reason',()=>{const g=setup();g.click('pause');assert.match(status(g),/均占用/);assert.equal(g.state.paused,true)});
test('low power does not replace pending factory reason',()=>{const g=setup();g.run("structures(0,'power')[0].hp=0");assert.match(status(g),/均占用/)});
test('restart menu retains read-only pending explanation',()=>{const g=setup();g.run('restartPrompt=true');assert.match(status(g),/均占用/)});
test('terminal suppresses current waiting claims',()=>{const g=setup();g.run("state.result='战败'");assert.equal(explanation(g),'');assert.match(status(g),/已结束/);assert.doesNotMatch(status(g),/费用及已有进度/)});
test('prestart suppresses paid-order claims',()=>{const g=setup();g.run('state.started=false');assert.equal(explanation(g),'')});
test('foreign nonqueued object cannot be called paid',()=>{const g=setup();g.run('q={type:"tank",left:3,total:6}');assert.equal(explanation(g),'')});
test('cancelled reference has no stale paid claim',()=>{const g=setup();g.run('cancelProduction(q)');assert.equal(explanation(g),'')});
test('assignment removes explanation immediately',()=>{const g=setup();g.run('cancelProduction(state.queue[0])');assert.equal(explanation(g),'');assert.doesNotMatch(status(g),/已有进度保留/)});
test('readonly helper and repeated UI preserve game and inputs',()=>{const g=setup();g.run('selection=new Set([6]);groups[0]=[6];placement="power";attackMode=true');const snapshot=()=>g.run('JSON.stringify({state,selection:[...selection],groups,placement,attackMode,restartPrompt})');const before=snapshot();for(let i=0;i<5;i++){explanation(g);status(g)}assert.equal(snapshot(),before)});
test('status uses displayed current order identity',()=>{const g=setup();g.run("buy('scout');prioritizeProduction(state.queue[2])");assert.match(status(g),/^3\. 自行火炮/);assert.ok(status(g).includes(retained))});
test('victory suppresses waiting claims too',()=>{const g=setup();g.run("state.result='胜利'");assert.equal(explanation(g),'');assert.doesNotMatch(status(g),/费用及已有进度/)});
test('strict v254 restoration rejects unrelated source change',()=>{const rawSource=fs.readFileSync(source,'utf8'),raw=(rawSource.includes('ORIGINAL RTS / v0.257')||(rawSource.includes('ORIGINAL RTS / v0.258')||(rawSource.includes('ORIGINAL RTS / v0.259')||(rawSource.includes('ORIGINAL RTS / v0.260')||rawSource.includes('ORIGINAL RTS / v0.261')))))?require('./restore-v256.cjs')(rawSource):rawSource,html=raw.includes('ORIGINAL RTS / v0.256')?require('./restore-v255.cjs')(raw):raw,restore=require('./restore-v254.cjs');assert.equal(crypto.createHash('sha256').update(restore(html)).digest('hex'),'b5c164138d25f775c8b448984e24bf96f3be5ca8f59adfe257de5b5983d7abf6');assert.throws(()=>restore(html.replace('function repairSupport(e,dt){','function repairSupport(e,dt){void 0;')),/exact restored v254 hash/)});
const report={passed:results.filter(r=>r.status==='pass').length,failed:results.filter(r=>r.status==='fail').length,sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),scope:'Full-source VM / simulated DOM. Explicit isolated fixtures may set construction, HP, order work, menu and terminal fields; these are unit tests, not natural gameplay.',results};console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
