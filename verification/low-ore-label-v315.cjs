'use strict';
// v315 expected-side presentation adaptation; no candidate stream changes.
const {installExpectedPresentation,expectedFunctionSource}=require('./presentation-expected-v315.cjs');
'use strict';
const {installExpectedDepletedOreBeds}=require('./depleted-ore-expected-v315.cjs');
// Independent focused proof. Uses only the existing no-persistence Node VM and Canvas recorder.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const {fresh,mock,toggle,core}=require('./building-independent-v295/recorder.cjs');
const {record}=require('./low-ore-label-recorder-v315.cjs');
const {installExpectedOreLabels}=require('./low-ore-label-oracle-v315.cjs');
const dir=__dirname,candidate=path.resolve(dir,'..'),base=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'red-low-label-v315-'));
fs.writeFileSync(path.join(base,'index.html'),require('./restore-v302-from-v315.cjs')(fs.readFileSync(path.join(candidate,'index.html'),'utf8')));
process.on('exit',()=>fs.rmSync(base,{recursive:true,force:true}));
const copy=x=>JSON.parse(JSON.stringify(x)),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const before="let label='矿 '+Math.ceil(o.amount/1000)+'k'",after="let label='矿 '+(o.amount<1000?Math.ceil(o.amount):Math.ceil(o.amount/1000)+'k')";
const results=[],frames=[],geometry=[],boundaries=[],negativeControls=[],maps=[];let assertions=0;
function eq(a,b,msg){assert.deepEqual(a,b,msg);assertions++}function ok(a,msg){assert.ok(a,msg);assertions++}function test(name,fn){try{fn();results.push({name,pass:true})}catch(e){results.push({name,pass:false,error:e.stack})}}
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)).map(p=>e.name+'/'+p):[e.name]).sort()}
function freeze(root){return Object.fromEntries(walk(root).map(p=>[p,sha(fs.readFileSync(path.join(root,p)))]))}
function productFreeze(root){return Object.fromEntries(['index.html','source-build-receipt.json',...walk(path.join(root,'src')).map(x=>'src/'+x)].map(p=>[p,sha(fs.readFileSync(path.join(root,p)))]))}
const baseFrozen=freeze(base),candidateFrozen=productFreeze(candidate),html=fs.readFileSync(path.join(candidate,'index.html'),'utf8');
const source=fs.readFileSync(path.join(candidate,'src/script/03-renderer.jsfrag'),'utf8'),fnSource=source.slice(source.indexOf('function oreLabelLayout()'),source.indexOf('\nfunction drawStrongholdMarker()'));
const mapKeys=['classic','frontier','canyon','ridge','crossroads','switchback','ring','meridian'];
const profiles={
 widthOnly:s=>({width:String(s).length*7}),
 proportional:s=>({width:[...String(s)].reduce((n,c)=>n+(c===' '?3:c==='1'?4:c==='9'?6:c==='k'?5:/[\x00-\x7f]/.test(c)?7:11),0),actualBoundingBoxLeft:2,actualBoundingBoxRight:[...String(s)].reduce((n,c)=>n+(c===' '?3:c==='1'?4:c==='9'?6:c==='k'?5:/[\x00-\x7f]/.test(c)?7:11),0)+3,actualBoundingBoxAscent:12,actualBoundingBoxDescent:4}),
 widePositiveExtents:s=>({width:[...String(s)].reduce((n,c)=>n+(c===' '?5:c==='1'?7:c==='9'?13:c==='k'?8:/[\x00-\x7f]/.test(c)?12:22),0),actualBoundingBoxLeft:7,actualBoundingBoxRight:[...String(s)].reduce((n,c)=>n+(c===' '?5:c==='1'?7:c==='9'?13:c==='k'?8:/[\x00-\x7f]/.test(c)?12:22),0)+11,actualBoundingBoxAscent:19,actualBoundingBoxDescent:8})
};
function game(root,mode='legacy',map='classic',objective='annihilation',profile='widthOnly'){const g=fresh(path.join(root,'index.html'),mode==='cached'?mock().P:undefined);if(root===base){installExpectedDepletedOreBeds(g);installExpectedPresentation(g);}g.element('scenario').value=map;g.element('objective').value=objective;g.start();if(mode!=='legacy')toggle(g,true);g.metricProfile=profile;g.element('map').getContext('2d').measureText=s=>profiles[g.metricProfile](s);return g}
const format=(amount,newFormat)=>amount<=0?null:'矿 '+(newFormat&&amount<1000?Math.ceil(amount):Math.ceil(amount/1000)+'k');
const caption=p=>p.contested?'争夺中':p.controlBlocked?'抢占中':p.owner<0?'中立据点':'+30 / 10s';
function metric(text,profile){const m=profiles[profile](text);return {left:Math.max(0,m.actualBoundingBoxLeft||0),right:Math.max(m.width,m.actualBoundingBoxRight||0),up:Math.max(11,m.actualBoundingBoxAscent||0),down:Math.max(3,m.actualBoundingBoxDescent||0)}}
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n)),box=(p,m)=>({left:p.x-m.left-2,right:p.x+m.right+2,top:p.y-m.up-2,bottom:p.y+m.down+2});
// Declarative oracle: intersect intervals and compute independent rectangle-to-center distance.
function overlap(a,b){return Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top)}
function touchesCircle(b,p,r){const dx=Math.max(b.left-p.x,0,p.x-b.right),dy=Math.max(b.top-p.y,0,p.y-b.bottom);return dx*dx+dy*dy<=r*r}
function oracle(state,profile,newFormat=true){
 const posts=state.posts,boxes=posts.map((p,i)=>({...box({x:p.x-30,y:p.y+46},metric(caption(p),profile)),kind:'post',id:i}));
 const ranges=posts.map((p,i)=>({...box({x:clamp(p.x-34,8,1120),y:Math.max(14,p.y-71)},metric('据点控制65',profile)),kind:'range',id:i}));
 const marker=state.mapChoice==='meridian'&&state.objective==='stronghold'?posts.reduce((a,p)=>!a||Math.hypot(p.x-600,p.y-400)<Math.hypot(a.x-600,a.y-400)?p:a,null):null;
 const markers=marker?[{left:marker.x-32,right:marker.x+40,top:marker.y-94,bottom:marker.y-70,kind:'markerTop',id:posts.indexOf(marker)},{left:marker.x-66,right:marker.x+78,top:marker.y+66,bottom:marker.y+90,kind:'markerBottom',id:posts.indexOf(marker)}]:[];
 return state.ores.filter(o=>o.amount>0).map(ore=>{const label=format(ore.amount,newFormat),m=metric(label,profile),raw=[{x:ore.x-25,y:ore.y+48},{x:ore.x-25,y:ore.y-74},{x:ore.x+90,y:ore.y+4},{x:ore.x-m.right-90,y:ore.y+4},{x:ore.x-25,y:ore.y+100}],candidates=raw.map(p=>({x:clamp(p.x,4+m.left,1196-m.right),y:clamp(p.y,4+m.up,796-m.down)}));const choices=candidates.map((p,i)=>{const b=box(p,m),radius=i===0?36:68,obstacles=boxes.concat(i===0?[]:ranges,markers),reasons=posts.filter(q=>touchesCircle(b,q,radius)).map(q=>'circle:'+posts.indexOf(q)).concat(obstacles.filter(q=>overlap(b,q)).map(q=>q.kind+':'+q.id));return {i,p,box:b,reasons,safe:reasons.length===0}});let index=choices.findIndex(c=>c.safe),fallback=index<0;if(fallback)index=0;return {ore:copy(ore),label,x:candidates[index].x,y:candidates[index].y,index,fallback,metrics:m,candidates:choices,obstacles:boxes.concat(ranges,markers)};});
}
function plain(rows){return rows.map(({ore,label,x,y})=>({ore,label,x,y}))}
function stateFixture(ore,posts=[],mapChoice='classic',objective='annihilation'){return {ores:[ore],posts:posts.map(p=>({owner:-1,progress:0,side:-1,...p})),mapChoice,objective}}
function isolated(f=fnSource){const c=vm.createContext({ctx:{save(){},restore(){},measureText:profiles.widthOnly},state:{},WIDTH:1200,HEIGHT:800,clamp,postCaption:caption,strongholdPost(){return c.state.posts.reduce((a,p)=>!a||Math.hypot(p.x-600,p.y-400)<Math.hypot(a.x-600,a.y-400)?p:a,null)}});vm.runInContext(f,c);return (state,profile)=>{c.state=copy(state);c.ctx.measureText=profiles[profile];return copy(vm.runInContext('oreLabelLayout()',c))}}
const isolatedCandidate=isolated(),baselineFn=fs.readFileSync(path.join(base,'index.html'),'utf8'),isolatedBase=isolated(baselineFn.slice(baselineFn.indexOf('function oreLabelLayout()'),baselineFn.indexOf('\nfunction drawStrongholdMarker()')));
function checkFixture(state,profile,tag,save=false){const expected=oracle(state,profile),actual=isolatedCandidate(state,profile);eq(actual,plain(expected),tag+' independent oracle');const previous=isolatedBase(state,profile);for(let i=0;i<expected.length;i++){const o=expected[i],m=o.metrics;ok(o.x-m.left>=4-1e-9&&o.x+m.right<=1196+1e-9&&o.y-m.up>=4-1e-9&&o.y+m.down<=796+1e-9,tag+' glyph extents inside 4px canvas margin');if(o.ore.amount>=1000)eq(actual[i],previous[i],tag+' retained >=1000 layout');}if(save)geometry.push({tag,profile,state:copy(state),baseline:previous,candidate:actual,oracle:expected});return expected}
function setup(g,s){g.context.__fixture=copy(s);g.run('state.ores=__fixture.ores;state.posts=__fixture.posts;state.mapChoice=__fixture.mapChoice;state.objective=__fixture.objective')}
const methods=[...new Set([...html.matchAll(/ctx\.([A-Za-z_$][\w$]*)\s*\(/g)].map(m=>m[1]))].sort();
function recorder(g){const r=record(g,{metrics:text=>profiles[g.metricProfile](text)});return Object.assign(r,{all:r.events})}
function trackState(g){return g.run('JSON.stringify(state.entities.map(e=>[e.id,unitTrackMemory.get(e)||null]))')}
function snapshotTracks(g,cloneExpression='JSON.parse(JSON.stringify(v))'){
 const before=trackState(g);g.run('globalThis.__v315TrackSnapshot=state.entities.map(e=>{let v=unitTrackMemory.get(e);return [e,v?'+cloneExpression+':undefined]})');return before;
}
function restoreTracks(g,before){
 g.run('for(const [e,v] of __v315TrackSnapshot){if(v===undefined)unitTrackMemory.delete(e);else unitTrackMemory.set(e,v)};delete globalThis.__v315TrackSnapshot');
 eq(trackState(g),before,'expected replay restores deeply cloned pre-render unit-track values');
}
function frame(a,b,ra,rb,profile,tag){
 const wa=core(a),wb=core(b);eq(wa,wb,tag+' paired world before');
 const expectedA=plain(oracle(copy(a.state),profile,false)),expectedB=plain(oracle(copy(b.state),profile,true));
 eq(copy(a.run('oreLabelLayout()')),expectedA,tag+' baseline declarative layout');eq(copy(b.run('oreLabelLayout()')),expectedB,tag+' candidate declarative layout');
 ra.reset();rb.reset();const checkpoint=ra.checkpoint(),trackBefore=snapshotTracks(a);
 const render=g=>{g.run('globalThis.__rngCount=0;globalThis.__savedRandom=Math.random;Math.random=()=>{__rngCount++;return __savedRandom()};try{render()}finally{Math.random=__savedRandom}');eq(g.run('__rngCount'),0,tag+' render consumes zero RNG')};
 render(a);render(b);eq(core(a),wa,'baseline world stable');eq(core(b),wb,'candidate world stable');
 const original={paints:copy(ra.paints),all:copy(ra.all),snapshot:ra.snapshot()};
 // Replay only the expected historical VM. Its immutable layout body receives
 // independent v315 strings before the ORIGINAL metric cache/candidate/clamp path.
 // Candidate commands/paints are never filtered, rewritten or normalized.
 restoreTracks(a,trackBefore);a.run('globalThis.__v315OriginalLayout=oreLabelLayout');installExpectedOreLabels(a);ra.rewind(checkpoint);ra.reset();
 try{render(a)}finally{a.run('oreLabelLayout=__v315OriginalLayout;delete globalThis.__v315OriginalLayout')}
 eq(rb.paints,ra.paints,'candidate complete paint stream matches expected historical replay');
 eq(rb.all,ra.all,'candidate complete Canvas method stream matches expected historical replay');
 eq(ra.snapshot(),rb.snapshot(),'complete final context');eq(ra.stack.length,0);eq(rb.stack.length,0);
 eq(ra.current,rb.current,'complete current path');eq(core(a),wa,'expected replay world stable');
 eq(a.run('JSON.stringify(state.entities.map(e=>[e.id,unitTrackMemory.get(e)||null]))'),b.run('JSON.stringify(state.entities.map(e=>[e.id,unitTrackMemory.get(e)||null]))'),'unit track-memory equality');
 eq(a.run('JSON.stringify([Math.random(),Math.random(),Math.random()])'),b.run('JSON.stringify([Math.random(),Math.random(),Math.random()])'),'same future RNG');
 if(expectedA.every((x,i)=>x.label===expectedB[i].label)){eq(original.all,rb.all,'retained full call stream');eq(original.paints,rb.paints,'retained full paint stream')}
 const measures=events=>events.filter(c=>c[0]==='measureText').map(c=>c[1]);
 frames.push({tag,profile,baselineTotalCanvasCalls:original.all.length,candidateTotalCanvasCalls:rb.all.length,expectedTotalCanvasCalls:ra.all.length,baselineTotalMeasureText:measures(original.all).length,candidateTotalMeasureText:measures(rb.all).length,baselinePaints:original.paints.length,candidatePaints:rb.paints.length,baselineFillRects:original.paints.filter(p=>p.op==='fillRect').length,candidateFillRects:rb.paints.filter(p=>p.op==='fillRect').length,positiveOres:expectedB.length,changedLabels:expectedA.filter((x,i)=>x.label!==expectedB[i].label).length,movedLabels:expectedA.filter((x,i)=>x.x!==expectedB[i].x||x.y!==expectedB[i].y).length,allMeasureTextBefore:measures(original.all),allMeasureTextAfter:measures(rb.all),completeCandidateStreamUnmodified:true,allExpectedPaintsAndMethodsExact:true,worldImmutable:true,renderRandomCalls:0});
}


test('frozen source exact approved expression and version',()=>{
 eq(baseFrozen['index.html'],'30a960f10a359ac13fb04b3f758529376956227bb3dce079c8be0028476594f4','strict immutable final v302');
 eq(candidateFrozen['index.html'],'3956a8f7f751949b226fc4cdd91dfe8abd7b4eadd79f83ee02a0df794e08acb6','strict immutable final v315');
 eq(require('./restore-v302-from-v315.cjs')(html),fs.readFileSync(path.join(base,'index.html'),'utf8'),'exact inverse restores immutable final v302');
 eq(source.split(after).length-1,1,'exact unique source label slot');eq(source.split(before).length-1,0,'old label expression absent');
 eq(JSON.parse(fs.readFileSync(path.join(candidate,'source-build-receipt.json'))).outputSha256,candidateFrozen['index.html'],'generated receipt output identity');
});
const amounts=[-1,0,Number.MIN_VALUE,.1,1,180,998.999,999,999.1,999.5,999.999999999,1000,1000.000000001,1001,1500,4500,4500.1,12000,1e7];
test('exact threshold text, fractional ceil and nonpositive omission',()=>{for(const profile of Object.keys(profiles))for(const amount of amounts){const s=stateFixture({x:500,y:600,amount}),r=checkFixture(s,profile,'threshold '+profile+'/'+amount,true);eq(r[0]?.label??null,format(amount,true));}eq(format(999.5,true),'矿 1000');eq(format(1000,true),'矿 1k');eq(format(1001,true),'矿 2k')});
test('all edge origins and corners with positive glyph extents',()=>{for(const profile of Object.keys(profiles))for(const x of [0,1,600,1199,1200])for(const y of [0,1,400,799,800])for(const amount of [1,180,999,999.5,1000,1001,12000])checkFixture(stateFixture({x,y,amount}),profile,'edge '+[profile,x,y,amount].join('/'),x!==600&&y!==400&&amount===999.5);});
for(const map of mapKeys)test('real map ore seeds and gameplay state '+map,()=>{const a=game(base,'legacy',map),b=game(candidate,'legacy',map);eq(core(a),core(b));eq(copy(a.state.ores),copy(b.state.ores));ok(b.state.ores.every(o=>o.amount===12000));maps.push({map,count:b.state.ores.length,ores:copy(b.state.ores),posts:copy(b.state.posts)});a.step(5);b.step(5);eq(core(a),core(b),'same 5 seconds simulation');for(const profile of Object.keys(profiles)){let s=copy(b.state);s.ores.forEach((o,i)=>o.amount=[1,180,999,999.5,1000,1001][i]);checkFixture(s,profile,map+' mixed '+profile,true);s.ores.forEach((o,i)=>o.amount=[1000,1001,1500,4500,12000,1e7][i]);checkFixture(s,profile,map+' retained '+profile,true)}});
for(const map of mapKeys)for(const mode of ['legacy','direct','cached'])test('full recorded rendering '+map+'/'+mode,()=>{const profile=mode==='legacy'?'widthOnly':mode==='direct'?'proportional':'widePositiveExtents',a=game(base,mode,map,map==='meridian'?'stronghold':'control',profile),b=game(candidate,mode,map,map==='meridian'?'stronghold':'control',profile),ra=recorder(a),rb=recorder(b);frame(a,b,ra,rb,profile,map+'/'+mode+'/initial');for(const g of[a,b])g.run('state.ores.forEach((o,i)=>o.amount=[1,180,999,999.5,1000,1001][i]);hoverActive=true;mouse={x:state.posts[0].x,y:state.posts[0].y};selection=new Set(state.entities.filter(e=>e.team===0).map(e=>e.id))');frame(a,b,ra,rb,profile,map+'/'+mode+'/mixed-post-hover');for(const g of[a,b])g.run('mouse={x:state.ores[0].x,y:state.ores[0].y};state.paused=true');frame(a,b,ra,rb,profile,map+'/'+mode+'/paused-ore-hover')});
const candidateFixtures=[];
test('every candidate and unchanged all-conflict fallback',()=>{for(const profile of Object.keys(profiles)){
 let seed=40729;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296},found=new Map();
 for(let n=0;n<30000&&found.size<6;n++){const count=n===0?0:1+Math.floor(rand()*6),posts=Array.from({length:count},()=>({x:430+rand()*340,y:250+rand()*320})),s=stateFixture({x:600,y:400,amount:999.5},posts),o=oracle(s,profile)[0],key=o.fallback?'fallback':String(o.index);if(!found.has(key))found.set(key,s)}
 eq([...found.keys()].sort(),['0','1','2','3','4','fallback']);for(const [key,s]of found){const rows=checkFixture(s,profile,'candidate '+profile+'/'+key,true),o=rows[0];if(key==='fallback'){ok(o.candidates.every(c=>!c.safe));eq({x:o.x,y:o.y},o.candidates[0].p);ok(o.candidates[0].reasons.length>0,'fallback intentionally retains overlap')}else{eq(o.index,Number(key));ok(o.candidates[o.index].safe);ok(o.candidates.slice(0,o.index).every(c=>!c.safe));}candidateFixtures.push({profile,key,state:s});}
 }});
const boundaryFixtures=[];
test('exact rectangle adjacency post caption, control caption and meridian stronghold markers',()=>{const profile='widePositiveExtents',m=metric('矿 1000',profile),targetPost={x:600,y:400,owner:0};for(const kind of ['post','range','markerTop','markerBottom'])for(const side of ['left','right','top','bottom']){
 const map=kind.startsWith('marker')?'meridian':'classic',objective=kind.startsWith('marker')?'stronghold':'control',index=kind==='range'?1:0,seed=stateFixture({x:600,y:600,amount:999.5},[targetPost],map,objective),q=oracle(seed,profile)[0].obstacles.find(b=>b.kind===kind),p={x:0,y:0};
 if(side==='left'||side==='right'){p.x=side==='left'?q.left-m.right-2:q.right+m.left+2;p.y=(q.top+q.bottom+m.up-m.down)/2;}else{p.x=q.right+m.left;p.y=side==='top'?q.top-m.down-2:q.bottom+m.up+2;}
 const fixtures=[];for(const delta of [-.000001,0,.000001]){const pos={...p};if(side==='left')pos.x+=delta;if(side==='right')pos.x-=delta;if(side==='top')pos.y+=delta;if(side==='bottom')pos.y-=delta;const ore={x:pos.x+25,y:pos.y+(index===1?74:-48),amount:999.5},posts=[targetPost];if(index===1)posts.push({x:pos.x+(m.right-m.left)/2,y:pos.y+122});const s=stateFixture(ore,posts,map,objective),row=checkFixture(s,profile,'rectangle '+[kind,side,delta].join('/'),true)[0],target=row.candidates[index];eq(target.reasons.includes(kind+':0'),delta>0,'strict rectangle boundary '+kind+'/'+side+'/'+delta);if(delta<=0){ok(target.safe,'isolated adjacent target safe '+kind+'/'+side);eq(row.index,index,'exact/outside takes target')}else{ok(!target.safe);ok(row.index!==index||row.fallback,'inside rejects target')};boundaryFixtures.push({profile,state:s});fixtures.push({delta,chosen:row.index,fallback:row.fallback,label:row.label,x:row.x,y:row.y,testedCandidate:target});}
 boundaries.push({kind,side,profile,box:q,candidate:index,fixtures});
 }});
test('normal radius36 and expanded radius68 tangency inclusive',()=>{for(const index of [0,1]){const profile='widePositiveExtents',m=metric('矿 1000',profile),r=index===0?36:68,p={x:600-r-m.right-2,y:400+(m.up-m.down)/2};for(const delta of [-.000001,0,.000001]){const x=p.x+delta,posts=[{x:600,y:400,owner:0}];if(index)posts.push({x:x+(m.right-m.left)/2,y:p.y+122});const s=stateFixture({x:x+25,y:p.y+(index?74:-48),amount:999.5},posts),row=checkFixture(s,profile,'circle '+r+'/'+delta,true)[0];eq(row.candidates[index].reasons.includes('circle:0'),delta>=0,'inclusive circle '+r+'/'+delta);boundaryFixtures.push({profile,state:s});boundaries.push({kind:'circle',radius:r,delta,candidate:index,chosen:row.index,reasons:row.candidates[index].reasons})}}});

test('actual VM replays synthetic candidate and boundary fixtures in both preview modes',()=>{for(const mode of ['legacy','direct','cached']){const a=game(base,mode),b=game(candidate,mode),ra=recorder(a),rb=recorder(b);for(const fixture of candidateFixtures.concat(boundaryFixtures)){const {profile,state:s}=fixture;for(const g of[a,b]){setup(g,s);g.metricProfile=profile;g.run('hoverActive=false;selection.clear()')}frame(a,b,ra,rb,profile,'synthetic/'+mode+'/'+(fixture.key||'boundary'));}}});
test('retained >=1000 layouts across all synthetic blockers and boundaries',()=>{for(const {profile,state:s}of candidateFixtures.concat(boundaryFixtures))for(const amount of [1000,1001,4500,1e7]){const state=copy(s);state.ores[0].amount=amount;checkFixture(state,profile,'retained obstacle '+amount)}});
for(const mode of ['legacy','direct','cached'])test('threshold full frames '+mode,()=>{const profile='widePositiveExtents',a=game(base,mode,'meridian','stronghold',profile),b=game(candidate,mode,'meridian','stronghold',profile),ra=recorder(a),rb=recorder(b);for(const amount of amounts){for(const g of[a,b])g.run(`state.ores=[{x:1200,y:0,amount:${amount}}];hoverActive=false`);frame(a,b,ra,rb,profile,'threshold/'+mode+'/'+amount)}});
test('hover lines, entity occlusion, assigned-miner panel and ore targeting unchanged',()=>{for(const amount of amounts.filter(a=>a>=0)){const a=game(base),b=game(candidate);for(const g of[a,b]){g.run(`state.ores=[{x:500,y:600,amount:${amount}}];get(5).oreIndex=0;hoverActive=true;mouse={x:500,y:600}`)}for(const expression of ['oreInspectionLines(state.ores[0])','inspectionLines(get(5))','selectionDescription([get(5)])','hoverOre()','mapCommandOreIndex(mouse,null,false)'])eq(copy(a.run(expression)),copy(b.run(expression)),expression);eq(a.run('oreInspectionLines(state.ores[0])[0]'),'矿点 · 剩余 '+Math.ceil(amount));ok(a.run('hoverOre()!==null'));for(const g of[a,b])g.run('get(5).x=500;get(5).y=600');eq(a.run('hoverOre()'),null);eq(b.run('hoverOre()'),null)}});
test('same harvesting outcomes, fractional conservation and depletion',()=>{for(const amount of [0,.1,.125,1,15,16,180,999,999.5,1000,1001,1500,4500]){const a=game(base),b=game(candidate);for(const g of[a,b])g.run(`state.ores=[{x:350,y:660,amount:${amount}}];globalThis.miner=state.entities.find(e=>e.type==='harvester'&&e.team===0);miner.x=350;miner.y=660;miner.mine=0;miner.load=0;harvest(miner,.35)`);eq(core(a),core(b));eq(b.state.ores[0].amount,Math.max(0,amount-15));eq(b.run('miner.load'),Math.min(15,amount));}});
test('pure save validator exact numeric acceptance and negative rejection without persistence',()=>{for(const root of [base,candidate]){const g=game(root);for(const [value,valid]of [['0',true],['Number.MIN_VALUE',true],['.1',true],['999.5',true],['1000',true],['1e7',true],['-.1',false],['1e7+.01',false],['NaN',false],['Infinity',false],['"999"',false],['null',false],['undefined',false]])eq(g.run(`(()=>{let p=JSON.parse(JSON.stringify({version:1,state,groups,nextEntityId:uid}));p.state.ores[0].amount=${value};return validSave(p)})()`),valid,'save amount '+value);}});
test('runtime mutation negatives reject text, threshold, metric, collision and fallback regressions',()=>{const corpus=[...Object.keys(profiles).flatMap(profile=>amounts.flatMap(amount=>[[0,0],[1200,0],[0,800],[1200,800]].map(([x,y])=>({profile,state:stateFixture({x,y,amount})})))),...candidateFixtures,...boundaryFixtures,...Object.keys(profiles).map(profile=>({profile,state:stateFixture({x:600,y:0,amount:999.5},[{x:600,y:50}])}))],mutants=[
 ['original low band',after,before],['floor low amount','o.amount<1000?Math.ceil(o.amount)','o.amount<1000?Math.floor(o.amount)'],['inclusive1000 threshold','o.amount<1000?','o.amount<=1000?'],['manual x nudge','x:o.x-25,y:o.y+48','x:o.x-24,y:o.y+48'],['left clamp margin','4+m.left,WIDTH-4-m.right','3+m.left,WIDTH-4-m.right'],['right clamp margin','WIDTH-4-m.right','WIDTH-3-m.right'],['top clamp margin','4+m.up,HEIGHT-4-m.down','3+m.up,HEIGHT-4-m.down'],['bottom clamp margin','HEIGHT-4-m.down','HEIGHT-3-m.down'],['ignore positive left extent','left:Math.max(0,m.actualBoundingBoxLeft||0)','left:0'],['ignore positive right extent','right:Math.max(m.width,m.actualBoundingBoxRight||0)','right:m.width'],['skip control caption','postBoxes.concat(rangeBoxes,markerBoxes)','postBoxes.concat(markerBoxes)'],['skip meridian marker',"state.mapChoice==='meridian'&&state.objective==='stronghold'","false"],['fallback last candidate','||candidates[0];labels.push','||candidates[4];labels.push'],['normal radius35','expanded?68:36','expanded?68:35'],['expanded radius67','expanded?68:36','expanded?67:36']
 ];for(const [name,old,replacement]of mutants){ok(fnSource.includes(old),name+' mutation anchor');const run=isolated(fnSource.replace(old,replacement));let rejected=null;for(const f of corpus){const expected=plain(oracle(f.state,f.profile));if(JSON.stringify(run(f.state,f.profile))!==JSON.stringify(expected)){rejected={profile:f.profile,state:f.state,expected};break}}ok(rejected,name+' negative must fail narrow oracle');negativeControls.push({name,rejected:true,witness:rejected})}});
test('track replay rejects aliased and shallow snapshots with nested mutation witnesses',()=>{
 const setup="globalThis.__trackEntity=state.entities.find(e=>defs[e.type].speed);unitTrackMemory.set(__trackEntity,{x:__trackEntity.x,y:__trackEntity.y,phase:2,proof:{nested:{counter:1}}})";
 const mutate="let v=unitTrackMemory.get(__trackEntity);v.x+=2;v.phase+=1;v.proof.nested.counter++";
 const good=game(base);good.run(setup);const before=snapshotTracks(good);good.run(mutate);restoreTracks(good,before);
 for(const [name,expression]of [['aliased track value','v'],['shallow track value','({...v})']]){const g=game(base);g.run(setup);const before=snapshotTracks(g,expression);g.run(mutate);let failure;try{restoreTracks(g,before)}catch(e){failure=e}ok(failure&&failure.name==='AssertionError'&&failure.code==='ERR_ASSERTION','reject '+name);eq(failure.message.split('\n')[0],'expected replay restores deeply cloned pre-render unit-track values','exact track rewind diagnostic');negativeControls.push({name,rejected:true,diagnostic:failure.message.split('\n')[0],nestedSentinel:true})}
});
test('moving units preserve pre-render track snapshots and consecutive expected replays',()=>{
 for(const mode of ['legacy','direct','cached']){const profile='widePositiveExtents',a=game(base,mode,'classic','control',profile),b=game(candidate,mode,'classic','control',profile),ra=recorder(a),rb=recorder(b);for(const g of[a,b])g.run('state.ores.forEach((o,i)=>o.amount=[1,180,999.5,1000][i%4])');
  for(let n=0;n<4;n++){if(n)for(const g of[a,b])g.run('for(const e of state.entities)if(defs[e.type].speed){e.x+=2.25;e.y-=1.5;e.angle+=.17}');frame(a,b,ra,rb,profile,'moving-tracks/'+mode+'/'+n);}
 }
});
test('strict complete streams reject nontext paints, clips, styles, extra methods and metric-cache regressions',()=>{
 const mutationDir=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'red-label-stream-mutants-'));
 const setupExpression=`state.ores=[{x:0,y:0,amount:.1},{x:300,y:600,amount:.1},{x:1200,y:800,amount:999.5},{x:500,y:600,amount:1000}];hoverActive=false;let f=state.entities.find(e=>e.team===0&&e.type==='factory');f.build=2;selection.add(f.id);`;
 const mutants=[
  ['ore base paint color',"circle(o.x,o.y,33,'#746544')","circle(o.x,o.y,33,'#746545')",'paint'],
  ['ore retained block geometry','*21-5,9,12,i%2?','*21-5,10,12,i%2?','paint'],
  ['ore density count','o.amount<=1500?1:o.amount<=4500?4:8','o.amount<=1500?2:o.amount<=4500?4:8','paint'],
  ['ore label paint font',"text(label,x,y,'#e2d692',11)","text(label,x,y,'#e2d692',12)",'paint'],
  ['ore label paint color',"text(label,x,y,'#e2d692',11)","text(label,x,y,'#e2d693',11)",'paint'],
  ['ore label clip scope',"text(label,x,y,'#e2d692',11)","ctx.save();ctx.beginPath();ctx.rect(0,0,10,10);ctx.clip();text(label,x,y,'#e2d692',11);ctx.restore()",'paint'],
  ['extra nonpaint methods','function render(){','function render(){ctx.save();ctx.restore();','method'],
  ['extra unrelated measurement','function render(){',"function render(){ctx.measureText('unapproved');",'method'],
  ['duplicate low-label metric cache','if(measured.has(s))return measured.get(s);',"if(measured.has(s)&&!s.startsWith('矿 '))return measured.get(s);",'method'],
  ['omit retained context method','ctx.restore();return labels','ctx.restore();ctx.save();ctx.restore();return labels','method']
 ];
 const run=(text,mode)=>{fs.writeFileSync(path.join(mutationDir,'index.html'),text);const profile='widePositiveExtents',a=game(base,mode,'meridian','stronghold',profile),b=game(mutationDir,mode,'meridian','stronghold',profile),ra=recorder(a),rb=recorder(b);for(const g of[a,b])g.run(setupExpression);frame(a,b,ra,rb,profile,'strict-stream/'+mode);return {paints:rb.paints.length,methods:rb.all.length,clips:rb.paints.filter(p=>p.clips.length).length}};
 try{
  for(const mode of ['legacy','direct','cached']){
   const control=run(html,mode);ok(control.clips>0,'strict stream prerequisite actually contains clipped overlays');
   for(const [name,old,replacement,kind]of mutants){eq(html.split(old).length-1,1,'unique stream mutation '+name);let error;try{run(html.replace(old,replacement),mode)}catch(e){error=e}
    ok(error&&error.name==='AssertionError'&&error.code==='ERR_ASSERTION','behavioral assertion only '+name);
    const expected='candidate complete '+(kind==='paint'?'paint stream':'Canvas method stream')+' matches expected historical replay';
    eq(error.message.split('\n')[0],expected,'exact intended full-stream diagnostic '+name);
    negativeControls.push({name,mode,rejected:true,kind,diagnostic:expected,prerequisite:control});
   }
  }
 }finally{fs.rmSync(mutationDir,{recursive:true,force:true})}
});
test('recorder fails closed on inherited unrecorded Canvas methods',()=>{
 const root=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'red-label-unrecorded-'));
 try{for(const method of ['createLinearGradient','createRadialGradient','getLineDash']){const mutant=html.replace('function render(){','function render(){ctx.'+method+'();');fs.writeFileSync(path.join(root,'index.html'),mutant);const g=game(root);let failure;try{recorder(g)}catch(e){failure=e}ok(failure&&failure.name==='AssertionError'&&failure.code==='ERR_ASSERTION','reject inherited stub '+method);eq(failure.message.split('\n')[0],'unrecorded source Canvas method '+method,'exact recorder missing-method diagnostic');negativeControls.push({name:'unrecorded '+method,rejected:true,diagnostic:failure.message.split('\n')[0]})}}finally{fs.rmSync(root,{recursive:true,force:true})}
});
test('baseline and candidate product trees unchanged by independent review',()=>{eq(freeze(base),baseFrozen);eq(productFreeze(candidate),candidateFrozen)});
const samples=geometry.filter(g=>g.candidate.some((r,i)=>r.label!==g.baseline[i].label&&(r.x!==g.baseline[i].x||r.y!==g.baseline[i].y))).map(g=>({tag:g.tag,profile:g.profile,baseline:g.baseline,candidate:g.candidate,metrics:g.oracle.map(o=>o.metrics),baselineCandidateIndex:oracle(g.state,g.profile,false).map(o=>o.index),baselineMetrics:oracle(g.state,g.profile,false).map(o=>o.metrics),candidateIndex:g.oracle.map(o=>o.index),fallback:g.oracle.map(o=>o.fallback)}));
const output={passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).length,assertions,runnerSha256:sha(fs.readFileSync(__filename)),methodCoverage:methods,preservedFiles:{baseline:Object.keys(baseFrozen).length,prototype:Object.keys(candidateFrozen).length},sourceHashes:{baseline:baseFrozen['index.html'],candidate:candidateFrozen['index.html']},harnessDependencies:['./building-independent-v295/recorder.cjs','./building-independent-v295/no-persistence-vm.cjs','./low-ore-label-recorder-v315.cjs','./low-ore-label-oracle-v315.cjs','./depleted-ore-expected-v315.cjs'].map(rel=>({path:rel,sha256:sha(fs.readFileSync(path.resolve(dir,rel)))})),scope:'Existing no-persistence Node VM and Canvas command recorder only. Historical renders receive independently specified depleted ground commands at their hash-locked layer slot; candidate streams are unmodified. Synthetic text metrics explicitly supplied, not measured native fonts or raster output. Mock Path2D. No browser, no storage calls, no product mutation, no historical gate. Native font/raster/narrow-screen approval remains separate.',formatContract:{threshold:1000,positiveLow:'矿 '+ 'ceil(amount)',retainedHigh:'矿 '+ 'ceil(amount/1000)k',zeroAndNegative:'omit',fractional999_5:'矿 1000',at1000:'矿 1k',at1001:'矿 2k'},metricProfiles:Object.keys(profiles).map(profile=>({profile,synthetic:true,samples:['矿 1k','矿 1','矿 180','矿 999','矿 1000','中立据点','据点控制65'].map(text=>({text,raw:profiles[profile](text),used:metric(text,profile)}))})),maps,frameCount:frames.length,frames,geometry,boundaries,negativeControls,layoutChangeSamples:samples,results};
fs.mkdirSync(path.join(dir,'low-ore-labels-v315-evidence'),{recursive:true});
fs.writeFileSync(path.join(dir,'low-ore-labels-v315-evidence/low-ore-label-v315-details.json'),JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify({passed:output.passed,failed:output.failed,assertions,frames:frames.length,sourceHashes:output.sourceHashes,layoutChangeSamples:samples.length,negativeControls:negativeControls.length,failures:results.filter(r=>!r.pass)},null,2));if(output.failed)process.exitCode=1;
