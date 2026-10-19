'use strict';
// NEW v307 execution of retained v294 layout tests; retained layout geometry and allocation contract with independent v307 input text. The old research matrices remain untouched; this suite runs
// current source in the existing VM as well as exact extracted layout functions.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {loadGame}=require('./vm-environment.cjs');
const {expectedLayoutSource,installExpectedOreLabels}=require('./low-ore-label-oracle-v307.cjs');
const maps=['classic','meridian','ring','frontier','canyon','ridge','crossroads','switchback'];
const objectives=['annihilation','control','stronghold','harvest','survival'];
const plain=x=>JSON.parse(JSON.stringify(x));
function extract(html,name){const lines=html.split('\n').filter(x=>x.startsWith('function '+name+'('));assert.equal(lines.length,1,'one exact '+name+' definition');return lines[0]}
function invariant(value,check,message){if(!value){const e=new Error(message||check);e.check=check;throw e}}
function equal(a,b,check){try{assert.deepEqual(plain(a),plain(b))}catch{invariant(false,check,check+'\nactual: '+JSON.stringify(a)+'\nexpected: '+JSON.stringify(b))}}
const metricSource=`function __metrics(s,mode){let w=s.length*7;return mode===0?{width:w}:mode===1?{width:w,actualBoundingBoxLeft:2,actualBoundingBoxRight:w+3,actualBoundingBoxAscent:13,actualBoundingBoxDescent:4}:mode===2?{width:0,actualBoundingBoxLeft:-3,actualBoundingBoxRight:0,actualBoundingBoxAscent:-1,actualBoundingBoxDescent:0}:mode===3?{width:w,actualBoundingBoxLeft:NaN,actualBoundingBoxRight:NaN,actualBoundingBoxAscent:NaN,actualBoundingBoxDescent:NaN}:mode===4?{width:1400,actualBoundingBoxLeft:25,actualBoundingBoxRight:1450,actualBoundingBoxAscent:850,actualBoundingBoxDescent:25}:mode===5?{width:w+.25,actualBoundingBoxLeft:.5,actualBoundingBoxRight:w+.75,actualBoundingBoxAscent:11.5,actualBoundingBoxDescent:3.5}:mode===6?{width:s.length*8}:mode===7?{width:s.length*9+.5,actualBoundingBoxLeft:17,actualBoundingBoxRight:s.length*9+43,actualBoundingBoxAscent:25,actualBoundingBoxDescent:9}:mode===8?{width:1250,actualBoundingBoxLeft:12,actualBoundingBoxRight:1255,actualBoundingBoxAscent:1000,actualBoundingBoxDescent:500}:{width:0,actualBoundingBoxLeft:-5,actualBoundingBoxRight:0,actualBoundingBoxAscent:0,actualBoundingBoxDescent:0}}`;
// Instrument only the function invocation, never rendering or simulation outside
// it. Native concat behavior is retained, and all patched functions are restored.
const auditSource=`function __auditLayout(fn){
 const rootState=state,before=JSON.stringify(state),posts=state.posts,ores=state.ores,postRefs=[...posts],oreRefs=[...ores];
 const font=ctx.font,fill=ctx.fillStyle,alpha=ctx.globalAlpha,stack=[],events=[],helpers=[];
 const old={concat:Array.prototype.concat,random:Math.random,save:ctx.save,restore:ctx.restore,measure:ctx.measureText,caption:postCaption,marker:strongholdPost};
 let count=0,rng=0,result,error;
 Array.prototype.concat=function(...xs){count++;return old.concat.apply(this,xs)};
 Math.random=()=>{rng++;return .5};
 ctx.save=function(){events.push(['save',this.font]);stack.push({font:this.font,fillStyle:this.fillStyle,globalAlpha:this.globalAlpha});return old.save.call(this)};
 ctx.restore=function(){events.push(['restore',this.font]);const saved=stack.pop();old.restore.call(this);if(saved)Object.assign(this,saved)};
 ctx.measureText=function(s){events.push(['measure',s,this.font]);return old.measure.call(this,s)};
 postCaption=function(p){helpers.push(['caption',posts.indexOf(p)]);return old.caption(p)};
 strongholdPost=function(){helpers.push(['marker']);return old.marker()};
 try{result=fn()}catch(e){error={name:e.name,message:e.message}}
 finally{Array.prototype.concat=old.concat;Math.random=old.random;ctx.save=old.save;ctx.restore=old.restore;ctx.measureText=old.measure;postCaption=old.caption;strongholdPost=old.marker}
 const identity=Array.isArray(result)&&result.every(r=>ores.includes(r.ore));
 return {result,error,rows:Array.isArray(result)?result.map(r=>({index:ores.indexOf(r.ore),label:r.label,x:r.x,y:r.y})):null,identity,count,rng,events,helpers,unchanged:rootState===state&&before===JSON.stringify(state)&&posts===state.posts&&ores===state.ores&&postRefs.every((p,i)=>posts[i]===p)&&oreRefs.every((o,i)=>ores[i]===o),context:ctx.font===font&&ctx.fillStyle===fill&&ctx.globalAlpha===alpha&&stack.length===0};
}`;
function extracted(html){const c=vm.createContext({});vm.runInContext(`'use strict';let state,metricMode=0;const WIDTH=1200,HEIGHT=800,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));${metricSource}
 const ctx={font:'external-font',fillStyle:'#13579b',globalAlpha:.37,save(){},restore(){},measureText(s){return __metrics(s,metricMode)}};
 ${['postCaption','strongholdPost','oreLabelLayout'].map(n=>extract(html,n)).join('\n')}
 ${auditSource}
 function __freeze(x){if(x&&typeof x==='object'){Object.values(x).forEach(__freeze);Object.freeze(x)}return x}
 function __evaluate(input,mode){state=__freeze(input);metricMode=mode;return __auditLayout(oreLabelLayout)};`,c);
 return (input,mode=0)=>{c.incoming=JSON.stringify(input);c.mode=mode;return plain(vm.runInContext('__evaluate(JSON.parse(incoming),mode)',c,{timeout:10000}))};
}
const post=(x,y,extra={})=>({x,y,owner:-1,...extra}),ore=(x,y,amount=12000)=>({x,y,amount});
function scene(posts,ores,mapChoice='classic',objective='annihilation'){return{posts,ores,mapChoice,objective}}
function sentinelCases(){return [
 ['empty',scene([post(600,400)],[])],
 ['depleted',scene([post(600,400)],[ore(600,400,0),ore(200,200,-1)])],
 ['normal-only-many',scene([],[ore(100,100),ore(200,200),ore(300,300),ore(100,100)]),0,{concat:1}],
 ['expanded-full-overlap',scene([post(600,400),post(600,400)],[ore(600,400),ore(600,400)] ,'meridian','stronghold'),8,{concat:2,x:16,y:1004}],
 ['mixed-captions',scene([post(200,200,{contested:true}),post(400,400,{controlBlocked:true}),post(600,500,{owner:0}),post(800,600)],[ore(200,200,999),ore(400,400,1001),ore(600,500,.1),ore(800,600,12001)],'meridian','stronghold')],
 ['geometry-obstacles',scene([post(600,400)],[ore(560,398),ore(640,430),ore(600,310),ore(630,500)],'meridian','stronghold')],
 ['current-ore-reference',scene([],[ore(100,100,1001)])],
 ['measurement-context-rng',scene([post(600,400)],[ore(600,400,1001)],'meridian','stronghold')],
 ['frozen-input',scene([post(600,400)],[ore(600,400,1001)])]
 ];}
function runSuite(options={}){
 const source=path.resolve(options.source||process.argv[2]||path.join(__dirname,'../index.html'));
 const html=options.html??fs.readFileSync(source,'utf8');
 // Restore only the immutable packaged source, never a mutant. This keeps all
 // negative controls behavioral instead of accidental source-hash rejections.
 const baseline=options.baseline??(process.argv[3]?fs.readFileSync(path.resolve(process.argv[3]),'utf8'):require('./restore-v293.cjs')(require('./restore-v294-from-v307.cjs')(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'))));
 const results=[],measurements={extracted:{calls:0,baselineConcat:0,candidateConcat:0,fewer:0,equal:0},wholeSource:{calls:0,baselineConcat:0,candidateConcat:0,maps:[...maps],objectives:[...objectives]}};
 function test(name,fn){try{fn();results.push({name,passed:true})}catch(e){results.push({name,passed:false,check:e.check||'unexpected-exception',message:e.message})}}
 const A=extracted(expectedLayoutSource(baseline)),B=extracted(html);
 function compare(a,b,input,kind,expected={}){
  invariant(!a.error,'baseline-function-returns',JSON.stringify(a.error));
  invariant(!b.error,'function-returns-frozen-input',JSON.stringify(b.error));
  invariant(b.unchanged&&a.unchanged,'state-and-input-identities-unchanged');
  invariant(b.identity&&a.identity,'current-ore-object-reference');
  invariant(b.rng===0&&a.rng===0,'layout-consumes-no-rng');
  invariant(b.context&&a.context,'context-restored');
  equal(b.rows,a.rows,'coordinates-labels-and-order');
  equal(b.events,a.events,'identical-measurement-and-context-order');
  equal(b.helpers,a.helpers,'identical-helper-call-order');
  const empty=!input.ores.some(o=>o.amount>0);
  if(empty)invariant(b.count===0,'empty-depleted-zero-concat');
  invariant(b.count<=2,'at-most-two-concat-per-call');
  invariant(b.count<=a.count,'concat-count-never-increases');
  if(expected.concat!==undefined)invariant(b.count===expected.concat,'exact-lazy-concat-branch');
  if(expected.x!==undefined)equal([b.rows[0].x,b.rows[0].y],[expected.x,expected.y],'independent-fallback-coordinates');
  const bucket=measurements[kind];bucket.calls++;bucket.baselineConcat+=a.count;bucket.candidateConcat+=b.count;
  if(kind==='extracted')b.count<a.count?bucket.fewer++:bucket.equal++;
 }
 function check(name,input,mode=0,expected={}){test(name,()=>compare(A(input,mode),B(input,mode),input,'extracted',expected))}
 const selected=options.only?new Set(options.only):null;
 const wants=name=>!selected||selected.has(name);
 for(const[name,input,mode,expected]of sentinelCases())if(wants('sentinel/'+name))check('sentinel/'+name,input,mode,expected);
 if(wants('sentinel/sequential-replacements-and-metrics'))test('sentinel/sequential-replacements-and-metrics',()=>{
  const X=extracted(expectedLayoutSource(baseline)),Y=extracted(html);
  for(let n=0;n<12;n++){const input=scene(n%2?[post(50,50,{owner:1}),post(1000,700,{contested:true})]:[post(600,400)],n%3?[ore(590,400,1001),ore(1100,700)]:[ore(600,400),ore(600,400,1000)],n%4?'meridian':'classic',n%5?'stronghold':'annihilation');compare(X(input,n%10),Y(input,n%10),input,'extracted')}
 });
 // This systematic near-post sweep distinguishes omission of normal, expanded,
 // range and stronghold-marker boxes from unrelated identity/source failures.
 if(wants('sentinel/near-post-candidate-sweep'))test('sentinel/near-post-candidate-sweep',()=>{
  for(const map of ['classic','meridian'])for(const mode of [0,1,7])for(let x=450;x<=750;x+=15)for(let y=250;y<=550;y+=15){const input=scene([post(600,400)],[ore(x,y)],map,'stronghold');compare(A(input,mode),B(input,mode),input,'extracted')}
 });
 if(!options.sentinelsOnly){
  test('source/exact-approved-layout-and-unchanged-helpers',()=>{
   let expected=extract(baseline,'oreLabelLayout');
   const replacements=[['marker.y+90}]:[];for(let o of state.ores)','marker.y+90}]:[];let normalBoxes,expandedBoxes;for(let o of state.ores)'],['boxes=(expanded?postBoxes.concat(rangeBoxes):postBoxes).concat(markerBoxes)','boxes=expanded?(expandedBoxes??=postBoxes.concat(rangeBoxes,markerBoxes)):(normalBoxes??=postBoxes.concat(markerBoxes))']];
   for(const[before,after]of replacements){invariant(expected.split(before).length===2,'unique-approved-layout-edit');expected=expected.replace(before,after)}
   equal(extract(require('./source-delta-to-v302-v307.cjs')(html),'oreLabelLayout'),expected,'exact-approved-layout-function');
   for(const name of ['postCaption','strongholdPost'])equal(extract(html,name),extract(baseline,name),'unchanged-'+name);
  });
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'red-ore-v294-'));
  try{
   const old=path.join(tmp,'v293.html');fs.writeFileSync(old,baseline);
   const fixtures=[];
   for(const map of maps){const g=loadGame(old,{seed:29301});g.element('scenario').value=map;g.element('scenario').dispatchEvent({type:'change'});g.start();fixtures.push({map,state:plain(g.state)})}
   // Re-execute the author's 5,400 input matrix against CURRENT candidate source.
   for(const{map,state:initial}of fixtures)for(const objective of ['annihilation','stronghold'])for(let caption=0;caption<4;caption++)for(const amount of [0,-1,.1,999,1000,1000.1,12000])for(let mode=0;mode<6;mode++){
    const input=plain(initial);input.objective=objective;input.posts.forEach(p=>{p.contested=caption===0;p.controlBlocked=caption===1;p.owner=caption===2?-1:0});input.ores.forEach(o=>o.amount=amount);
    const name=`author-matrix/${map}/${objective}/caption-${caption}/amount-${amount}/metrics-${mode}`;
    check(name+'/natural-layout',input,mode);
    input.posts=input.posts.map((p,i)=>({...p,x:i%2?1200:0,y:i%2?800:0,contested:!p.contested}));input.ores=input.ores.map((o,i)=>({...o,x:i%2?1200:0,y:i%2?800:0,amount:i%2?0:amount}));check(name+'/replacement-boundaries',input,mode);
   }
   for(let mode=0;mode<6;mode++)for(let p=0;p<2;p++)for(let o=0;o<2;o++)check(`author-matrix/empty-overlap/metrics-${mode}/posts-${p}/ores-${o}`,scene(p?[post(600,400),post(600,400,{owner:0})]:[],o?[ore(600,400,1001),ore(600,400,1001)]:[],'meridian','stronghold'),mode);
   // The independently reviewed 75 cases, with unambiguous current names.
   const scenes=[['empty',scene([],[])],['posts-no-ores',scene([post(600,400)],[])],['depleted',scene([post(600,400)],[ore(600,400,0),ore(200,200,-1)])],['no-posts-many',sentinelCases()[2][1]],['caption-mix',sentinelCases()[4][1]],['overlap',scene([post(600,400),post(600,400)],[ore(600,400),ore(600,400)])],['edges',scene([post(0,0),post(1200,800),post(1200,0),post(0,800)],[ore(0,0),ore(1200,800),ore(1200,0),ore(0,800)])],['near-caption',sentinelCases()[5][1]]];
   for(const[name,input]of scenes)for(const mapChoice of ['classic','meridian'])for(let mode=6;mode<10;mode++)check(`independent-matrix/${name}/${mapChoice}/metrics-${mode}`,{...input,mapChoice,objective:'stronghold'},mode);
   for(let n=0;n<8;n++)check('independent-matrix/sequential-replacements-'+n,scene(n%2?[post(50,50,{owner:1}),post(1000,700,{contested:true})]:[post(600,400)],n%3?[ore(590,400,1001),ore(1100,700)]:[ore(600,400),ore(600,400,1000)],'meridian','stronghold'),6+n%4);
   check('independent-matrix/explicit-empty-zero',scene([post(600,400)],[],'meridian','stronghold'),8,{concat:0});
   check('independent-matrix/explicit-normal-one',scene([],[ore(100,100),ore(900,700)]),6,{concat:1});
   check('independent-matrix/explicit-fallback-two',scene([post(600,400)],[ore(600,400),ore(600,400,1000)],'meridian','stronghold'),8,{concat:2,x:16,y:1004});
   // Whole-source checks start via normal setup controls and use natural ticks.
   // No game state injection, real storage, save/load/import/export or browser.
   for(const map of maps)for(const objective of objectives)test(`whole-source/${map}/${objective}/natural-start-ticks-and-render`,()=>{
    const games=[old,source].map(file=>{const g=loadGame(file,{seed:29431});for(const[id,value]of [['scenario',map],['objective',objective]]){g.element(id).value=value;g.element(id).dispatchEvent({type:'change'})}g.start();if(file===old)installExpectedOreLabels(g);invariant(g.state.mapChoice===map&&g.state.objective===objective,'whole-source-requested-map-and-objective');g.run(`${auditSource}\nctx.font='whole-source-font';ctx.fillStyle='#13579b';ctx.globalAlpha=.37;globalThis.__oreOriginal=oreLabelLayout;globalThis.__oreReports=[];oreLabelLayout=function(){const audit=__auditLayout(__oreOriginal);__oreReports.push(audit);return audit.result};for(const key of ['getItem','setItem','removeItem'])localStorage[key]=()=>{throw Error('storage access forbidden during layout/render checks')};`);return g});
    const world=g=>g.run('JSON.stringify({state,uid,selection:[...selection],groups,placement,attackMode,ordinaryCommandMode,appendCommandMode,restartPrompt,simulationRemainder})');
    for(const seconds of [0,.5,2]){
     if(seconds)games.forEach(g=>g.step(seconds));equal(world(games[1]),world(games[0]),'whole-source-natural-world-parity');
     for(const expression of ['oreLabelLayout()','render()','oreLabelLayout()']){
      const audits=games.map(g=>{const before=world(g);g.run('__oreReports=[]');g.run(expression);const rows=plain(g.run('__oreReports'));invariant(rows.length===1,'exactly-one-layout-call-per-render-or-direct-call');equal(world(g),before,'whole-source-layout-render-read-only');return rows[0]});
      compare(audits[0],audits[1],games[0].state,'wholeSource');
     }
    }
   });
  }finally{fs.rmSync(tmp,{recursive:true,force:true})}
 }
 if(!options.sentinelsOnly)test('source/unchanged-bytes-after-all-cases',()=>equal(fs.readFileSync(source,'utf8'),html,'source-bytes-unchanged-during-suite'));
 invariant(new Set(results.map(r=>r.name)).size===results.length,'unique-result-names');
 return{sourceSha256:crypto.createHash('sha256').update(html).digest('hex'),baselineSha256:crypto.createHash('sha256').update(baseline).digest('hex'),passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length,results,measurements,scope:'Current whole-source seeded VM UI starts for all eight maps and five objectives, natural simulation and direct/render layout calls; exact extracted functions with frozen synthetic inputs, 5,400 author-derived cases and 75 independent-review-derived cases. Counts are scoped concat invocations, not allocated bytes, GC, wall time or FPS. Existing VM startup uses isolated mock storage; no browser, real storage, save/load/import/export flows or gameplay-state injection in whole-source cases.'};
}
if(require.main===module){try{const report=runSuite();console.log(JSON.stringify(report,null,2));process.exitCode=report.failed?1:0}catch(e){console.log(JSON.stringify({passed:0,failed:1,results:[{name:'ore-layout-suite-initialization',passed:false,check:e.check||'unexpected-exception',message:e.message}]},null,2));process.exitCode=1}}
module.exports={runSuite,extracted,extract,sentinelCases};
