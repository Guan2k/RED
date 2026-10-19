'use strict';
// Expected historical stream only. Validate an entire old ore base + all eight
// ordered blocks + its adjacent label, then omit only the reviewed suffix.
// Candidate streams are never filtered. Every unrelated paint/method survives.
const assert=require('node:assert/strict');
const copy=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const count=amount=>amount<=0?0:amount<=1500?1:amount<=4500?4:8;
function oreViews(g){return copy(g.run('state.ores.filter(o=>o.amount>0).map(o=>({x:o.x,y:o.y,amount:o.amount}))'))}
function projectOreDensity(paints,views,{format='commands',events}={}){
 assert.ok(['commands','world'].includes(format),'ore projection known recorder format');
 const removed=new Set(),occurrences=[];let last=-1;
 const kind=p=>format==='commands'?p.op:p.kind,shape=p=>format==='commands'?p.args:p.shape,color=p=>format==='commands'?p.style.fillStyle:p.style.color;
 const rectangle=(x,y,w,h)=>format==='commands'?[x,y,w,h]:[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
 for(const v of views){
  assert.ok([v.x,v.y,v.amount].every(Number.isFinite)&&v.amount>0,'ore projection finite positive descriptor');
  const baseShape=format==='commands'?[{op:'arc',args:[v.x,v.y,33,0,Math.PI*2],transforms:[]}]:[['arc',v.x,v.y,33,0,Math.PI*2,false,1,0,0,1]];
  const anchors=paints.flatMap((p,i)=>kind(p)==='fill'&&same(shape(p),baseShape)&&color(p)==='#746544'?[i]:[]);
  assert.equal(anchors.length,1,'ore projection exact unique base');const at=anchors[0],base=paints[at];
  assert.ok(at>last,'ore projection descriptors preserve ore order');last=at;
  assert.deepEqual(base.clips,[],'ore projection base unclipped');if(format==='commands')assert.deepEqual(base.transforms,[],'ore projection base untransformed');
  const blocks=[];
  for(let i=0;i<8;i++){
   const args=[v.x+Math.cos(i*2.4)*22-4,v.y+Math.sin(i*2.4)*21-5,9,12],expected=copy(base);
   if(format==='commands'){expected.op='fillRect';expected.args=args;expected.style.fillStyle=i%2?'#c6b96d':'#e5d183'}else{expected.kind='fillRect';expected.shape=rectangle(...args);expected.style.color=i%2?'#c6b96d':'#e5d183'}
   assert.deepEqual(paints[at+1+i],expected,'ore projection exact ordered block '+i);blocks.push(args);
   if(i>=count(v.amount)){assert.ok(!removed.has(at+1+i),'ore projection cannot omit twice');removed.add(at+1+i)}
  }
  const label=paints[at+9],labelArgs=label&&shape(label);
  assert.ok(label&&kind(label)==='fillText'&&labelArgs.length===3&&labelArgs[0]==='矿 '+Math.ceil(v.amount/1000)+'k'&&labelArgs.slice(1).every(Number.isFinite),'ore projection exact adjacent label');
  assert.equal(color(label),'#e2d692','ore projection label color');assert.equal(label.style.font,'11px system-ui','ore projection label font');
  assert.deepEqual(label.clips,[],'ore projection label unclipped');if(format==='commands')assert.deepEqual(label.transforms,[],'ore projection label untransformed');
  occurrences.push({at,view:copy(v),count:count(v.amount),blocks,label:copy(labelArgs)});
 }
 const result={paints:copy(paints.filter((_,i)=>!removed.has(i))),removedPaints:removed.size,occurrences};
 assert.equal(result.removedPaints,views.reduce((n,v)=>n+8-count(v.amount),0),'ore projection exact suffix count');
 if(events!==undefined){
  assert.equal(format,'commands','ore projection events require command recorder');const drop=new Set();let previous=-1;
  for(const o of occurrences){
   const sequence=[['beginPath'],['arc',o.view.x,o.view.y,33,0,Math.PI*2],['fill','current'],...o.blocks.map(a=>['fillRect',...a]),['fillText',...o.label]];
   const anchors=events.flatMap((e,i)=>same(events.slice(i,i+sequence.length),sequence)?[i]:[]);
   assert.equal(anchors.length,1,'ore projection exact complete Canvas sequence');const at=anchors[0];assert.ok(at>previous,'ore projection method ore order');previous=at;
   for(let i=o.count;i<8;i++){assert.ok(!drop.has(at+3+i),'ore projection method omitted once');drop.add(at+3+i)}
  }
  assert.equal(drop.size,removed.size,'ore projection paint and method suffix counts match');result.events=copy(events.filter((_,i)=>!drop.has(i)));result.removedCalls=drop.size;
 }
 return result;
}
module.exports=Object.freeze({count,oreViews,projectOreDensity});
