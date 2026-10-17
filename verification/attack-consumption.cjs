'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const source=path.resolve(process.argv[2]||path.join(__dirname,'../index.html'));
const {loadGame}=require(path.join(path.dirname(source),'verification/vm-environment.cjs'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const sourceSha256=hash(fs.readFileSync(source)),g=loadGame(source,{seed:43801});
const plain=x=>JSON.parse(JSON.stringify(x));
let assertions=0,pointer=0,checkpoints=0;
function ok(v,m){assert.ok(v,m);assertions++}
function eq(a,b,m){assert.deepEqual(a,b,m);assertions++}
function press(id){const e=typeof id==='string'?g.element(id):id;ok(e&&!e.disabled,'legal enabled UI control');const pointerId=++pointer;for(const type of ['pointerdown','pointerup'])e.dispatchEvent({type,pointerId,isPrimary:true,button:0});e.click()}
function field(id,value,event='input'){const e=g.element(id);ok(e&&!e.disabled,'legal enabled UI field');e.value=String(value);e.dispatchEvent({type:event})}
function coordinate(id,p){field('coordinateCommandX',p.x);field('coordinateCommandY',p.y);press(id);ok(g.element('mapCommandReceipt').textContent.includes('已接收'),'coordinate order accepted')}
for(const[id,value]of [['scenario','classic'],['difficulty','normal'],['objective','annihilation'],['challenge','standard']])field(id,value,'change');
press('start');
const paidOrders=[];
for(let i=0;i<4;i++){
  const before={cash:g.state.cash,spent:g.state.stats.spent[0],queue:g.state.queue.length};
  const cost=g.run('defs.tank.cost');
  press(g.document.querySelectorAll('[data-unit]').find(e=>e.dataset.unit==='tank'));
  eq(g.state.cash,before.cash-cost,'real tank payment');eq(g.state.stats.spent[0],before.spent+cost,'real payment accounting');eq(g.state.queue.length,before.queue+1,'paid tank order inserted');
  paidOrders.push({cost,cashAfter:g.state.cash});
}
g.step(25);g.run('updateUI()');
const tanks=g.state.entities.filter(e=>e.team===0&&e.type==='tank'&&e.hp>0);
eq(tanks.length,6,'four purchased tanks naturally completed beside two original tanks');eq(g.state.queue.length,0,'all four paid orders completed');
press('selectArmy');const initialSelectedArmyIds=plain(g.run('[...selection]'));ok(initialSelectedArmyIds.includes(6),'owner six truly selected');eq(initialSelectedArmyIds.length,7,'seven naturally available starting and produced combat units selected');
const first=g.state.entities.find(e=>e.id===17),second=g.state.entities.find(e=>e.id===18);
ok(first&&second&&first.team===1&&second.team===1&&first.hp>0&&second.hp>0,'two live legal enemy targets');
coordinate('coordinateCommandExecute',first);coordinate('coordinateAppendExecute',second);
function snap(){const take=id=>{const e=g.state.entities.find(e=>e.id===id);return e?plain({id:e.id,hp:e.hp,max:e.max,x:e.x,y:e.y,target:e.target,goal:e.goal,attackMove:e.attackMove,attackQueue:e.attackQueue}):null};return{t:g.state.t,owner:take(6),first:take(17),second:take(18),result:g.state.result,kills:plain(g.state.stats.kills),losses:plain(g.state.stats.losses)}}
function alive(e){return !!e&&e.hp>0}
function ownerValid(s){ok(alive(s.owner),'owner survives through consumption');eq(s.result,null,'battle remains active');eq(s.owner.goal,null,'queued attack has no ground goal');eq(s.owner.attackMove,false,'queue remains targeted attack')}
function beforeDeath(s){ownerValid(s);ok(alive(s.first)&&alive(s.second),'both requested enemies still live');eq(s.owner.target,17,'retain first target until actual death');eq(s.owner.attackQueue,[17,18],'retain complete pending queue before death')}
function switched(s){ownerValid(s);eq(s.first,null,'first enemy actually removed by combat');ok(alive(s.second),'second target still alive at handoff');eq(s.owner.target,18,'current target switches to surviving queued enemy');eq(s.owner.attackQueue,[18],'dead queue head consumed exactly once')}
function timely(death,s){ok(s.t-death.t>=-1e-8&&s.t-death.t<=.05000001,'queue consumption within one observation interval')}
function exhausted(s){ownerValid(s);eq(s.first,null,'first target remains absent');eq(s.second,null,'second enemy actually removed by combat');eq(s.owner.target,null,'exhausted queue clears current target');ok(!Object.hasOwn(s.owner,'attackQueue'),'exhausted queue property removed')}
const initial=snap();beforeDeath(initial);
let firstDeath=null,secondDeath=null,handoff=null,empty=null,firstDamaged=false,secondDamaged=false;
const observedShots={first:false,second:false},trace=[initial];
// Fixed 0.05 s observation interval; at most one extra observation interval is
// allowed for the entity-update pass to consume a projectile death.
for(let n=0;n<1200&&!empty;n++){
  g.step(.05);const s=snap();checkpoints++;ownerValid(s);
  for(const shot of g.state.shots){if(shot.team===0&&shot.to===17)observedShots.first=true;if(shot.team===0&&shot.to===18)observedShots.second=true}
  if(s.first&&s.first.hp<initial.first.hp)firstDamaged=true;
  if(s.second&&s.second.hp<initial.second.hp)secondDamaged=true;
  if(alive(s.first)){beforeDeath(s)}
  else {
    if(!firstDeath){firstDeath=s;ok(firstDamaged,'first enemy took observed natural damage');ok(alive(s.second),'second enemy survives first death');ok(s.losses[1]>initial.losses[1],'enemy loss count records natural death');trace.push(s)}
    if(alive(s.second)){
      if(s.owner.target===18){switched(s);if(!handoff){timely(firstDeath,s);handoff=s;trace.push(s)}}
      else {ok(!handoff,'handed-off target must not regress');ok(s.t-firstDeath.t<=.05000001,'first dead head consumed by next observation');}
    }else{
      if(!secondDeath){secondDeath=s;ok(handoff,'handoff observed before second death');ok(secondDamaged,'second enemy took observed natural damage');ok(s.losses[1]>=initial.losses[1]+2,'both enemy deaths counted');trace.push(s)}
      if(s.owner.target===null&&!Object.hasOwn(s.owner,'attackQueue')){exhausted(s);timely(secondDeath,s);empty=s;trace.push(s)}
      else ok(s.t-secondDeath.t<=.05000001,'second dead head consumed by next observation');
    }
  }
  if(n%10===9)trace.push(s);
}
ok(firstDeath&&handoff&&secondDeath&&empty,'bounded natural scenario completed both transitions');
ok(observedShots.first&&observedShots.second,'observed real friendly projectiles towards both targets');
// Persistence: no stale ID or queue resurrection on later natural updates.
for(let i=0;i<20;i++){g.step(.05);const s=snap();checkpoints++;exhausted(s)}
const final=snap();trace.push(final);
const positiveAssertions=assertions;
const negativeCases=[
 ['late handoff rejected',handoff,s=>timely(firstDeath,s),s=>s.t=firstDeath.t+.1,'queue consumption within one observation interval'],
 ['late exhaustion rejected',empty,s=>timely(secondDeath,s),s=>s.t=secondDeath.t+.1,'queue consumption within one observation interval'],
 ['premature first-target replacement',initial,beforeDeath,s=>s.owner.target=18,'retain first target until actual death'],
 ['premature tail removal',initial,beforeDeath,s=>s.owner.attackQueue=[17],'retain complete pending queue before death'],
 ['dead current target retained',handoff,switched,s=>s.owner.target=17,'current target switches to surviving queued enemy'],
 ['dead head retained in queue',handoff,switched,s=>s.owner.attackQueue=[17,18],'dead queue head consumed exactly once'],
 ['live tail silently dropped',handoff,switched,s=>s.owner.attackQueue=[],'dead queue head consumed exactly once'],
 ['fake handoff while first lives',handoff,switched,s=>s.first=plain(initial.first),'first enemy actually removed by combat'],
 ['stale target after exhaustion',empty,exhausted,s=>s.owner.target=18,'exhausted queue clears current target'],
 ['empty queue retained',empty,exhausted,s=>s.owner.attackQueue=[],'exhausted queue property removed']
];
const negatives=[];
for(const[name,point,oracle,mutate,message]of negativeCases){const s=plain(point);mutate(s);assert.throws(()=>oracle(s),e=>e instanceof assert.AssertionError&&e.message.includes(message),name);negatives.push({name,detected:true,expected:message})}
assertions=positiveAssertions;eq(hash(fs.readFileSync(source)),sourceSha256,'source unchanged');
console.log(JSON.stringify({passed:1,failed:0,seed:43801,map:'classic',sourceSha256,counts:{correctnessAndPreconditions:assertions,pairing:0,negativeControls:negatives.length,checkpoints},paidOrders,initialSelectedArmyIds,finalSelectedArmyIds:plain(g.run('[...selection]')),firstDeathTime:firstDeath.t,handoffTime:handoff.t,secondDeathTime:secondDeath.t,exhaustionTime:empty.t,finalTime:final.t,observedShots,firstDamaged,secondDamaged,initial,handoff,empty,final,trace,negativeControls:negatives,scope:'One natural legal combat scenario: four paid tanks naturally complete, UI army selection, enemy 17 then appended enemy 18. Independent semantic assertions cover live-head retention, natural death, queued target handoff, exhaustion and one-second persistence. No state/damage/resource injection, no product changes, no browser/save/export. Negative controls mutate detached observation JSON only; no pairing or replay is claimed.'},null,2));
