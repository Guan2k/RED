'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');const source=path.join(__dirname,'../index.html'),html=fs.readFileSync(source,'utf8'),script=path.join(__dirname,'post-selection.cjs');
function run(file){let p=spawnSync(process.execPath,[script,file],{encoding:'utf8',maxBuffer:6*1024*1024});assert.equal(p.error,undefined);assert.equal(p.stderr,'');return{status:p.status,report:JSON.parse(p.stdout)}}let positive=run(source);assert.equal(positive.status,0);assert.equal(positive.report.failed,0);
const controls=[
 ['include radius boundary',"e.type!=='repair'&&dist(e,p)<65):[]","e.type!=='repair'&&dist(e,p)<=65):[]",'strict radius 65'],
 ['include enemy',"return p?state.entities.filter(e=>e.team===0&&e.hp>0", "return p?state.entities.filter(e=>e.hp>0",'matches presence condition enemy'],
 ['include dead',"return p?state.entities.filter(e=>e.team===0&&e.hp>0&&", "return p?state.entities.filter(e=>e.team===0&&",'matches presence condition dead'],
 ['exclude build flag',"return p?state.entities.filter(e=>e.team===0&&e.hp>0&&", "return p?state.entities.filter(e=>e.team===0&&e.hp>0&&!e.build&&",'matches presence condition building flag'],
 ['require own point',"function postSelectionUnits(p){return p?", "function postSelectionUnits(p){return p&&p.owner===0?",'owner independent -1 contested=false'],
 ['select wrong point',"let p=state.posts[i];if(!p)return;let units=postSelectionUnits(p)","let p=state.posts[0];if(!p)return;let units=postSelectionUnits(p)",'button 2 selects its own point via "pointer"'],
 ['clear empty selection',"if(!units.length){postSelectionMessage=", "if(!units.length){selection.clear();postSelectionMessage=",'pending ordinary empty=true'],
 ['retain pending on success',"resetSelectionClicks();selection=new Set(units.map(e=>e.id));placement=null;attackMode=false;drag=null;clearOrdinaryCommand();postSelectionMessage=", "selection=new Set(units.map(e=>e.id));postSelectionMessage=",'pending ordinary empty=false'],
 ['stop selected units',"selection=new Set(units.map(e=>e.id));placement=null;attackMode=false;drag=null;clearOrdinaryCommand();postSelectionMessage=", "selection=new Set(units.map(e=>e.id));for(let e of units)e.hold=true;placement=null;attackMode=false;drag=null;clearOrdinaryCommand();postSelectionMessage=",'owner independent -1 contested=false'],
 ['ignore post identity',"a.post===state.posts[i]&&",'', 'late pointer activation rejects replaced post without refresh'],
 ['ignore canceled token',"||!postSelectionActivationValid(i)",'','late "pointer" canceled by blur'],
 ['disable during pause',"function selectPostTroops(i){if(commandBlocked()", "function selectPostTroops(i){if(state.paused||commandBlocked()",'gate paused']
];const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'red-post-controls-')),results=[];
try{for(const[name,before,after,target]of controls){assert.equal(html.split(before).length-1,1,name+' exact edit');let file=path.join(tmp,name.replaceAll(' ','-')+'.html');fs.writeFileSync(file,html.replace(before,after));let r=run(file),t=r.report.results.find(x=>x.name===target);results.push({name,target,detected:r.status===1&&t?.passed===false&&t.error.startsWith('AssertionError')})}}finally{fs.rmSync(tmp,{recursive:true,force:true})}
console.log(JSON.stringify({passed:results.filter(x=>x.detected).length,failed:results.filter(x=>!x.detected).length,positive:{passed:positive.report.passed,assertions:positive.report.assertions},results},null,2));if(results.some(x=>!x.detected))process.exitCode=1;
