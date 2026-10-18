'use strict';
const fs=require('node:fs'),path=require('node:path');
const {loadGame}=require(path.resolve(__dirname,'../../v292-package-tools/RED/verification/vm-environment.cjs'));
const candidate=path.join(__dirname,'index.html'),base=path.resolve(__dirname,'../../v292-package-tools/RED/index.html');
const proto=loadGame(candidate),prior=loadGame(base),types=['tank','scout','artillery','repair','harvester'],names=['主战坦克','侦察战车','自行火炮','战地维修车','采矿车'];
function capture(game,type,team,angle=0,load=90,phase=0){
 const fill=c=>/^#[0-9a-f]{8}$/i.test(c)?`fill="${c.slice(0,7)}" fill-opacity="${parseInt(c.slice(7),16)/255}"`:`fill="${c}"`;
 const c=game.element('map').getContext('2d'),out=[];let d='';
 c.save=function(){out.push('<g>')};c.restore=function(){out.push('</g></g></g>')};
 c.translate=function(x,y){out.push(`<g transform="translate(${x} ${y})">`)};c.rotate=function(a){out.push(`<g transform="rotate(${a*180/Math.PI})">`)};
 c.fillRect=function(x,y,w,h){out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" ${fill(this.fillStyle)}/>`)};
 c.beginPath=()=>d='';c.moveTo=(x,y)=>d+=`M${x} ${y} `;c.lineTo=(x,y)=>d+=`L${x} ${y} `;c.closePath=()=>d+='Z';
 c.arc=(x,y,r,a,b)=>{d+=`M${x-r} ${y} a${r} ${r} 0 1 0 ${2*r} 0 a${r} ${r} 0 1 0 ${-2*r} 0 `};
 c.fill=function(){out.push(`<path d="${d}" ${fill(this.fillStyle)}/>`)};
 game.run(`globalThis.proofEntity={type:${JSON.stringify(type)},team:${team},r:defs.${type}.r,x:0,y:0,angle:${angle},hp:100,max:100,load:${load}};unitTrackMemory.set(proofEntity,{x:0,y:0,phase:${phase}});drawUnit(proofEntity)`);
 return out.join('');
}
const s=['<svg xmlns="http://www.w3.org/2000/svg" width="1512" height="1090" viewBox="0 0 1512 1090">','<title>RED draw-only prototype: SVG replay of actual drawUnit Canvas commands</title>','<style>text{font-family:"Noto Sans CJK SC",sans-serif}</style>'];
const rect=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`,text=(x,y,t,size=14,c='#d8e0d2')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${c}">${t}</text>`;
function specimen(x,y,k,t,scale=1,a=0,l=90,p=0,old=false){s.push(`<g transform="translate(${x} ${y}) scale(${scale})">${capture(old?prior:proto,k,t,a,l,p)}</g>`)}
s.push(rect(0,0,1512,1090,'#101b17'),text(28,37,'RED / DRAW-ONLY PILOT 02',24,'#e6b38b'),text(28,67,'实际 drawUnit 指令 → SVG 重放；非浏览器截图，未做原生视觉 / FPS 验收',16,'#e1cc8d'),text(28,93,'仅车体与队徽变化 · 选框、血条、地形、特效均未改动 · 背景色块只用于造型对照',12));
s.push(rect(28,112,1456,240,'#223229'),text(42,145,'原版',12),text(42,259,'原型',12));
for(let i=0;i<5;i++){let x=185+i*280;s.push(text(x-45,135,names[i],16));specimen(x,184,types[i],0,2.6,0,90,0,true);specimen(x,290,types[i],0,2.6);specimen(x+92,290,types[i],1,1.4);}
s.push(text(28,384,'三种底色 × 两队 × 三档尺寸；每行依次 坦克 / 侦察 / 火炮 / 维修 / 矿车',16),text(28,407,'后角小队标：6×4 细短条 / 三角 + 暗边。优先保留炮塔、货斗与维修扳手；接受 0.5× 次级标记减弱。',12,'#b4c5b6'));
const terrains=[['林地','#34463a'],['干旱','#514c3d'],['岩地','#3b4649']];
for(let ti=0;ti<3;ti++){let x=28+ti*492;const [label,bg]=terrains[ti];s.push(rect(x,426,472,420,bg),text(x+16,454,label,16));for(let z=0;z<3;z++){let y=475+z*121,scale=[1,.75,.5][z];s.push(rect(x+8,y,456,22,'#18261e'),text(x+16,y+16,`${scale}× 原生绘制尺寸`,12,'#e0c78f'));for(let team=0;team<2;team++){s.push(text(x+16,y+48+team*37,team?'敌':'友',12));for(let i=0;i<5;i++)specimen(x+88+i*78,y+45+team*37,types[i],team,scale)}}}
s.push(rect(28,867,1456,154,'#223229'),text(42,894,'旋转与动态输入对照（2×）：同一 e.angle；轨道相位仍按距离；矿车载量 0 / 90 / 180',14));
for(let i=0;i<5;i++)specimen(110+i*155,960,types[i],i%2,2,[0,.785,1.571,3.142,-.785][i],90,3.5);
for(let i=0;i<3;i++){specimen(1010+i*170,961,'harvester',0,2,0,i*90);s.push(text(995+i*170,1009,String(i*90),12))}
s.push(text(28,1053,'本图直接截获原型 drawUnit 的 fillRect / path / translate / rotate，未另画一套车体。源代码与证据见 prototype 目录。',12,'#b4c5b6'),'</svg>');
fs.writeFileSync(path.join(__dirname,'draw-command-proof.svg'),s.join('\n'));
