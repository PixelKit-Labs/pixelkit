/**
 * @file check-docs-contract.js
 * @description Verifies this SDK against the documentation, which is the contract.
 *
 * The documentation lives in PixelKit-Labs/pixelkit-docs, not here, so nothing stops a rename from
 * silently making a page wrong. This closes that gap: the docs are the source of truth and the code
 * is checked against them, rather than the other way round.
 *
 * Three checks:
 *   1. Every hook this package exports has a documentation entry.
 *   2. Every documented hook is actually exported. A page for a hook that no longer exists is worse
 *      than no page: it sends a reader looking for something that was deleted.
 *   3. Every field a page documents under `returns` exists on the hook's declared return type, read
 *      from the built .d.ts. Documenting a field the code does not have is the failure mode nobody
 *      notices, because the docs look complete.
 *
 * Usage: `npm run build` first (this reads build/*.d.ts), then
 *        `node scripts/check-docs-contract.js [path-to-hooks-data]`
 * With no path it shallow-clones the documentation repository.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const LIB = path.join(ROOT, 'packages', 'sdk');
const DOCS_REPO = process.env.PIXELKIT_DOCS_REPO ?? 'https://github.com/PixelKit-Labs/pixelkit-docs.git';

function resolveHooksDir() {
  const given = process.argv[2] ?? process.env.PIXELKIT_HOOKS_DATA;
  if (given) return path.resolve(given);
  const checkout = path.join(ROOT, '.pixelkit-docs');
  fs.rmSync(checkout, { recursive: true, force: true });
  execFileSync('git', ['clone', '--depth', '1', '--filter=blob:none', '--sparse', DOCS_REPO, checkout], { stdio: 'inherit' });
  execFileSync('git', ['sparse-checkout', 'set', 'data/hooks'], { cwd: checkout, stdio: 'inherit' });
  return path.join(checkout, 'data', 'hooks');
}

const hooksDir = resolveHooksDir();
if (!fs.existsSync(hooksDir)) {
  console.error(`No hook definitions at ${hooksDir}`);
  process.exit(1);
}

const documented = new Map();
for (const file of fs.readdirSync(hooksDir).filter((f) => f.endsWith('.json'))) {
  const entry = JSON.parse(fs.readFileSync(path.join(hooksDir, file), 'utf8'));
  documented.set(entry.id, entry);
}

// Exports come from both entry points. Comments are stripped so a hook merely named in a note does
// not count as exported.
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const barrels = ['index.ts', 'mlkit.ts']
  .map((f) => stripComments(fs.readFileSync(path.join(LIB, 'src', f), 'utf8')))
  .join('\n');
const exported = new Set([...barrels.matchAll(/\buse[A-Z]\w*/g)].map((m) => m[0]));

const failures = [];

for (const hook of exported) {
  if (!documented.has(hook)) {
    failures.push(`${hook} is exported but has no entry in the documentation. Add ${hook}.json to data/hooks in pixelkit-docs.`);
  }
}

for (const hook of documented.keys()) {
  if (!exported.has(hook)) {
    failures.push(`${hook} is documented but this SDK does not export it. Remove its page, or export the hook.`);
  }
}

// Every .d.ts in the build, so an interface declared in another module can be resolved.
const ALL_DTS = (function collect(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) collect(full, acc);
    else if (e.name.endsWith('.d.ts')) acc.push(full);
  }
  return acc;
})(path.join(LIB, 'build'));

const INTERFACE_PREFIXES = ['export declare interface ', 'declare interface ', 'export interface ', 'interface '];
const MEMBER_LINE = /^ {4}(\w+)\??:/;

/**
 * Members of a named interface, following `extends` into other modules.
 *
 * Scanned line by line rather than matched with a multiline regex: the declarations are
 * machine-generated and uniformly indented, so a scanner is simpler and harder to get subtly wrong.
 * Following `extends` matters because CapabilitiesState extends DeviceCapabilities from another
 * file; without it, every inherited field reads as undocumented.
 */
function fieldsOfInterface(name, seen = new Set()) {
  if (seen.has(name)) return new Set();
  seen.add(name);
  const out = new Set();

  for (const file of ALL_DTS) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trimStart();
      const prefix = INTERFACE_PREFIXES.find((p) => trimmed.startsWith(p + name));
      if (!prefix) continue;

      const rest = trimmed.slice(prefix.length + name.length);
      // Guard against a longer name that merely starts the same: DeviceCapabilitiesExtra.
      if (rest.length > 0 && rest[0] !== ' ' && rest[0] !== '{') continue;

      const ext = rest.match(/extends\s+([^{]+)/);
      if (ext) {
        for (const parent of ext[1].split(',').map((s) => s.trim()).filter(Boolean)) {
          for (const f of fieldsOfInterface(parent, seen)) out.add(f);
        }
      }

      for (let j = i + 1; j < lines.length && lines[j] !== '}'; j++) {
        const m = lines[j].match(MEMBER_LINE);
        if (m) out.add(m[1]);
      }
    }
  }
  return out;
}

/** Every field name a hook's declared return type exposes, named interface or inline object. */
function declaredFields(hook) {
  for (const dir of ['hardware', 'ai']) {
    const d = path.join(LIB, 'build', dir, `${hook}.d.ts`);
    if (!fs.existsSync(d)) continue;
    const lines = fs.readFileSync(d, 'utf8').split(/\r?\n/);
    const out = new Set();

    for (const line of lines) {
      const m = line.match(/^export (?:interface|type) (\w+)/);
      if (m) for (const f of fieldsOfInterface(m[1])) out.add(f);
    }
    // Hooks that return an inline object literal rather than a named state type.
    for (const line of lines) {
      const m = line.match(MEMBER_LINE);
      if (m) out.add(m[1]);
    }
    return out;
  }
  return null;
}

for (const [hook, entry] of documented) {
  if (!exported.has(hook)) continue;
  const fields = declaredFields(hook);
  if (!fields || fields.size === 0) continue;
  for (const field of entry.returns ?? []) {
    const name = String(field.name).replace(/\(.*$/, '').trim();
    if (!/^\w+$/.test(name)) continue; // documented as a group, e.g. "setTopP(n) / setTopK(n)"
    if (!fields.has(name)) {
      failures.push(`${hook} documents a returned field "${name}" that its declared type does not have.`);
    }
  }
}

/**
 * The README's Hooks section has to name every exported hook.
 *
 * It is the first and often only page anyone reads, on GitHub and on npm, and it is a flat list
 * with no mechanism behind it. It fell 19 behind without anything noticing: it still described 32
 * hooks after the count reached 51, so two thirds of a release were invisible to anyone who did not
 * open the documentation site. Naming them is cheap; leaving it to be remembered was not working.
 */
const readmePath = path.join(__dirname, '..', 'README.md');
if (fs.existsSync(readmePath)) {
  const readme = fs.readFileSync(readmePath, 'utf8');
  const unlisted = [...exported].filter((hook) => !new RegExp(`\\b${hook}\\b`).test(readme));
  if (unlisted.length > 0) {
    failures.push(
      `README.md does not name ${unlisted.length} exported hook(s) in its Hooks section: ${unlisted.join(', ')}.`
    );
  }
}

if (failures.length) {
  console.error(`\nDocumentation contract failed with ${failures.length} problem${failures.length > 1 ? 's' : ''}:\n`);
  for (const f of failures) console.error(`  x ${f}`);
  console.error('');
  process.exit(1);
}

console.log(
  `Documentation contract holds: ${exported.size} exported hooks, all documented; ` +
    `${documented.size} documented hooks, all exported; every documented return field exists on its type.`
);
