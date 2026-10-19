'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../v308-work/RED'),source=path.join(root,'index.html');
const {loadGame}=require(path.join(root,'verification/vm-environment.cjs'));
const game=loadGame(source),types=['tank','scout','artillery','repair','harvester'];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const mul=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
function capture(type,preview){
 const c=game.element('map').getContext('2d'),out=[],commands=[],stack=[];let matrix=[1,0,0,1,0,0],d='';
 c.fillStyle='#000000';c.globalAlpha=1;
 const log=(op,args=[])=>commands.push({op,args});
 c.save=()=>{log('save');stack.push({matrix:[...matrix],fillStyle:c.fillStyle,globalAlpha:c.globalAlpha})};
 c.restore=()=>{log('restore');if(!stack.length)throw Error('unbalanced restore');const s=stack.pop();matrix=s.matrix;c.fillStyle=s.fillStyle;c.globalAlpha=s.globalAlpha};
 c.translate=(x,y)=>{log('translate',[x,y]);matrix=mul(matrix,[1,0,0,1,x,y])};
 c.rotate=a=>{log('rotate',[a]);matrix=mul(matrix,[Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0])};
 c.scale=(x,y)=>{log('scale',[x,y]);matrix=mul(matrix,[x,0,0,y,0,0])};
 const paint=()=>{let col=c.fillStyle,alpha=c.globalAlpha;if(/^#[a-f\d]{8}$/i.test(col)){alpha*=parseInt(col.slice(7),16)/255;col=col.slice(0,7)}return `fill="${esc(col)}"${alpha!==1?` fill-opacity="${alpha}"`:''} transform="matrix(${matrix.join(' ')})"`};
 c.fillRect=(x,y,w,h)=>{log('fillRect',[x,y,w,h,c.fillStyle,c.globalAlpha,...matrix]);out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" ${paint()}/>`)};
 c.beginPath=()=>{log('beginPath');d=''};c.moveTo=(x,y)=>{log('moveTo',[x,y]);d+=`M${x} ${y} `};c.lineTo=(x,y)=>{log('lineTo',[x,y]);d+=`L${x} ${y} `};c.closePath=()=>{log('closePath');d+='Z'};
 c.arc=(x,y,r,a,b,ccw=false)=>{log('arc',[x,y,r,a,b,ccw]);if(a!==0||Math.abs(b-2*Math.PI)>1e-10||ccw)throw Error('Unsupported arc: fail closed');d+=`M${x+r} ${y} A${r} ${r} 0 1 1 ${x-r} ${y} A${r} ${r} 0 1 1 ${x+r} ${y} `};
 c.fill=(cached)=>{if(cached)throw Error('Unexpected cached path');log('fill',[c.fillStyle,c.globalAlpha,...matrix]);out.push(`<path d="${d.trim()}" ${paint()}/>`)};
 game.run(`globalThis.referenceEntity={type:${JSON.stringify(type)},team:0,r:defs[${JSON.stringify(type)}].r,x:0,y:0,angle:0,hp:defs[${JSON.stringify(type)}].hp,max:defs[${JSON.stringify(type)}].hp,load:0};unitTrackMemory.set(referenceEntity,{x:0,y:0,phase:0});${preview?'drawUnitPreview':'drawUnit'}(referenceEntity)`);
 if(stack.length||matrix.join(',')!=='1,0,0,1,0,0')throw Error('Unbalanced capture');
 return {body:out.join('\n'),commands};
}
const snippets={},captures={},meta=[];fs.mkdirSync(path.join(__dirname,'snippets'),{recursive:true});
for(const type of types)for(const style of ['default','preview']){
 const {body,commands}=capture(type,style==='preview'),key=`${type}-${style}`;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-24 -24 72 48" width="96" height="64" aria-hidden="true" focusable="false">\n${body}\n</svg>`;
 snippets[key]=svg;captures[key]=commands;fs.writeFileSync(path.join(__dirname,'snippets',key+'.svg'),svg+'\n');meta.push({type,style,name:game.run(`defs.${type}.name`),viewBox:'-24 -24 72 48',width:96,height:64,sha256:sha(svg+'\n')});
}
fs.writeFileSync(path.join(__dirname,'snippets.json'),JSON.stringify(snippets,null,2)+'\n');fs.writeFileSync(path.join(__dirname,'canvas-commands.json'),JSON.stringify(captures,null,2)+'\n');
const text=(x,y,s,size=16,col='#dbe7d5')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${col}">${esc(s)}</text>`;
const rect=(x,y,w,h,col)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${col}"/>`;
let board=[`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1230" viewBox="0 0 1000 1230"><style>text{font-family:'Noto Sans CJK SC',sans-serif}</style>`,rect(0,0,1000,1230,'#101b17'),text(28,40,'RED · 兵种识别缩略图 / 设计证据',24),text(28,72,'当前完整 index VM 的实际 Canvas 指令重放；非浏览器截图',16,'#e1cc8d'),text(28,100,'己方 · 角度 0 · 履带相位 0 · 载矿 0；图形仅供识别',15),text(256,137,'默认外观',18),text(626,137,'可选预览外观',18)];
for(let i=0;i<types.length;i++){
 const type=types[i],y=157+i*198,name=game.run(`defs.${type}.name`);
 board.push(rect(20,y,960,186,'#1c2c23'),text(36,y+43,name,19),text(36,y+70,type,13,'#a8bbaa'));
 for(const [j,style] of ['default','preview'].entries()){
  const x=236+j*370,body=snippets[`${type}-${style}`].match(/>\n([\s\S]*)\n<\/svg>/)[1];
  board.push(rect(x,y+13,96,64,'#354a37'),`<g transform="translate(${x+32} ${y+45}) scale(${4/3})">${body}</g>`,text(x,y+103,'96 × 64',13),text(x,y+125,'实际尺寸',13));
  board.push(rect(x+112,y+13,192,128,'#354a37'),`<g transform="translate(${x+176} ${y+77}) scale(${8/3})">${body}</g>`,text(x+112,y+164,'2× 检查：192 × 128',13));
 }
}
board.push(text(28,1175,'图形为装饰；相邻名称为正文。共享视窗保留火炮长炮管及半透明投影。',15),text(28,1205,'仅展示车体；不含选框、生命条、战况、购买或选择行为。',15),'</svg>');fs.writeFileSync(path.join(__dirname,'vehicle-reference-board.svg'),board.join('\n'));
const manifest={source:'v308-work/RED/index.html',sourceSha256:sha(fs.readFileSync(source)),harnessSha256:sha(fs.readFileSync(path.join(root,'verification/vm-environment.cjs'))),input:{team:0,x:0,y:0,angle:0,phase:0,load:0},capture:'Full current index VM; original drawUnit/drawUnitPreview; cached paths unavailable in VM so current exact direct-command fallback used',snippets:meta};fs.writeFileSync(path.join(__dirname,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
require('sharp')(path.join(__dirname,'vehicle-reference-board.svg')).png().toFile(path.join(__dirname,'vehicle-reference-board.png')).then(()=>console.log(JSON.stringify(manifest,null,2)));
