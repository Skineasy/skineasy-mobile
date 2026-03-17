const assert = require('node:assert');

/** @type {import('@expo/fingerprint').Config} */
const config = {
  // PackageJsonScriptsAll (1024) | GitIgnore (2048)
  sourceSkips: ['PackageJsonScriptsAll', 'GitIgnore'],
  fileHookTransform: (source, chunk, isEndOfFile) => {
    if (source.type === 'contents' && source.id === 'expoConfig') {
      assert(isEndOfFile, 'contents source is expected to have single chunk.');
      const parsed = JSON.parse(chunk);
      delete parsed.extra;
      return JSON.stringify(parsed);
    }
    return chunk;
  },
};

module.exports = config;
