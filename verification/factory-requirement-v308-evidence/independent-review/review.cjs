'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');const parent=path.resolve(__dirname,'..'),base=path.join(parent,'v307-restored/RED/index.html'),source=path.join(parent,'v308-work/RED/index.html'),{loadGame}=require(path.join(parent,'v307-restored/RED/verification/vm-environment.cjs'));
const html=fs.readFileSync(source,'utf8');let checks=0,comparisons=0;const ok=f=>{f();checks++};
ok(()=>assert.equal(crypto.createHash('sha256').update(html).digest('hex'),'12948c5d80dc8fd6d3fe8b892bde912fedf0849a8d85366ee0468b6e8b199e70'));
let restored=html.replaceAll('v0.308','v0.307').split('\n').filter(l=>!l.startsWith('function productionFactoryRequirementReason(')).join('\n').replace("return productionFactoryRequirementReason();","return '需要已建成的战车工厂';").replace('tell(productionFactoryRequirementReason())',"tell('需要已建成的战车工厂')");ok(()=>assert.equal(restored,fs.readFileSync(base,'utf8')));
const snap=g=>g.run('JSON.stringify({state:{...state,logs:[]},uid,selection:[...selection],groups,placement,attackMode,restartPrompt})');const pair=()=>[loadGame(base,{seed:30893}).start(),loadGame(source,{seed:30893}).start()];function same(gs){ok(()=>assert.equal(snap(gs[0]),snap(gs[1])));comparisons++}
const kinds=['none','dead','enemy','building','both'];
for(const kind of kinds)for(const paused of [false,true])for(const phase of ['normal','full','prestart','terminal','restart'])for(const cash of [0,1700]){
 const gs=pair();for(const g of gs)g.run(`{let f=structures(0,'factory')[0];${kind==='none'?'state.entities=state.entities.filter(e=>e!==f)':kind==='dead'?'f.hp=0':kind==='enemy'?'f.team=1;f.build=5':kind==='building'?'f.build=5':"create('factory',0,500,700,true)"};state.paused=${paused};state.cash=${cash};${phase==='full'?"while(state.queue.length<8)state.queue.push({type:'tank',left:6,total:6})":phase==='prestart'?'state.started=false':phase==='terminal'?"state.result='test end'":phase==='restart'?'restartPrompt=true':''};updateUI()}`);
 const expected=phase==='prestart'?'尚未开始作战':phase==='terminal'?'战局已结束':phase==='restart'?'请先完成或取消重新部署确认':phase==='full'?'生产队列已满（8）':kind==='building'?(paused?'战车工厂施工中；当前暂停，请继续游戏以推进施工':'战车工厂施工中，完工后才能下新订单'):kind==='both'?(cash?'':'资金不足，还差 350资金'):'需要已建成的战车工厂';
 ok(()=>assert.equal(gs[1].run("productionPurchaseReason('tank')"),expected));same(gs);
 for(const g of gs)g.run("buy('tank')");same(gs);
 if(phase==='normal'&&kind==='building')ok(()=>assert.equal(gs[1].state.logs[0],expected));
}
// Natural user-input lifecycle on both versions: paid order, factory salvage, paid rebuild,
// blocked purchase while paused, resume, natural construction completion and successful purchase.
const gs=pair(),events=[];const both=f=>{gs.forEach(f);same(gs)};function point(g,p){for(const type of ['pointerdown','pointerup'])g.element('map').dispatchEvent({type,clientX:p.x,clientY:p.y,pointerId:71,isPrimary:true,button:0,pointerType:'mouse'})}
both(g=>g.click('pause'));both(g=>g.dispatch('keydown',{key:'4',code:'Digit4'}));
const paid=gs[1].state.queue[0],paidLeft=paid.left;
both(g=>point(g,g.run("structures(0,'factory')[0]")));both(g=>g.click('salvage'));
ok(()=>assert.equal(gs[1].run("structures(0,'factory').length"),0));ok(()=>assert.equal(gs[1].state.queue[0],paid));
let p=gs[1].run("(()=>{for(let y=60;y<760;y+=20)for(let x=60;x<1160;x+=20)if(canPlace('factory',{x,y}))return{x,y}})()");ok(()=>assert.ok(p));both(g=>g.document.querySelectorAll('[data-build]').find(b=>b.dataset.build==='factory').click());both(g=>point(g,p));
const before=snap(gs[1]);both(g=>g.dispatch('keydown',{key:'4',code:'Digit4'}));ok(()=>assert.equal(snap(gs[1]),before));ok(()=>assert.match(gs[1].state.logs[0],/施工中；当前暂停/));
both(g=>g.step(2));ok(()=>assert.equal(gs[1].state.queue[0].left,paidLeft));ok(()=>assert.equal(snap(gs[1]),before));
both(g=>g.click('pause'));ok(()=>assert.match(gs[1].run("productionPurchaseReason('tank')"),/完工后/));
for(let i=0;i<300;i++){both(g=>g.step(.05));if(gs[1].run("structures(0,'factory').some(e=>!e.build)")){events.push({kind:'naturally-completed',time:gs[1].state.t});break}}
ok(()=>assert.equal(gs[1].run("productionPurchaseReason('tank')"),''));both(g=>g.run('updateUI()'));ok(()=>assert.equal(gs[1].document.querySelectorAll('[data-unit]').find(b=>b.dataset.unit==='tank').disabled,false));const cash=gs[1].state.cash,q=gs[1].state.queue.length;both(g=>g.dispatch('keydown',{key:'4',code:'Digit4'}));ok(()=>assert.equal(gs[1].state.cash,cash-350));ok(()=>assert.equal(gs[1].state.queue.length,q+1));
for(let i=0;i<300;i++)both(g=>g.step(.05));ok(()=>assert.equal(gs[1].state.queue.length,0));ok(()=>assert.equal(gs[1].state.stats.produced[0],2));events.push({kind:'both-paid-orders-produced',time:gs[1].state.t});
console.log(JSON.stringify({checks,comparisons,failed:0,events,sourceSha256:crypto.createHash('sha256').update(html).digest('hex'),scope:'Independent v307 unchanged VM harness, matrix uses explicit boundary fixtures; natural lifecycle uses registered inputs and simulation only. State comparison excludes only human-readable logs. No native browser claim.'},null,2));
