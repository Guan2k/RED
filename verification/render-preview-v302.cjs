'use strict';
// NEW v302 combined vehicle/building evidence; retained v296 cases and exact rail adapter, with explicit interior HP fixture guards. Evaluate the COMPLETE product script and call its real render().
// This command recorder is intentionally not a browser/raster/FPS acceptance test.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),plain=x=>JSON.parse(JSON.stringify(x));
const {oreViews,projectOreDensity}=require('./ore-density-normalization-v302.cjs');
const MAPS=['classic','frontier','canyon','ridge','crossroads','switchback','ring','meridian'];
const TYPES=['tank','scout','artillery','repair','harvester'];
const sourceFile=path.resolve(__dirname,'../index.html'),harnessFile=path.join(__dirname,'vm-environment.cjs');
const originalHarness=fs.readFileSync(harnessFile,'utf8');
function replaceOnce(s,a,b){assert.equal(s.split(a).length-1,1,'single adaptation anchor: '+a);return s.replace(a,b)}
let adapted=replaceOnce(originalHarness,"const html = fs.readFileSync(source, 'utf8'),","const html = options.sourceText ?? fs.readFileSync(source, 'utf8'),");
adapted=replaceOnce(adapted,'const canvas = new Proxy(','const canvas = options.canvas || new Proxy(');
adapted=replaceOnce(adapted,'localStorage:{getItem:','localStorage:options.localStorage||{getItem:');
adapted=replaceOnce(adapted,'context.window=context;context.devicePixelRatio=1;','context.window=context;context.Path2D=options.path2D;context.devicePixelRatio=1;');
const harnessModule={exports:{}};new Function('require','module','__dirname',adapted)(require,harnessModule,__dirname);
const {loadGame}=harnessModule.exports;
function pathMock(mode='good'){
  const stats={constructors:0,traces:0,moveTo:0,lineTo:0,closePath:0,arc:0},failures={count:0};
  class RecordingPath {
    constructor(){stats.constructors++;if(mode==='constructor:'+stats.constructors){failures.count++;throw Error('injected Path2D constructor failure')}this.ops=[]}
    trace(kind,args){stats.traces++;stats[kind]++;if(mode===kind+':'+stats[kind]||mode==='trace:'+stats.traces){failures.count++;throw Error('injected Path2D trace failure')}this.ops.push([kind,...args])}
    moveTo(...a){this.trace('moveTo',a)}lineTo(...a){this.trace('lineTo',a)}closePath(){this.trace('closePath',[])}arc(...a){this.trace('arc',a)}
  }
  return {Path2D:mode==='absent'?undefined:mode==='nonfunction'?{}:RecordingPath,stats,failures};
}
function paintRecorder({failFillAt=0}={}){
  let matrix=[1,0,0,1,0,0],current=[],clips=[],stack=[],paints=[],enabled=true;
  const stats={pathFills:0,fillFailures:0,currentFills:0,currentStrokes:0,clips:0,calls:0},styleNames=['fillStyle','strokeStyle','globalAlpha','globalCompositeOperation','lineWidth','lineCap','lineJoin','miterLimit','lineDashOffset','font','textAlign','textBaseline','direction','shadowBlur','shadowOffsetX','shadowOffsetY','shadowColor'];
  const ctx={fillStyle:'#000000',strokeStyle:'#000000',globalAlpha:1,globalCompositeOperation:'source-over',lineWidth:1,lineCap:'butt',lineJoin:'miter',miterLimit:10,lineDashOffset:0,font:'10px sans-serif',textAlign:'start',textBaseline:'alphabetic',direction:'inherit',shadowBlur:0,shadowOffsetX:0,shadowOffsetY:0,shadowColor:'rgba(0, 0, 0, 0)',dash:[]};
  const coords=args=>{for(const x of args)if(typeof x==='number')assert.ok(Number.isFinite(x),'finite canvas coordinate')};
  const point=(x,y)=>[matrix[0]*x+matrix[2]*y+matrix[4],matrix[1]*x+matrix[3]*y+matrix[5]];
  const pathCommand=(kind,args)=>{coords(args);switch(kind){case 'moveTo':case 'lineTo':return[kind,...point(...args)];case 'closePath':return[kind];case 'rect':{const[x,y,w,h]=args;return[kind,point(x,y),point(x+w,y),point(x+w,y+h),point(x,y+h)]}case 'arc':{const[x,y,r,start,end,ccw=false]=args;return[kind,...point(x,y),r,start,end,!!ccw,...matrix.slice(0,4)]}case 'bezierCurveTo':case 'quadraticCurveTo':return[kind,...Array.from({length:args.length/2},(_,i)=>point(args[i*2],args[i*2+1]))];default:throw Error('unsupported path command '+kind)}};
  const geometry=p=>p?p.ops.map(([kind,...args])=>pathCommand(kind,args)):plain(current);
  function paint(kind,shape,extra={}){stats.calls++;if(!enabled)return;const style={alpha:ctx.globalAlpha,composite:ctx.globalCompositeOperation,shadow:[ctx.shadowColor,ctx.shadowBlur,ctx.shadowOffsetX,ctx.shadowOffsetY]};if(kind.startsWith('stroke'))Object.assign(style,{color:ctx.strokeStyle,width:ctx.lineWidth,cap:ctx.lineCap,join:ctx.lineJoin,miter:ctx.miterLimit,dash:[...ctx.dash],dashOffset:ctx.lineDashOffset});else style.color=ctx.fillStyle;if(kind.endsWith('Text'))Object.assign(style,{font:ctx.font,align:ctx.textAlign,baseline:ctx.textBaseline,direction:ctx.direction});paints.push({kind,shape:plain(shape),style,clips:plain(clips),...extra})}
  ctx.save=()=>{stats.calls++;stack.push({matrix:[...matrix],clips:plain(clips),dash:[...ctx.dash],styles:Object.fromEntries(styleNames.map(k=>[k,ctx[k]]))})};
  ctx.restore=()=>{stats.calls++;const s=stack.pop();assert.ok(s,'canvas save/restore balanced');matrix=s.matrix;clips=s.clips;ctx.dash=s.dash;Object.assign(ctx,s.styles)};
  ctx.translate=(x,y)=>{coords([x,y]);stats.calls++;matrix[4]+=matrix[0]*x+matrix[2]*y;matrix[5]+=matrix[1]*x+matrix[3]*y};
  ctx.rotate=a=>{coords([a]);stats.calls++;const[x,y,z,w]=matrix,c=Math.cos(a),s=Math.sin(a);matrix[0]=x*c+z*s;matrix[1]=y*c+w*s;matrix[2]=z*c-x*s;matrix[3]=w*c-y*s};
  ctx.scale=(x,y)=>{coords([x,y]);stats.calls++;matrix[0]*=x;matrix[1]*=x;matrix[2]*=y;matrix[3]*=y};
  ctx.setTransform=(...a)=>{coords(a);assert.equal(a.length,6);matrix=[...a]};
  ctx.beginPath=()=>{stats.calls++;current=[]};
  for(const kind of ['moveTo','lineTo','closePath','rect','arc','bezierCurveTo','quadraticCurveTo'])ctx[kind]=(...args)=>{stats.calls++;current.push(pathCommand(kind,args))};
  ctx.fill=p=>{if(p){stats.pathFills++;if(stats.pathFills===failFillAt){stats.fillFailures++;throw Error('injected fill(Path2D) failure')}}else stats.currentFills++;paint('fill',geometry(p))};
  ctx.stroke=p=>{if(!p)stats.currentStrokes++;paint('stroke',geometry(p))};
  ctx.clip=p=>{stats.calls++;stats.clips++;clips.push(geometry(p))};
  for(const kind of ['fillRect','strokeRect','clearRect'])ctx[kind]=(x,y,w,h)=>{coords([x,y,w,h]);paint(kind,[point(x,y),point(x+w,y),point(x+w,y+h),point(x,y+h)])};
  for(const kind of ['fillText','strokeText'])ctx[kind]=(text,x,y,maxWidth)=>{coords([x,y,maxWidth]);paint(kind,[String(text),...point(x,y),...(maxWidth===undefined?[]:[maxWidth])],{matrix:[...matrix]})};
  ctx.setLineDash=values=>{stats.calls++;ctx.dash=[...values]};ctx.getLineDash=()=>[...ctx.dash];ctx.measureText=s=>({width:String(s).length*7});
  ctx.createLinearGradient=ctx.createRadialGradient=()=>({addColorStop(){throw Error('Unexpected gradient use')}});
  // No permissive no-op canvas proxy: a newly used drawing method must be modeled.
  return {ctx,stats,get paints(){return paints},get current(){return plain(current)},get stackDepth(){return stack.length},get clips(){return plain(clips)},get matrix(){return [...matrix]},reset(){paints=[]},setEnabled(x){enabled=x},snapshot(){return plain({matrix,clips,dash:ctx.dash,styles:Object.fromEntries(styleNames.map(k=>[k,ctx[k]])),stackDepth:stack.length})}};
}
function game(sourceText,{mode='good',seed=29401,record=true,failFillAt=0}={}){
  const paths=pathMock(mode),recorder=paintRecorder({failFillAt}),storage={reads:[],writes:0,removals:0};recorder.setEnabled(record);
  const localStorage={getItem(key){storage.reads.push(key);return null},setItem(){storage.writes++;throw Error('Persistence write outside test scope')},removeItem(){storage.removals++;throw Error('Persistence removal outside test scope')}};
  const g=loadGame(sourceFile,{sourceText,seed,path2D:paths.Path2D,canvas:recorder.ctx,localStorage});
  return Object.assign(g,{paths,recorder,mockStorage:storage});
}
const world=g=>g.run('JSON.stringify({state,uid,groups,selection:[...selection],placement,attackMode,drag,ordinaryCommandMode,appendCommandMode,ordinaryCommandGesture,simulationRemainder,restartPrompt,mouse,hoverActive})');
const tracks=g=>g.run('JSON.stringify(state.entities.map(e=>[e.id,unitTrackMemory.get(e)||null]))');
function toggle(g,enabled){const n=g.element('vehicleArtPreview');assert.ok(n,'real preview checkbox exists');n.checked=enabled;n.dispatchEvent({type:'change'})}
function frame(g){g.recorder.reset();g.run('render()');assert.equal(g.recorder.stackDepth,0,'full render restores canvas stack');assert.deepEqual(g.recorder.matrix,[1,0,0,1,0,0],'full render restores matrix');return plain(g.recorder.paints)}
function forbidRandom(g){g.run('Math.random=()=>{throw Error("Render or preview toggle consumed RNG")};')}
function richFixture(g){g.run(`
state.entities=[];uid=1;selection.clear();
// Mixed retained counts make every inherited whole-frame oracle exercise v302 tails.
state.ores.forEach((o,i)=>o.amount=[1500,4500,12000,0,.5][i%5]);
for(let team of [0,1])for(let [i,type] of ['tank','scout','artillery','repair','harvester'].entries()){
 let e=create(type,team,180+i*105,team?410:250);e.angle=(i+team)*.39;e.load=i%2?0:90;
 e.hp=e.max*(i===0?.2:i===1?.55:1);unitTrackMemory.set(e,{x:e.x,y:e.y,phase:(i*1.6+team)%7});
}
let b=create('factory',0,170,650);b.rally={x:380,y:590};
let p=create('power',0,320,670,true);p.build=defs.power.time*.4;
create('hq',0,100,500);create('hq',1,1000,200);create('refinery',0,420,680);create('turret',1,1040,360);
selection=new Set([1,2,3,4,5,11]);groups=[[1,2],[3,4],[5]];
get(1).goal={x:500,y:300};get(1).guardArea={x:400,y:300};get(2).moveQueue=[{x:500,y:190},{x:700,y:170}];get(2).patrol={a:{x:300,y:200},b:{x:500,y:170},next:1};
get(3).target=6;get(3).attackQueue=[7,8];get(4).escortId=1;get(5).oreIndex=0;
navigationMemory.set(get(1),{goal:{x:500,y:300},route:[{x:350,y:200},{x:500,y:300}]});
state.shots=[{x:753,y:311,life:.5},{x:701,y:319,life:.5}];
state.fx=['order','blast','repair','cash','boom','hit','unknown'].map((type,i)=>({type,x:710+i*31,y:520+i*13,x2:760,y2:610,t:.3,max:.8,radius:35,amount:37}));
state.posts.forEach((p,i)=>{p.owner=i-1;p.side=0;p.progress=2+i;p.contested=i===1;p.controlBlocked=i===2});
state.queue=[{type:'tank',factoryId:11,total:12,left:4}];
battleAlerts=[null,{message:'Render fixture alert',level:1,until:999},null];
// End on a friendly polygon vehicle: cached and fallback current-path residue now differ.
state.entities=[...state.entities.filter(e=>e.id!==4),get(4)];
hoverActive=false;drag=null;placement=null;state.paused=false;state.result=null;coordinateAidEnabled=true;
`)}
// Expected-baseline adapter only: never apply this to the candidate paints. Each
// descriptor comes from a real historical helper view, and must match its exact
// world-space clip, adjacent rail/fill rectangles and (factory) label prefix.
// Only four approved y offsets change; styles, clip paths, order and all other
// fields remain in the final deep equality. Unexpected or duplicate anchors fail.
function progressRailViews(g,entities='state.entities'){
  return plain(g.run(`(${entities}).flatMap(e=>{
    if(e.r<=8)return[];
    let construction=constructionProgressView(e),factory=factoryProductionView(e),out=[];
    if(construction)out.push({kind:'construction',id:e.id,type:e.type,x:e.x,y:e.y,r:e.r,progress:construction.progress,color:'#e9c579'});
    if(factory)out.push({kind:'factory',id:e.id,type:e.type,x:e.x,y:e.y,r:e.r,progress:factory.progress,color:factory.color,short:factory.short});
    return out;
  })`));
}
function adaptLegacyProgressRails(paints,views,{format='world'}={}){
  assert.ok(['world','commands'].includes(format),'rail adapter known recorder format');
  const result=plain(paints),used=new Set(),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const rectangle=(x,y,w,h)=>format==='world'?[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]:[x,y,w,h];
  const matches=(p,kind,shape,color,clip)=>p&&(format==='world'?p.kind:p.op)===kind&&same(format==='world'?p.shape:p.args,shape)&&(format==='world'?p.style.color:p.style.fillStyle)===color&&same(p.clips,clip)&&(format==='world'||same(p.transforms,[]));
  for(const v of views){
    assert.ok(['construction','factory'].includes(v.kind),'rail adapter known helper');
    assert.ok([v.x,v.y,v.r,v.progress].every(Number.isFinite)&&v.r>8&&v.progress>=0&&v.progress<=1,'rail adapter finite bounded helper view');
    assert.ok(v.kind==='construction'?['power','refinery','factory','turret'].includes(v.type)&&v.color==='#e9c579':v.type==='factory'&&['#a3aba8','#ed987f','#ebc877','#8fd6bd'].includes(v.color)&&typeof v.short==='string','rail adapter helper role and color');
    const x=v.x-v.r+6,w=v.r*2-12,delta=v.kind==='construction'?2:3,oldY=v.y+v.r-(v.kind==='construction'?7:6),clipRect=[v.x-v.r+4,v.y-v.r+4,v.r*2-8,v.r*2-8];
    const clip=format==='world'?[[['rect',...rectangle(...clipRect)]]]:[[{op:'rect',args:clipRect,transforms:[]}]];
    const background=rectangle(x-1,oldY,w+2,5),fill=rectangle(x,oldY+1,w*v.progress,3);
    const indices=paints.flatMap((p,i)=>matches(p,'fillRect',background,'#102019',clip)?[i]:[]);
    assert.equal(indices.length,1,'rail adapter exact unique historical background');
    const i=indices[0];
    assert.ok(matches(paints[i+1],'fillRect',fill,v.color,clip),'rail adapter exact adjacent historical fill');
    if(v.kind==='factory'){
      assert.ok(matches(paints[i-2],'fillRect',rectangle(x,v.y-v.r+5,w,13),'#102019ee',clip),'rail adapter exact factory status background');
      assert.ok(matches(paints[i-1],'fillText',[v.short,x+3,v.y-v.r+15],v.color,clip),'rail adapter exact factory status label');
      assert.equal(paints[i-1].style.font,'10px system-ui','rail adapter exact factory status font');
    }
    for(const index of[i,i+1]){
      assert.ok(!used.has(index),'rail adapter cannot normalize one paint twice');used.add(index);
      if(format==='world')for(const point of result[index].shape)point[1]-=delta;
      else result[index].args[1]-=delta;
    }
  }
  assert.equal(used.size,views.length*2,'rail adapter exactly two known rectangles per helper');
  return result;
}
// Inherited historical frame fixtures deliberately stay inside the top edge.
// No HP coordinates or other health-bar fields are adapted or normalized.
function assertInteriorHealthBars(g,label){
  const ys=plain(g.run('state.entities.filter(e=>e.hp<e.max||selection.has(e.id)).map(e=>e.y-e.r-12)'));
  assert.ok(ys.every(y=>Number.isFinite(y)&&y>=0),label+' historical HP fixtures stay interior; no health-Y adapter is permitted');
  return ys;
}
function pairFrames(a,b,{frames=3,move=true,label='complete render',legacyExpected=false}={}){
  let total=0;
  for(let n=0;n<frames;n++){
    if(legacyExpected){assertInteriorHealthBars(a,label+' candidate frame '+n);assertInteriorHealthBars(b,label+' historical frame '+n)}
    const aw=world(a),bw=world(b),ap=frame(a),raw=frame(b),bp=legacyExpected?adaptLegacyProgressRails(projectOreDensity(raw,oreViews(b),{format:'world'}).paints,progressRailViews(b)):raw;assert.deepEqual(ap,bp,label+' frame '+n+' paint order, geometry, styles and clip state');assert.equal(world(a),aw,label+' does not alter world/input');assert.equal(world(b),bw,label+' fallback does not alter world/input');assert.equal(tracks(a),tracks(b),label+' unit track memory parity');total+=ap.length;
    if(move&&n<frames-1)for(const g of[a,b])g.run('for(let e of state.entities)if(defs[e.type].speed){e.x+=1.25;e.y-=.75;e.angle+=.12}');
  }return total;
}
function runSuite(options={}){
  const sourceText=options.sourceText??fs.readFileSync(sourceFile,'utf8'),baselineText=options.baselineText??require('./restore-v293.cjs')(require('./restore-v294.cjs')(require('./restore-v295.cjs')(require('./restore-v296-from-v302.cjs')(sourceText)))),results=[];
  const filter=options.filter?new RegExp(options.filter):null;let assertions=0;
  const eq=(a,b,msg)=>{assert.deepEqual(plain(a),plain(b),msg);assertions++},ok=(x,msg)=>{assert.ok(x,msg);assertions++};
  function test(name,fn){if(filter&&!filter.test(name))return;try{const detail=fn()||{};results.push({name,passed:true,...detail})}catch(e){results.push({name,passed:false,error:e.message,errorName:e.name,errorCode:e.code||null,stack:e.stack?.split('\n').slice(0,6).join('\n')})}}
  test('source/legacy-draw-byte-identical-and-v293-restoration',()=>{
    const extract=s=>s.slice(s.indexOf('function drawUnit(e)'),s.indexOf('const terrainAccentTiles'));
    eq(hash(require('./restore-v296-from-v302.cjs')(sourceText)),'02c622cdfaf30fb5c9ea854c2c3b4208cc39f4057af4277e229cc009cbb0e2a1','strict restored v296 product');eq(hash(require('./restore-v295.cjs')(require('./restore-v296-from-v302.cjs')(sourceText))),'6e59483fa674381da5ebf5e476cb1bd9cc6e65c20679b8803b18b5827b0ff7aa','strict restored v295 product');eq(extract(sourceText),extract(baselineText),'old drawUnit stays byte exact');eq(hash(baselineText),'1fa70b3756630fe26de2c76f89045239a46126c479f1cbb22b42bc9baf3b9eca','restored v293 product');
    return {baselineSha256:hash(baselineText),harnessSha256:hash(originalHarness)};
  });
  test('adapter/only-known-helper-y-offsets-preserve-all-other-fields',()=>{
    const a=game(sourceText),b=game(baselineText);for(const g of[a,b]){g.start();richFixture(g);forbidRandom(g)}
    eq(Math.min(...assertInteriorHealthBars(a,'rail adapter candidate fixture')),222,'candidate rail fixture HP bars stay interior');eq(Math.min(...assertInteriorHealthBars(b,'rail adapter historical fixture')),222,'historical rail fixture HP bars stay interior');
    const current=frame(a),historical=projectOreDensity(frame(b),oreViews(b),{format:'world'}).paints,before=plain(historical),views=progressRailViews(b),adapted=adaptLegacyProgressRails(historical,views);
    eq(views.map(v=>v.kind),['factory','construction'],'fixture covers both approved helpers');eq(current,adapted,'candidate matches only four expected historical rail rectangles');eq(historical,before,'adapter never mutates original baseline paints');
    const changed=historical.flatMap((p,i)=>JSON.stringify(p)!==JSON.stringify(adapted[i])?[i]:[]);eq(changed.length,4,'exactly four known helper rectangles change');
    for(const i of changed){const restored=plain(adapted[i]),delta=historical[i].shape[0][1]-restored.shape[0][1];ok(delta===2||delta===3,'only approved y deltas');for(const point of restored.shape)point[1]+=delta;eq(restored,historical[i],'all non-y fields remain byte-exact JSON');}
    eq(adaptLegacyProgressRails(historical,[]),historical,'no descriptors never filters or rewrites paints');
    const factory=views.find(v=>v.kind==='factory'),rail=historical.findIndex(p=>p.kind==='fillRect'&&p.style.color==='#102019'&&p.shape[0][1]===factory.y+factory.r-6);
    for(const [name,mutate]of[
      ['rail-y',p=>p[rail].shape[0][1]++],['rail-width',p=>p[rail].shape[1][0]++],['rail-height',p=>p[rail].shape[2][1]++],['rail-color',p=>p[rail].style.color='#000'],
      ['rail-clip',p=>p[rail].clips=[]],['fill-y',p=>p[rail+1].shape[0][1]++],['fill-width',p=>p[rail+1].shape[1][0]++],['fill-color',p=>p[rail+1].style.color='#000'],
      ['status-label',p=>p[rail-1].shape[0]='wrong'],['status-geometry',p=>p[rail-2].shape[0][1]++],['status-font',p=>p[rail-1].style.font='20px serif'],['duplicate-anchor',p=>p.push(plain(p[rail]))]
    ]){const altered=plain(historical);mutate(altered);assert.throws(()=>adaptLegacyProgressRails(altered,views),e=>e.name==='AssertionError'&&e.code==='ERR_ASSERTION'&&e.message.startsWith('rail adapter'),'adapter rejects malformed '+name);assertions++;}
    for(const [name,mutate]of[['alpha',p=>p[rail].style.alpha=.123],['extra-style',p=>p[rail].style.unexpected=true],['unrelated-paint',p=>p[0].style.color='#bad'],['extra-paint',p=>p.push(plain(p[0]))]]){
      const altered=plain(historical);mutate(altered);assert.notDeepEqual(adaptLegacyProgressRails(altered,views),adapted,'unapproved '+name+' remains observable');assertions++;
    }
    assert.throws(()=>adaptLegacyProgressRails(historical,[...views,views[0]]),e=>e.name==='AssertionError'&&e.message.startsWith('rail adapter cannot normalize one paint twice'));assertions++;
    assert.throws(()=>adaptLegacyProgressRails(adapted,views),e=>e.name==='AssertionError'&&e.message.startsWith('rail adapter exact unique historical background'));assertions++;
    return{knownRectangles:4,allowedYDeltas:[2,3],malformedAnchorsRejected:12,unapprovedDifferencesPreserved:4};
  });
  test('lifecycle/default-off-lazy-cache-real-change-handler',()=>{
    const a=game(sourceText);eq(a.run('[vehicleArtPreview,unitArtPathCache===undefined,buildingArtPathCache===undefined]'),[false,true,true],'fresh page has preview off and an uninitialized cache');eq(a.element('vehicleArtPreview').checked,false);eq(a.paths.stats.constructors,0);
    a.start();for(let i=0;i<3;i++)frame(a);eq(a.paths.stats.constructors,0,'off renders never allocate');const before=world(a);forbidRandom(a);toggle(a,true);eq(world(a),before,'toggle only changes presentation');ok(a.run('Array.isArray(buildingArtPathCache)'), 'enabling preview initializes building cache');eq(a.run('[vehicleArtPreview,unitArtPathCache.length,Object.isFrozen(unitArtPathCache),buildingArtPathCache.length,Object.isFrozen(buildingArtPathCache)]'),[true,10,true,20,true]);eq(a.paths.stats,{constructors:30,traces:177,moveTo:21,lineTo:126,closePath:21,arc:9});
    const cache=a.run('unitArtPathCache');for(let i=0;i<5;i++){toggle(a,false);frame(a);toggle(a,true);frame(a)}ok(a.run('unitArtPathCache')===cache,'same cache identity across toggles');eq(a.paths.stats.constructors,30);eq(a.mockStorage.writes,0);eq(a.mockStorage.removals,0);return{bootstrapMockReads:a.mockStorage.reads.length,cachePaths:30};
  });
  test('lifecycle/new-round-retains-choice-fresh-page-starts-off',()=>{
    const a=game(sourceText);a.start();toggle(a,true);frame(a);const cache=a.run('unitArtPathCache');a.start();eq(a.run('vehicleArtPreview'),true,'new round preserves enabled preview choice');eq(a.element('vehicleArtPreview').checked,true);ok(a.run('unitArtPathCache')===cache);frame(a);eq(a.paths.stats.constructors,30);toggle(a,false);a.start();eq(a.run('vehicleArtPreview'),false);eq(a.element('vehicleArtPreview').checked,false);ok(a.run('unitArtPathCache')===cache);const fresh=game(sourceText);eq(fresh.run('[vehicleArtPreview,unitArtPathCache===undefined,buildingArtPathCache===undefined]'),[false,true,true]);eq(fresh.element('vehicleArtPreview').checked,false);eq(fresh.paths.stats.constructors,0);
  });
  for(const map of MAPS)test('off-render/v293-full-frame-'+map,()=>{
    const a=game(sourceText),b=game(baselineText);for(const g of[a,b]){g.element('scenario').value=map;g.start();richFixture(g);forbidRandom(g)}eq(world(a),world(b));let paints=pairFrames(a,b,{label:'default-off '+map,legacyExpected:true});eq(a.paths.stats.constructors,0);return{frames:3,paints};
  });
  const fixtureModes=[
    ['all-units-hp-shots-effects','void 0'],
    ['polygon-tail-no-effects','state.shots=[];state.fx=[];'],
    ...['order','blast','repair','cash','boom','hit','unknown'].map(type=>['polygon-tail-first-effect-'+type,'state.shots=[];state.fx=state.fx.filter(f=>f.type==='+JSON.stringify(type)+');']),
    ['pause-drag-overlays','state.paused=true;drag={x:120,y:120};mouse={x:620,y:350};'],
    ['hover-entity','hoverActive=true;mouse={x:180,y:250};'],
    ['hover-ore','hoverActive=true;mouse={x:state.ores[0].x,y:state.ores[0].y};'],
    ['hover-post','hoverActive=true;mouse={x:state.posts[0].x,y:state.posts[0].y};'],
    ['hover-rock','hoverActive=true;mouse={x:470,y:170};'],
    ['construction-valid','hoverActive=true;placement="power";mouse={x:60,y:650};'],
    ['construction-blocked','hoverActive=true;placement="refinery";mouse={x:170,y:650};'],
    ['terminal-inspection','state.result="fixture terminal";hoverActive=true;mouse={x:180,y:250};'],
    ['empty-entities-consecutive-frames','state.entities=[];selection.clear();state.shots=[];state.fx=[];hoverActive=false;']
  ];
  for(const [name,setup]of fixtureModes)test('cached-render/full-frame-'+name,()=>{
    const a=game(sourceText),b=game(sourceText,{mode:'absent'});a.run('globalThis.previewBuildingCalls=0;globalThis.originalBuildingPreview=drawBuildingPreview;drawBuildingPreview=e=>{previewBuildingCalls++;return originalBuildingPreview(e)};globalThis.previewUnitCalls=0;globalThis.originalUnitPreview=drawUnitPreview;drawUnitPreview=e=>{previewUnitCalls++;return originalUnitPreview(e)}');for(const g of[a,b]){g.element('scenario').value='switchback';g.start();richFixture(g);g.run(setup);toggle(g,true);forbidRandom(g)}const paints=pairFrames(a,b,{label:name});eq(a.paths.stats.constructors,30);eq(b.run('unitArtPathCache'),null);ok(a.recorder.stats.currentStrokes>0);if(name==='polygon-tail-no-effects'||name==='polygon-tail-first-effect-cash')assert.notDeepEqual(a.recorder.current,b.recorder.current,'test retains distinct default-path residue while full paint streams match');if(name==='all-units-hp-shots-effects'){ok(a.recorder.stats.pathFills>0&&a.run('previewUnitCalls')>0,'enabled preview renderer uses cached vehicle paths');ok(a.run('previewBuildingCalls')>0,'enabled preview renderer uses building bodies');ok(a.recorder.stats.clips>0);ok(a.recorder.paints.some(p=>p.kind==='fillText'&&p.shape[0]==='+37'),'cash effect painted');ok(a.recorder.paints.some(p=>p.style.color==='#ffedac'),'shots painted');ok(a.recorder.paints.some(p=>p.style.color==='#a3db81'),'HP bars painted');ok(a.recorder.paints.some(p=>p.style.color==='#efbc78'),'blast painted');ok(a.recorder.paints.some(p=>p.style.color==='#b2ebbb'),'repair beam painted');ok(a.recorder.paints.some(p=>p.style.color==='#c9f59d'),'order effect painted');}return{frames:3,paints,pathFills:a.recorder.stats.pathFills};
  });
  test('cached-render/all-eight-maps-full-frame',()=>{
    let paints=0;for(const map of MAPS){const a=game(sourceText),b=game(sourceText,{mode:'absent'});for(const g of[a,b]){g.element('scenario').value=map;g.element('objective').value='stronghold';g.start();richFixture(g);toggle(g,true);forbidRandom(g)}paints+=pairFrames(a,b,{frames:2,label:map})}return{maps:MAPS,frames:16,paints};
  });
  test('cached-render/off-on-off-restores-legacy-next-frame-and-track-phase',()=>{
    const a=game(sourceText),b=game(baselineText);for(const g of[a,b]){g.start();richFixture(g);forbidRandom(g)}let paints=pairFrames(a,b,{frames:1,legacyExpected:true});
    for(let cycle=0;cycle<5;cycle++){const before=world(a);toggle(a,true);eq(world(a),before);frame(a);frame(b);eq(tracks(a),tracks(b),'preview and old track phase stay equal');for(const g of[a,b])g.run('for(let e of state.entities)if(defs[e.type].speed){e.x+=2;e.y+=3}');toggle(a,false);paints+=pairFrames(a,b,{frames:2,label:'off after on '+cycle,legacyExpected:true})}eq(a.paths.stats.constructors,30);return{cycles:5,legacyPaints:paints};
  });
  test('track-phase/visible-unit-phase-and-one-call-per-frame-across-toggles',()=>{
    const a=game(sourceText);a.start();richFixture(a);forbidRandom(a);
    a.run('globalThis.trackCallCount=0;globalThis.originalTrackPhase=unitTrackPhase;unitTrackPhase=e=>{trackCallCount++;return originalTrackPhase(e)}');
    let frames=0;
    for(const on of[false,true,true,false,true,false]){
      toggle(a,on);a.run('for(let e of state.entities)if(defs[e.type].speed){e.x+=2.25;e.y-=1.5}');
      const before=JSON.parse(tracks(a)),units=JSON.parse(a.run('JSON.stringify(state.entities.filter(e=>defs[e.type].speed))'));
      a.run('trackCallCount=0');frame(a);eq(a.run('trackCallCount'),units.length,'exactly one track-phase update per visible vehicle');
      const after=new Map(JSON.parse(tracks(a)));
      for(const e of units){const old=new Map(before).get(e.id);eq(after.get(e.id),{x:e.x,y:e.y,phase:(old.phase+Math.hypot(e.x-old.x,e.y-old.y))%7},'distance-derived phase retained through mode changes')}
      frames++;
    }eq(a.paths.stats.constructors,30);return{frames,vehiclesPerFrame:10};
  });
  test('recorder/current-path-is-not-saved-or-changed-by-fill-path',()=>{
    const r=paintRecorder(),p=pathMock(),path=new p.Path2D();path.moveTo(1,2);path.lineTo(3,4);path.closePath();r.ctx.beginPath();r.ctx.moveTo(90,91);r.ctx.save();r.ctx.translate(2,3);r.ctx.lineTo(5,6);r.ctx.restore();const prior=r.current;r.ctx.fill(path);eq(r.current,prior);r.ctx.stroke();eq(r.paints[1].shape,[['moveTo',90,91],['lineTo',7,9]],'current path survives restore and explicit fill');
  });
  test('finite-cache/frozen-ten-paths-all-roles-team-phase-radius-type-fallback',()=>{
    const a=game(sourceText),b=game(sourceText,{mode:'absent'});for(const g of[a,b]){g.start();toggle(g,true);forbidRandom(g)}
    eq(a.run('unitArtGeometry.length'),10);eq(a.run('unitArtGeometry.reduce((n,p)=>n+p.length/2,0)'),63);ok(a.run('Object.isFrozen(unitArtGeometry)&&unitArtGeometry.every(Object.isFrozen)&&Object.isFrozen(unitArtCanonicalRadius)&&Object.isFrozen(unitArtPathCache)'));
    const cache=a.run('unitArtPathCache'),phases=[0,.25,.9999999,1,1.0000001,1.9999999,2,2.0000001,3.5,5.9999999,6,6.0000001,6.9999999];let specimens=0;
    for(const type of [...TYPES,'unknown','constructor','__proto__'])for(const team of[0,1])for(const radius of[null,9,13.5,18])for(const phase of phases){
      const literal=JSON.stringify({type,team,r:radius,x:-4,y:803,angle:specimens%2?Math.PI/3:-.3,load:specimens%3*90,hp:1});
      for(const g of[a,b]){g.run(`globalThis.shapeFixture=${literal};if(shapeFixture.r===null)shapeFixture.r=Object.hasOwn(unitArtCanonicalRadius,shapeFixture.type)?unitArtCanonicalRadius[shapeFixture.type]:13;unitTrackMemory.set(shapeFixture,{x:shapeFixture.x,y:shapeFixture.y,phase:${phase}})`);g.recorder.reset();const before=world(g),entity=g.run('JSON.stringify(shapeFixture)'),styles=g.recorder.snapshot();g.run('drawUnitPreview(shapeFixture)');eq(world(g),before);eq(g.run('JSON.stringify(shapeFixture)'),entity);eq(g.recorder.snapshot(),styles,'draw restores all styles transforms clipping');}
      eq(a.recorder.paints,b.recorder.paints,'cached/noncanonical/unknown geometry parity');specimens++;
    }ok(a.run('unitArtPathCache')===cache);eq(a.paths.stats,{constructors:30,traces:177,moveTo:21,lineTo:126,closePath:21,arc:9});return{specimens,phaseSamples:phases.length,cachePaths:10,vertices:63};
  });
  const failureModes=['absent','nonfunction',...Array.from({length:10},(_,i)=>'constructor:'+(i+1)),'moveTo:1','moveTo:10','lineTo:1','lineTo:53','closePath:1','closePath:10','trace:37'];
  for(const mode of failureModes)test('failure/cache-latches-'+mode,()=>{
    const a=game(sourceText,{mode}),b=game(sourceText,{mode:'absent'});for(const g of[a,b]){g.start();richFixture(g);forbidRandom(g);toggle(g,true);g.run('buildingArtPathCache=null')}eq(a.run('unitArtPathCache'),null);const count=plain(a.paths.stats);let paints=pairFrames(a,b,{frames:2,label:mode});for(let i=0;i<3;i++){toggle(a,false);toggle(a,true)}a.start();toggle(a,true);frame(a);eq(a.paths.stats,count,'failed cache never reconstructed');eq(a.recorder.stats.pathFills,0);eq(a.mockStorage.writes,0);return{paints,initialization:count};
  });
  for(const at of[1,2,3,4,5,9,10,13,20])test('failure/fill-path-latches-at-'+at,()=>{
    const a=game(sourceText,{failFillAt:at}),b=game(sourceText,{mode:'absent'});for(const g of[a,b]){g.start();richFixture(g);toggle(g,true);g.run('buildingArtPathCache=null');forbidRandom(g)}const paints=pairFrames(a,b,{frames:3,label:'fill failure '+at});eq(a.recorder.stats.fillFailures,1);eq(a.recorder.stats.pathFills,at,'failed path fill is never retried after its latch');eq(a.run('unitArtPathCache'),null);const count=plain(a.paths.stats);for(let i=0;i<3;i++){toggle(a,false);toggle(a,true);frame(a)}eq(a.paths.stats,count);eq(a.recorder.stats.pathFills,at,'no retries after fill failure');return{paints,failedFillOrdinal:at};
  });
  test('natural-ui/preview-on-off-command-rally-production-movement-parity',()=>{
    const modes=[['v293',baselineText,'good',false],['off',sourceText,'good',false],['cached',sourceText,'good',true],['fallback',sourceText,'absent',true],['toggled',sourceText,'good',false]];
    const all=modes.map(([name,src,mode,on])=>{const g=game(src,{mode,seed:29483,record:false});g.element('scenario').value='ring';g.element('scenario').dispatchEvent({type:'change'});g.start();if(on)toggle(g,true);return{name,g}}),first=all[0].g;
    const point=(g,p)=>{for(const type of['pointerdown','pointerup'])g.element('map').dispatchEvent({type,clientX:p.x,clientY:p.y,pointerId:1,pointerType:'mouse',isPrimary:true,button:0})};
    const coordinate=(g,p)=>{for(const[id,value]of[['coordinateCommandX',p.x],['coordinateCommandY',p.y]]){g.element(id).value=String(value);g.element(id).dispatchEvent({type:'input'})}const button=g.element('coordinateCommandExecute');eq(button.disabled,false,'coordinate action is naturally enabled');for(const type of['pointerdown','pointerup'])button.dispatchEvent({type,pointerId:2,isPrimary:true,button:0});button.click({detail:1})};
    const operational=g=>g.run('JSON.stringify({state,uid,selection:[...selection],groups,simulationRemainder,navigation:state.entities.map(e=>[e.id,navigationMemory.get(e)]),traffic:trafficCoordination.status(),deliveries:state.entities.map(e=>[e.id,harvesterDeliveries.get(e)])})');
    let checkpoints=0,seconds=0;
    const checkpoint=label=>{const expected=operational(first),input=world(first),phase=tracks(first);for(const{name,g}of all.slice(1)){eq(operational(g),expected,name+' command/world/navigation parity '+label);eq(world(g),input,name+' pending input parity '+label);eq(tracks(g),phase,name+' track parity '+label)}checkpoints++};
    const advance=(duration,label)=>{for(let n=0;n<duration;n++){toggle(all.at(-1).g,n%2===0);for(const{g}of all)g.run('for(let i=0;i<20;i++){advanceSimulation(.05);if(i%5===0)render()}');seconds++;checkpoint(label+' '+(n+1))}};
    for(const{g}of all){const factory=g.state.entities.find(e=>e.team===0&&e.type==='factory');point(g,factory);eq(g.run('[...selection]'),[factory.id]);coordinate(g,{x:340,y:600});eq(plain(factory.rally),{x:340,y:600});const button=g.document.querySelectorAll('[data-unit]').find(e=>e.dataset.unit==='scout');eq(button.disabled,false);button.click();eq(g.state.cash,1520,'180 paid from natural starting cash');eq(g.state.queue.length,1);g.run('render()')}
    checkpoint('real coordinate rally and paid production');const maxId=first.run('Math.max(...state.entities.map(e=>e.id))');advance(40,'production and rally');
    const made=first.state.entities.find(e=>e.team===0&&e.id>maxId&&e.type==='scout');ok(made,'paid scout actually spawned');eq(first.state.queue.length,0);ok(Math.hypot(made.x-340,made.y-600)<15,'new scout naturally reaches factory rally');const producedId=made.id,atRally={x:made.x,y:made.y};
    for(const{g}of all){const unit=g.state.entities.find(e=>e.id===producedId);point(g,unit);eq(g.run('[...selection]'),[producedId]);g.click('ordinaryCommand');point(g,{x:220,y:660});ok(unit.goal,'registered map command assigns movement');g.run('render()')}
    checkpoint('real ordinary map command');advance(12,'map movement');const afterMap=plain(first.state.entities.find(e=>e.id===producedId));ok(Math.hypot(afterMap.x-220,afterMap.y-660)<15,'scout reaches map-command destination');ok(Math.hypot(afterMap.x-atRally.x,afterMap.y-atRally.y)>80,'movement witness');
    for(const{g}of all){coordinate(g,{x:150,y:620});g.run('render()')}checkpoint('real coordinate vehicle command');advance(8,'coordinate movement');const final=first.state.entities.find(e=>e.id===producedId);ok(final,'produced scout remains alive at safe rear destination');ok(Math.hypot(final.x-150,final.y-620)<15,'scout reaches coordinate-command destination');
    const rng=first.run('JSON.stringify([Math.random(),Math.random()])');for(const{name,g}of all.slice(1))eq(g.run('JSON.stringify([Math.random(),Math.random()])'),rng,name+' final RNG position');
    return{map:'ring',seconds,checkpoints,configurations:modes.map(x=>x[0]),paid:180,producedId,atRally,afterMap:{x:afterMap.x,y:afterMap.y},final:{x:final.x,y:final.y},fixtureKind:'Natural legal UI start, pointer selection, coordinate rally, production button, ordinary map movement and coordinate movement. No world/funds/health/position injection; synthetic VM DOM events.'};
  });
  for(const map of MAPS)test('trajectory/world-rng-track-parity-'+map,()=>{
    const configurations=[['v293',baselineText,'good',false],['off',sourceText,'good',false],['cached',sourceText,'good',true],['fallback',sourceText,'absent',true],['toggled',sourceText,'good',false]];
    const games=configurations.map(([name,src,mode,on])=>{const g=game(src,{mode,seed:29483,record:false});g.element('scenario').value=map;g.start();if(on)toggle(g,true);return{name,g}});
    for(let segment=0;segment<3;segment++){
      const t=games.at(-1).g;toggle(t,segment%2===0);
      for(const {g}of games)g.run('for(let i=0;i<600;i++){advanceSimulation(.05);if(i%10===0)render()}');
      const reference=games[0].g;for(const{name,g}of games.slice(1)){eq(world(g),world(reference),map+' '+name+' simulation parity at '+(segment+1)*30+'s');eq(tracks(g),tracks(reference),map+' '+name+' render track parity')}
    }
    const rng=g=>g.run('JSON.stringify([Math.random(),Math.random(),Math.random()])'),reference=games[0].g,expected=rng(reference);
    for(const{name,g}of games.slice(1)){eq(rng(g),expected,map+' '+name+' RNG position');eq(g.mockStorage.writes,0);eq(g.mockStorage.removals,0)}
    return{map,seconds:90,configurations:configurations.map(x=>x[0]),checkpoints:3};
  });
  for(const [type,build,tailCount] of [['hq',0,2],['power',4,4],['factory',0,4],['turret',4,7]])test('building-dynamics/'+type,()=>{
    const a=game(sourceText),b=game(baselineText);for(const g of[a,b]){g.start();g.run(`state.entities=[];state.queue=[];globalThis.dynamicBuilding=create('${type}',0,210,320);dynamicBuilding.angle=.73;dynamicBuilding.build=${build};if('${type}'==='factory'){create('power',0,700,400);state.queue=[{type:'tank',factoryId:dynamicBuilding.id,total:6,left:3}]}`);forbidRandom(g);g.recorder.reset()}
    toggle(a,true);a.run('drawBuildingPreview(dynamicBuilding)');b.run('drawBuilding(dynamicBuilding)');eq(a.recorder.paints.slice(-tailCount),adaptLegacyProgressRails(b.recorder.paints,progressRailViews(b,'[dynamicBuilding]')).slice(-tailCount),'building dynamic tail equals original '+type);eq(a.recorder.stackDepth,0);return{type,tailCount};
  });
  test('building-failure/cache-construction-latch',()=>{
    const a=game(sourceText,{mode:'constructor:11'});a.start();toggle(a,true);eq(a.run('buildingArtPathCache'),null,'building failed initialization latches null');const count=a.paths.stats.constructors;for(let i=0;i<3;i++){frame(a);toggle(a,false);toggle(a,true)}eq(a.paths.stats.constructors,count,'building failed cache never reconstructed');
  });
  test('scope/no-persistence-writes-and-no-real-storage',()=>{
    const a=game(sourceText);a.start();toggle(a,true);frame(a);toggle(a,false);a.start();eq(a.mockStorage.writes,0);eq(a.mockStorage.removals,0);ok(a.mockStorage.reads.length>0,'existing bootstrap status reads acknowledged');return{mockReadCount:a.mockStorage.reads.length,readKeys:[...new Set(a.mockStorage.reads)],note:'Reads return null in memory. No save/load/import/export invoked.'};
  });
  assert.equal(new Set(results.map(x=>x.name)).size,results.length,'unique result names');
  return {passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length,assertions,sourceSha256:hash(sourceText),baselineSha256:hash(baselineText),harnessSha256:hash(originalHarness),results,scope:'Whole-source VM, real change-handler and complete render paint recorder. Historical expected paints omit only fully validated old ore suffixes and adapt only exact helper rail/fill y offsets, retaining strict restored v293/v295/v296 identities. Every historical full-frame comparison asserts interior HP fixtures and applies no health-Y adapter. Records transformed geometry, paint order, alpha/composite, styles, clipping, current-path residue and consecutive frames. Synthetic scene/failure fixtures, a separate natural UI command/production trajectory, plus 90-second deterministic trajectories on all eight maps. Only mock bootstrap storage reads; no save/load/import/export or real storage. Not native browser, rasterization, GPU, context-loss, visual usability or FPS acceptance.'};
}
module.exports={adaptLegacyProgressRails,progressRailViews,runSuite,paintRecorder,pathMock,game,richFixture,frame,toggle,pairFrames,world,tracks,replaceOnce};
if(require.main===module){let report;try{const file=path.resolve(process.argv[2]||sourceFile),before=fs.readFileSync(file,'utf8');report=runSuite({sourceText:before,filter:process.env.RED_RENDER_FILTER});assert.equal(fs.readFileSync(file,'utf8'),before,'source bytes unchanged after complete suite');report.sourceUnchanged=true}catch(e){report={passed:0,failed:1,results:[{name:'suite/setup',passed:false,error:e.message,stack:e.stack}]}}console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1}
