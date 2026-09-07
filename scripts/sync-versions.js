/**
 * @file sync-versions.js
 * @description Puts every workspace package and the Android versionCode on the root version.
 *
 * Rule 1 bumps `package.json`, `app.json` and `expo.android.versionCode` together. Once the SDK
 * ships from `packages/`, three more manifests have to move with them, and `pixelkit` pins its two
 * native modules by exact version: a mismatch there publishes a package that cannot resolve its own
 * dependencies. This makes that impossible to forget.
 *
 * Usage: `node scripts/sync-versions.js` (after editing the root version), or
 *        `node scripts/sync-versions.js 1.2.0` to set it.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
/** Published npm name -> directory under packages/. They differ: the scope is not a folder. */
const PACKAGES = {
  pixelkit: 'pixelkit',
  '@pixelkit/native': 'native',
  '@pixelkit/mlkit': 'mlkit',
};
const NAMES = Object.keys(PACKAGES);

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJson = (p, o) => fs.writeFileSync(p, JSON.stringify(o, null, 2) + '\n');

const rootPath = path.join(ROOT, 'package.json');
const root = readJson(rootPath);

const requested = process.argv[2];
if (requested) {
  if (!/^\d+\.\d+\.\d+$/.test(requested)) {
    console.error(`Not a version: ${requested}`);
    process.exit(1);
  }
  root.version = requested;
}
const version = root.version;

for (const name of NAMES) {
  root.dependencies[name] = version;
}
writeJson(rootPath, root);

for (const name of NAMES) {
  const p = path.join(ROOT, 'packages', PACKAGES[name], 'package.json');
  const pkg = readJson(p);
  pkg.version = version;
  // pixelkit pins its native modules exactly; they are published from this repo in lockstep.
  for (const dep of NAMES) {
    if (pkg.dependencies && pkg.dependencies[dep]) pkg.dependencies[dep] = version;
  }
  writeJson(p, pkg);
}

const appPath = path.join(ROOT, 'app.json');
const app = readJson(appPath);
const previous = app.expo.version;
app.expo.version = version;
if (previous !== version) app.expo.android.versionCode += 1;
writeJson(appPath, app);

console.log(
  `version ${version} across root + ${NAMES.length} packages; ` +
    `app.json versionCode ${app.expo.android.versionCode}`
);
