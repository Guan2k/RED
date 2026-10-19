'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{loadGame}=require('./vm-environment.cjs');
const source=path.resolve(process.argv[2]||path.join(__dirname,'../index.html')),results=[];
const bindings={f:'selectArmy',i:'selectIdle',m:'selectMiners'};
const snap=g=>g.run('JSON.stringify({state,uid,groups,selection:[...selection],placement,attackMode,drag,ordinaryCommandMode,appendCommandMode,ordinaryCommandGesture,selectionClickCandidate,lastSelectionClick,doubleClickSelection,simulationRemainder})');
function key(g,k,repeat,extra={}){let prevented=false;g.dispatch('keydown',{key:k,code:'Key'+k.toUpperCase(),repeat,preventDefault(){prevented=true},...extra});return prevented}
function fresh(){return loadGame(source,{seed:30401}).start()}
function test(name,f){try{f();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.message.split("\n")[0]})}}
for(const k of ['f','i','m'])for(const upper of [false,true])for(const paused of [false,true])test(`held ${k} upper=${upper} paused=${paused} preserves intervening attack`,()=>{
 const g=fresh();if(paused)g.click('pause');const letter=upper?k.toUpperCase():k;key(g,letter,false,{shiftKey:upper});assert.ok(g.run('selection.size>0'),'initial selection works');
 // Real registered UI actions between initial and repeat events, no injected world state.
 g.click('selectArmy');g.click('attack');assert.equal(g.run('attackMode'),true,'attack pending');const before=snap(g);
 for(let n=0;n<4;n++){key(g,letter,true,{shiftKey:upper});assert.equal(snap(g),before,'repeat preserves exact world and pending input')}
 key(g,letter,false,{shiftKey:upper});assert.equal(g.run('attackMode'),false,'fresh key still selects and cancels pending attack');
 const clicked=fresh();if(paused)clicked.click('pause');clicked.click(bindings[k]);assert.equal(g.run('JSON.stringify([...selection])'),clicked.run('JSON.stringify([...selection])'),'fresh key selection matches button');
});
for(const k of ['f','i','m'])for(const repeat of [false,undefined])test(`${k} first repeat=${repeat} matches visible button`,()=>{
 const a=fresh(),b=fresh();key(a,k,repeat);b.click(bindings[k]);assert.equal(snap(a),snap(b),'first event preserves existing button behavior');
});
for(const k of ['f','i','m'])for(const guard of [{ctrlKey:true},{metaKey:true},{altKey:true},{isComposing:true},{keyCode:229}])for(const repeat of [false,true])test(`${k} guard ${JSON.stringify(guard)} repeat=${repeat}`,()=>{const g=fresh(),before=snap(g);key(g,k,repeat,guard);assert.equal(snap(g),before,'guard exact no-op')});
for(const k of ['f','i','m'])for(const tag of ['INPUT','SELECT','TEXTAREA','editable'])for(const repeat of [false,true])test(`${k} focus ${tag} repeat=${repeat}`,()=>{const g=fresh();g.document.activeElement={tagName:tag==='editable'?'DIV':tag,isContentEditable:tag==='editable'};const before=snap(g);key(g,k,repeat);assert.equal(snap(g),before,'editable focus exact no-op')});
for(const k of ['f','i','m'])for(const phase of ['prestart','restart','terminal'])for(const repeat of [false,true])test(`${k} lifecycle ${phase} repeat=${repeat}`,()=>{const g=fresh();g.run(phase==='prestart'?'state.started=false':phase==='restart'?'restartPrompt=true':"state.result='fixture terminal'");const before=snap(g);key(g,k,repeat);assert.equal(snap(g),before,'blocked lifecycle exact no-op')});
for(const k of ['f','i','m'])test(`${k} visible button remains repeatable`,()=>{const g=fresh();g.click(bindings[k]);g.click('selectArmy');g.click('attack');assert.equal(g.run('attackMode'),true);g.click(bindings[k]);assert.equal(g.run('attackMode'),false,'visible selection still cancels pending attack')});
const failed=results.filter(r=>!r.passed).length;console.log(JSON.stringify({passed:results.length-failed,failed,sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),results,scope:'Isolated VM registered-key dispatch and button callbacks. Natural initial battle plus explicit lifecycle/focus fixtures. No browser key timing, accessibility, persistence, or full release claim.'},null,2));process.exitCode=failed?1:0;
