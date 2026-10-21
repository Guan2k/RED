'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),previous=require('./inherit-dom-v316.cjs');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
// Read-only comparison view, not a source/runtime adapter. Every old object field
// survives. Only the reviewed relocation and three new structural nodes are undone.
function battleCommandProjection(g){
 const sameNodes=(a,b,label)=>assert.ok(a.length===b.length&&a.every((n,i)=>n===b[i]),label);
 const roots=g.elements.filter(n=>n.id==='battleCommandPanel');
 if(!roots.length)return g;
 assert.equal(roots.length,1,'unique command panel');
 const get=id=>{const a=g.elements.filter(n=>n.id===id);assert.equal(a.length,1,'unique '+id);return a[0]};
 const panel=roots[0],heading=get('battleCommandHeading'),selection=get('selection'),base=get('returnResult').parentNode,tactics=get('orderedRouteDetails').parentNode;
 const rowIds=[['selectArmy','selectMiners'],['ordinaryCommand','appendCommand'],['attack','cancelPending','stop'],['selectAllDamagedCombat'],['selectIdle','selectDamaged','returnBase']];
 const rows=rowIds.map(ids=>{const row=get(ids[0]).parentNode;assert.equal(row.tagName,'DIV');assert.deepEqual(row.children.map(n=>n.id),ids,'exact original row children/order');for(const id of ids)assert.ok(get(id).parentNode===row);return row});
 assert.equal(base.tagName,'DIV');assert.equal(tactics.tagName,'DIV');assert.equal(base.parentNode.tagName,'ASIDE');assert.ok(tactics.parentNode===base.parentNode);
 assert.ok(panel.parentNode===base);sameNodes(panel.children,[heading,selection,...rows],'exact command section children');
 const pristine=(n,tag,attrs)=>{assert.deepEqual(Object.keys(n).sort(),['tagName','children','parentNode','style','dataset','attributes','value','textContent','hidden','disabled','isContentEditable','listeners','id','classList'].sort(),'no unreviewed fields on removed nodes');assert.equal(n.tagName,tag);assert.deepEqual(n.attributes,attrs);assert.deepEqual(n.dataset,{});assert.deepEqual(n.style,{});assert.equal(n.value,'');assert.equal(n.textContent,'');assert.equal(n.hidden,false);assert.equal(n.disabled,false);assert.equal(n.isContentEditable,false);assert.deepEqual(n.listeners,{});assert.equal(n.classList.contains('hidden'),false);assert.equal(n.classList.contains('active'),false)};
 pristine(panel,'SECTION',{id:'battleCommandPanel','aria-labelledby':'battleCommandHeading'});pristine(heading,'H2',{id:'battleCommandHeading'});assert.equal(heading.children.length,0);
 const productionHeading=base.children[2],cards=base.children[3],construction=get('coordinateConstructionPanel'),schedule=base.children[base.children.indexOf(construction)+1];
 sameNodes(base.children.slice(0,4),[get('returnResult'),panel,productionHeading,cards],'exact leading base children');assert.equal(productionHeading.tagName,'H2');assert.equal(cards.tagName,'DIV');assert.deepEqual(cards.children.map(n=>n.dataset.unit),['tank','scout','artillery','repair','harvester']);for(const n of cards.children)assert.ok(n.parentNode===cards);
 pristine(schedule,'H2',{});assert.equal(schedule.children.length,0);assert.equal(schedule.id,'');
 const clones=new Map(g.elements.map(n=>[n,Object.assign(Object.create(Object.getPrototypeOf(n)),n)]));
 for(const [n,c]of clones){c.children=n.children.map(x=>clones.get(x)||x);c.parentNode=clones.get(n.parentNode)||n.parentNode;}
 const view=Object.assign(Object.create(Object.getPrototypeOf(g)),g,{elements:g.elements.map(n=>clones.get(n)),document:{...g.document,body:clones.get(g.document.body)||g.document.body,activeElement:clones.get(g.document.activeElement)||g.document.activeElement}});
 const c=n=>clones.get(n),walk=n=>{const out=[],seen=new Set();function visit(x){assert.ok(!seen.has(x),'no duplicate/cyclic subtree');seen.add(x);out.push(x);for(const child of x.children){assert.ok(child.parentNode===x,'exact parent link');visit(child)}}visit(n);return out};
 function cut(n){const block=walk(n),at=view.elements.indexOf(n);assert.ok(at>=0);sameNodes(view.elements.slice(at,at+block.length),block,'exact flat subtree order');view.elements.splice(at,block.length);assert.equal(n.parentNode.children.filter(x=>x===n).length,1);n.parentNode.children.splice(n.parentNode.children.indexOf(n),1);return block}
 function before(n,anchor){const block=cut(n),p=anchor.parentNode;assert.equal(p.children.filter(x=>x===anchor).length,1);p.children.splice(p.children.indexOf(anchor),0,n);n.parentNode=p;view.elements.splice(view.elements.indexOf(anchor),0,...block)}
 before(c(selection),c(get('orderedRouteDetails')));
 before(c(rows[1]),c(get('hold').parentNode));before(c(rows[2]),c(get('hold').parentNode));
 before(c(rows[0]),c(get('harvesterFleetOverview')));
 const afterAlert=tactics.children[tactics.children.indexOf(get('alertMinerRow'))+1];assert.ok(afterAlert);before(c(rows[3]),c(afterAlert));before(c(rows[4]),c(afterAlert));
 before(c(productionHeading),c(schedule));before(c(cards),c(schedule));cut(c(schedule));cut(c(panel));
 return view;
}
const programs={};
for(const[name,entry]of Object.entries(previous.programs)){
 const before='function dom(g){',after='function dom(g){g=('+battleCommandProjection.toString()+')(g);';
 assert.equal(entry.after.split(before).length-1,1);const projection=entry.after.replace(before,after),bytes=fs.readFileSync(path.join(__dirname,name)),inherited=previous.adapt(name,bytes),updated=inherited.replace(entry.after,projection);
 programs[name]={...entry,after:projection,adaptedSha256:hash(updated)};
}
function adapt(name,bytes){assert.ok(programs[name],'approved comparator only');const inherited=previous.adapt(name,bytes),before=previous.programs[name].after,after=programs[name].after;assert.equal(inherited.split(before).length-1,1);const result=inherited.replace(before,after);assert.equal(result.replace(after,before),inherited);assert.equal(hash(result),programs[name].adaptedSha256);return result}
module.exports={...previous,programs,adapt,battleCommandProjection};
