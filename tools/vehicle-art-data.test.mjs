import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import * as art from '../src/art/vehicles.mjs';
import {
  VEHICLE_ART_LIMITS,
  VEHICLE_ART_TYPES,
  VEHICLE_ART_PATH_TYPES,
  validateVehicleArtData
} from './vehicle-art-data-validation.mjs';

// Read the actual literal definitions without importing bootstrap or game code.
// A change to their currently flat structure must fail closed here.
function definitionRadii() {
  const bootstrap = fs.readFileSync(new URL('../src/script/01-bootstrap.jsfrag', import.meta.url), 'utf8');
  const matches = [...bootstrap.matchAll(/^const defs=\{([^\n]+)\};$/gm)];
  assert.equal(matches.length, 1, 'expected exactly one literal gameplay defs declaration');
  const entries = [...matches[0][1].matchAll(/(?:^|,)([a-zA-Z]\w*):\{([^{}]*)\}/g)];
  assert.equal(entries.map(entry => entry[0]).join(''), matches[0][1], 'defs must remain flat literal records');
  assert.equal(new Set(entries.map(entry => entry[1])).size, entries.length, 'duplicate gameplay type');
  return Object.fromEntries(VEHICLE_ART_TYPES.map(type => {
    const entry = entries.find(match => match[1] === type);
    assert.ok(entry, `missing gameplay defs.${type}`);
    const radii = [...entry[2].matchAll(/(?:^|,)r:([0-9]+(?:\.[0-9]+)?)(?=,|$)/g)];
    assert.equal(radii.length, 1, `expected one literal radius in defs.${type}`);
    return [type, Number(radii[0][1])];
  }));
}

const actualRadii = definitionRadii();
const expectedTypes = ['tank', 'scout', 'artillery', 'repair', 'harvester'];
const expectedPathTypes = ['scout', 'scout', 'tank', 'tank', 'tank', 'artillery', 'artillery', 'repair', 'repair', 'repair'];

// Use descriptors so constructing hostile fixtures never evaluates their getters.
function deepFreeze(value, seen = new Set()) {
  if (value !== null && typeof value === 'object' && !seen.has(value)) {
    seen.add(value);
    for (const key of Reflect.ownKeys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (Object.hasOwn(descriptor, 'value')) deepFreeze(descriptor.value, seen);
    }
    Object.freeze(value);
  }
  return value;
}

function assertDeepFrozen(value) {
  assert.ok(Object.isFrozen(value), 'every nested data object must be frozen');
  for (const child of Object.values(value)) {
    if (child !== null && typeof child === 'object') assertDeepFrozen(child);
  }
}

// Negative and budget tests use independent, tiny polygons, not source identity.
function mutableFixture() {
  return {
    unitArtCanonicalRadius: { ...actualRadii },
    unitArtGeometry: expectedPathTypes.map(() => [-1, -1, 1, -1, 0, 1])
  };
}

const fixture = deepFreeze(mutableFixture());
function changed(change) {
  const data = mutableFixture();
  change(data);
  return deepFreeze(data);
}
function validate(data = art, radii = actualRadii) {
  return validateVehicleArtData(data, radii);
}
function regularPolygon(vertices, radius = 1) {
  return Array.from({ length: vertices }, (_, index) => {
    const angle = 2 * Math.PI * index / vertices;
    return [radius * Math.cos(angle), radius * Math.sin(angle)];
  }).flat();
}

test('vehicle art exports exactly two deeply frozen data tables matching actual gameplay radii', () => {
  assert.deepEqual(Object.keys(art).sort(), ['unitArtCanonicalRadius', 'unitArtGeometry']);
  assert.deepEqual(art.unitArtCanonicalRadius, actualRadii);
  assertDeepFrozen(art.unitArtCanonicalRadius);
  assertDeepFrozen(art.unitArtGeometry);
  assert.doesNotThrow(() => validate());
  assert.throws(() => { art.unitArtCanonicalRadius.tank = 0; }, TypeError);
  assert.throws(() => { art.unitArtGeometry[0] = []; }, TypeError);
  assert.throws(() => { art.unitArtGeometry[0][0] = 0; }, TypeError);
});

test('vehicle art publishes frozen type, fixed-slot and conservative budget contracts', () => {
  assert.deepEqual(VEHICLE_ART_TYPES, expectedTypes);
  assert.deepEqual(VEHICLE_ART_PATH_TYPES, expectedPathTypes);
  assert.deepEqual(VEHICLE_ART_LIMITS, { paths: 10, polygonVertices: 63 });
  assertDeepFrozen(VEHICLE_ART_TYPES);
  assertDeepFrozen(VEHICLE_ART_PATH_TYPES);
  assertDeepFrozen(VEHICLE_ART_LIMITS);
});

test('vehicle art fixed slot types match drawUnitPreview geometry and cache references', () => {
  const renderer = fs.readFileSync(new URL('../src/script/03-renderer.jsfrag', import.meta.url), 'utf8');
  const previews = [...renderer.matchAll(/^function drawUnitPreview\(e\)\{([\s\S]*?)^\}/gm)];
  assert.equal(previews.length, 1, 'expected exactly one drawUnitPreview declaration');
  const body = previews[0][1];
  const branches = [...body.matchAll(/\bif\(e\.type==='([a-z]+)'\)/g)];
  assert.deepEqual(branches.map(match => match[1]), ['scout', 'tank', 'artillery', 'repair', 'harvester']);
  const actualPathTypes = [];
  let references = 0;
  for (const [index, branch] of branches.entries()) {
    const source = body.slice(branch.index, branches[index + 1]?.index ?? body.length);
    const calls = [...source.matchAll(/unitArtPoly\(unitArtGeometry\[(\d+)\],[^,\n]+,usePaths\?(\d+):-1\)/g)];
    assert.equal(calls.length, [...source.matchAll(/unitArtGeometry\[/g)].length, 'every static geometry reference must have its matching cache slot');
    for (const call of calls) {
      const path = Number(call[1]);
      assert.equal(path, Number(call[2]), 'geometry and cache indices must match');
      assert.equal(actualPathTypes[path], undefined, 'each fixed geometry slot must be referenced once');
      actualPathTypes[path] = branch[1];
      references++;
    }
  }
  assert.equal(references, VEHICLE_ART_LIMITS.paths);
  assert.deepEqual(actualPathTypes, VEHICLE_ART_PATH_TYPES);
});

test('vehicle art reports measured path and polygon-vertex counts', () => {
  const result = validate();
  assert.deepEqual(result, {
    paths: art.unitArtGeometry.length,
    polygonVertices: art.unitArtGeometry.reduce((sum, polygon) => sum + polygon.length / 2, 0)
  });
  assert.equal(result.paths, 10);
  assert.ok(result.polygonVertices <= VEHICLE_ART_LIMITS.polygonVertices);
  for (const [index, polygon] of art.unitArtGeometry.entries()) {
    const radius = actualRadii[expectedPathTypes[index]];
    assert.ok(polygon.every(value => Number.isFinite(value) && Math.abs(value) <= radius));
  }
});

test('vehicle art accepts the independent three-vertex-per-path fixture', () => {
  assert.deepEqual(validate(fixture), { paths: 10, polygonVertices: 30 });
});

test('vehicle art accepts legitimate source geometry edits without an identity pin', () => {
  const data = structuredClone({
    unitArtCanonicalRadius: art.unitArtCanonicalRadius,
    unitArtGeometry: art.unitArtGeometry
  });
  data.unitArtGeometry = data.unitArtGeometry.map(polygon => polygon.map(value => value * 0.99));
  assert.doesNotThrow(() => validate(deepFreeze(data)));
});

test('vehicle art accepts exactly the conservative 63-vertex budget', () => {
  const data = changed(copy => { copy.unitArtGeometry[0] = regularPolygon(36); });
  assert.deepEqual(validate(data), { paths: 10, polygonVertices: 63 });
});

test('vehicle art rejects one vertex over the conservative budget', () => {
  const data = changed(copy => { copy.unitArtGeometry[0] = regularPolygon(37); });
  assert.throws(() => validate(data), /vertex budget/);
});

test('vehicle art counts repeated and closing vertices toward its budget', () => {
  const data = changed(copy => {
    copy.unitArtGeometry[0] = regularPolygon(36);
    copy.unitArtGeometry[0].push(...copy.unitArtGeometry[0].slice(0, 2));
  });
  assert.throws(() => validate(data), /vertex budget/);
});

test('vehicle art accepts either winding, concavity and a repeated closing point', () => {
  const data = changed(copy => {
    copy.unitArtGeometry[0] = [-1, -1, 0, 1, 1, -1];
    copy.unitArtGeometry[1] = [-2, -2, 2, -2, 0, 0, 2, 2, -2, 2];
    copy.unitArtGeometry[2].push(...copy.unitArtGeometry[2].slice(0, 2));
    copy.unitArtGeometry[3] = [-0, 0, 1, 0, 0, 1];
  });
  assert.deepEqual(validate(data), { paths: 10, polygonVertices: 33 });
});

test('vehicle art accepts plain and null-prototype data records without requiring a frozen wrapper', () => {
  const wrapper = Object.assign(Object.create(null), fixture);
  assert.doesNotThrow(() => validate(wrapper));
  const data = changed(copy => {
    copy.unitArtCanonicalRadius = Object.assign(Object.create(null), actualRadii);
  });
  const radii = Object.assign(Object.create(null), actualRadii);
  assert.doesNotThrow(() => validate(data, radii));
});

test('vehicle art accepts shared immutable polygon references without mistaking them for cycles', () => {
  const data = changed(copy => { copy.unitArtGeometry.fill(copy.unitArtGeometry[0]); });
  assert.deepEqual(validate(data), { paths: 10, polygonVertices: 30 });
});

test('vehicle art validation is repeatable and does not mutate its data or definition radii', () => {
  const radii = Object.freeze({ ...actualRadii });
  const before = structuredClone(fixture);
  assert.deepEqual(validate(fixture, radii), validate(fixture, radii));
  assert.deepEqual(fixture, before);
  assert.deepEqual(radii, actualRadii);
});

for (const [index, type] of expectedPathTypes.entries()) {
  test(`vehicle art accepts all four exact canonical-square edges in ${type} slot ${index}`, () => {
    const radius = actualRadii[type];
    const data = changed(copy => {
      copy.unitArtGeometry[index] = [-radius, -radius, radius, -radius, radius, radius, -radius, radius];
    });
    assert.doesNotThrow(() => validate(data));
  });
  for (const [axis, coordinate] of [['x', 0], ['y', 1]]) {
    for (const sign of [-1, 1]) {
      test(`vehicle art rejects ${sign < 0 ? 'negative' : 'positive'} ${axis} overflow in ${type} slot ${index}`, () => {
        const data = changed(copy => {
          copy.unitArtGeometry[index][coordinate] = sign * (actualRadii[type] + 0.001);
        });
        assert.throws(() => validate(data), /outside canonical body square/);
      });
    }
  }
}

const invalidData = [
  ['missing canonical type', copy => { delete copy.unitArtCanonicalRadius.harvester; }],
  ['extra canonical type', copy => { copy.unitArtCanonicalRadius.hq = 40; }],
  ['changed unused harvester radius', copy => { copy.unitArtCanonicalRadius.harvester++; }],
  ['changed canonical radius', copy => { copy.unitArtCanonicalRadius.tank++; }],
  ['array as canonical radius record', copy => { copy.unitArtCanonicalRadius = Object.assign([], actualRadii); }],
  ['null canonical radius record', copy => { copy.unitArtCanonicalRadius = null; }],
  ['custom-prototype canonical radius record', copy => { copy.unitArtCanonicalRadius = Object.assign(Object.create({ inherited: 1 }), actualRadii); }],
  ['class-instance canonical radius record', copy => { copy.unitArtCanonicalRadius = Object.assign(new (class Radii {})(), actualRadii); }],
  ['symbol canonical radius property', copy => { copy.unitArtCanonicalRadius[Symbol('hidden')] = 1; }],
  ['non-enumerable extra canonical radius property', copy => { Object.defineProperty(copy.unitArtCanonicalRadius, 'hidden', { value: 1 }); }],
  ['missing geometry table', copy => { delete copy.unitArtGeometry; }],
  ['missing radius table', copy => { delete copy.unitArtCanonicalRadius; }],
  ['extra named export', copy => { copy.extra = 1; }],
  ['extra non-enumerable named export', copy => { Object.defineProperty(copy, 'extra', { value: 1 }); }],
  ['extra symbol export', copy => { copy[Symbol('extra')] = 1; }],
  ['module-tag symbol on ordinary record', copy => { copy[Symbol.toStringTag] = 'Module'; }],
  ['null geometry table', copy => { copy.unitArtGeometry = null; }],
  ['record as geometry table', copy => { copy.unitArtGeometry = { ...copy.unitArtGeometry }; }],
  ['empty geometry table', copy => { copy.unitArtGeometry = []; }],
  ['nine fixed path slots', copy => { copy.unitArtGeometry.pop(); }],
  ['eleven fixed path slots', copy => { copy.unitArtGeometry.push([-1, -1, 1, -1, 0, 1]); }],
  ['sparse fixed path slots', copy => { delete copy.unitArtGeometry[5]; }],
  ['extra geometry array property', copy => { copy.unitArtGeometry.extra = 1; }],
  ['extra non-enumerable geometry array property', copy => { Object.defineProperty(copy.unitArtGeometry, 'extra', { value: 1 }); }],
  ['symbol geometry array property', copy => { copy.unitArtGeometry[Symbol('hidden')] = 1; }],
  ['custom-prototype geometry array', copy => { Object.setPrototypeOf(copy.unitArtGeometry, Object.create(Array.prototype)); }],
  ['null-prototype geometry array', copy => { Object.setPrototypeOf(copy.unitArtGeometry, null); }],
  ['record as polygon coordinates', copy => { copy.unitArtGeometry[0] = { ...copy.unitArtGeometry[0] }; }],
  ['null polygon', copy => { copy.unitArtGeometry[0] = null; }],
  ['empty polygon', copy => { copy.unitArtGeometry[0] = []; }],
  ['one-vertex polygon', copy => { copy.unitArtGeometry[0] = [0, 0]; }],
  ['two-vertex polygon', copy => { copy.unitArtGeometry[0] = [0, 0, 1, 1]; }],
  ['incomplete third coordinate pair', copy => { copy.unitArtGeometry[0] = [0, 0, 1, 0, 0]; }],
  ['odd polygon coordinate count', copy => { copy.unitArtGeometry[0].push(1); }],
  ['sparse polygon coordinates', copy => { delete copy.unitArtGeometry[0][0]; }],
  ['extra polygon coordinate property', copy => { copy.unitArtGeometry[0].extra = 1; }],
  ['extra non-enumerable polygon property', copy => { Object.defineProperty(copy.unitArtGeometry[0], 'extra', { value: 1 }); }],
  ['non-index numeric-looking polygon property', copy => { copy.unitArtGeometry[0]['01'] = 1; }],
  ['symbol polygon property', copy => { copy.unitArtGeometry[0][Symbol('hidden')] = 1; }],
  ['custom-prototype polygon array', copy => { Object.setPrototypeOf(copy.unitArtGeometry[0], Object.create(Array.prototype)); }],
  ['null-prototype polygon array', copy => { Object.setPrototypeOf(copy.unitArtGeometry[0], null); }],
  ['one distinct polygon vertex', copy => { copy.unitArtGeometry[0] = [1, 1, 1, 1, 1, 1]; }],
  ['only two distinct polygon vertices', copy => { copy.unitArtGeometry[0] = [0, 0, 1, 1, 0, 0, 1, 1]; }],
  ['three collinear vertices', copy => { copy.unitArtGeometry[0] = [-1, -1, 0, 0, 1, 1]; }],
  ['zero signed-area polygon', copy => { copy.unitArtGeometry[0] = [-1, -1, 1, 1, -1, 1, 1, -1]; }],
  ['nested array coordinate', copy => { copy.unitArtGeometry[0][0] = [1]; }],
  ['nested record coordinate', copy => { copy.unitArtGeometry[0][0] = { value: 1 }; }],
  ['boxed-number coordinate', copy => { copy.unitArtGeometry[0][0] = new Number(1); }],
  ['date coordinate', copy => { copy.unitArtGeometry[0][0] = new Date(0); }],
  ['regular-expression coordinate', copy => { copy.unitArtGeometry[0][0] = /1/; }],
  ['cyclic geometry table', copy => { copy.unitArtGeometry[0] = copy.unitArtGeometry; }],
  ['cyclic polygon', copy => { copy.unitArtGeometry[0][0] = copy.unitArtGeometry[0]; }],
  ['cyclic radius record', copy => { copy.unitArtCanonicalRadius.tank = copy.unitArtCanonicalRadius; }]
];
for (const [name, change] of invalidData) {
  test(`vehicle art rejects ${name}`, () => assert.throws(() => validate(changed(change)), TypeError));
}

for (const [name, value] of [
  ['NaN', NaN], ['positive infinity', Infinity], ['negative infinity', -Infinity],
  ['numeric string', '1'], ['boolean', true], ['null', null], ['undefined', undefined],
  ['bigint', 1n], ['symbol', Symbol('coordinate')], ['function', () => 1]
]) {
  test(`vehicle art rejects ${name} coordinates`, () => {
    assert.throws(() => validate(changed(copy => { copy.unitArtGeometry[0][0] = value; })), TypeError);
  });
  test(`vehicle art rejects ${name} canonical radii`, () => {
    assert.throws(() => validate(changed(copy => { copy.unitArtCanonicalRadius.tank = value; })), TypeError);
  });
}

for (const [name, change] of [
  ['mutable canonical radius table', copy => { copy.unitArtCanonicalRadius = { ...fixture.unitArtCanonicalRadius }; }],
  ['mutable geometry table', copy => { copy.unitArtGeometry = [...fixture.unitArtGeometry]; }],
  ['mutable first polygon', copy => { copy.unitArtGeometry = Object.freeze([[...fixture.unitArtGeometry[0]], ...fixture.unitArtGeometry.slice(1)]); }],
  ['mutable last polygon', copy => { copy.unitArtGeometry = Object.freeze([...fixture.unitArtGeometry.slice(0, -1), [...fixture.unitArtGeometry.at(-1)]]); }],
  ['sealed but unfrozen polygon', copy => { copy.unitArtGeometry = Object.freeze([Object.seal([...fixture.unitArtGeometry[0]]), ...fixture.unitArtGeometry.slice(1)]); }]
]) {
  test(`vehicle art rejects ${name}`, () => {
    const data = { ...fixture };
    change(data);
    assert.throws(() => validate(data), /must be recursively frozen/);
  });
}

for (const [name, select, key] of [
  ['top-level table', copy => copy, 'unitArtGeometry'],
  ['canonical radius', copy => copy.unitArtCanonicalRadius, 'tank'],
  ['geometry slot', copy => copy.unitArtGeometry, '0'],
  ['polygon coordinate', copy => copy.unitArtGeometry[0], '0']
]) {
  test(`vehicle art rejects a ${name} getter without invoking it`, () => {
    let invoked = false;
    const data = changed(copy => {
      Object.defineProperty(select(copy), key, {
        enumerable: true,
        configurable: true,
        get() { invoked = true; throw new Error('getter must not execute'); }
      });
    });
    assert.throws(() => validate(data), /accessor properties/);
    assert.equal(invoked, false);
  });
}

test('vehicle art rejects setter-only properties without invoking them', () => {
  let invoked = false;
  const data = changed(copy => {
    Object.defineProperty(copy.unitArtCanonicalRadius, 'tank', {
      enumerable: true, set() { invoked = true; }
    });
  });
  assert.throws(() => validate(data), /accessor properties/);
  assert.equal(invoked, false);
});

for (const [name, data] of [
  ['undefined', undefined], ['null', null], ['number', 1], ['string', 'data'],
  ['function', () => fixture], ['array', Object.assign([], fixture)],
  ['class instance', Object.assign(new (class Data {})(), fixture)],
  ['custom-prototype record', Object.assign(Object.create({ inherited: 1 }), fixture)]
]) {
  test(`vehicle art rejects ${name} as the data wrapper`, () => {
    assert.throws(() => validateVehicleArtData(data, actualRadii), TypeError);
  });
}

const invalidDefinitionRadii = [
  ['undefined', () => undefined], ['null', () => null], ['array', () => Object.assign([], actualRadii)],
  ['number', () => 1], ['string', () => 'radii'],
  ['missing type', () => { const radii = { ...actualRadii }; delete radii.harvester; return radii; }],
  ['extra type', () => ({ ...actualRadii, hq: 40 })],
  ['inherited type', () => { const radii = { ...actualRadii }; delete radii.tank; return Object.assign(Object.create({ tank: actualRadii.tank }), radii); }],
  ['class instance', () => Object.assign(new (class Radii {})(), actualRadii)],
  ['custom-prototype record', () => Object.assign(Object.create({ inherited: 1 }), actualRadii)],
  ['symbol property', () => ({ ...actualRadii, [Symbol('extra')]: 1 })],
  ['changed gameplay radius', () => ({ ...actualRadii, tank: actualRadii.tank + 1 })],
  ['changed unused harvester radius', () => ({ ...actualRadii, harvester: actualRadii.harvester + 1 })],
  ...[
    ['NaN', NaN], ['positive infinity', Infinity], ['negative infinity', -Infinity],
    ['zero', 0], ['negative radius', -1], ['numeric string', '13'],
    ['boolean', true], ['null radius', null], ['undefined radius', undefined],
    ['boxed radius', new Number(actualRadii.tank)], ['bigint radius', 13n]
  ].map(([name, value]) => [name, () => ({ ...actualRadii, tank: value })])
];
for (const [name, makeRadii] of invalidDefinitionRadii) {
  test(`vehicle art rejects ${name} in actual gameplay definition radii`, () => {
    assert.throws(() => validateVehicleArtData(fixture, makeRadii()), TypeError);
  });
}

test('vehicle art rejects definition-radius accessors without invoking them', () => {
  let invoked = false;
  const radii = { ...actualRadii };
  Object.defineProperty(radii, 'tank', {
    enumerable: true,
    get() { invoked = true; throw new Error('definition getter must not execute'); }
  });
  assert.throws(() => validate(fixture, radii), /accessor properties/);
  assert.equal(invoked, false);
});

test('vehicle art rejects finite coordinates whose signed-area arithmetic overflows', () => {
  const radius = 1e308;
  const radii = Object.fromEntries(expectedTypes.map(type => [type, radius]));
  const data = changed(copy => {
    copy.unitArtCanonicalRadius = { ...radii };
    copy.unitArtGeometry[0] = [-radius, -radius, radius, -radius, 0, radius];
  });
  assert.throws(() => validate(data, radii), /degenerate polygon/);
});
