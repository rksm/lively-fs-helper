/*global require, module, console, setTimeout*/

var lang = require("lively.lang"),
    fs = require('fs'),
    exec = require('child_process').exec,
    path = require('path');

var tempFiles = [], tempDirs = [];
function registerTempFile(filename) {
  tempFiles.push(filename);
}

function createTempFile(filename, content) {
  fs.writeFileSync(filename, content);
  registerTempFile(filename);
  console.log('created ' + filename);
  return filename;
}

function createTempDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  tempDirs.unshift(dir);
}

function cleanupTempFiles(thenDo) {
  lively.lang.fun.composeAsync(
    function(n) {
      lang.arr.mapAsyncSeries(
        tempFiles,
        function(file, _, n) {
          if (fs.existsSync(file)) fs.unlinkSync(file);
          else console.warn('trying to cleanup file %s but it did not exist', file);
          n();
        }, function(err) { n(err); })
    },
    function(n) {
      lang.arr.mapAsyncSeries(
        tempDirs,
        function(dir, _, n) {
          exec('rm -rf ' + dir, function(code, out, err) { n(); });
        }, function(err) { n(err); });
    },
    function(n) {
      tempFiles = [];
      tempDirs = [];
      n();
    }
  )(thenDo);
}

function createDirStructure(basePath, spec) {
  // spec is an object like
  // {"foo": {"bar.js": "bla"}}
  // will create dir "foo/" and file foo/bar.js with "bla" as content
  for (var name in spec) {
    var p = path.join(basePath, name);
    if (typeof spec[name] === 'string') {
      createTempFile(p, spec[name]);
      continue;
    }
    if (typeof spec[name] === 'object') {
      createTempDir(p);
      createDirStructure(p, spec[name]);
      continue;
    }
  }
}

module.exports = {
  registerTempFile: registerTempFile,
  createTempFile: createTempFile,
  cleanupTempFiles: cleanupTempFiles,
  createDirStructure: createDirStructure,
}
