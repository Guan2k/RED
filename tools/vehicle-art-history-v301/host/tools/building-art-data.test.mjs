import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import * as art from '../src/art/buildings.mjs';
import { BUILDING_ART_LIMITS, BUILDING_ART_TYPES, validateBuildingArtData } from './building-art-data-validation.mjs';

// Read the actual definitions without importing/evaluating bootstrap/game code.
// Fail closed if its presently flat, literal definition structure changes.
function definitionRadii() {
  const bootstrap = fs.readFileSync(new URL('../src/script/01-bootstrap.jsfrag', import.meta.url), 'utf8');
  const matches = [...bootstrap.matchAll(/^const defs=\{([^\n]+)\};$/gm)];
  assert.equal(matches.length, 1, 'expected exactly one literal gameplay defs declaration');
  const entries = [...matches[0][1].matchAll(/(?:^|,)([a-zA-Z]\w*):\{([^{}]*)\}/g)];
  assert.equal(entries.map(entry => entry[0]).join(''), matches[0][1], 'defs must remain flat literal records');
  assert.equal(new Set(entries.map(entry => entry[1])).size, entries.length, 'duplicate gameplay type');
  return Object.fromEntries(BUILDING_ART_TYPES.map(type => {
    const entry = entries.find(match => match[1] === type);
    assert.ok(entry, `missing gameplay defs.${type}`);
    const radii = [...entry[2].matchAll(/(?:^|,)r:([0-9]+(?:\.[0-9]+)?)(?=,|$)/g)];
    assert.equal(radii.length, 1, `expected one literal radius in defs.${type}`);
    return [type, Number(radii[0][1])];
  }));
}

const actualRadii = definitionRadii();
function deepFreeze(value) {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
function sourceCopy() {
  return structuredClone({
    buildingArtCanonicalRadius: art.buildingArtCanonicalRadius,
    buildingArtGeometry: art.buildingArtGeometry,
    buildingArtRecipes: art.buildingArtRecipes
  });
}
// Validator edge cases use their own tiny fixture. Changing legitimate source
// path order, path count, vertex count or recipe order must not break those tests.
function mutableFixture() {
  const radius = actualRadii.hq;
  return {
    buildingArtCanonicalRadius: { ...actualRadii },
    buildingArtGeometry: [
      ['poly', [-radius, -radius, radius, -radius, radius, radius, -radius, radius]],
      ['poly', [-1, -1, 1, -1, 0, 1]],
      ['circle', [-1, -1, 1]]
    ],
    buildingArtRecipes: Object.fromEntries(BUILDING_ART_TYPES.map(type => [type, [
      ['path', type === 'hq' ? 0 : 1, '#123456', '#654321'],
      ['rect', [-1, -1, 2, 2], '#fff', '#000'],
      ...(type === 'power' ? [['path', 2, '#123456', '#654321']] : [])
    ]]))
  };
}
const fixture = deepFreeze(mutableFixture());
function changed(change) {
  const data = mutableFixture();
  change(data);
  return deepFreeze(data);
}
function validate(data = art, radii = actualRadii) { return validateBuildingArtData(data, radii); }

test('building art exports exactly three deeply frozen data tables and matches actual gameplay radii', () => {
  assert.deepEqual(Object.keys(art).sort(), ['buildingArtCanonicalRadius', 'buildingArtGeometry', 'buildingArtRecipes']);
  assert.deepEqual(art.buildingArtCanonicalRadius, actualRadii);
  assert.doesNotThrow(() => validate());
  assert.throws(() => { art.buildingArtGeometry[0][1][0] = 0; }, TypeError);
  assert.throws(() => { art.buildingArtRecipes.hq[0][2] = '#fff'; }, TypeError);
});

test('building art reports actual cache/render counts and each intended static footprint', () => {
  const result = validate();
  // These are measured, not an equality gate: artists may change geometry/counts
  // within the existing budget without editing frozen acceptance hashes.
  assert.equal(result.counts.paths, art.buildingArtGeometry.length);
  assert.equal(result.counts.polygonVertices, art.buildingArtGeometry.reduce((sum, [kind, values]) => sum + (kind === 'poly' ? values.length / 2 : 0), 0));
  assert.equal(result.counts.circles, art.buildingArtGeometry.filter(([kind]) => kind === 'circle').length);
  assert.equal(result.counts.drawOperations, Object.values(art.buildingArtRecipes).reduce((sum, recipe) => sum + recipe.length, 0));
  assert.equal(result.counts.drawOperations, result.counts.pathReferences + result.counts.rectangles);
  for (const [type, bounds] of Object.entries(result.bounds)) {
    assert.ok(bounds.minX >= -actualRadii[type] && bounds.minY >= -actualRadii[type]);
    assert.ok(bounds.maxX <= actualRadii[type] && bounds.maxY <= actualRadii[type]);
  }
  assert.deepEqual(BUILDING_ART_LIMITS, { paths: 20, polygonVertices: 128, circles: 12 });
});

test('building art accepts valid hex palette edits for both teams without an identity pin', () => {
  const data = sourceCopy();
  data.buildingArtRecipes.hq[0][2] = '#AbC';
  data.buildingArtRecipes.hq[0][3] = '#aBcD';
  data.buildingArtRecipes.power[0][2] = '#aBcD09';
  data.buildingArtRecipes.power[0][3] = '#aBcD09eF';
  assert.doesNotThrow(() => validate(deepFreeze(data)));
});

test('building art accepts in-bounds polygon, circle and rectangle edits', () => {
  const data = sourceCopy();
  for (const shape of data.buildingArtGeometry) shape[1] = shape[1].map(number => number * 0.99);
  for (const recipe of Object.values(data.buildingArtRecipes)) {
    for (const item of recipe) if (item[0] === 'rect') item[1] = item[1].map(number => number * 0.99);
  }
  assert.doesNotThrow(() => validate(deepFreeze(data)));
});

test('building art accepts geometry at the path and vertex budgets', () => {
  const data = changed(copy => {
    while (copy.buildingArtGeometry.length < BUILDING_ART_LIMITS.paths) copy.buildingArtGeometry.push(['poly', [-1, -1, 1, -1, 0, 1]]);
    const vertices = copy.buildingArtGeometry.reduce((sum, [kind, values]) => sum + (kind === 'poly' ? values.length / 2 : 0), 0);
    for (let count = vertices; count < BUILDING_ART_LIMITS.polygonVertices; count++) copy.buildingArtGeometry[0][1].push(0, 0);
  });
  const { counts } = validate(data);
  assert.equal(counts.paths, BUILDING_ART_LIMITS.paths);
  assert.equal(counts.polygonVertices, BUILDING_ART_LIMITS.polygonVertices);
});

test('building art accepts exactly the circle budget', () => {
  const data = changed(copy => {
    for (let count = 1; count < BUILDING_ART_LIMITS.circles; count++) copy.buildingArtGeometry.push(['circle', [0, 0, 1]]);
  });
  assert.equal(validate(data).counts.circles, BUILDING_ART_LIMITS.circles);
});

test('building art bounds are the canonical square, with exact-edge rectangles accepted', () => {
  const radius = actualRadii.turret;
  const data = changed(copy => { copy.buildingArtRecipes.turret.push(['rect', [-radius, -radius, 2 * radius, 2 * radius], '#fff', '#000']); });
  assert.deepEqual(validate(data).bounds.turret, { minX: -radius, minY: -radius, maxX: radius, maxY: radius });
});

const invalidData = [
  ['different canonical radius', copy => { copy.buildingArtCanonicalRadius.hq++; }, /actual gameplay definition radius/],
  ['missing canonical type', copy => { delete copy.buildingArtCanonicalRadius.turret; }, /canonical radii: expected exactly/],
  ['extra canonical type', copy => { copy.buildingArtCanonicalRadius.tank = 13; }, /canonical radii: expected exactly/],
  ['missing recipe type', copy => { delete copy.buildingArtRecipes.power; }, /recipes: expected exactly/],
  ['extra recipe type', copy => { copy.buildingArtRecipes.tank = copy.buildingArtRecipes.turret; }, /recipes: expected exactly/],
  ['unknown shape', copy => { copy.buildingArtGeometry[0][0] = 'ellipse'; }, /shape must be poly or circle/],
  ['extra shape entry', copy => { copy.buildingArtGeometry[0].push(1); }, /expected 2 entries/],
  ['short polygon', copy => { copy.buildingArtGeometry[0][1] = [0, 0, 1, 1]; }, /at least 3 complete coordinate pairs/],
  ['odd polygon coordinates', copy => { copy.buildingArtGeometry[0][1].pop(); }, /complete coordinate pairs/],
  ['nonfinite polygon coordinate', copy => { copy.buildingArtGeometry[0][1][0] = Infinity; }, /finite number/],
  ['nonnumeric polygon coordinate', copy => { copy.buildingArtGeometry[0][1][0] = '1'; }, /finite number/],
  ['sparse polygon coordinates', copy => { delete copy.buildingArtGeometry[0][1][0]; }, /dense array/],
  ['extra circle coordinate', copy => { copy.buildingArtGeometry[2][1].push(0); }, /expected 3 entries/],
  ['nonfinite circle coordinate', copy => { copy.buildingArtGeometry[2][1][0] = NaN; }, /finite number/],
  ['zero circle radius', copy => { copy.buildingArtGeometry[2][1][2] = 0; }, /circle radius must be positive/],
  ['negative circle radius', copy => { copy.buildingArtGeometry[2][1][2] = -1; }, /circle radius must be positive/],
  ['unknown recipe operation', copy => { copy.buildingArtRecipes.hq[0][0] = 'stroke'; }, /operation must be path or rect/],
  ['extra recipe entry', copy => { copy.buildingArtRecipes.hq[0].push(0); }, /expected 4 entries/],
  ['empty recipe', copy => { copy.buildingArtRecipes.hq = []; }, /at least one operation/],
  ['negative path index', copy => { copy.buildingArtRecipes.hq[0][1] = -1; }, /path index/],
  ['fractional path index', copy => { copy.buildingArtRecipes.hq[0][1] = 0.5; }, /path index/],
  ['out-of-range path index', copy => { copy.buildingArtRecipes.hq[0][1] = copy.buildingArtGeometry.length; }, /path index/],
  ['string path index', copy => { copy.buildingArtRecipes.hq[0][1] = '0'; }, /path index/],
  ['short rectangle', copy => { copy.buildingArtRecipes.hq[1][1].pop(); }, /expected 4 entries/],
  ['zero rectangle width', copy => { copy.buildingArtRecipes.hq[1][1][2] = 0; }, /width and height must be positive/],
  ['negative rectangle height', copy => { copy.buildingArtRecipes.hq[1][1][3] = -1; }, /width and height must be positive/],
  ['nonfinite rectangle coordinate', copy => { copy.buildingArtRecipes.hq[1][1][0] = -Infinity; }, /finite number/],
  ['invalid friendly color', copy => { copy.buildingArtRecipes.hq[0][2] = '#gg0000'; }, /friendly color.*CSS hex color/],
  ['invalid enemy color', copy => { copy.buildingArtRecipes.hq[0][3] = '#12345'; }, /enemy color.*CSS hex color/],
  ['color injection suffix', copy => { copy.buildingArtRecipes.hq[0][2] = '#123456;alert(1)'; }, /CSS hex color/],
  ['polygon outside footprint', copy => { copy.buildingArtGeometry[0][1][0] = -actualRadii.hq - 0.001; }, /static body bounds/],
  ['circle edge outside footprint', copy => { copy.buildingArtGeometry[2][1] = [actualRadii.power, 0, 1]; }, /static body bounds/],
  ['rectangle far edge outside footprint', copy => { copy.buildingArtRecipes.hq[1][1] = [actualRadii.hq - 1, 0, 2, 1]; }, /static body bounds/],
  ['rectangle near edge outside footprint', copy => { copy.buildingArtRecipes.hq[1][1] = [-actualRadii.hq - 1, 0, 2, 1]; }, /static body bounds/],
  ['referenced shape too large for receiving recipe', copy => { copy.buildingArtRecipes.turret[0][1] = 0; }, /recipes.turret\[0\].*static body bounds/],
  ['path budget exceeded', copy => { while (copy.buildingArtGeometry.length <= BUILDING_ART_LIMITS.paths) copy.buildingArtGeometry.push(['poly', [0, 0, 1, 0, 0, 1]]); }, /paths budget/],
  ['vertex budget exceeded', copy => { for (let index = 0; index < 128; index++) copy.buildingArtGeometry[0][1].push(0, 0); }, /polygonVertices budget/],
  ['circle budget exceeded', copy => { for (let count = 1; count <= BUILDING_ART_LIMITS.circles; count++) copy.buildingArtGeometry.push(['circle', [0, 0, 1]]); }, /circles budget/],
  ['extra geometry array property', copy => { copy.buildingArtGeometry.extra = 1; }, /dense array/],
  ['nondata recipe property', copy => { copy.buildingArtRecipes.hq.extra = () => 1; }, /plain immutable data/]
];
for (const [name, change, error] of invalidData) {
  test(`building art rejects ${name}`, () => assert.throws(() => validate(changed(change)), error));
}

for (const [name, change] of [
  ['mutable radius table', copy => { copy.buildingArtCanonicalRadius = { ...fixture.buildingArtCanonicalRadius }; }],
  ['mutable geometry table', copy => { copy.buildingArtGeometry = [...fixture.buildingArtGeometry]; }],
  ['mutable polygon coordinates', copy => { copy.buildingArtGeometry = Object.freeze([Object.freeze(['poly', [...fixture.buildingArtGeometry[0][1]]]), ...fixture.buildingArtGeometry.slice(1)]); }],
  ['mutable recipe table', copy => { copy.buildingArtRecipes = { ...fixture.buildingArtRecipes }; }],
  ['mutable recipe operation', copy => { copy.buildingArtRecipes = Object.freeze({ ...fixture.buildingArtRecipes, hq: Object.freeze([[...fixture.buildingArtRecipes.hq[0]], ...fixture.buildingArtRecipes.hq.slice(1)]) }); }],
  ['mutable rectangle coordinates', copy => { const items = [...fixture.buildingArtRecipes.hq]; items[1] = Object.freeze(['rect', [...items[1][1]], items[1][2], items[1][3]]); copy.buildingArtRecipes = Object.freeze({ ...fixture.buildingArtRecipes, hq: Object.freeze(items) }); }]
]) {
  test(`building art rejects ${name}`, () => {
    const data = { ...fixture };
    change(data);
    assert.throws(() => validate(data), /must be recursively frozen/);
  });
}

test('building art rejects accessors without invoking them', () => {
  let invoked = false;
  const radii = { ...art.buildingArtCanonicalRadius };
  Object.defineProperty(radii, 'hq', { enumerable: true, get() { invoked = true; return 40; } });
  assert.throws(() => validate({ ...art, buildingArtCanonicalRadius: Object.freeze(radii) }), /accessor properties/);
  assert.equal(invoked, false);
});

test('building art rejects cyclic frozen data', () => {
  const cycle = [];
  cycle.push(cycle);
  Object.freeze(cycle);
  assert.throws(() => validate({ ...art, buildingArtGeometry: cycle }), /cyclic data/);
});

test('building art rejects invalid or changed actual gameplay radii', () => {
  assert.throws(() => validate(art, { ...actualRadii, hq: actualRadii.hq + 1 }), /actual gameplay definition radius/);
  assert.throws(() => validate(art, { ...actualRadii, hq: NaN }), /finite positive radius/);
  assert.throws(() => validate(art, { ...actualRadii, hq: 0 }), /finite positive radius/);
});
