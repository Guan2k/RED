const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {test}=require('node:test');

const root=path.join(__dirname,'..');
const gameplay=fs.readFileSync(path.join(root,'src/script/02-gameplay.jsfrag'),'utf8');
const renderer=fs.readFileSync(path.join(root,'src/script/03-renderer.jsfrag'),'utf8');
const effects=gameplay.slice(gameplay.indexOf('const MAX_EFFECTS='),gameplay.indexOf('function tell('));
const damage=gameplay.slice(gameplay.indexOf('function applyShotDamage('),gameplay.indexOf('function finish('));

function sandbox(){
  const context={
    state:{fx:[],entities:[],t:3,stats:{kills:[0,0],losses:[0,0]}},
    defs:{tank:{speed:60},scout:{speed:110},hq:{speed:0},artillery:{speed:50,damage:20,splashRadius:60,splashDamage:15}},
    selection:new Set(),selectedDeathUiDirty:false,
    reportBaseDamage(){},reportHarvesterDamage(){},
    dist:(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)
  };
  vm.createContext(context);
  vm.runInContext(effects+damage,context);
  return context;
}
const types=fx=>fx.map(f=>f.type);

test('killing a vehicle creates burst, sparks, smoke and lingering ground mark',()=>{
  const c=sandbox(),vehicle={id:7,type:'tank',r:17,x:100,y:130,hp:18,team:1};
  c.state.entities=[vehicle];c.selection.add(vehicle.id);
  const destroyed=new Set();
  c.applyShotDamage(vehicle,20,0,destroyed);
  assert.equal(vehicle.hp,-2);
  assert.equal(c.state.stats.kills[0],1);
  assert.equal(c.state.stats.losses[1],1);
  assert.equal(c.selectedDeathUiDirty,true);
  assert.deepEqual([...destroyed],[]);
  for(const type of ['boom','spark','smoke','scorch'])assert.ok(types(c.state.fx).includes(type),type);
  const scar=c.state.fx.find(f=>f.type==='scorch');
  assert.equal(scar.t,30);
  assert.ok(scar.radius>0);
  assert.ok(c.state.fx.every(f=>Number.isFinite(f.x)&&Number.isFinite(f.y)&&Number.isFinite(f.t)&&f.max>0));
  c.applyShotDamage(vehicle,20,0,destroyed);
  assert.equal(c.state.stats.kills[0],1,'the same unit is only destroyed once');
});

test('building destruction has a stronger effect and preserves HQ victory tracking',()=>{
  const c=sandbox(),hq={id:11,type:'hq',r:40,x:450,y:430,hp:8,team:1};
  const destroyed=new Set();
  c.applyShotDamage(hq,9,0,destroyed);
  assert.deepEqual([...destroyed],[1]);
  assert.equal(c.state.fx.filter(f=>f.type==='spark').length,10);
  assert.equal(c.state.fx.filter(f=>f.type==='smoke').length,5);
  assert.ok(c.state.fx.find(f=>f.type==='scorch').radius>40);
});

test('normal hit generates hot fragments while artillery splash damage remains intact',()=>{
  const c=sandbox();
  const target={id:2,type:'tank',r:15,x:200,y:200,hp:80,team:1};
  const nearby={id:3,type:'scout',r:12,x:225,y:200,hp:70,team:1};
  c.state.entities=[target,nearby];
  c.impactShot({damage:20,kind:'artillery',team:0},target,new Set());
  assert.equal(target.hp,60);
  assert.equal(nearby.hp,70-15*(1-25/60));
  assert.ok(types(c.state.fx).includes('hit'));
  assert.ok(types(c.state.fx).includes('blast'));
  assert.equal(c.state.fx.filter(f=>f.type==='spark').length,6);
  assert.ok(!types(c.state.fx).includes('scorch'),'a surviving unit leaves no wreckage');
});

test('cosmetic particle geometry is deterministic, finite and capped at 256',()=>{
  const a=sandbox(),b=sandbox();
  a.spawnImpactSparks(99,147,30,18,7);
  b.spawnImpactSparks(99,147,30,18,7);
  assert.equal(JSON.stringify(a.state.fx),JSON.stringify(b.state.fx));
  for(let i=0;i<40;i++)a.spawnDestructionEffects({id:i+1,type:'hq',r:24,x:400,y:500});
  assert.equal(a.state.fx.length,256);
  assert.equal(a.state.fx.at(-1).type,'scorch');
  assert.ok(a.state.fx.every(f=>Object.values(f).filter(v=>typeof v==='number').every(Number.isFinite)));
  const active=a.state.fx.filter(f=>f.t>3).length;
  assert.ok(active>0);
  a.state.fx.forEach(f=>f.t-=3);
  a.state.fx=a.state.fx.filter(f=>f.t>0);
  assert.ok(a.state.fx.length<256);
  assert.ok(types(a.state.fx).includes('scorch'));
  a.state.fx.forEach(f=>f.t-=30);
  a.state.fx=a.state.fx.filter(f=>f.t>0);
  assert.equal(a.state.fx.length,0);
});

test('marks are below units, particle drawing uses saved canvas state',()=>{
  const scar=renderer.indexOf('drawBattleScars();'),units=renderer.indexOf('for(let e of state.entities){',renderer.indexOf('function render(){'));
  assert.ok(scar>renderer.indexOf('function render(){')&&scar<units);
  const code=renderer.slice(renderer.indexOf('function drawBattleScars(){'),renderer.indexOf('function render(){'));
  const calls=[],stack=[],canvas={
    globalAlpha:.81,globalCompositeOperation:'source-over',
    save(){stack.push({globalAlpha:this.globalAlpha,globalCompositeOperation:this.globalCompositeOperation});},
    restore(){Object.assign(this,stack.pop());},
    beginPath(){},closePath(){},fill(){},stroke(){},moveTo(){},lineTo(){},rect(){},fillRect(){},
    ellipse(){calls.push('ellipse');},arc(){calls.push('arc');}
  };
  const c={ctx:canvas,state:{fx:[{type:'scorch',x:50,y:60,t:12,max:30,radius:24,seed:3}]}};
  c.circle=(x,y,r,color)=>{canvas.beginPath();canvas.arc(x,y,r,0,Math.PI*2);canvas.fillStyle=color;canvas.fill();};
  c.rect=(x,y,w,h,color)=>{canvas.fillStyle=color;canvas.fillRect(x,y,w,h);};
  c.text=()=>{};
  vm.createContext(c);vm.runInContext(code,c);
  c.drawBattleScars();
  const fx=sandbox();
  fx.spawnDestructionEffects({id:1,type:'tank',r:15,x:50,y:60});
  for(const f of fx.state.fx)c.drawBattleEffect(f);
  c.drawBattleEffect({type:'hit',x:50,y:60,t:.12,max:.3});
  c.drawBattleEffect({type:'blast',x:50,y:60,radius:30,t:.18,max:.35});
  c.drawBattleEffect({type:'flash',x:50,y:60,t:.1,max:.12});
  c.drawBattleEffect({type:'order',x:50,y:60,t:.3,max:.6});
  c.drawBattleEffect({type:'repair',x:50,y:60,x2:60,y2:70,t:.2,max:.3});
  assert.ok(calls.includes('ellipse'));
  assert.ok(calls.includes('arc'));
  assert.equal(stack.length,0);
  assert.equal(canvas.globalAlpha,.81);
  assert.equal(canvas.globalCompositeOperation,'source-over');
});
