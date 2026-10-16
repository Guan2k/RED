'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{loadGame}=require('./vm-environment.cjs'),restore=require('./restore-v254.cjs');const source=path.join(__dirname,'../index.html'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'red-waiting-natural-')),baselineFile=path.join(dir,'index.html');
try{
 fs.writeFileSync(baselineFile,restore(fs.readFileSync(source,'utf8')));const worlds=[loadGame(baselineFile,{seed:255}),loadGame(source,{seed:255})];for(const g of worlds){g.element('difficulty').value='easy';g.start()}let comparisons=0;const events=[];
 function compare(){assert.equal(worlds[0].run('JSON.stringify(state)'),worlds[1].run('JSON.stringify(state)'),'paired natural simulation differs');comparisons++}
 function run(s){const values=worlds.map(g=>g.run(s));compare();return values[1]}
 function step(s){for(const g of worlds)g.step(s);compare()}
 function build(type,p){assert.equal(run(`canPlace('${type}',${JSON.stringify(p)})`),true);for(const g of worlds)g.elements.find(n=>n.dataset.build===type).click();run(`place(${JSON.stringify(p)})`)}
 build('factory',{x:400,y:500});run('globalThis.forward=state.entities.at(-1)');build('power',run(`(()=>{for(let y=700;y>=350;y-=10)for(let x=40;x<=400;x+=10){let p={x,y};if(canPlace('power',p))return p}})()`));let staged=false,transfer=null,complete=false;
 while(!worlds[1].state.result){
  if(!staged&&run('forward.hp>0&&!forward.build&&forward.hp<=100&&state.cash>=730&&powered()')){run("buy('scout');buy('artillery');globalThis.watched=state.queue.find(q=>q.type==='artillery')");assert.equal(run('watched.factoryId'),run('forward.id'));staged=true;events.push({kind:'paid-artillery-bound-forward',t:worlds[1].state.t,hp:run('forward.hp')})}
  const before=staged?run('watched.left'):null;step(.25);
  if(staged&&!transfer&&run('forward.hp<=0')){transfer={t:worlds[1].state.t,leftBefore:before,leftAfter:run('watched.left'),factoryId:run('watched.factoryId')};assert.ok(transfer.leftAfter<=transfer.leftBefore+1e-8);assert.equal(run('state.queue.includes(watched)'),true);assert.equal(transfer.factoryId,null);run('updateUI()');const text=worlds[1].run('productionOrderRows.get(watched).statusNode.textContent');assert.match(text,/已完工工厂均占用，等待空闲/);assert.match(text,/已付费用及已有进度保留/);events.push({kind:'natural-factory-loss-paid-work-retained',...transfer,text})}
  if(transfer&&run('!state.queue.includes(watched)')){assert.equal(worlds[1].state.stats.produced[0],2);complete=true;events.push({kind:'both-original-orders-produced',t:worlds[1].state.t});break}
 }
 assert.equal(complete,true,'scene must complete rather than treating natural loss as success');console.log(JSON.stringify({passed:1,failed:0,comparisons,events,scope:'Paired exact v254/v255 full-source VM. Natural damage, legal paid construction and production only. No injected HP/cash/units or terminal state. Stops after both orders produce or natural terminal; terminal before coverage is failure, not product bug.'},null,2));
}finally{fs.rmSync(dir,{recursive:true,force:true})}
