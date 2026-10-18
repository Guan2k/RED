'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const copy=x=>JSON.parse(JSON.stringify(x));
function record(g,{failFillAt=0,failMarker=false}={}){
 const c=g.element('map').getContext('2d'),events=[],paints=[],stack=[];let current=[],transforms=[],clips=[],dash=[],pathFills=0,markerFills=0,failures=0;
 const keys=['fillStyle','strokeStyle','lineWidth','lineCap','lineJoin','miterLimit','lineDashOffset','font','globalAlpha','globalCompositeOperation','textAlign','textBaseline','imageSmoothingEnabled'];
 Object.assign(c,{fillStyle:'#123456',strokeStyle:'#654321',lineWidth:2,lineCap:'round',lineJoin:'bevel',miterLimit:4,lineDashOffset:1,font:'10px sans-serif',globalAlpha:.8,globalCompositeOperation:'source-over',textAlign:'left',textBaseline:'alphabetic',imageSmoothingEnabled:false});
 const style=()=>({...Object.fromEntries(keys.map(k=>[k,c[k]])),dash:copy(dash)}),paint=(op,args)=>paints.push({op,args:copy(args),style:style(),transforms:copy(transforms),clips:copy(clips)}),event=(op,args=[])=>{events.push([op,...args]);for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),'finite Canvas argument')};
 c.save=()=>{event('save');stack.push({style:style(),transforms:copy(transforms),clips:copy(clips)})};c.restore=()=>{event('restore');const old=stack.pop();assert.ok(old,'balanced restore');for(const k of keys)c[k]=old.style[k];dash=old.style.dash;transforms=old.transforms;clips=old.clips};
 for(const op of ['translate','rotate','scale','transform','setTransform'])c[op]=(...a)=>{event(op,a);if(op==='setTransform')transforms=[];transforms.push([op,...a])};
 c.beginPath=()=>{event('beginPath');current=[]};for(const op of ['moveTo','lineTo','closePath','arc','arcTo','rect','quadraticCurveTo','bezierCurveTo'])c[op]=(...a)=>{event(op,a);current.push({op,args:copy(a),transforms:copy(transforms)})};
 c.fill=p=>{event('fill',[p?'Path2D':'current']);if(p){pathFills++;const marker=JSON.stringify(p.ops)===JSON.stringify([['moveTo',0,0],['lineTo',6,2],['lineTo',0,4],['closePath']]);if(marker)markerFills++;if(pathFills===failFillAt||(failMarker&&marker&&markerFills===1)){failures++;throw Error('injected cached fill failure')}}paint('fill',p?p.ops.map(([op,...args])=>({op,args,transforms:copy(transforms)})):current)};
 c.stroke=()=>{event('stroke');paint('stroke',current)};c.clip=()=>{event('clip');clips.push(copy(current))};c.setLineDash=a=>{event('setLineDash',a);dash=copy(a)};
 for(const op of ['fillRect','strokeRect','fillText','strokeText','clearRect'])c[op]=(...a)=>{event(op,a);paint(op,a)};
 c.measureText=s=>{event('measureText',[s]);return {width:String(s).length*7}};
 const implemented=new Set(Object.keys(c).filter(k=>typeof c[k]==='function'));
 for(const name of new Set([...fs.readFileSync(g.source,'utf8').matchAll(/ctx\.(\w+)\s*\(/g)].map(m=>m[1])))assert.ok(implemented.has(name),'unrecorded source Canvas method '+name);
 return{c,events,paints,stack,get pathFills(){return pathFills},get markerFills(){return markerFills},get failures(){return failures},get current(){return copy(current)},reset(){events.length=0;paints.length=0},snapshot:()=>copy({style:style(),transforms,clips,stack}),get calls(){return events.length},counts(){const n={};for(const e of events)n[e[0]]=(n[e[0]]||0)+1;return n}};
}

module.exports={record};
