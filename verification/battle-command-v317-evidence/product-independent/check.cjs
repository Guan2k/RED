const fs=require('fs'),path=require('path'),assert=require('assert/strict'),cp=require('child_process');
const root=process.cwd(),c=path.join(root,'red-development/v317-battle-command-candidate/RED'),b=path.join(root,'red-development/v316-integration/RED');
const {loadGame}=require(c+'/verification/vm-environment.cjs');
const snap=g=>g.run('JSON.stringify({state,uid,groups,selection:[...selection],placement,attackMode,ordinaryCommandMode,appendCommandMode,drag})');
const a=loadGame(c+'/index.html',{seed:7301}).start(),z=loadGame(b+'/index.html',{seed:7301}).start();
const steps=['selectMiners','selectIdle','selectArmy','ordinaryCommand','cancelPending','appendCommand','cancelPending','attack','cancelPending','selectAllDamagedCombat','selectDamaged','returnBase','stop'];
let points=0;for(let id of steps){for(let g of [a,z])g.click(id);assert.equal(snap(a),snap(z),id);for(let e of z.elements.filter(e=>e.id)){let n=a.element(e.id);for(let k of ['disabled','hidden','value','textContent'])assert.equal(n[k],e[k],id+':'+e.id+':'+k);assert.deepEqual(n.attributes,e.attributes,id+':'+e.id)}points++}
for(let t of ['tank','scout','artillery','repair','harvester']){for(let g of [a,z])g.elements.find(e=>e.dataset.unit===t).click();assert.equal(snap(a),snap(z),t);points++}
for(let key of ['m','i','4','5','6','7','8']){for(let g of [a,z])g.dispatch('keydown',{key,code:/\d/.test(key)?'Digit'+key:'Key'+key.toUpperCase()});assert.equal(snap(a),snap(z),key);points++}
for(let g of [a,z])g.step(3);assert.equal(snap(a),snap(z));points++;
let old=fs.readFileSync(b+'/src/script/03-renderer.jsfrag','utf8'),now=fs.readFileSync(c+'/src/script/03-renderer.jsfrag','utf8'),html=fs.readFileSync(c+'/index.html','utf8');
const controls=[['healthy',html],['omitted-route-pass',html.replace('drawCurrentOrderPaths();for(let e of state.entities){','for(let e of state.entities){')],['duplicate-selection',html.replace('<section id="battleCommandPanel"','<div id="selection"></div><section id="battleCommandPanel"')],['changed-control-attribute',html.replace('id="selectArmy" title=', 'id="selectArmy" aria-label="unapproved" title=')]];
let out={pairedBehaviorCheckpoints:points,controls:[]};for(let [name,s]of controls){let d='/tmp/red-review317/'+name;fs.mkdirSync(d,{recursive:true});fs.writeFileSync(d+'/index.html',s);try{fs.symlinkSync(c+'/src',d+'/src','dir')}catch{}let r=cp.spawnSync(process.execPath,[c+'/verification/battle-command-workspace.cjs',d+'/index.html',b+'/index.html'],{encoding:'utf8'});let j=JSON.parse(r.stdout);out.controls.push({name,passed:j.passed,failed:j.failed,failedTests:j.results.filter(x=>!x.passed).map(x=>x.name)});console.error(name,j.passed,j.failed);assert.equal(j.failed===0,name==='healthy')}
console.log(JSON.stringify(out,null,2));
