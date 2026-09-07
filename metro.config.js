/**
 * @file metro.config.js
 * @description Resolves the workspace packages to their TypeScript source during development.
 *
 * The published packages point `main` at `build/`, which is compiled by `npm run build`. The demo
 * app in this repo should not have to rebuild the library to see a change, so Metro is told to
 * resolve the three package names straight to source. Type resolution is handled separately by
 * `paths` in `tsconfig.json`.
 */

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const ALIASES = {
  pixelkit: path.resolve(__dirname, 'packages/pixelkit/src/index.ts'),
  '@pixelkit/native': path.resolve(__dirname, 'packages/native/index.ts'),
  '@pixelkit/mlkit': path.resolve(__dirname, 'packages/mlkit/index.ts'),
};

const upstream = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const aliased = ALIASES[moduleName];
  if (aliased) return { type: 'sourceFile', filePath: aliased };
  return (upstream ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
