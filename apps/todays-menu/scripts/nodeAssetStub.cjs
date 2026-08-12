/**
 * Node test preload — stub Metro image requires so HMIE tests can run in tsx.
 */
const Module = require('node:module');
const path = require('node:path');

const originalRequire = Module.prototype.require;

Module.prototype.require = function (id) {
  const resolved = typeof id === 'string' ? id : '';
  const ext = path.extname(resolved).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.gif' || ext === '.webp') {
    return { uri: resolved };
  }
  return originalRequire.apply(this, arguments);
};
