'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const source=path.join(__dirname,'../index.html'),html=fs.readFileSync(source,'utf8'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'red-patrol-neg-')),baseline=path.join(dir,'v280.html');fs.writeFileSync(baseline,require('./restore-v280.cjs')(require('./restore-v281.cjs')(require('./restore-v282.cjs')(html))));
const tests=[
 ['wrong tooltip',"setReadonlyPanelProperty($('patrol'),'title',hint)","setReadonlyPanelProperty($('patrol'),'title','错误提示')",'tooltip matches directly checked visible explanation'],
 ['wrong guard label',"guards?'解除警戒 [P]'","guards?'往返巡逻 [P]'",'exact priority action label'],
 ['ignore patrol priority','active=troops.some(e=>e.patrol)','active=troops.some(e=>e.patrol)&&!troops.some(e=>e.guardArea)','exact priority action label'],
 ['include noncombat units','function updatePatrolActionControl(){let troops=patrolTroops(),active=','function updatePatrolActionControl(){let troops=state.entities.filter(e=>selection.has(e.id)),active=','availability unchanged'],
 ['hide visible explanation',"'hidden',blocked||!troops.length)","'hidden',true)",'conditional visible explanation'],
 ['break accessible association','aria-describedby="patrolActionHint"','aria-describedby="missingPatrolHelp"','accessible explanation association'],
 ['misstate guard start','不会自动开始巡逻','会自动开始巡逻','visible semantic explanation'],
 ['refresh mutates world','function updatePatrolActionControl(){','function updatePatrolActionControl(){state.cash+=1;','refresh has no command/world side effects'],
 ['pause wrongly disables','blocked=commandBlocked(),label=', 'blocked=commandBlocked()||state.paused,label=','availability unchanged']
];
const results=[];try{for(const[name,before,after,expected]of tests){assert.equal(html.split(before).length-1,1,'unique negative anchor '+name);const file=path.join(dir,name.replaceAll(' ','-')+'.html');fs.writeFileSync(file,html.replace(before,after));const p=spawnSync(process.execPath,[path.join(__dirname,'patrol-action-v283.cjs'),file,baseline],{encoding:'utf8',maxBuffer:4e6});if(p.error)throw p.error;assert.notEqual(p.status,0,name);assert.ok(p.stderr.includes(expected),name+' expected '+expected+' got '+p.stderr);results.push({name,detected:true,expected})}console.log(JSON.stringify({passed:results.length,failed:0,results,scope:'Temporary product-source mutants target exact UI semantics and read-only refresh assertions. Exact v280 behavior baseline supplied separately so identity guards do not masquerade as mutation detection. No packaged source modified.'},null,2))}finally{fs.rmSync(dir,{recursive:true,force:true})}
