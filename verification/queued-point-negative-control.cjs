'use strict';

// Every mutant is a temporary copy. An unrelated crash/setup failure is not a kill.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const source = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const html = fs.readFileSync(source, 'utf8');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const sourceHashBefore = hash(html);
const suite = path.join(__dirname, 'queued-point.cjs');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'red-queued-point-negative-'));
const mutations = [];
function run(file) {
  const result=spawnSync(process.execPath,[suite,file],{encoding:'utf8',maxBuffer:64*1024*1024,timeout:120000});
  assert.ifError(result.error);
  assert.equal(result.signal,null,'suite must exit normally, not crash or time out');
  return {status:result.status,report:JSON.parse(result.stdout)};
}
const specifications=[
  {
    name:'append_replaced_by_ordinary_dispatch',
    fault:'The append mode dispatches an ordinary replacement instead of append=true.',
    before:'if(accept){if(append)issue(p,false,true);else issue(p,false,false);}',
    after:'if(accept){if(append)issue(p,false,false);else issue(p,false,false);}',
    target:'ground_existing_route_matches_shift',stage:'after_release',invariant:'shift_world_equivalence'
  },
  {
    name:'append_issued_on_pointerdown',
    fault:'Armed append mode mutates the command at pointerdown, before a valid release.',
    before:'if(ordinaryCommandMode||appendCommandMode){startOrdinaryPoint(e);return}',
    after:'if(ordinaryCommandMode||appendCommandMode){if(appendCommandMode)issue(mouse,false,true);startOrdinaryPoint(e);return}',
    target:'valid_pointer_release_exactly_once',stage:'after_pointerdown',invariant:'world_unchanged'
  },
  {
    name:'drag_excursion_forgotten_at_release',
    fault:'Dragging beyond the threshold and returning to the start is wrongly accepted.',
    before:'&&!(append?appendCommandReason():ordinaryCommandReason())&&!gesture.moved&&ordinaryMapPoint(p)',
    after:'&&!(append?appendCommandReason():ordinaryCommandReason())&&ordinaryMapPoint(p)',
    target:'gesture_drag_return_does_not_commit',stage:'after_interrupted_release',invariant:'world_unchanged'
  },
  {
    name:'pointer_cancel_leaves_live_gesture',
    fault:'Interrupting a held point no longer clears it, allowing its delayed release to commit.',
    before:'function interruptOrdinaryPoint(e){if(!ordinaryCommandGesture||e&&ordinaryCommandGesture.pointerId!==e.pointerId)return;clearOrdinaryCommand();updateUI()}',
    after:'function interruptOrdinaryPoint(e){if(!ordinaryCommandGesture||e&&ordinaryCommandGesture.pointerId!==e.pointerId)return;updateUI()}',
    target:'gesture_pointercancel_does_not_commit',stage:'after_interrupted_release',invariant:'world_unchanged'
  },
  {
    name:'consumed_activation_validation_bypassed',
    fault:'A delayed native click bypasses token validation and rearms the completed append action.',
    before:"$('appendCommand').onclick=()=>{if(!validAppendActivation()||appendCommandReason())return;",
    after:"$('appendCommand').onclick=()=>{if(appendCommandReason())return;",
    target:'consumed_enter_activation_cannot_rearm',stage:'after_late_click',invariant:'append_disarmed'
  },
  {
    name:'ordinary_preview_allowed_in_append_mode',
    fault:'Append mode advertises ordinary replacement candidates in the existing preview.',
    before:'function ordinaryCommandPreview(p){if(!ordinaryCommandMode||appendCommandMode||!hoverActive',
    after:'function ordinaryCommandPreview(p){if(!(ordinaryCommandMode||appendCommandMode)||!hoverActive',
    target:'append_ui_distinct_and_ordinary_preview_suppressed',stage:'while_append_armed',invariant:'ordinary_preview_suppressed'
  },
  {
    name:'old_battle_point_identity_ignored',
    fault:'A gesture created against a prior battle state is allowed to affect the new state.',
    before:'append=gesture.append===true,accept=e.button===0&&gesture.battle===state&&',
    after:'append=gesture.append===true,accept=e.button===0&&',
    target:'component_battle_identity_change_rejects_old_release',stage:'after_old_battle_release',invariant:'world_unchanged'
  },
  {
    name:'release_skips_live_combat_selection_gate',
    fault:'Append release checks only the battle lifecycle and ignores that all selected combat units died.',
    before:'&&!(append?appendCommandReason():ordinaryCommandReason())&&!gesture.moved',
    after:'&&!(append?commandBlocked():ordinaryCommandReason())&&!gesture.moved',
    target:'gesture_all_selected_dead_does_not_commit',stage:'after_interrupted_release',invariant:'world_unchanged'
  },
  {
    name:'completed_point_gesture_retained',
    fault:'The consumed point gesture is restored after clearing, so duplicate releases append twice.',
    before:'clearOrdinaryCommand();if(accept){if(append)issue(p,false,true);else issue(p,false,false);}',
    after:'let stale=ordinaryCommandGesture;clearOrdinaryCommand();ordinaryCommandGesture=stale;if(accept){if(append)issue(p,false,true);else issue(p,false,false);}',
    target:'valid_pointer_release_exactly_once',stage:'after_duplicate_release',invariant:'world_unchanged'
  },
  {
    name:'ordinary_shift_changes_to_append',
    fault:'Shift incorrectly changes ordinary point mode into an append command.',
    before:'if(accept){if(append)issue(p,false,true);else issue(p,false,false);}',
    after:'if(accept){if(append)issue(p,false,true);else issue(p,false,e.shiftKey);}',
    target:'ordinary_ground_still_matches_nonshift_contextmenu',stage:'after_ordinary_release',invariant:'ordinary_world_equivalence'
  }
];
try {
  const healthy=run(source);
  assert.equal(healthy.status,0,'unmodified source must pass before mutation checks');
  assert.equal(healthy.report.failed,0);
  assert.equal(healthy.report.passed,101);
  assert.equal(healthy.report.total,101);
  assert.equal(healthy.report.sourceHashBefore,sourceHashBefore);
  assert.equal(healthy.report.sourceHashAfter,sourceHashBefore);
  for(const specification of specifications){
    const {name,fault,before,after,target,stage,invariant}=specification;
    try{
      assert.equal(healthy.report.tests.find(t=>t.name===target)?.passed,true,`${target}: healthy target must pass`);
      assert.equal(html.split(before).length-1,1,`${name}: mutation anchor must be unique`);
      const mutant=html.replace(before,after),file=path.join(directory,name+'.html'),mutantHash=hash(mutant);
      assert.notEqual(mutantHash,sourceHashBefore,'mutation must actually change source');
      fs.writeFileSync(file,mutant);
      const result=run(file);
      assert.equal(result.status,1,`${name}: suite must reject mutant normally`);
      assert.equal(result.report.total,healthy.report.total,`${name}: every case must be attempted`);
      assert.ok(result.report.failed>0,`${name}: behavioral failure required`);
      assert.equal(result.report.sourceHashBefore,mutantHash);
      assert.equal(result.report.sourceHashAfter,mutantHash);
      const failure=result.report.tests.find(t=>t.name===target&&!t.passed)?.failure;
      assert.ok(failure,`${target}: exact targeted case must fail`);
      assert.equal(failure.stage,stage,`${target}: exact action phase required`);
      assert.equal(failure.invariant,invariant,`${target}: exact invariant required`);
      assert.equal(failure.code,'ERR_ASSERTION',`${target}: assertion required, not setup/crash failure`);
      mutations.push({name,passed:true,fault,target,stage,invariant,code:failure.code,mutantHash,failedCases:result.report.failed});
    }catch(error){mutations.push({name,passed:false,fault,target,stage,invariant,error:error.stack});}
  }
  const sourceHashAfter=hash(fs.readFileSync(source));
  assert.equal(sourceHashAfter,sourceHashBefore,'production source must remain unchanged');
  const report={passed:mutations.filter(t=>t.passed).length,failed:mutations.filter(t=>!t.passed).length,total:mutations.length,healthyCasesPassed:healthy.report.passed,source,sourceHashBefore,sourceHashAfter,
    scope:'Ten temporary targeted source mutations. Each requires a passing 101-case healthy baseline and the exact named action phase/invariant to fail with ERR_ASSERTION; a setup exception, crash, timeout, or unrelated failing case is insufficient. Unique anchors, complete attempted case count and source hashes are checked. No production edits, save/import/export, browser use or publication.',mutations};
  console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
}finally{fs.rmSync(directory,{recursive:true,force:true});}
