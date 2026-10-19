// Development-only validation. The assembler must not import/execute art source.
// The footprint is an axis-aligned square, as used by the existing renderer;
// it is not the Euclidean collision circle. Dynamic details are out of scope.
export const BUILDING_ART_LIMITS = Object.freeze({ paths: 20, polygonVertices: 128, circles: 12 });
export const BUILDING_ART_TYPES = Object.freeze(['hq', 'power', 'refinery', 'factory', 'turret']);

function requireThat(condition, location, detail) {
  if (!condition) throw new TypeError(`${location}: ${detail}`);
}

function immutableData(value, location, ancestors = new Set()) {
  if (typeof value === 'number') {
    requireThat(Number.isFinite(value), location, 'expected a finite number');
    return;
  }
  if (typeof value === 'string') return;
  requireThat(value !== null && typeof value === 'object', location, 'expected plain immutable data');
  requireThat(!ancestors.has(value), location, 'cyclic data is not supported');
  requireThat(Object.isFrozen(value), location, 'must be recursively frozen');
  const prototype = Object.getPrototypeOf(value);
  requireThat(Array.isArray(value) ? prototype === Array.prototype : prototype === Object.prototype || prototype === null,
    location, 'expected a plain object or array');
  ancestors.add(value);
  for (const key of Reflect.ownKeys(value)) {
    requireThat(typeof key === 'string', location, 'symbol keys are not supported');
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    requireThat(Object.hasOwn(descriptor, 'value'), `${location}.${key}`, 'accessor properties are not data');
    immutableData(descriptor.value, `${location}.${key}`, ancestors);
  }
  ancestors.delete(value);
}

function record(value, location, keys) {
  requireThat(value !== null && typeof value === 'object' && !Array.isArray(value), location, 'expected a record');
  const ownKeys = Reflect.ownKeys(value);
  requireThat(ownKeys.length === keys.length && keys.every(key => Object.hasOwn(value, key)),
    location, `expected exactly these keys: ${keys.join(', ')}`);
}

function array(value, location, length) {
  requireThat(Array.isArray(value), location, 'expected an array');
  if (length !== undefined) requireThat(value.length === length, location, `expected ${length} entries`);
  requireThat(Reflect.ownKeys(value).length === value.length + 1
    && Array.from({ length: value.length }, (_, index) => Object.hasOwn(value, index)).every(Boolean),
  location, 'expected a dense array without extra properties');
}

function finiteNumbers(value, location, length) {
  array(value, location, length);
  value.forEach((number, index) => requireThat(typeof number === 'number' && Number.isFinite(number),
    `${location}[${index}]`, 'expected a finite number'));
}

function color(value, location) {
  // This data format deliberately supports portable CSS hex colors only.
  requireThat(typeof value === 'string' && /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value),
    location, 'expected a CSS hex color (#RGB, #RGBA, #RRGGBB or #RRGGBBAA)');
}

function polygonBounds(coordinates) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let index = 0; index < coordinates.length; index += 2) {
    minX = Math.min(minX, coordinates[index]); maxX = Math.max(maxX, coordinates[index]);
    minY = Math.min(minY, coordinates[index + 1]); maxY = Math.max(maxY, coordinates[index + 1]);
  }
  return { minX, minY, maxX, maxY };
}

/** Validate directly imported, trusted art data against radii read from gameplay defs.
 * No source hashes are pinned. Valid in-budget geometry/color edits remain valid.
 * Counts include every cached geometry entry, even if no recipe references it.
 */
export function validateBuildingArtData(data, definitionRadii) {
  requireThat(data !== null && typeof data === 'object', 'building art', 'expected module data');
  record(definitionRadii, 'definition radii', BUILDING_ART_TYPES);
  const { buildingArtCanonicalRadius: radii, buildingArtGeometry: geometry, buildingArtRecipes: recipes } = data;
  for (const [name, value] of [['canonical radii', radii], ['geometry', geometry], ['recipes', recipes]]) immutableData(value, name);
  record(radii, 'canonical radii', BUILDING_ART_TYPES);
  record(recipes, 'recipes', BUILDING_ART_TYPES);
  for (const type of BUILDING_ART_TYPES) {
    requireThat(typeof definitionRadii[type] === 'number' && Number.isFinite(definitionRadii[type]) && definitionRadii[type] > 0,
      `definition radii.${type}`, 'expected a finite positive radius');
    requireThat(radii[type] === definitionRadii[type], `canonical radii.${type}`, 'must equal the actual gameplay definition radius');
  }

  array(geometry, 'geometry');
  requireThat(geometry.length > 0, 'geometry', 'must contain at least one path');
  const counts = { paths: geometry.length, polygonVertices: 0, circles: 0, pathReferences: 0, rectangles: 0, drawOperations: 0 };
  const pathBounds = geometry.map((shape, index) => {
    const location = `geometry[${index}]`;
    array(shape, location, 2);
    const [kind, coordinates] = shape;
    requireThat(kind === 'poly' || kind === 'circle', location, 'shape must be poly or circle');
    finiteNumbers(coordinates, `${location} coordinates`, kind === 'circle' ? 3 : undefined);
    if (kind === 'circle') {
      const [x, y, radius] = coordinates;
      requireThat(radius > 0, location, 'circle radius must be positive');
      counts.circles++;
      return { minX: x - radius, minY: y - radius, maxX: x + radius, maxY: y + radius };
    }
    requireThat(coordinates.length >= 6 && coordinates.length % 2 === 0, location, 'polygon must have at least 3 complete coordinate pairs');
    counts.polygonVertices += coordinates.length / 2;
    return polygonBounds(coordinates);
  });
  for (const [name, limit] of Object.entries(BUILDING_ART_LIMITS)) {
    requireThat(counts[name] <= limit, `geometry ${name} budget`, `${counts[name]} exceeds ${limit}`);
  }

  const bounds = {};
  for (const type of BUILDING_ART_TYPES) {
    const recipe = recipes[type], radius = radii[type];
    array(recipe, `recipes.${type}`);
    requireThat(recipe.length > 0, `recipes.${type}`, 'must contain at least one operation');
    const body = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    recipe.forEach((item, index) => {
      const location = `recipes.${type}[${index}]`;
      array(item, location, 4);
      const [kind, argument, friendlyColor, enemyColor] = item;
      requireThat(kind === 'path' || kind === 'rect', location, 'operation must be path or rect');
      color(friendlyColor, `${location} friendly color`);
      color(enemyColor, `${location} enemy color`);
      let itemBounds;
      if (kind === 'path') {
        requireThat(Number.isInteger(argument) && argument >= 0 && argument < geometry.length,
          `${location} path index`, 'must reference an existing geometry entry');
        itemBounds = pathBounds[argument];
        counts.pathReferences++;
      } else {
        finiteNumbers(argument, `${location} rectangle`, 4);
        const [x, y, width, height] = argument;
        requireThat(width > 0 && height > 0, `${location} rectangle`, 'width and height must be positive');
        itemBounds = { minX: x, minY: y, maxX: x + width, maxY: y + height };
        counts.rectangles++;
      }
      counts.drawOperations++;
      requireThat(Object.values(itemBounds).every(Number.isFinite), location, 'bounds must be finite');
      requireThat(itemBounds.minX >= -radius && itemBounds.minY >= -radius
        && itemBounds.maxX <= radius && itemBounds.maxY <= radius,
      location, `static body bounds must stay inside the canonical footprint [-${radius}, ${radius}] on both axes`);
      body.minX = Math.min(body.minX, itemBounds.minX); body.minY = Math.min(body.minY, itemBounds.minY);
      body.maxX = Math.max(body.maxX, itemBounds.maxX); body.maxY = Math.max(body.maxY, itemBounds.maxY);
    });
    bounds[type] = Object.freeze(body);
  }
  return Object.freeze({ counts: Object.freeze(counts), bounds: Object.freeze(bounds) });
}
