from pathlib import Path
v=Path(__file__).resolve().parent.parent/'v315-recovery-integration/RED/verification'
marker='// v315 expected-side presentation adaptation; no candidate stream changes.\n'
def edit(name,func):
 p=v/name;s=p.read_text()
 if marker in s:return
 p.write_text("'use strict';\n"+marker+func(s))
imp="const {installExpectedPresentation,expectedFunctionSource}=require('./presentation-expected-v315.cjs');\n"
def render(s):
 s=imp+s.replace('expectedDepleted=false}={}', 'expectedDepleted=false,expectedPresentation=false}={}').replace('if(expectedDepleted)installExpectedDepletedOreBeds(g);','if(expectedDepleted)installExpectedDepletedOreBeds(g);\n  if(expectedPresentation)installExpectedPresentation(g);').replace('expectedDepleted:true','expectedDepleted:true,expectedPresentation:true').replace("eq(extract(sourceText),extract(baselineText),'old drawUnit stays byte exact')","eq(extract(sourceText).trim(),expectedFunctionSource(baselineText,'drawUnit').trim(),'exact expected current drawUnit presentation')").replace("p.style.color==='#c9f59d'","p.style.color==='#b9f5d2'")
 anchor="    ['polygon-tail-no-effects','state.shots=[];state.fx=[];'],";assert anchor in s;s=s.replace(anchor,anchor+"\n    ['following-friendly-unit-path','selection.clear();state.entities=[get(3),get(4)];state.entities.forEach(e=>{e.hp=e.max;e.goal=null;e.target=null;e.attackQueue=[];e.moveQueue=[];e.guardArea=null;e.escortId=null});state.shots=[];state.fx=[];'],")
 return s.replace('// No HP coordinates or other health-bar fields are adapted or normalized.','// Expected presentation changes HP colors/backing, never the historical Y clamp.\n// This rail adapter does not alter HP coordinates or any health-bar paint fields.')
edit('render-preview-v315.cjs',render)
edit('building-preview-v315.cjs',lambda s:imp+s.replace('installExpectedDepletedOreBeds(g);return g','installExpectedDepletedOreBeds(g);installExpectedPresentation(g);return g').replace('let expected=extract(a);','let expected=expectedFunctionSource(a,fn);'))
edit('building-team-cue-v315.cjs',lambda s:imp+s.replace('installExpectedDepletedOreBeds(g);return g','installExpectedDepletedOreBeds(g);installExpectedPresentation(g);return g').replace("fn(baseText,'drawBuildingPreview'),'preview change exactly one added helper call'","expectedFunctionSource(baseText,'drawBuildingPreview'),'preview change exactly one cue call after exact expected presentation'"))
for name in ['progress-rails-v315.cjs','ore-density-v315.cjs']:edit(name,lambda s:imp+s.replace('installExpectedDepletedOreBeds(g);}', 'installExpectedDepletedOreBeds(g);installExpectedPresentation(g);}'))
edit('low-ore-label-v315.cjs',lambda s:imp+s.replace('if(root===base)installExpectedDepletedOreBeds(g);','if(root===base){installExpectedDepletedOreBeds(g);installExpectedPresentation(g);}'))
edit('depleted-ore-v315-support.cjs',lambda s:imp+s.replace("const g=loadGame(file,{seed:31119,path2D:options.cached?mockPath().P:undefined});","const g=loadGame(file,{seed:31119,path2D:options.cached?mockPath().P:undefined});if(i===1)installExpectedPresentation(g);"))
def negative(s):
 s=s.replace("rect(-r+2','^cached-render/full-frame-all-units'],","rect(-r+2','^cached-render/full-frame-following-friendly-unit-path$'],")
 old='''  "following-unit-consumes-stale-current-path": {
    "failureClass": "AssertionError",
    "caseName": "cached-render/full-frame-all-units-hp-shots-effects",
    "firstLine": "all-units-hp-shots-effects frame 0 paint order, geometry, styles and clip state",'''
 new=old.replace('cached-render/full-frame-all-units-hp-shots-effects','cached-render/full-frame-following-friendly-unit-path').replace('all-units-hp-shots-effects frame 0','following-friendly-unit-path frame 0');assert old in s;return s.replace(old,new)
edit('render-preview-negative-control-v315.cjs',negative)
def gallery(s):
 old="assert.deepEqual(rules.map(r=>[r[1].trim(),r[2]]),expected,";assert old in s;return s.replace(old,"expected.push(['.vehicle-reference-grid li, .building-reference-grid li',' border-color: #476046; background: #1b2f20; padding: 8px; '],['.vehicle-reference-grid svg, .building-reference-grid svg',' border-radius: 4px; ']);"+old)
edit('building-reference-v315.cjs',gallery)
