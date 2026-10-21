'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{loadGame}=require('./provenance-loader.cjs');
const source=path.resolve(process.argv[2]||path.join(__dirname,'../../index.html')),results=[];
const snap=g=>g.run(`JSON.stringify({state,uid,groups,selection:[...selection],placement,attackMode,drag,ordinaryCommandMode,appendCommandMode,ordinaryCommandGesture,selectionClickCandidate,lastSelectionClick,doubleClickSelection,simulationRemainder,last,restartPrompt,resumeAfterCancel,commandSpaceActivations:[...commandSpaceActivations].map(([b,a])=>[b.id,a]),focus:document.activeElement.id,overlay:$('overlay').classList.contains('hidden')})`);
function key(g,repeat,extra={}){let prevented=false;g.dispatch('keydown',{key:'Escape',code:'Escape',repeat,preventDefault(){prevented=true},...extra});return prevented}
function fresh(){const g=loadGame(source,{seed:31201}).start();g.document.activeElement=g.document.body;return g}
function test(name,f){try{f();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.message.split('\n')[0]})}}
const modes={
 attack:g=>{g.click('selectArmy');g.click('attack');assert.equal(g.run('attackMode'),true)},
 placement:g=>{g.elements.find(e=>e.dataset.build==='power').click();assert.equal(g.run('placement'),'power')},
 ordinary:g=>{g.click('selectArmy');g.click('ordinaryCommand');assert.equal(g.run('ordinaryCommandMode'),true)},
 append:g=>{g.click('selectArmy');g.click('appendCommand');assert.equal(g.run('appendCommandMode'),true)},
 drag:g=>{g.element('map').dispatchEvent({type:'pointerdown',pointerId:12,button:0,isPrimary:true,clientX:300,clientY:250});assert.ok(g.run('drag'))}
};
for(const [name,arm] of Object.entries(modes))for(const paused of [false,true])test(`held Escape preserves new ${name}, paused=${paused}`,()=>{
 const g=fresh();if(paused)g.click('pause');key(g,false);arm(g);const before=snap(g);
 for(let n=0;n<5;n++){assert.equal(key(g,true),false,'no new browser default suppression');assert.equal(snap(g),before,'repeat exact no-op')}
 key(g,false);assert.equal(g.run('!!(placement||attackMode||drag||ordinaryCommandMode||appendCommandMode)'),false,'fresh Escape cancels pending action');
});
for(const paused of [false,true])test(`held Escape preserves newly opened restart, paused=${paused}`,()=>{
 const g=fresh();if(paused)g.click('pause');key(g,false);g.click('restart');assert.equal(g.run('restartPrompt'),true);const before=snap(g);key(g,true);assert.equal(snap(g),before);key(g,false);assert.equal(g.run('restartPrompt'),false);assert.equal(g.run('state.paused'),paused);
});
for(const repeat of [false,undefined])for(const [name,arm] of Object.entries(modes))test(`first Escape ${repeat} cancels ${name}`,()=>{
 const g=fresh();arm(g);const world=g.run('JSON.stringify({state,uid,groups,selection:[...selection]})');key(g,repeat);assert.equal(g.run('!!(placement||attackMode||drag||ordinaryCommandMode||appendCommandMode)'),false);assert.equal(g.run('JSON.stringify({state,uid,groups,selection:[...selection]})'),world);
});
test('Shift Escape retains existing cancellation semantics',()=>{const g=fresh();modes.attack(g);key(g,true,{shiftKey:true});assert.equal(g.run('attackMode'),true);key(g,false,{shiftKey:true});assert.equal(g.run('attackMode'),false)});
for(const guard of [{ctrlKey:true},{metaKey:true},{altKey:true},{isComposing:true},{keyCode:229}])for(const repeat of [false,true])test(`guard ${JSON.stringify(guard)} repeat=${repeat}`,()=>{const g=fresh();modes.attack(g);const before=snap(g);key(g,repeat,guard);assert.equal(snap(g),before)});
for(const tag of ['INPUT','SELECT','TEXTAREA','editable'])for(const repeat of [false,true])test(`focus ${tag} repeat=${repeat}`,()=>{const g=fresh();modes.attack(g);g.document.activeElement={tagName:tag==='editable'?'DIV':tag,isContentEditable:tag==='editable'};const before=snap(g);key(g,repeat);assert.equal(snap(g),before)});
for(const phase of ['initial','resultOverlay','resultBattle'])test(`repeat retains ${phase}`,()=>{const g=phase==='initial'?loadGame(source):fresh();if(phase!=='initial')g.run(`state.result='fixture result';$('overlay').classList.${phase==='resultBattle'?'add':'remove'}('hidden')`);const before=snap(g);key(g,true);assert.equal(snap(g),before)});
test('first Escape still returns from finished battlefield',()=>{const g=fresh();g.run("state.result='fixture result';$('overlay').classList.add('hidden')");assert.equal(key(g,false),true);assert.equal(g.element('overlay').classList.contains('hidden'),false)});
test('repeat does not poison a newly pressed command Space activation',()=>{const g=fresh();key(g,false);g.click('selectArmy');const b=g.element('attack');b.dispatchEvent({type:'keydown',key:' ',code:'Space',repeat:false});const before=snap(g);key(g,true);assert.equal(snap(g),before);key(g,false);assert.equal(g.run('[...commandSpaceActivations.values()].every(a=>a.canceled)'),true)});
test('explicit cancel button remains usable while Escape is held',()=>{const g=fresh();key(g,false);modes.attack(g);g.click('cancelPending');assert.equal(g.run('attackMode'),false)});
const failed=results.filter(r=>!r.passed).length;console.log(JSON.stringify({passed:results.length-failed,failed,sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),results,scope:'Full inline-source VM with registered input callbacks. Natural initial battle and explicit lifecycle/focus fixtures. No native key timing/default events, browser, persistence, or full release claim.'},null,2));process.exitCode=failed?1:0;
