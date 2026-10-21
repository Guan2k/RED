'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {loadGame}=require('./vm-environment.cjs');
const source=path.resolve(process.argv[2]||path.join(__dirname,'../index.html')),results=[];
function test(name,f){try{f();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.message})}}
function fresh(kind){const g=loadGame(source).start();g.click('selectArmy');const b=kind==='attack'?g.element('attack'):g.elements.find(e=>e.dataset.build===kind);b.focus();assert.equal(b.disabled,false);return {g,b}}
// Explicit synthetic default-action adapter. This is NOT native browser evidence.
function key(g,b,key,repeat=false,extra={},type='keydown',modelDefault=true){const e={type,target:b,key,code:key===' '?'Space':key,repeat,defaultPrevented:false,preventDefault(){this.defaultPrevented=true},...extra};b.dispatchEvent(e);g.dispatch(type,e);if(modelDefault&&!e.defaultPrevented&&((type==='keydown'&&key==='Enter')||(type==='keyup'&&key===' ')))b.click({detail:0});return e.defaultPrevented}
const mode=g=>g.run('JSON.stringify({attackMode,placement})');
const neutral=g=>assert.equal(g.run('!!(attackMode||placement)'),false);
const active=(g,kind)=>assert.equal(g.run(kind==='attack'?'attackMode':'placement'),kind==='attack'?true:kind);
for(const kind of ['attack','power','refinery','factory','turret']){
 test(`${kind}: first Enter, repeats, Escape, repeats, fresh Enter`,()=>{const {g,b}=fresh(kind);assert.equal(key(g,b,'Enter'),false);active(g,kind);const armed=mode(g);for(let i=0;i<3;i++){assert.equal(key(g,b,'Enter',true),true);assert.equal(mode(g),armed)}key(g,b,'Escape');neutral(g);for(let i=0;i<3;i++){assert.equal(key(g,b,'Enter',true),true);neutral(g)}assert.equal(key(g,b,'Enter',false),false);active(g,kind)});
 test(`${kind}: behavioral Escape cancellation survives held Enter`,()=>{const {g,b}=fresh(kind);key(g,b,'Enter');active(g,kind);key(g,b,'Escape');neutral(g);key(g,b,'Enter',true);neutral(g)});
 test(`${kind}: behavioral held Enter preserves armed mode`,()=>{const {g,b}=fresh(kind);key(g,b,'Enter');active(g,kind);key(g,b,'Enter',true);active(g,kind)});
 test(`${kind}: repeat without initial key does not arm`,()=>{const {g,b}=fresh(kind);assert.equal(key(g,b,'Enter',true),true);neutral(g)});
 test(`${kind}: mouse and assistive click remain valid after blocked repeat`,()=>{const {g,b}=fresh(kind);key(g,b,'Enter',true);b.click({detail:1});active(g,kind);key(g,b,'Escape');b.click({detail:0});active(g,kind)});
 test(`${kind}: Space release arms, Escape cancels held Space, next Space works`,()=>{const {g,b}=fresh(kind);assert.equal(key(g,b,' '),false);neutral(g);assert.equal(key(g,b,' ',false,{},'keyup'),false);active(g,kind);key(g,b,'Escape');key(g,b,' ');key(g,b,'Escape');assert.equal(key(g,b,' ',false,{},'keyup'),true);neutral(g);key(g,b,' ');key(g,b,' ',false,{},'keyup');active(g,kind)});
 for(const ime of [{isComposing:true},{keyCode:229}])test(`${kind}: IME ${JSON.stringify(ime)} Enter repeat untouched`,()=>{const {g,b}=fresh(kind);const before=mode(g);assert.equal(key(g,b,'Enter',true,ime,'keydown',false),false);assert.equal(mode(g),before)});
 test(`${kind}: unrelated key repeat untouched by local handler`,()=>{const {g,b}=fresh(kind);let prevented=false;b.onkeydown({target:b,key:'z',code:'KeyZ',repeat:true,preventDefault(){prevented=true}});assert.equal(prevented,false);neutral(g)});
 test(`${kind}: Enter repeat leaves existing Space cancellation token intact`,()=>{const {g,b}=fresh(kind);key(g,b,' ');key(g,b,'Escape');const before=g.run('JSON.stringify([...commandSpaceActivations.values()])');key(g,b,'Enter',true);assert.equal(g.run('JSON.stringify([...commandSpaceActivations.values()])'),before);assert.equal(key(g,b,' ',false,{},'keyup'),true);neutral(g)});
}
test('unrelated button Enter repeat default remains available',()=>{const g=loadGame(source).start(),b=g.element('pause');b.focus();const p=g.state.paused;assert.equal(key(g,b,'Enter',true),false);assert.equal(g.state.paused,!p)});
const failed=results.filter(r=>!r.passed).length;
console.log(JSON.stringify({passed:results.length-failed,failed,sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),results,scope:'Full inline-source VM and explicit Enter-keydown/Space-keyup default-click model. Not native browser timing, accessibility, persistence, aggregate gate or release acceptance.'},null,2));process.exitCode=failed?1:0;
