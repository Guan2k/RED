'use strict';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const mul=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
function capture(game,type,preview){
 const c=game.element('map').getContext('2d'),out=[],commands=[],stack=[],painted=[];let matrix=[1,0,0,1,0,0],d='',points=[];
 const props=['fillStyle','strokeStyle','globalAlpha','lineWidth','lineJoin','lineCap','miterLimit'];
 Object.assign(c,{fillStyle:'#000000',strokeStyle:'#000000',globalAlpha:1,lineWidth:1,lineJoin:'miter',lineCap:'butt',miterLimit:10});
 const state=()=>Object.fromEntries(props.map(k=>[k,c[k]]));const log=(op,args=[])=>commands.push({op,args});
 c.save=()=>{log('save');stack.push({matrix:[...matrix],...state()})};
 c.restore=()=>{log('restore');if(!stack.length)throw Error('unbalanced restore');const s=stack.pop();matrix=s.matrix;for(const k of props)c[k]=s[k]};
 c.translate=(x,y)=>{log('translate',[x,y]);matrix=mul(matrix,[1,0,0,1,x,y])};
 c.rotate=a=>{log('rotate',[a]);matrix=mul(matrix,[Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0])};
 c.scale=(x,y)=>{log('scale',[x,y]);matrix=mul(matrix,[x,0,0,y,0,0])};
 const paint=stroke=>{let col=stroke?c.strokeStyle:c.fillStyle,alpha=c.globalAlpha;if(/^#[a-f\d]{8}$/i.test(col)){alpha*=parseInt(col.slice(7),16)/255;col=col.slice(0,7)}return `${stroke?'fill="none" stroke':'fill'}="${esc(col)}" ${stroke?'stroke':'fill'}-opacity="${alpha}"${stroke?` stroke-width="${c.lineWidth}" stroke-linejoin="${c.lineJoin}" stroke-linecap="${c.lineCap}" stroke-miterlimit="${c.miterLimit}"`:''} transform="matrix(${matrix.join(' ')})"`};
 function record(op,args,p,stroke=false,rect=false){commands.push({op,args,state:state(),matrix:[...matrix]});let pad=stroke?c.lineWidth/2*(rect?1:c.miterLimit):0;if(stroke&&!rect&&p.length===2&&c.lineCap==='butt'){const [[x1,y1],[x2,y2]]=p,len=Math.hypot(x2-x1,y2-y1),nx=-(y2-y1)/len*c.lineWidth/2,ny=(x2-x1)/len*c.lineWidth/2;p=[[x1+nx,y1+ny],[x1-nx,y1-ny],[x2+nx,y2+ny],[x2-nx,y2-ny]];pad=0}for(const [x,y] of p)for(const dx of [-pad,pad])for(const dy of [-pad,pad])painted.push([matrix[0]*(x+dx)+matrix[2]*(y+dy)+matrix[4],matrix[1]*(x+dx)+matrix[3]*(y+dy)+matrix[5]])}
 for(const [method,stroke]of [['fillRect',false],['strokeRect',true]])c[method]=(x,y,w,h)=>{record(method,[x,y,w,h],[[x,y],[x+w,y],[x+w,y+h],[x,y+h]],stroke,true);out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" ${paint(stroke)}/>`)};
 c.beginPath=()=>{log('beginPath');d='';points=[]};c.moveTo=(x,y)=>{log('moveTo',[x,y]);points.push([x,y]);d+=`M${x} ${y} `};c.lineTo=(x,y)=>{log('lineTo',[x,y]);points.push([x,y]);d+=`L${x} ${y} `};c.closePath=()=>{log('closePath');d+='Z'};
 c.arc=(x,y,r,a,b,ccw=false)=>{log('arc',[x,y,r,a,b,ccw]);if(a!==0||Math.abs(b-2*Math.PI)>1e-10||ccw)throw Error('Unsupported arc');points.push([x-r,y-r],[x+r,y+r]);d+=`M${x+r} ${y} A${r} ${r} 0 1 1 ${x-r} ${y} A${r} ${r} 0 1 1 ${x+r} ${y} `};
 for(const [method,stroke]of [['fill',false],['stroke',true]])c[method]=cached=>{if(cached)throw Error('Unexpected cached path');record(method,[],points,stroke);out.push(`<path d="${d.trim()}" ${paint(stroke)}/>`)};
 for(const method of ['clip','rect','fillText','strokeText','drawImage','ellipse','bezierCurveTo','quadraticCurveTo','setTransform','transform','resetTransform','setLineDash','clearRect'])c[method]=()=>{throw Error('Unexpected Canvas operation: '+method)};
 const before=game.run('JSON.stringify(state)');
 game.run(`globalThis.referenceEntity={id:-100,type:${JSON.stringify(type)},team:0,r:defs[${JSON.stringify(type)}].r,x:0,y:0,angle:0,hp:defs[${JSON.stringify(type)}].hp,max:defs[${JSON.stringify(type)}].hp,build:0};`);
 if(game.run('constructionProgressView(referenceEntity)!==null || factoryProductionView(referenceEntity)!==null'))throw Error('Entity is not completed/idle');
 const entityBefore=game.run('JSON.stringify(referenceEntity)');
 game.run(`${preview?'drawBuildingPreview':'drawBuilding'}(referenceEntity)`);
 if(before!==game.run('JSON.stringify(state)')||entityBefore!==game.run('JSON.stringify(referenceEntity)'))throw Error('Drawing mutated game state/entity');
 if(stack.length||matrix.join(',')!=='1,0,0,1,0,0')throw Error('Unbalanced capture');
 // Conservative stroke envelope includes miter limit. This pure-Node helper makes no raster-fidelity claim.
 return {body:out.join('\n'),commands,bounds:{minX:Math.min(...painted.map(p=>p[0])),maxX:Math.max(...painted.map(p=>p[0])),minY:Math.min(...painted.map(p=>p[1])),maxY:Math.max(...painted.map(p=>p[1]))}};
}
module.exports=capture;
