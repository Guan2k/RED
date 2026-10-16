'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'red-damaged-negative-'));
try{
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),file=path.join(dir,'index.html');
 function run(text){fs.writeFileSync(file,text);const p=spawnSync(process.execPath,[path.join(__dirname,'all-damaged.cjs'),file],{encoding:'utf8',maxBuffer:16*1024*1024});if(p.error)throw p.error;assert.equal(p.status,1);return JSON.parse(p.stdout)}
 const baseline=run(require('./restore-v251.cjs')(require('./restore-v252.cjs')(require('./restore-v253.cjs')(html))));assert.equal(baseline.failed,25);assert.equal(baseline.passed,0);assert.equal(baseline.sourceSha256,'705b06add6e12d677f1472cb84cc29ad7a157650b22d692764fa170bd5ceeaf4');
 const cases=[
  ['light injuries accidentally omitted','function allDamagedCombatUnits(){return state.entities.filter(e=>canSetFirePriority(e)&&e.hp<e.max)}','function allDamagedCombatUnits(){return state.entities.filter(e=>canSetFirePriority(e)&&e.hp<=e.max*.5)}','button replaces current selection with all three damaged combat types false'],
  ['phase guard removed','function selectAllDamagedCombat(){if(commandBlocked())return;','function selectAllDamagedCombat(){','blocked phase disables button and direct handler is inert restartPrompt=true'],
  ['eligibility ignores team and type','function allDamagedCombatUnits(){return state.entities.filter(e=>canSetFirePriority(e)&&e.hp<e.max)}','function allDamagedCombatUnits(){return state.entities.filter(e=>e.hp>0&&e.hp<e.max)}','excludes ineligible harvester e.hp=1']
 ];
 const mutations=[];for(const [label,before,after,expected]of cases){assert.equal(html.split(before).length-1,1);const r=run(html.replace(before,after));assert.ok(r.results.some(x=>x.name===expected&&x.status==='fail'));mutations.push({label,failed:r.failed,expectedFailure:expected})}
 console.log(JSON.stringify({passed:4,failed:0,evidence:{baselineSha256:baseline.sourceSha256,missingFeatureFailures:24,boundaryFailures:1,mutations},scope:'Exact baseline plus deliberately broken candidate controls; simulated DOM.'},null,2));
}finally{fs.rmSync(dir,{recursive:true,force:true})}
