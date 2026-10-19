// Trusted developer data validation only. The text assembler never imports this module.
// Bounds describe canonical body squares, not collision circles or full dynamic art.
export const VEHICLE_ART_TYPES=Object.freeze(['tank','scout','artillery','repair','harvester']);
export const VEHICLE_ART_PATH_TYPES=Object.freeze(['scout','scout','tank','tank','tank','artillery','artillery','repair','repair','repair']);
// Conservative complexity budget for this adoption; not a Canvas platform limit.
export const VEHICLE_ART_LIMITS=Object.freeze({paths:10,polygonVertices:63});
const need=(ok,where,message)=>{if(!ok)throw new TypeError(where+': '+message)};
function plainFrozen(value,where,ancestors=new Set()){
 if(typeof value==='number'){need(Number.isFinite(value),where,'expected finite number');return}
 need(value!==null&&typeof value==='object',where,'expected immutable numeric data');
 need(!ancestors.has(value),where,'cyclic data refused');
 need(Object.isFrozen(value),where,'must be recursively frozen');
 const proto=Object.getPrototypeOf(value);
 need(Array.isArray(value)?proto===Array.prototype:proto===Object.prototype||proto===null,where,'expected plain record or array');
 ancestors.add(value);
 for(const key of Reflect.ownKeys(value)){
  need(typeof key==='string',where,'symbol keys refused');
  const d=Object.getOwnPropertyDescriptor(value,key);need(Object.hasOwn(d,'value'),where+'.'+key,'accessor properties refused');
  plainFrozen(d.value,where+'.'+key,ancestors);
 }
 ancestors.delete(value);
}
function keys(value,expected,where){
 need(value!==null&&typeof value==='object'&&!Array.isArray(value),where,'expected record');
 need(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null,where,'expected plain record');
 const own=Reflect.ownKeys(value);need(own.length===expected.length&&expected.every(k=>Object.hasOwn(value,k)),where,'unexpected or missing keys');
 for(const k of expected)need(Object.hasOwn(Object.getOwnPropertyDescriptor(value,k),'value'),where+'.'+k,'accessor properties refused');
}
function dense(value,where){
 need(Array.isArray(value),where,'expected array');
 need(Reflect.ownKeys(value).length===value.length+1&&Array.from({length:value.length},(_,i)=>Object.hasOwn(value,i)).every(Boolean),where,'expected dense array without extra properties');
}
export function validateVehicleArtData(data,definitionRadii){
 // ES module namespaces have a mandated Symbol.toStringTag. Validate their named
 // exports without reading accessors; ordinary records must have exactly two keys.
 need(data!==null&&typeof data==='object'&&!Array.isArray(data),'vehicle art','expected module namespace or plain record');
 need(Object.getPrototypeOf(data)===null||Object.getPrototypeOf(data)===Object.prototype,'vehicle art','expected module namespace or plain record');
 const names=Object.getOwnPropertyNames(data);
 need(names.length===2&&names.includes('unitArtCanonicalRadius')&&names.includes('unitArtGeometry'),'vehicle art','expected exactly two named exports');
 for(const k of names)need(Object.hasOwn(Object.getOwnPropertyDescriptor(data,k),'value'),'vehicle art.'+k,'accessor properties refused');
 const symbols=Object.getOwnPropertySymbols(data);need(symbols.length===0||(symbols.length===1&&symbols[0]===Symbol.toStringTag&&Object.getPrototypeOf(data)===null&&Object.getOwnPropertyDescriptor(data,Symbol.toStringTag)?.value==='Module'),'vehicle art','unexpected symbol keys');
 const {unitArtCanonicalRadius:radii,unitArtGeometry:geometry}=data;
 plainFrozen(radii,'canonical radii');plainFrozen(geometry,'geometry');
 keys(radii,VEHICLE_ART_TYPES,'canonical radii');keys(definitionRadii,VEHICLE_ART_TYPES,'definition radii');
 for(const type of VEHICLE_ART_TYPES){need(typeof definitionRadii[type]==='number'&&Number.isFinite(definitionRadii[type])&&definitionRadii[type]>0,'definition radii.'+type,'expected finite positive radius');need(radii[type]===definitionRadii[type],'canonical radii.'+type,'must equal gameplay definition radius')}
 dense(geometry,'geometry');need(geometry.length===VEHICLE_ART_LIMITS.paths,'geometry','expected exactly ten fixed path slots');
 let polygonVertices=0;
 geometry.forEach((polygon,index)=>{
  const where='geometry['+index+']';dense(polygon,where);need(polygon.length>=6&&polygon.length%2===0,where,'expected at least three coordinate pairs');
  const radius=radii[VEHICLE_ART_PATH_TYPES[index]];let area=0;const distinct=new Set();
  for(let i=0;i<polygon.length;i+=2){const x=polygon[i],y=polygon[i+1],j=(i+2)%polygon.length;need(typeof x==='number'&&typeof y==='number'&&Number.isFinite(x)&&Number.isFinite(y),where,'expected finite numeric coordinates');need(Math.abs(x)<=radius&&Math.abs(y)<=radius,where,'outside canonical body square');area+=x*polygon[j+1]-polygon[j]*y;distinct.add(x+','+y)}
  need(distinct.size>=3&&Number.isFinite(area)&&Math.abs(area)>0,where,'degenerate polygon');polygonVertices+=polygon.length/2;
 });
 need(polygonVertices<=VEHICLE_ART_LIMITS.polygonVertices,'geometry','conservative vertex budget exceeded');
 return {paths:geometry.length,polygonVertices};
}
