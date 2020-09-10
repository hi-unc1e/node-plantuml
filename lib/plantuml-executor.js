'use strict'

var childProcess = require('child_process')
var path = require('path')

var INCLUDED_PLANTUML_JAR = path.join(__dirname, '../vendor/plantuml.jar')
var PLANTUML_JAR = process.env.PLANTUML_HOME || INCLUDED_PLANTUML_JAR

// TODO: proper error handling
function execWithSpawn (argv, cwd) {
  cwd = cwd || process.cwd()
  var opts = [
    '-Dplantuml.include.path=' + cwd,
    '-Djava.awt.headless=true',
    '-jar', PLANTUML_JAR
  ].concat(argv)
  return childProcess.spawn('java', opts)
}

module.exports.exec = function (argv, cwd, callback) {
  if (typeof argv === 'function') {
    callback = argv
    argv = undefined
    cwd = undefined
  } else if (typeof cwd === 'function') {
    callback = cwd
    cwd = undefined
  }

  var task = execWithSpawn(argv, cwd)

  if (typeof callback === 'function') {
    var cb

    var timer = setTimeout(function () {
      var err = new Error('generate plantuml timeout after 60s')
      err.argv = argv
      cb && cb(err, null)
    }, 60000)

    cb = function (err, buffer) {
      clearTimeout(timer)
      callback(err, buffer)
      cb = null
      task.kill()
    }

    var chunks = []
    task.stdout.on('data', function (chunk) { chunks.push(chunk) })
    task.stdout.on('end', function () {
      cb && cb(null, Buffer.concat(chunks))
    })
    task.stdout.on('error', function () {
      cb && cb(new Error('error while reading plantuml output'), null)
    })
  }

  return task
}
