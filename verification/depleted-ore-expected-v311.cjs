'use strict';
// Expected historical VMs only. One independently specified ground-layer insertion;
// never accept current source and never filter candidate paints or Canvas commands.
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const renderHashes=new Set([
 'a6b7b063bee1db7a6ca65f3366d3386ab1e54b6254fc019a5e86dc598fb2af95', // v293
 '5f0e6c1bcf633a21838ef82b911f2da50169a32f88e679c05fc300799b6c0142', // v294
 '899a85a68d394939be2f86383d7c7df7eedccc6884bc97d6efec152c583291dd', // v295/v296
 '0781182dd2238fb18b6eb7b652034d041aae48dd15d3ee74d94c6523bcc30684', // v300/v301
 '0b59852058244affb8ab82ac0f266cde69a9c6dc6d0e9b9e3d78d57671b032fc'  // v302
]);
const rocksHash='cd5d2405e66695b1d1a042e97ffaf6a29a6621a4e49f63d51abb018454fbcd01';
const slot='drawTerrain();drawCoordinateGrid();drawRocks();';
// Independent endpoints and direct Canvas calls; no product helper or circle().
function expectedDepletedBeds(){
 for(const ore of state.ores){
  if(!(ore.amount<=0))continue;
  ctx.save();ctx.globalAlpha=0.38;
  ctx.beginPath();ctx.arc(ore.x,ore.y,32,0,2*Math.PI);ctx.fillStyle='#62685a';ctx.fill();
  ctx.globalAlpha=0.62;ctx.strokeStyle='#8a8e78';ctx.lineWidth=1;
  ctx.setLineDash([8,10]);ctx.beginPath();ctx.arc(ore.x,ore.y,31.5,0,2*Math.PI);ctx.stroke();ctx.setLineDash([]);
  ctx.globalAlpha=0.65;ctx.strokeStyle='#939580';ctx.lineWidth=1.3;ctx.beginPath();
  ctx.moveTo(ore.x-15,ore.y+1);ctx.lineTo((ore.x-15)+12,(ore.y+1)-9);
  ctx.moveTo(ore.x-7,ore.y+9);ctx.lineTo((ore.x-7)+12,(ore.y+9)-9);
  ctx.moveTo(ore.x+1,ore.y+17);ctx.lineTo((ore.x+1)+12,(ore.y+17)-9);
  ctx.stroke();ctx.restore();
 }
}
const insertion='drawTerrain();drawCoordinateGrid();('+expectedDepletedBeds.toString()+')();drawRocks();';
function expectedRenderFunction(historical){
 assert.ok(renderHashes.has(hash(historical)),'depleted expected-side immutable historical render identity');
 assert.equal(historical.split(slot).length-1,1,'depleted expected-side unique protected layer slot');
 const expected=historical.replace(slot,insertion);
 assert.equal(expected.replace(insertion,slot),historical,'depleted expected-side preserves every other historical render byte');
 return expected;
}
function installExpectedDepletedOreBeds(g){
 const historical=g.run('render.toString()'),rocks=g.run('drawRocks.toString()');
 assert.equal(hash(rocks),rocksHash,'depleted expected-side immutable historical rocks identity');
 const expected=expectedRenderFunction(historical);
 g.run('render = ('+expected+');');
 assert.equal(g.run('drawRocks.toString()'),rocks,'depleted expected-side rocks function unmodified');
 return g;
}
function adapterBoundaryControls(historical,current,rocks){
 const expected=expectedRenderFunction(historical),probes=[
  ['current renderer',current],['double adaptation',expected],
  ['layer reordered',historical.replace(slot,'drawTerrain();drawRocks();drawCoordinateGrid();')],
  ['layer duplicated',historical.replace(slot,slot+slot)],
  ['unrelated command',historical.replace('function render(){','function render(){ctx.save();ctx.restore();')]
 ];
 for(const [name,s] of probes)assert.throws(()=>expectedRenderFunction(s),e=>e.code==='ERR_ASSERTION'&&e.message.startsWith('depleted expected-side immutable historical render identity'),'depleted adapter rejects '+name);
 for(const [name,render,drawRocks,diagnostic] of [
  ['modified historical rocks',historical,rocks+' ', 'rocks'],
  ['current VM',current,rocks,'render'],
  ['already adapted VM',expected,rocks,'render']
 ]){
  let writes=0;const g={run(expression){if(expression==='render.toString()')return render;if(expression==='drawRocks.toString()')return drawRocks;writes++;throw Error('unexpected adapter write')}};
  assert.throws(()=>installExpectedDepletedOreBeds(g),e=>e.code==='ERR_ASSERTION'&&e.message.startsWith('depleted expected-side immutable historical '+diagnostic+' identity'),'depleted adapter rejects '+name);
  assert.equal(writes,0,'depleted adapter rejects '+name+' before any VM writes');
 }
 assert.equal(expected.split(insertion).length-1,1);
 assert.equal(expected.replace(insertion,slot),historical);
 return {rejected:probes.map(p=>p[0]).concat(['modified historical rocks','current VM without writes','already adapted VM without writes']),unchangedHistoricalBytes:true,soleInsertionAfterGridBeforeRocks:true};
}
module.exports=Object.freeze({installExpectedDepletedOreBeds,expectedRenderFunction,adapterBoundaryControls});
