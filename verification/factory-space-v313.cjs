'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),{loadGame}=require('./vm-environment.cjs'),source=path.resolve(process.argv[2]||path.join(root,'index.html')),results=[];
const state=g=>g.run('JSON.stringify({state,uid,groups,selection:[...selection],placement,attackMode,ordinaryCommandMode,appendCommandMode,drag})');
const selected=g=>g.run('JSON.stringify([...selection])');
function fresh(paused){const g=loadGame(source).start();g.click('selectArmy');if(paused)g.click('pause');g.element('selectAllFactories').focus();return g}
function key(b,type,k=' ',repeat=false,more={}){let prevented=false;b.dispatchEvent({type,key:k,code:k===' '?'Space':'Enter',repeat,preventDefault(){prevented=true},...more});return prevented}
function pointer(b,type){b.dispatchEvent({type,pointerId:71,button:0,isPrimary:true,pointerType:'mouse'})}
function press(b){pointer(b,'pointerdown');pointer(b,'pointerup');b.click()}
function test(name,fn){try{fn();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.message.split('\n')[0]})}}
for(const paused of [false,true])for(const repeats of [0,1,4,20])test(`space release ${paused}/${repeats}`,()=>{const g=fresh(paused),b=g.element('selectAllFactories');key(b,'keydown');const before=state(g);for(let i=0;i<repeats;i++){assert.equal(key(b,'keydown',' ',true),true,'repeat default suppressed');assert.equal(state(g),before,'repeat alone does not select')}key(b,'keyup');b.click();assert.equal(selected(g),'[4]','held Space releases one selection');g.click('selectArmy');const after=state(g);b.click();assert.equal(state(g),after,'no double activation');key(b,'keydown');key(b,'keyup');b.click();assert.equal(selected(g),'[4]','fresh Space recovers')});
for(const paused of [false,true])for(const repeats of [0,1,4])for(const cancel of ['button-blur','focus-change','window-blur','restart','pointercancel','lostcapture','disabled'])test(`interrupted ${paused}/${repeats}/${cancel}`,()=>{const g=fresh(paused),b=g.element('selectAllFactories');key(b,'keydown');for(let i=0;i<repeats;i++)key(b,'keydown',' ',true);
 if(cancel==='button-blur')b.dispatchEvent({type:'blur'});
 if(cancel==='focus-change'){b.dispatchEvent({type:'blur'});g.element('coordinateCommandX').focus()}
 if(cancel==='window-blur')g.dispatch('blur');
 if(cancel==='restart'){g.click('restart');g.click('start');g.click('selectArmy')}
 if(cancel==='pointercancel')pointer(b,'pointercancel');
 if(cancel==='lostcapture')pointer(b,'lostpointercapture');
 if(cancel==='disabled'){b.disabled=true;key(b,'keydown',' ',true);b.disabled=false}
 const before=state(g);key(b,'keyup');b.click();assert.equal(state(g),before,'canceled or disabled activation remains canceled');press(b);assert.equal(selected(g),'[4]','fresh pointer recovers')});
for(const paused of [false,true])for(const repeats of [1,4])test(`Enter ${paused}/${repeats}`,()=>{const g=fresh(paused),b=g.element('selectAllFactories');key(b,'keydown','Enter');b.click();assert.equal(selected(g),'[4]','Enter first press works');g.click('selectArmy');const before=state(g);for(let i=0;i<repeats;i++){assert.equal(key(b,'keydown','Enter',true),true);b.click();assert.equal(state(g),before,'Enter repeat blocked')}key(b,'keyup','Enter');b.click();assert.equal(state(g),before,'Enter release no duplicate');press(b);assert.equal(selected(g),'[4]')});
for(const paused of [false,true])for(const repeated of [' ','Enter'])test(`pointer interrupted by repeat ${paused}/${repeated}`,()=>{const g=fresh(paused),b=g.element('selectAllFactories');pointer(b,'pointerdown');key(b,'keydown',repeated,true);const before=state(g);pointer(b,'pointerup');b.click();assert.equal(state(g),before,'repeat does not preserve pointer token');press(b);assert.equal(selected(g),'[4]')});
for(const paused of [false,true])for(const event of [{isComposing:true},{keyCode:229}])test(`composition ${paused}/${JSON.stringify(event)}`,()=>{const g=fresh(paused),b=g.element('selectAllFactories');key(b,'keydown');key(b,'keydown',' ',true,event);key(b,'keyup');b.click();assert.equal(selected(g),'[4]','composition guard retains existing pending key behavior')});
const failed=results.filter(x=>!x.passed).length;console.log(JSON.stringify({sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),passed:results.length-failed,failed,results,scope:'Synthetic registered handlers, natural battle and UI controls; explicit DOM focus/disabled fixtures. No native-browser claim. Current source passed explicitly or defaults to index.html.'},null,2));process.exitCode=failed?1:0;
