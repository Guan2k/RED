'use strict';

// Each mutation is confined to a disposable copy of the provided source file.
// Rejection requires a healthy named case first, then its exact assertion phase.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const source = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const html = fs.readFileSync(source, 'utf8');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const sourceHashBefore = hash(html);
const suite = path.join(__dirname, 'queue-remainder.cjs');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'red-future-queue-negative-'));
const mutantSource = path.join(directory, 'index.html');
const mutations = [];
const action = "function clearFutureQueue(){if(commandBlocked())return;let orders=clearFutureQueueOrders();";
const write = "if(o.kind==='attack')delete o.unit.attackQueue;else o.unit.moveQueue.length=1";
const specs = [
  {
    name:'success_log_reports_wrong_vehicle_counts',
    fault:'The action reports incorrect attack and route vehicle counts despite clearing the intended queues.',
    replacements:[["tell('已清除后续队列：'+parts.join('、')+'；当前指令与抵达后坚守保留，待点选操作保留')","tell('已清除后续队列：攻击99辆、路线99辆；当前指令与抵达后坚守保留，待点选操作保留')"]],
    expected:'mixed_selection_changes_only_eligible_queues',stage:'after_clear',invariant:'only_future_queues_and_one_log_change'
  },
  {
    name:'ground_current_goal_erased',
    fault:'Clearing future waypoints also stops the actual current ground command.',
    replacements:[[write,"if(o.kind==='attack')delete o.unit.attackQueue;else{o.unit.moveQueue.length=1;o.unit.goal=null}"]],
    expected:'ground_ordinary_exact_delta',stage:'after_clear',invariant:'only_future_queues_and_one_log_change'
  },
  {
    name:'ground_queue_replaced_instead_of_truncated',
    fault:'The retained head has the same value but the active movement queue reference is replaced.',
    replacements:[[write,"if(o.kind==='attack')delete o.unit.attackQueue;else o.unit.moveQueue=o.unit.moveQueue.slice(0,1)"]],
    expected:'ground_ordinary_exact_delta',stage:'after_clear',invariant:'current_order_and_navigation_references_preserved'
  },
  {
    name:'arrival_hold_reservation_deleted',
    fault:'The current arrival-hold reservation is lost during queue clearing.',
    replacements:[[write,"if(o.kind==='attack')delete o.unit.attackQueue;else{o.unit.moveQueue.length=1;delete o.unit.holdOnArrival}"]],
    expected:'ground_ordinary_exact_delta',stage:'after_clear',invariant:'only_future_queues_and_one_log_change'
  },
  {
    name:'current_navigation_cache_deleted',
    fault:'The action unnecessarily invalidates current navigation state.',
    replacements:[[write,"navigationMemory.delete(o.unit);if(o.kind==='attack')delete o.unit.attackQueue;else o.unit.moveQueue.length=1"]],
    expected:'ground_ordinary_exact_delta',stage:'after_clear',invariant:'current_order_and_navigation_references_preserved'
  },
  {
    name:'actual_attack_target_replaced_with_raw_head',
    fault:'An attack queue with a current target in the middle is incorrectly retargeted to its raw head.',
    replacements:[[write,"if(o.kind==='attack'){o.unit.target=o.unit.attackQueue[0];delete o.unit.attackQueue}else o.unit.moveQueue.length=1"]],
    expected:'attack_current_middle_preserved',stage:'after_clear',invariant:'only_future_queues_and_one_log_change'
  },
  {
    name:'dead_attack_entry_counts_as_future_command',
    fault:'Raw attack IDs are treated as pending commands even when their targets have died.',
    replacements:[["if(!current||!attackQueueTargets(e).some(target=>target.id!==current.id))continue","if(!current||!e.attackQueue.some(id=>id!==current.id))continue"]],
    expected:'attack_dead_pending_is_noop',stage:'after_rejected_clear',invariant:'world_unchanged'
  },
  {
    name:'sparse_ground_queue_is_accepted',
    fault:'Array.every silently skips missing waypoints, allowing an invalid sparse queue to be cleared.',
    replacements:[["![...q].every(validPoint)","!q.every(validPoint)"]],
    expected:'ground_sparse_point_is_noop',stage:'after_rejected_clear',invariant:'world_unchanged'
  },
  {
    name:'ground_actual_goal_mismatch_ignored',
    fault:'The helper ignores a mismatch between the actual current goal and queue head.',
    replacements:[["||e.goal.x!==q[0].x||e.goal.y!==q[0].y",""]],
    expected:'ground_goal_head_mismatch_is_noop',stage:'after_rejected_clear',invariant:'world_unchanged'
  },
  {
    name:'restart_gate_removed',
    fault:'A queued or direct callback clears orders while the restart prompt is active.',
    replacements:[[action,"function clearFutureQueue(){let orders=clearFutureQueueOrders();"]],
    expected:'gate_restart_blocks_even_direct_callback',stage:'after_blocked_callback',invariant:'world_unchanged'
  },
  {
    name:'readonly_eligibility_prunes_attack_queue',
    fault:'Merely asking for eligible orders rewrites the raw attack queue.',
    replacements:[["let current=attackDisplayTarget(e);if(!current||!attackQueueTargets(e).some(target=>target.id!==current.id))continue","e.attackQueue=attackQueueTargets(e).map(target=>target.id);let current=attackDisplayTarget(e);if(!current||!attackQueueTargets(e).some(target=>target.id!==current.id))continue"]],
    expected:'availability_and_render_are_readonly_and_rng_free',stage:'after_repeated_render',invariant:'world_unchanged'
  },
  {
    name:'pending_point_mode_canceled',
    fault:'Queue clearing also cancels the pending ordinary point command and its input state.',
    replacements:[[action,"function clearFutureQueue(){if(commandBlocked())return;clearOrdinaryCommand();let orders=clearFutureQueueOrders();"]],
    expected:'pending_ordinary_inputs_preserved',stage:'after_clear',invariant:'only_future_queues_and_one_log_change'
  },
  {
    name:'render_time_selection_reused_on_click',
    fault:'Click uses cached eligible units from the last render after the user has changed selection.',
    replacements:[
      ["let futureQueueOrders=clearFutureQueueOrders();","let futureQueueOrders=clearFutureQueueOrders();globalThis.__mutantCachedFutureOrders=futureQueueOrders;"],
      [action,"function clearFutureQueue(){if(commandBlocked())return;let orders=globalThis.__mutantCachedFutureOrders||[];"]
    ],
    expected:'stale_render_selection_removed_revalidated',stage:'after_stale_callback',invariant:'world_unchanged'
  }
];
function run(file) {
  const result=spawnSync(process.execPath,[suite,file],{encoding:'utf8',maxBuffer:32*1024*1024});
  assert.ifError(result.error);
  assert.equal(result.signal,null,'suite must exit normally');
  assert.ok(result.stdout.trim(),'suite must produce a structured report');
  return {status:result.status,report:JSON.parse(result.stdout)};
}
try {
  const healthy=run(source);
  assert.equal(healthy.status,0,'unmodified source must pass before any mutation');
  assert.equal(healthy.report.failed,0,'healthy suite must have no failures');
  assert.equal(healthy.report.passed,healthy.report.total);
  assert.ok(healthy.report.total>=100,'complete focused contract matrix is required');
  assert.equal(healthy.report.sourceHashBefore,sourceHashBefore);
  assert.equal(healthy.report.sourceHashAfter,sourceHashBefore);
  for(const spec of specs){
    const {name,fault,replacements,expected,stage,invariant}=spec;
    try {
      assert.equal(healthy.report.tests.find(test=>test.name===expected)?.passed,true,'exact named healthy case must pass');
      let mutated=html;
      for(const [before,after]of replacements){
        assert.equal(mutated.split(before).length-1,1,`${name}: mutation anchor must occur exactly once`);
        mutated=mutated.replace(before,after);
      }
      fs.writeFileSync(mutantSource,mutated);
      const mutantHash=hash(mutated),mutant=run(mutantSource);
      assert.equal(mutant.status,1,`${name}: behavioral suite rejection required`);
      assert.equal(mutant.report.total,healthy.report.total,`${name}: every focused case must be attempted`);
      assert.ok(mutant.report.failed>0,`${name}: a behavioral failure is required`);
      assert.equal(mutant.report.sourceHashBefore,mutantHash);
      assert.equal(mutant.report.sourceHashAfter,mutantHash);
      const failure=mutant.report.tests.find(test=>test.name===expected&&!test.passed)?.failure;
      assert.ok(failure,`${name}: exact named target must fail`);
      assert.equal(failure.stage,stage,`${name}: exact post-action phase required`);
      assert.equal(failure.invariant,invariant,`${name}: exact contract invariant required`);
      assert.equal(failure.code,'ERR_ASSERTION',`${name}: assertion failure required, not setup or runtime crash`);
      mutations.push({name,passed:true,fault,expected,stage,invariant,failure:{stage:failure.stage,invariant:failure.invariant,code:failure.code},failedCases:mutant.report.failed,mutantHash});
    }catch(error){mutations.push({name,passed:false,fault,expected,stage,invariant,error:error.stack})}
  }
  const sourceHashAfter=hash(fs.readFileSync(source));
  assert.equal(sourceHashAfter,sourceHashBefore,'input source must remain untouched');
  const report={passed:mutations.filter(result=>result.passed).length,failed:mutations.filter(result=>!result.passed).length,
    healthyCasesPassed:healthy.report.passed,source,sourceHashBefore,sourceHashAfter,mutations,
    scope:'Thirteen deliberately corrupted temporary source copies. Healthy control must pass first; each exact named target must fail at its intended post-action phase/invariant with ERR_ASSERTION. Uses the focused component suite and shared VM, portable source argument, no production-file mutation.'};
  console.log(JSON.stringify(report,null,2));
  if(report.failed)process.exitCode=1;
}finally{fs.rmSync(directory,{recursive:true,force:true})}
