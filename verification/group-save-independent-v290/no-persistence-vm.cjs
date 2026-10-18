// NEW 2026-10-13 harness. No recovered historical suite or browser fidelity claim.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function loadGame(source = path.resolve(__dirname, '../index.html'), options = {}) {
  const html = fs.readFileSync(source, 'utf8').replace('updateUnitReference();reset();refreshSaveSlotStatus();battleSaveProgressTick();requestAnimationFrame(frame);', 'refreshSaveSlotStatus=()=>{};refreshSaveOverview=()=>{};updateBattleSaveProgress=()=>{};battleSaveProgressTick=()=>{};updateUnitReference();reset();requestAnimationFrame(frame);'), elements = [], ids = new Map(), listeners = new Map(), storage = new Map(), raf = [], timers = [];
  let document;
  const canvas = new Proxy({measureText:s=>({width:String(s).length*7}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})}, {get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
  class Element {
    constructor(tag, attrs={}) { this.tagName=tag.toUpperCase();this.children=[];this.parentNode=null;this.style={};this.dataset={};this.attributes=attrs;this.value=attrs.value||'';this.textContent='';this.hidden='hidden' in attrs;this.disabled='disabled' in attrs;this.isContentEditable=false;this.listeners={};this.id=attrs.id||'';const classes=new Set((attrs.class||'').split(/\s+/).filter(Boolean));this.classList={add:(...a)=>a.forEach(x=>classes.add(x)),remove:(...a)=>a.forEach(x=>classes.delete(x)),contains:x=>classes.has(x),toggle:(x,force)=>{const v=force??!classes.has(x);v?classes.add(x):classes.delete(x);return v}}; for(const [k,v] of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,x)=>x.toUpperCase())]=v;elements.push(this);if(this.id)ids.set(this.id,this); }
    appendChild(n){if(n.parentNode)n.parentNode.removeChild(n);this.children.push(n);n.parentNode=this;return n}
    insertBefore(n,b){if(n===b)return n;if(n.parentNode)n.parentNode.removeChild(n);const i=this.children.indexOf(b);if(i<0)this.children.push(n);else this.children.splice(i,0,n);n.parentNode=this;return n}
    removeChild(n){const i=this.children.indexOf(n);if(i>=0)this.children.splice(i,1);n.parentNode=null;return n}
    remove(){this.parentNode?.removeChild(this)}
    get childNodes(){return this.children} get firstChild(){return this.children[0]||null} get nextSibling(){return this.parentNode?.children[this.parentNode.children.indexOf(this)+1]||null} get isConnected(){return !!this.parentNode||this.tagName==='HTML'}
    setAttribute(k,v){this.attributes[k]=String(v)} getAttribute(k){return this.attributes[k]??null} removeAttribute(k){delete this.attributes[k]}
    addEventListener(k,f){(this.listeners[k]??=[]).push(f)}
    dispatchEvent(e){e.target??=this;e.preventDefault??=()=>{};this['on'+e.type]?.(e);for(const f of this.listeners[e.type]||[])f(e);return true}
    click(e={}){if(!this.disabled)this.dispatchEvent({type:'click',...e})}
    focus(){document.activeElement=this} blur(){document.activeElement=document.body}
    contains(n){return n===this||this.children.some(c=>c.contains(n))}
    getContext(){return canvas} getBoundingClientRect(){return {left:0,top:0,width:1200,height:800,right:1200,bottom:800}}
    setPointerCapture(){} releasePointerCapture(){} hasPointerCapture(){return false}
  }
  // Parse static markup and select defaults; script text is never treated as HTML.
  const markup=html.split('<script')[0], stack=[];
  for(const m of markup.matchAll(/<\/?([a-z][\w-]*)([^>]*)>/gi)) {const tag=m[1].toLowerCase();if(m[0].startsWith('</')){let i=stack.map(x=>x.tagName.toLowerCase()).lastIndexOf(tag);if(i>=0)stack.length=i;continue}const attrs={};for(const a of m[2].matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))attrs[a[1]]=a[2]??a[3]??a[4]??'';const n=new Element(tag,attrs);stack.at(-1)?.appendChild(n);if(!['meta','link','input','br','hr','img'].includes(tag))stack.push(n);}
  for(const n of elements.filter(x=>x.tagName==='SELECT')){const opts=n.children.filter(x=>x.tagName==='OPTION');n.value=(opts.find(x=>'selected'in x.attributes)||opts[0])?.value||''}
  document={body:elements.find(x=>x.tagName==='BODY'),hidden:false,getElementById:id=>ids.get(id)||null,createElement:t=>new Element(t),querySelectorAll:s=>{const m=s.match(/^\[([^=\]]+)(?:=['"]?([^'"\]]+)['"]?)?\]$/);if(!m)throw Error('Unsupported selector '+s);return elements.filter(n=>m[1]in n.attributes&&(m[2]===undefined||n.attributes[m[1]]===m[2]))},addEventListener:(k,f)=>{(listeners.get('document:'+k)||listeners.set('document:'+k,[]).get('document:'+k)).push(f)}};document.activeElement=document.body;
  const context=vm.createContext({console,document,localStorage:{getItem:()=>{throw Error('Forbidden persistence read')},setItem:()=>{throw Error('Forbidden persistence write')},removeItem:()=>{throw Error('Forbidden persistence deletion')}},performance:{now:()=>0},requestAnimationFrame:f=>(raf.push(f),raf.length),cancelAnimationFrame(){},setTimeout:(f,ms)=>(timers.push({f,ms}),timers.length),clearTimeout(){},setInterval:(f,ms)=>(timers.push({f,ms,interval:true}),timers.length),clearInterval(){},Blob,URL,TextEncoder,TextDecoder});
  context.window=context;context.devicePixelRatio=1;context.confirm=()=>true;context.addEventListener=(k,f)=>{(listeners.get(k)||listeners.set(k,[]).get(k)).push(f)};
  let seed=(options.seed??198199)>>>0;context.__harnessRandom=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};vm.runInContext('Math.random=__harnessRandom',context);
  const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];if(scripts.length!==1)throw Error('Expected one inline source script');vm.runInContext(scripts[0][1],context,{filename:source,timeout:10000});
  const run=(expression)=>vm.runInContext(expression,context,{timeout:10000});
  return {source,run,context,storage,document,elements,raf,timers,get state(){return run('state')},element:id=>document.getElementById(id),click:(id,e)=>{const n=document.getElementById(id);if(!n)throw Error('Missing element '+id);n.click(e)},start(){this.click('start');return this},step(seconds,dt=.05){for(let t=0;t<seconds;t+=dt)run(`advanceSimulation(${Math.min(dt,seconds-t)})`)},dispatch(type,event={}){event.preventDefault??=()=>{};event.target??=document.body;for(const f of listeners.get(type)||[])f(event)}};
}
module.exports={loadGame};
