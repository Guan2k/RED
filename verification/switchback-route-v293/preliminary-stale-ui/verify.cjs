'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const source=path.resolve(__dirname,'../v292-package-tools/RED/index.html');
const {loadGame}=require('../v292-package-tools/RED/verification/vm-environment.cjs');
const sha=()=>crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),before=sha();
function run(seed){
 const g=loadGame(source,{seed}),actions=[],trace=[],events=[];let selected,repairOrdered=false;
 const note=(kind,extra={})=>actions.push({t:g.state.t,kind,...extra});
 for(const[id,value]of Object.entries({scenario:'switchback',objective:'stronghold',difficulty:'hard',challenge:'mobile',gameSpeed:'1'})){g.element(id).value=value;g.element(id).dispatchEvent({type:'change'});}g.start();
 const clickMap=(x,y)=>{const b=g.element('map'),ev={pointerId:1,pointerType:'mouse',isPrimary:true,button:0,clientX:x,clientY:y};for(const type of ['pointerdown','pointerup','click'])b.dispatchEvent({type,detail:1,...ev});};
 const select=id=>{const e=g.state.entities.find(e=>e.id===id);if(!e)return false;clickMap(e.x,e.y);selected=Array.from(g.run('[...selection]'));assert.deepEqual(selected,[id]);return true;};
 const order=(x,y,hold=false)=>{for(const[id,v]of [['coordinateCommandX',x],['coordinateCommandY',y]]){g.element(id).value=String(v);g.element(id).dispatchEvent({type:'input'});}assert.equal(g.element('coordinateCommandExecute').disabled,false);g.click('coordinateCommandExecute');if(hold)g.click('holdOnArrival');note('move',{selected,x,y,hold,receipt:g.element('mapCommandReceipt').textContent});};
 const buy=type=>{const b=g.elements.find(e=>e.dataset.unit===type),cash=g.state.cash;b.click();note('buy',{type,before:cash,after:g.state.cash,queue:g.state.queue.map(q=>q.type)});};
 select(8);order(570,500,true);select(6);order(620,465,true);select(7);order(620,535,true);
 select(4);order(600,500);g.click('rallyHold');note('rallyHold');
 buy('repair');buy('tank');buy('tank');buy('tank');
 let firstCapture=null,lastOwner=-1,lastHarvest=0,lastProduced=0,lastProgress=0,lastContested=false,contestSeconds=0;
 for(let tick=0;tick<300*60&&!g.state.result;tick++){
  g.step(1/60,1/60);const s=g.state,p=s.posts[1],present=[0,0];for(const e of s.entities)if(['tank','scout','artillery'].includes(e.type)&&Math.hypot(e.x-p.x,e.y-p.y)<65)present[e.team]++;
  const contested=present[0]>0&&present[1]>0;if(contested)contestSeconds+=1/60;
  if(p.owner!==lastOwner){events.push({t:s.t,kind:'owner',from:lastOwner,to:p.owner,present});lastOwner=p.owner;if(p.owner===0&&firstCapture===null)firstCapture=s.t;}
  if(contested!==lastContested){events.push({t:s.t,kind:'contest',active:contested,progress:[...s.controlProgress],present});lastContested=contested;}
  if(s.controlProgress[0]<lastProgress-0.1)events.push({t:s.t,kind:'reset',from:lastProgress,to:s.controlProgress[0]});lastProgress=s.controlProgress[0];
  if(s.stats.harvested[0]!==lastHarvest){events.push({t:s.t,kind:'harvest',total:s.stats.harvested[0],cash:s.cash});lastHarvest=s.stats.harvested[0];}
  if(s.stats.produced[0]!==lastProduced){events.push({t:s.t,kind:'produced',total:s.stats.produced[0],types:s.entities.filter(e=>e.team===0&&e.id>18).map(e=>({id:e.id,type:e.type}))});lastProduced=s.stats.produced[0];}
  if(tick%60===59){
   if(!repairOrdered){const r=s.entities.find(e=>e.team===0&&e.type==='repair');if(r){select(r.id);order(565,505);repairOrdered=true;}}
   if(s.cash>=450&&s.queue.length<3&&!s.result)buy('tank');
  }
  if(tick%300===0||s.result)trace.push({t:s.t,cash:s.cash,progress:[...s.controlProgress],owner:p.owner,present,contested,stats:JSON.parse(JSON.stringify(s.stats)),entities:s.entities.map(e=>({id:e.id,type:e.type,team:e.team,x:e.x,y:e.y,hp:e.hp,hold:e.hold,goal:e.goal}))});
 }
 const out={seed,source,sha256:before,config:{scenario:g.state.mapChoice,objective:g.state.objective,difficulty:g.state.difficulty,challenge:g.state.challenge},result:g.state.result||'timeout',time:g.state.t,firstCapture,contestSeconds,progress:g.state.controlProgress,stats:g.state.stats,narrative:g.element('intro').textContent,actions,events,trace,scope:'Whole source VM; normal select/change/start, map pointer selection, coordinate commands, arrival hold/rally hold, paid production. Fixed1/60 simulation steps. Read-only observations. No state/resource/entity injection or game-function commands.'};fs.writeFileSync(path.join(__dirname,`seed-${seed}.json`),JSON.stringify(out,null,2));console.log(JSON.stringify({seed,result:out.result,time:out.time,firstCapture,contestSeconds,progress:out.progress,stats:out.stats}));return out;
}
for(const seed of [29301,29302,29303])run(seed);assert.equal(sha(),before);
