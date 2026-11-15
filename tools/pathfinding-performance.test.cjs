'use strict';
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {test} = require('node:test');
const source = readFileSync(path.join(__dirname, '../src/script/02-gameplay.jsfrag'), 'utf8');
const baseline = readFileSync(path.join(__dirname, 'fixtures/pathfinding-baseline.cjs'), 'utf8');
const current = ['approachDestination', 'movementSegmentClear', 'findMovementRoute'].map(name => source.split(/\r?\n/).find(line => line.startsWith('function '+name+'('))).join('\n');
function runner(code) {
  let calls = 0, walls = [];
  const context = vm.createContext({
    module: {exports: {}},
    movementObstacles: () => walls,
    terrainObstacles: () => walls,
    WIDTH: 1200, HEIGHT: 800,
    clamp: (n,a,b) => Math.max(a,Math.min(b,n)),
    dist: (a,b) => {calls++; return Math.hypot(a.x-b.x,a.y-b.y);}
  });
  vm.runInContext(code, context);
  return (start, end, obstacles = [], crowd = []) => {
    walls = obstacles; calls = 0;
    const route = context.findMovementRoute(start, end, crowd);
    return {route: JSON.parse(JSON.stringify(route)), calls};
  };
}
const oldRoute = runner(baseline), newRoute = runner(current);
function compare(start, end, walls, crowd) {
  const before = oldRoute(start,end,walls,crowd), after = newRoute(start,end,walls,crowd);
  assert.deepEqual(after.route, before.route);
  assert.ok(after.calls <= before.calls, `${after.calls} > ${before.calls}`);
  return {before,after};
}
const barrier = Array.from({length:16},(_,i)=>({x:600,y:20+i*40,r:25}));
test('direct, blocked start, blocked destination and crowd routes retain exact results', () => {
  compare({x:100,y:100,r:12},{x:1000,y:700},[]);
  compare({x:600,y:100,r:12},{x:1000,y:700},barrier);
  compare({x:100,y:100,r:12},{x:600,y:100},barrier);
  compare({x:100,y:100,r:12},{x:1000,y:100},[],barrier);
});
test('detours preserve waypoints and reduce repeated heuristic distance calculations', () => {
  const {before,after} = compare({x:100,y:100,r:12},{x:1100,y:100},barrier);
  assert.ok(after.route?.length);
  assert.ok(after.calls < before.calls * .6, JSON.stringify({before:before.calls,after:after.calls}));
  console.log(`detour distance evaluations: ${before.calls} -> ${after.calls}`);
});
test('unreachable destinations retain null results', () => {
  const walls = Array.from({length:21},(_,i)=>({x:600,y:i*40,r:25}));
  const {after} = compare({x:100,y:100,r:12},{x:1100,y:100},walls);
  assert.equal(after.route,null);
});
test('seeded obstacle, radius and endpoint variations preserve ordering and tie breaks', () => {
  let seed=15823;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  for(let scenario=0;scenario<100;scenario++) {
    const walls=Array.from({length:8+scenario%18},()=>({x:200+random()*800,y:40+random()*720,r:10+random()*25}));
    compare({x:60,y:40+random()*720,r:[8,12,16,22][scenario%4]},{x:1140,y:40+random()*720},walls);
  }
});
test('changed obstacles, goals and radii do not reuse stale per-search heuristics', () => {
  for(let i=0;i<10;i++) {
    compare({x:100,y:100,r:8+i},{x:1100,y:100+i*40},i%2?barrier:[]);
  }
});
