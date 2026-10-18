'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {cueViews,projectCues}=require('../building-cue-normalization-v301.cjs');
const {record}=require('./recorder.cjs');
const {loadGame}=require('../visual-independent-v294/no-persistence-vm.cjs');
const {mockPath}=require('../building-recorder-v295.cjs');
const h=require('../render-preview-v301.cjs');
const copy=x=>JSON.parse(JSON.stringify(x));
function run(source){
 const results=[];
 for(const format of ['commands','world'])for(const team of [0,1]){
  const g=format==='commands'?loadGame(source,{path2D:mockPath().P}).start():h.game(fs.readFileSync(source,'utf8')).start();
  const r=format==='commands'?record(g):g.recorder;
  g.run(`initializeBuildingArtPaths();globalThis.buildingFixture={id:999,type:'power',team:${team},x:125,y:240,r:26,angle:.7,build:2,hp:70,max:100};state.entities=[buildingFixture];state.queue=[]`);
  r.reset();g.run('drawBuildingPreview(buildingFixture)');
  const views=cueViews(g,'[buildingFixture]',{force:true}),paints=copy(r.paints),options={format,...(format==='commands'?{events:copy(r.events)}:{})};
  const normalized=projectCues(paints,views,options),at=normalized.occurrences[0].at,key=format==='commands'?'args':'shape',color=format==='commands'?'fillStyle':'color';
  assert.equal(normalized.removedPaints,team?2:3);assert.deepEqual(paints,r.paints,'projection never mutates candidate paint input');
  let rejected=0;
  for(const [name,mutate] of [
   ['backing geometry',p=>p[at][key][0]=format==='commands'?999:[999,999]],
   ['backing color',p=>p[at].style[color]='#bad'],
   ['backing alpha',p=>p[at].style[format==='commands'?'globalAlpha':'alpha']=.123],
   ['backing unknown field',p=>p[at].unexpected=true],
   ['backing clip',p=>p[at].clips.push([])],
   ['glyph geometry',p=>p[at+1][key]=[]],
   ['glyph color',p=>p[at+1].style[color]='#bad'],
   ['glyph style',p=>p[at+1].style.unexpected=true],
   ['glyph order',p=>[p[at],p[at+1]]=[p[at+1],p[at]]],
   ['missing glyph',p=>p.splice(at+1,1)],
   ['duplicate backing',p=>p.push(copy(p[at]))],
   ['entire cue moved before static body',p=>{const cue=p.splice(at,team?2:3);p.splice(1,0,...cue)}],
   ['entire cue moved after dynamic layers',p=>{const cue=p.splice(at,team?2:3);p.push(...cue)}],
   ...(format==='commands'?[['backing transform',p=>p[at].transforms[1][1]++],['glyph path transform',p=>{if(team)p[at+1].args[0].transforms[1][2]++;else p[at+1].transforms[1][2]++}]]:[])
  ]){
   const changed=copy(paints);mutate(changed);assert.throws(()=>projectCues(changed,views,options),e=>e.name==='AssertionError'&&e.code==='ERR_ASSERTION'&&e.message.startsWith('cue projection'),'reject '+name);rejected++;
  }
  assert.throws(()=>projectCues(paints,[...views,...views],options),e=>e.name==='AssertionError'&&e.message.startsWith('cue projection cannot strip'),'reject duplicate descriptors');rejected++;
  const extra=copy(paints);extra.push(copy(paints[0]));const visible=projectCues(extra,views,options).paints;
  assert.equal(visible.length,normalized.paints.length+1,'unrelated extra paint remains visible');assert.deepEqual(visible.at(-1),paints[0]);
  const altered=copy(paints);altered[0].style[color]='#bad';assert.notDeepEqual(projectCues(altered,views,options).paints,normalized.paints,'unrelated paint style survives projection');
  const reordered=copy(paints);assert.ok(at>2,'two preceding non-cue paints exist');[reordered[0],reordered[1]]=[reordered[1],reordered[0]];assert.notDeepEqual(projectCues(reordered,views,options).paints,normalized.paints,'unrelated paint order remains observable');
  assert.deepEqual(projectCues(paints,[],{format}).paints,paints,'zero descriptors never broad-filter paint');
  if(format==='commands'){
   const events=copy(r.events),start=events.findIndex((e,i)=>JSON.stringify(e)==='["save"]'&&JSON.stringify(events[i+1])==='["translate",-17,9]');assert.ok(start>=0);
   for(const [name,mutate] of [
    ['extra current-path method',e=>e.splice(start+3,0,['beginPath'])],
    ['wrong glyph path',e=>e.splice(start+3,0,['moveTo',999,999])],
    ['missing scoped restore',e=>e.splice(start+(team?4:5),1)],
    ['extra saved context',e=>e.splice(start+3,0,['save'])],
    ['wrong local translation',e=>e[start+1][1]++]]){
    const changed=copy(events);mutate(changed);assert.throws(()=>projectCues(paints,views,{format,events:changed}),e=>e.name==='AssertionError'&&e.code==='ERR_ASSERTION'&&e.message.startsWith('cue projection'),'reject method mutation '+name);rejected++;
   }
   const changed=copy(events);changed.unshift(['measureText','unrelated']);const remaining=projectCues(paints,views,{format,events:changed}).events;assert.deepEqual(remaining[0],['measureText','unrelated'],'unrelated Canvas method retained');assert.equal(remaining.length,normalized.events.length+1);assert.notDeepEqual(remaining,normalized.events,'an unrelated extra Canvas method fails exact non-cue event parity');
   const reordered=copy(events),first=reordered.findIndex(e=>e[0]==='fillRect'),second=reordered.findIndex((e,i)=>i>first&&e[0]==='fillRect');assert.ok(first>=0&&second>=0&&second<start);[reordered[first],reordered[second]]=[reordered[second],reordered[first]];assert.notDeepEqual(projectCues(paints,views,{format,events:reordered}).events,normalized.events,'unrelated Canvas method order remains observable');
  }
  results.push({format,team,rejectedMalformedCueCases:rejected,nonCueChangesRetained:true});
 }
 const original=fs.readFileSync(source,'utf8');
 for(const [name,before,after] of [
  ['missing entire cue call','  drawBuildingTeamCue(e.type,e.team);\n',''],
  ['missing origin type','power:Object.freeze([-17,9]),',''],
  ['canonical radius changed','buildingArtCanonicalRadius=Object.freeze({hq:40,power:26,','buildingArtCanonicalRadius=Object.freeze({hq:40,power:27,']
 ]){
  assert.equal(original.split(before).length-1,1,'unique cue contract mutation anchor');
  const g=h.game(original.replace(before,after)).start();g.run("state.entities=[];create('power',1,125,240)");h.toggle(g,true);const paints=h.frame(g),views=cueViews(g);
  assert.equal(views.length,1,'independent expected cue survives mutated product origin/radius table');
  assert.throws(()=>projectCues(paints,views,{format:'world'}),e=>e.name==='AssertionError'&&e.code==='ERR_ASSERTION'&&e.message.startsWith('cue projection exact unique backing'),'missing complete cue is rejected');
  results.push({name,rejectedBy:'independent exact cue backing count',passed:true});
 }
 {
  const before='  drawBuildingStaticBody(e.type,e.team);\n  drawBuildingTeamCue(e.type,e.team);';
  assert.equal(original.split(before).length-1,1);
  const g=h.game(original.replace(before,'  drawBuildingTeamCue(e.type,e.team);\n  drawBuildingStaticBody(e.type,e.team);')).start();g.run("state.entities=[];create('power',1,125,240)");h.toggle(g,true);
  assert.throws(()=>projectCues(h.frame(g),cueViews(g),{format:'world'}),e=>e.name==='AssertionError'&&e.code==='ERR_ASSERTION'&&e.message.startsWith('cue projection exact final body'),'actual whole cue source order mutation rejected');
  results.push({name:'actual cue helper moved before static body',rejectedBy:'independent exact final static-body anchor',passed:true});
 }
 return results;
}
module.exports={run};
