'use strict';
// Exact v301-only paint projection. Never discard arbitrary colors, paths or methods.
const assert=require('node:assert/strict');
const copy=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const origins=Object.freeze({hq:Object.freeze([-18,-5]),power:Object.freeze([-17,9]),refinery:Object.freeze([-22,9]),factory:Object.freeze([19,1])});
const radii=Object.freeze({hq:40,power:26,refinery:33,factory:36});
const finalBody=Object.freeze({hq:{op:'fillRect',args:[27,-9,7,17],colors:['#a4b49a','#c19c86']},power:{op:'fill',args:[['moveTo',0,-5],['lineTo',8,-5],['lineTo',2,3],['lineTo',8,3],['lineTo',-4,17],['lineTo',-1,7],['lineTo',-7,7],['closePath']],colors:['#d3bd7d','#d3bd7d']},refinery:{op:'fillRect',args:[-16,23,29,7],colors:['#263a30','#44322d']},factory:{op:'fillRect',args:[-22,25,44,4],colors:['#566a59','#8b5d4f']}});
const triangle=[['moveTo',0,0],['lineTo',6,2],['lineTo',0,4],['closePath']];
function cueViews(g,entities='state.entities',{force=false}={}){
 const enabled=force||g.run('vehicleArtPreview');
 if(!enabled)return[];
 // Expected membership and radius are an independent fixed contract, never read
 // from the product's newly added origin/canonical tables.
 return copy(g.run(`(${entities}).map(e=>({id:e.id,type:e.type,team:e.team,x:e.x,y:e.y,r:e.r}))`)).filter(e=>Object.hasOwn(origins,e.type)&&e.r===radii[e.type]);
}
function projectCuePaints(paints,views,{format='commands'}={}){
 assert.ok(['commands','world'].includes(format),'cue projection known recorder format');
 const used=new Set(),occurrences=[];
 for(const v of views){
  assert.ok(Object.hasOwn(origins,v.type)&&[0,1].includes(v.team)&&v.r===radii[v.type]&&[v.x,v.y].every(Number.isFinite),'cue projection canonical descriptor');
  const [ox,oy]=origins[v.type],transforms=[['translate',v.x,v.y],['translate',ox,oy]];
  const rectangle=(x,y,w,h)=>format==='commands'?[x,y,w,h]:[[v.x+ox+x,v.y+oy+y],[v.x+ox+x+w,v.y+oy+y],[v.x+ox+x+w,v.y+oy+y+h],[v.x+ox+x,v.y+oy+y+h]];
  const backing=rectangle(-1,-1,8,6),matches=[];
  for(let i=0;i<paints.length;i++){
   const p=paints[i];if((format==='commands'?p.op:p.kind)==='fillRect'&&same(format==='commands'?p.args:p.shape,backing)&&(format==='commands'?p.style.fillStyle:p.style.color)==='#14201b'&&(format==='world'||same(p.transforms,transforms)))matches.push(i);
  }
  assert.equal(matches.length,1,'cue projection exact unique backing '+v.type);
  const at=matches[0],previous=paints[at-1];assert.ok(previous,'cue projection preceding static body');
  if(format==='commands')assert.deepEqual(previous.transforms,[['translate',v.x,v.y]],'cue projection body transform');
  assert.deepEqual(previous.clips,[],'cue projection body is unclipped');
  // Cues must follow the exact final static-body paint, before mast, barrel,
  // construction mask, production and other dynamic layers. Power's final paint
  // is its bolt polygon, following the dark lower panel (it is not the panel).
  const final=finalBody[v.type],bodyTransforms=[['translate',v.x,v.y]];
  const bodyShape=final.op==='fillRect'?(format==='commands'?final.args:(()=>{const[x,y,w,h]=final.args;return [[v.x+x,v.y+y],[v.x+x+w,v.y+y],[v.x+x+w,v.y+y+h],[v.x+x,v.y+y+h]]})()):final.args.map(([op,...args])=>format==='commands'?{op,args,transforms:copy(bodyTransforms)}:args.length?[op,args[0]+v.x,args[1]+v.y]:[op]);
  assert.equal(format==='commands'?previous.op:previous.kind,final.op,'cue projection exact final body paint kind');
  assert.deepEqual(format==='commands'?previous.args:previous.shape,bodyShape,'cue projection exact final body geometry');
  assert.equal(format==='commands'?previous.style.fillStyle:previous.style.color,final.colors[v.team],'cue projection exact final body color');

  const make=(kind,shape,color)=>{
   const p=copy(previous);if(format==='commands'){p.op=kind;p.args=shape;p.transforms=copy(transforms);p.style.fillStyle=color}else{p.kind=kind;p.shape=shape;p.style.color=color}
   return p;
  };
  const shape=triangle.map(([op,...args])=>format==='commands'?{op,args,transforms:copy(transforms)}:args.length?[op,args[0]+v.x+ox,args[1]+v.y+oy]:[op]);
  const expected=[make('fillRect',backing,'#14201b'),...(v.team?[make('fill',shape,'#e7d9b4')]:[make('fillRect',rectangle(0,0,6,1.5),'#e7d9b4'),make('fillRect',rectangle(0,2.5,6,1.5),'#e7d9b4')])];
  for(let j=0;j<expected.length;j++){assert.ok(!used.has(at+j),'cue projection cannot strip one paint twice');assert.deepEqual(paints[at+j],expected[j],'cue projection exact cue shape/style/transform/order '+v.type);used.add(at+j)}
  occurrences.push({at,view:copy(v),paintCount:expected.length});
 }
 const expectedCount=views.reduce((n,v)=>n+(v.team?2:3),0);assert.equal(used.size,expectedCount,'cue projection exact paint count');
 // A malformed or extra cue cannot silently survive normalization and pass a baseline
 // comparison. Known descriptor counts are mandatory, including zero when preview is OFF.
 const projected=paints.filter((_,i)=>!used.has(i));
 return {paints:copy(projected),occurrences:occurrences.sort((a,b)=>a.at-b.at),removedPaints:used.size};
}
function projectCueEvents(events,projection){
 const out=[],stack=[];let transforms=[],next=0,removedCalls=0;
 const occurrences=projection.occurrences;
 for(let i=0;i<events.length;){
  const event=events[i],entry=occurrences[next],v=entry?.view;
  if(v&&same(event,['save'])&&same(events[i+1],['translate',...origins[v.type]])&&same(transforms,[['translate',v.x,v.y]])){
   const prefix=[['save'],['translate',...origins[v.type]],['fillRect',-1,-1,8,6]],direct=[['beginPath'],...triangle,['fill','current']],tails=v.team?[[['fill','Path2D']],direct,[['fill','Path2D'],...direct]]:[[['fillRect',0,0,6,1.5],['fillRect',0,2.5,6,1.5]]];
   const choices=tails.map(t=>[...prefix,...t,['restore']]);const chosen=choices.find(x=>same(events.slice(i,i+x.length),x));
   assert.ok(chosen,'cue projection exact scoped Canvas method sequence '+v.type);
   i+=chosen.length;removedCalls+=chosen.length;next++;continue;
  }
  out.push(copy(event));
  if(event[0]==='save')stack.push(copy(transforms));else if(event[0]==='restore'){assert.ok(stack.length,'cue projection balanced original event stack');transforms=stack.pop()}else if(['translate','rotate','scale','transform','setTransform'].includes(event[0])){if(event[0]==='setTransform')transforms=[];transforms.push(copy(event))}
  i++;
 }
 assert.equal(next,occurrences.length,'cue projection one exact method scope per cue');assert.equal(stack.length,0,'cue projection all original event saves retained and balanced');
 return {events:out,removedCalls};
}
function projectCues(paints,views,options={}){const result=projectCuePaints(paints,views,options);if(options.events)Object.assign(result,projectCueEvents(options.events,result));return result}
module.exports={origins,triangle,cueViews,projectCuePaints,projectCueEvents,projectCues};
