'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'red-group-add-negative-')),file=path.join(dir,'index.html');
function run(text){fs.writeFileSync(file,text);const p=spawnSync(process.execPath,[path.join(__dirname,'control-group-add.cjs'),file,hash(text)],{encoding:'utf8',maxBuffer:8*1024*1024});if(p.error)throw p.error;return{status:p.status,report:JSON.parse(p.stdout)}}
const action={test:'add preserves old members and appends entity order group 0',stage:'action',invariant:'exact_group_and_log_delta'};
const mutants=[
 {name:'replace instead of add',before:'groups[i]=view.ids;tell(',after:'groups[i]=view.added;tell(',...action},
 {name:'reverse retained and appended ordering',before:'groups[i]=view.ids;tell(',after:'groups[i]=view.ids.slice().reverse();tell(',...action},
 {name:'allow selected enemy vehicles',before:'selection.has(e.id)&&e.team===0&&e.hp>0&&defs[e.type]?.speed&&!seen.has(e.id)',after:'selection.has(e.id)&&e.hp>0&&defs[e.type]?.speed&&!seen.has(e.id)',test:'mixed invalid selection appends only eligible friendly vehicles',stage:'action',invariant:'exact_group_and_log_delta'},
 {name:'allow selected dead vehicles',before:'selection.has(e.id)&&e.team===0&&e.hp>0&&defs[e.type]?.speed&&!seen.has(e.id)',after:'selection.has(e.id)&&e.team===0&&defs[e.type]?.speed&&!seen.has(e.id)',test:'mixed invalid selection appends only eligible friendly vehicles',stage:'action',invariant:'exact_group_and_log_delta'},
 {name:'retain old building member',before:'controlGroupMembers(i).filter(e=>defs[e.type]?.speed)',after:'controlGroupMembers(i)',test:'successful add normalizes dead missing enemy building and duplicate ids',stage:'action',invariant:'exact_group_and_log_delta'},
 {name:'normalize and log on zero add',before:'if(!view||!view.added.length)return;groups[i]=view.ids',after:'if(!view)return;groups[i]=view.ids',test:'zero additions leaves invalid ids untouched []',stage:'action',invariant:'exact_noop'},
 {name:'ignore terminal command gate',before:'function addSelectionToControlGroup(i){if(commandBlocked())return;',after:'function addSelectionToControlGroup(i){',test:'blocked lifecycle state.result="测试结束"',stage:'action',invariant:'exact_noop'},
 {name:'clear current selection',before:'groups[i]=view.ids;tell(',after:'groups[i]=view.ids;selection.clear();tell(',...action},
 {name:'clear pending map mode',before:'groups[i]=view.ids;tell(',after:'groups[i]=view.ids;clearOrdinaryCommand();tell(',test:'pending input preserved armAppendCommand()',stage:'action',invariant:'exact_group_and_log_delta'},
 {name:'incorrect added count receipt',before:"' 已加入 '+view.added.length+' 辆车辆",after:"' 已加入 '+(view.added.length+1)+' 辆车辆",...action},
 {name:'incorrect displayed new count',before:'count=view?.added.length||0',after:'count=(view?.added.length||0)+1',test:'add preserves old members and appends entity order group 0',stage:'render',invariant:'new_count'},
 {name:'repeated Enter no longer suppressed',before:"$('addControlGroup'+i).onkeydown=e=>{if(e.key==='Enter'&&e.repeat&&!e.isComposing&&e.keyCode!==229)",after:"$('addControlGroup'+i).onkeydown=e=>{if(e.key==='Enter'&&false&&!e.isComposing&&e.keyCode!==229)",test:'focused button keyboard "Enter" repeat true',stage:'keyboard',invariant:'repeat_enter_suppressed'},
 {name:'replace selection identity invisibly',before:'groups[i]=view.ids;tell(',after:'groups[i]=view.ids;selection=new Set(selection);tell(',test:action.test,stage:'action',invariant:'reference_identity_preserved'}
];
try{const healthy=run(html);assert.equal(healthy.status,0);assert.equal(healthy.report.failed,0);assert.equal(healthy.report.passed,41);const results=[];
 for(const m of mutants){assert.equal(html.split(m.before).length-1,1,m.name+' exact boundary');const baseline=healthy.report.results.find(x=>x.name===m.test);assert.equal(baseline?.passed,true,m.name+' healthy target');const r=run(html.replace(m.before,m.after));assert.equal(r.status,1,m.name);const failed=r.report.results.find(x=>x.name===m.test);assert.equal(failed?.passed,false,m.name);assert.deepEqual(failed.failure,{stage:m.stage,invariant:m.invariant,code:'ERR_ASSERTION'},m.name);results.push({name:m.name,expectedTest:m.test,stage:m.stage,invariant:m.invariant,detected:true})}
 console.log(JSON.stringify({passed:results.length,failed:0,healthyPassed:healthy.report.passed,results,scope:'Healthy named cases plus exact phase/invariant ERR_ASSERTION mutation controls; synthetic VM only, no native event or persistence execution.'},null,2));
}finally{fs.rmSync(dir,{recursive:true,force:true})}
