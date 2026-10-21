'use strict';
// v315 expected-side presentation adaptation; no candidate stream changes.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{loadGame}=require('./vm-environment.cjs'),capture=require('./building-reference-capture-v315.cjs');
const results=[],source=path.resolve(process.argv[2]||path.join(__dirname,'../index.html'));
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function test(name,fn){try{fn();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.message})}}
let html='';
test('source readable',()=>{html=fs.readFileSync(source,'utf8')});
const types=['hq','power','factory','refinery','turret'];
const snapshot=g=>g.run('JSON.stringify({state,groups,uid,selection:[...selection],placement,attackMode,drag,ordinaryCommandMode,appendCommandMode})');
const rows=()=>[...html.matchAll(/<li data-reference-building="([^"]+)">([\s\S]*?)<\/li>/g)];
for(const type of types)for(const preview of [false,true])test(type+' '+(preview?'preview':'original')+' exact current draw replay',()=>{
 const g=loadGame(source),record=capture(g,type,preview),expected=`<svg class="${preview?'reference-preview':'reference-original'}" xmlns="http://www.w3.org/2000/svg" viewBox="-60 -68 120 120" width="96" height="96" aria-hidden="true" focusable="false">\n${record.body}\n</svg>`,matches=rows().filter(r=>r[1]===type);
 assert.equal(matches.length,1);assert.ok(matches[0][2].includes(expected),'row must replay every current paint operation and stroke');assert.equal(matches[0][2].split(expected).length-1,1);assert.ok(record.commands.some(c=>c.state));assert.ok(record.bounds.minX>=-60&&record.bounds.maxX<=60&&record.bounds.minY>=-68&&record.bounds.maxY<=52,'conservative painted bounds fit shared frame');
 const label=g.run(`defs.${type}.name`)+(type==='hq'?'（不可新建）':'');assert.ok(matches[0][2].includes('<span>'+label+'</span>'));
});
test('decorative subtree and preserved closed reference',()=>{
 const g=loadGame(source),root=g.element('buildingReferenceGallery'),ref=g.element('unitReference');assert.ok(root&&ref.contains(root));assert.ok(ref.contains(g.element('vehicleReferenceGallery')));assert.ok(!Object.hasOwn(ref.attributes,'open'));assert.deepEqual(rows().map(r=>r[1]),types);assert.equal(g.document.querySelectorAll('[data-reference-building]').length,5);
 let svgs=0;const walk=n=>{assert.ok(['DIV','P','UL','LI','SVG','RECT','PATH','SPAN'].includes(n.tagName),'unsupported interactive/external element '+n.tagName);for(const k of Object.keys(n.attributes)){assert.ok(!/^on/i.test(k));assert.ok(!['tabindex','href','xlink:href','contenteditable','autofocus','style'].includes(k));}assert.equal(Object.keys(n.listeners).length,0);assert.ok(!Object.keys(n).some(k=>/^on[a-z]/.test(k)&&typeof n[k]==='function'));if(n.tagName==='SVG'){svgs++;assert.equal(n.attributes['aria-hidden'],'true');assert.equal(n.attributes.focusable,'false');assert.equal(n.attributes.width,'96');assert.equal(n.attributes.height,'96')}n.children.forEach(walk)};walk(root);assert.equal(svgs,10);
 assert.ok(g.element('unitReferenceText').textContent.includes('主战坦克'));assert.ok(g.element('unitReferenceText').textContent.includes('指挥中心'));assert.ok(html.includes('不表示当前施工、生产、供电或战况'));assert.ok(html.includes('图片不参与选择或建造'));
});
for(const phase of ['initial','running','paused','restart','terminal'])test('readonly and immediate both-gallery mode sync '+phase,()=>{
 const g=loadGame(source);if(phase!=='initial')g.start();if(phase==='paused')g.click('pause');if(phase==='restart')g.click('restart');if(phase==='terminal')g.run("state.result='test terminal';updateUI()");const ref=g.element('unitReference'),text=g.element('unitReferenceText').textContent,before=snapshot(g),storage=JSON.stringify([...g.storage]);
 ref.open=true;g.element('vehicleArtPreview').focus();const focus=g.document.activeElement;
 for(const checked of [true,true,false,false,true,false]){g.element('vehicleArtPreview').checked=checked;g.element('vehicleArtPreview').dispatchEvent({type:'change'});for(const id of ['vehicleReferenceGallery','buildingReferenceGallery'])assert.equal(g.element(id).dataset.preview,String(checked),id+' immediate sync');assert.equal(snapshot(g),before,'world unchanged');assert.equal(JSON.stringify([...g.storage]),storage);assert.equal(g.document.activeElement,focus);assert.equal(ref.open,true);assert.equal(g.element('unitReferenceText').textContent,text)}ref.open=false;assert.equal(snapshot(g),before);
});
test('stable refresh never rewrites either gallery mode',()=>{
 const g=loadGame(source),writes={};for(const id of ['vehicleReferenceGallery','buildingReferenceGallery']){const root=g.element(id);let value=root.dataset.preview;writes[id]=0;Object.defineProperty(root.dataset,'preview',{get:()=>value,set:v=>{writes[id]++;value=v},configurable:true})}for(let i=0;i<12;i++)g.run('updateUI()');assert.deepEqual(Object.values(writes),[0,0]);g.element('vehicleArtPreview').checked=true;g.element('vehicleArtPreview').dispatchEvent({type:'change'});assert.deepEqual(Object.values(writes),[1,1]);for(let i=0;i<12;i++)g.run('updateUI()');assert.deepEqual(Object.values(writes),[1,1]);
});
test('original default and session choice survive start and restart folded',()=>{
 assert.ok(html.includes('id="buildingReferenceGallery" data-preview="false"'));const g=loadGame(source);for(const id of ['vehicleReferenceGallery','buildingReferenceGallery'])assert.equal(g.element(id).dataset.preview,'false');assert.equal(!!g.element('vehicleArtPreview').checked,false);g.element('vehicleArtPreview').checked=true;g.element('vehicleArtPreview').dispatchEvent({type:'change'});for(const action of ['start','restart']){g.click(action);for(const id of ['vehicleReferenceGallery','buildingReferenceGallery'])assert.equal(g.element(id).dataset.preview,'true');assert.ok(!g.element('unitReference').open)}assert.equal(loadGame(source).element('buildingReferenceGallery').dataset.preview,'false');
});
test('scoped responsive CSS and noninteractive graphic contract',()=>{
 const css=html.match(/<style>([\s\S]*?)<\/style>/)[1],rules=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(r=>/building-reference|buildingReferenceGallery/.test(r[1]));
 const expected=[['.building-reference-grid','display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;list-style:none;margin:8px 0 12px;padding:0'],['.building-reference-grid li','min-width:0;padding:6px;border:1px solid #3d5140;border-radius:4px;background:#1c2c23;text-align:center'],['.building-reference-grid svg','display:block;width:96px;max-width:100%;height:auto;margin:0 auto 4px;background:#354a37'],['.building-reference-grid span','display:block;font-size:12px;line-height:1.5;overflow-wrap:anywhere'],['.building-reference-grid .reference-preview','display:none'],['#buildingReferenceGallery[data-preview="true"] .reference-original','display:none'],['#buildingReferenceGallery[data-preview="true"] .reference-preview','display:block']];
 expected.push(['.vehicle-reference-grid li, .building-reference-grid li',' border-color: #476046; background: #1b2f20; padding: 8px; '],['.vehicle-reference-grid svg, .building-reference-grid svg',' border-radius: 4px; ']);assert.deepEqual(rules.map(r=>[r[1].trim(),r[2]]),expected,'all building CSS strictly scoped, compact, responsive and mode-correct');
 for(const row of rows())assert.equal((row[2].match(/<svg /g)||[]).length,2);
});
test('frozen gameplay and renderer script unchanged outside gallery synchronization',()=>{
 const historical=require('./source-delta-v311.cjs')(require('./source-delta-v312.cjs')(require('./source-delta-v313.cjs')(require('./source-delta-v314.cjs')(require('./source-delta-v315.cjs')(require('./source-delta-v316.cjs')(require('./source-delta-v317.cjs')(require('./source-delta-v318.cjs')(html)))))))),script=historical.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)[1].replace(/function updateVisualPreviewControl\(\)\{[^\n]*\}/,'function updateVisualPreviewControl(){/* gallery sync excluded */}');assert.equal(hash(script),'ddc97779dd1501b51e998f00e901daf1d5797605aaae136eb7f8d28eed303251');
});
const failed=results.filter(r=>!r.passed).length;console.log(JSON.stringify({passed:results.length-failed,failed,sourceSha256:hash(html),results,scope:'Actual full-source VM, pure-Node Canvas capture, exact SVG replay and scoped CSS assertions. Shared 96x96 frame and conservative bounds. No native raster/layout, keyboard navigation or screen-reader acceptance.'},null,2));process.exitCode=failed?1:0;
