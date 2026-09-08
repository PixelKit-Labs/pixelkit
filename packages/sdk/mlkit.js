// Resolves `@pixelkit-labs/sdk/mlkit` on bundlers that do not honour the "exports" map.
// The canonical entry is declared in package.json; this is the fallback for older Metro.
module.exports = require('./build/mlkit.js');
