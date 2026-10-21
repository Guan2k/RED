'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {runSuite,adaptHistoricalHealthPaints}=require('./health-edge-v317.cjs');
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),baseline=require('./restore-v296-from-v317.cjs')(source),results=[];
const positive=runSuite({sourceText:source,baselineText:baseline});assert.equal(positive.failed,0,'unmodified complete health suite must pass before negative controls');assert.equal(positive.passed,2952,'full inherited health suite and threshold neighbors retained');
const separator="rect(e.x-e.r-1,healthY-1,e.r*2+2,6,'#0b171c');",bg="rect(e.x-e.r,healthY,e.r*2,4,'#34433e');",fg="rect(e.x-e.r,healthY,e.r*2*Math.max(0,e.hp/e.max),4,e.hp/e.max<.3?'#ffbc78':e.team?'#e78f6a':'#a3db81')";
const mutants=[
 ['remove-clamp','Math.max(0,e.y-e.r-12)','e.y-e.r-12','natural pointer route retains four-pixel bars'],
 ['wrong-min','Math.max(0,e.y-e.r-12)','Math.min(0,e.y-e.r-12)','natural pointer route retains four-pixel bars'],
 ['only-background',fg,fg.replace('healthY','e.y-e.r-12'),'natural pointer route retains four-pixel bars'],
 ['changed-width',bg,bg.replace('e.r*2,','e.r*2+1,'),'natural pointer route emits exact health pair'],
 ['changed-predicate','if(e.hp<e.max||selection.has(e.id)){let healthY','if(e.hp<e.max){let healthY','natural pointer route emits exact health pair'],
 ['unnecessary-inset','Math.max(0,e.y-e.r-12)','Math.max(1,e.y-e.r-12)','natural pointer route retains four-pixel bars'],
 ['changed-world','let healthY=Math.max(0,e.y-e.r-12);','let healthY=Math.max(0,e.y-e.r-12);state.cash++;','natural route world/input equality'],
 ['rng','let healthY=Math.max(0,e.y-e.r-12);','let healthY=Math.max(0,e.y-e.r-12);Math.random();','unexpected RNG'],
 ['reordered-pair',bg+fg,fg+';'+bg.slice(0,-1),'health branch exact paint semantics'],
 ['changed-ratio',fg,fg.replace('Math.max(0,e.hp/e.max)','Math.min(1,Math.max(0,e.hp/e.max))'),'health branch exact paint semantics'],
 ['missing-separator',separator,'','natural pointer route exact dark separator'],
 ['separator-wrong-y',separator,separator.replace('healthY-1','healthY'),'natural pointer route exact dark separator'],
 ['separator-wrong-width',separator,separator.replace('e.r*2+2','e.r*2+3'),'natural pointer route exact dark separator'],
 ['separator-wrong-height',separator,separator.replace(',6,',',5,'),'natural pointer route exact dark separator'],
 ['separator-wrong-color',separator,separator.replace('#0b171c','#172f36'),'natural pointer route exact dark separator'],
 ['separator-wrong-order',separator+bg,bg+separator,'natural pointer route preserves adjacent health pair'],
 ['background-wrong-color',bg,bg.replace('#34433e','#16231b'),'natural pointer route emits exact health pair'],
 ['critical-color-missing',fg,fg.replace("e.hp/e.max<.3?'#ffbc78':",''),'health branch exact paint semantics'],
 ['critical-wrong-color',fg,fg.replace('#ffbc78','#ffbc79'),'health branch exact paint semantics'],
 ['critical-inclusive-threshold',fg,fg.replace('<.3?','<=.3?'),'health branch exact paint semantics'],
 ['critical-expanded-threshold',fg,fg.replace('<.3?','<.31?'),'health branch exact paint semantics'],
 ['critical-reduced-threshold',fg,fg.replace('<.3?','<.29?'),'health branch exact paint semantics'],
 ['critical-enemy-exemption',fg,fg.replace("e.hp/e.max<.3?'#ffbc78':e.team?'#e78f6a':'#a3db81'","e.team?'#e78f6a':e.hp/e.max<.3?'#ffbc78':'#a3db81'"),'health branch exact paint semantics'],
 ['critical-applied-to-healthy',fg,fg.replace("e.hp/e.max<.3?'#ffbc78':e.team?'#e78f6a':'#a3db81'","'#ffbc78'"),'natural pointer route emits exact health pair']
];
for(const[name,before,after,message]of mutants){
 assert.equal(source.split(before).length-1,1,'single product mutation anchor: '+name);
 try{runSuite({sourceText:source.replace(before,after),baselineText:baseline,identity:false});throw Error('mutant survived')}
 catch(e){const accepted=(e.name==='AssertionError'||name==='rng'&&e.name==='Error')&&e.message.includes(message);results.push({name,passed:accepted,diagnostic:e.message.split('\n')[0],errorName:e.name})}
}
// Oracle-only controls ensure expected-side adaptation is narrow: invalid
// historical anchors fail, unrelated differences remain visible, input is not
// mutated, empty descriptors are identity, and repeated descriptors cannot pass.
const copy=x=>JSON.parse(JSON.stringify(x));
const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const entity={x:100,y:25,r:13,hp:20,max:100,team:0};
const style={alpha:1,composite:'source-over',shadow:['rgba(0, 0, 0, 0)',0,0,0]};
const paint=(shape,color)=>({kind:'fillRect',shape,style:{...copy(style),color},clips:[]});
const historical=[paint(rect(0,0,12,12),'#unrelated'),paint(rect(87,0,26,4),'#16231b'),paint(rect(87,0,5.2,4),'#a3db81'),paint(rect(33,44,55,66),'#unrelated-tail')],before=copy(historical),reference=adaptHistoricalHealthPaints(historical,[entity]).paints;
assert.deepEqual(historical,before,'oracle keeps original paints immutable');assert.deepEqual(adaptHistoricalHealthPaints(historical,[]).paints,historical,'oracle without descriptors changes nothing');assert.equal(reference.length,historical.length+1,'oracle adds exactly one reviewed separator');
let oracleControls=3;
for(const[name,mutate]of[
 ['background-x',p=>p[1].shape[0][0]++],['background-y',p=>p[1].shape[0][1]++],['background-width',p=>p[1].shape[1][0]++],['background-height',p=>p[1].shape[2][1]++],['background-color',p=>p[1].style.color='#000'],['background-clip',p=>p[1].clips=[[]]],
 ['fill-x',p=>p[2].shape[0][0]++],['fill-y',p=>p[2].shape[0][1]++],['fill-width',p=>p[2].shape[1][0]++],['fill-height',p=>p[2].shape[2][1]++],['fill-color',p=>p[2].style.color='#000'],['fill-clip',p=>p[2].clips=[[]]],
 ['reordered-pair',p=>[p[1],p[2]]=[p[2],p[1]]],['duplicate-pair',p=>p.push(copy(p[1]),copy(p[2]))]
]){const altered=copy(historical);mutate(altered);assert.throws(()=>adaptHistoricalHealthPaints(altered,[entity]),e=>e.name==='AssertionError'&&e.message.startsWith('health oracle unique entity-derived adjacent historical pair'),'oracle rejects '+name);oracleControls++}
for(const[name,mutate]of[
 ['background-alpha',p=>p[1].style.alpha=.4],['fill-alpha',p=>p[2].style.alpha=.4],['background-shadow',p=>p[1].style.shadow[1]=8],['fill-composite',p=>p[2].style.composite='multiply'],['extra-style',p=>p[2].style.unexpected=true],['unrelated-paint',p=>p[0].style.color='#wrong'],['extra-paint',p=>p.push(copy(p[0]))]
]){const altered=copy(historical);mutate(altered);assert.notDeepEqual(adaptHistoricalHealthPaints(altered,[entity]).paints,reference,'oracle preserves unapproved '+name);oracleControls++}
assert.throws(()=>adaptHistoricalHealthPaints(historical,[entity,entity]),e=>e.name==='AssertionError'&&e.message.startsWith('health oracle cannot adapt one paint twice'));oracleControls++;
assert.throws(()=>adaptHistoricalHealthPaints(reference,[entity]),e=>e.name==='AssertionError'&&e.message.startsWith('health oracle unique entity-derived adjacent historical pair'));oracleControls++;
const report={passed:results.filter(x=>x.passed).length+oracleControls,failed:results.filter(x=>!x.passed).length,productMutants:results.length,oracleControls,results,scope:'All ten inherited behavioral mutants plus fourteen separator/color/threshold mutants; exact named assertion diagnostics required. Twenty-six narrow expected-side oracle checks. Historical product and verification files unchanged.'};console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
