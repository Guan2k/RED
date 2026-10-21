'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {loadGame}=require('./vm-environment.cjs'),helper=require('./mission-guidance-dom-v318.cjs');
const source=path.join(__dirname,'../index.html'),html=fs.readFileSync(source,'utf8'),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const results=[],cases=[];function test(name,fn){cases.push({name,fn})}
function comparator(version){const code=fs.readFileSync(path.join(__dirname,'beginner-guide-'+version+'.cjs'),'utf8'),body=code.slice(code.indexOf('function retainedDom('),code.indexOf('const world ='));return Function('require','check','return ('+body+')')(require,(v,label)=>assert.ok(v,label))}
const current=comparator('v318'),prior=comparator('v317'),fresh=()=>loadGame(source,{seed:31817}).start();
const graph=g=>g.elements.map(n=>({fields:Object.fromEntries(Object.entries(n).filter(([,v])=>v===null||['string','number','boolean'].includes(typeof v))),attributes:{...n.attributes},style:{...n.style},dataset:{...n.dataset},parent:g.elements.indexOf(n.parentNode),children:n.children.map(c=>g.elements.indexOf(c))}));
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'red-v318-guidance-dom-'));
try{
 let old=html;for(const id of helper.ids){const re=new RegExp('<li id="'+id+'">[\\s\\S]*?</li>','g');assert.equal([...old.matchAll(re)].length,1);old=old.replace(re,'')}old=old.replace('ORIGINAL RTS / v0.318','ORIGINAL RTS / v0.317');assert.equal(sha(old),'b256810fe285c02bedf0ec252e223c0e67d727912cb5721d07dbae24424c4c9d');const oldFile=path.join(temp,'v317.html');fs.writeFileSync(oldFile,old);
 test('exact ten-node omission equals physical source removal and prior comparator',()=>{const a=fresh(),b=loadGame(oldFile,{seed:31817}).start();assert.equal(helper.nodes(a).length,10);assert.deepEqual(current(a,true),prior(b,true))});
 test('projection leaves live graph, selection and active element unchanged',()=>{const g=fresh(),before=graph(g),state=g.run('JSON.stringify({state,selection:[...selection],uid})'),active=g.document.activeElement;current(g,true);assert.deepEqual(graph(g),before);assert.equal(g.run('JSON.stringify({state,selection:[...selection],uid})'),state);assert.equal(g.document.activeElement,active)});
 test('unprojected current comparator retains every added and old field',()=>{const g=fresh();assert.deepEqual(current(g),prior(g))});
 const mutations={
  'missing note':g=>g.element(helper.ids[0]).remove(),
  'duplicate note ID':g=>{const n=g.document.createElement('li');n.id=helper.ids[0];g.element('quickSwitchbackBrief').children[2].appendChild(n)},
  'unexpected note attribute':g=>g.element(helper.ids[0]).attributes['aria-label']='bad',
  'unexpected note field':g=>g.element(helper.ids[0]).unexpected=true,
  'changed note text field':g=>g.element(helper.ids[0]).textContent='bad',
  'changed note visibility':g=>g.element(helper.ids[0]).hidden=true,
  'changed note styling':g=>g.element(helper.ids[0]).style.color='red',
  'new note listener':g=>g.element(helper.ids[0]).listeners.click=[()=>{}],
  'changed label attribute':g=>g.element(helper.ids[0]).children[0].attributes.title='bad',
  'changed label text field':g=>g.element(helper.ids[0]).children[0].textContent='bad',
  'extra nested child':g=>g.element(helper.ids[0]).appendChild(g.document.createElement('button')),
  'wrong note parent':g=>g.document.body.appendChild(g.element(helper.ids[0])),
  'wrong label parent':g=>{g.element(helper.ids[0]).children[0].parentNode=g.document.body},
  'reordered notes':g=>{const c=g.element('quickSwitchbackBrief').children[2].children;[c[3],c[4]]=[c[4],c[3]]},
  'duplicate flat note identity':g=>g.elements.push(g.element(helper.ids[0])),
  'wrong flat note order':g=>{const i=g.elements.indexOf(g.element(helper.ids[0]));[g.elements[i],g.elements[i+1]]=[g.elements[i+1],g.elements[i]]},
  'detached briefing':g=>g.element('quickSwitchbackBrief').remove()
 };
 for(const[name,mutate]of Object.entries(mutations))test(name+' rejected before exclusion',()=>{const g=fresh();mutate(g);assert.throws(()=>current(g,true),{code:'ERR_ASSERTION'})});
 for(const[name,mutate]of Object.entries({
  'original rule text':g=>g.element('quickSwitchbackBrief').children[2].children[0].textContent='changed old rule',
  'original rule attributes':g=>g.element('quickSwitchbackBrief').children[2].children[0].attributes.title='changed',
  'original rule order':g=>{const c=g.element('quickSwitchbackBrief').children[2].children;[c[0],c[1]]=[c[1],c[0]]},
  'original list attributes':g=>g.element('quickSwitchbackBrief').children[2].attributes['aria-label']='changed',
  'original briefing attribute':g=>g.element('quickSwitchbackBrief').attributes.title='changed',
  'old control attribute':g=>g.element('attack').attributes.title='changed',
  'old cash text':g=>g.element('cash').textContent='changed',
  'lookalike unrelated ID':g=>{const n=g.document.createElement('p');n.id=helper.ids[0]+'Other';g.element('quickSwitchbackBrief').appendChild(n)}
 }))test(name+' remains observable',()=>{const g=fresh(),before=current(g,true);mutate(g);let after;try{after=current(g,true)}catch(e){assert.equal(e.code,'ERR_ASSERTION');return}assert.notDeepEqual(after,before)});
 test('source artifact unchanged',()=>assert.equal(fs.readFileSync(source,'utf8'),html));
 // Bound mock-VM lifetimes without changing any registered assertion or product.
 const batchSize=4,batch=process.env.RED_V318_GUIDANCE_DOM_BATCH;
 if(batch!==undefined){for(const {name,fn}of cases.slice(Number(batch)*batchSize,(Number(batch)+1)*batchSize)){fn();results.push({name,passed:true})}}
 else{const {spawnSync}=require('node:child_process');for(let i=0;i<Math.ceil(cases.length/batchSize);i++){const child=spawnSync(process.execPath,[__filename],{encoding:'utf8',env:{...process.env,RED_V318_GUIDANCE_DOM_BATCH:String(i)},maxBuffer:4*1024*1024});assert.ifError(child.error);assert.equal(child.status,0,'bounded guidance DOM batch '+i+': '+child.stderr);assert.equal(child.stderr,'');const report=JSON.parse(child.stdout);assert.equal(report.failed,0);assert.equal(report.sourceSha256,sha(html));assert.deepEqual(report.results.map(r=>r.name),cases.slice(i*batchSize,(i+1)*batchSize).map(c=>c.name));assert.ok(report.results.every(r=>r.passed===true));results.push(...report.results)}assert.equal(results.length,cases.length,'every registered assertion case executed')}
 console.log(JSON.stringify({passed:results.length,failed:0,sourceSha256:sha(html),results,scope:'Exact five reviewed LI/STRONG pairs only; physical-removal equivalence, no live/source mutation, malformed additions rejected and original fields remain observable. Mock DOM only.'},null,2));
}finally{fs.rmSync(temp,{recursive:true,force:true})}
