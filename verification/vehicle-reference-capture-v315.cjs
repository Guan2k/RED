'use strict';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const mul=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
function capture(game,type,preview){
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

module.exports=capture;
