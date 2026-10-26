const path = require('path');
const mime1 = require(path.resolve(__dirname, '../node_modules/mime/mime.js'));
const mime2 = require(path.resolve(__dirname, '../node_modules/superagent/node_modules/mime/index.js'));

const shim = Object.create(mime1);

// Superagent (mime v2) compatibility
shim.getType = function(p) {
  if (mime2 && typeof mime2.getType === 'function') {
    return mime2.getType(p);
  }
  return mime1.lookup(p);
};

shim.getExtension = function(type) {
  if (mime2 && typeof mime2.getExtension === 'function') {
    return mime2.getExtension(type);
  }
  return mime1.extension(type);
};

// Express (mime v1) compatibility
shim.lookup = function(p, fallback) {
  if (mime1 && typeof mime1.lookup === 'function') {
    return mime1.lookup(p, fallback);
  }
  return mime2.getType(p);
};

shim.extension = function(type) {
  if (mime1 && typeof mime1.extension === 'function') {
    return mime1.extension(type);
  }
  return mime2.getExtension(type);
};

module.exports = shim;
