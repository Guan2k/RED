'use strict';
// Static-only briefing addition; whole-source VM checks are not native-browser QA.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {loadGame}=require('./vm-environment.cjs');
const source=path.resolve(process.argv[2]||path.join(__dirname,'../index.html'));
const html=fs.readFileSync(source,'utf8');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const baselineSha='b256810fe285c02bedf0ec252e223c0e67d727912cb5721d07dbae24424c4c9d';
const ids=['switchbackReinforcementHint','switchbackProductionHint','switchbackRepairHint','switchbackHoldHint','switchbackEvidenceHint'];
const clauses={
 switchbackReinforcementHint:['先补维修车、坦克、坦克','实际进圈与争夺状态'],
 switchbackProductionHint:['先设“循环补单保留：300”','目标不限、单订单','每单正常付费','不锁住资金','手动购买、建造和自动维修仍可花钱','关闭循环也不取消已付订单'],
 switchbackRepairHint:['只选维修车','普通指令点选','己方坦克','维修车跟随','不要用攻击移动代替跟随','维修开关、距离、冷却及资金限制','目标损失后需重新安排'],
 switchbackHoldHint:['先让增援进入据点，再撤走旧守军','全部离圈使驻守归零','单选或框选待补位坦克','保留圈内守军原命令','会选中维修车','仍含旧守军，不是只选增援','仅选坦克','落点和追击离圈','重新占领并重新累计驻守','不保证夺回或获胜'],
 switchbackEvidenceHint:['每5游戏秒一次决策批次','一次批次含多个操作','不是每5秒只点一次','不是实机试玩或必胜保证','不会暂停或代你下令']
};
let checks=0;const check=(v,label)=>{assert.ok(v,label);checks++};
function inspect(raw){
 const section=raw.match(/<section id="quickSwitchbackBrief">([\s\S]*?)<\/section>/)?.[1];
 assert.ok(section,'existing briefing');
 let restored=raw;
 for(const id of ids){
  const regex=new RegExp('<li id="'+id+'">([\\s\\S]*?)<\\/li>','g'),matches=[...raw.matchAll(regex)];
  assert.equal(matches.length,1,'unique '+id);assert.ok(section.includes(matches[0][0]),'inside original briefing '+id);
  assert.ok(!/<(?:button|input|select|textarea|a|details|script)\b|\bon\w+=|\btabindex=/i.test(matches[0][1]),'text only '+id);
  for(const clause of clauses[id])assert.ok(matches[0][1].includes(clause),'required '+clause);
  restored=restored.replace(matches[0][0],'');
 }
 // Only the reviewed release-display bump may accompany these five list items.
 restored=restored.replace('ORIGINAL RTS / v0.318','ORIGINAL RTS / v0.317');
 assert.equal(sha(restored),baselineSha,'removing five notes restores exact published v317 artifact');
 return restored;
}
const restored=inspect(html);checks++;
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'red-guidance-v318-'));
try{
 const baseline=path.join(temp,'baseline.html');fs.writeFileSync(baseline,restored);
 const a=loadGame(source,{seed:29301}),b=loadGame(baseline,{seed:29301});
 const snapshot=g=>g.run('JSON.stringify({state,uid,selection:[...selection],groups,placement,attackMode,ordinaryCommandMode,appendCommandMode,restartPrompt,resumeAfterCancel,simulationRemainder,last,drag,battleAlerts,objectiveAlert,objectiveAlertSeen,economyAlert,economyAlertSeen,finishedBattleNarrative})');
 const parity=label=>{assert.equal(snapshot(a),snapshot(b),label);checks++};
 const tips=a.element('quickMissionTips'),brief=a.element('quickSwitchbackBrief');
 check(tips.getAttribute('open')===null,'default collapsed');
 for(const id of ids){const node=a.element(id);check(node.tagName==='LI'&&brief.contains(node),'native list note '+id);check(Object.keys(node.listeners).length===0,'no listeners '+id)}
 check(!a.elements.some(n=>ids.some(id=>a.element(id).contains(n))&&['BUTTON','INPUT','SELECT','TEXTAREA'].includes(n.tagName)),'no new controls');
 const legacyIds=b.elements.filter(n=>n.id).map(n=>n.id);
 assert.deepEqual(a.elements.filter(n=>n.id&&!ids.includes(n.id)).map(n=>n.id),legacyIds,'original ID order unchanged');checks++;
 const toggle=label=>{const before=snapshot(a);for(let i=0;i<3;i++){tips.open=true;tips.dispatchEvent({type:'toggle'});a.run('updateUI()');tips.open=false;tips.dispatchEvent({type:'toggle'});a.run('updateUI()')}assert.equal(snapshot(a),before,'read-only open/close '+label);checks++;parity(label)};
 parity('initial world');toggle('before start');
 for(const g of[a,b]){g.click('quickSwitchback');g.start()}
 parity('same preset start');toggle('running');
 for(const g of[a,b])g.step(.25);parity('same short simulation');
 for(const g of[a,b])g.click('pause');check(a.state.paused,'paused state');toggle('paused');
 for(const g of[a,b])g.click('pause');parity('resume unchanged');
 // All mutations are disposable and must fail the exact-source/content fence.
 const mutations=[
 ['missing repair warning',html.replace('不要用攻击移动代替跟随','可以用攻击移动代替跟随')],
 ['missing reset warning',html.replace('重新占领并重新累计驻守','立即恢复旧驻守')],
 ['new interactive control',html.replace('<strong>参考边界：</strong>','<button>自动开始</button><strong>参考边界：</strong>')],
 ['unreviewed script change',html.replace('<script>','<script>globalThis.unreviewed=true;')],
 ['removed legacy rule',html.replace('双方在圈内暂停累计','双方在圈内继续累计')],
 ['duplicate note',html.replace('</body>','<li id="switchbackRepairHint">重复</li></body>')]
 ];
 for(const[label,mutant]of mutations){assert.notEqual(mutant,html,label+' applied');assert.throws(()=>inspect(mutant),undefined,label+' rejected');checks++}
 console.log(JSON.stringify({passed:true,checks,negativeControls:mutations.length,sourceSha256:sha(html),baselineSha256:baselineSha,scope:'exact static markup fence plus whole-source VM read-only and state parity; no native-browser, timing, touch, FPS or balance claim'},null,2));
}finally{fs.rmSync(temp,{recursive:true,force:true})}
