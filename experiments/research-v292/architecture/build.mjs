import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
export const root = dirname(fileURLToPath(import.meta.url));
export const marker = '/* RED_ARCHITECTURE_PILOT_GEOMETRY */\n';
export const exportSuffix = 'export { dist, clamp };\n';
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
function need(ok, reason) { if (!ok) throw new Error(reason); }
export function assemble(template, module, manifest) {
  need(manifest?.schemaVersion === 1, 'unsupported manifest schema');
  need(typeof template === 'string' && typeof module === 'string', 'inputs must be text');
  need(template.split(marker).length === 2, 'template must contain exactly one unchanged marker');
  need(module.endsWith(exportSuffix) && module.split(exportSuffix).length === 2, 'module must contain exactly one terminal named export');
  need(sha256(template) === manifest.templateSha256, 'template hash mismatch');
  need(sha256(module) === manifest.moduleSha256, 'module hash mismatch');
  const output = Buffer.from(template.replace(marker, module.slice(0, -exportSuffix.length)));
  need(output.length === manifest.baselineBytes && sha256(output) === manifest.baselineSha256, 'baseline identity mismatch');
  return output;
}
export function build(source = root) {
  return assemble(readFileSync(resolve(source, 'src/index.template.html'), 'utf8'),
    readFileSync(resolve(source, 'src/geometry.mjs'), 'utf8'),
    JSON.parse(readFileSync(resolve(source, 'build-manifest.json'), 'utf8')));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  need(process.argv.length === 3, 'usage: node build.mjs OUTPUT (must not exist)');
  const output = build(), target = resolve(process.argv[2]);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, output, { flag: 'wx' });
  console.log(JSON.stringify({ target, bytes: output.length, sha256: sha256(output) }));
}
