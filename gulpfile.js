/*eslint no-process-exit:0 */
'use strict';

var gulp = require('gulp');
var path = require('path');
var parseArgs = require('minimist');
var conf = require('./gulp/config.json');
conf.args = parseArgs(process.argv.slice(2));

// combine all the gulp tasks
require('fs').readdirSync('./gulp').forEach(function(file) {
  if (path.extname(file) === '.js') {
    require('./gulp/' + file)(gulp, conf);
  }
});

gulp.task('default', function() {
  console.log('gulp!');
});

process.on('uncaughtException', function(err) {
  if (err) {
    console.error('Uncaught Exception Error:');
    console.trace(err);
    // notify here
    // process.exit(1); - don't die - kills watch!
  }
});

process.on('exit', function() {
  if (gulp.fail) {
    // return non-zero exit code
    process.exit(1);
  }
});