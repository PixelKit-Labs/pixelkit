#!/usr/bin/env node
/**
 * @file check-parity.js
 * @description Fails when the app stops representing the SDK.
 *
 * Three things drifted before this existed: hooks were exported and documented but had no screen
 * (nine of them), documented functions had no control anywhere, and a handler taking arguments was
 * passed straight to onPress so the press event became its first argument. This checks all three.
 *
 * Run: npm run parity
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
/**
 * The interface files for each tab. AI Lab is a directory: the screen composes six section
 * components beside it. src/screens/docs is deliberately absent — it holds the documentation
 * entries, and their example code must not count as a control that exists.
 */
const TAB_SOURCES = {
  silicon: ['DashboardScreen.tsx'],
  ai: ['AILabScreen.tsx', 'ailab'],
  sensors: ['SensorsLabScreen.tsx'],
  docs: ['DocsScreen.tsx'],
};

const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

/** Every source file behind one tab: the screen, plus each component in its section directory. */
function tabSource(tab) {
  const parts = [];
  for (const entry of TAB_SOURCES[tab]) {
    const full = path.join(ROOT, 'src', 'screens', entry);
    if (fs.statSync(full).isDirectory()) {
      for (const f of fs.readdirSync(full)) parts.push(fs.readFileSync(path.join(full, f), 'utf8'));
    } else {
      parts.push(fs.readFileSync(full, 'utf8'));
    }
  }
  return parts.join(String.fromCharCode(10));
}

const WAIVED = require('./parity-waivers.json');

const failures = [];
const waivedSeen = [];

const surface = read(path.join('src', 'core', 'surface.ts'));
const homes = {};
for (const m of surface.matchAll(/^ {2}(use\w+): \{ tab: '(\w+)', section: '(\w+)' \},$/gm)) {
  homes[m[1]] = { tab: m[2], section: m[3] };
}

const indexSrc = read(path.join('src', 'index.ts'));
const exportedHooks = [...new Set([...indexSrc.matchAll(/\buse[A-Z]\w+/g)].map((m) => m[0]))];
const screenSources = Object.fromEntries(Object.keys(TAB_SOURCES).map((tab) => [tab, tabSource(tab)]));
const allScreens = Object.values(screenSources).join('\n');

// 1. Every exported hook has a home, and that home screen actually calls it.
for (const hook of exportedHooks) {
  const home = homes[hook];
  if (!home) {
    failures.push(hook + ' is exported from src/index.ts but has no entry in src/core/surface.ts');
    continue;
  }
  if (!TAB_SOURCES[home.tab]) {
    failures.push(hook + ' is homed on the unknown tab "' + home.tab + '"');
    continue;
  }
  if (!screenSources[home.tab].includes(hook + '(')) {
    failures.push(hook + ' is homed on the ' + home.tab + ' tab but nothing there calls it');
  }
}

// 2. Every documented action is reachable from some screen, or waived with a reason.
// The entries live one file per category under src/screens/docs; docsData.ts only assembles them.
const docsDir = path.join(ROOT, 'src', 'screens', 'docs');
const docsData = fs
  .readdirSync(docsDir)
  .filter((f) => f.endsWith('.ts') && f !== 'shared.ts')
  .map((f) => fs.readFileSync(path.join(docsDir, f), 'utf8'))
  .join(String.fromCharCode(10));
if (!docsData.includes('actions:')) {
  failures.push('no documentation entries found under src/screens/docs — the action check would silently pass');
}
let currentModule = null;
let inActions = false;
for (const line of docsData.split('\n')) {
  const idMatch = line.match(/^ {4}id: '(\w+)',$/);
  if (idMatch) { currentModule = idMatch[1]; inActions = false; continue; }
  if (/^ {4}actions: \[/.test(line)) { inActions = true; continue; }
  if (inActions && /^ {4}\],/.test(line)) { inActions = false; continue; }
  if (!inActions || !currentModule) continue;

  const nameMatch = line.match(/^\s+name: '([a-zA-Z]\w*)/);
  if (!nameMatch) continue;
  const key = currentModule + '.' + nameMatch[1];
  if (WAIVED[key]) { waivedSeen.push(key); continue; }
  if (!allScreens.includes('.' + nameMatch[1])) {
    failures.push(key + ' is documented as a function but no screen calls it — wire a control, or add a reason to scripts/parity-waivers.json');
  }
}

// 3. A handler that takes arguments is never handed straight to onPress.
for (const [name, src] of Object.entries(screenSources)) {
  for (const m of src.matchAll(/onPress=\{(\w+)\.(\w+)\}/g)) {
    const [, obj, fn] = m;
    if (/^(start|set|seek|save|load|write|select|trigger)[A-Z]/.test(fn)) {
      failures.push(name + ': onPress={' + obj + '.' + fn + '} passes the press event as the first argument — wrap it in an arrow function');
    }
  }
}

if (failures.length) {
  console.error('\nParity check failed with ' + failures.length + ' problem' + (failures.length === 1 ? '' : 's') + ':\n');
  failures.forEach((f) => console.error('  x ' + f));
  console.error('');
  process.exit(1);
}

console.log(
  'Parity check passed: ' + exportedHooks.length + ' exported hooks, each homed on a screen that calls it; ' +
  'every documented action reachable or waived (' + waivedSeen.length + ' waived).',
);
