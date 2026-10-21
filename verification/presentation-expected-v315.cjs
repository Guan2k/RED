'use strict';
// Expected historical VM only. Candidate source, paints, commands, world, input,
// storage, exceptions and comparison assertions are never rewritten.
const assert=require('node:assert/strict');
function exact(s,before,after,label){assert.equal(s.split(before).length-1,1,'presentation expected unique '+label);return s.replace(before,after)}
const foundation=`function drawBuildingFoundation(r){
  rect(-r+5,-r+9,r*2,r*2,'#0d171dcc');
  rect(-r-3,-r-3,r*2+6,r*2+6,'#1b2928');
  rect(-r-3,-r-3,r*2+6,2,'#82958a');
  rect(-r-3,-r+1,2,r*2+2,'#61766c');
}`;
const selection=`function drawSelectionFrame(e){
  const x=e.x-e.r-5,y=e.y-e.r-5,w=e.r*2+10,k=Math.min(10,w/3);
  ctx.save();ctx.setLineDash([]);
  ctx.strokeStyle='#10221f';ctx.lineWidth=4;ctx.strokeRect(x,y,w,w);
  ctx.strokeStyle='#b9f5d2';ctx.lineWidth=1;ctx.strokeRect(x,y,w,w);
  // Equivalent square corner bars in one fill; fewer path calls for mass selection.
  ctx.beginPath();ctx.rect(x-1.5,y-1.5,k+1.5,3);ctx.rect(x-1.5,y-1.5,3,k+1.5);
  ctx.rect(x+w-k,y-1.5,k+1.5,3);ctx.rect(x+w-1.5,y-1.5,3,k+1.5);
  ctx.rect(x+w-1.5,y+w-k,3,k+1.5);ctx.rect(x+w-k,y+w-1.5,k+1.5,3);
  ctx.rect(x-1.5,y+w-1.5,k+1.5,3);ctx.rect(x-1.5,y+w-k,3,k+1.5);
  ctx.fillStyle='#b9f5d2';ctx.fill();ctx.restore();
}`;
function extract(source,name){const prefix='function '+name+'(';let i=source.indexOf(prefix);assert.ok(i>=0,'presentation expected function '+name);let start=source.indexOf('{',i),depth=1,j=start+1;for(;depth;j++){if(source[j]==='{')depth++;if(source[j]==='}')depth--}return source.slice(i,j)}
function adaptFunction(s,name,{health=true}={}){
 if(name==='drawBuilding'||name==='drawBuildingPreview')s=exact(s,"rect(-r+5,-r+9,r*2,r*2,'#16231c80');","drawBuildingFoundation(r);",name+' foundation');
 if(name==='drawBuilding')s=exact(s,"rect(-r+6,-r+6,r*2-12,r*2-12,color);","rect(-r+6,-r+6,r*2-12,r*2-12,color);rect(-r+6,-r+6,r*2-12,2,e.team?'#d99278':'#a8c4ae');rect(-r+6,r-8,r*2-12,2,'#142c2980');",'building light edges');
 if(name==='drawUnit'){assert.equal(s.includes("rect(-e.r+1,-e.r+5,e.r*2-2,2,e.team?'#d58a71':'#adc5ad');"),false,'presentation expected unit highlight not already adapted');s=exact(s,"rect(-e.r,-e.r+5,e.r*2,e.r*2-10,color);","rect(-e.r,-e.r+5,e.r*2,e.r*2-10,color);rect(-e.r+1,-e.r+5,e.r*2-2,2,e.team?'#d58a71':'#adc5ad');",'unit highlight');}
 if(name==='drawTerrain'){
  for(const [a,b]of [["frontier?'#5b553c':'#354a37'","frontier?'#5b553c':'#30423b'"],["frontier?'#625a40':'#394d3a'","frontier?'#625a40':'#32443d'"],["for(let [x,y] of terrainAccentTiles)ctx.rect(x,y,40,40);","for(let [x,y] of terrainAccentTiles){ctx.moveTo(x,y+7);ctx.lineTo(x+31,y);ctx.lineTo(x+40,y+23);ctx.lineTo(x+8,y+35);ctx.closePath();}"],["ctx.strokeStyle='#9aba7810'","ctx.strokeStyle='#a8c6b009'"],["ctx.strokeStyle='#596446';ctx.lineWidth=70","ctx.strokeStyle='#24332b';ctx.lineWidth=76"],["1200,90)}ctx.stroke()","1200,90)}ctx.stroke();ctx.strokeStyle='#56604a';ctx.lineWidth=70;ctx.stroke();ctx.strokeStyle='#626b512e';ctx.lineWidth=54;ctx.stroke()"]])s=exact(s,a,b,'terrain');
 }
 if(name==='render'){
  s=exact(s,"if(selection.has(e.id)){ctx.strokeStyle='#b6ee95';ctx.lineWidth=2;ctx.strokeRect(e.x-e.r-5,e.y-e.r-5,e.r*2+10,e.r*2+10)}","if(selection.has(e.id))drawSelectionFrame(e);",'selection frame');
  s=exact(s,"ctx.strokeStyle='#c9f59d';ctx.lineWidth=2;ctx.beginPath();ctx.arc(f.x,f.y,8+p*25,0,Math.PI*2);ctx.stroke()","ctx.strokeStyle='#b9f5d2';ctx.lineWidth=2;ctx.beginPath();ctx.arc(f.x,f.y,8+p*25,0,Math.PI*2);ctx.stroke();rect(f.x-2,f.y-2,4,4,'#e3ffea');ctx.beginPath();ctx.moveTo(f.x-7,f.y);ctx.lineTo(f.x-4,f.y);ctx.moveTo(f.x+4,f.y);ctx.lineTo(f.x+7,f.y);ctx.moveTo(f.x,f.y-7);ctx.lineTo(f.x,f.y-4);ctx.moveTo(f.x,f.y+4);ctx.lineTo(f.x,f.y+7);ctx.stroke()",'order receipt');
  if(health){const y=s.includes('let healthY=')?'healthY':'e.y-e.r-12';s=exact(s,`rect(e.x-e.r,${y},e.r*2,4,'#16231b');rect(e.x-e.r,${y},e.r*2*Math.max(0,e.hp/e.max),4,e.team?'#e78f6a':'#a3db81')`,`rect(e.x-e.r-1,${y}-1,e.r*2+2,6,'#0b171c');rect(e.x-e.r,${y},e.r*2,4,'#34433e');rect(e.x-e.r,${y},e.r*2*Math.max(0,e.hp/e.max),4,e.hp/e.max<.3?'#ffbc78':e.team?'#e78f6a':'#a3db81')`,'health paint');}
 }
 return s;
}
function expectedFunctionSource(source,name,options){return adaptFunction(extract(source,name),name,options)}
function installExpectedPresentation(g,options={}){
 assert.equal(g.run('typeof drawBuildingFoundation'),'undefined','expected adapter is historical only; reject candidate/duplicate');
 g.run(foundation+'\n'+selection);
 for(const name of ['drawBuilding','drawBuildingPreview','drawUnit','drawTerrain','render']){
  if(name==='drawBuildingPreview'&&g.run('typeof drawBuildingPreview')==='undefined')continue;
  const before=g.run(name+'.toString()'),after=adaptFunction(before,name,options);g.run(after);
 }
 g.run('terrainAccentTiles.length=0;for(let y=0;y<HEIGHT;y+=80)for(let x=0;x<WIDTH;x+=80)if(Math.sin(x*13+y*27)>.55)terrainAccentTiles.push([x,y]);');return g;
}
module.exports={installExpectedPresentation,expectedFunctionSource,adaptFunction,extract,foundation,selection};
